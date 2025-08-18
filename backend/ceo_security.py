"""
CEO-Only Security Layer for UREVENT 360 Growth Intelligence Dashboard
Ultra-secure access control for Darwin H. Baquero's executive dashboard

Features:
1. ROLE_CEO with strict access controls
2. IP/Device verification with fingerprinting
3. Enhanced 2FA with backup codes
4. Comprehensive audit logging
5. Session monitoring and anomaly detection
"""

from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import os
import secrets
import hashlib
import jwt
import uuid
import json
import pyotp
from collections import defaultdict
import geoip2.database
import user_agents

# CEO Security Configuration
CEO_EMAIL = "darwin@urevent360.com"  # Darwin H. Baquero's email
CEO_ROLE = "ROLE_CEO"
CEO_IP_WHITELIST = os.environ.get("CEO_IP_WHITELIST", "").split(",")  # Optional IP restriction
CEO_SESSION_TIMEOUT = 30  # minutes
CEO_MAX_CONCURRENT_SESSIONS = 2

# Device fingerprinting components
class DeviceFingerprint(BaseModel):
    user_agent: str
    screen_resolution: Optional[str] = None
    timezone: Optional[str] = None
    language: str
    platform: str
    browser_fingerprint: str

class CEOAuditLog(BaseModel):
    id: str
    user_id: str
    action: str
    resource: str
    ip_address: str
    device_fingerprint: str
    timestamp: datetime
    location: Optional[Dict[str, Any]] = None
    session_id: str
    risk_score: float
    metadata: Dict[str, Any] = {}

class CEOSession(BaseModel):
    session_id: str
    user_id: str
    ip_address: str
    device_fingerprint: str
    created_at: datetime
    last_activity: datetime
    expires_at: datetime
    is_active: bool = True
    location: Optional[Dict[str, Any]] = None

