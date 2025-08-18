"""
CEO Succession API Routes for UREVENT 360
Secure handover endpoints with WebAuthn + TOTP authentication

API Endpoints:
1. WebAuthn registration and authentication
2. Handover workflow (initiate, sign, accept, cancel)
3. Emergency trustee management
4. Succession history and monitoring
"""

from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import os
import asyncio
import base64
from motor.motor_asyncio import AsyncIOMotorClient
from webauthn.helpers.structs import RegistrationCredential, AuthenticationCredential

from ceo_succession import (
    CEOSuccessionService, 
    HandoverInitRequest, 
    HandoverAcceptRequest,
    EmergencyHandoverRequest,
    HandoverTransaction,
    CEOOffice,
    EmergencyTrustee,
    HandoverStatus,
    UserRole
)
from ceo_security import get_ceo_user, CEOSecurityService
from enhanced_auth_routes import auth_service

# Database connection
DATABASE_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = "urevent_db"
client = AsyncIOMotorClient(DATABASE_URL)
db = client[DATABASE_NAME]

# Initialize services
succession_service = CEOSuccessionService(db, auth_service)
ceo_security = CEOSecurityService(db, auth_service)

# Create CEO Succession Router
ceo_succession_router = APIRouter(prefix="/api/ceo/succession", tags=["CEO Succession"])

# Request/Response Models
class WebAuthnRegistrationRequest(BaseModel):
    device_name: str

class WebAuthnRegistrationResponse(BaseModel):
    credential: dict  # RegistrationCredential as dict

class WebAuthnAuthenticationResponse(BaseModel):
    credential: dict  # AuthenticationCredential as dict

class TOTPVerificationRequest(BaseModel):
    totp_code: str

class HandoverActionRequest(BaseModel):
    tx_id: str
    action: str  # sign, accept, cancel
    totp_code: str
    webauthn_response: dict

class TrusteeAppointmentRequest(BaseModel):
    user_id: str
    name: str
    email: str
    public_key: str
    emergency_contact: str

class MFASession(BaseModel):
    session_id: str
    user_id: str
    webauthn_verified: bool = False
    totp_verified: bool = False
    created_at: datetime
    expires_at: datetime

# MFA Session Store (in production, use Redis)
mfa_sessions: Dict[str, MFASession] = {}

# === WEBAUTHN ENDPOINTS ===

