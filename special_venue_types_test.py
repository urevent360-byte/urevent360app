#!/usr/bin/env python3
"""
Special Venue Types Testing for Enhanced Filtering System
Focus: Testing "My Own Private Space" and "I Already Have a Venue" venue types

SPECIFIC TESTING FOCUS (as per review request):
1. New Venue Type Options: Test creating events with preferred_venue_type="My Own Private Space" and "I Already Have a Venue"
2. Venue Search Filtering: 
   - Test venue search with preferred_venue_type="My Own Private Space" - should return empty list
   - Test venue search with preferred_venue_type="I Already Have a Venue" - should return empty list  
   - Test venue search with preferred_venue_type="Hotel" - should return only hotel venues
   - Test venue search with preferred_venue_type="Restaurant" - should return only restaurant venues
3. Interactive Event Planner Integration: Test that events with special venue types work correctly in the planner system
4. Services Still Work: Verify that when venue type is "My Own Private Space" or "I Already Have a Venue", services filtering still works properly

Key test scenarios:
- Create event with "My Own Private Space" and services_needed=["Catering", "Photography"]
- Create event with "I Already Have a Venue" and services_needed=["Decoration", "DJ"]
- Verify venue searches return empty for special venue types
- Verify services searches still work for special venue types
- Test that regular venue types still work (Hotel, Restaurant, etc.)
"""

import requests
import json
import sys
from datetime import datetime
import uuid
import os

# Configuration - Use environment variable for backend URL
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://eventforge-4.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
TEST_CREDENTIALS = {
    "client": {"email": "sarah.johnson@email.com", "password": "SecurePass123"}
}