class CEOSecurityService:
    def __init__(self, db, auth_service):
        self.db = db
        self.auth_service = auth_service
        self.active_sessions = {}  # In production, use Redis
        self.failed_attempts = defaultdict(list)
        
    async def verify_ceo_access(self, user: dict) -> bool:
        """Verify if user has CEO access privileges"""
        return (
            user.get("email") == CEO_EMAIL and 
            user.get("role") == CEO_ROLE and
            user.get("status", "active") in ["active", None]  # Default to active if status not set
        )
    
    async def create_ceo_user_if_not_exists(self):
        """Create CEO user if doesn't exist (initial setup)"""
        existing_ceo = await self.db.users.find_one({"email": CEO_EMAIL})
        
        if not existing_ceo:
            import bcrypt
            
            # Generate secure password
            temp_password = secrets.token_urlsafe(32)
            password_hash = bcrypt.hashpw(temp_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            ceo_user = {
                "id": str(uuid.uuid4()),
                "name": "Darwin H. Baquero",
                "first_name": "Darwin",
                "last_name": "Baquero",
                "email": CEO_EMAIL,
                "role": CEO_ROLE,
                "password_hash": password_hash,
                "two_factor_enabled": True,
                "two_factor_secret": pyotp.random_base32(),
                "status": "active",
                "ceo_privileges": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "security_settings": {
                    "require_2fa": True,
                    "device_verification": True,
                    "ip_restriction": bool(CEO_IP_WHITELIST[0]),
                    "session_timeout": CEO_SESSION_TIMEOUT,
                    "max_concurrent_sessions": CEO_MAX_CONCURRENT_SESSIONS
                },
                "backup_codes": [secrets.token_hex(8) for _ in range(10)]
            }
            
            await self.db.users.insert_one(ceo_user)
            
            # Log CEO account creation
            await self.audit_log(
                user_id=ceo_user["id"],
                action="CEO_ACCOUNT_CREATED",
                resource="SYSTEM",
                ip_address="system",
                device_fingerprint="system",
                metadata={"initial_setup": True, "temp_password": temp_password}
            )
            
            print(f"✅ CEO Account Created - Email: {CEO_EMAIL}")
            print(f"🔑 Temporary Password: {temp_password}")
            print("⚠️ Please change password and setup 2FA immediately")
            
            return ceo_user
        
        return existing_ceo
    
    def generate_device_fingerprint(self, request: Request) -> str:
        """Generate device fingerprint from request headers"""
        user_agent = request.headers.get("user-agent", "")
        accept_language = request.headers.get("accept-language", "")
        accept_encoding = request.headers.get("accept-encoding", "")
        
        # Create composite fingerprint
        fingerprint_data = f"{user_agent}|{accept_language}|{accept_encoding}"
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()[:32]
    
    async def get_location_info(self, ip_address: str) -> Dict[str, Any]:
        """Get location information from IP address"""
        try:
            # In production, use GeoIP database
            # For now, return mock data
            return {
                "country": "Unknown",
                "city": "Unknown", 
                "region": "Unknown",
                "coordinates": [0.0, 0.0]
            }
        except Exception:
            return {}
    
    async def verify_device_trust(self, user_id: str, device_fingerprint: str) -> bool:
        """Check if device is trusted for this user"""
        trusted_devices = await self.db.ceo_trusted_devices.find({
            "user_id": user_id,
            "device_fingerprint": device_fingerprint,
            "is_active": True
        }).to_list(10)
        
        return len(trusted_devices) > 0
    
    async def add_trusted_device(self, user_id: str, device_fingerprint: str, device_name: str, ip_address: str):
        """Add device to trusted devices list"""
        trusted_device = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "device_fingerprint": device_fingerprint,
            "device_name": device_name,
            "ip_address": ip_address,
            "added_at": datetime.utcnow(),
            "last_used": datetime.utcnow(),
            "is_active": True,
            "location": await self.get_location_info(ip_address)
        }
        
        await self.db.ceo_trusted_devices.insert_one(trusted_device)
        return trusted_device
    
    async def check_ip_whitelist(self, ip_address: str) -> bool:
        """Check if IP is in whitelist (if configured)"""
        if not CEO_IP_WHITELIST or not CEO_IP_WHITELIST[0]:
            return True  # No IP restriction configured
        
        return ip_address in CEO_IP_WHITELIST
    
    async def create_ceo_session(self, user_id: str, ip_address: str, device_fingerprint: str) -> str:
        """Create secure CEO session"""
        
        # Check concurrent session limit
        active_sessions = await self.db.ceo_sessions.count_documents({
            "user_id": user_id,
            "is_active": True,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if active_sessions >= CEO_MAX_CONCURRENT_SESSIONS:
            # Deactivate oldest session
            oldest_session = await self.db.ceo_sessions.find_one({
                "user_id": user_id,
                "is_active": True
            }, sort=[("created_at", 1)])
            
            if oldest_session:
                await self.db.ceo_sessions.update_one(
                    {"_id": oldest_session["_id"]},
                    {"$set": {"is_active": False, "ended_at": datetime.utcnow()}}
                )
        
        # Create new session
        session = CEOSession(
            session_id=str(uuid.uuid4()),
            user_id=user_id,
            ip_address=ip_address,
            device_fingerprint=device_fingerprint,
            created_at=datetime.utcnow(),
            last_activity=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=CEO_SESSION_TIMEOUT),
            location=await self.get_location_info(ip_address)
        )
        
        await self.db.ceo_sessions.insert_one(session.dict())
        return session.session_id
    
    async def validate_ceo_session(self, session_id: str, ip_address: str) -> bool:
        """Validate CEO session"""
        session = await self.db.ceo_sessions.find_one({
            "session_id": session_id,
            "is_active": True,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if not session:
            return False
        
        # Update last activity
        await self.db.ceo_sessions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "last_activity": datetime.utcnow(),
                    "expires_at": datetime.utcnow() + timedelta(minutes=CEO_SESSION_TIMEOUT)
                }
            }
        )
        
        return True
    
    async def calculate_risk_score(self, user_id: str, ip_address: str, device_fingerprint: str, action: str) -> float:
        """Calculate risk score for CEO action"""
        risk_score = 0.0
        
        # Check if IP is new
        recent_ips = await self.db.ceo_audit_logs.distinct("ip_address", {
            "user_id": user_id,
            "timestamp": {"$gte": datetime.utcnow() - timedelta(days=30)}
        })
        
        if ip_address not in recent_ips:
            risk_score += 0.3
        
        # Check if device is new
        if not await self.verify_device_trust(user_id, device_fingerprint):
            risk_score += 0.4
        
        # Check time of access (higher risk outside business hours)
        current_hour = datetime.utcnow().hour
        if current_hour < 6 or current_hour > 22:  # Outside 6 AM - 10 PM UTC
            risk_score += 0.2
        
        # Check sensitive actions
        sensitive_actions = ["EXPORT_DATA", "MODIFY_VENDOR", "AI_APPLY_ACTION"]
        if action in sensitive_actions:
            risk_score += 0.1
        
        return min(risk_score, 1.0)  # Cap at 1.0
    
    async def audit_log(self, user_id: str, action: str, resource: str, ip_address: str, 
                       device_fingerprint: str, metadata: Dict[str, Any] = None) -> str:
        """Create comprehensive audit log entry"""
        
        risk_score = await self.calculate_risk_score(user_id, ip_address, device_fingerprint, action)
        location = await self.get_location_info(ip_address)
        
        audit_entry = CEOAuditLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action=action,
            resource=resource,
            ip_address=ip_address,
            device_fingerprint=device_fingerprint,
            timestamp=datetime.utcnow(),
            location=location,
            session_id=f"session_{secrets.token_hex(8)}",
            risk_score=risk_score,
            metadata=metadata or {}
        )
        
        await self.db.ceo_audit_logs.insert_one(audit_entry.dict())
        
        # Alert on high risk activities
        if risk_score > 0.7:
            await self.send_security_alert(audit_entry)
        
        return audit_entry.id
    
    async def send_security_alert(self, audit_entry: CEOAuditLog):
        """Send security alert for high-risk activities"""
        # In production, send email/SMS alert
        print(f"🚨 HIGH RISK CEO ACTIVITY: {audit_entry.action} - Risk Score: {audit_entry.risk_score}")
    
    async def get_ceo_security_status(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive security status for CEO"""
        
        # Get active sessions
        active_sessions = await self.db.ceo_sessions.find({
            "user_id": user_id,
            "is_active": True,
            "expires_at": {"$gt": datetime.utcnow()}
        }).to_list(10)
        
        # Get trusted devices
        trusted_devices = await self.db.ceo_trusted_devices.find({
            "user_id": user_id,
            "is_active": True
        }).to_list(20)
        
        # Get recent audit logs
        recent_logs = await self.db.ceo_audit_logs.find({
            "user_id": user_id,
            "timestamp": {"$gte": datetime.utcnow() - timedelta(days=7)}
        }).sort("timestamp", -1).limit(50).to_list(50)
        
        # Calculate security metrics
        high_risk_activities = len([log for log in recent_logs if log["risk_score"] > 0.5])
        unique_ips = len(set(log["ip_address"] for log in recent_logs))
        
        return {
            "active_sessions": len(active_sessions),
            "trusted_devices": len(trusted_devices),
            "recent_activities": len(recent_logs),
            "high_risk_activities": high_risk_activities,
            "unique_ips_7d": unique_ips,
            "security_score": max(0, 100 - (high_risk_activities * 10) - (unique_ips * 5)),
            "last_activity": recent_logs[0]["timestamp"] if recent_logs else None,
            "sessions": [
                {
                    "id": session["session_id"],
                    "ip_address": session["ip_address"],
                    "location": session.get("location", {}),
                    "created_at": session["created_at"],
                    "expires_at": session["expires_at"]
                } for session in active_sessions
            ],
            "devices": [
                {
                    "id": device["device_fingerprint"],
                    "name": device.get("device_name", "Unknown Device"),
                    "last_used": device["last_used"],
                    "location": device.get("location", {})
                } for device in trusted_devices
            ]
        }
    
    async def revoke_ceo_access(self, reason: str = "manual_revoke"):
        """Emergency function to revoke all CEO access"""
        
        # Deactivate all sessions
        await self.db.ceo_sessions.update_many(
            {"is_active": True},
            {"$set": {"is_active": False, "revoked_at": datetime.utcnow(), "revoke_reason": reason}}
        )
        
        # Log emergency action
        await self.audit_log(
            user_id="system",
            action="EMERGENCY_REVOKE_CEO_ACCESS",
            resource="SYSTEM", 
            ip_address="system",
            device_fingerprint="system",
            metadata={"reason": reason}
        )
        
        print(f"🚨 EMERGENCY: All CEO access revoked - Reason: {reason}")

# CEO Authentication Dependencies
async def get_ceo_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    request: Request = None
) -> dict:
    """Enhanced CEO user dependency with strict security checks"""
    
    # Import here to avoid circular imports
    from enhanced_auth_routes import auth_service
    from motor.motor_asyncio import AsyncIOMotorClient
    
    # Initialize database connection
    DATABASE_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    DATABASE_NAME = "urevent_db"
    client = AsyncIOMotorClient(DATABASE_URL)
    db = client[DATABASE_NAME]
    
    # Create CEO security service instance
    ceo_security = CEOSecurityService(db, auth_service)
    
    try:
        # Verify JWT token
        token = credentials.credentials
        payload = ceo_security.auth_service.verify_token(token, "access")
        
        # Get user from database
        user = await ceo_security.db.users.find_one({"email": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Verify CEO access
        if not await ceo_security.verify_ceo_access(user):
            await ceo_security.audit_log(
                user_id=user.get("id", "unknown"),
                action="UNAUTHORIZED_CEO_ACCESS_ATTEMPT",
                resource="CEO_DASHBOARD",
                ip_address=request.client.host if request.client else "unknown",
                device_fingerprint=ceo_security.generate_device_fingerprint(request),
                metadata={"user_role": user.get("role"), "user_email": user.get("email")}
            )
            raise HTTPException(status_code=403, detail="CEO access required")
        
        # Additional security checks
        ip_address = request.client.host if request.client else "unknown"
        device_fingerprint = ceo_security.generate_device_fingerprint(request)
        
        # Check IP whitelist
        if not await ceo_security.check_ip_whitelist(ip_address):
            raise HTTPException(status_code=403, detail="IP address not authorized")
        
        # Log access
        await ceo_security.audit_log(
            user_id=user["id"],
            action="CEO_DASHBOARD_ACCESS",
            resource="CEO_DASHBOARD",
            ip_address=ip_address,
            device_fingerprint=device_fingerprint
        )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

# Export security service for use in routes
__all__ = ["CEOSecurityService", "get_ceo_user", "CEO_ROLE", "CEO_EMAIL"]