"""
Enhanced Authentication System for UREVENT 360
Implementing comprehensive login improvements as requested:

1. Centralized Authentication (One Login System for All Models)
2. Enhanced Session & Token Management (JWT + Refresh Tokens)
3. Advanced Error Handling & Retry Logic
4. Monitoring & Logging
5. Security Enhancements (Rate Limiting, 2FA Ready)
6. UX Improvements (Remember Me, Role Switching)
"""

from fastapi import HTTPException, Depends, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import os
import bcrypt
import jwt
import uuid
import json
import time
from collections import defaultdict
import asyncio
import pyotp
import qrcode
import io
import base64

# Enhanced Configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")
REFRESH_SECRET_KEY = os.environ.get("REFRESH_SECRET_KEY", "your-refresh-secret-key")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_EXPIRE_MINUTES = 30  # Shorter for security
JWT_REFRESH_EXPIRE_DAYS = 7  # Refresh token lasts 7 days
JWT_REMEMBER_ME_DAYS = 30  # Remember me extends to 30 days

# Rate limiting storage (in production, use Redis)
login_attempts = defaultdict(list)
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION = 300  # 5 minutes

# Security
security = HTTPBearer()

# Enhanced Models
class EnhancedUserLogin(BaseModel):
    email: str
    password: str
    remember_me: Optional[bool] = False
    two_factor_code: Optional[str] = None

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TwoFactorSetup(BaseModel):
    enabled: bool
    secret: Optional[str] = None
    qr_code: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    retry_after: Optional[int] = None