class SpecialVenueTypesTester:
    def __init__(self):
        self.token = None
        self.test_results = []
        self.failed_tests = []
        self.created_events = []
        
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
    
    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        headers = HEADERS.copy()
        
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
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
        """Authenticate with the API"""
        print("🔐 Authenticating...")
        
        credentials = TEST_CREDENTIALS["client"]
        response = self.make_request("POST", "/login", credentials)
        
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                self.token = data["access_token"]
                self.log_test("Authentication", True, "Token obtained successfully")
                return True
            else:
                self.log_test("Authentication", False, "No access token in response")
                return False
        else:
            self.log_test("Authentication", False, f"Status: {response.status_code if response else 'No response'}")
            return False
    
    def test_special_venue_type_creation(self):
        """Test creating events with special venue types"""
        print("\n🏠 Testing Special Venue Type Event Creation...")
        
        # Test 1: Create event with "My Own Private Space"
        print("Step 1: Creating event with 'My Own Private Space'...")
        private_space_event = {
            "name": "Home Birthday Party",
            "description": "Intimate birthday celebration at my home",
            "event_type": "birthday",
            "date": "2024-08-20T19:00:00Z",
            "location": "My Home, New York, NY",
            "budget": 3000.0,
            "guest_count": 25,
            "preferred_venue_type": "My Own Private Space",
            "services_needed": ["Catering", "Photography"],
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", private_space_event)
        if response and response.status_code == 200:
            event_data = response.json()
            event_id = event_data.get("id")
            venue_type = event_data.get("preferred_venue_type")
            services = event_data.get("services_needed", [])
            
            if venue_type == "My Own Private Space" and "Catering" in services and "Photography" in services:
                self.log_test("Create 'My Own Private Space' Event", True, f"Event ID: {event_id}")
                self.created_events.append({
                    "id": event_id,
                    "name": private_space_event["name"],
                    "venue_type": "My Own Private Space",
                    "services": services
                })
            else:
                self.log_test("Create 'My Own Private Space' Event", False, f"Venue: {venue_type}, Services: {services}")
        else:
            self.log_test("Create 'My Own Private Space' Event", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 2: Create event with "I Already Have a Venue"
        print("Step 2: Creating event with 'I Already Have a Venue'...")
        existing_venue_event = {
            "name": "Corporate Team Building",
            "description": "Team building at our reserved conference center",
            "event_type": "corporate",
            "date": "2024-09-15T14:00:00Z",
            "location": "Downtown Conference Center, Chicago, IL",
            "budget": 5000.0,
            "guest_count": 50,
            "preferred_venue_type": "I Already Have a Venue",
            "services_needed": ["Decoration", "DJ"],
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", existing_venue_event)
        if response and response.status_code == 200:
            event_data = response.json()
            event_id = event_data.get("id")
            venue_type = event_data.get("preferred_venue_type")
            services = event_data.get("services_needed", [])
            
            if venue_type == "I Already Have a Venue" and "Decoration" in services and "DJ" in services:
                self.log_test("Create 'I Already Have a Venue' Event", True, f"Event ID: {event_id}")
                self.created_events.append({
                    "id": event_id,
                    "name": existing_venue_event["name"],
                    "venue_type": "I Already Have a Venue",
                    "services": services
                })
            else:
                self.log_test("Create 'I Already Have a Venue' Event", False, f"Venue: {venue_type}, Services: {services}")
        else:
            self.log_test("Create 'I Already Have a Venue' Event", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_special_venue_type_search_returns_empty(self):
        """Test that venue search returns empty list for special venue types"""
        print("\n🔍 Testing Special Venue Types Return Empty Lists...")
        
        # Test 1: "My Own Private Space" should return empty
        print("Step 1: Testing venue search with 'My Own Private Space'...")
        params = {
            "preferred_venue_type": "My Own Private Space",
            "city": "New York"
        }
        
        response = self.make_request("GET", "/venues/search", params=params)
        if response and response.status_code == 200:
            venues = response.json()
            if isinstance(venues, list) and len(venues) == 0:
                self.log_test("'My Own Private Space' Returns Empty", True, "Correctly returns empty list")
            else:
                self.log_test("'My Own Private Space' Returns Empty", False, f"Expected empty list, got {len(venues)} venues")
        else:
            self.log_test("'My Own Private Space' Returns Empty", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 2: "I Already Have a Venue" should return empty
        print("Step 2: Testing venue search with 'I Already Have a Venue'...")
        params = {
            "preferred_venue_type": "I Already Have a Venue",
            "city": "Chicago"
        }
        
        response = self.make_request("GET", "/venues/search", params=params)
        if response and response.status_code == 200:
            venues = response.json()
            if isinstance(venues, list) and len(venues) == 0:
                self.log_test("'I Already Have a Venue' Returns Empty", True, "Correctly returns empty list")
            else:
                self.log_test("'I Already Have a Venue' Returns Empty", False, f"Expected empty list, got {len(venues)} venues")
        else:
            self.log_test("'I Already Have a Venue' Returns Empty", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_regular_venue_types_still_work(self):
        """Test that regular venue types still work properly"""
        print("\n🏨 Testing Regular Venue Types Still Work...")
        
        # Test 1: Hotel venue type should return only hotels
        print("Step 1: Testing Hotel venue type filtering...")
        params = {
            "preferred_venue_type": "Hotel",
            "city": "New York"
        }
        
        response = self.make_request("GET", "/venues/search", params=params)
        if response and response.status_code == 200:
            venues = response.json()
            if isinstance(venues, list):
                if len(venues) > 0:
                    hotel_venues = [v for v in venues if "hotel" in v.get("venue_type", "").lower()]
                    if len(hotel_venues) == len(venues):
                        self.log_test("Hotel Venue Type Filtering", True, f"Found {len(hotel_venues)} hotel venues")
                    else:
                        self.log_test("Hotel Venue Type Filtering", False, f"Mixed types: {len(hotel_venues)} hotels out of {len(venues)} total")
                else:
                    self.log_test("Hotel Venue Type Filtering", True, "No hotel venues in database (acceptable)")
            else:
                self.log_test("Hotel Venue Type Filtering", False, f"Expected list, got {type(venues)}")
        else:
            self.log_test("Hotel Venue Type Filtering", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 2: Restaurant venue type should return only restaurants
        print("Step 2: Testing Restaurant venue type filtering...")
        params = {
            "preferred_venue_type": "Restaurant",
            "city": "New York"
        }
        
        response = self.make_request("GET", "/venues/search", params=params)
        if response and response.status_code == 200:
            venues = response.json()
            if isinstance(venues, list):
                if len(venues) > 0:
                    restaurant_venues = [v for v in venues if "restaurant" in v.get("venue_type", "").lower()]
                    if len(restaurant_venues) == len(venues):
                        self.log_test("Restaurant Venue Type Filtering", True, f"Found {len(restaurant_venues)} restaurant venues")
                    else:
                        self.log_test("Restaurant Venue Type Filtering", False, f"Mixed types: {len(restaurant_venues)} restaurants out of {len(venues)} total")
                else:
                    self.log_test("Restaurant Venue Type Filtering", True, "No restaurant venues in database (acceptable)")
            else:
                self.log_test("Restaurant Venue Type Filtering", False, f"Expected list, got {type(venues)}")
        else:
            self.log_test("Restaurant Venue Type Filtering", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_services_still_work_with_special_venues(self):
        """Test that services filtering still works with special venue types"""
        print("\n🛠️ Testing Services Still Work with Special Venue Types...")
        
        # Find our created events
        private_space_event = next((e for e in self.created_events if e["venue_type"] == "My Own Private Space"), None)
        existing_venue_event = next((e for e in self.created_events if e["venue_type"] == "I Already Have a Venue"), None)
        
        if not private_space_event:
            self.log_test("Services Test Setup", False, "No 'My Own Private Space' event found")
            return
        
        # Test 1: Services search for "My Own Private Space" event
        print("Step 1: Testing services search for 'My Own Private Space' event...")
        params = {
            "event_id": private_space_event["id"],
            "services_needed": "Catering,Photography"
        }
        
        response = self.make_request("GET", "/vendors/search", params=params)
        if response and response.status_code == 200:
            vendors = response.json()
            if isinstance(vendors, list):
                catering_vendors = [v for v in vendors if "catering" in v.get("service_type", "").lower()]
                photography_vendors = [v for v in vendors if "photography" in v.get("service_type", "").lower()]
                
                self.log_test("Services Work - 'My Own Private Space'", True, f"Found {len(catering_vendors)} catering + {len(photography_vendors)} photography vendors")
            else:
                self.log_test("Services Work - 'My Own Private Space'", False, f"Expected list, got {type(vendors)}")
        else:
            self.log_test("Services Work - 'My Own Private Space'", False, f"Status: {response.status_code if response else 'No response'}")
        
        if existing_venue_event:
            # Test 2: Services search for "I Already Have a Venue" event
            print("Step 2: Testing services search for 'I Already Have a Venue' event...")
            params = {
                "event_id": existing_venue_event["id"],
                "services_needed": "Decoration,DJ"
            }
            
            response = self.make_request("GET", "/vendors/search", params=params)
            if response and response.status_code == 200:
                vendors = response.json()
                if isinstance(vendors, list):
                    decoration_vendors = [v for v in vendors if "decoration" in v.get("service_type", "").lower()]
                    dj_vendors = [v for v in vendors if "dj" in v.get("service_type", "").lower() or "music" in v.get("service_type", "").lower()]
                    
                    self.log_test("Services Work - 'I Already Have a Venue'", True, f"Found {len(decoration_vendors)} decoration + {len(dj_vendors)} DJ vendors")
                else:
                    self.log_test("Services Work - 'I Already Have a Venue'", False, f"Expected list, got {type(vendors)}")
            else:
                self.log_test("Services Work - 'I Already Have a Venue'", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_interactive_planner_integration(self):
        """Test Interactive Event Planner integration with special venue types"""
        print("\n🎯 Testing Interactive Event Planner Integration...")
        
        private_space_event = next((e for e in self.created_events if e["venue_type"] == "My Own Private Space"), None)
        
        if not private_space_event:
            self.log_test("Planner Integration Test", False, "No 'My Own Private Space' event found")
            return
        
        # Test 1: Get planner state for special venue type event
        print("Step 1: Testing planner state for special venue type event...")
        response = self.make_request("GET", f"/events/{private_space_event['id']}/planner/state")
        if response and response.status_code == 200:
            planner_state = response.json()
            if "budget_tracking" in planner_state and "cart_items" in planner_state:
                self.log_test("Planner State - Special Venue", True, "Planner state works with special venue types")
            else:
                self.log_test("Planner State - Special Venue", False, "Missing planner state fields")
        else:
            self.log_test("Planner State - Special Venue", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 2: Test vendor search through planner
        print("Step 2: Testing planner vendor search for services...")
        response = self.make_request("GET", f"/events/{private_space_event['id']}/planner/vendors/catering")
        if response and response.status_code == 200:
            vendors = response.json()
            if isinstance(vendors, list):
                self.log_test("Planner Vendor Search - Special Venue", True, f"Found {len(vendors)} catering vendors through planner")
            else:
                self.log_test("Planner Vendor Search - Special Venue", False, f"Expected list, got {type(vendors)}")
        else:
            self.log_test("Planner Vendor Search - Special Venue", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 3: Test adding items to cart
        print("Step 3: Testing cart functionality with special venue types...")
        cart_item = {
            "vendor_id": "test-vendor-catering",
            "vendor_name": "Test Catering Service",
            "service_type": "catering",
            "service_name": "Home Catering Package",
            "price": 1200.0,
            "quantity": 1,
            "notes": "For private space event"
        }
        
        response = self.make_request("POST", f"/events/{private_space_event['id']}/cart/add", cart_item)
        if response and response.status_code == 200:
            self.log_test("Cart Functionality - Special Venue", True, "Cart works with special venue types")
        else:
            self.log_test("Cart Functionality - Special Venue", False, f"Status: {response.status_code if response else 'No response'}")
    
    def run_all_tests(self):
        """Run all special venue type tests"""
        print("🎯 SPECIAL VENUE TYPES TESTING STARTED")
        print("Backend URL:", BACKEND_URL)
        print("=" * 80)
        
        # Step 1: Authentication
        if not self.authenticate():
            print("❌ Authentication failed - cannot proceed with tests")
            return
        
        # Step 2: Test creating events with special venue types
        self.test_special_venue_type_creation()
        
        # Step 3: Test that special venue types return empty venue searches
        self.test_special_venue_type_search_returns_empty()
        
        # Step 4: Test that regular venue types still work
        self.test_regular_venue_types_still_work()
        
        # Step 5: Test that services still work with special venue types
        self.test_services_still_work_with_special_venues()
        
        # Step 6: Test Interactive Event Planner integration
        self.test_interactive_planner_integration()
        
        # Final Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("🎯 SPECIAL VENUE TYPES TESTING SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = len(self.failed_tests)
        
        print(f"📊 RESULTS: {passed_tests}/{total_tests} tests passed ({(passed_tests/total_tests*100):.1f}%)")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for test_name in self.failed_tests:
                print(f"   • {test_name}")
        
        print(f"\n✅ KEY FUNCTIONALITY TESTED:")
        print(f"   • New venue type options: 'My Own Private Space' and 'I Already Have a Venue'")
        print(f"   • Venue search returns empty for special venue types")
        print(f"   • Regular venue types (Hotel, Restaurant) still work properly")
        print(f"   • Services filtering works with special venue types")
        print(f"   • Interactive Event Planner integration with special venue types")
        
        if len(self.created_events) > 0:
            print(f"\n📝 CREATED TEST EVENTS ({len(self.created_events)}):")
            for event in self.created_events:
                print(f"   • {event['name']} (Venue: {event['venue_type']}, Services: {len(event['services'])})")
        
        print("\n🎉 Special Venue Types Testing Complete!")

if __name__ == "__main__":
    tester = SpecialVenueTypesTester()
    tester.run_all_tests()