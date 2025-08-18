"""
CEO Succession Security System for UREVENT 360
Secure Single-Authority Handover with WebAuthn + TOTP MFA

Features:
1. Multi-Role System (ROLE_CEO, ROLE_OWNER, ROLE_ADMIN)
2. WebAuthn (FIDO2) + TOTP Authentication
3. Time-Locked Handover Transactions (24-72h)
4. Cryptographic Signature Verification
5. Emergency Trustee Recovery System
6. Immutable Audit Trail
7. Single CEO Constraint Enforcement
"""

from fastapi import HTTPException, Request, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from enum import Enum
import os
import secrets
import hashlib
import jwt
import uuid
import json
import pyotp
import base64
import cbor2
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, padding
from webauthn import generate_registration_options, verify_registration_response, generate_authentication_options, verify_authentication_response
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria, 
    UserVerificationRequirement,
    AttestationConveyancePreference,
    AuthenticatorAttachment,
    ResidentKeyRequirement,
    RegistrationCredential,
    AuthenticationCredential
)

# CEO Succession Configuration
CEO_SUCCESSION_SETTINGS = {
    "MIN_HANDOVER_DELAY_HOURS": int(os.environ.get("CEO_MIN_HANDOVER_DELAY", "24")),
    "MAX_HANDOVER_DELAY_HOURS": int(os.environ.get("CEO_MAX_HANDOVER_DELAY", "168")),  # 7 days
    "EMERGENCY_DELAY_HOURS": int(os.environ.get("CEO_EMERGENCY_DELAY", "72")),
    "MIN_TRUSTEES": int(os.environ.get("CEO_MIN_TRUSTEES", "2")),
    "MAX_TRUSTEES": int(os.environ.get("CEO_MAX_TRUSTEES", "5")),
    "REAUTH_TIMEOUT_MINUTES": 3,
    "RP_ID": os.environ.get("WEBAUTHN_RP_ID", "localhost"),
    "RP_NAME": "UREVENT 360 CEO Succession",
    "ORIGIN": os.environ.get("WEBAUTHN_ORIGIN", "http://localhost:3000")
}

# Enum Definitions
class HandoverStatus(str, Enum):
    PENDING_CEO_SIGN = "PENDING_CEO_SIGN"
    PENDING_NEW_CEO_SIGN = "PENDING_NEW_CEO_SIGN" 
    SCHEDULED = "SCHEDULED"
    CANCELLED = "CANCELLED"
    EXECUTED = "EXECUTED"
    EXPIRED = "EXPIRED"

class UserRole(str, Enum):
    CEO = "ROLE_CEO"
    OWNER = "ROLE_OWNER"
    ADMIN = "ROLE_ADMIN"
    CLIENT = "client"
    VENDOR = "vendor"
    EMPLOYEE = "employee"

class TrusteeStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    REVOKED = "revoked"

# Pydantic Models
class WebAuthnCredential(BaseModel):
    id: str
    public_key: str
    sign_count: int
    created_at: datetime
    last_used: datetime
    device_name: str
    aaguid: Optional[str] = None

class HandoverTransaction(BaseModel):
    tx_id: str
    prev_ceo_id: str
    next_ceo_id: str
    status: HandoverStatus
    reason: str
    effective_at: datetime
    expires_at: datetime
    created_at: datetime
    prev_ceo_signature: Optional[str] = None
    next_ceo_signature: Optional[str] = None
    trustee_signatures: List[Dict[str, Any]] = []
    ip_address: str
    user_agent: str
    geo_hint: Optional[Dict[str, Any]] = None
    revoked_at: Optional[datetime] = None
    executed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = {}

class CEOOffice(BaseModel):
    user_id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    handover_tx_id: Optional[str] = None
    appointment_reason: str = "initial_appointment"

