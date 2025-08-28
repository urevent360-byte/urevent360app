#!/usr/bin/env python3
"""
CRITICAL API ENDPOINT TESTING: Venue and Vendor Search Endpoints for InteractiveEventPlanner

CONTEXT: User reports that in InteractiveEventPlanner:
1. Venue "Select Now" doesn't work or shows errors
2. No vendor results appear when clicking service tiles

The frontend is calling these endpoints but they're failing. Need to verify API functionality.

TESTING REQUIREMENTS:
1. Test Venue Search Endpoint: GET /api/venues/search
2. Test Vendor Search Endpoint: GET /api/vendors/search  
3. Test Authentication with JWT tokens
4. Test Response Format validation
5. Check Alternative Endpoints: /api/venues and /api/vendors

SUCCESS CRITERIA:
- ✅ Venue search endpoint returns 200 status (not 404/500)
- ✅ Vendor search endpoint returns 200 status (not 404/500)
- ✅ Endpoints return proper JSON arrays (empty or with data)
- ✅ Authentication works correctly
- ✅ No server errors in backend logs
"""

import requests
import json
import sys
from datetime import datetime
import uuid
import time
import os

# Configuration - Use environment variable for backend URL
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
TEST_CREDENTIALS = {
    "client": {"email": "carladbaquero@gmail.com", "password": "carla123"}
}