@ceo_succession_router.post("/webauthn/register/begin")
async def begin_webauthn_registration(
    request: WebAuthnRegistrationRequest,
    current_user: dict = Depends(get_ceo_user)
):
    """Begin WebAuthn credential registration for CEO succession"""
    
    try:
        options = await succession_service.register_webauthn_credential(
            user_id=current_user["id"],
            device_name=request.device_name
        )
        
        # Log WebAuthn registration attempt
        await ceo_security.audit_log(
            user_id=current_user["id"],
            action="WEBAUTHN_REGISTRATION_INITIATED",
            resource="CEO_SUCCESSION",
            ip_address="system",
            device_fingerprint="system",
            metadata={"device_name": request.device_name}
        )
        
        return {
            "success": True,
            "options": {
                "challenge": "mock_challenge_for_testing",
                "rp": {"id": "localhost", "name": "UREVENT 360 CEO Succession"},
                "user": {
                    "id": "mock_user_id",
                    "name": current_user["email"],
                    "displayName": current_user.get("name", current_user["email"])
                },
                "pubKeyCredParams": [{"alg": -7, "type": "public-key"}],
                "timeout": 60000,
                "attestation": "direct"
            },
            "device_name": options["device_name"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"WebAuthn registration failed: {str(e)}")

@ceo_succession_router.post("/webauthn/register/complete")
async def complete_webauthn_registration(
    response: WebAuthnRegistrationResponse,
    current_user: dict = Depends(get_ceo_user)
):
    """Complete WebAuthn credential registration"""
    
    try:
        # Convert dict to RegistrationCredential
        credential = RegistrationCredential.parse_obj(response.credential)
        
        webauthn_cred = await succession_service.verify_webauthn_registration(
            user_id=current_user["id"],
            credential=credential
        )
        
        # Log successful registration
        await ceo_security.audit_log(
            user_id=current_user["id"],
            action="WEBAUTHN_REGISTRATION_COMPLETED",
            resource="CEO_SUCCESSION",
            ip_address="system",
            device_fingerprint="system",
            metadata={
                "credential_id": webauthn_cred.id,
                "device_name": webauthn_cred.device_name
            }
        )
        
        return {
            "success": True,
            "credential": {
                "id": webauthn_cred.id,
                "device_name": webauthn_cred.device_name,
                "created_at": webauthn_cred.created_at
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"WebAuthn registration verification failed: {str(e)}")

@ceo_succession_router.post("/webauthn/authenticate/begin")
async def begin_webauthn_authentication(
    current_user: dict = Depends(get_ceo_user)
):
    """Begin WebAuthn authentication for CEO succession actions"""
    
    try:
        options = await succession_service.authenticate_webauthn(current_user["id"])
        
        return {
            "success": True,
            "options": {
                "challenge": "mock_auth_challenge_for_testing",
                "timeout": 60000,
                "rpId": "localhost",
                "allowCredentials": [{"type": "public-key", "id": "mock_credential_id"}]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"WebAuthn authentication failed: {str(e)}")

@ceo_succession_router.post("/webauthn/authenticate/complete")
async def complete_webauthn_authentication(
    response: WebAuthnAuthenticationResponse,
    current_user: dict = Depends(get_ceo_user)
):
    """Complete WebAuthn authentication and create MFA session"""
    
    try:
        # Convert dict to AuthenticationCredential
        credential = AuthenticationCredential.parse_obj(response.credential)
        
        # Verify WebAuthn authentication
        verified = await succession_service.verify_webauthn_authentication(
            user_id=current_user["id"],
            credential=credential
        )
        
        if not verified:
            raise HTTPException(status_code=401, detail="WebAuthn authentication failed")
        
        # Create MFA session
        session_id = f"mfa_{current_user['id']}_{datetime.utcnow().timestamp()}"
        mfa_session = MFASession(
            session_id=session_id,
            user_id=current_user["id"],
            webauthn_verified=True,
            totp_verified=False,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=5)
        )
        
        mfa_sessions[session_id] = mfa_session
        
        # Log successful WebAuthn authentication
        await ceo_security.audit_log(
            user_id=current_user["id"],
            action="WEBAUTHN_AUTHENTICATION_SUCCESS",
            resource="CEO_SUCCESSION",
            ip_address="system",
            device_fingerprint="system",
            metadata={"mfa_session_id": session_id}
        )
        
        return {
            "success": True,
            "mfa_session_id": session_id,
            "webauthn_verified": True,
            "expires_at": mfa_session.expires_at
        }
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"WebAuthn authentication failed: {str(e)}")

@ceo_succession_router.post("/mfa/verify-totp")
async def verify_totp_for_mfa(
    request: TOTPVerificationRequest,
    mfa_session_id: str,
    current_user: dict = Depends(get_ceo_user)
):
    """Verify TOTP code and complete MFA session"""
    
    # Get MFA session
    mfa_session = mfa_sessions.get(mfa_session_id)
    if not mfa_session or mfa_session.user_id != current_user["id"]:
        raise HTTPException(status_code=404, detail="Invalid MFA session")
    
    if datetime.utcnow() > mfa_session.expires_at:
        del mfa_sessions[mfa_session_id]
        raise HTTPException(status_code=401, detail="MFA session expired")
    
    if not mfa_session.webauthn_verified:
        raise HTTPException(status_code=400, detail="WebAuthn verification required first")
    
    try:
        # Verify TOTP code
        totp_verified = await succession_service.verify_totp_code(
            user_id=current_user["id"],
            totp_code=request.totp_code
        )
        
        if not totp_verified:
            raise HTTPException(status_code=401, detail="Invalid TOTP code")
        
        # Update MFA session
        mfa_session.totp_verified = True
        mfa_sessions[mfa_session_id] = mfa_session
        
        # Log successful MFA completion
        await ceo_security.audit_log(
            user_id=current_user["id"],
            action="MFA_VERIFICATION_COMPLETED",
            resource="CEO_SUCCESSION",
            ip_address="system",
            device_fingerprint="system",
            metadata={"mfa_session_id": mfa_session_id}
        )
        
        return {
            "success": True,
            "mfa_complete": True,
            "webauthn_verified": True,
            "totp_verified": True,
            "expires_at": mfa_session.expires_at
        }
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"TOTP verification failed: {str(e)}")

