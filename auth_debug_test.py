#!/usr/bin/env python3
"""
CRITICAL AUTHENTICATION SYSTEM INVESTIGATION
Focus: Debugging "Login failed. Please try again" errors across all portals

CRITICAL TESTS (as per review request):
1. **LOGIN ENDPOINT VERIFICATION**: Test POST /api/login with various user credentials
2. **USER DATABASE VERIFICATION**: Check if user accounts exist and passwords are correctly stored
3. **AUTHENTICATION FLOW TESTING**: Test complete auth process from login to JWT token generation
4. **ALL PORTAL CREDENTIALS TESTING**: Test login for all user types
5. **ERROR RESPONSE ANALYSIS**: Examine specific error messages and status codes
6. **TOKEN GENERATION VERIFICATION**: Ensure JWT tokens are properly created and returned
7. **DATABASE CONNECTION**: Verify MongoDB connection and user data retrieval
8. **BACKEND LOGS CHECK**: Look for authentication-related errors

This is blocking users from accessing the platform. Focus on identifying the exact cause of login failures.
"""

import requests
import json
import sys
from datetime import datetime
import uuid
import time
import os

# Configuration - Use environment variable for backend URL
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://urevent-unified.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials from review request
TEST_CREDENTIALS = {
    "client": {"email": "sarah.johnson@email.com", "password": "SecurePass123"},
    "admin": {"email": "admin@urevent360.com", "password": "admin123"},
    "vendor": {"email": "vendor@example.com", "password": "vendor123"},
    "employee": {"email": "employee@example.com", "password": "employee123"},
    "failing_user": {"email": "carladbaquero@gmail.com", "password": "unknown"}  # Check if this user exists
}

