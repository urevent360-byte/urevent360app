#!/usr/bin/env python3
"""
Enhanced Authentication System Backend Testing for Urevent 360 Platform
Focus: Testing the FIXED enhanced authentication system with token compatibility

PRIORITY TESTING FOCUS (as per review request):
1. **Basic Compatibility**: Test that enhanced auth endpoints work with tokens from basic `/api/login`
2. **Health Check**: Test `/api/auth/health` to verify system status
3. **Token Compatibility**: Login via basic auth, then access enhanced endpoints
4. **Rate Limit Reset**: Test `/api/auth/reset-rate-limit` to clear failed attempts
5. **Enhanced Login**: Test `/api/auth/login` with existing user credentials
6. **Role Management**: Test `/api/auth/user/roles` with basic auth tokens
7. **Session Management**: Test `/api/auth/security/sessions`
8. **Enhanced Profile**: Test `/api/auth/profile/enhanced`

This tests the FIXED enhanced authentication system with unified token verification.
"""

import requests
import json
import sys
from datetime import datetime
import uuid
import time

# Configuration - Use environment variable for backend URL
import os
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://strategic-ai-2.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
TEST_CREDENTIALS = {
    "admin": {"email": "admin@urevent360.com", "password": "admin123"},
    "vendor": {"email": "vendor@example.com", "password": "vendor123"},
    "employee": {"email": "employee@example.com", "password": "employee123"},
    "client": {"email": "sarah.johnson@email.com", "password": "SecurePass123"}
}

