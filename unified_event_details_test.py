#!/usr/bin/env python3
"""
Unified Event Details Layout Backend Testing for Urevent 360 Platform
Focus: Testing backend APIs that support the unified event details layout improvement in EventDashboard.js

TESTING FOCUS (as per review request):
1. Login authentication with existing test users 
2. Event retrieval APIs for dashboard display
3. Inline editing functionality backend support (Event Name, Guest Count, Budget, Location)
4. Event update APIs for unified layout
5. Description section backend support

Note: Frontend UI testing is not performed due to system limitations.
Testing only the backend APIs that support the unified event details functionality.
"""

import requests
import json
import sys
from datetime import datetime
import uuid
import os

# Configuration - Use environment variable for backend URL
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://urevent-unified.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
TEST_CREDENTIALS = {
    "client": {"email": "sarah.johnson@email.com", "password": "SecurePass123"},
    "admin": {"email": "admin@urevent360.com", "password": "admin123"},
    "vendor": {"email": "vendor@example.com", "password": "vendor123"}
}

class UnifiedEventDetailsAPITester:
    def __init__(self):
        self.tokens = {}
        self.test_results = []
        self.failed_tests = []
        self.test_event_id = None
        
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
    
    def test_authentication(self):
        """Test login authentication with existing test users"""
        print("\n🔐 Testing Authentication with Existing Test Users...")
        
        for role, credentials in TEST_CREDENTIALS.items():
            print(f"Testing {role} login...")
            response = self.make_request("POST", "/login", credentials)
            
            if response and response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.tokens[role] = data["access_token"]
                    user_info = data.get("user", {})
                    self.log_test(f"{role.title()} Authentication", True, 
                                f"User: {user_info.get('name', 'Unknown')} ({user_info.get('email', 'No email')})")
                else:
                    self.log_test(f"{role.title()} Authentication", False, "No access token in response")
            else:
                self.log_test(f"{role.title()} Authentication", False, 
                            f"Status: {response.status_code if response else 'No response'}")
        
        return len(self.tokens) > 0
    
    def test_event_creation_for_testing(self):
        """Create a test event for unified layout testing"""
        print("\n📅 Creating Test Event for Unified Layout Testing...")
        
        if "client" not in self.tokens:
            self.log_test("Test Event Creation", False, "No client token available")
            return False
        
        event_data = {
            "name": "Unified Layout Test Event",
            "description": "Testing unified event details layout with comprehensive event information for inline editing verification",
            "event_type": "wedding",
            "date": "2024-09-15T18:00:00Z",
            "location": "Grand Ballroom, New York, NY",
            "budget": 25000.0,
            "guest_count": 150,
            "status": "planning",
            "services_needed": ["venue", "catering", "photography", "decoration"]
        }
        
        response = self.make_request("POST", "/events", event_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            event = response.json()
            self.test_event_id = event.get("id")
            self.log_test("Test Event Creation", True, 
                        f"Event created: {event.get('name')} (ID: {self.test_event_id})")
            return True
        else:
            self.log_test("Test Event Creation", False, 
                        f"Status: {response.status_code if response else 'No response'}")
            return False
    
    def test_event_retrieval_for_dashboard(self):
        """Test event retrieval APIs for dashboard display"""
        print("\n📊 Testing Event Retrieval for Dashboard Display...")
        
        if not self.test_event_id:
            self.log_test("Event Retrieval Test", False, "No test event available")
            return
        
        # Test individual event retrieval
        response = self.make_request("GET", f"/events/{self.test_event_id}", token=self.tokens["client"])
        if response and response.status_code == 200:
            event = response.json()
            
            # Verify all required fields for unified layout are present
            required_fields = ["id", "name", "description", "date", "location", "budget", "guest_count"]
            missing_fields = [field for field in required_fields if field not in event or event[field] is None]
            
            if not missing_fields:
                self.log_test("Event Data Completeness", True, 
                            f"All required fields present: {', '.join(required_fields)}")
            else:
                self.log_test("Event Data Completeness", False, 
                            f"Missing fields: {', '.join(missing_fields)}")
            
            # Test specific field values
            if event.get("name") == "Unified Layout Test Event":
                self.log_test("Event Name Retrieval", True, f"Name: {event['name']}")
            else:
                self.log_test("Event Name Retrieval", False, f"Unexpected name: {event.get('name')}")
            
            if event.get("budget") == 25000.0:
                self.log_test("Event Budget Retrieval", True, f"Budget: ${event['budget']}")
            else:
                self.log_test("Event Budget Retrieval", False, f"Unexpected budget: ${event.get('budget')}")
            
            if event.get("guest_count") == 150:
                self.log_test("Event Guest Count Retrieval", True, f"Guests: {event['guest_count']}")
            else:
                self.log_test("Event Guest Count Retrieval", False, f"Unexpected guest count: {event.get('guest_count')}")
            
            if "Grand Ballroom" in str(event.get("location", "")):
                self.log_test("Event Location Retrieval", True, f"Location: {event['location']}")
            else:
                self.log_test("Event Location Retrieval", False, f"Unexpected location: {event.get('location')}")
                
        else:
            self.log_test("Individual Event Retrieval", False, 
                        f"Status: {response.status_code if response else 'No response'}")
    
    def test_inline_editing_backend_support(self):
        """Test backend APIs that support inline editing functionality"""
        print("\n✏️ Testing Inline Editing Backend Support...")
        
        if not self.test_event_id:
            self.log_test("Inline Editing Test", False, "No test event available")
            return
        
        # Test 1: Update Event Name (inline editing)
        print("Testing Event Name inline editing...")
        name_update = {"name": "Updated Event Name via Inline Edit"}
        response = self.make_request("PUT", f"/events/{self.test_event_id}", name_update, token=self.tokens["client"])
        
        if response and response.status_code == 200:
            updated_event = response.json()
            if updated_event.get("name") == name_update["name"]:
                self.log_test("Event Name Inline Update", True, f"Name updated to: {updated_event['name']}")
            else:
                self.log_test("Event Name Inline Update", False, f"Name not updated correctly: {updated_event.get('name')}")
        else:
            self.log_test("Event Name Inline Update", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 2: Update Guest Count (inline editing)
        print("Testing Guest Count inline editing...")
        guest_update = {"guest_count": 175}
        response = self.make_request("PUT", f"/events/{self.test_event_id}", guest_update, token=self.tokens["client"])
        
        if response and response.status_code == 200:
            updated_event = response.json()
            if updated_event.get("guest_count") == guest_update["guest_count"]:
                self.log_test("Guest Count Inline Update", True, f"Guest count updated to: {updated_event['guest_count']}")
            else:
                self.log_test("Guest Count Inline Update", False, f"Guest count not updated: {updated_event.get('guest_count')}")
        else:
            self.log_test("Guest Count Inline Update", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 3: Update Budget (inline editing)
        print("Testing Budget inline editing...")
        budget_update = {"budget": 30000.0}
        response = self.make_request("PUT", f"/events/{self.test_event_id}", budget_update, token=self.tokens["client"])
        
        if response and response.status_code == 200:
            updated_event = response.json()
            if updated_event.get("budget") == budget_update["budget"]:
                self.log_test("Budget Inline Update", True, f"Budget updated to: ${updated_event['budget']}")
            else:
                self.log_test("Budget Inline Update", False, f"Budget not updated: ${updated_event.get('budget')}")
        else:
            self.log_test("Budget Inline Update", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 4: Update Location (inline editing)
        print("Testing Location inline editing...")
        location_update = {"location": "Updated Venue Location, Brooklyn, NY"}
        response = self.make_request("PUT", f"/events/{self.test_event_id}", location_update, token=self.tokens["client"])
        
        if response and response.status_code == 200:
            updated_event = response.json()
            if updated_event.get("location") == location_update["location"]:
                self.log_test("Location Inline Update", True, f"Location updated to: {updated_event['location']}")
            else:
                self.log_test("Location Inline Update", False, f"Location not updated: {updated_event.get('location')}")
        else:
            self.log_test("Location Inline Update", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 5: Bulk field update (multiple fields at once)
        print("Testing bulk field update...")
        bulk_update = {
            "name": "Final Unified Layout Test Event",
            "guest_count": 200,
            "budget": 35000.0,
            "location": "Premium Venue, Manhattan, NY"
        }
        response = self.make_request("PUT", f"/events/{self.test_event_id}", bulk_update, token=self.tokens["client"])
        
        if response and response.status_code == 200:
            updated_event = response.json()
            
            # Verify all fields were updated
            all_updated = all(updated_event.get(key) == value for key, value in bulk_update.items())
            
            if all_updated:
                self.log_test("Bulk Field Update", True, "All fields updated successfully in single request")
            else:
                failed_fields = [key for key, value in bulk_update.items() if updated_event.get(key) != value]
                self.log_test("Bulk Field Update", False, f"Failed to update: {', '.join(failed_fields)}")
        else:
            self.log_test("Bulk Field Update", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_description_section_support(self):
        """Test backend support for separate Description section"""
        print("\n📝 Testing Description Section Backend Support...")
        
        if not self.test_event_id:
            self.log_test("Description Section Test", False, "No test event available")
            return
        
        # Test description update
        description_update = {
            "description": "This is a comprehensive description for the unified event details layout. It includes detailed information about the event, requirements, special notes, and any additional context that would be displayed in the separate expandable Description section of the unified layout."
        }
        
        response = self.make_request("PUT", f"/events/{self.test_event_id}", description_update, token=self.tokens["client"])
        
        if response and response.status_code == 200:
            updated_event = response.json()
            if updated_event.get("description") == description_update["description"]:
                self.log_test("Description Update", True, f"Description updated (length: {len(updated_event['description'])} chars)")
            else:
                self.log_test("Description Update", False, "Description not updated correctly")
        else:
            self.log_test("Description Update", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Verify description retrieval
        response = self.make_request("GET", f"/events/{self.test_event_id}", token=self.tokens["client"])
        if response and response.status_code == 200:
            event = response.json()
            description = event.get("description", "")
            
            if len(description) > 100:  # Verify substantial description content
                self.log_test("Description Retrieval", True, f"Description retrieved (length: {len(description)} chars)")
            else:
                self.log_test("Description Retrieval", False, f"Description too short or missing: {len(description)} chars")
        else:
            self.log_test("Description Retrieval", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_updated_timestamp_handling(self):
        """Test that updates properly set updated_at timestamps"""
        print("\n⏰ Testing Updated Timestamp Handling...")
        
        if not self.test_event_id:
            self.log_test("Timestamp Test", False, "No test event available")
            return
        
        # Get current event to check initial timestamp
        response = self.make_request("GET", f"/events/{self.test_event_id}", token=self.tokens["client"])
        if response and response.status_code == 200:
            initial_event = response.json()
            initial_updated_at = initial_event.get("updated_at")
            
            # Make an update
            update_data = {"name": "Timestamp Test Update"}
            response = self.make_request("PUT", f"/events/{self.test_event_id}", update_data, token=self.tokens["client"])
            
            if response and response.status_code == 200:
                updated_event = response.json()
                new_updated_at = updated_event.get("updated_at")
                
                if new_updated_at and new_updated_at != initial_updated_at:
                    self.log_test("Updated Timestamp", True, f"Timestamp updated: {new_updated_at}")
                else:
                    self.log_test("Updated Timestamp", False, f"Timestamp not updated: {new_updated_at}")
            else:
                self.log_test("Updated Timestamp", False, f"Update failed: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Timestamp Test", False, "Could not retrieve initial event")
    
    def run_all_tests(self):
        """Run all unified event details layout backend tests"""
        print("🚀 Starting Unified Event Details Layout Backend Testing...")
        print("=" * 80)
        
        # Test authentication first
        if not self.test_authentication():
            print("❌ Authentication failed - cannot proceed with tests")
            return
        
        # Create test event
        if not self.test_event_creation_for_testing():
            print("❌ Test event creation failed - cannot proceed with layout tests")
            return
        
        # Run all tests
        self.test_event_retrieval_for_dashboard()
        self.test_inline_editing_backend_support()
        self.test_description_section_support()
        self.test_updated_timestamp_handling()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("📊 UNIFIED EVENT DETAILS LAYOUT BACKEND TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = len(self.failed_tests)
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests ({len(self.failed_tests)}):")
            for test in self.failed_tests:
                print(f"   • {test}")
        
        print(f"\n🎯 BACKEND TESTING RESULTS FOR UNIFIED EVENT DETAILS LAYOUT:")
        print(f"✅ Authentication: {'Working' if 'client' in self.tokens else 'Failed'}")
        print(f"✅ Event Retrieval: {'Working' if any('Event' in t['test'] and 'Retrieval' in t['test'] and t['success'] for t in self.test_results) else 'Failed'}")
        print(f"✅ Inline Editing APIs: {'Working' if any('Inline' in t['test'] and t['success'] for t in self.test_results) else 'Failed'}")
        print(f"✅ Description Support: {'Working' if any('Description' in t['test'] and t['success'] for t in self.test_results) else 'Failed'}")
        
        print(f"\n📝 NOTE: Frontend UI testing not performed due to system limitations.")
        print(f"Backend APIs supporting unified event details layout functionality have been tested.")

if __name__ == "__main__":
    tester = UnifiedEventDetailsAPITester()
    tester.run_all_tests()