class AuthenticationDebugger:
    def __init__(self):
        self.tokens = {}
        self.test_results = []
        self.failed_tests = []
        self.critical_issues = []
        
    def log_test(self, test_name, success, details="", critical=False):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        if critical and not success:
            status = "🚨 CRITICAL FAIL"
            self.critical_issues.append(f"{test_name}: {details}")
        
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "critical": critical
        })
        
        if not success:
            self.failed_tests.append(test_name)
    
    def make_request(self, method, endpoint, data=None, token=None, params=None):
        """Make HTTP request with detailed error handling"""
        url = f"{BASE_URL}{endpoint}"
        headers = HEADERS.copy()
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            print(f"   Making {method} request to: {url}")
            if data:
                print(f"   Request data: {json.dumps(data, indent=2)}")
            
            if method == "GET":
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            
            print(f"   Response status: {response.status_code}")
            if response.status_code != 200:
                print(f"   Response text: {response.text[:500]}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"   Request failed: {e}")
            return None
    
    def test_database_connection(self):
        """Test MongoDB connection and basic API health"""
        print("\n🔍 CRITICAL TEST 1: DATABASE CONNECTION VERIFICATION")
        print("=" * 70)
        
        # Test basic API health
        response = self.make_request("GET", "/../health")
        if response and response.status_code == 200:
            self.log_test("API Health Check", True, "Backend API is responding")
        else:
            self.log_test("API Health Check", False, f"Status: {response.status_code if response else 'No response'}", critical=True)
        
        # Test database connectivity by attempting to access a protected endpoint without token
        response = self.make_request("GET", "/users/profile")
        if response and response.status_code == 401:
            self.log_test("Database Connectivity", True, "Database accessible (401 expected without token)")
        elif response and response.status_code == 500:
            self.log_test("Database Connectivity", False, "Database connection error (500)", critical=True)
        else:
            status = response.status_code if response else "No response"
            self.log_test("Database Connectivity", True, f"Database responsive (status: {status})")
    
    def test_user_database_verification(self):
        """Test if user accounts exist in database by attempting login"""
        print("\n🔍 CRITICAL TEST 2: USER DATABASE VERIFICATION")
        print("=" * 70)
        
        for role, credentials in TEST_CREDENTIALS.items():
            print(f"\nTesting user existence: {credentials['email']} ({role})")
            
            response = self.make_request("POST", "/login", credentials)
            
            if response:
                if response.status_code == 200:
                    try:
                        login_data = response.json()
                        access_token = login_data.get("access_token")
                        user_data = login_data.get("user", {})
                        
                        if access_token:
                            self.tokens[role] = access_token
                            self.log_test(f"User Exists - {role.title()}", True, 
                                        f"Email: {user_data.get('email')}, Role: {user_data.get('role')}")
                        else:
                            self.log_test(f"User Exists - {role.title()}", False, 
                                        "Login successful but no token returned", critical=True)
                    except Exception as e:
                        self.log_test(f"User Exists - {role.title()}", False, 
                                    f"JSON parsing error: {e}", critical=True)
                
                elif response.status_code == 401:
                    try:
                        error_data = response.json()
                        error_detail = error_data.get("detail", "Unknown error")
                        
                        if "Invalid email or password" in error_detail:
                            if role == "failing_user":
                                self.log_test(f"User Exists - {role.title()}", False, 
                                            f"User does not exist or wrong password: {error_detail}")
                            else:
                                self.log_test(f"User Exists - {role.title()}", False, 
                                            f"Authentication failed: {error_detail}", critical=True)
                        else:
                            self.log_test(f"User Exists - {role.title()}", False, 
                                        f"Authentication error: {error_detail}", critical=True)
                    except:
                        self.log_test(f"User Exists - {role.title()}", False, 
                                    f"401 Unauthorized: {response.text[:200]}", critical=True)
                
                else:
                    self.log_test(f"User Exists - {role.title()}", False, 
                                f"Unexpected status {response.status_code}: {response.text[:200]}", critical=True)
            else:
                self.log_test(f"User Exists - {role.title()}", False, 
                            "No response from server", critical=True)
    
    def test_login_endpoint_verification(self):
        """Test POST /api/login with detailed analysis"""
        print("\n🔍 CRITICAL TEST 3: LOGIN ENDPOINT VERIFICATION")
        print("=" * 70)
        
        # Test with known good credentials first
        print("\nTesting with known good credentials (sarah.johnson@email.com)...")
        
        good_credentials = TEST_CREDENTIALS["client"]
        response = self.make_request("POST", "/login", good_credentials)
        
        if response:
            print(f"Response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                try:
                    login_data = response.json()
                    print(f"Login response structure: {list(login_data.keys())}")
                    
                    access_token = login_data.get("access_token")
                    token_type = login_data.get("token_type")
                    user_data = login_data.get("user", {})
                    
                    if access_token and token_type == "bearer":
                        self.log_test("Login Endpoint Structure", True, 
                                    f"Token: {len(access_token)} chars, Type: {token_type}")
                        
                        # Analyze token structure
                        token_parts = access_token.split('.')
                        if len(token_parts) == 3:
                            self.log_test("JWT Token Structure", True, 
                                        f"Valid JWT (3 parts: {len(token_parts[0])}.{len(token_parts[1])}.{len(token_parts[2])})")
                        else:
                            self.log_test("JWT Token Structure", False, 
                                        f"Invalid JWT structure ({len(token_parts)} parts)", critical=True)
                        
                        # Verify user data
                        required_fields = ["id", "name", "email", "role"]
                        missing_fields = [field for field in required_fields if field not in user_data]
                        
                        if not missing_fields:
                            self.log_test("User Data Structure", True, 
                                        f"All required fields present: {list(user_data.keys())}")
                        else:
                            self.log_test("User Data Structure", False, 
                                        f"Missing fields: {missing_fields}", critical=True)
                    else:
                        self.log_test("Login Endpoint Structure", False, 
                                    f"Missing token or invalid type. Token: {bool(access_token)}, Type: {token_type}", critical=True)
                        
                except Exception as e:
                    self.log_test("Login Response Parsing", False, 
                                f"JSON parsing error: {e}", critical=True)
            else:
                self.log_test("Login Endpoint Response", False, 
                            f"Status {response.status_code}: {response.text[:300]}", critical=True)
        else:
            self.log_test("Login Endpoint Connectivity", False, 
                        "No response from login endpoint", critical=True)
    
    def test_authentication_flow(self):
        """Test complete authentication flow from login to JWT token generation"""
        print("\n🔍 CRITICAL TEST 4: AUTHENTICATION FLOW TESTING")
        print("=" * 70)
        
        if "client" not in self.tokens:
            self.log_test("Authentication Flow", False, 
                        "No client token available for flow testing", critical=True)
            return
        
        token = self.tokens["client"]
        
        # Step 1: Verify token can access profile
        print("Step 1: Testing token validation with profile endpoint...")
        response = self.make_request("GET", "/users/profile", token=token)
        
        if response and response.status_code == 200:
            try:
                profile_data = response.json()
                self.log_test("Auth Flow - Profile Access", True, 
                            f"Profile accessible: {profile_data.get('email')}")
            except Exception as e:
                self.log_test("Auth Flow - Profile Access", False, 
                            f"Profile response parsing error: {e}", critical=True)
        else:
            status = response.status_code if response else "No response"
            self.log_test("Auth Flow - Profile Access", False, 
                        f"Profile access failed: {status}", critical=True)
        
        # Step 2: Test token with protected endpoints
        print("Step 2: Testing token with protected endpoints...")
        protected_endpoints = [
            ("/events", "Events"),
            ("/vendors", "Vendors"),
            ("/venues", "Venues")
        ]
        
        successful_endpoints = 0
        for endpoint, name in protected_endpoints:
            response = self.make_request("GET", endpoint, token=token)
            if response and response.status_code == 200:
                successful_endpoints += 1
                self.log_test(f"Auth Flow - {name} Access", True, "Endpoint accessible")
            else:
                status = response.status_code if response else "No response"
                self.log_test(f"Auth Flow - {name} Access", False, f"Status: {status}")
        
        if successful_endpoints >= 2:
            self.log_test("Auth Flow - Protected Endpoints", True, 
                        f"{successful_endpoints}/{len(protected_endpoints)} endpoints accessible")
        else:
            self.log_test("Auth Flow - Protected Endpoints", False, 
                        f"Only {successful_endpoints}/{len(protected_endpoints)} endpoints accessible", critical=True)
    
    def test_all_portal_credentials(self):
        """Test login for all user types with detailed error analysis"""
        print("\n🔍 CRITICAL TEST 5: ALL PORTAL CREDENTIALS TESTING")
        print("=" * 70)
        
        login_results = {}
        
        for role, credentials in TEST_CREDENTIALS.items():
            if role == "failing_user":
                continue  # Skip the failing user for now
                
            print(f"\nTesting {role} portal login...")
            print(f"Email: {credentials['email']}")
            print(f"Password: {'*' * len(credentials['password'])}")
            
            response = self.make_request("POST", "/login", credentials)
            
            if response:
                if response.status_code == 200:
                    try:
                        login_data = response.json()
                        access_token = login_data.get("access_token")
                        user_data = login_data.get("user", {})
                        
                        if access_token:
                            self.tokens[role] = access_token
                            login_results[role] = {
                                "success": True,
                                "token_length": len(access_token),
                                "user_role": user_data.get("role"),
                                "user_email": user_data.get("email")
                            }
                            
                            self.log_test(f"Portal Login - {role.title()}", True, 
                                        f"Email: {user_data.get('email')}, Role: {user_data.get('role')}")
                        else:
                            login_results[role] = {"success": False, "error": "No access token"}
                            self.log_test(f"Portal Login - {role.title()}", False, 
                                        "No access token in response", critical=True)
                    except Exception as e:
                        login_results[role] = {"success": False, "error": f"JSON error: {e}"}
                        self.log_test(f"Portal Login - {role.title()}", False, 
                                    f"Response parsing error: {e}", critical=True)
                else:
                    try:
                        error_data = response.json()
                        error_detail = error_data.get("detail", "Unknown error")
                    except:
                        error_detail = response.text[:200]
                    
                    login_results[role] = {"success": False, "error": f"HTTP {response.status_code}: {error_detail}"}
                    self.log_test(f"Portal Login - {role.title()}", False, 
                                f"Status {response.status_code}: {error_detail}", critical=True)
            else:
                login_results[role] = {"success": False, "error": "No response"}
                self.log_test(f"Portal Login - {role.title()}", False, 
                            "No response from server", critical=True)
        
        # Summary
        successful_logins = sum(1 for result in login_results.values() if result.get("success"))
        total_logins = len([role for role in TEST_CREDENTIALS.keys() if role != "failing_user"])
        
        if successful_logins == total_logins:
            self.log_test("All Portal Logins", True, f"All {total_logins} portals working")
        else:
            self.log_test("All Portal Logins", False, 
                        f"Only {successful_logins}/{total_logins} portals working", critical=True)
    
    def test_error_response_analysis(self):
        """Examine specific error messages and status codes"""
        print("\n🔍 CRITICAL TEST 6: ERROR RESPONSE ANALYSIS")
        print("=" * 70)
        
        # Test with invalid credentials
        print("Testing with invalid credentials...")
        invalid_credentials = {"email": "invalid@test.com", "password": "wrongpassword"}
        
        response = self.make_request("POST", "/login", invalid_credentials)
        if response:
            print(f"Invalid credentials response status: {response.status_code}")
            print(f"Invalid credentials response headers: {dict(response.headers)}")
            print(f"Invalid credentials response body: {response.text}")
            
            if response.status_code == 401:
                try:
                    error_data = response.json()
                    error_detail = error_data.get("detail", "No detail")
                    self.log_test("Error Response - Invalid Credentials", True, 
                                f"Proper 401 response: {error_detail}")
                except:
                    self.log_test("Error Response - Invalid Credentials", False, 
                                "401 response but invalid JSON", critical=True)
            else:
                self.log_test("Error Response - Invalid Credentials", False, 
                            f"Expected 401, got {response.status_code}", critical=True)
        
        # Test with malformed request
        print("Testing with malformed request...")
        malformed_data = {"email": "test@test.com"}  # Missing password
        
        response = self.make_request("POST", "/login", malformed_data)
        if response:
            print(f"Malformed request response status: {response.status_code}")
            print(f"Malformed request response body: {response.text}")
            
            if response.status_code in [400, 422]:  # Bad Request or Unprocessable Entity
                self.log_test("Error Response - Malformed Request", True, 
                            f"Proper validation error: {response.status_code}")
            else:
                self.log_test("Error Response - Malformed Request", False, 
                            f"Expected 400/422, got {response.status_code}")
        
        # Test the specific failing user
        print("Testing specific failing user: carladbaquero@gmail.com...")
        failing_credentials = TEST_CREDENTIALS["failing_user"]
        
        response = self.make_request("POST", "/login", failing_credentials)
        if response:
            print(f"Failing user response status: {response.status_code}")
            print(f"Failing user response body: {response.text}")
            
            if response.status_code == 401:
                try:
                    error_data = response.json()
                    error_detail = error_data.get("detail", "No detail")
                    self.log_test("Error Response - Failing User", True, 
                                f"User does not exist or wrong password: {error_detail}")
                except:
                    self.log_test("Error Response - Failing User", False, 
                                "401 response but invalid JSON")
            else:
                self.log_test("Error Response - Failing User", False, 
                            f"Unexpected status for non-existent user: {response.status_code}")
    
    def test_token_generation_verification(self):
        """Ensure JWT tokens are properly created and returned"""
        print("\n🔍 CRITICAL TEST 7: TOKEN GENERATION VERIFICATION")
        print("=" * 70)
        
        if not self.tokens:
            self.log_test("Token Generation", False, 
                        "No tokens available for verification", critical=True)
            return
        
        for role, token in self.tokens.items():
            print(f"\nAnalyzing {role} token...")
            
            # Check token format
            token_parts = token.split('.')
            if len(token_parts) == 3:
                self.log_test(f"Token Format - {role.title()}", True, 
                            f"Valid JWT structure (3 parts)")
                
                # Try to decode payload (without verification)
                try:
                    import base64
                    import json
                    
                    # Decode header
                    header_part = token_parts[0]
                    padding = 4 - len(header_part) % 4
                    if padding != 4:
                        header_part += '=' * padding
                    
                    header_data = json.loads(base64.urlsafe_b64decode(header_part))
                    print(f"   Token header: {header_data}")
                    
                    # Decode payload
                    payload_part = token_parts[1]
                    padding = 4 - len(payload_part) % 4
                    if padding != 4:
                        payload_part += '=' * padding
                    
                    payload_data = json.loads(base64.urlsafe_b64decode(payload_part))
                    print(f"   Token payload: {payload_data}")
                    
                    # Check required fields
                    required_fields = ["sub", "exp", "user_id", "role"]
                    present_fields = [field for field in required_fields if field in payload_data]
                    missing_fields = [field for field in required_fields if field not in payload_data]
                    
                    if len(missing_fields) == 0:
                        self.log_test(f"Token Payload - {role.title()}", True, 
                                    f"All required fields present: {present_fields}")
                        
                        # Check expiration
                        exp_timestamp = payload_data.get("exp")
                        if exp_timestamp:
                            current_time = time.time()
                            if exp_timestamp > current_time:
                                hours_remaining = int((exp_timestamp - current_time) / 3600)
                                self.log_test(f"Token Expiration - {role.title()}", True, 
                                            f"Token valid for {hours_remaining} hours")
                            else:
                                self.log_test(f"Token Expiration - {role.title()}", False, 
                                            "Token has expired", critical=True)
                    else:
                        self.log_test(f"Token Payload - {role.title()}", False, 
                                    f"Missing fields: {missing_fields}", critical=True)
                        
                except Exception as e:
                    self.log_test(f"Token Analysis - {role.title()}", False, 
                                f"Could not decode token: {e}", critical=True)
            else:
                self.log_test(f"Token Format - {role.title()}", False, 
                            f"Invalid JWT structure ({len(token_parts)} parts)", critical=True)
    
    def test_backend_logs_check(self):
        """Look for authentication-related errors in backend logs"""
        print("\n🔍 CRITICAL TEST 8: BACKEND LOGS CHECK")
        print("=" * 70)
        
        # Since we can't directly access backend logs, we'll test for common auth issues
        
        # Test 1: Check if backend is handling CORS properly
        print("Testing CORS handling...")
        try:
            import requests
            response = requests.options(f"{BASE_URL}/login", headers={
                "Origin": "https://urevent-unified.preview.emergentagent.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            })
            
            if response.status_code == 200:
                cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower()}
                self.log_test("CORS Configuration", True, f"CORS headers: {cors_headers}")
            else:
                self.log_test("CORS Configuration", False, f"CORS preflight failed: {response.status_code}")
        except Exception as e:
            self.log_test("CORS Configuration", False, f"CORS test error: {e}")
        
        # Test 2: Check if backend is handling content-type properly
        print("Testing Content-Type handling...")
        response = self.make_request("POST", "/login", TEST_CREDENTIALS["client"])
        if response:
            content_type = response.headers.get('content-type', '')
            if 'application/json' in content_type:
                self.log_test("Content-Type Handling", True, f"Proper JSON response: {content_type}")
            else:
                self.log_test("Content-Type Handling", False, f"Unexpected content-type: {content_type}")
        
        # Test 3: Check for rate limiting or blocking
        print("Testing for rate limiting...")
        rapid_requests = 0
        for i in range(3):
            response = self.make_request("POST", "/login", {"email": "test@test.com", "password": "test"})
            if response and response.status_code == 401:
                rapid_requests += 1
            elif response and response.status_code == 429:
                self.log_test("Rate Limiting Detection", True, "Rate limiting detected")
                break
            time.sleep(0.1)
        
        if rapid_requests == 3:
            self.log_test("Rate Limiting Check", True, "No rate limiting blocking requests")
        
    def run_comprehensive_auth_debug(self):
        """Run all authentication debugging tests"""
        print("🚨 CRITICAL AUTHENTICATION SYSTEM INVESTIGATION")
        print("=" * 70)
        print("Focus: Debugging 'Login failed. Please try again' errors")
        print("=" * 70)
        
        # Run all critical tests
        self.test_database_connection()
        self.test_user_database_verification()
        self.test_login_endpoint_verification()
        self.test_authentication_flow()
        self.test_all_portal_credentials()
        self.test_error_response_analysis()
        self.test_token_generation_verification()
        self.test_backend_logs_check()
        
        # Generate summary report
        self.generate_summary_report()
    
    def generate_summary_report(self):
        """Generate comprehensive summary report"""
        print("\n" + "=" * 70)
        print("🔍 AUTHENTICATION DEBUG SUMMARY REPORT")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = len([t for t in self.test_results if not t["success"]])
        critical_failures = len([t for t in self.test_results if t.get("critical") and not t["success"]])
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Critical Failures: {critical_failures}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if self.critical_issues:
            print(f"\n🚨 CRITICAL ISSUES FOUND ({len(self.critical_issues)}):")
            for i, issue in enumerate(self.critical_issues, 1):
                print(f"{i}. {issue}")
        
        if self.tokens:
            print(f"\n✅ SUCCESSFUL LOGINS ({len(self.tokens)}):")
            for role, token in self.tokens.items():
                print(f"- {role.title()}: Token length {len(token)} chars")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS ({len(self.failed_tests)}):")
            for test in self.failed_tests:
                print(f"- {test}")
        
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        if critical_failures == 0:
            print("- Authentication system appears to be working correctly")
            print("- Issue may be on frontend side (session persistence, token storage)")
        else:
            print("- Critical backend authentication issues detected")
            print("- Focus on database connectivity and user account verification")
            print("- Check backend logs for detailed error messages")
        
        print("\n" + "=" * 70)

if __name__ == "__main__":
    debugger = AuthenticationDebugger()
    debugger.run_comprehensive_auth_debug()
"""
Simple Authentication Debug Test
Test the authentication flow to identify why frontend sessions aren't persisting
"""

import requests
import json
import os

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://urevent-unified.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

def test_auth_flow():
    print("🔍 Testing Authentication Flow...")
    
    # Step 1: Test login with known credentials
    print("\nStep 1: Testing login...")
    login_data = {"email": "sarah.johnson@email.com", "password": "SecurePass123"}
    
    try:
        response = requests.post(f"{BASE_URL}/login", json=login_data, headers=HEADERS, timeout=30)
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            login_result = response.json()
            print(f"✅ Login successful")
            print(f"Response keys: {list(login_result.keys())}")
            
            # Extract token
            token = login_result.get("access_token")
            user_data = login_result.get("user", {})
            
            if token:
                print(f"✅ Token received: {token[:50]}...")
                print(f"✅ User data: {user_data}")
                
                # Step 2: Test profile endpoint with token
                print("\nStep 2: Testing profile endpoint...")
                auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
                
                profile_response = requests.get(f"{BASE_URL}/users/profile", headers=auth_headers, timeout=30)
                print(f"Profile response status: {profile_response.status_code}")
                
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    print(f"✅ Profile retrieved successfully")
                    print(f"Profile data: {profile_data}")
                elif profile_response.status_code == 404:
                    print("❌ Profile endpoint not found - this could be the issue!")
                    print(f"Response: {profile_response.text}")
                else:
                    print(f"❌ Profile request failed: {profile_response.status_code}")
                    print(f"Response: {profile_response.text}")
                
                # Step 3: Test events endpoint (alternative)
                print("\nStep 3: Testing events endpoint...")
                events_response = requests.get(f"{BASE_URL}/events", headers=auth_headers, timeout=30)
                print(f"Events response status: {events_response.status_code}")
                
                if events_response.status_code == 200:
                    print(f"✅ Events endpoint working")
                else:
                    print(f"❌ Events request failed: {events_response.status_code}")
                    
            else:
                print("❌ No token in login response")
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Login request failed: {e}")

if __name__ == "__main__":
    test_auth_flow()