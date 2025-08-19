"""
Google OAuth 2.0 Routes for UREVENT 360
Implementing secure Google authentication endpoints

Features:
1. Dual Login Support: Traditional + Google OAuth
2. Account Linking by Email
3. Role-based Routing after Google Auth
4. Privacy-compliant Data Handling
5. Secure Token Management
"""

from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from fastapi.responses import RedirectResponse, HTMLResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import os
from motor.motor_asyncio import AsyncIOMotorClient

from google_oauth import GoogleOAuthService, GoogleAuthURL, GoogleAuthCallback, GoogleAuthResult, AccountLinkRequest
from enhanced_auth_routes import get_current_user_enhanced, auth_service

# Database connection
DATABASE_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = "urevent_db"
client = AsyncIOMotorClient(DATABASE_URL)
db = client[DATABASE_NAME]

# Initialize Google OAuth Service
google_oauth_service = GoogleOAuthService(db, auth_service)

# Create Google OAuth Router
google_oauth_router = APIRouter(prefix="/api/auth/google", tags=["Google OAuth Authentication"])

# Frontend URL for redirects
FRONTEND_URL = os.environ.get("REACT_APP_FRONTEND_URL", "https://event-platform-4.preview.emergentagent.com")

# Models
class GoogleLoginRequest(BaseModel):
    role_hint: Optional[str] = "client"

class GoogleLinkRequest(BaseModel):
    password: str

class GoogleUnlinkRequest(BaseModel):
    password: str

# === GOOGLE OAUTH AUTHENTICATION ENDPOINTS ===

