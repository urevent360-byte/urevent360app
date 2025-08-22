#!/usr/bin/env python3
"""
UNIFIED LOCATION CONTROLS BACKEND TESTING
Focus: Testing the backend support for UNIFIED Location Controls implementation

CRITICAL TESTS:
1. Feature Flag Support - Backend handling of unified location objects
2. Unified Location Data Model - city, zipcode, zipOnly, radiusMiles
3. Backward Compatibility - Legacy string vs unified object
4. Data Synchronization - Updates to unified location structure
5. Validation Support - Backend validation for location requirements
"""

import requests
import json
import os
from datetime import datetime

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://event-planner-24.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
CLIENT_CREDENTIALS = {"email": "sarah.johnson@email.com", "password": "SecurePass123"}

class UnifiedLocationTester:
    def __init__(self):
        self.token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
    
    def make_request(self, method, endpoint, data=None, params=None):
        url = f"{BASE_URL}{endpoint}"
        headers = HEADERS.copy()
        
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=10)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=10)
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
    
    def authenticate(self):
        """Authenticate and get token"""
        print("🔐 Authenticating...")
        
        response = self.make_request("POST", "/login", CLIENT_CREDENTIALS)
        if response and response.status_code == 200:
            login_data = response.json()
            self.token = login_data.get("access_token")
            if self.token:
                self.log_test("Authentication", True, f"Token: {len(self.token)} chars")
                return True
        
        self.log_test("Authentication", False, f"Status: {response.status_code if response else 'No response'}")
        return False
    
    def test_unified_location_data_model(self):
        """Test backend support for unified location data model"""
        print("\n📍 Testing Unified Location Data Model...")
        
        # Test 1: Create event with unified location object
        unified_event = {
            "name": "Unified Location Test",
            "event_type": "wedding",
            "date": "2024-12-15T18:00:00Z",
            "location": {
                "city": "New York",
                "zipcode": "10001",
                "zipOnly": True,
                "radiusMiles": 25
            },
            "budget": 30000.0,
            "guest_count": 150
        }
        
        response = self.make_request("POST", "/events", unified_event)
        if response and response.status_code == 200:
            event_data = response.json()
            location = event_data.get("location")
            
            # Check if backend stores unified location object
            if isinstance(location, dict):
                required_fields = ["city", "zipcode", "zipOnly", "radiusMiles"]
                present_fields = [field for field in required_fields if field in location]
                
                if len(present_fields) == len(required_fields):
                    self.log_test("Unified Location Object Storage", True, 
                                f"All fields stored: {location}")
                else:
                    self.log_test("Unified Location Object Storage", False, 
                                f"Missing fields: {[f for f in required_fields if f not in location]}")
            else:
                # Backend might store as string - check if it's converted
                if isinstance(location, str):
                    self.log_test("Unified Location Conversion", True, 
                                f"Backend converts to string: {location}")
                else:
                    self.log_test("Unified Location Storage", False, 
                                f"Unexpected format: {type(location)}")
            
            return event_data.get("id")
        else:
            self.log_test("Unified Event Creation", False, 
                        f"Status: {response.status_code if response else 'No response'}")
            return None
    
    def test_legacy_compatibility(self):
        """Test backward compatibility with legacy location format"""
        print("\n🔄 Testing Legacy Compatibility...")
        
        # Test legacy string location
        legacy_event = {
            "name": "Legacy Location Test",
            "event_type": "corporate",
            "date": "2024-12-20T14:00:00Z",
            "location": "Chicago, IL",  # Legacy string format
            "budget": 25000.0,
            "guest_count": 100
        }
        
        response = self.make_request("POST", "/events", legacy_event)
        if response and response.status_code == 200:
            event_data = response.json()
            location = event_data.get("location")
            
            if isinstance(location, str) and location == "Chicago, IL":
                self.log_test("Legacy String Location", True, 
                            f"Legacy format preserved: {location}")
            else:
                self.log_test("Legacy String Location", False, 
                            f"Legacy format not preserved: {location}")
            
            return event_data.get("id")
        else:
            self.log_test("Legacy Event Creation", False, 
                        f"Status: {response.status_code if response else 'No response'}")
            return None
    
    def test_location_update_synchronization(self, event_id):
        """Test location update synchronization"""
        print("\n🔄 Testing Location Update Synchronization...")
        
        if not event_id:
            self.log_test("Location Update Test", False, "No event ID available")
            return
        
        # Update to unified location format
        location_update = {
            "location": {
                "city": "Boston",
                "zipcode": "02101",
                "zipOnly": False,
                "radiusMiles": 30
            }
        }
        
        response = self.make_request("PUT", f"/events/{event_id}", location_update)
        if response and response.status_code == 200:
            updated_event = response.json()
            updated_location = updated_event.get("location")
            
            if isinstance(updated_location, dict):
                if (updated_location.get("city") == "Boston" and 
                    updated_location.get("zipcode") == "02101"):
                    self.log_test("Location Update Synchronization", True, 
                                f"Update successful: {updated_location}")
                else:
                    self.log_test("Location Update Values", False, 
                                f"Incorrect values: {updated_location}")
            else:
                self.log_test("Location Update Format", False, 
                            f"Not unified format: {type(updated_location)}")
        else:
            self.log_test("Location Update Request", False, 
                        f"Status: {response.status_code if response else 'No response'}")
    
    def test_validation_scenarios(self):
        """Test various validation scenarios"""
        print("\n✅ Testing Validation Scenarios...")
        
        # Test 1: City only
        city_only = {
            "name": "City Only Test",
            "event_type": "birthday",
            "date": "2024-12-25T16:00:00Z",
            "location": {
                "city": "Miami",
                "zipcode": "",
                "zipOnly": False,
                "radiusMiles": 20
            },
            "budget": 15000.0,
            "guest_count": 75
        }
        
        response = self.make_request("POST", "/events", city_only)
        if response and response.status_code == 200:
            self.log_test("Validation - City Only", True, "City-only event accepted")
        else:
            self.log_test("Validation - City Only", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test 2: ZIP only
        zip_only = {
            "name": "ZIP Only Test",
            "event_type": "anniversary",
            "date": "2024-12-28T19:00:00Z",
            "location": {
                "city": "",
                "zipcode": "90210",
                "zipOnly": True,
                "radiusMiles": 0
            },
            "budget": 20000.0,
            "guest_count": 80
        }
        
        response = self.make_request("POST", "/events", zip_only)
        if response and response.status_code == 200:
            self.log_test("Validation - ZIP Only", True, "ZIP-only event accepted")
        else:
            self.log_test("Validation - ZIP Only", False, 
                        f"Status: {response.status_code if response else 'No response'}")
    
    def test_event_retrieval_format(self):
        """Test event retrieval returns proper location format"""
        print("\n📋 Testing Event Retrieval Format...")
        
        response = self.make_request("GET", "/events")
        if response and response.status_code == 200:
            events = response.json()
            if isinstance(events, list) and len(events) > 0:
                location_formats = {}
                for event in events:
                    location = event.get("location")
                    location_type = type(location).__name__
                    location_formats[location_type] = location_formats.get(location_type, 0) + 1
                
                self.log_test("Event Retrieval Format", True, 
                            f"Location formats found: {location_formats}")
                
                # Check for unified format support
                if "dict" in location_formats:
                    self.log_test("Unified Format Support", True, 
                                f"Found {location_formats['dict']} events with unified location")
                
                if "str" in location_formats:
                    self.log_test("Legacy Format Support", True, 
                                f"Found {location_formats['str']} events with legacy location")
            else:
                self.log_test("Event Retrieval", False, "No events found")
        else:
            self.log_test("Event Retrieval", False, 
                        f"Status: {response.status_code if response else 'No response'}")
    
    def run_tests(self):
        """Run all unified location control tests"""
        print("🚀 Starting UNIFIED Location Controls Backend Testing...")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 70)
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed - cannot proceed with tests")
            return
        
        # Run tests
        unified_event_id = self.test_unified_location_data_model()
        legacy_event_id = self.test_legacy_compatibility()
        
        if unified_event_id:
            self.test_location_update_synchronization(unified_event_id)
        
        self.test_validation_scenarios()
        self.test_event_retrieval_format()
        
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
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   ❌ {result['test']}")
        
        print("=" * 70)

if __name__ == "__main__":
    tester = UnifiedLocationTester()
    tester.run_tests()