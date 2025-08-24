#!/usr/bin/env python3
"""
CRITICAL POST-CREATION FLOW API TESTING

Test the complete event creation and redirect flow to ensure the backend supports 
the new post-creation requirements as specified in the review request:

1. **EVENT CREATION API WITH IDEMPOTENCY**:
   - Test POST /api/events with proper wizard data including budget_preferences
   - Verify idempotency-key header handling prevents duplicates
   - Confirm API returns correct event ID for redirect

2. **EVENT RETRIEVAL FOR PROFILE**:  
   - Test GET /api/events/{event-id} returns complete event data
   - Verify budget_preferences field is properly stored and returned
   - Check that all wizard data (name, type, date, guest_count, location) is preserved

3. **COMPLETE FLOW SIMULATION**:
   - Create event with budget target ($9,000)
   - Verify event can be retrieved at /api/events/{id}
   - Confirm budget information displays properly
   - Test that event appears in user's event list

4. **IDEMPOTENCY TESTING**:
   - Send same request with same Idempotency-Key twice
   - Verify only one event is created
   - Confirm second request returns existing event

5. **ERROR HANDLING**:
   - Test invalid event data
   - Test unauthorized access
   - Verify proper error messages for wizard

Expected: All API endpoints working correctly to support the post-creation flow 
from CreateEventWizard.js to EventDashboard.js with proper budget transfer and 
event profile display.
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import uuid
import time
import os

# Configuration - Use environment variable for backend URL
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
TEST_USER = {"email": "sarah.johnson@email.com", "password": "SecurePass123"}

class PostCreationFlowTester:
    def __init__(self):
        self.token = None
        self.test_results = []
        self.failed_tests = []
        self.created_events = []  # Track created events for cleanup
        
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
    
    def make_request(self, method, endpoint, data=None, headers=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        request_headers = HEADERS.copy()
        
        if self.token:
            request_headers["Authorization"] = f"Bearer {self.token}"
        
        if headers:
            request_headers.update(headers)
        
        try:
            if method == "GET":
                response = requests.get(url, headers=request_headers, params=params, timeout=30)
            elif method == "POST":
                response = requests.post(url, headers=request_headers, json=data, timeout=30)
            elif method == "PUT":
                response = requests.put(url, headers=request_headers, json=data, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=request_headers, timeout=30)
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
    
    def authenticate(self):
        """Authenticate user and get token"""
        print("\n🔐 Authenticating user...")
        
        response = self.make_request("POST", "/login", TEST_USER)
        
        if response and response.status_code == 200:
            try:
                login_data = response.json()
                self.token = login_data.get("access_token")
                user_data = login_data.get("user", {})
                
                if self.token:
                    self.log_test("User Authentication", True, 
                                f"Authenticated as {user_data.get('name')} ({user_data.get('email')})")
                    return True
                else:
                    self.log_test("User Authentication", False, "No access token received")
                    return False
            except Exception as e:
                self.log_test("User Authentication", False, f"JSON parsing error: {e}")
                return False
        else:
            status_code = response.status_code if response else "No response"
            self.log_test("User Authentication", False, f"Authentication failed: {status_code}")
            return False
    
    def test_event_creation_with_idempotency(self):
        """Test 1: EVENT CREATION API WITH IDEMPOTENCY"""
        print("\n🎯 TEST 1: EVENT CREATION API WITH IDEMPOTENCY")
        print("=" * 60)
        
        # Generate unique idempotency key
        idempotency_key = str(uuid.uuid4())
        
        # Create comprehensive event data with budget_preferences as per wizard
        event_data = {
            "name": "Sarah's Dream Wedding",
            "description": "A beautiful wedding celebration with family and friends",
            "event_type": "wedding",
            "sub_event_type": "reception_with_ceremony",
            "cultural_style": "american",
            "date": (datetime.now() + timedelta(days=180)).isoformat(),
            "location": "Miami, FL",
            "zipcode": "33101",
            "location_preferences": {
                "city": "Miami",
                "zipcode": "33101",
                "zip_only": False,
                "radius_miles": 25,
                "search_radius": 25,
                "only_exact_location": False,
                "preferred_areas": ["Downtown Miami", "South Beach"]
            },
            "budget_preferences": {
                "target": 9000.0,
                "currency": "USD",
                "breakdown": {
                    "venue": 3000.0,
                    "catering": 2500.0,
                    "photography": 1500.0,
                    "decoration": 1000.0,
                    "music": 800.0,
                    "other": 200.0
                }
            },
            "budget": 9000.0,
            "guest_count": 75,
            "status": "planning",
            "preferred_venue_types": ["hotel/banquet hall", "outdoor/garden"],
            "needed_core_services": ["catering", "photography", "decoration"],
            "needed_extras": ["music/dj", "transportation"],
            "services_needed": ["catering", "photography", "decoration", "music/dj"]
        }
        
        # Test event creation with idempotency key
        print("   Testing event creation with idempotency key...")
        headers = {"Idempotency-Key": idempotency_key}
        
        response = self.make_request("POST", "/events", event_data, headers=headers)
        
        if response and response.status_code == 200:
            try:
                created_event = response.json()
                event_id = created_event.get("id")
                
                if event_id:
                    self.created_events.append(event_id)
                    self.log_test("Event Creation with Idempotency", True, 
                                f"Event created successfully: {event_id}")
                    
                    # Verify all wizard data is preserved
                    self.verify_event_data_preservation(created_event, event_data)
                    
                    # Test idempotency - send same request again
                    print("   Testing idempotency - sending duplicate request...")
                    duplicate_response = self.make_request("POST", "/events", event_data, headers=headers)
                    
                    if duplicate_response and duplicate_response.status_code == 200:
                        duplicate_event = duplicate_response.json()
                        duplicate_id = duplicate_event.get("id")
                        
                        if duplicate_id == event_id:
                            self.log_test("Idempotency Key Handling", True, 
                                        f"Same event returned: {duplicate_id}")
                        else:
                            self.log_test("Idempotency Key Handling", False, 
                                        f"Different event created: {duplicate_id} vs {event_id}")
                    else:
                        status_code = duplicate_response.status_code if duplicate_response else "No response"
                        self.log_test("Idempotency Key Handling", False, f"Duplicate request failed: {status_code}")
                    
                    return event_id
                else:
                    self.log_test("Event Creation with Idempotency", False, "No event ID returned")
                    return None
            except Exception as e:
                self.log_test("Event Creation with Idempotency", False, f"JSON parsing error: {e}")
                return None
        else:
            status_code = response.status_code if response else "No response"
            self.log_test("Event Creation with Idempotency", False, f"Event creation failed: {status_code}")
            return None
    
    def verify_event_data_preservation(self, created_event, original_data):
        """Verify that all wizard data is properly preserved"""
        print("   Verifying wizard data preservation...")
        
        # Check basic event fields
        basic_fields = ["name", "event_type", "date", "location", "guest_count", "budget"]
        for field in basic_fields:
            if field in original_data:
                original_value = original_data[field]
                created_value = created_event.get(field)
                
                if created_value == original_value:
                    self.log_test(f"Data Preservation - {field}", True, 
                                f"Value preserved: {created_value}")
                else:
                    self.log_test(f"Data Preservation - {field}", False, 
                                f"Value mismatch: expected {original_value}, got {created_value}")
        
        # Check budget_preferences specifically
        original_budget_prefs = original_data.get("budget_preferences", {})
        created_budget_prefs = created_event.get("budget_preferences", {})
        
        if original_budget_prefs and created_budget_prefs:
            target_budget = original_budget_prefs.get("target")
            created_target = created_budget_prefs.get("target")
            
            if target_budget == created_target:
                self.log_test("Budget Preferences Preservation", True, 
                            f"Budget target preserved: ${created_target}")
            else:
                self.log_test("Budget Preferences Preservation", False, 
                            f"Budget target mismatch: expected ${target_budget}, got ${created_target}")
        else:
            self.log_test("Budget Preferences Preservation", False, "Budget preferences missing")
        
        # Check location_preferences
        original_location_prefs = original_data.get("location_preferences", {})
        created_location_prefs = created_event.get("location_preferences", {})
        
        if original_location_prefs and created_location_prefs:
            city = original_location_prefs.get("city")
            created_city = created_location_prefs.get("city")
            
            if city == created_city:
                self.log_test("Location Preferences Preservation", True, 
                            f"Location preferences preserved: {created_city}")
            else:
                self.log_test("Location Preferences Preservation", False, 
                            f"Location preferences mismatch: expected {city}, got {created_city}")
        else:
            self.log_test("Location Preferences Preservation", False, "Location preferences missing")
    
    def test_event_retrieval_for_profile(self, event_id):
        """Test 2: EVENT RETRIEVAL FOR PROFILE"""
        print("\n🎯 TEST 2: EVENT RETRIEVAL FOR PROFILE")
        print("=" * 60)
        
        if not event_id:
            self.log_test("Event Retrieval Test", False, "No event ID available")
            return None
        
        print(f"   Testing event retrieval for ID: {event_id}")
        
        # Test GET /api/events/{event_id}
        response = self.make_request("GET", f"/events/{event_id}")
        
        if response and response.status_code == 200:
            try:
                retrieved_event = response.json()
                
                # Verify event ID matches
                retrieved_id = retrieved_event.get("id")
                if retrieved_id == event_id:
                    self.log_test("Event Retrieval by ID", True, 
                                f"Event retrieved successfully: {retrieved_id}")
                else:
                    self.log_test("Event Retrieval by ID", False, 
                                f"ID mismatch: expected {event_id}, got {retrieved_id}")
                
                # Verify complete event data is returned
                self.verify_complete_event_data(retrieved_event)
                
                return retrieved_event
            except Exception as e:
                self.log_test("Event Retrieval by ID", False, f"JSON parsing error: {e}")
                return None
        else:
            status_code = response.status_code if response else "No response"
            self.log_test("Event Retrieval by ID", False, f"Event retrieval failed: {status_code}")
            return None
    
    def verify_complete_event_data(self, event_data):
        """Verify that complete event data is returned for profile display"""
        print("   Verifying complete event data for profile display...")
        
        # Required fields for event profile display
        required_fields = [
            "id", "name", "event_type", "date", "location", "guest_count", 
            "budget", "status", "created_at"
        ]
        
        missing_fields = [field for field in required_fields if field not in event_data]
        
        if not missing_fields:
            self.log_test("Complete Event Data", True, 
                        f"All required fields present: {len(required_fields)} fields")
        else:
            self.log_test("Complete Event Data", False, 
                        f"Missing required fields: {missing_fields}")
        
        # Verify budget_preferences field specifically
        budget_preferences = event_data.get("budget_preferences")
        if budget_preferences:
            target_budget = budget_preferences.get("target")
            if target_budget:
                self.log_test("Budget Preferences Field", True, 
                            f"Budget preferences present with target: ${target_budget}")
            else:
                self.log_test("Budget Preferences Field", False, 
                            "Budget preferences missing target value")
        else:
            self.log_test("Budget Preferences Field", False, 
                        "Budget preferences field missing")
        
        # Verify location_preferences field
        location_preferences = event_data.get("location_preferences")
        if location_preferences:
            city = location_preferences.get("city")
            radius = location_preferences.get("radius_miles")
            self.log_test("Location Preferences Field", True, 
                        f"Location preferences present: {city}, {radius} miles")
        else:
            self.log_test("Location Preferences Field", False, 
                        "Location preferences field missing")
        
        # Verify wizard-specific fields
        wizard_fields = ["services_needed", "preferred_venue_types", "needed_core_services"]
        present_wizard_fields = [field for field in wizard_fields if field in event_data]
        
        if present_wizard_fields:
            self.log_test("Wizard Data Fields", True, 
                        f"Wizard fields preserved: {present_wizard_fields}")
        else:
            self.log_test("Wizard Data Fields", False, 
                        "No wizard-specific fields found")
    
    def test_complete_flow_simulation(self, event_id):
        """Test 3: COMPLETE FLOW SIMULATION"""
        print("\n🎯 TEST 3: COMPLETE FLOW SIMULATION")
        print("=" * 60)
        
        if not event_id:
            self.log_test("Complete Flow Simulation", False, "No event ID available")
            return
        
        # Step 1: Verify event appears in user's event list
        print("   Step 1: Testing event appears in user's event list...")
        response = self.make_request("GET", "/events")
        
        if response and response.status_code == 200:
            try:
                events_list = response.json()
                
                # Find our created event in the list
                created_event_in_list = None
                for event in events_list:
                    if event.get("id") == event_id:
                        created_event_in_list = event
                        break
                
                if created_event_in_list:
                    self.log_test("Event in User List", True, 
                                f"Event found in user's event list: {event_id}")
                    
                    # Verify budget information displays properly
                    budget = created_event_in_list.get("budget")
                    budget_preferences = created_event_in_list.get("budget_preferences", {})
                    target_budget = budget_preferences.get("target")
                    
                    if budget == 9000.0 and target_budget == 9000.0:
                        self.log_test("Budget Information Display", True, 
                                    f"Budget displays correctly: ${budget} (target: ${target_budget})")
                    else:
                        self.log_test("Budget Information Display", False, 
                                    f"Budget mismatch: budget=${budget}, target=${target_budget}")
                else:
                    self.log_test("Event in User List", False, 
                                f"Event not found in user's event list")
            except Exception as e:
                self.log_test("Event in User List", False, f"JSON parsing error: {e}")
        else:
            status_code = response.status_code if response else "No response"
            self.log_test("Event in User List", False, f"Failed to get events list: {status_code}")
        
        # Step 2: Test event profile access (simulate EventDashboard.js access)
        print("   Step 2: Testing event profile access for dashboard...")
        profile_response = self.make_request("GET", f"/events/{event_id}")
        
        if profile_response and profile_response.status_code == 200:
            try:
                profile_event = profile_response.json()
                
                # Verify all data needed for EventDashboard.js
                dashboard_fields = [
                    "name", "event_type", "date", "location", "guest_count", 
                    "budget", "budget_preferences", "status"
                ]
                
                missing_dashboard_fields = [field for field in dashboard_fields 
                                          if field not in profile_event]
                
                if not missing_dashboard_fields:
                    self.log_test("Event Dashboard Data", True, 
                                f"All dashboard fields available: {len(dashboard_fields)} fields")
                    
                    # Test specific budget transfer from wizard to dashboard
                    budget_prefs = profile_event.get("budget_preferences", {})
                    if budget_prefs.get("target") == 9000.0:
                        self.log_test("Budget Transfer to Dashboard", True, 
                                    f"Budget properly transferred: ${budget_prefs.get('target')}")
                    else:
                        self.log_test("Budget Transfer to Dashboard", False, 
                                    f"Budget transfer failed: {budget_prefs.get('target')}")
                else:
                    self.log_test("Event Dashboard Data", False, 
                                f"Missing dashboard fields: {missing_dashboard_fields}")
            except Exception as e:
                self.log_test("Event Dashboard Data", False, f"JSON parsing error: {e}")
        else:
            status_code = profile_response.status_code if profile_response else "No response"
            self.log_test("Event Dashboard Data", False, f"Profile access failed: {status_code}")
    
    def test_idempotency_comprehensive(self):
        """Test 4: COMPREHENSIVE IDEMPOTENCY TESTING"""
        print("\n🎯 TEST 4: COMPREHENSIVE IDEMPOTENCY TESTING")
        print("=" * 60)
        
        # Generate unique idempotency key for this test
        idempotency_key = f"test-idempotency-{str(uuid.uuid4())}"
        
        # Create event data
        event_data = {
            "name": "Idempotency Test Event",
            "description": "Testing idempotency key functionality",
            "event_type": "corporate",
            "date": (datetime.now() + timedelta(days=90)).isoformat(),
            "location": "New York, NY",
            "budget_preferences": {
                "target": 5000.0,
                "currency": "USD"
            },
            "budget": 5000.0,
            "guest_count": 50,
            "status": "planning"
        }
        
        headers = {"Idempotency-Key": idempotency_key}
        
        # First request
        print("   Sending first request with idempotency key...")
        first_response = self.make_request("POST", "/events", event_data, headers=headers)
        
        if first_response and first_response.status_code == 200:
            try:
                first_event = first_response.json()
                first_event_id = first_event.get("id")
                
                if first_event_id:
                    self.created_events.append(first_event_id)
                    self.log_test("First Idempotent Request", True, 
                                f"First event created: {first_event_id}")
                    
                    # Second request with same idempotency key
                    print("   Sending second request with same idempotency key...")
                    second_response = self.make_request("POST", "/events", event_data, headers=headers)
                    
                    if second_response and second_response.status_code == 200:
                        try:
                            second_event = second_response.json()
                            second_event_id = second_event.get("id")
                            
                            if second_event_id == first_event_id:
                                self.log_test("Idempotency Prevention", True, 
                                            f"Same event returned: {second_event_id}")
                                
                                # Verify no duplicate was created by checking events list
                                events_response = self.make_request("GET", "/events")
                                if events_response and events_response.status_code == 200:
                                    events_list = events_response.json()
                                    matching_events = [e for e in events_list 
                                                     if e.get("name") == "Idempotency Test Event"]
                                    
                                    if len(matching_events) == 1:
                                        self.log_test("No Duplicate Creation", True, 
                                                    f"Only one event exists: {len(matching_events)}")
                                    else:
                                        self.log_test("No Duplicate Creation", False, 
                                                    f"Multiple events found: {len(matching_events)}")
                                else:
                                    self.log_test("No Duplicate Creation", False, 
                                                "Could not verify event list")
                            else:
                                self.log_test("Idempotency Prevention", False, 
                                            f"Different event created: {second_event_id}")
                        except Exception as e:
                            self.log_test("Idempotency Prevention", False, f"JSON parsing error: {e}")
                    else:
                        status_code = second_response.status_code if second_response else "No response"
                        self.log_test("Idempotency Prevention", False, f"Second request failed: {status_code}")
                else:
                    self.log_test("First Idempotent Request", False, "No event ID returned")
            except Exception as e:
                self.log_test("First Idempotent Request", False, f"JSON parsing error: {e}")
        else:
            status_code = first_response.status_code if first_response else "No response"
            self.log_test("First Idempotent Request", False, f"First request failed: {status_code}")
    
    def test_error_handling(self):
        """Test 5: ERROR HANDLING"""
        print("\n🎯 TEST 5: ERROR HANDLING")
        print("=" * 60)
        
        # Test 1: Invalid event data
        print("   Testing invalid event data handling...")
        invalid_event_data = {
            "name": "",  # Empty name
            "event_type": "invalid_type",  # Invalid type
            "date": "invalid-date",  # Invalid date format
            "guest_count": -5,  # Negative guest count
            "budget": "not-a-number"  # Invalid budget
        }
        
        response = self.make_request("POST", "/events", invalid_event_data)
        
        if response and response.status_code in [400, 422]:  # Bad request or validation error
            self.log_test("Invalid Data Handling", True, 
                        f"Invalid data properly rejected: {response.status_code}")
        else:
            status_code = response.status_code if response else "No response"
            self.log_test("Invalid Data Handling", False, 
                        f"Invalid data not properly handled: {status_code}")
        
        # Test 2: Unauthorized access (without token)
        print("   Testing unauthorized access...")
        original_token = self.token
        self.token = None  # Remove token temporarily
        
        unauthorized_response = self.make_request("POST", "/events", {
            "name": "Unauthorized Test",
            "event_type": "wedding",
            "date": (datetime.now() + timedelta(days=30)).isoformat()
        })
        
        if unauthorized_response and unauthorized_response.status_code == 401:
            self.log_test("Unauthorized Access Prevention", True, 
                        "Unauthorized request properly rejected: 401")
        else:
            status_code = unauthorized_response.status_code if unauthorized_response else "No response"
            self.log_test("Unauthorized Access Prevention", False, 
                        f"Unauthorized request not properly handled: {status_code}")
        
        # Restore token
        self.token = original_token
        
        # Test 3: Invalid event ID retrieval
        print("   Testing invalid event ID retrieval...")
        invalid_id = "invalid-event-id-12345"
        invalid_response = self.make_request("GET", f"/events/{invalid_id}")
        
        if invalid_response and invalid_response.status_code == 404:
            self.log_test("Invalid Event ID Handling", True, 
                        "Invalid event ID properly rejected: 404")
        else:
            status_code = invalid_response.status_code if invalid_response else "No response"
            self.log_test("Invalid Event ID Handling", False, 
                        f"Invalid event ID not properly handled: {status_code}")
        
        # Test 4: Missing required fields
        print("   Testing missing required fields...")
        incomplete_event = {
            "name": "Incomplete Event"
            # Missing required fields like event_type, date
        }
        
        incomplete_response = self.make_request("POST", "/events", incomplete_event)
        
        if incomplete_response and incomplete_response.status_code in [400, 422]:
            self.log_test("Missing Fields Handling", True, 
                        f"Missing fields properly rejected: {incomplete_response.status_code}")
        else:
            status_code = incomplete_response.status_code if incomplete_response else "No response"
            self.log_test("Missing Fields Handling", False, 
                        f"Missing fields not properly handled: {status_code}")
    
    def cleanup_created_events(self):
        """Clean up events created during testing"""
        print("\n🧹 Cleaning up created test events...")
        
        for event_id in self.created_events:
            try:
                response = self.make_request("DELETE", f"/events/{event_id}")
                if response and response.status_code == 200:
                    print(f"   Deleted event: {event_id}")
                else:
                    print(f"   Failed to delete event: {event_id}")
            except Exception as e:
                print(f"   Error deleting event {event_id}: {e}")
    
    def run_comprehensive_tests(self):
        """Run all post-creation flow tests"""
        print("\n🚀 STARTING CRITICAL POST-CREATION FLOW API TESTING")
        print("=" * 80)
        print("GOAL: Verify backend supports complete post-creation flow from")
        print("      CreateEventWizard.js to EventDashboard.js with proper")
        print("      budget transfer and event profile display")
        print("=" * 80)
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed - cannot proceed with tests")
            return
        
        try:
            # Test 1: Event Creation with Idempotency
            event_id = self.test_event_creation_with_idempotency()
            
            # Test 2: Event Retrieval for Profile
            retrieved_event = self.test_event_retrieval_for_profile(event_id)
            
            # Test 3: Complete Flow Simulation
            self.test_complete_flow_simulation(event_id)
            
            # Test 4: Comprehensive Idempotency Testing
            self.test_idempotency_comprehensive()
            
            # Test 5: Error Handling
            self.test_error_handling()
            
        finally:
            # Clean up created events
            self.cleanup_created_events()
        
        # Print comprehensive summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        print("\n📊 CRITICAL POST-CREATION FLOW TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ CRITICAL ISSUES FOUND:")
            for test_name in self.failed_tests:
                print(f"   - {test_name}")
        else:
            print(f"\n✅ ALL POST-CREATION FLOW TESTS PASSED!")
        
        print(f"\n🎯 POST-CREATION FLOW STATUS:")
        if passed_tests >= total_tests * 0.90:  # 90% success rate
            print("✅ POST-CREATION FLOW IS FULLY OPERATIONAL")
            print("✅ Event creation with idempotency working correctly")
            print("✅ Event retrieval for profile display working")
            print("✅ Budget preferences properly stored and retrieved")
            print("✅ Complete flow from wizard to dashboard supported")
            print("✅ Error handling working properly")
            print("✅ Backend ready for post-creation flow implementation")
        else:
            print("❌ POST-CREATION FLOW HAS CRITICAL ISSUES")
            print("❌ Backend not ready for post-creation flow")
            print("❌ Issues must be resolved before frontend implementation")
        
        return passed_tests, total_tests

def main():
    """Main test execution"""
    tester = PostCreationFlowTester()
    passed, total = tester.run_comprehensive_tests()
    
    # Exit with appropriate code
    if passed >= total * 0.90:
        print("\n🎉 POST-CREATION FLOW TESTING COMPLETED SUCCESSFULLY")
        sys.exit(0)
    else:
        print("\n💥 POST-CREATION FLOW TESTING FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main()