class EnhancedAuthTester:
    def __init__(self):
        self.tokens = {}
        self.test_results = []
        self.failed_tests = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
        if not success:
            self.failed_tests.append(test_name)
    
    def make_request(self, method, endpoint, data=None, token=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        headers = HEADERS.copy()
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
    
    def test_enhanced_authentication_system(self):
        """Test the FIXED enhanced authentication system as requested in review"""
        print("\n🔐 Testing FIXED Enhanced Authentication System...")
        print("Focus: Token compatibility between basic and enhanced auth systems")
        
        # Step 1: Test enhanced auth health endpoint
        print("\nStep 1: Testing Enhanced Auth Health Check...")
        self.test_enhanced_auth_health()
        
        # Step 2: Test basic authentication to get tokens
        print("\nStep 2: Testing Basic Authentication (for token compatibility)...")
        self.test_basic_authentication()
        
        # Step 3: Test token compatibility with enhanced endpoints
        print("\nStep 3: Testing Token Compatibility...")
        self.test_token_compatibility()
        
        # Step 4: Test enhanced authentication features
        print("\nStep 4: Testing Enhanced Authentication Features...")
        self.test_enhanced_features()
        
        # Step 5: Test rate limit reset (admin feature)
        print("\nStep 5: Testing Rate Limit Reset...")
        self.test_rate_limit_reset()
    
    def test_enhanced_auth_health(self):
        """Test enhanced auth health endpoint"""
        print("   Testing /api/auth/health endpoint...")
        
        response = self.make_request("GET", "/auth/health")
        if response and response.status_code == 200:
            health_data = response.json()
            if health_data.get("success") and health_data.get("status") == "healthy":
                self.log_test("Enhanced Auth Health Check", True, f"Status: {health_data.get('status')}, Database: {health_data.get('database')}")
                return True
            else:
                self.log_test("Enhanced Auth Health Check", False, f"Unhealthy status: {health_data}")
                return False
        else:
            self.log_test("Enhanced Auth Health Check", False, f"Status: {response.status_code if response else 'No response'}")
            return False
    
    def test_basic_authentication(self):
        """Test basic authentication to get tokens for compatibility testing"""
        print("   Testing basic /api/login for all user roles...")
        
        successful_logins = 0
        for role, credentials in TEST_CREDENTIALS.items():
            response = self.make_request("POST", "/login", credentials)
            
            if response and response.status_code == 200:
                login_data = response.json()
                access_token = login_data.get("access_token")
                user_data = login_data.get("user", {})
                
                if access_token:
                    self.tokens[role] = access_token
                    successful_logins += 1
                    self.log_test(f"Basic Login - {role.title()}", True, f"Token: {len(access_token)} chars, Role: {user_data.get('role')}")
                else:
                    self.log_test(f"Basic Login - {role.title()}", False, "No access token received")
            else:
                self.log_test(f"Basic Login - {role.title()}", False, f"Status: {response.status_code if response else 'No response'}")
        
        if successful_logins > 0:
            self.log_test("Basic Authentication System", True, f"{successful_logins}/{len(TEST_CREDENTIALS)} roles authenticated")
            return True
        else:
            self.log_test("Basic Authentication System", False, "No successful logins")
            return False
    
    def test_token_compatibility(self):
        """Test that basic auth tokens work with enhanced auth endpoints"""
        print("   Testing token compatibility between basic and enhanced auth...")
        
        if not self.tokens:
            self.log_test("Token Compatibility", False, "No tokens available for testing")
            return
        
        # Test enhanced profile endpoint with basic auth token
        if "client" in self.tokens:
            response = self.make_request("GET", "/auth/profile/enhanced", token=self.tokens["client"])
            if response and response.status_code == 200:
                profile_data = response.json()
                if profile_data.get("success") and "data" in profile_data:
                    user_data = profile_data["data"].get("user", {})
                    security_data = profile_data["data"].get("security", {})
                    self.log_test("Basic Token → Enhanced Profile", True, f"User: {user_data.get('name')}, 2FA: {security_data.get('two_factor_enabled')}")
                else:
                    self.log_test("Basic Token → Enhanced Profile", False, "Invalid response format")
            else:
                self.log_test("Basic Token → Enhanced Profile", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test role management endpoint with basic auth token
        if "client" in self.tokens:
            response = self.make_request("GET", "/auth/user/roles", token=self.tokens["client"])
            if response and response.status_code == 200:
                roles_data = response.json()
                if roles_data.get("success") and "data" in roles_data:
                    data = roles_data["data"]
                    current_role = data.get("current_role")
                    available_roles = data.get("available_roles", [])
                    self.log_test("Basic Token → Role Management", True, f"Current: {current_role}, Available: {available_roles}")
                else:
                    self.log_test("Basic Token → Role Management", False, "Invalid response format")
            else:
                self.log_test("Basic Token → Role Management", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test session management endpoint with basic auth token
        if "client" in self.tokens:
            response = self.make_request("GET", "/auth/security/sessions", token=self.tokens["client"])
            if response and response.status_code == 200:
                sessions_data = response.json()
                if sessions_data.get("success") and "data" in sessions_data:
                    sessions = sessions_data["data"].get("sessions", [])
                    self.log_test("Basic Token → Session Management", True, f"Found {len(sessions)} active sessions")
                else:
                    self.log_test("Basic Token → Session Management", False, "Invalid response format")
            else:
                self.log_test("Basic Token → Session Management", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_enhanced_features(self):
        """Test enhanced authentication features"""
        print("   Testing enhanced authentication features...")
        
        # Test enhanced login endpoint
        if "client" in TEST_CREDENTIALS:
            credentials = TEST_CREDENTIALS["client"]
            enhanced_login_data = {
                "email": credentials["email"],
                "password": credentials["password"],
                "remember_me": False
            }
            
            response = self.make_request("POST", "/auth/login", enhanced_login_data)
            if response and response.status_code == 200:
                login_result = response.json()
                if login_result.get("success") and "data" in login_result:
                    data = login_result["data"]
                    access_token = data.get("access_token")
                    refresh_token = data.get("refresh_token")
                    user_data = data.get("user", {})
                    
                    if access_token and refresh_token:
                        self.log_test("Enhanced Login Endpoint", True, f"Access token: {len(access_token)} chars, Refresh token: {len(refresh_token)} chars")
                        
                        # Store enhanced token for further testing
                        self.tokens["client_enhanced"] = access_token
                    else:
                        self.log_test("Enhanced Login Endpoint", False, "Missing tokens in response")
                else:
                    self.log_test("Enhanced Login Endpoint", False, "Invalid response format")
            else:
                self.log_test("Enhanced Login Endpoint", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 2FA setup (if admin/vendor tokens available)
        for role in ["admin", "vendor"]:
            if role in self.tokens:
                response = self.make_request("POST", "/auth/2fa/setup", token=self.tokens[role])
                if response and response.status_code == 200:
                    setup_data = response.json()
                    if "qr_code" in setup_data and "secret" in setup_data:
                        self.log_test(f"2FA Setup - {role.title()}", True, f"QR code and secret generated")
                    else:
                        self.log_test(f"2FA Setup - {role.title()}", False, "Missing QR code or secret")
                else:
                    self.log_test(f"2FA Setup - {role.title()}", False, f"Status: {response.status_code if response else 'No response'}")
                break  # Only test one role for 2FA
    
    def test_rate_limit_reset(self):
        """Test rate limit reset endpoint (admin only)"""
        print("   Testing rate limit reset endpoint...")
        
        if "admin" in self.tokens:
            reset_data = {"email": "test@example.com"}
            response = self.make_request("POST", "/auth/reset-rate-limit", reset_data, token=self.tokens["admin"])
            if response and response.status_code == 200:
                result = response.json()
                if "message" in result:
                    self.log_test("Rate Limit Reset", True, f"Message: {result['message']}")
                else:
                    self.log_test("Rate Limit Reset", False, "No message in response")
            else:
                self.log_test("Rate Limit Reset", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Rate Limit Reset", False, "No admin token available")

def main():
    """Main test execution"""
    print("🚀 Starting FIXED Enhanced Authentication System Backend Testing...")
    print(f"Backend URL: {BASE_URL}")
    print("Focus: Testing token compatibility and enhanced auth features")
    print("=" * 80)
    
    tester = EnhancedAuthTester()
    
    # Test the fixed enhanced authentication system
    tester.test_enhanced_authentication_system()
    
    # Print summary
    print("\n" + "=" * 80)
    print("📊 ENHANCED AUTHENTICATION TEST SUMMARY")
    print("=" * 80)
    
    total_tests = len(tester.test_results)
    passed_tests = sum(1 for result in tester.test_results if result["success"])
    failed_tests = total_tests - passed_tests
    success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {failed_tests}")
    print(f"Success Rate: {success_rate:.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests ({len(tester.failed_tests)}):")
        for test in tester.failed_tests:
            print(f"   • {test}")
    
    # Analyze results for the review request
    enhanced_auth_available = any("Enhanced Auth Health Check" in result["test"] and result["success"] for result in tester.test_results)
    token_compatibility = any("Basic Token →" in result["test"] and result["success"] for result in tester.test_results)
    enhanced_login_working = any("Enhanced Login Endpoint" in result["test"] and result["success"] for result in tester.test_results)
    
    print(f"\n🔍 ANALYSIS:")
    if enhanced_auth_available:
        print("   ✅ Enhanced Authentication System is available and healthy")
    else:
        print("   ❌ Enhanced Authentication System is not available")
    
    if token_compatibility:
        print("   ✅ Token compatibility between basic and enhanced auth is working")
    else:
        print("   ❌ Token compatibility issues detected")
    
    if enhanced_login_working:
        print("   ✅ Enhanced login endpoint is functional")
    else:
        print("   ❌ Enhanced login endpoint has issues")
    
    print(f"\n🎯 REVIEW REQUEST RESULTS:")
    print(f"   1. Basic Compatibility: {'✅ WORKING' if token_compatibility else '❌ FAILED'}")
    print(f"   2. Health Check: {'✅ WORKING' if enhanced_auth_available else '❌ FAILED'}")
    print(f"   3. Token Compatibility: {'✅ WORKING' if token_compatibility else '❌ FAILED'}")
    print(f"   4. Enhanced Login: {'✅ WORKING' if enhanced_login_working else '❌ FAILED'}")
    
    print("\n🎯 ENHANCED AUTHENTICATION TESTING COMPLETED")
    
    # Return success rate for external monitoring
    return success_rate

if __name__ == "__main__":
    success_rate = main()
    sys.exit(0 if success_rate > 50 else 1)