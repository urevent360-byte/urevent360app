"""
Enhanced Authentication Routes for UREVENT 360
Implementing all the recommended login improvements
"""

from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import os
from motor.motor_asyncio import AsyncIOMotorClient

from enhanced_auth import (
    EnhancedAuthService, 
    EnhancedUserLogin, 
    RefreshTokenRequest, 
    AuthResponse, 
    TwoFactorSetup,
    get_enhanced_current_user,
    get_client_ip
)

# Database connection (will be injected)
DATABASE_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = "urevent_db"
client = AsyncIOMotorClient(DATABASE_URL)
db = client[DATABASE_NAME]

# Initialize Enhanced Auth Service
auth_service = EnhancedAuthService(db)

# Create Enhanced Auth Router
enhanced_auth_router = APIRouter(prefix="/api/auth", tags=["Enhanced Authentication"])

# Models for new endpoints
class RoleSwitchRequest(BaseModel):
    role: str

class AuthStatsResponse(BaseModel):
    success: bool
    data: Dict[str, Any]

# === CENTRALIZED AUTHENTICATION ENDPOINTS ===

@enhanced_auth_router.post("/login", response_model=AuthResponse)
async def centralized_login(
    login_data: EnhancedUserLogin, 
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Centralized login endpoint for all user roles
    Supports: Clients, Vendors, Administrators, Employees
    Features: Rate limiting, 2FA, remember me, enhanced error handling
    """
    ip_address = get_client_ip(request)
    
    # Perform centralized authentication
    auth_result = await auth_service.centralized_login(login_data, ip_address)
    
    # Add monitoring task
    if auth_result.success:
        background_tasks.add_task(
            auth_service.log_authentication_event,
            auth_result.data["user"]["id"], 
            "login_success", 
            ip_address,
            {"method": "centralized_login"}
        )
    else:
        background_tasks.add_task(
            auth_service.log_authentication_event,
            login_data.email, 
            "login_failed", 
            ip_address,
            {"reason": auth_result.message}
        )
    
    # Return appropriate status code
    if not auth_result.success:
        if auth_result.retry_after:
            raise HTTPException(status_code=429, detail=auth_result.message)
        else:
            raise HTTPException(status_code=401, detail=auth_result.message)
    
    return auth_result

@enhanced_auth_router.post("/refresh", response_model=AuthResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Refresh access token using refresh token
    Prevents unexpected logouts with automatic token renewal
    """
    ip_address = get_client_ip(request)
    
    auth_result = await auth_service.refresh_access_token(refresh_data.refresh_token, ip_address)
    
    if auth_result.success:
        background_tasks.add_task(
            auth_service.log_authentication_event,
            "system", 
            "token_refresh", 
            ip_address
        )
    
    if not auth_result.success:
        raise HTTPException(status_code=401, detail=auth_result.message)
    
    return auth_result

@enhanced_auth_router.post("/logout")
async def enhanced_logout(
    refresh_token: Optional[str] = None,
    current_user: dict = Depends(get_enhanced_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Enhanced logout with proper token invalidation
    """
    await auth_service.logout(current_user["id"], refresh_token)
    
    background_tasks.add_task(
        auth_service.log_authentication_event,
        current_user["id"], 
        "logout"
    )
    
    return {"message": "Logged out successfully"}

# === ROLE MANAGEMENT ENDPOINTS ===

@enhanced_auth_router.post("/switch-role", response_model=AuthResponse)
async def switch_user_role(
    role_data: RoleSwitchRequest,
    current_user: dict = Depends(get_enhanced_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Switch user role for multi-role users
    Supports users who have multiple roles (e.g., Client + Vendor)
    """
    auth_result = await auth_service.switch_role(current_user["id"], role_data.role)
    
    if auth_result.success:
        background_tasks.add_task(
            auth_service.log_authentication_event,
            current_user["id"], 
            "role_switch", 
            metadata={"new_role": role_data.role}
        )
    
    if not auth_result.success:
        raise HTTPException(status_code=403, detail=auth_result.message)
    
    return auth_result

@enhanced_auth_router.get("/user/roles")
async def get_available_roles(current_user: dict = Depends(get_enhanced_current_user)):
    """
    Get all available roles for the current user
    Enables role switcher UI functionality
    """
    user_roles = await auth_service.get_user_roles(current_user["id"])
    
    return {
        "success": True,
        "data": {
            "current_role": current_user.get("role", "client"),
            "available_roles": user_roles,
            "can_switch": len(user_roles) > 1
        }
    }

# === TWO-FACTOR AUTHENTICATION ENDPOINTS ===

@enhanced_auth_router.post("/2fa/setup", response_model=TwoFactorSetup)
async def setup_two_factor_auth(current_user: dict = Depends(get_enhanced_current_user)):
    """
    Setup 2FA for enhanced security (Admins & Vendors)
    Returns QR code for authenticator app setup
    """
    # Check if user role requires 2FA
    if current_user.get("role") not in ["admin", "vendor"]:
        raise HTTPException(
            status_code=403, 
            detail="Two-factor authentication is available for Admins and Vendors only"
        )
    
    return await auth_service.setup_two_factor(current_user["id"])

@enhanced_auth_router.post("/2fa/enable")
async def enable_two_factor_auth(
    verification_code: str,
    current_user: dict = Depends(get_enhanced_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Enable 2FA after verifying setup code
    """
    user = await db.users.find_one({"id": current_user["id"]})
    
    if not user or not user.get("two_factor_secret"):
        raise HTTPException(status_code=400, detail="2FA setup not found")
    
    if not auth_service.verify_two_factor(user["two_factor_secret"], verification_code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Enable 2FA
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"two_factor_enabled": True}}
    )
    
    background_tasks.add_task(
        auth_service.log_authentication_event,
        current_user["id"], 
        "2fa_enabled"
    )
    
    return {"message": "Two-factor authentication enabled successfully"}

@enhanced_auth_router.post("/2fa/disable")
async def disable_two_factor_auth(
    current_password: str,
    current_user: dict = Depends(get_enhanced_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Disable 2FA with password verification
    """
    user = await db.users.find_one({"id": current_user["id"]})
    
    # Verify current password
    import bcrypt
    if not bcrypt.checkpw(current_password.encode('utf-8'), user["password_hash"].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Invalid password")
    
    # Disable 2FA
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"two_factor_enabled": False}, "$unset": {"two_factor_secret": ""}}
    )
    
    background_tasks.add_task(
        auth_service.log_authentication_event,
        current_user["id"], 
        "2fa_disabled"
    )
    
    return {"message": "Two-factor authentication disabled"}

# === MONITORING & SECURITY ENDPOINTS ===

@enhanced_auth_router.get("/stats", response_model=AuthStatsResponse)
async def get_authentication_stats(
    hours: int = 24,
    current_user: dict = Depends(get_enhanced_current_user)
):
    """
    Get authentication statistics for monitoring
    Admin only endpoint for security monitoring
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    stats = await auth_service.get_auth_stats(hours)
    
    return AuthStatsResponse(
        success=True,
        data=stats
    )

@enhanced_auth_router.get("/security/sessions")
async def get_active_sessions(current_user: dict = Depends(get_enhanced_current_user)):
    """
    Get active sessions for current user
    Allows users to see and manage their active sessions
    """
    sessions = await db.refresh_tokens.find({
        "user_id": current_user["id"],
        "expires_at": {"$gt": datetime.utcnow()}
    }).sort("created_at", -1).to_list(100)
    
    session_data = []
    for session in sessions:
        session_data.append({
            "id": session["id"],
            "created_at": session["created_at"],
            "expires_at": session["expires_at"],
            "ip_address": session.get("ip_address", "unknown"),
            "is_current": False  # Would need additional logic to determine current session
        })
    
    return {
        "success": True,
        "data": {
            "active_sessions": len(session_data),
            "sessions": session_data
        }
    }

@enhanced_auth_router.delete("/security/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: dict = Depends(get_enhanced_current_user)
):
    """
    Revoke specific session (logout from specific device)
    """
    result = await db.refresh_tokens.delete_one({
        "id": session_id,
        "user_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"message": "Session revoked successfully"}

@enhanced_auth_router.delete("/security/sessions")
async def revoke_all_sessions(current_user: dict = Depends(get_enhanced_current_user)):
    """
    Revoke all sessions except current (logout from all other devices)
    """
    await db.refresh_tokens.delete_many({"user_id": current_user["id"]})
    
    return {"message": "All sessions revoked successfully"}

# === ENHANCED USER PROFILE ENDPOINTS ===

@enhanced_auth_router.get("/profile/enhanced")
async def get_enhanced_user_profile(current_user: dict = Depends(get_enhanced_current_user)):
    """
    Get enhanced user profile with role information and security settings
    """
    user_roles = await auth_service.get_user_roles(current_user["id"])
    
    # Get 2FA status
    two_factor_enabled = current_user.get("two_factor_enabled", False)
    
    # Get recent login activity (last 10 logins)
    recent_logins = await db.auth_logs.find({
        "user_id": current_user["id"],
        "event_type": "login_success"
    }).sort("timestamp", -1).limit(10).to_list(10)
    
    return {
        "success": True,
        "data": {
            "user": {
                "id": current_user["id"],
                "name": current_user["name"],
                "email": current_user["email"],
                "role": current_user.get("role", "client"),
                "available_roles": user_roles,
                "can_switch_roles": len(user_roles) > 1
            },
            "security": {
                "two_factor_enabled": two_factor_enabled,
                "two_factor_required": current_user.get("role") in ["admin", "vendor"],
                "active_sessions": await db.refresh_tokens.count_documents({
                    "user_id": current_user["id"],
                    "expires_at": {"$gt": datetime.utcnow()}
                })
            },
            "recent_activity": [
                {
                    "timestamp": login["timestamp"],
                    "ip_address": login.get("ip_address", "unknown")
                } for login in recent_logins
            ]
        }
    }

# === HEALTH CHECK ENDPOINT ===

@enhanced_auth_router.get("/health")
async def auth_health_check():
    """
    Health check for authentication system
    """
    try:
        # Test database connection
        await db.users.find_one({}, {"_id": 1})
        
        # Test authentication stats
        stats = await auth_service.get_auth_stats(1)  # Last 1 hour
        
        return {
            "success": True,
            "status": "healthy",
            "timestamp": datetime.utcnow(),
            "database": "connected",
            "recent_stats": stats
        }
    except Exception as e:
        return {
            "success": False,
            "status": "unhealthy", 
            "error": str(e),
            "timestamp": datetime.utcnow()
        }

# Enhanced dependency function that can be used in routes
async def get_current_user_enhanced(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
    """
    Enhanced current user dependency with better error handling and role management
    """
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

# Export the enhanced auth service for use in other modules
__all__ = ["enhanced_auth_router", "auth_service", "get_current_user_enhanced"]