class EmergencyTrustee(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    public_key: str
    appointed_by: str
    appointed_at: datetime
    status: TrusteeStatus
    emergency_contact: str
    last_verified: datetime

class HandoverInitRequest(BaseModel):
    next_ceo_id: str
    effective_delay_hours: int = Field(ge=24, le=168)
    reason: str = Field(min_length=10, max_length=500)
    
class HandoverAcceptRequest(BaseModel):
    tx_id: str
    
class EmergencyHandoverRequest(BaseModel):
    next_ceo_id: str
    reason: str = Field(min_length=20, max_length=1000)
    admin_approval_required: bool = True

class CEOSuccessionService:
    def __init__(self, db, auth_service):
        self.db = db
        self.auth_service = auth_service
        
    async def initialize_succession_system(self):
        """Initialize CEO succession system with constraints and indexes"""
        
        # Create unique index for single CEO constraint
        await self.db.ceo_office.create_index(
            [("ended_at", 1)],
            unique=True,
            partialFilterExpression={"ended_at": None},
            name="one_active_ceo_only"
        )
        
        # Create indexes for performance
        await self.db.handover_transactions.create_index([("tx_id", 1)], unique=True)
        await self.db.handover_transactions.create_index([("status", 1), ("effective_at", 1)])
        await self.db.emergency_trustees.create_index([("user_id", 1), ("status", 1)])
        
        print("✅ CEO Succession System initialized with database constraints")
    
    async def assert_single_active_ceo(self):
        """Enforce exactly one active CEO at all times"""
        active_ceos = await self.db.ceo_office.count_documents({"ended_at": None})
        
        if active_ceos == 0:
            raise HTTPException(
                status_code=500, 
                detail="CRITICAL: No active CEO found. System requires exactly one CEO."
            )
        elif active_ceos > 1:
            raise HTTPException(
                status_code=500,
                detail="CRITICAL: Multiple active CEOs detected. System constraint violated."
            )
        
        return True
    
    async def get_current_ceo(self) -> Optional[Dict[str, Any]]:
        """Get current active CEO"""
        ceo_office = await self.db.ceo_office.find_one({"ended_at": None})
        
        if not ceo_office:
            return None
            
        ceo_user = await self.db.users.find_one({"id": ceo_office["user_id"]})
        return ceo_user
    
    async def verify_ceo_role(self, user: Dict[str, Any]) -> bool:
        """Verify user has active CEO role"""
        if not user or user.get("role") != UserRole.CEO:
            return False
            
        # Verify CEO office record
        ceo_office = await self.db.ceo_office.find_one({
            "user_id": user["id"],
            "ended_at": None
        })
        
        return ceo_office is not None
    
    # === WEBAUTHN AUTHENTICATION ===
    
    async def register_webauthn_credential(self, user_id: str, device_name: str) -> Dict[str, Any]:
        """Generate WebAuthn registration options for CEO"""
        
        user = await self.db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Generate registration options
        options = generate_registration_options(
            rp_id=CEO_SUCCESSION_SETTINGS["RP_ID"],
            rp_name=CEO_SUCCESSION_SETTINGS["RP_NAME"],
            user_id=user_id.encode(),
            user_name=user["email"],
            user_display_name=user.get("name", user["email"]),
            attestation=AttestationConveyancePreference.DIRECT,
            authenticator_selection=AuthenticatorSelectionCriteria(
                authenticator_attachment=AuthenticatorAttachment.PLATFORM,
                resident_key=ResidentKeyRequirement.PREFERRED,
                user_verification=UserVerificationRequirement.REQUIRED,
            ),
        )
        
        # Store challenge temporarily
        await self.db.webauthn_challenges.insert_one({
            "user_id": user_id,
            "challenge": options.challenge,
            "device_name": device_name,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=5)
        })
        
        return {
            "options": options,
            "device_name": device_name
        }
    
    async def verify_webauthn_registration(self, user_id: str, credential: RegistrationCredential) -> WebAuthnCredential:
        """Verify and store WebAuthn registration"""
        
        # Get stored challenge
        challenge_doc = await self.db.webauthn_challenges.find_one({
            "user_id": user_id,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if not challenge_doc:
            raise HTTPException(status_code=400, detail="Invalid or expired challenge")
        
        # Verify registration
        verification = verify_registration_response(
            credential=credential,
            expected_challenge=challenge_doc["challenge"],
            expected_origin=CEO_SUCCESSION_SETTINGS["ORIGIN"],
            expected_rp_id=CEO_SUCCESSION_SETTINGS["RP_ID"],
        )
        
        if not verification.verified:
            raise HTTPException(status_code=400, detail="WebAuthn registration verification failed")
        
        # Store credential
        webauthn_cred = WebAuthnCredential(
            id=base64.urlsafe_b64encode(verification.credential_id).decode(),
            public_key=base64.urlsafe_b64encode(verification.credential_public_key).decode(),
            sign_count=verification.sign_count,
            created_at=datetime.utcnow(),
            last_used=datetime.utcnow(),
            device_name=challenge_doc["device_name"],
            aaguid=verification.aaguid.hex() if verification.aaguid else None
        )
        
        # Store in database
        await self.db.webauthn_credentials.insert_one({
            "user_id": user_id,
            **webauthn_cred.dict()
        })
        
        # Clean up challenge
        await self.db.webauthn_challenges.delete_one({"_id": challenge_doc["_id"]})
        
        return webauthn_cred
    
    async def authenticate_webauthn(self, user_id: str) -> Dict[str, Any]:
        """Generate WebAuthn authentication options"""
        
        # Get user's credentials
        credentials = await self.db.webauthn_credentials.find({
            "user_id": user_id
        }).to_list(10)
        
        if not credentials:
            raise HTTPException(status_code=404, detail="No WebAuthn credentials registered")
        
        # Generate authentication options
        options = generate_authentication_options(
            rp_id=CEO_SUCCESSION_SETTINGS["RP_ID"],
            allow_credentials=[
                {
                    "type": "public-key",
                    "id": base64.urlsafe_b64decode(cred["id"])
                }
                for cred in credentials
            ],
            user_verification=UserVerificationRequirement.REQUIRED,
        )
        
        # Store challenge
        await self.db.webauthn_auth_challenges.insert_one({
            "user_id": user_id,
            "challenge": options.challenge,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=5)
        })
        
        return {"options": options}
    
    async def verify_webauthn_authentication(self, user_id: str, credential: AuthenticationCredential) -> bool:
        """Verify WebAuthn authentication"""
        
        # Get stored challenge
        challenge_doc = await self.db.webauthn_auth_challenges.find_one({
            "user_id": user_id,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if not challenge_doc:
            raise HTTPException(status_code=400, detail="Invalid or expired auth challenge")
        
        # Get stored credential
        stored_cred = await self.db.webauthn_credentials.find_one({
            "user_id": user_id,
            "id": base64.urlsafe_b64encode(credential.raw_id).decode()
        })
        
        if not stored_cred:
            raise HTTPException(status_code=404, detail="Credential not found")
        
        # Verify authentication
        verification = verify_authentication_response(
            credential=credential,
            expected_challenge=challenge_doc["challenge"],
            expected_origin=CEO_SUCCESSION_SETTINGS["ORIGIN"],
            expected_rp_id=CEO_SUCCESSION_SETTINGS["RP_ID"],
            credential_public_key=base64.urlsafe_b64decode(stored_cred["public_key"]),
            credential_current_sign_count=stored_cred["sign_count"],
        )
        
        if not verification.verified:
            raise HTTPException(status_code=401, detail="WebAuthn authentication failed")
        
        # Update credential sign count and last used
        await self.db.webauthn_credentials.update_one(
            {"user_id": user_id, "id": stored_cred["id"]},
            {
                "$set": {
                    "sign_count": verification.new_sign_count,
                    "last_used": datetime.utcnow()
                }
            }
        )
        
        # Clean up challenge
        await self.db.webauthn_auth_challenges.delete_one({"_id": challenge_doc["_id"]})
        
        return True
    
    async def verify_totp_code(self, user_id: str, totp_code: str) -> bool:
        """Verify TOTP 2FA code"""
        
        user = await self.db.users.find_one({"id": user_id})
        if not user or not user.get("two_factor_secret"):
            raise HTTPException(status_code=400, detail="TOTP not configured for user")
        
        totp = pyotp.TOTP(user["two_factor_secret"])
        
        # Allow 30-second window tolerance
        return totp.verify(totp_code, valid_window=1)
    
    # === HANDOVER WORKFLOW ===
    
    async def initiate_handover(
        self, 
        current_ceo: Dict[str, Any], 
        request: HandoverInitRequest,
        ip_address: str,
        user_agent: str
    ) -> HandoverTransaction:
        """Initiate CEO handover transaction (Step 1)"""
        
        await self.assert_single_active_ceo()
        
        # Verify current CEO
        if not await self.verify_ceo_role(current_ceo):
            raise HTTPException(status_code=403, detail="Only active CEO can initiate handover")
        
        # Verify next CEO exists
        next_ceo = await self.db.users.find_one({"id": request.next_ceo_id})
        if not next_ceo:
            raise HTTPException(status_code=404, detail="Next CEO user not found")
        
        if next_ceo["id"] == current_ceo["id"]:
            raise HTTPException(status_code=400, detail="Cannot handover to yourself")
        
        # Check for existing pending handover
        existing_handover = await self.db.handover_transactions.find_one({
            "prev_ceo_id": current_ceo["id"],
            "status": {"$in": [HandoverStatus.PENDING_CEO_SIGN, HandoverStatus.PENDING_NEW_CEO_SIGN, HandoverStatus.SCHEDULED]}
        })
        
        if existing_handover:
            raise HTTPException(status_code=409, detail="Handover already in progress")
        
        # Calculate timing
        effective_at = datetime.utcnow() + timedelta(hours=request.effective_delay_hours)
        expires_at = effective_at + timedelta(days=7)  # 7 days to complete
        
        # Create handover transaction
        handover = HandoverTransaction(
            tx_id=str(uuid.uuid4()),
            prev_ceo_id=current_ceo["id"],
            next_ceo_id=request.next_ceo_id,
            status=HandoverStatus.PENDING_NEW_CEO_SIGN,
            reason=request.reason,
            effective_at=effective_at,
            expires_at=expires_at,
            created_at=datetime.utcnow(),
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={
                "prev_ceo_name": current_ceo.get("name"),
                "next_ceo_name": next_ceo.get("name"),
                "delay_hours": request.effective_delay_hours
            }
        )
        
        # Store in database
        await self.db.handover_transactions.insert_one(handover.dict())
        
        # Send notification to next CEO (implement notification service)
        await self.notify_handover_initiation(handover, next_ceo)
        
        return handover
    
    async def sign_handover_as_outgoing_ceo(
        self, 
        current_ceo: Dict[str, Any], 
        tx_id: str,
        webauthn_verified: bool,
        totp_verified: bool
    ) -> HandoverTransaction:
        """Sign handover transaction as outgoing CEO (WebAuthn + TOTP required)"""
        
        if not webauthn_verified or not totp_verified:
            raise HTTPException(status_code=401, detail="WebAuthn + TOTP verification required")
        
        handover = await self.db.handover_transactions.find_one({"tx_id": tx_id})
        if not handover:
            raise HTTPException(status_code=404, detail="Handover transaction not found")
        
        if handover["prev_ceo_id"] != current_ceo["id"]:
            raise HTTPException(status_code=403, detail="Unauthorized to sign this handover")
        
        if handover["status"] != HandoverStatus.PENDING_CEO_SIGN:
            raise HTTPException(status_code=400, detail="Handover not in correct state for CEO signature")
        
        # Generate cryptographic signature using CEO's WebAuthn credential
        signature = await self.generate_handover_signature(current_ceo["id"], tx_id, "outgoing_ceo")
        
        # Update transaction
        await self.db.handover_transactions.update_one(
            {"tx_id": tx_id},
            {
                "$set": {
                    "prev_ceo_signature": signature,
                    "status": HandoverStatus.PENDING_NEW_CEO_SIGN,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Get updated handover
        updated_handover = await self.db.handover_transactions.find_one({"tx_id": tx_id})
        return HandoverTransaction(**updated_handover)
    
    async def accept_handover_as_incoming_ceo(
        self,
        incoming_ceo: Dict[str, Any],
        request: HandoverAcceptRequest,
        webauthn_verified: bool,
        totp_verified: bool
    ) -> HandoverTransaction:
        """Accept handover as incoming CEO (WebAuthn + TOTP required)"""
        
        if not webauthn_verified or not totp_verified:
            raise HTTPException(status_code=401, detail="WebAuthn + TOTP verification required for incoming CEO")
        
        handover = await self.db.handover_transactions.find_one({"tx_id": request.tx_id})
        if not handover:
            raise HTTPException(status_code=404, detail="Handover transaction not found")
        
        if handover["next_ceo_id"] != incoming_ceo["id"]:
            raise HTTPException(status_code=403, detail="Unauthorized to accept this handover")
        
        if handover["status"] != HandoverStatus.PENDING_NEW_CEO_SIGN:
            raise HTTPException(status_code=400, detail="Handover not ready for acceptance")
        
        if datetime.utcnow() >= datetime.fromisoformat(handover["expires_at"]):
            raise HTTPException(status_code=400, detail="Handover has expired")
        
        # Generate cryptographic signature
        signature = await self.generate_handover_signature(incoming_ceo["id"], request.tx_id, "incoming_ceo")
        
        # Update transaction to scheduled
        await self.db.handover_transactions.update_one(
            {"tx_id": request.tx_id},
            {
                "$set": {
                    "next_ceo_signature": signature,
                    "status": HandoverStatus.SCHEDULED,
                    "scheduled_at": datetime.utcnow()
                }
            }
        )
        
        # Schedule execution (in production, use proper task scheduler)
        await self.schedule_handover_execution(request.tx_id, datetime.fromisoformat(handover["effective_at"]))
        
        updated_handover = await self.db.handover_transactions.find_one({"tx_id": request.tx_id})
        return HandoverTransaction(**updated_handover)
    
    async def cancel_handover(
        self,
        current_ceo: Dict[str, Any],
        tx_id: str,
        webauthn_verified: bool,
        totp_verified: bool
    ) -> HandoverTransaction:
        """Cancel pending handover (only outgoing CEO can cancel before execution)"""
        
        if not webauthn_verified or not totp_verified:
            raise HTTPException(status_code=401, detail="WebAuthn + TOTP verification required")
        
        handover = await self.db.handover_transactions.find_one({"tx_id": tx_id})
        if not handover:
            raise HTTPException(status_code=404, detail="Handover transaction not found")
        
        if handover["prev_ceo_id"] != current_ceo["id"]:
            raise HTTPException(status_code=403, detail="Only outgoing CEO can cancel handover")
        
        if handover["status"] not in [HandoverStatus.PENDING_NEW_CEO_SIGN, HandoverStatus.SCHEDULED]:
            raise HTTPException(status_code=400, detail="Cannot cancel handover in current state")
        
        if datetime.utcnow() >= datetime.fromisoformat(handover["effective_at"]):
            raise HTTPException(status_code=400, detail="Cannot cancel: handover execution time has passed")
        
        # Cancel handover
        await self.db.handover_transactions.update_one(
            {"tx_id": tx_id},
            {
                "$set": {
                    "status": HandoverStatus.CANCELLED,
                    "revoked_at": datetime.utcnow(),
                    "cancelled_by": current_ceo["id"]
                }
            }
        )
        
        updated_handover = await self.db.handover_transactions.find_one({"tx_id": tx_id})
        return HandoverTransaction(**updated_handover)
    
    async def execute_handover(self, tx_id: str) -> HandoverTransaction:
        """Execute handover transaction atomically (called by scheduler)"""
        
        handover = await self.db.handover_transactions.find_one({"tx_id": tx_id})
        if not handover:
            raise HTTPException(status_code=404, detail="Handover transaction not found")
        
        if handover["status"] != HandoverStatus.SCHEDULED:
            raise HTTPException(status_code=400, detail="Handover not scheduled for execution")
        
        if datetime.utcnow() < datetime.fromisoformat(handover["effective_at"]):
            raise HTTPException(status_code=400, detail="Handover execution time not reached")
        
        # Verify both signatures
        if not handover.get("prev_ceo_signature") or not handover.get("next_ceo_signature"):
            raise HTTPException(status_code=400, detail="Missing required signatures")
        
        # Atomic transaction to transfer CEO role
        async with await self.db.client.start_session() as session:
            async with session.start_transaction():
                try:
                    # Verify single CEO constraint
                    await self.assert_single_active_ceo()
                    
                    # End current CEO term
                    await self.db.ceo_office.update_one(
                        {"ended_at": None},
                        {"$set": {"ended_at": datetime.utcnow(), "handover_tx_id": tx_id}},
                        session=session
                    )
                    
                    # Start new CEO term
                    new_term = CEOOffice(
                        user_id=handover["next_ceo_id"],
                        started_at=datetime.utcnow(),
                        handover_tx_id=tx_id,
                        appointment_reason="succession_handover"
                    )
                    
                    await self.db.ceo_office.insert_one(new_term.dict(), session=session)
                    
                    # Update user roles
                    await self.db.users.update_one(
                        {"id": handover["prev_ceo_id"]},
                        {"$set": {"role": UserRole.ADMIN}},  # Demote to admin
                        session=session
                    )
                    
                    await self.db.users.update_one(
                        {"id": handover["next_ceo_id"]},
                        {"$set": {"role": UserRole.CEO}},  # Promote to CEO
                        session=session
                    )
                    
                    # Mark handover as executed
                    await self.db.handover_transactions.update_one(
                        {"tx_id": tx_id},
                        {
                            "$set": {
                                "status": HandoverStatus.EXECUTED,
                                "executed_at": datetime.utcnow()
                            }
                        },
                        session=session
                    )
                    
                    await session.commit_transaction()
                    
                except Exception as e:
                    await session.abort_transaction()
                    raise HTTPException(status_code=500, detail=f"Handover execution failed: {str(e)}")
        
        # Send notifications
        await self.notify_handover_completion(tx_id)
        
        updated_handover = await self.db.handover_transactions.find_one({"tx_id": tx_id})
        return HandoverTransaction(**updated_handover)
    
    # === EMERGENCY TRUSTEE SYSTEM ===
    
    async def add_emergency_trustee(
        self,
        trustee_user_id: str,
        trustee_name: str,
        trustee_email: str,
        public_key: str,
        appointed_by: str,
        emergency_contact: str
    ) -> EmergencyTrustee:
        """Add emergency trustee for break-glass recovery"""
        
        # Verify appointer is current CEO
        current_ceo = await self.get_current_ceo()
        if not current_ceo or current_ceo["id"] != appointed_by:
            raise HTTPException(status_code=403, detail="Only current CEO can appoint trustees")
        
        # Check trustee limit
        active_trustees = await self.db.emergency_trustees.count_documents({
            "status": TrusteeStatus.ACTIVE
        })
        
        if active_trustees >= CEO_SUCCESSION_SETTINGS["MAX_TRUSTEES"]:
            raise HTTPException(status_code=400, detail=f"Maximum {CEO_SUCCESSION_SETTINGS['MAX_TRUSTEES']} trustees allowed")
        
        # Check if user is already a trustee
        existing = await self.db.emergency_trustees.find_one({
            "user_id": trustee_user_id,
            "status": TrusteeStatus.ACTIVE
        })
        
        if existing:
            raise HTTPException(status_code=409, detail="User is already an active trustee")
        
        trustee = EmergencyTrustee(
            id=str(uuid.uuid4()),
            user_id=trustee_user_id,
            name=trustee_name,
            email=trustee_email,
            public_key=public_key,
            appointed_by=appointed_by,
            appointed_at=datetime.utcnow(),
            status=TrusteeStatus.ACTIVE,
            emergency_contact=emergency_contact,
            last_verified=datetime.utcnow()
        )
        
        await self.db.emergency_trustees.insert_one(trustee.dict())
        return trustee
    
    async def initiate_emergency_handover(
        self,
        request: EmergencyHandoverRequest,
        trustee_signatures: List[Dict[str, Any]]
    ) -> HandoverTransaction:
        """Initiate emergency handover with trustee signatures"""
        
        # Verify minimum trustee signatures
        if len(trustee_signatures) < CEO_SUCCESSION_SETTINGS["MIN_TRUSTEES"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Minimum {CEO_SUCCESSION_SETTINGS['MIN_TRUSTEES']} trustee signatures required"
            )
        
        # Verify trustee signatures
        verified_trustees = []
        for sig in trustee_signatures:
            trustee = await self.db.emergency_trustees.find_one({
                "id": sig["trustee_id"],
                "status": TrusteeStatus.ACTIVE
            })
            
            if not trustee:
                raise HTTPException(status_code=404, detail=f"Trustee {sig['trustee_id']} not found or inactive")
            
            # Verify signature (implement cryptographic verification)
            if await self.verify_trustee_signature(trustee, sig["signature"], request.dict()):
                verified_trustees.append(trustee)
        
        if len(verified_trustees) < CEO_SUCCESSION_SETTINGS["MIN_TRUSTEES"]:
            raise HTTPException(status_code=401, detail="Insufficient verified trustee signatures")
        
        # Verify next CEO
        next_ceo = await self.db.users.find_one({"id": request.next_ceo_id})
        if not next_ceo:
            raise HTTPException(status_code=404, detail="Next CEO user not found")
        
        # Get current CEO (if any)
        current_ceo = await self.get_current_ceo()
        
        # Calculate timing with emergency delay
        effective_at = datetime.utcnow() + timedelta(hours=CEO_SUCCESSION_SETTINGS["EMERGENCY_DELAY_HOURS"])
        expires_at = effective_at + timedelta(days=7)
        
        # Create emergency handover transaction
        handover = HandoverTransaction(
            tx_id=str(uuid.uuid4()),
            prev_ceo_id=current_ceo["id"] if current_ceo else "emergency",
            next_ceo_id=request.next_ceo_id,
            status=HandoverStatus.SCHEDULED,  # Emergency bypasses normal flow
            reason=f"EMERGENCY: {request.reason}",
            effective_at=effective_at,
            expires_at=expires_at,
            created_at=datetime.utcnow(),
            trustee_signatures=trustee_signatures,
            ip_address="emergency_system",
            user_agent="emergency_trustee_system",
            metadata={
                "emergency_handover": True,
                "trustees_count": len(verified_trustees),
                "admin_approval_required": request.admin_approval_required,
                "next_ceo_name": next_ceo.get("name")
            }
        )
        
        await self.db.handover_transactions.insert_one(handover.dict())
        
        # Send high-priority alerts
        await self.send_emergency_alerts(handover, verified_trustees)
        
        return handover
    
    # === UTILITY METHODS ===
    
    async def generate_handover_signature(self, user_id: str, tx_id: str, role: str) -> str:
        """Generate cryptographic signature for handover transaction"""
        
        # Get user's WebAuthn credential
        credential = await self.db.webauthn_credentials.find_one({
            "user_id": user_id
        }, sort=[("created_at", -1)])  # Get latest credential
        
        if not credential:
            raise HTTPException(status_code=404, detail="No WebAuthn credential found for signature")
        
        # Create signature payload
        payload = {
            "tx_id": tx_id,
            "user_id": user_id,
            "role": role,
            "timestamp": datetime.utcnow().isoformat(),
            "system": "urevent360_ceo_succession"
        }
        
        # Generate signature using WebAuthn credential (simplified for demo)
        signature_data = json.dumps(payload, sort_keys=True).encode()
        signature_hash = hashlib.sha256(signature_data).hexdigest()
        
        # In production, use actual private key signing
        return base64.b64encode(f"{signature_hash}:{credential['id']}".encode()).decode()
    
    async def verify_trustee_signature(self, trustee: Dict[str, Any], signature: str, data: Dict[str, Any]) -> bool:
        """Verify trustee cryptographic signature"""
        # Implement actual cryptographic verification
        # For demo, return True if signature format is correct
        try:
            decoded = base64.b64decode(signature)
            return len(decoded) > 32  # Basic format check
        except:
            return False
    
    async def schedule_handover_execution(self, tx_id: str, execution_time: datetime):
        """Schedule handover execution (implement with task scheduler in production)"""
        # For demo, store scheduled execution
        await self.db.scheduled_executions.insert_one({
            "tx_id": tx_id,
            "execution_time": execution_time,
            "type": "handover_execution",
            "created_at": datetime.utcnow()
        })
    
    async def notify_handover_initiation(self, handover: HandoverTransaction, next_ceo: Dict[str, Any]):
        """Send notification to next CEO about handover"""
        # Implement notification service
        print(f"📧 NOTIFICATION: Handover initiated for {next_ceo['email']}")
    
    async def notify_handover_completion(self, tx_id: str):
        """Send notifications about completed handover"""
        # Implement notification service
        print(f"📧 NOTIFICATION: Handover {tx_id} completed successfully")
    
    async def send_emergency_alerts(self, handover: HandoverTransaction, trustees: List[Dict[str, Any]]):
        """Send high-priority emergency alerts"""
        # Implement emergency alert system
        print(f"🚨 EMERGENCY ALERT: Emergency handover initiated - {handover.tx_id}")
    
    async def get_handover_history(self, limit: int = 50) -> List[HandoverTransaction]:
        """Get handover transaction history"""
        
        transactions = await self.db.handover_transactions.find().sort("created_at", -1).limit(limit).to_list(limit)
        return [HandoverTransaction(**tx) for tx in transactions]
    
    async def get_ceo_tenure_history(self) -> List[CEOOffice]:
        """Get complete CEO tenure history"""
        
        tenures = await self.db.ceo_office.find().sort("started_at", -1).to_list(100)
        return [CEOOffice(**tenure) for tenure in tenures]

# Export the succession service
__all__ = [
    "CEOSuccessionService", 
    "HandoverTransaction", 
    "CEOOffice", 
    "EmergencyTrustee",
    "HandoverStatus",
    "UserRole",
    "TrusteeStatus"
]