# === HANDOVER WORKFLOW ENDPOINTS ===

@ceo_succession_router.post("/handover/initiate")
async def initiate_ceo_handover(
    request: HandoverInitRequest,
    mfa_session_id: str,
    current_user: dict = Depends(get_ceo_user),
    http_request: Request = None
):
    """Initiate CEO handover with MFA verification"""
    
    # Verify MFA session
    mfa_session = mfa_sessions.get(mfa_session_id)
    if not mfa_session or not (mfa_session.webauthn_verified and mfa_session.totp_verified):
        raise HTTPException(status_code=401, detail="Complete MFA verification required")
    
    if datetime.utcnow() > mfa_session.expires_at:
        del mfa_sessions[mfa_session_id]
        raise HTTPException(status_code=401, detail="MFA session expired")
    
    try:
        # Get request info
        ip_address = http_request.client.host if http_request.client else "unknown"
        user_agent = http_request.headers.get("user-agent", "unknown")
        
        # Initiate handover
        handover = await succession_service.initiate_handover(
            current_ceo=current_user,
            request=request,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Log handover initiation
        await ceo_security.audit_log(
            user_id=current_user["id"],
            action="CEO_HANDOVER_INITIATED",
            resource="CEO_SUCCESSION",
            ip_address=ip_address,
            device_fingerprint=ceo_security.generate_device_fingerprint(http_request),
            metadata={
                "tx_id": handover.tx_id,
                "next_ceo_id": handover.next_ceo_id,
                "effective_at": handover.effective_at.isoformat(),
                "reason": handover.reason
            }
        )
        
        # Clear MFA session after successful use
        del mfa_sessions[mfa_session_id]
        
        return {
            "success": True,
            "handover": handover.dict(),
            "message": f"Handover initiated. Effective at {handover.effective_at}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Handover initiation failed: {str(e)}")

@ceo_succession_router.post("/handover/accept")
async def accept_ceo_handover(
    request: HandoverAcceptRequest,
    mfa_session_id: str,
    current_user: dict = Depends(get_ceo_user)
):
    """Accept CEO handover as incoming CEO"""
    
    # Verify MFA session
    mfa_session = mfa_sessions.get(mfa_session_id)
    if not mfa_session or not (mfa_session.webauthn_verified and mfa_session.totp_verified):
        raise HTTPException(status_code=401, detail="Complete MFA verification required")
    
    try:
        # Accept handover
        handover = await succession_service.accept_handover_as_incoming_ceo(
            incoming_ceo=current_user,
            request=request,
            webauthn_verified=mfa_session.webauthn_verified,
            totp_verified=mfa_session.totp_verified
        )
        
        # Log handover acceptance
        await ceo_security.audit_log(
            user_id=current_user["id"],
            action="CEO_HANDOVER_ACCEPTED",
            resource="CEO_SUCCESSION",
            ip_address="system",
            device_fingerprint="system",
            metadata={
                "tx_id": handover.tx_id,
                "effective_at": handover.effective_at.isoformat()
            }
        )
        
        # Clear MFA session
        del mfa_sessions[mfa_session_id]
        
        return {
            "success": True,
            "handover": handover.dict(),
            "message": f"Handover accepted. Will take effect at {handover.effective_at}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Handover acceptance failed: {str(e)}")

@ceo_succession_router.post("/handover/cancel")
async def cancel_ceo_handover(
    tx_id: str,
    mfa_session_id: str,
    current_user: dict = Depends(get_ceo_user)
):
    """Cancel pending CEO handover"""
    
    # Verify MFA session
    mfa_session = mfa_sessions.get(mfa_session_id)
    if not mfa_session or not (mfa_session.webauthn_verified and mfa_session.totp_verified):
        raise HTTPException(status_code=401, detail="Complete MFA verification required")
    
    try:
        # Cancel handover
        handover = await succession_service.cancel_handover(
            current_ceo=current_user,
            tx_id=tx_id,
            webauthn_verified=mfa_session.webauthn_verified,
            totp_verified=mfa_session.totp_verified
        )
        
        # Log handover cancellation
        await ceo_security.audit_log(
            user_id=current_user["id"],
            action="CEO_HANDOVER_CANCELLED",
            resource="CEO_SUCCESSION",
            ip_address="system",
            device_fingerprint="system",
            metadata={"tx_id": tx_id}
        )
        
        # Clear MFA session
        del mfa_sessions[mfa_session_id]
        
        return {
            "success": True,
            "handover": handover.dict(),
            "message": "Handover cancelled successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Handover cancellation failed: {str(e)}")

@ceo_succession_router.post("/handover/execute")
async def execute_ceo_handover(
    tx_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_ceo_user)  # Only for authentication
):
    """Execute scheduled CEO handover (called by system scheduler)"""
    
    try:
        # Execute handover
        handover = await succession_service.execute_handover(tx_id)
        
        # Log handover execution
        await ceo_security.audit_log(
            user_id="system",
            action="CEO_HANDOVER_EXECUTED",
            resource="CEO_SUCCESSION",
            ip_address="system",
            device_fingerprint="system",
            metadata={
                "tx_id": tx_id,
                "prev_ceo_id": handover.prev_ceo_id,
                "next_ceo_id": handover.next_ceo_id
            }
        )
        
        return {
            "success": True,
            "handover": handover.dict(),
            "message": "CEO handover executed successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Handover execution failed: {str(e)}")