@google_oauth_router.post("/login-url", response_model=GoogleAuthURL)
async def get_google_login_url(
    login_request: GoogleLoginRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate Google OAuth login URL
    
    This endpoint creates a secure Google OAuth URL with PKCE for enhanced security.
    The role_hint parameter helps determine the user's initial role after registration.
    """
    
    try:
        auth_url_data = await google_oauth_service.generate_auth_url(login_request.role_hint)
        
        background_tasks.add_task(
            auth_service.log_authentication_event,
            f"oauth_request_{login_request.role_hint}",
            "google_auth_initiated",
            metadata={"role_hint": login_request.role_hint}
        )
        
        return auth_url_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate Google login URL: {str(e)}")

@google_oauth_router.get("/callback")
async def google_oauth_callback(
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Handle Google OAuth callback
    
    This endpoint processes the authorization code from Google and either:
    1. Creates a new user account, or 
    2. Links/logs into an existing account
    
    Returns an HTML page that communicates with the React app via postMessage
    """
    
    # Extract parameters from query string
    query_params = dict(request.query_params)
    
    # Check for error from Google
    if "error" in query_params:
        error_description = query_params.get("error_description", "Authentication failed")
        return HTMLResponse(
            content=f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authentication Failed</title>
                <style>
                    body {{ font-family: Arial, sans-serif; padding: 20px; text-align: center; }}
                    .error {{ color: #dc3545; }}
                </style>
            </head>
            <body>
                <h2 class="error">Authentication Failed</h2>
                <p>{error_description}</p>
                <p>Please close this window and try again.</p>
                <script>
                    window.opener?.postMessage({{
                        type: 'GOOGLE_AUTH_ERROR',
                        error: '{error_description}'
                    }}, '{FRONTEND_URL}');
                    setTimeout(() => window.close(), 3000);
                </script>
            </body>
            </html>
            """,
            status_code=400
        )
    
    # Extract code and state
    code = query_params.get("code")
    state = query_params.get("state")
    
    if not code or not state:
        return HTMLResponse(
            content="""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authentication Error</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
                    .error { color: #dc3545; }
                </style>
            </head>
            <body>
                <h2 class="error">Authentication Error</h2>
                <p>Missing authorization code or state parameter.</p>
                <p>Please close this window and try again.</p>
                <script>
                    window.opener?.postMessage({
                        type: 'GOOGLE_AUTH_ERROR',
                        error: 'Missing authorization parameters'
                    }, '*');
                    setTimeout(() => window.close(), 3000);
                </script>
            </body>
            </html>
            """,
            status_code=400
        )
    
    # Process the callback
    callback_data = GoogleAuthCallback(code=code, state=state)
    
    try:
        auth_result = await google_oauth_service.handle_callback(callback_data)
        
        if auth_result.success:
            # Log successful authentication
            background_tasks.add_task(
                auth_service.log_authentication_event,
                auth_result.user["id"],
                "google_login_success" if not auth_result.is_new_user else "google_account_created",
                metadata={
                    "provider": "google",
                    "new_user": auth_result.is_new_user,
                    "linked_account": auth_result.linked_account
                }
            )
            
            # Return success page that communicates with React app
            return HTMLResponse(
                content=f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Authentication Successful</title>
                    <style>
                        body {{ 
                            font-family: Arial, sans-serif; 
                            padding: 20px; 
                            text-align: center;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            margin: 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                        }}
                        .container {{
                            background: rgba(255,255,255,0.1);
                            padding: 40px;
                            border-radius: 20px;
                            backdrop-filter: blur(10px);
                            border: 1px solid rgba(255,255,255,0.2);
                        }}
                        .success {{ color: #28a745; }}
                        .loading {{
                            display: inline-block;
                            width: 20px;
                            height: 20px;
                            border: 2px solid #f3f3f3;
                            border-top: 2px solid #667eea;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                        }}
                        @keyframes spin {{
                            0% {{ transform: rotate(0deg); }}
                            100% {{ transform: rotate(360deg); }}
                        }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2 class="success">✅ Authentication Successful!</h2>
                        <p>Welcome to UREVENT 360, {auth_result.user['name']}!</p>
                        <p><div class="loading"></div> Redirecting you to the dashboard...</p>
                        {f"<p><em>New account created</em></p>" if auth_result.is_new_user else ""}
                    </div>
                    <script>
                        // Send auth data to parent window
                        const authData = {{
                            type: 'GOOGLE_AUTH_SUCCESS',
                            user: {auth_result.user},
                            accessToken: '{auth_result.access_token}',
                            refreshToken: '{auth_result.refresh_token}',
                            isNewUser: {str(auth_result.is_new_user).lower()},
                            linkedAccount: {str(auth_result.linked_account).lower()},
                            message: '{auth_result.message}'
                        }};
                        
                        window.opener?.postMessage(authData, '{FRONTEND_URL}');
                        
                        // Close popup after delay
                        setTimeout(() => {{
                            window.close();
                        }}, 2000);
                    </script>
                </body>
                </html>
                """
            )
        else:
            # Log failed authentication
            background_tasks.add_task(
                auth_service.log_authentication_event,
                "google_oauth",
                "google_login_failed",
                metadata={"error": auth_result.message}
            )
            
            return HTMLResponse(
                content=f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Authentication Failed</title>
                    <style>
                        body {{ font-family: Arial, sans-serif; padding: 20px; text-align: center; }}
                        .error {{ color: #dc3545; }}
                    </style>
                </head>
                <body>
                    <h2 class="error">Authentication Failed</h2>
                    <p>{auth_result.message}</p>
                    <p>Please close this window and try again.</p>
                    <script>
                        window.opener?.postMessage({{
                            type: 'GOOGLE_AUTH_ERROR',
                            error: '{auth_result.message}'
                        }}, '{FRONTEND_URL}');
                        setTimeout(() => window.close(), 3000);
                    </script>
                </body>
                </html>
                """,
                status_code=400
            )
            
    except Exception as e:
        return HTMLResponse(
            content=f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authentication Error</title>
                <style>
                    body {{ font-family: Arial, sans-serif; padding: 20px; text-align: center; }}
                    .error {{ color: #dc3545; }}
                </style>
            </head>
            <body>
                <h2 class="error">Authentication Error</h2>
                <p>An unexpected error occurred during authentication.</p>
                <p>Please close this window and try again.</p>
                <script>
                    window.opener?.postMessage({{
                        type: 'GOOGLE_AUTH_ERROR',
                        error: 'Unexpected authentication error'
                    }}, '{FRONTEND_URL}');
                    setTimeout(() => window.close(), 3000);
                </script>
            </body>
            </html>
            """,
            status_code=500
        )

# === ACCOUNT LINKING ENDPOINTS ===

@google_oauth_router.get("/status")
async def get_google_account_status(
    current_user: dict = Depends(get_current_user_enhanced)
):
    """
    Get Google account linking status for current user
    
    Returns information about whether the user's account is linked to Google,
    and whether they can link/unlink their account.
    """
    
    status = await google_oauth_service.get_google_account_status(current_user["id"])
    
    return {
        "success": True,
        "data": status
    }

@google_oauth_router.get("/config")
async def get_google_oauth_config():
    """
    Get Google OAuth configuration for frontend
    
    Returns configuration needed by the frontend to implement Google login,
    without exposing sensitive secrets.
    """
    
    google_client_id = os.environ.get("GOOGLE_CLIENT_ID")
    
    if not google_client_id:
        return {
            "success": False,
            "message": "Google OAuth not configured",
            "data": {
                "enabled": False
            }
        }
    
    return {
        "success": True,
        "data": {
            "google_client_id": google_client_id,
            "redirect_uri": os.environ.get("GOOGLE_REDIRECT_URI"),
            "scopes": ["openid", "email", "profile"],
            "enabled": True
        }
    }

# Export the router
__all__ = ["google_oauth_router", "google_oauth_service"]