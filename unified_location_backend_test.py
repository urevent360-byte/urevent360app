#!/usr/bin/env python3
"""
UNIFIED LOCATION CONTROLS IMPLEMENTATION TESTING
Testing the CORRECTED Unified Location Controls implementation as per review request

CRITICAL TESTS:
1. **Correct Field Mapping Verification** - location_preferences field for unified data, location field as string for backward compatibility
2. **Unified Location Data Flow Testing** - with REACT_APP_WIZARD_LOCATION_UNIFIED=true
3. **Backend API Compatibility Testing** - EventCreate model accepts location_preferences object
4. **Validation & Data Synchronization** - Step 1 validation and data sync
5. **Complete Integration Flow** - end-to-end testing
6. **Feature Flag Toggle Testing** - both modes testing

KEY CHANGE: Use location_preferences (object) for unified data, not location field (string).
"""

import requests
import json
import sys
from datetime import datetime
import uuid
import time
import os

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://event-planner-24.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
TEST_CREDENTIALS = {
    "client": {"email": "sarah.johnson@email.com", "password": "SecurePass123"}
}

class UnifiedLocationTester:
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
        """Authenticate and get token"""
        print("\n🔐 Authenticating...")
        
        credentials = TEST_CREDENTIALS["client"]
        response = self.make_request("POST", "/login", credentials)
        
        if response and response.status_code == 200:
            login_data = response.json()
            access_token = login_data.get("access_token")
            
            if access_token:
                self.token = access_token
                self.log_test("Authentication", True, f"Token: {len(access_token)} chars")
                return True
            else:
                self.log_test("Authentication", False, "No access token received")
                return False
        else:
            self.log_test("Authentication", False, f"Status: {response.status_code if response else 'No response'}")
            return False
    
    def test_correct_field_mapping_verification(self):
        """Test that location_preferences field is used for unified location data and location field remains a string for backward compatibility"""
        print("\n📍 TESTING CORRECT FIELD MAPPING VERIFICATION")
        print("=" * 70)
        
        # Test 1: Create event with location_preferences object and location string
        unified_event_data = {
            "name": "Unified Location Field Mapping Test",
            "event_type": "wedding",
            "date": "2024-12-15T18:00:00Z",
            "location": "New York, NY",  # String for backward compatibility
            "location_preferences": {    # Object for unified data
                "city": "New York",
                "zipcode": "10001",
                "zipOnly": True,
                "radiusMiles": 25
            },
            "budget": 35000.0,
            "guest_count": 150
        }
        
        response = self.make_request("POST", "/events", unified_event_data)
        if response and response.status_code == 200:
            event_data = response.json()
            event_id = event_data.get("id")
            
            # Verify location_preferences field is stored as object
            location_preferences = event_data.get("location_preferences")
            if isinstance(location_preferences, dict):
                required_fields = ["city", "zipcode", "zipOnly", "radiusMiles"]
                missing_fields = [field for field in required_fields if field not in location_preferences]
                
                if not missing_fields:
                    self.log_test("Field Mapping - location_preferences Object", True, 
                                f"All unified fields present: {list(location_preferences.keys())}")
                else:
                    self.log_test("Field Mapping - location_preferences Object", False, 
                                f"Missing fields: {missing_fields}")
            else:
                self.log_test("Field Mapping - location_preferences Object", False, 
                            f"location_preferences is not an object: {type(location_preferences)}")
            
            # Verify location field remains a string
            location_field = event_data.get("location")
            if isinstance(location_field, str):
                self.log_test("Field Mapping - location String Compatibility", True, 
                            f"location field is string: '{location_field}'")
            else:
                self.log_test("Field Mapping - location String Compatibility", False, 
                            f"location field is not string: {type(location_field)}")
            
            # Verify both fields are populated correctly when unified flag is enabled
            if location_preferences and location_field:
                city_match = location_preferences.get("city", "").lower() in location_field.lower()
                if city_match:
                    self.log_test("Field Mapping - Data Consistency", True, 
                                "location_preferences.city matches location string")
                else:
                    self.log_test("Field Mapping - Data Consistency", False, 
                                f"City mismatch: '{location_preferences.get('city')}' not in '{location_field}'")
            
            return event_id
        else:
            self.log_test("Field Mapping - Event Creation", False, 
                        f"Status: {response.status_code if response else 'No response'}")
            return None
    
    def test_unified_location_data_flow(self):
        """Test unified location data flow with REACT_APP_WIZARD_LOCATION_UNIFIED=true"""
        print("\n🔄 TESTING UNIFIED LOCATION DATA FLOW")
        print("=" * 70)
        
        # Create event with exact unified location structure from review request
        unified_flow_data = {
            "name": "Unified Location Integration Test",
            "event_type": "wedding",
            "date": "2024-12-20T19:00:00Z",
            "location": "Chicago",  # String for backward compatibility
            "location_preferences": {
                "city": "Chicago",
                "zipcode": "60601",
                "zipOnly": False,
                "radiusMiles": 30
            },
            "budget": 45000.0,
            "guest_count": 200
        }
        
        response = self.make_request("POST", "/events", unified_flow_data)
        if response and response.status_code == 200:
            event_data = response.json()
            event_id = event_data.get("id")
            location_prefs = event_data.get("location_preferences", {})
            
            # Test that location_preferences contains expected structure
            expected_structure = {
                "city": "Chicago",
                "zipcode": "60601", 
                "zipOnly": False,
                "radiusMiles": 30
            }
            
            structure_match = True
            for key, expected_value in expected_structure.items():
                actual_value = location_prefs.get(key)
                if actual_value != expected_value:
                    structure_match = False
                    break
            
            if structure_match:
                self.log_test("Unified Data Flow - Structure Verification", True, 
                            f"location_preferences: {location_prefs}")
            else:
                self.log_test("Unified Data Flow - Structure Verification", False, 
                            f"Structure mismatch. Expected: {expected_structure}, Got: {location_prefs}")
            
            # Test that location field contains the city string for backward compatibility
            location_field = event_data.get("location")
            if location_field and "Chicago" in location_field:
                self.log_test("Unified Data Flow - Backward Compatibility", True, 
                            f"location field: '{location_field}'")
            else:
                self.log_test("Unified Data Flow - Backward Compatibility", False, 
                            f"location field doesn't contain city: '{location_field}'")
            
            return event_id
        else:
            self.log_test("Unified Data Flow - Event Creation", False, 
                        f"Status: {response.status_code if response else 'No response'}")
            return None
    
    def test_backend_api_compatibility(self):
        """Test EventCreate model accepts location_preferences object and Event model stores both fields"""
        print("\n🔧 TESTING BACKEND API COMPATIBILITY")
        print("=" * 70)
        
        # Test EventCreate model with location_preferences
        api_test_data = {
            "name": "API Compatibility Test Event",
            "event_type": "corporate",
            "date": "2024-12-25T18:00:00Z",
            "location": "Miami, FL",
            "location_preferences": {
                "city": "Miami",
                "zipcode": "33101",
                "zipOnly": True,
                "radiusMiles": 15
            },
            "budget": 25000.0,
            "guest_count": 100
        }
        
        response = self.make_request("POST", "/events", api_test_data)
        if response and response.status_code == 200:
            self.log_test("API Compatibility - EventCreate Model", True, 
                        "EventCreate model accepts location_preferences object")
            
            event_data = response.json()
            event_id = event_data.get("id")
            
            # Test Event model stores both location (string) and location_preferences (object)
            response = self.make_request("GET", f"/events/{event_id}")
            if response and response.status_code == 200:
                retrieved_event = response.json()
                
                has_location_string = isinstance(retrieved_event.get("location"), str)
                has_location_prefs_object = isinstance(retrieved_event.get("location_preferences"), dict)
                
                if has_location_string and has_location_prefs_object:
                    self.log_test("API Compatibility - Event Model Storage", True, 
                                "Event model stores both location (string) and location_preferences (object)")
                else:
                    self.log_test("API Compatibility - Event Model Storage", False, 
                                f"Storage issue - location: {type(retrieved_event.get('location'))}, location_preferences: {type(retrieved_event.get('location_preferences'))}")
            else:
                self.log_test("API Compatibility - Event Retrieval", False, 
                            f"Status: {response.status_code if response else 'No response'}")
            
            # Test venue matching APIs work with location_preferences data
            self.test_venue_matching_with_unified_data(event_id)
            
            return event_id
        else:
            self.log_test("API Compatibility - EventCreate Model", False, 
                        f"Status: {response.status_code if response else 'No response'}")
            return None
    
    def test_venue_matching_with_unified_data(self, event_id):
        """Test venue matching APIs work with location_preferences data"""
        print("\n🏛️ Testing Venue Matching with Unified Data...")
        
        # Test venue search with zipcode from location_preferences
        params = {
            "zip_code": "33101",
            "radius": 15,
            "venue_type": "hotel/banquet hall"
        }
        
        response = self.make_request("GET", "/venues/search", params=params)
        if response and response.status_code == 200:
            venues = response.json()
            if isinstance(venues, list):
                self.log_test("Venue Matching - ZIP Code Search", True, 
                            f"Found {len(venues)} venues in ZIP 33101 within 15 miles")
            else:
                self.log_test("Venue Matching - ZIP Code Search", False, "Invalid venue response format")
        else:
            self.log_test("Venue Matching - ZIP Code Search", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test venue search with city from location_preferences
        params = {
            "city": "Miami",
            "venue_type": "hotel/banquet hall"
        }
        
        response = self.make_request("GET", "/venues/search", params=params)
        if response and response.status_code == 200:
            venues = response.json()
            if isinstance(venues, list):
                self.log_test("Venue Matching - City Search", True, 
                            f"Found {len(venues)} venues in Miami")
            else:
                self.log_test("Venue Matching - City Search", False, "Invalid venue response format")
        else:
            self.log_test("Venue Matching - City Search", False, 
                        f"Status: {response.status_code if response else 'No response'}")
    
    def test_validation_and_data_synchronization(self):
        """Test Step 1 validation requires either city OR zipcode when unified flag is enabled"""
        print("\n✅ TESTING VALIDATION & DATA SYNCHRONIZATION")
        print("=" * 70)
        
        # Test 1: Valid event with city only
        city_only_data = {
            "name": "City Only Validation Test",
            "event_type": "birthday",
            "date": "2024-12-30T18:00:00Z",
            "location": "Atlanta, GA",
            "location_preferences": {
                "city": "Atlanta",
                "zipcode": "",
                "zipOnly": False,
                "radiusMiles": 20
            },
            "budget": 15000.0,
            "guest_count": 75
        }
        
        response = self.make_request("POST", "/events", city_only_data)
        if response and response.status_code == 200:
            self.log_test("Validation - City Only", True, "Event created with city only")
        else:
            self.log_test("Validation - City Only", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test 2: Valid event with zipcode only
        zipcode_only_data = {
            "name": "Zipcode Only Validation Test",
            "event_type": "anniversary",
            "date": "2024-12-31T19:00:00Z",
            "location": "30301",
            "location_preferences": {
                "city": "",
                "zipcode": "30301",
                "zipOnly": True,
                "radiusMiles": 10
            },
            "budget": 20000.0,
            "guest_count": 50
        }
        
        response = self.make_request("POST", "/events", zipcode_only_data)
        if response and response.status_code == 200:
            event_data = response.json()
            
            # Test data synchronization between eventData.city and eventData.location_preferences.city
            location_prefs = event_data.get("location_preferences", {})
            location_field = event_data.get("location")
            
            # When zipcode is provided, location field should contain zipcode
            if "30301" in str(location_field):
                self.log_test("Data Synchronization - Zipcode Mode", True, 
                            f"location field synchronized: '{location_field}'")
            else:
                self.log_test("Data Synchronization - Zipcode Mode", False, 
                            f"location field not synchronized: '{location_field}'")
            
            self.log_test("Validation - Zipcode Only", True, "Event created with zipcode only")
        else:
            self.log_test("Validation - Zipcode Only", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test 3: Test backward compatibility when flag is disabled (simulate)
        legacy_data = {
            "name": "Legacy Compatibility Test",
            "event_type": "graduation",
            "date": "2025-01-05T17:00:00Z",
            "location": "Boston, MA",  # Only location field, no location_preferences
            "budget": 18000.0,
            "guest_count": 80
        }
        
        response = self.make_request("POST", "/events", legacy_data)
        if response and response.status_code == 200:
            event_data = response.json()
            
            # Should work without location_preferences
            location_field = event_data.get("location")
            location_prefs = event_data.get("location_preferences")
            
            if location_field and not location_prefs:
                self.log_test("Backward Compatibility - Legacy Mode", True, 
                            f"Works without location_preferences: '{location_field}'")
            else:
                self.log_test("Backward Compatibility - Legacy Mode", False, 
                            f"Unexpected behavior - location: '{location_field}', location_preferences: {location_prefs}")
        else:
            self.log_test("Backward Compatibility - Legacy Mode", False, 
                        f"Status: {response.status_code if response else 'No response'}")
    
    def test_complete_integration_flow(self):
        """Test complete integration flow as specified in review request"""
        print("\n🎯 TESTING COMPLETE INTEGRATION FLOW")
        print("=" * 70)
        
        # Create event: "Unified Location Integration Test"
        # Location: city="Chicago", zipcode="60601", zipOnly=false, radiusMiles=30
        integration_data = {
            "name": "Unified Location Integration Test",
            "event_type": "wedding",
            "date": "2025-01-10T18:00:00Z",
            "location": "Chicago, IL",
            "location_preferences": {
                "city": "Chicago",
                "zipcode": "60601",
                "zipOnly": False,
                "radiusMiles": 30
            },
            "budget": 50000.0,
            "guest_count": 250
        }
        
        response = self.make_request("POST", "/events", integration_data)
        if response and response.status_code == 200:
            event_data = response.json()
            event_id = event_data.get("id")
            
            self.log_test("Integration Flow - Event Creation", True, 
                        f"Event created: {event_data.get('name')}")
            
            # Test event retrieval
            response = self.make_request("GET", f"/events/{event_id}")
            if response and response.status_code == 200:
                retrieved_event = response.json()
                location_prefs = retrieved_event.get("location_preferences", {})
                
                # Verify all location data is preserved
                expected_values = {
                    "city": "Chicago",
                    "zipcode": "60601",
                    "zipOnly": False,
                    "radiusMiles": 30
                }
                
                all_correct = True
                for key, expected in expected_values.items():
                    actual = location_prefs.get(key)
                    if actual != expected:
                        all_correct = False
                        break
                
                if all_correct:
                    self.log_test("Integration Flow - Event Retrieval", True, 
                                "All unified location data preserved")
                else:
                    self.log_test("Integration Flow - Event Retrieval", False, 
                                f"Data mismatch. Expected: {expected_values}, Got: {location_prefs}")
                
                # Test venue matching with unified location data
                self.test_venue_matching_integration(event_id, location_prefs)
                
                # Test event summary displays unified location information correctly
                self.test_event_summary_integration(retrieved_event)
                
            else:
                self.log_test("Integration Flow - Event Retrieval", False, 
                            f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Integration Flow - Event Creation", False, 
                        f"Status: {response.status_code if response else 'No response'}")
    
    def test_venue_matching_integration(self, event_id, location_prefs):
        """Test venue matching with unified location data"""
        print("\n🏛️ Testing Venue Matching Integration...")
        
        city = location_prefs.get("city")
        zipcode = location_prefs.get("zipcode")
        radius = location_prefs.get("radiusMiles")
        zip_only = location_prefs.get("zipOnly")
        
        # Test venue search with unified location parameters
        params = {
            "zip_code": zipcode,
            "radius": radius if not zip_only else 0,
            "city": city
        }
        
        response = self.make_request("GET", "/venues/search", params=params)
        if response and response.status_code == 200:
            venues = response.json()
            if isinstance(venues, list):
                self.log_test("Integration - Venue Matching", True, 
                            f"Found {len(venues)} venues with unified location data")
                
                # Test venue selection for events
                if len(venues) > 0:
                    venue = venues[0]
                    venue_selection_data = {
                        "venue_id": venue.get("id"),
                        "venue_name": venue.get("name"),
                        "venue_address": venue.get("location")
                    }
                    
                    response = self.make_request("POST", f"/events/{event_id}/select-venue", venue_selection_data)
                    if response and response.status_code == 200:
                        self.log_test("Integration - Venue Selection", True, 
                                    f"Venue selected: {venue.get('name')}")
                    else:
                        self.log_test("Integration - Venue Selection", False, 
                                    f"Status: {response.status_code if response else 'No response'}")
            else:
                self.log_test("Integration - Venue Matching", False, "Invalid venue response format")
        else:
            self.log_test("Integration - Venue Matching", False, 
                        f"Status: {response.status_code if response else 'No response'}")
    
    def test_event_summary_integration(self, event_data):
        """Test event summary displays unified location information correctly"""
        print("\n📋 Testing Event Summary Integration...")
        
        location_field = event_data.get("location")
        location_prefs = event_data.get("location_preferences", {})
        
        # Verify event summary has all necessary location information
        summary_data = {
            "name": event_data.get("name"),
            "location_string": location_field,
            "location_details": location_prefs,
            "budget": event_data.get("budget"),
            "guest_count": event_data.get("guest_count")
        }
        
        # Check if summary contains unified location information
        has_city = location_prefs.get("city") is not None
        has_zipcode = location_prefs.get("zipcode") is not None
        has_radius = location_prefs.get("radiusMiles") is not None
        has_zip_only = "zipOnly" in location_prefs
        
        if has_city and has_zipcode and has_radius and has_zip_only:
            self.log_test("Integration - Event Summary", True, 
                        f"Event summary contains all unified location data: {location_prefs}")
        else:
            missing_fields = []
            if not has_city: missing_fields.append("city")
            if not has_zipcode: missing_fields.append("zipcode")
            if not has_radius: missing_fields.append("radiusMiles")
            if not has_zip_only: missing_fields.append("zipOnly")
            
            self.log_test("Integration - Event Summary", False, 
                        f"Missing unified location fields: {missing_fields}")
    
    def test_feature_flag_toggle_testing(self):
        """Test both REACT_APP_WIZARD_LOCATION_UNIFIED=true and false modes"""
        print("\n🚩 TESTING FEATURE FLAG TOGGLE")
        print("=" * 70)
        
        # Test unified mode (flag = true) - current mode
        print("Testing UNIFIED mode (flag = true)...")
        
        unified_mode_data = {
            "name": "Unified Mode Test",
            "event_type": "corporate",
            "date": "2025-01-15T16:00:00Z",
            "location": "San Francisco, CA",
            "location_preferences": {
                "city": "San Francisco",
                "zipcode": "94102",
                "zipOnly": False,
                "radiusMiles": 20
            },
            "budget": 35000.0,
            "guest_count": 120
        }
        
        response = self.make_request("POST", "/events", unified_mode_data)
        if response and response.status_code == 200:
            event_data = response.json()
            location_prefs = event_data.get("location_preferences")
            
            if isinstance(location_prefs, dict) and len(location_prefs) > 0:
                self.log_test("Feature Flag - Unified Mode", True, 
                            f"Unified mode working: {location_prefs}")
            else:
                self.log_test("Feature Flag - Unified Mode", False, 
                            f"Unified mode not working: {location_prefs}")
        else:
            self.log_test("Feature Flag - Unified Mode", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test legacy mode (simulate flag = false)
        print("Testing LEGACY mode (simulated flag = false)...")
        
        legacy_mode_data = {
            "name": "Legacy Mode Test",
            "event_type": "birthday",
            "date": "2025-01-20T19:00:00Z",
            "location": "Los Angeles, CA",  # Only location field
            "budget": 22000.0,
            "guest_count": 90
        }
        
        response = self.make_request("POST", "/events", legacy_mode_data)
        if response and response.status_code == 200:
            event_data = response.json()
            location_field = event_data.get("location")
            location_prefs = event_data.get("location_preferences")
            
            # In legacy mode, should work with just location field
            if location_field and not location_prefs:
                self.log_test("Feature Flag - Legacy Mode", True, 
                            f"Legacy mode working: location='{location_field}'")
            elif location_field and location_prefs:
                self.log_test("Feature Flag - Backward Compatibility", True, 
                            f"Both fields supported: location='{location_field}', location_preferences={location_prefs}")
            else:
                self.log_test("Feature Flag - Legacy Mode", False, 
                            f"Legacy mode issue: location='{location_field}', location_preferences={location_prefs}")
        else:
            self.log_test("Feature Flag - Legacy Mode", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test no data loss during transitions
        print("Testing no data loss during transitions...")
        
        # Create event with both fields
        transition_data = {
            "name": "Transition Test Event",
            "event_type": "wedding",
            "date": "2025-01-25T18:00:00Z",
            "location": "Seattle, WA",
            "location_preferences": {
                "city": "Seattle",
                "zipcode": "98101",
                "zipOnly": True,
                "radiusMiles": 15
            },
            "budget": 40000.0,
            "guest_count": 180
        }
        
        response = self.make_request("POST", "/events", transition_data)
        if response and response.status_code == 200:
            event_data = response.json()
            event_id = event_data.get("id")
            
            # Retrieve event to ensure data persistence
            response = self.make_request("GET", f"/events/{event_id}")
            if response and response.status_code == 200:
                retrieved_data = response.json()
                
                original_location = transition_data.get("location")
                original_prefs = transition_data.get("location_preferences")
                retrieved_location = retrieved_data.get("location")
                retrieved_prefs = retrieved_data.get("location_preferences")
                
                location_preserved = original_location == retrieved_location
                prefs_preserved = original_prefs == retrieved_prefs
                
                if location_preserved and prefs_preserved:
                    self.log_test("Feature Flag - No Data Loss", True, 
                                "All location data preserved during transitions")
                else:
                    self.log_test("Feature Flag - No Data Loss", False, 
                                f"Data loss detected - location: {location_preserved}, prefs: {prefs_preserved}")
            else:
                self.log_test("Feature Flag - Data Persistence", False, 
                            f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Feature Flag - Transition Test", False, 
                        f"Status: {response.status_code if response else 'No response'}")
    
    def run_all_tests(self):
        """Run all unified location control tests"""
        print("🎯 UNIFIED LOCATION CONTROLS IMPLEMENTATION TESTING")
        print("=" * 70)
        print("Testing the CORRECTED Unified Location Controls implementation")
        print("KEY CHANGE: Use location_preferences (object) for unified data, not location field (string)")
        print("=" * 70)
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return
        
        # Run all test categories
        self.test_correct_field_mapping_verification()
        self.test_unified_location_data_flow()
        self.test_backend_api_compatibility()
        self.test_validation_and_data_synchronization()
        self.test_complete_integration_flow()
        self.test_feature_flag_toggle_testing()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 70)
        print("🎯 UNIFIED LOCATION CONTROLS TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   - {test}")
        
        print("\n" + "=" * 70)
        
        # Determine overall result
        if failed_tests == 0:
            print("🎉 ALL UNIFIED LOCATION CONTROLS TESTS PASSED!")
            print("✅ The CORRECTED Unified Location Controls implementation is working correctly.")
            print("✅ location_preferences field is properly used for unified data.")
            print("✅ location field remains a string for backward compatibility.")
            print("✅ Backend API compatibility is confirmed.")
            print("✅ Feature flag toggle testing successful.")
        elif failed_tests <= 2:
            print("⚠️ MOSTLY SUCCESSFUL - Minor issues detected")
            print("✅ Core unified location functionality is working.")
            print("⚠️ Some edge cases or validation issues need attention.")
        else:
            print("❌ SIGNIFICANT ISSUES DETECTED")
            print("❌ Unified location controls implementation needs fixes.")
            print("❌ Review failed tests and address issues.")

if __name__ == "__main__":
    tester = UnifiedLocationTester()
    tester.run_all_tests()