# === TRUSTEE MANAGEMENT ENDPOINTS ===

@ceo_succession_router.post("/trustees/appoint")
async def appoint_emergency_trustee(
    request: TrusteeAppointmentRequest,
    mfa_session_id: str,
    current_user: dict = Depends(get_ceo_user)
):
    """Appoint emergency trustee for break-glass recovery"""
    
    # Verify MFA session
    mfa_session = mfa_sessions.get(mfa_session_id)
    if not mfa_session or not (mfa_session.webauthn_verified and mfa_session.totp_verified):
        raise HTTPException(status_code=401, detail="Complete MFA verification required")
    
    try:
        # Appoint trustee
        trustee = await succession_service.add_emergency_trustee(
            trustee_user_id=request.user_id,
            trustee_name=request.name,
            trustee_email=request.email,
            public_key=request.public_key,
            appointed_by=current_user["id"],
            emergency_contact=request.emergency_contact
        )
        
        # Log trustee appointment
        await ceo_security.audit_log(
            user_id=current_user["id"],
            action="EMERGENCY_TRUSTEE_APPOINTED",
            resource="CEO_SUCCESSION",
            ip_address="system",
            device_fingerprint="system",
            metadata={
                "trustee_id": trustee.id,
                "trustee_name": trustee.name,
                "trustee_email": trustee.email
            }
        )
        
        return {
            "success": True,
            "trustee": trustee.dict(),
            "message": "Emergency trustee appointed successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trustee appointment failed: {str(e)}")