# Authentication Service Class
class EnhancedAuthService:
    def __init__(self, db):
        self.db = db
        
    async def check_rate_limit(self, email: str, ip_address: str) -> bool:
        """Check if user/IP is rate limited"""
        current_time = time.time()
        
        # Clean old attempts
        cutoff_time = current_time - LOCKOUT_DURATION
        login_attempts[email] = [attempt for attempt in login_attempts[email] if attempt > cutoff_time]
        login_attempts[ip_address] = [attempt for attempt in login_attempts[ip_address] if attempt > cutoff_time]
        
        # Check if rate limited
        if len(login_attempts[email]) >= MAX_LOGIN_ATTEMPTS or len(login_attempts[ip_address]) >= MAX_LOGIN_ATTEMPTS:
            return False
        return True
    
    def record_failed_attempt(self, email: str, ip_address: str):
        """Record a failed login attempt"""
        current_time = time.time()
        login_attempts[email].append(current_time)
        login_attempts[ip_address].append(current_time)
    
    def create_access_token(self, user_data: dict, remember_me: bool = False) -> str:
        """Create JWT access token"""
        expire_time = timedelta(days=JWT_REMEMBER_ME_DAYS) if remember_me else timedelta(minutes=JWT_ACCESS_EXPIRE_MINUTES)
        
        payload = {
            "sub": user_data["email"],
            "user_id": user_data["id"],
            "role": user_data.get("role", "client"),
            "name": user_data.get("name", ""),
            "exp": datetime.utcnow() + expire_time,
            "iat": datetime.utcnow(),
            "type": "access"
        }
        return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    def create_refresh_token(self, user_data: dict) -> str:
        """Create JWT refresh token"""
        payload = {
            "sub": user_data["email"],
            "user_id": user_data["id"],
            "exp": datetime.utcnow() + timedelta(days=JWT_REFRESH_EXPIRE_DAYS),
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        return jwt.encode(payload, REFRESH_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    def verify_token(self, token: str, token_type: str = "access") -> dict:
        """Verify and decode JWT token - Compatible with basic auth system"""
        try:
            # Use the same secret key and algorithm as the basic auth system
            secret_key = REFRESH_SECRET_KEY if token_type == "refresh" else SECRET_KEY
            payload = jwt.decode(token, secret_key, algorithms=[JWT_ALGORITHM])
            
            # Handle both enhanced and basic token formats
            if token_type == "refresh" and payload.get("type") != "refresh":
                raise jwt.InvalidTokenError("Invalid refresh token")
            
            # For access tokens, be flexible about the "type" field for compatibility
            if token_type == "access" and "type" in payload and payload.get("type") != "access":
                # If type is specified but wrong, reject
                raise jwt.InvalidTokenError("Invalid access token type")
            
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired. Please login again.")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token. Please login again.")
    
    async def get_user_roles(self, user_id: str) -> List[str]:
        """Get all roles for a user (supports multi-role users)"""
        user = await self.db.users.find_one({"id": user_id})
        if not user:
            return []
        
        roles = [user.get("role", "client")]
        
        # Check for additional roles
        if user.get("admin_level"):
            roles.append("admin")
        
        # Check if user is also a vendor
        vendor = await self.db.vendors.find_one({"email": user["email"]})
        if vendor:
            roles.append("vendor")
        
        # Check if user is also an employee
        if user.get("employee_id"):
            roles.append("employee")
        
        return list(set(roles))  # Remove duplicates
    
    async def setup_two_factor(self, user_id: str) -> TwoFactorSetup:
        """Setup 2FA for a user"""
        user = await self.db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Generate secret
        secret = pyotp.random_base32()
        
        # Create QR code
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user["email"],
            issuer_name="UREVENT 360"
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        # Store secret (encrypted in production)
        await self.db.users.update_one(
            {"id": user_id},
            {"$set": {"two_factor_secret": secret, "two_factor_enabled": False}}
        )
        
        return TwoFactorSetup(
            enabled=False,
            secret=secret,
            qr_code=f"data:image/png;base64,{qr_code_base64}"
        )
    
    def verify_two_factor(self, secret: str, code: str) -> bool:
        """Verify 2FA code"""
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=1)  # Allow 1 window of tolerance
    
    async def centralized_login(self, login_data: EnhancedUserLogin, ip_address: str) -> AuthResponse:
        """
        Centralized authentication for all user roles
        Returns unified response with proper error handling
        """
        try:
            # Rate limiting check
            if not await self.check_rate_limit(login_data.email, ip_address):
                return AuthResponse(
                    success=False,
                    message="Too many failed attempts. Please try again in 5 minutes.",
                    retry_after=300
                )
            
            # Find user
            user = await self.db.users.find_one({"email": login_data.email})
            if not user:
                self.record_failed_attempt(login_data.email, ip_address)
                return AuthResponse(
                    success=False,
                    message="Invalid email or password. Please check your credentials."
                )
            
            # Verify password
            if not bcrypt.checkpw(login_data.password.encode('utf-8'), user["password_hash"].encode('utf-8')):
                self.record_failed_attempt(login_data.email, ip_address)
                return AuthResponse(
                    success=False,
                    message="Invalid email or password. Please check your credentials."
                )
            
            # Check 2FA if enabled
            if user.get("two_factor_enabled") and login_data.two_factor_code:
                if not self.verify_two_factor(user["two_factor_secret"], login_data.two_factor_code):
                    self.record_failed_attempt(login_data.email, ip_address)
                    return AuthResponse(
                        success=False,
                        message="Invalid two-factor authentication code."
                    )
            elif user.get("two_factor_enabled") and not login_data.two_factor_code:
                return AuthResponse(
                    success=False,
                    message="Two-factor authentication code required.",
                    data={"requires_2fa": True}
                )
            
            # Get all user roles
            user_roles = await self.get_user_roles(user["id"])
            
            # Create tokens
            access_token = self.create_access_token(user, login_data.remember_me)
            refresh_token = self.create_refresh_token(user)
            
            # Store refresh token (for rotation)
            refresh_token_data = {
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "refresh_token": refresh_token,
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(days=JWT_REFRESH_EXPIRE_DAYS),
                "ip_address": ip_address
            }
            await self.db.refresh_tokens.insert_one(refresh_token_data)
            
            # Log successful login
            await self.log_authentication_event(user["id"], "login_success", ip_address, {
                "roles": user_roles,
                "remember_me": login_data.remember_me
            })
            
            expires_in = (JWT_REMEMBER_ME_DAYS * 24 * 60 * 60) if login_data.remember_me else (JWT_ACCESS_EXPIRE_MINUTES * 60)
            
            return AuthResponse(
                success=True,
                message="Login successful",
                data={
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer",
                    "expires_in": expires_in,
                    "user": {
                        "id": user["id"],
                        "name": user["name"],
                        "email": user["email"],
                        "role": user.get("role", "client"),
                        "available_roles": user_roles,
                        "two_factor_enabled": user.get("two_factor_enabled", False)
                    }
                }
            )
            
        except Exception as e:
            # Log error for monitoring
            await self.log_authentication_event(
                user_id=login_data.email,
                event_type="login_error", 
                ip_address=ip_address,
                metadata={"error": str(e)}
            )
            
            return AuthResponse(
                success=False,
                message="Login temporarily unavailable. Please try again in 30 seconds.",
                retry_after=30
            )
    
    async def refresh_access_token(self, refresh_token: str, ip_address: str) -> AuthResponse:
        """Refresh access token using refresh token"""
        try:
            # Verify refresh token
            payload = self.verify_token(refresh_token, "refresh")
            
            # Check if refresh token exists in database
            stored_token = await self.db.refresh_tokens.find_one({
                "refresh_token": refresh_token,
                "expires_at": {"$gt": datetime.utcnow()}
            })
            
            if not stored_token:
                return AuthResponse(
                    success=False,
                    message="Invalid or expired refresh token. Please login again."
                )
            
            # Get user
            user = await self.db.users.find_one({"id": payload["user_id"]})
            if not user:
                return AuthResponse(
                    success=False,
                    message="User not found. Please login again."
                )
            
            # Create new access token
            access_token = self.create_access_token(user)
            
            return AuthResponse(
                success=True,
                message="Token refreshed successfully",
                data={
                    "access_token": access_token,
                    "token_type": "bearer",
                    "expires_in": JWT_ACCESS_EXPIRE_MINUTES * 60
                }
            )
            
        except Exception as e:
            return AuthResponse(
                success=False,
                message="Token refresh failed. Please login again."
            )
    
    async def logout(self, user_id: str, refresh_token: str = None):
        """Logout user and invalidate tokens"""
        if refresh_token:
            # Remove specific refresh token
            await self.db.refresh_tokens.delete_one({"refresh_token": refresh_token})
        else:
            # Remove all refresh tokens for user
            await self.db.refresh_tokens.delete_many({"user_id": user_id})
        
        await self.log_authentication_event(user_id, "logout", metadata={"logout_type": "manual"})
    
    async def switch_role(self, user_id: str, new_role: str) -> AuthResponse:
        """Switch user role (for multi-role users)"""
        user_roles = await self.get_user_roles(user_id)
        
        if new_role not in user_roles:
            return AuthResponse(
                success=False,
                message=f"You don't have access to {new_role} role."
            )
        
        # Update user's active role
        await self.db.users.update_one(
            {"id": user_id},
            {"$set": {"active_role": new_role}}
        )
        
        return AuthResponse(
            success=True,
            message=f"Switched to {new_role} role successfully",
            data={"new_role": new_role}
        )
    
    async def log_authentication_event(self, user_id: str, event_type: str, ip_address: str = None, metadata: dict = None):
        """Log authentication events for monitoring"""
        log_entry = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "event_type": event_type,  # login_success, login_failed, logout, token_refresh, etc.
            "ip_address": ip_address,
            "timestamp": datetime.utcnow(),
            "metadata": metadata or {}
        }
        
        await self.db.auth_logs.insert_one(log_entry)
    
    async def get_auth_stats(self, hours: int = 24) -> dict:
        """Get authentication statistics for monitoring"""
        since = datetime.utcnow() - timedelta(hours=hours)
        
        pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},
            {"$group": {
                "_id": "$event_type",
                "count": {"$sum": 1}
            }}
        ]
        
        stats = {}
        async for result in self.db.auth_logs.aggregate(pipeline):
            stats[result["_id"]] = result["count"]
        
        return {
            "timeframe_hours": hours,
            "login_successes": stats.get("login_success", 0),
            "login_failures": stats.get("login_failed", 0),
            "token_refreshes": stats.get("token_refresh", 0),
            "logouts": stats.get("logout", 0),
            "success_rate": round((stats.get("login_success", 0) / max(stats.get("login_success", 0) + stats.get("login_failed", 0), 1)) * 100, 2)
        }

# Enhanced dependency for getting current user
async def get_enhanced_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: EnhancedAuthService = None
):
    """Enhanced get current user with better error handling"""
    if not auth_service:
        # This will be injected in the actual routes
        return None
        
    try:
        token = credentials.credentials
        payload = auth_service.verify_token(token, "access")
        
        user = await auth_service.db.users.find_one({"email": payload["sub"]})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found. Please login again.")
        
        # Add available roles to user object
        user["available_roles"] = await auth_service.get_user_roles(user["id"])
        user["_id"] = str(user["_id"])  # Convert ObjectId to string
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed. Please login again.")

# Utility function to get client IP
def get_client_ip(request: Request) -> str:
    """Get client IP address with proxy support"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    return request.client.host if request.client else "unknown"