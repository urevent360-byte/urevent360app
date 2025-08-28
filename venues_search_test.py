#!/usr/bin/env python3
"""
VENUES SEARCH API ENDPOINT TESTING
Focus: Testing venues search API endpoint that's returning 0 results despite 5 venues existing in database

CRITICAL ISSUE: InteractiveEventPlanner "Select Now" buttons are making API calls to /api/venues/search 
but finding 0 results despite 5 venues existing in the database (Grand Ballroom Hotel, Sunset Garden Venue, etc.)

PRIORITY TESTING:
1. GET /api/venues/search with no parameters - should return all venues
2. GET /api/venues/search with basic filters like location 
3. Verify the response format and data structure
4. Check if authentication headers are required and working
5. Test with the user credentials: carladbaquero@gmail.com / carla123

GOAL: Identify if it's a search logic issue, authentication issue, or parameter filtering issue.
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

# Test credentials from review request
TEST_CREDENTIALS = {
    "email": "carladbaquero@gmail.com", 
    "password": "carla123"
}

class VenuesSearchTester:
    def __init__(self):
        self.token = None
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
    
    def authenticate(self):
        """Authenticate with the provided credentials"""
        print("\n🔐 Testing Authentication...")
        
        response = self.make_request("POST", "/login", TEST_CREDENTIALS)
        
        if response and response.status_code == 200:
            try:
                login_data = response.json()
                access_token = login_data.get("access_token")
                user_data = login_data.get("user", {})
                
                if access_token and len(access_token) > 100:
                    self.token = access_token
                    user_name = user_data.get("name", "Unknown")
                    user_role = user_data.get("role", "unknown")
                    
                    self.log_test("Authentication", True, 
                                f"User: {user_name}, Role: {user_role}, Token: {len(access_token)} chars")
                    return True
                else:
                    self.log_test("Authentication", False, "Invalid or missing access token")
                    return False
                    
            except Exception as e:
                self.log_test("Authentication", False, f"JSON parsing error: {e}")
                return False
                
        elif response and response.status_code == 401:
            self.log_test("Authentication", False, "Invalid credentials (401)")
            return False
        else:
            status_code = response.status_code if response else "No response"
            self.log_test("Authentication", False, f"Login failed: {status_code}")
            return False
    
    def test_venues_search_no_params(self):
        """Test GET /api/venues/search with no parameters - should return all venues"""
        print("\n🏛️ Testing Venues Search - No Parameters...")
        
        response = self.make_request("GET", "/venues/search", token=self.token)
        
        if response:
            print(f"   Status Code: {response.status_code}")
            print(f"   Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                try:
                    venues_data = response.json()
                    print(f"   Response Type: {type(venues_data)}")
                    print(f"   Response Content: {json.dumps(venues_data, indent=2)[:500]}...")
                    
                    if isinstance(venues_data, list):
                        venue_count = len(venues_data)
                        self.log_test("Venues Search - No Parameters", True, 
                                    f"Found {venue_count} venues, Response format: JSON array")
                        
                        # Check for specific venues mentioned in the review
                        venue_names = [venue.get("name", "") for venue in venues_data if isinstance(venue, dict)]
                        print(f"   Venue Names Found: {venue_names}")
                        
                        expected_venues = ["Grand Ballroom Hotel", "Sunset Garden Venue"]
                        found_expected = [name for name in expected_venues if any(name in venue_name for venue_name in venue_names)]
                        
                        if found_expected:
                            self.log_test("Expected Venues Found", True, f"Found: {found_expected}")
                        else:
                            self.log_test("Expected Venues Found", False, f"Expected venues not found. Available: {venue_names}")
                        
                        # Analyze venue structure
                        if venues_data and isinstance(venues_data[0], dict):
                            sample_venue = venues_data[0]
                            venue_fields = list(sample_venue.keys())
                            self.log_test("Venue Data Structure", True, f"Fields: {venue_fields}")
                        
                        return venue_count
                    else:
                        self.log_test("Venues Search - No Parameters", False, 
                                    f"Expected JSON array, got: {type(venues_data)}")
                        return 0
                        
                except Exception as e:
                    self.log_test("Venues Search - No Parameters", False, f"JSON parsing error: {e}")
                    print(f"   Raw Response: {response.text[:500]}...")
                    return 0
            else:
                self.log_test("Venues Search - No Parameters", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                return 0
        else:
            self.log_test("Venues Search - No Parameters", False, "No response received")
            return 0
    
    def test_venues_search_with_location(self):
        """Test GET /api/venues/search with location filters"""
        print("\n🌍 Testing Venues Search - With Location Filters...")
        
        # Test different location parameters
        location_tests = [
            {"city": "Orlando", "test_name": "City Filter - Orlando"},
            {"zip_code": "32801", "test_name": "ZIP Code Filter - Orlando"},
            {"city": "New York", "test_name": "City Filter - New York"},
            {"zip_code": "10001", "test_name": "ZIP Code Filter - NYC"},
            {"city": "Los Angeles", "test_name": "City Filter - Los Angeles"}
        ]
        
        for location_test in location_tests:
            params = {k: v for k, v in location_test.items() if k != "test_name"}
            test_name = location_test["test_name"]
            
            print(f"   Testing {test_name} with params: {params}")
            
            response = self.make_request("GET", "/venues/search", token=self.token, params=params)
            
            if response and response.status_code == 200:
                try:
                    venues_data = response.json()
                    venue_count = len(venues_data) if isinstance(venues_data, list) else 0
                    
                    self.log_test(test_name, True, f"Found {venue_count} venues")
                    
                    if venues_data and isinstance(venues_data, list) and len(venues_data) > 0:
                        # Check if venues match location criteria
                        sample_venue = venues_data[0]
                        venue_location = sample_venue.get("location", "")
                        print(f"     Sample venue location: {venue_location}")
                        
                except Exception as e:
                    self.log_test(test_name, False, f"JSON parsing error: {e}")
            else:
                status_code = response.status_code if response else "No response"
                self.log_test(test_name, False, f"Request failed: {status_code}")
    
    def test_venues_search_with_filters(self):
        """Test GET /api/venues/search with various filters"""
        print("\n🔍 Testing Venues Search - With Various Filters...")
        
        filter_tests = [
            {
                "venue_type": "hotel", 
                "test_name": "Venue Type Filter - Hotel"
            },
            {
                "venue_type": "restaurant", 
                "test_name": "Venue Type Filter - Restaurant"
            },
            {
                "capacity_min": 50, 
                "capacity_max": 200, 
                "test_name": "Capacity Filter - 50-200 guests"
            },
            {
                "budget_min": 50, 
                "budget_max": 150, 
                "test_name": "Budget Filter - $50-150 per person"
            },
            {
                "preferred_venue_type": "Hotel/Banquet Hall", 
                "test_name": "Preferred Venue Type Filter"
            }
        ]
        
        for filter_test in filter_tests:
            params = {k: v for k, v in filter_test.items() if k != "test_name"}
            test_name = filter_test["test_name"]
            
            print(f"   Testing {test_name} with params: {params}")
            
            response = self.make_request("GET", "/venues/search", token=self.token, params=params)
            
            if response and response.status_code == 200:
                try:
                    venues_data = response.json()
                    venue_count = len(venues_data) if isinstance(venues_data, list) else 0
                    
                    self.log_test(test_name, True, f"Found {venue_count} venues")
                    
                    if venues_data and isinstance(venues_data, list) and len(venues_data) > 0:
                        # Analyze first venue to check if filters are working
                        sample_venue = venues_data[0]
                        venue_type = sample_venue.get("venue_type", "")
                        capacity = sample_venue.get("capacity", 0)
                        price_per_person = sample_venue.get("price_per_person", 0)
                        
                        print(f"     Sample venue - Type: {venue_type}, Capacity: {capacity}, Price: ${price_per_person}")
                        
                except Exception as e:
                    self.log_test(test_name, False, f"JSON parsing error: {e}")
            else:
                status_code = response.status_code if response else "No response"
                self.log_test(test_name, False, f"Request failed: {status_code}")
    
    def test_venues_search_without_auth(self):
        """Test if authentication is required for venues search"""
        print("\n🔓 Testing Venues Search - Without Authentication...")
        
        response = self.make_request("GET", "/venues/search")  # No token
        
        if response:
            if response.status_code == 200:
                try:
                    venues_data = response.json()
                    venue_count = len(venues_data) if isinstance(venues_data, list) else 0
                    self.log_test("Venues Search - No Auth", True, 
                                f"Authentication not required, found {venue_count} venues")
                except Exception as e:
                    self.log_test("Venues Search - No Auth", False, f"JSON parsing error: {e}")
            elif response.status_code == 401:
                self.log_test("Venues Search - No Auth", True, 
                            "Authentication required (401) - This is expected behavior")
            else:
                self.log_test("Venues Search - No Auth", False, 
                            f"Unexpected status: {response.status_code}")
        else:
            self.log_test("Venues Search - No Auth", False, "No response received")
    
    def test_alternative_venues_endpoints(self):
        """Test alternative venues endpoints"""
        print("\n🔄 Testing Alternative Venues Endpoints...")
        
        # Test GET /api/venues (without /search)
        response = self.make_request("GET", "/venues", token=self.token)
        
        if response and response.status_code == 200:
            try:
                venues_data = response.json()
                venue_count = len(venues_data) if isinstance(venues_data, list) else 0
                self.log_test("Alternative Venues Endpoint (/venues)", True, 
                            f"Found {venue_count} venues")
                
                if venue_count > 0:
                    print("   ✅ Alternative endpoint has venues - search endpoint issue confirmed")
                else:
                    print("   ⚠️ Alternative endpoint also has no venues - database issue")
                    
            except Exception as e:
                self.log_test("Alternative Venues Endpoint (/venues)", False, f"JSON parsing error: {e}")
        else:
            status_code = response.status_code if response else "No response"
            self.log_test("Alternative Venues Endpoint (/venues)", False, f"Request failed: {status_code}")
    
    def create_test_venues(self):
        """Create test venues to verify database connectivity"""
        print("\n🏗️ Creating Test Venues...")
        
        test_venues = [
            {
                "name": "Grand Ballroom Hotel",
                "description": "Elegant hotel ballroom perfect for weddings and events",
                "location": "Orlando, FL",
                "venue_type": "Hotel",
                "capacity": 200,
                "price_per_person": 120.0,
                "amenities": ["Parking", "Catering Kitchen", "Dance Floor"],
                "rating": 4.5,
                "contact_info": {"phone": "407-555-0123", "email": "events@grandballroom.com"}
            },
            {
                "name": "Sunset Garden Venue",
                "description": "Beautiful outdoor garden venue with covered pavilion",
                "location": "Orlando, FL", 
                "venue_type": "Garden",
                "capacity": 150,
                "price_per_person": 95.0,
                "amenities": ["Garden Setting", "Covered Pavilion", "Bridal Suite"],
                "rating": 4.3,
                "contact_info": {"phone": "407-555-0456", "email": "info@sunsetgarden.com"}
            },
            {
                "name": "Downtown Conference Center",
                "description": "Modern conference center in the heart of downtown",
                "location": "Orlando, FL",
                "venue_type": "Conference Center", 
                "capacity": 300,
                "price_per_person": 85.0,
                "amenities": ["AV Equipment", "Parking Garage", "Catering Services"],
                "rating": 4.2,
                "contact_info": {"phone": "407-555-0789", "email": "events@downtowncc.com"}
            }
        ]
        
        created_venues = 0
        
        for venue_data in test_venues:
            response = self.make_request("POST", "/venues", venue_data, token=self.token)
            
            if response and response.status_code == 200:
                created_venues += 1
                self.log_test(f"Create Venue - {venue_data['name']}", True, "Venue created successfully")
            else:
                status_code = response.status_code if response else "No response"
                self.log_test(f"Create Venue - {venue_data['name']}", False, f"Creation failed: {status_code}")
        
        if created_venues > 0:
            print(f"   ✅ Created {created_venues} test venues")
            return True
        else:
            print("   ❌ Failed to create any test venues")
            return False
    
    def run_comprehensive_venues_search_test(self):
        """Run comprehensive venues search testing"""
        print("\n🏛️ STARTING COMPREHENSIVE VENUES SEARCH API TESTING")
        print("=" * 80)
        print("CRITICAL ISSUE: InteractiveEventPlanner 'Select Now' buttons finding 0 results")
        print("GOAL: Identify if it's search logic, authentication, or parameter filtering issue")
        print("=" * 80)
        
        # Step 1: Authenticate
        if not self.authenticate():
            print("❌ CRITICAL: Authentication failed - cannot proceed with testing")
            return
        
        # Step 2: Test venues search with no parameters
        venue_count = self.test_venues_search_no_params()
        
        # Step 3: If no venues found, try to create test venues
        if venue_count == 0:
            print("\n⚠️ No venues found - attempting to create test venues...")
            if self.create_test_venues():
                print("   Re-testing venues search after creating test data...")
                venue_count = self.test_venues_search_no_params()
        
        # Step 4: Test with location filters
        self.test_venues_search_with_location()
        
        # Step 5: Test with various filters
        self.test_venues_search_with_filters()
        
        # Step 6: Test without authentication
        self.test_venues_search_without_auth()
        
        # Step 7: Test alternative endpoints
        self.test_alternative_venues_endpoints()
        
        # Print comprehensive summary
        print("\n📊 VENUES SEARCH API TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        # Analyze the root cause
        print(f"\n🔍 ROOT CAUSE ANALYSIS:")
        
        if venue_count == 0:
            print("❌ CRITICAL ISSUE: No venues found in database")
            print("   - Database may be empty or venues collection missing")
            print("   - Venue creation endpoint may not be working")
            print("   - Database connectivity issues possible")
        else:
            print(f"✅ Database has {venue_count} venues")
            print("   - Search endpoint is functional")
            print("   - Authentication is working correctly")
            print("   - Issue may be in frontend parameter passing")
        
        if self.failed_tests:
            print(f"\n❌ ISSUES FOUND:")
            for test_name in self.failed_tests:
                print(f"   - {test_name}")
        else:
            print(f"\n✅ ALL VENUES SEARCH TESTS PASSED!")
        
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        if venue_count == 0:
            print("   1. Check database connection and venues collection")
            print("   2. Verify venue creation/seeding process")
            print("   3. Check if venues are being filtered out by default parameters")
        else:
            print("   1. Venues search API is working correctly")
            print("   2. Check frontend InteractiveEventPlanner parameter passing")
            print("   3. Verify frontend is using correct API endpoint")
            print("   4. Check browser network tab for actual API calls made")
        
        return passed_tests, total_tests

if __name__ == "__main__":
    print("🏛️ VENUES SEARCH API ENDPOINT TESTING")
    print("Testing venues search functionality for InteractiveEventPlanner")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"API Base URL: {BASE_URL}")
    
    tester = VenuesSearchTester()
    passed, total = tester.run_comprehensive_venues_search_test()
    
    print(f"\n🎯 FINAL RESULT: {passed}/{total} tests passed ({(passed/total*100):.1f}%)")
    
    if passed >= total * 0.8:  # 80% success rate
        print("✅ VENUES SEARCH API IS OPERATIONAL")
        sys.exit(0)
    else:
        print("❌ VENUES SEARCH API HAS CRITICAL ISSUES")
        sys.exit(1)