class VenueVendorSearchTester:
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
    
    def authenticate_client(self):
        """Authenticate client user and get JWT token"""
        print("\n🔐 Authenticating Client User...")
        
        credentials = TEST_CREDENTIALS["client"]
        response = self.make_request("POST", "/login", credentials)
        
        if response and response.status_code == 200:
            login_data = response.json()
            access_token = login_data.get("access_token")
            if access_token:
                self.tokens["client"] = access_token
                user_data = login_data.get("user", {})
                self.log_test("Client Authentication", True, 
                            f"User: {user_data.get('name')} ({user_data.get('email')}), Token: {len(access_token)} chars")
                return True
        
        self.log_test("Client Authentication", False, "Failed to authenticate client")
        return False
    
    def test_venue_search_endpoint(self):
        """Test Venue Search Endpoint: GET /api/venues/search"""
        print("\n🏛️ TESTING VENUE SEARCH ENDPOINT")
        print("=" * 60)
        
        token = self.tokens.get("client")
        if not token:
            self.log_test("Venue Search - No Token", False, "No authentication token available")
            return
        
        # Test 1: Basic venue search with typical parameters
        print("   Test 1: Basic venue search with Orlando parameters...")
        params = {
            "city": "Orlando",
            "venue_type": "Hotel/Banquet Hall",
            "capacity_min": 90,
            "radius": 30
        }
        
        response = self.make_request("GET", "/venues/search", token=token, params=params)
        
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        self.log_test("Venue Search - Basic Orlando Search", True, 
                                    f"Status: 200, Response: {len(data)} venues returned")
                        
                        # Test response format
                        if len(data) > 0:
                            venue = data[0]
                            required_fields = ["id", "name", "location", "venue_type", "capacity"]
                            missing_fields = [field for field in required_fields if field not in venue]
                            
                            if not missing_fields:
                                self.log_test("Venue Search - Response Format", True, 
                                            f"Venue objects have required fields: {list(venue.keys())}")
                            else:
                                self.log_test("Venue Search - Response Format", False, 
                                            f"Missing required fields: {missing_fields}")
                        else:
                            self.log_test("Venue Search - Empty Results", True, 
                                        "Empty array returned (valid response)")
                    else:
                        self.log_test("Venue Search - Basic Orlando Search", False, 
                                    f"Response is not an array: {type(data)}")
                except Exception as e:
                    self.log_test("Venue Search - Basic Orlando Search", False, 
                                f"JSON parsing error: {e}")
            else:
                self.log_test("Venue Search - Basic Orlando Search", False, 
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
        else:
            self.log_test("Venue Search - Basic Orlando Search", False, "No response received")
        
        # Test 2: Venue search with date parameter
        print("   Test 2: Venue search with date parameter...")
        params = {
            "city": "Orlando",
            "venue_type": "Hotel/Banquet Hall",
            "capacity_min": 90,
            "date": "2025-08-30",
            "radius": 30
        }
        
        response = self.make_request("GET", "/venues/search", token=token, params=params)
        
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.log_test("Venue Search - With Date Parameter", True, 
                                f"Status: 200, Response: {len(data) if isinstance(data, list) else 'Not array'} venues")
                except Exception as e:
                    self.log_test("Venue Search - With Date Parameter", False, 
                                f"JSON parsing error: {e}")
            else:
                self.log_test("Venue Search - With Date Parameter", False, 
                            f"Status: {response.status_code}")
        else:
            self.log_test("Venue Search - With Date Parameter", False, "No response received")
        
        # Test 3: Venue search with different venue types
        print("   Test 3: Venue search with different venue types...")
        venue_types = ["Restaurant", "Outdoor/Garden", "Community Center"]
        
        for venue_type in venue_types:
            params = {
                "city": "Orlando",
                "venue_type": venue_type,
                "capacity_min": 50
            }
            
            response = self.make_request("GET", "/venues/search", token=token, params=params)
            
            if response and response.status_code == 200:
                try:
                    data = response.json()
                    self.log_test(f"Venue Search - {venue_type}", True, 
                                f"Status: 200, {len(data) if isinstance(data, list) else 'Invalid'} venues")
                except Exception as e:
                    self.log_test(f"Venue Search - {venue_type}", False, f"JSON error: {e}")
            else:
                status = response.status_code if response else "No response"
                self.log_test(f"Venue Search - {venue_type}", False, f"Status: {status}")
        
        # Test 4: Venue search without authentication
        print("   Test 4: Venue search without authentication...")
        params = {"city": "Orlando", "venue_type": "Hotel"}
        
        response = self.make_request("GET", "/venues/search", params=params)  # No token
        
        if response:
            if response.status_code == 401:
                self.log_test("Venue Search - No Auth", True, "Properly requires authentication (401)")
            elif response.status_code == 200:
                self.log_test("Venue Search - No Auth", False, "Should require authentication but doesn't")
            else:
                self.log_test("Venue Search - No Auth", False, f"Unexpected status: {response.status_code}")
        else:
            self.log_test("Venue Search - No Auth", False, "No response received")
    
    def test_vendor_search_endpoint(self):
        """Test Vendor Search Endpoint: GET /api/vendors/search"""
        print("\n👥 TESTING VENDOR SEARCH ENDPOINT")
        print("=" * 60)
        
        token = self.tokens.get("client")
        if not token:
            self.log_test("Vendor Search - No Token", False, "No authentication token available")
            return
        
        # Test 1: Basic vendor search with catering service
        print("   Test 1: Basic vendor search for catering in Orlando...")
        params = {
            "service_type": "catering",
            "location": "Orlando",
            "guest_count": 90,
            "event_type": "sweet_16"
        }
        
        response = self.make_request("GET", "/vendors/search", token=token, params=params)
        
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        self.log_test("Vendor Search - Basic Catering Search", True, 
                                    f"Status: 200, Response: {len(data)} vendors returned")
                        
                        # Test response format
                        if len(data) > 0:
                            vendor = data[0]
                            required_fields = ["id", "name", "service_type", "location"]
                            missing_fields = [field for field in required_fields if field not in vendor]
                            
                            if not missing_fields:
                                self.log_test("Vendor Search - Response Format", True, 
                                            f"Vendor objects have required fields: {list(vendor.keys())}")
                            else:
                                self.log_test("Vendor Search - Response Format", False, 
                                            f"Missing required fields: {missing_fields}")
                        else:
                            self.log_test("Vendor Search - Empty Results", True, 
                                        "Empty array returned (valid response)")
                    else:
                        self.log_test("Vendor Search - Basic Catering Search", False, 
                                    f"Response is not an array: {type(data)}")
                except Exception as e:
                    self.log_test("Vendor Search - Basic Catering Search", False, 
                                f"JSON parsing error: {e}")
            else:
                self.log_test("Vendor Search - Basic Catering Search", False, 
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
        else:
            self.log_test("Vendor Search - Basic Catering Search", False, "No response received")
        
        # Test 2: Vendor search with different service types
        print("   Test 2: Vendor search with different service types...")
        service_types = ["photography", "decoration", "music/dj", "videography"]
        
        for service_type in service_types:
            params = {
                "service_type": service_type,
                "location": "Orlando",
                "guest_count": 90
            }
            
            response = self.make_request("GET", "/vendors/search", token=token, params=params)
            
            if response and response.status_code == 200:
                try:
                    data = response.json()
                    self.log_test(f"Vendor Search - {service_type.title()}", True, 
                                f"Status: 200, {len(data) if isinstance(data, list) else 'Invalid'} vendors")
                except Exception as e:
                    self.log_test(f"Vendor Search - {service_type.title()}", False, f"JSON error: {e}")
            else:
                status = response.status_code if response else "No response"
                self.log_test(f"Vendor Search - {service_type.title()}", False, f"Status: {status}")
        
        # Test 3: Vendor search with budget parameters
        print("   Test 3: Vendor search with budget parameters...")
        params = {
            "service_type": "catering",
            "location": "Orlando",
            "budget_min": 1000,
            "budget_max": 5000
        }
        
        response = self.make_request("GET", "/vendors/search", token=token, params=params)
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                self.log_test("Vendor Search - With Budget", True, 
                            f"Status: 200, {len(data) if isinstance(data, list) else 'Invalid'} vendors")
            except Exception as e:
                self.log_test("Vendor Search - With Budget", False, f"JSON error: {e}")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Vendor Search - With Budget", False, f"Status: {status}")
        
        # Test 4: Vendor search with cultural style
        print("   Test 4: Vendor search with cultural style...")
        params = {
            "service_type": "catering",
            "location": "Orlando",
            "cultural_style": "american"
        }
        
        response = self.make_request("GET", "/vendors/search", token=token, params=params)
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                self.log_test("Vendor Search - With Cultural Style", True, 
                            f"Status: 200, {len(data) if isinstance(data, list) else 'Invalid'} vendors")
            except Exception as e:
                self.log_test("Vendor Search - With Cultural Style", False, f"JSON error: {e}")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Vendor Search - With Cultural Style", False, f"Status: {status}")
        
        # Test 5: Vendor search without authentication
        print("   Test 5: Vendor search without authentication...")
        params = {"service_type": "catering", "location": "Orlando"}
        
        response = self.make_request("GET", "/vendors/search", params=params)  # No token
        
        if response:
            if response.status_code == 401:
                self.log_test("Vendor Search - No Auth", True, "Properly requires authentication (401)")
            elif response.status_code == 200:
                self.log_test("Vendor Search - No Auth", False, "Should require authentication but doesn't")
            else:
                self.log_test("Vendor Search - No Auth", False, f"Unexpected status: {response.status_code}")
        else:
            self.log_test("Vendor Search - No Auth", False, "No response received")
    
    def test_alternative_endpoints(self):
        """Test Alternative Endpoints: /api/venues and /api/vendors"""
        print("\n🔄 TESTING ALTERNATIVE ENDPOINTS")
        print("=" * 60)
        
        token = self.tokens.get("client")
        if not token:
            self.log_test("Alternative Endpoints - No Token", False, "No authentication token available")
            return
        
        # Test 1: GET /api/venues endpoint
        print("   Test 1: GET /api/venues endpoint...")
        response = self.make_request("GET", "/venues", token=token)
        
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        self.log_test("Alternative - GET /api/venues", True, 
                                    f"Status: 200, {len(data)} venues returned")
                    else:
                        self.log_test("Alternative - GET /api/venues", False, 
                                    f"Response is not an array: {type(data)}")
                except Exception as e:
                    self.log_test("Alternative - GET /api/venues", False, f"JSON error: {e}")
            else:
                self.log_test("Alternative - GET /api/venues", False, f"Status: {response.status_code}")
        else:
            self.log_test("Alternative - GET /api/venues", False, "No response received")
        
        # Test 2: GET /api/vendors endpoint
        print("   Test 2: GET /api/vendors endpoint...")
        response = self.make_request("GET", "/vendors", token=token)
        
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        self.log_test("Alternative - GET /api/vendors", True, 
                                    f"Status: 200, {len(data)} vendors returned")
                    else:
                        self.log_test("Alternative - GET /api/vendors", False, 
                                    f"Response is not an array: {type(data)}")
                except Exception as e:
                    self.log_test("Alternative - GET /api/vendors", False, f"JSON error: {e}")
            else:
                self.log_test("Alternative - GET /api/vendors", False, f"Status: {response.status_code}")
        else:
            self.log_test("Alternative - GET /api/vendors", False, "No response received")
        
        # Test 3: GET /api/venues with parameters
        print("   Test 3: GET /api/venues with parameters...")
        params = {
            "location": "Orlando",
            "venue_type": "Hotel",
            "min_capacity": 50
        }
        
        response = self.make_request("GET", "/venues", token=token, params=params)
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                self.log_test("Alternative - GET /api/venues with params", True, 
                            f"Status: 200, {len(data) if isinstance(data, list) else 'Invalid'} venues")
            except Exception as e:
                self.log_test("Alternative - GET /api/venues with params", False, f"JSON error: {e}")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Alternative - GET /api/venues with params", False, f"Status: {status}")
        
        # Test 4: GET /api/vendors with parameters
        print("   Test 4: GET /api/vendors with parameters...")
        params = {
            "service_type": "catering",
            "location": "Orlando",
            "budget_min": 1000
        }
        
        response = self.make_request("GET", "/vendors", token=token, params=params)
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                self.log_test("Alternative - GET /api/vendors with params", True, 
                            f"Status: 200, {len(data) if isinstance(data, list) else 'Invalid'} vendors")
            except Exception as e:
                self.log_test("Alternative - GET /api/vendors with params", False, f"JSON error: {e}")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Alternative - GET /api/vendors with params", False, f"Status: {status}")
    
    def test_authentication_headers(self):
        """Test Authentication Headers and JWT Token Validation"""
        print("\n🔐 TESTING AUTHENTICATION HEADERS")
        print("=" * 60)
        
        token = self.tokens.get("client")
        if not token:
            self.log_test("Auth Headers - No Token", False, "No authentication token available")
            return
        
        # Test 1: Valid JWT token structure
        print("   Test 1: JWT token structure validation...")
        token_parts = token.split('.')
        if len(token_parts) == 3:
            self.log_test("JWT Token Structure", True, f"Valid JWT structure (3 parts)")
            
            # Test token length (should be substantial)
            if len(token) > 100:
                self.log_test("JWT Token Length", True, f"Token length: {len(token)} characters")
            else:
                self.log_test("JWT Token Length", False, f"Token too short: {len(token)} characters")
        else:
            self.log_test("JWT Token Structure", False, f"Invalid JWT structure: {len(token_parts)} parts")
        
        # Test 2: Authorization header format
        print("   Test 2: Authorization header format...")
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        # Make a simple request to test header format
        response = requests.get(f"{BASE_URL}/users/profile", headers=headers, timeout=30)
        
        if response and response.status_code == 200:
            self.log_test("Authorization Header Format", True, "Bearer token format accepted")
        elif response and response.status_code == 401:
            self.log_test("Authorization Header Format", False, "Bearer token rejected (401)")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Authorization Header Format", False, f"Unexpected status: {status}")
        
        # Test 3: Invalid token handling
        print("   Test 3: Invalid token handling...")
        invalid_headers = {"Authorization": "Bearer invalid_token_123", "Content-Type": "application/json"}
        
        response = requests.get(f"{BASE_URL}/users/profile", headers=invalid_headers, timeout=30)
        
        if response and response.status_code == 401:
            self.log_test("Invalid Token Handling", True, "Invalid token properly rejected (401)")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Invalid Token Handling", False, f"Invalid token not rejected: {status}")
        
        # Test 4: Missing Authorization header
        print("   Test 4: Missing Authorization header...")
        no_auth_headers = {"Content-Type": "application/json"}
        
        response = requests.get(f"{BASE_URL}/users/profile", headers=no_auth_headers, timeout=30)
        
        if response and response.status_code == 401:
            self.log_test("Missing Auth Header", True, "Missing auth header properly rejected (401)")
        elif response and response.status_code == 403:
            self.log_test("Missing Auth Header", True, "Missing auth header properly rejected (403)")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Missing Auth Header", False, f"Missing auth not rejected: {status}")
    
    def run_comprehensive_tests(self):
        """Run all comprehensive venue and vendor search tests"""
        print("\n🚀 STARTING CRITICAL VENUE & VENDOR SEARCH ENDPOINT TESTING")
        print("=" * 80)
        print("CONTEXT: Frontend InteractiveEventPlanner venue/vendor search failing")
        print("GOAL: Verify all search endpoints are working correctly")
        print("=" * 80)
        
        # Step 1: Authenticate
        if not self.authenticate_client():
            print("\n❌ CRITICAL: Authentication failed - cannot proceed with tests")
            return
        
        # Step 2: Test Venue Search Endpoint
        self.test_venue_search_endpoint()
        
        # Step 3: Test Vendor Search Endpoint
        self.test_vendor_search_endpoint()
        
        # Step 4: Test Alternative Endpoints
        self.test_alternative_endpoints()
        
        # Step 5: Test Authentication Headers
        self.test_authentication_headers()
        
        # Print comprehensive summary
        print("\n📊 COMPREHENSIVE VENUE & VENDOR SEARCH TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        # Critical endpoint status
        venue_search_tests = [t for t in self.test_results if "Venue Search" in t["test"]]
        vendor_search_tests = [t for t in self.test_results if "Vendor Search" in t["test"]]
        
        venue_passed = sum(1 for t in venue_search_tests if t["success"])
        vendor_passed = sum(1 for t in vendor_search_tests if t["success"])
        
        print(f"\n🏛️ VENUE SEARCH ENDPOINT STATUS:")
        if venue_passed >= len(venue_search_tests) * 0.8:  # 80% success rate
            print("✅ VENUE SEARCH ENDPOINTS ARE WORKING")
        else:
            print("❌ VENUE SEARCH ENDPOINTS HAVE ISSUES")
        
        print(f"\n👥 VENDOR SEARCH ENDPOINT STATUS:")
        if vendor_passed >= len(vendor_search_tests) * 0.8:  # 80% success rate
            print("✅ VENDOR SEARCH ENDPOINTS ARE WORKING")
        else:
            print("❌ VENDOR SEARCH ENDPOINTS HAVE ISSUES")
        
        if self.failed_tests:
            print(f"\n❌ CRITICAL ISSUES FOUND:")
            for test_name in self.failed_tests:
                print(f"   - {test_name}")
        else:
            print(f"\n✅ ALL VENUE & VENDOR SEARCH TESTS PASSED!")
        
        print(f"\n🎯 OVERALL API ENDPOINT STATUS:")
        if passed_tests >= total_tests * 0.85:  # 85% success rate
            print("✅ VENUE & VENDOR SEARCH ENDPOINTS ARE OPERATIONAL")
            print("✅ Frontend InteractiveEventPlanner should be able to access these APIs")
            print("✅ Authentication is working correctly")
            print("✅ Response formats are valid JSON arrays")
        else:
            print("❌ VENUE & VENDOR SEARCH ENDPOINTS HAVE CRITICAL ISSUES")
            print("❌ Frontend InteractiveEventPlanner failures likely due to backend API problems")
        
        return passed_tests, total_tests

def main():
    """Main function to run the tests"""
    print("🔍 CRITICAL API ENDPOINT TESTING: Venue and Vendor Search Endpoints")
    print("=" * 80)
    
    tester = VenueVendorSearchTester()
    passed, total = tester.run_comprehensive_tests()
    
    print(f"\n🏁 FINAL RESULT: {passed}/{total} tests passed ({(passed/total*100):.1f}%)")
    
    if passed >= total * 0.85:
        print("✅ SUCCESS: Venue and vendor search endpoints are working correctly")
        sys.exit(0)
    else:
        print("❌ FAILURE: Critical issues found in venue and vendor search endpoints")
        sys.exit(1)

if __name__ == "__main__":
    main()