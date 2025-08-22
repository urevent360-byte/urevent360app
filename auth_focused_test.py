#!/usr/bin/env python3
"""
FOCUSED AUTHENTICATION TESTING
Test core authentication functionality with proper error handling
"""

import requests
import json
import time
import os

# Configuration
BACKEND_URL = "http://localhost:8001"
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials from review request
TEST_CREDENTIALS = {
    "carla_client": {"email": "carladbaquero@gmail.com", "password": "carla123"},
    "admin": {"email": "admin@urevent360.com", "password": "admin123"},
    "vendor": {"email": "vendor@example.com", "password": "vendor123"},
    "employee": {"email": "employee@example.com", "password": "employee123"},
    "client": {"email": "sarah.johnson@email.com", "password": "SecurePass123"}
}

def make_request(method, endpoint, data=None, token=None, timeout=10):
    """Make HTTP request with error handling"""
    url = f"{BASE_URL}{endpoint}"
    headers = HEADERS.copy()
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=timeout)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=timeout)
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def test_core_authentication():
    """Test core authentication functionality"""
    print("🔐 CORE AUTHENTICATION TESTING")
    print("=" * 50)
    
    tokens = {}
    successful_logins = 0
    
    # Test all user logins
    for user_type, credentials in TEST_CREDENTIALS.items():
        print(f"\n🔑 Testing {user_type}: {credentials['email']}")
        
        response = make_request("POST", "/login", credentials)
        
        if response and response.status_code == 200:
            try:
                login_data = response.json()
                access_token = login_data.get("access_token")
                user_data = login_data.get("user", {})
                
                if access_token:
                    tokens[user_type] = access_token
                    successful_logins += 1
                    
                    print(f"   ✅ Login successful")
                    print(f"   📝 User: {user_data.get('name', 'Unknown')}")
                    print(f"   🎭 Role: {user_data.get('role', 'unknown')}")
                    print(f"   🎫 Token: {len(access_token)} characters")
                    
                    # Test profile access
                    profile_response = make_request("GET", "/users/profile", token=access_token)
                    if profile_response and profile_response.status_code == 200:
                        profile_data = profile_response.json()
                        print(f"   👤 Profile accessible: {profile_data.get('email')}")
                    else:
                        print(f"   ❌ Profile access failed: {profile_response.status_code if profile_response else 'No response'}")
                else:
                    print(f"   ❌ No access token received")
                    
            except Exception as e:
                print(f"   ❌ JSON parsing error: {e}")
                
        elif response and response.status_code == 401:
            print(f"   ❌ Invalid credentials (401)")
        else:
            status_code = response.status_code if response else "No response"
            print(f"   ❌ Login failed: {status_code}")
    
    print(f"\n📊 AUTHENTICATION SUMMARY")
    print(f"   Total users tested: {len(TEST_CREDENTIALS)}")
    print(f"   Successful logins: {successful_logins}")
    print(f"   Success rate: {(successful_logins/len(TEST_CREDENTIALS)*100):.1f}%")
    
    return tokens, successful_logins == len(TEST_CREDENTIALS)

def test_registration():
    """Test user registration"""
    print("\n📝 REGISTRATION TESTING")
    print("=" * 50)
    
    # Create unique test user
    timestamp = int(time.time())
    test_user = {
        "name": f"Test User {timestamp}",
        "email": f"testuser{timestamp}@urevent360.com",
        "password": "TestPassword123!",
        "role": "client"
    }
    
    print(f"🆕 Creating user: {test_user['email']}")
    
    response = make_request("POST", "/register", test_user)
    
    if response and response.status_code == 200:
        try:
            register_data = response.json()
            access_token = register_data.get("access_token")
            user_data = register_data.get("user", {})
            
            if access_token and user_data.get("email") == test_user["email"]:
                print(f"   ✅ Registration successful")
                print(f"   📝 User: {user_data.get('name')}")
                print(f"   📧 Email: {user_data.get('email')}")
                print(f"   🎫 Token: {len(access_token)} characters")
                
                # Test login with new credentials
                login_response = make_request("POST", "/login", {
                    "email": test_user["email"],
                    "password": test_user["password"]
                })
                
                if login_response and login_response.status_code == 200:
                    print(f"   ✅ Can login with new credentials")
                    return True
                else:
                    print(f"   ❌ Cannot login with new credentials")
                    return False
            else:
                print(f"   ❌ Registration response incomplete")
                return False
                
        except Exception as e:
            print(f"   ❌ JSON parsing error: {e}")
            return False
    else:
        status_code = response.status_code if response else "No response"
        print(f"   ❌ Registration failed: {status_code}")
        return False

def test_error_scenarios():
    """Test basic error scenarios"""
    print("\n⚠️ ERROR SCENARIO TESTING")
    print("=" * 50)
    
    # Test invalid credentials
    print("🚫 Testing invalid credentials...")
    invalid_response = make_request("POST", "/login", {
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    })
    
    if invalid_response and invalid_response.status_code == 401:
        print("   ✅ Invalid credentials properly rejected (401)")
    else:
        status_code = invalid_response.status_code if invalid_response else "No response"
        print(f"   ❌ Invalid credentials not handled correctly: {status_code}")
    
    # Test unauthorized access
    print("🔒 Testing unauthorized access...")
    unauth_response = make_request("GET", "/users/profile")
    
    if unauth_response and unauth_response.status_code in [401, 403]:
        print(f"   ✅ Unauthorized access properly rejected ({unauth_response.status_code})")
    else:
        status_code = unauth_response.status_code if unauth_response else "No response"
        print(f"   ❌ Unauthorized access not handled: {status_code}")

def main():
    """Main test execution"""
    print("🔐 UREVENT 360 AUTHENTICATION FOCUSED TESTING")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print("Testing core authentication functionality...\n")
    
    # Test core authentication
    tokens, auth_success = test_core_authentication()
    
    # Test registration
    reg_success = test_registration()
    
    # Test error scenarios
    test_error_scenarios()
    
    # Final summary
    print("\n🎯 FINAL SUMMARY")
    print("=" * 60)
    
    if auth_success:
        print("✅ CORE AUTHENTICATION: All users can login successfully")
    else:
        print("❌ CORE AUTHENTICATION: Some users cannot login")
    
    if reg_success:
        print("✅ REGISTRATION: User registration working correctly")
    else:
        print("❌ REGISTRATION: User registration has issues")
    
    if auth_success and reg_success:
        print("\n🎉 AUTHENTICATION SYSTEM IS FULLY OPERATIONAL!")
        return True
    else:
        print("\n⚠️ AUTHENTICATION SYSTEM NEEDS ATTENTION!")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)