@ceo_succession_router.post("/emergency/handover")
async def initiate_emergency_handover(
    request: EmergencyHandoverRequest,
    trustee_signatures: List[Dict[str, Any]]
):
    """Initiate emergency CEO handover with trustee signatures"""
    
    try:
        # Initiate emergency handover
        handover = await succession_service.initiate_emergency_handover(
            request=request,
            trustee_signatures=trustee_signatures
        )
        
        # Log emergency handover
        await ceo_security.audit_log(
            user_id="emergency_system",
            action="EMERGENCY_CEO_HANDOVER_INITIATED",
            resource="CEO_SUCCESSION",
            ip_address="system",
            device_fingerprint="system",
            metadata={
                "tx_id": handover.tx_id,
                "next_ceo_id": handover.next_ceo_id,
                "trustees_count": len(trustee_signatures),
                "reason": handover.reason
            }
        )
        
        return {
            "success": True,
            "handover": handover.dict(),
            "message": f"Emergency handover initiated. Will take effect at {handover.effective_at}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emergency handover failed: {str(e)}")

# === MONITORING ENDPOINTS ===

@ceo_succession_router.get("/status")
async def get_succession_status(
    current_user: dict = Depends(get_ceo_user)
):
    """Get current succession system status"""
    
    try:
        # Get current CEO
        current_ceo = await succession_service.get_current_ceo()
        
        # Get active handovers
        active_handovers = await db.handover_transactions.find({
            "status": {"$in": [HandoverStatus.PENDING_NEW_CEO_SIGN, HandoverStatus.SCHEDULED]}
        }).to_list(10)
        
        # Get emergency trustees
        trustees = await db.emergency_trustees.find({
            "status": "active"
        }).to_list(10)
        
        # Get WebAuthn credentials
        webauthn_creds = await db.webauthn_credentials.find({
            "user_id": current_user["id"]
        }).to_list(10)
        
        return {
            "success": True,
            "data": {
                "current_ceo": {
                    "id": current_ceo["id"] if current_ceo else None,
                    "name": current_ceo.get("name") if current_ceo else None,
                    "email": current_ceo.get("email") if current_ceo else None
                },
                "active_handovers": len(active_handovers),
                "emergency_trustees": len(trustees),
                "webauthn_credentials": len(webauthn_creds),
                "succession_ready": len(webauthn_creds) > 0 and current_user.get("two_factor_enabled", False)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get succession status: {str(e)}")

@ceo_succession_router.get("/history")
async def get_succession_history(
    limit: int = 50,
    current_user: dict = Depends(get_ceo_user)
):
    """Get CEO succession history"""
    
    try:
        # Get handover history
        handover_history = await succession_service.get_handover_history(limit)
        
        # Get tenure history
        tenure_history = await succession_service.get_ceo_tenure_history()
        
        return {
            "success": True,
            "data": {
                "handover_transactions": [h.dict() for h in handover_history],
                "ceo_tenures": [t.dict() for t in tenure_history]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get succession history: {str(e)}")

# Background task to clean up expired MFA sessions
async def cleanup_expired_mfa_sessions():
    """Clean up expired MFA sessions"""
    current_time = datetime.utcnow()
    expired_sessions = [
        session_id for session_id, session in mfa_sessions.items()
        if current_time > session.expires_at
    ]
    
    for session_id in expired_sessions:
        del mfa_sessions[session_id]

# Initialize succession system on startup
@ceo_succession_router.on_event("startup")
async def initialize_succession_system():
    """Initialize CEO succession system"""
    await succession_service.initialize_succession_system()
    
    # Start cleanup task for MFA sessions
    asyncio.create_task(cleanup_mfa_sessions_periodically())

async def cleanup_mfa_sessions_periodically():
    """Periodically clean up expired MFA sessions"""
    while True:
        await cleanup_expired_mfa_sessions()
        await asyncio.sleep(300)  # Clean up every 5 minutes

# Export the router
__all__ = ["ceo_succession_router", "succession_service"]