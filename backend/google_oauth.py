"""
Google OAuth 2.0 Integration for UREVENT 360
Implementing secure Google authentication alongside traditional login

Features:
1. Authorization Code Flow with PKCE (Enhanced Security)
2. Account linking by email address
3. Automatic account creation for new users
4. Role-based routing after Google authentication
5. Secure token management and validation
6. Privacy-compliant data handling
"""

from fastapi import HTTPException, Request, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import secrets
import base64
import hashlib
import requests
import jwt
from datetime import datetime, timedelta
import uuid
from urllib.parse import urlencode, parse_qs
import json
import bcrypt

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET") 
GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "https://smart-planner-14.preview.emergentagent.com/auth/google/callback")

# Google OAuth URLs
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke"

# OAuth Scopes (minimal required)
GOOGLE_SCOPES = [
    "openid",
    "email", 
    "profile"
]

# Models for Google OAuth
class GoogleAuthURL(BaseModel):
    auth_url: str
    state: str

class GoogleAuthCallback(BaseModel):
    code: str
    state: str

class GoogleUserInfo(BaseModel):
    id: str
    email: str
    name: str
    given_name: str
    family_name: str
    picture: str
    locale: str
    verified_email: bool

class GoogleAuthResult(BaseModel):
    success: bool
    user: Optional[Dict[str, Any]] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    is_new_user: bool = False
    linked_account: bool = False
    message: str = ""

class AccountLinkRequest(BaseModel):
    google_token: str
    password: str  # For verification when linking existing account

class GoogleOAuthService:
    def __init__(self, db, auth_service):
        self.db = db
        self.auth_service = auth_service
        
    def generate_pkce_challenge(self) -> tuple:
        """Generate PKCE code verifier and challenge for enhanced security"""
        # Generate code verifier (43-128 characters)
        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
        
        # Generate code challenge (SHA256 hash of verifier)
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode('utf-8')).digest()
        ).decode('utf-8').rstrip('=')
        
        return code_verifier, code_challenge
    
    async def generate_auth_url(self, role_hint: Optional[str] = None) -> GoogleAuthURL:
        """Generate Google OAuth authorization URL with PKCE"""
        
        if not GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=500, detail="Google OAuth not configured")
        
        # Generate PKCE challenge
        code_verifier, code_challenge = self.generate_pkce_challenge()
        
        # Generate state parameter for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # Store PKCE and state data temporarily (in production, use Redis)
        oauth_session = {
            "id": str(uuid.uuid4()),
            "state": state,
            "code_verifier": code_verifier,
            "code_challenge": code_challenge,
            "role_hint": role_hint,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=10)  # Short expiry
        }
        
        # Store session in database temporarily
        await self.db.oauth_sessions.insert_one(oauth_session)
        
        # Build authorization URL
        auth_params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "scope": " ".join(GOOGLE_SCOPES),
            "response_type": "code",
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
            "access_type": "offline",  # Request refresh token
            "prompt": "consent",  # Always show consent for refresh token
            "include_granted_scopes": "true"
        }
        
        auth_url = f"{GOOGLE_AUTH_URL}?{urlencode(auth_params)}"
        
        return GoogleAuthURL(auth_url=auth_url, state=state)
    
    async def handle_callback(self, callback_data: GoogleAuthCallback) -> GoogleAuthResult:
        """Handle Google OAuth callback and create/link user account"""
        
        try:
            # Retrieve OAuth session data
            oauth_session = await self.db.oauth_sessions.find_one({
                "state": callback_data.state,
                "expires_at": {"$gt": datetime.utcnow()}
            })
            
            if not oauth_session:
                return GoogleAuthResult(
                    success=False,
                    message="Invalid or expired OAuth state. Please try again."
                )
            
            # Exchange authorization code for tokens
            token_data = await self.exchange_code_for_tokens(
                callback_data.code,
                oauth_session["code_verifier"]
            )
            
            if not token_data:
                return GoogleAuthResult(
                    success=False,
                    message="Failed to exchange authorization code for tokens."
                )
            
            # Get user info from Google
            google_user = await self.get_google_user_info(token_data["access_token"])
            
            if not google_user:
                return GoogleAuthResult(
                    success=False,
                    message="Failed to retrieve user information from Google."
                )
            
            # Process user authentication/creation
            auth_result = await self.process_google_user(google_user, token_data, oauth_session.get("role_hint"))
            
            # Clean up OAuth session
            await self.db.oauth_sessions.delete_one({"_id": oauth_session["_id"]})
            
            return auth_result
            
        except Exception as e:
            print(f"OAuth callback error: {str(e)}")
            return GoogleAuthResult(
                success=False,
                message="Authentication failed. Please try again."
            )
    
    async def exchange_code_for_tokens(self, code: str, code_verifier: str) -> Optional[Dict]:
        """Exchange authorization code for access/refresh tokens"""
        
        token_params = {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "code_verifier": code_verifier
        }
        
        try:
            response = requests.post(GOOGLE_TOKEN_URL, data=token_params, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Token exchange failed: {response.status_code} - {response.text}")
                return None
                
        except requests.RequestException as e:
            print(f"Token exchange request failed: {str(e)}")
            return None
    
    async def get_google_user_info(self, access_token: str) -> Optional[GoogleUserInfo]:
        """Retrieve user information from Google using access token"""
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        try:
            response = requests.get(GOOGLE_USERINFO_URL, headers=headers, timeout=30)
            
            if response.status_code == 200:
                user_data = response.json()
                return GoogleUserInfo(**user_data)
            else:
                print(f"User info request failed: {response.status_code}")
                return None
                
        except requests.RequestException as e:
            print(f"User info request failed: {str(e)}")
            return None
    
    async def process_google_user(self, google_user: GoogleUserInfo, token_data: Dict, role_hint: Optional[str] = None) -> GoogleAuthResult:
        """Process Google user data - create account or link existing account"""
        
        # Check if user already exists
        existing_user = await self.db.users.find_one({"email": google_user.email})
        
        if existing_user:
            # User exists - update Google OAuth data and login
            return await self.link_google_account(existing_user, google_user, token_data)
        else:
            # New user - create account
            return await self.create_google_user(google_user, token_data, role_hint)
    
    async def create_google_user(self, google_user: GoogleUserInfo, token_data: Dict, role_hint: Optional[str] = None) -> GoogleAuthResult:
        """Create new user account from Google OAuth data"""
        
        try:
            # Determine user role
            user_role = role_hint or "client"  # Default to client role
            
            # Create user data
            user_data = {
                "id": str(uuid.uuid4()),
                "name": google_user.name,
                "first_name": google_user.given_name,
                "last_name": google_user.family_name,
                "email": google_user.email,
                "role": user_role,
                "auth_provider": "google",
                "google_id": google_user.id,
                "profile_picture": google_user.picture,
                "locale": google_user.locale,
                "email_verified": google_user.verified_email,
                "password_hash": None,  # No password for Google-only users
                "google_oauth": {
                    "access_token": token_data.get("access_token"),
                    "refresh_token": token_data.get("refresh_token"),
                    "expires_at": datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 3600)),
                    "scope": token_data.get("scope", ""),
                    "linked_at": datetime.utcnow()
                },
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "two_factor_enabled": False,
                "status": "active"
            }
            
            # Insert user into database
            await self.db.users.insert_one(user_data)
            
            # Generate JWT tokens for our system
            access_token = self.auth_service.create_access_token(user_data)
            refresh_token = self.auth_service.create_refresh_token(user_data)
            
            # Store refresh token
            refresh_token_data = {
                "id": str(uuid.uuid4()),
                "user_id": user_data["id"],
                "refresh_token": refresh_token,
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(days=7),
                "oauth_provider": "google"
            }
            await self.db.refresh_tokens.insert_one(refresh_token_data)
            
            # Log authentication event
            await self.auth_service.log_authentication_event(
                user_data["id"],
                "google_account_created",
                metadata={
                    "provider": "google",
                    "role": user_role,
                    "new_user": True
                }
            )
            
            return GoogleAuthResult(
                success=True,
                user={
                    "id": user_data["id"],
                    "name": user_data["name"],
                    "email": user_data["email"],
                    "role": user_data["role"],
                    "profile_picture": user_data["profile_picture"],
                    "auth_provider": "google",
                    "available_roles": [user_role]
                },
                access_token=access_token,
                refresh_token=refresh_token,
                is_new_user=True,
                message="Account created successfully with Google"
            )
            
        except Exception as e:
            print(f"Error creating Google user: {str(e)}")
            return GoogleAuthResult(
                success=False,
                message="Failed to create user account. Please try again."
            )
    
    async def link_google_account(self, existing_user: Dict, google_user: GoogleUserInfo, token_data: Dict) -> GoogleAuthResult:
        """Link Google OAuth to existing user account"""
        
        try:
            # Update user with Google OAuth data
            update_data = {
                "google_id": google_user.id,
                "profile_picture": google_user.picture,
                "google_oauth": {
                    "access_token": token_data.get("access_token"),
                    "refresh_token": token_data.get("refresh_token"),
                    "expires_at": datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 3600)),
                    "scope": token_data.get("scope", ""),
                    "linked_at": datetime.utcnow()
                },
                "updated_at": datetime.utcnow()
            }
            
            # If user doesn't have auth_provider set, add it
            if not existing_user.get("auth_provider"):
                update_data["auth_provider"] = "hybrid"  # Both traditional and Google
            
            await self.db.users.update_one(
                {"id": existing_user["id"]},
                {"$set": update_data}
            )
            
            # Generate JWT tokens for our system
            user_data = {**existing_user, **update_data}
            access_token = self.auth_service.create_access_token(user_data)
            refresh_token = self.auth_service.create_refresh_token(user_data)
            
            # Store refresh token
            refresh_token_data = {
                "id": str(uuid.uuid4()),
                "user_id": existing_user["id"],
                "refresh_token": refresh_token,
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(days=7),
                "oauth_provider": "google"
            }
            await self.db.refresh_tokens.insert_one(refresh_token_data)
            
            # Get user roles
            available_roles = await self.auth_service.get_user_roles(existing_user["id"])
            
            # Log authentication event
            await self.auth_service.log_authentication_event(
                existing_user["id"],
                "google_login_success",
                metadata={
                    "provider": "google",
                    "linked_account": True
                }
            )
            
            return GoogleAuthResult(
                success=True,
                user={
                    "id": existing_user["id"],
                    "name": existing_user["name"],
                    "email": existing_user["email"],
                    "role": existing_user["role"],
                    "profile_picture": google_user.picture,
                    "auth_provider": update_data.get("auth_provider", "hybrid"),
                    "available_roles": available_roles
                },
                access_token=access_token,
                refresh_token=refresh_token,
                linked_account=True,
                message="Successfully logged in with Google"
            )
            
        except Exception as e:
            print(f"Error linking Google account: {str(e)}")
            return GoogleAuthResult(
                success=False,
                message="Failed to link Google account. Please try again."
            )
    
    async def unlink_google_account(self, user_id: str, password: str) -> Dict[str, Any]:
        """Unlink Google OAuth from user account (with password verification)"""
        
        user = await self.db.users.find_one({"id": user_id})
        if not user:
            return {"success": False, "message": "User not found"}
        
        # If user has a password, verify it
        if user.get("password_hash"):
            if not bcrypt.checkpw(password.encode('utf-8'), user["password_hash"].encode('utf-8')):
                return {"success": False, "message": "Invalid password"}
        else:
            return {"success": False, "message": "Cannot unlink Google account - no password set. Please set a password first."}
        
        # Revoke Google tokens
        if user.get("google_oauth", {}).get("access_token"):
            await self.revoke_google_tokens(user["google_oauth"]["access_token"])
        
        # Remove Google OAuth data
        await self.db.users.update_one(
            {"id": user_id},
            {
                "$unset": {
                    "google_id": "",
                    "google_oauth": ""
                },
                "$set": {
                    "auth_provider": "traditional",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Log event
        await self.auth_service.log_authentication_event(
            user_id,
            "google_account_unlinked"
        )
        
        return {"success": True, "message": "Google account unlinked successfully"}
    
    async def refresh_google_tokens(self, user_id: str) -> Dict[str, Any]:
        """Refresh expired Google OAuth tokens"""
        
        user = await self.db.users.find_one({"id": user_id})
        if not user or not user.get("google_oauth"):
            return {"success": False, "message": "No Google OAuth data found"}
        
        google_oauth = user["google_oauth"]
        refresh_token = google_oauth.get("refresh_token")
        
        if not refresh_token:
            return {"success": False, "message": "No refresh token available"}
        
        # Request new tokens from Google
        token_params = {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        
        try:
            response = requests.post(GOOGLE_TOKEN_URL, data=token_params, timeout=30)
            
            if response.status_code == 200:
                token_data = response.json()
                
                # Update user's Google OAuth data
                updated_oauth = {
                    **google_oauth,
                    "access_token": token_data["access_token"],
                    "expires_at": datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 3600))
                }
                
                # If new refresh token provided, update it
                if "refresh_token" in token_data:
                    updated_oauth["refresh_token"] = token_data["refresh_token"]
                
                await self.db.users.update_one(
                    {"id": user_id},
                    {"$set": {"google_oauth": updated_oauth}}
                )
                
                return {"success": True, "message": "Google tokens refreshed"}
            else:
                return {"success": False, "message": "Failed to refresh Google tokens"}
                
        except requests.RequestException as e:
            print(f"Token refresh failed: {str(e)}")
            return {"success": False, "message": "Token refresh request failed"}
    
    async def revoke_google_tokens(self, access_token: str) -> bool:
        """Revoke Google OAuth tokens"""
        
        try:
            revoke_params = {"token": access_token}
            response = requests.post(GOOGLE_REVOKE_URL, data=revoke_params, timeout=30)
            
            return response.status_code == 200
            
        except requests.RequestException:
            return False
    
    async def get_google_account_status(self, user_id: str) -> Dict[str, Any]:
        """Get Google account linking status for user"""
        
        user = await self.db.users.find_one({"id": user_id})
        if not user:
            return {"linked": False, "message": "User not found"}
        
        google_oauth = user.get("google_oauth")
        if not google_oauth:
            return {
                "linked": False,
                "can_link": bool(user.get("password_hash")),  # Can link if has password
                "message": "Google account not linked"
            }
        
        # Check if tokens are still valid
        expires_at = google_oauth.get("expires_at")
        is_expired = expires_at and expires_at < datetime.utcnow()
        
        return {
            "linked": True,
            "google_id": user.get("google_id"),
            "profile_picture": user.get("profile_picture"),
            "linked_at": google_oauth.get("linked_at"),
            "tokens_expired": is_expired,
            "can_unlink": bool(user.get("password_hash")),  # Can unlink if has password
            "auth_provider": user.get("auth_provider", "traditional")
        }