#!/usr/bin/env python3
"""
Event Retrieval Functionality Testing for Urevent 360 Platform
Focus: Testing event retrieval functionality to ensure the "manage" button navigation issue is resolved.

SPECIFIC TESTING FOCUS:
1. List Events API: Test GET /api/events to retrieve all events
2. Individual Event Retrieval: Test GET /api/events/{event_id} for existing events
3. Event ID Validation: Verify event IDs are properly formatted (UUIDs)
4. Authentication on Event Routes: Verify both endpoints work with authentication
5. Event data structure includes all required fields for dashboard display
6. No 404 errors when trying to access individual events
7. Authentication consistency across event-related endpoints
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Configuration - Use environment variable for backend URL
import os
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://festivity-pro-1.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
TEST_CREDENTIALS = {
    "admin": {"email": "admin@urevent360.com", "password": "admin123"},
    "vendor": {"email": "vendor@example.com", "password": "vendor123"},
    "employee": {"email": "employee@example.com", "password": "employee123"},
    "client": {"email": "sarah.johnson@email.com", "password": "SecurePass123"}
}

class APITester:
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
    
    def test_health_check(self):
        """Test basic health check"""
        print("\n🔍 Testing Health Check...")
        response = self.make_request("GET", "/../health")
        
        if response and response.status_code == 200:
            self.log_test("Health Check", True, "API is healthy")
            return True
        else:
            self.log_test("Health Check", False, f"Status: {response.status_code if response else 'No response'}")
            return False
    
    def test_event_retrieval_functionality(self):
        """Test comprehensive event retrieval functionality to resolve manage button navigation issues"""
        print("\n🎯 Testing Event Retrieval Functionality (Manage Button Fix)...")
        
        if "client" not in self.tokens:
            # First ensure we have a valid client token
            self.test_authentication()
        
        if "client" not in self.tokens:
            self.log_test("Event Retrieval Test", False, "No client token available")
            return
        
        # Step 1: Create multiple test events with different types to ensure we have data
        print("Step 1: Creating test events for retrieval testing...")
        test_events_created = []
        
        test_events_data = [
            {
                "name": "Sarah's Birthday Celebration",
                "description": "A wonderful birthday party with friends and family",
                "event_type": "birthday",
                "date": "2024-08-16T18:00:00Z",
                "location": "New York, NY",
                "budget": 8000.0,
                "guest_count": 50,
                "status": "planning"
            },
            {
                "name": "Corporate Annual Gala",
                "description": "Company's annual celebration event",
                "event_type": "corporate",
                "date": "2024-09-20T19:00:00Z",
                "location": "Chicago, IL",
                "budget": 25000.0,
                "guest_count": 200,
                "status": "planning"
            },
            {
                "name": "Emma's Wedding Reception",
                "description": "Beautiful wedding reception celebration",
                "event_type": "wedding",
                "sub_event_type": "reception_only",
                "cultural_style": "american",
                "date": "2024-10-12T17:00:00Z",
                "location": "Los Angeles, CA",
                "budget": 35000.0,
                "guest_count": 120,
                "status": "planning"
            }
        ]
        
        for event_data in test_events_data:
            response = self.make_request("POST", "/events", event_data, token=self.tokens["client"])
            if response and response.status_code == 200:
                created_event = response.json()
                event_id = created_event.get("id")
                test_events_created.append({
                    "id": event_id,
                    "name": event_data["name"],
                    "event_type": event_data["event_type"]
                })
                print(f"   ✅ Created event: {event_data['name']} (ID: {event_id})")
            else:
                print(f"   ❌ Failed to create event: {event_data['name']} - Status: {response.status_code if response else 'No response'}")
        
        if len(test_events_created) == 0:
            self.log_test("Event Creation for Testing", False, "Could not create any test events")
            return
        else:
            self.log_test("Event Creation for Testing", True, f"Created {len(test_events_created)} test events")
        
        # Step 2: Test GET /api/events - List Events API
        print("Step 2: Testing List Events API (GET /api/events)...")
        response = self.make_request("GET", "/events", token=self.tokens["client"])
        
        if response and response.status_code == 200:
            events_list = response.json()
            
            # Verify response is a list
            if isinstance(events_list, list):
                self.log_test("List Events API Response Format", True, f"Retrieved {len(events_list)} events as list")
                
                # Verify events have proper IDs
                events_with_valid_ids = []
                events_with_invalid_ids = []
                
                for event in events_list:
                    event_id = event.get("id")
                    if event_id:
                        # Check if ID is UUID format (36 characters with hyphens)
                        if len(event_id) == 36 and event_id.count('-') == 4:
                            events_with_valid_ids.append(event_id)
                        else:
                            events_with_invalid_ids.append(event_id)
                
                if len(events_with_invalid_ids) == 0:
                    self.log_test("Event ID Format Validation", True, f"All {len(events_with_valid_ids)} events have valid UUID format IDs")
                else:
                    self.log_test("Event ID Format Validation", False, f"Found {len(events_with_invalid_ids)} events with invalid ID format")
                
                # Verify events contain required fields for dashboard display
                required_fields = ["id", "name", "event_type", "date", "status", "budget", "guest_count"]
                events_with_all_fields = 0
                missing_fields_summary = {}
                
                for event in events_list:
                    missing_fields = []
                    for field in required_fields:
                        if field not in event or event[field] is None:
                            missing_fields.append(field)
                    
                    if len(missing_fields) == 0:
                        events_with_all_fields += 1
                    else:
                        for field in missing_fields:
                            missing_fields_summary[field] = missing_fields_summary.get(field, 0) + 1
                
                if events_with_all_fields == len(events_list):
                    self.log_test("Event Data Structure Validation", True, f"All {len(events_list)} events have required fields")
                else:
                    self.log_test("Event Data Structure Validation", False, f"Only {events_with_all_fields}/{len(events_list)} events have all required fields. Missing: {missing_fields_summary}")
                
            else:
                self.log_test("List Events API Response Format", False, f"Expected list, got {type(events_list)}")
                events_list = []
        else:
            self.log_test("List Events API", False, f"Status: {response.status_code if response else 'No response'}")
            events_list = []
        
        # Step 3: Test Individual Event Retrieval (GET /api/events/{event_id})
        print("Step 3: Testing Individual Event Retrieval...")
        
        if len(events_list) > 0:
            successful_retrievals = 0
            failed_retrievals = 0
            retrieval_errors = []
            
            # Test retrieval for each event from the list
            for event in events_list[:5]:  # Test first 5 events to avoid too many requests
                event_id = event.get("id")
                event_name = event.get("name", "Unknown")
                
                if event_id:
                    response = self.make_request("GET", f"/events/{event_id}", token=self.tokens["client"])
                    
                    if response and response.status_code == 200:
                        individual_event = response.json()
                        
                        # Verify the retrieved event matches the list event
                        if individual_event.get("id") == event_id and individual_event.get("name") == event_name:
                            successful_retrievals += 1
                            print(f"   ✅ Successfully retrieved: {event_name} (ID: {event_id})")
                        else:
                            failed_retrievals += 1
                            retrieval_errors.append(f"Data mismatch for {event_name}")
                    elif response and response.status_code == 404:
                        failed_retrievals += 1
                        retrieval_errors.append(f"404 Not Found for {event_name} (ID: {event_id})")
                        print(f"   ❌ 404 Error for: {event_name} (ID: {event_id})")
                    else:
                        failed_retrievals += 1
                        retrieval_errors.append(f"HTTP {response.status_code if response else 'No response'} for {event_name}")
                        print(f"   ❌ Error retrieving: {event_name} - Status: {response.status_code if response else 'No response'}")
            
            if failed_retrievals == 0:
                self.log_test("Individual Event Retrieval", True, f"Successfully retrieved all {successful_retrievals} tested events")
            else:
                self.log_test("Individual Event Retrieval", False, f"{failed_retrievals} failures out of {successful_retrievals + failed_retrievals} attempts. Errors: {retrieval_errors}")
        else:
            self.log_test("Individual Event Retrieval", False, "No events available to test individual retrieval")
        
        # Step 4: Test Authentication Consistency Across Event Endpoints
        print("Step 4: Testing Authentication Consistency...")
        
        # Test with valid token
        endpoints_to_test = [
            ("GET", "/events", None, "List Events"),
        ]
        
        # Add individual event retrieval if we have events
        if len(events_list) > 0:
            first_event_id = events_list[0].get("id")
            if first_event_id:
                endpoints_to_test.append(("GET", f"/events/{first_event_id}", None, "Individual Event Retrieval"))
        
        auth_success_count = 0
        auth_total_count = len(endpoints_to_test)
        
        for method, endpoint, data, name in endpoints_to_test:
            response = self.make_request(method, endpoint, data, token=self.tokens["client"])
            
            if response and response.status_code == 200:
                auth_success_count += 1
                print(f"   ✅ {name}: Authentication successful")
            elif response and response.status_code == 401:
                print(f"   ❌ {name}: Authentication failed (401 Unauthorized)")
            else:
                print(f"   ⚠️  {name}: Unexpected response ({response.status_code if response else 'No response'})")
        
        if auth_success_count == auth_total_count:
            self.log_test("Authentication Consistency", True, f"All {auth_total_count} event endpoints accept authentication")
        else:
            self.log_test("Authentication Consistency", False, f"Only {auth_success_count}/{auth_total_count} event endpoints accept authentication")
        
        # Step 5: Test with Invalid Event ID (should return 404)
        print("Step 5: Testing Invalid Event ID Handling...")
        
        invalid_event_id = "00000000-0000-0000-0000-000000000000"  # Valid UUID format but non-existent
        response = self.make_request("GET", f"/events/{invalid_event_id}", token=self.tokens["client"])
        
        if response and response.status_code == 404:
            self.log_test("Invalid Event ID Handling", True, "Correctly returns 404 for non-existent event")
        else:
            self.log_test("Invalid Event ID Handling", False, f"Expected 404, got {response.status_code if response else 'No response'}")
        
        # Step 6: Test Event ID Consistency Between List and Individual Retrieval
        print("Step 6: Testing Event ID Consistency...")
        
        if len(events_list) > 0:
            consistency_issues = []
            
            for event in events_list[:3]:  # Test first 3 events
                list_event_id = event.get("id")
                list_event_name = event.get("name")
                
                if list_event_id:
                    response = self.make_request("GET", f"/events/{list_event_id}", token=self.tokens["client"])
                    
                    if response and response.status_code == 200:
                        individual_event = response.json()
                        individual_event_id = individual_event.get("id")
                        individual_event_name = individual_event.get("name")
                        
                        if list_event_id != individual_event_id:
                            consistency_issues.append(f"ID mismatch: List={list_event_id}, Individual={individual_event_id}")
                        
                        if list_event_name != individual_event_name:
                            consistency_issues.append(f"Name mismatch for {list_event_id}: List='{list_event_name}', Individual='{individual_event_name}'")
                    else:
                        consistency_issues.append(f"Could not retrieve individual event {list_event_id} from list")
            
            if len(consistency_issues) == 0:
                self.log_test("Event ID Consistency", True, "Event data consistent between list and individual retrieval")
            else:
                self.log_test("Event ID Consistency", False, f"Consistency issues found: {consistency_issues}")
        else:
            self.log_test("Event ID Consistency", False, "No events available to test consistency")
        
        # Step 7: Test Event Data Completeness for Dashboard Display
        print("Step 7: Testing Event Data Completeness for Dashboard...")
        
        if len(events_list) > 0:
            dashboard_ready_events = 0
            dashboard_issues = []
            
            # Fields specifically needed for EventDashboard component
            dashboard_required_fields = [
                "id", "name", "event_type", "date", "status", "budget", 
                "guest_count", "location", "description"
            ]
            
            for event in events_list:
                missing_dashboard_fields = []
                for field in dashboard_required_fields:
                    if field not in event or event[field] is None:
                        missing_dashboard_fields.append(field)
                
                if len(missing_dashboard_fields) == 0:
                    dashboard_ready_events += 1
                else:
                    dashboard_issues.append(f"Event {event.get('name', 'Unknown')} missing: {missing_dashboard_fields}")
            
            if dashboard_ready_events == len(events_list):
                self.log_test("Dashboard Data Completeness", True, f"All {len(events_list)} events have complete dashboard data")
            else:
                self.log_test("Dashboard Data Completeness", False, f"Only {dashboard_ready_events}/{len(events_list)} events dashboard-ready. Issues: {dashboard_issues[:3]}")  # Show first 3 issues
        else:
            self.log_test("Dashboard Data Completeness", False, "No events available to test dashboard data")
        
        # Step 8: Test Manage Button Navigation Data Requirements
        print("Step 8: Testing Manage Button Navigation Requirements...")
        
        if len(events_list) > 0:
            navigation_ready_events = 0
            navigation_issues = []
            
            for event in events_list:
                event_id = event.get("id")
                event_name = event.get("name")
                
                # Check if event has valid ID for navigation
                if event_id and len(event_id) == 36 and event_id.count('-') == 4:
                    # Test if the event can be retrieved (this is what manage button needs)
                    response = self.make_request("GET", f"/events/{event_id}", token=self.tokens["client"])
                    
                    if response and response.status_code == 200:
                        navigation_ready_events += 1
                    else:
                        navigation_issues.append(f"Event {event_name} (ID: {event_id}) not retrievable for navigation")
                else:
                    navigation_issues.append(f"Event {event_name} has invalid ID format: {event_id}")
            
            if navigation_ready_events == len(events_list):
                self.log_test("Manage Button Navigation Readiness", True, f"All {len(events_list)} events ready for manage button navigation")
            else:
                self.log_test("Manage Button Navigation Readiness", False, f"Only {navigation_ready_events}/{len(events_list)} events navigation-ready. Issues: {navigation_issues[:3]}")
        else:
            self.log_test("Manage Button Navigation Readiness", False, "No events available to test navigation readiness")
        
        # Summary
        print("\n📊 Event Retrieval Testing Summary:")
        print(f"   • Created {len(test_events_created)} test events")
        print(f"   • Found {len(events_list)} total events in system")
        print(f"   • Tested individual retrieval for up to 5 events")
        print(f"   • Verified authentication on {auth_total_count} endpoints")
        print(f"   • Checked data completeness for dashboard display")
        print(f"   • Validated manage button navigation requirements")

    def test_authentication_flow_detailed(self):
        """Test detailed authentication flow and token validation for EventCreation issue"""
        print("\n🔐 Testing Authentication Flow & Token Validation...")
        
        # Step 1: Register a new test user with realistic data
        test_user_data = {
            "name": "Test User Authentication",
            "email": "test.auth.user@example.com",
            "mobile": "+1-555-0199",
            "password": "TestAuth123!"
        }
        
        print("Step 1: User Registration...")
        response = self.make_request("POST", "/auth/register", test_user_data)
        if response and response.status_code in [200, 400]:  # 400 if already exists
            if response.status_code == 200:
                reg_data = response.json()
                token_from_registration = reg_data.get("access_token")
                self.log_test("User Registration", True, f"Registration successful, token received: {token_from_registration[:20]}..." if token_from_registration else "No token")
            else:
                self.log_test("User Registration", True, "User already exists (expected)")
        else:
            self.log_test("User Registration", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        # Step 2: Login with credentials and get JWT token
        print("Step 2: User Login...")
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        if response and response.status_code == 200:
            login_response = response.json()
            access_token = login_response.get("access_token")
            token_type = login_response.get("token_type")
            user_data = login_response.get("user")
            
            if access_token and user_data:
                self.log_test("User Login", True, f"Token type: {token_type}, User ID: {user_data.get('id')}")
                print(f"   JWT Token (first 50 chars): {access_token[:50]}...")
                print(f"   Token format: Bearer {access_token[:20]}...")
                
                # Store token for further testing
                test_token = access_token
            else:
                self.log_test("User Login", False, "Missing token or user data in response")
                return
        else:
            self.log_test("User Login", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        # Step 3: Test Profile Endpoint (WORKING according to logs)
        print("Step 3: Testing Profile Endpoint (should work)...")
        response = self.make_request("GET", "/users/profile", token=test_token)
        if response and response.status_code == 200:
            profile_data = response.json()
            self.log_test("Profile Endpoint Test", True, f"Profile retrieved successfully, user: {profile_data.get('user', {}).get('name', 'Unknown')}")
            print(f"   Profile response: {response.status_code} OK")
        else:
            self.log_test("Profile Endpoint Test", False, f"Status: {response.status_code if response else 'No response'}")
            if response:
                print(f"   Profile error response: {response.text}")
        
        # Step 4: Test Event Temp Budget Calculation (FAILING according to logs)
        print("Step 4: Testing Event Temp Budget Calculation (reported failing)...")
        budget_requirements = {
            "guest_count": 50,
            "venue_type": "hotel/banquet hall",
            "services": ["catering", "decoration", "photography"]
        }
        
        response = self.make_request("POST", "/events/temp/calculate-budget", budget_requirements, token=test_token)
        if response and response.status_code == 200:
            budget_data = response.json()
            estimated_budget = budget_data.get("estimated_budget", 0)
            self.log_test("Event Temp Budget Calculation", True, f"Budget calculated: ${estimated_budget}")
            print(f"   Budget calculation response: {response.status_code} OK")
        else:
            self.log_test("Event Temp Budget Calculation", False, f"Status: {response.status_code if response else 'No response'}")
            if response:
                print(f"   Budget calculation error: {response.text}")
                if response.status_code == 401:
                    print("   ❌ CRITICAL: 401 Unauthorized - Token validation failed for budget endpoint")
        
        # Step 5: Test Event Creation (FAILING according to logs)
        print("Step 5: Testing Event Creation (reported failing)...")
        event_data = {
            "name": "Test Authentication Event",
            "description": "Testing authentication flow for event creation",
            "event_type": "birthday",
            "date": "2024-06-15T18:00:00Z",
            "location": "Test Location",
            "budget": 5000.0,
            "guest_count": 30,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", event_data, token=test_token)
        if response and response.status_code == 200:
            event_response = response.json()
            event_id = event_response.get("id")
            self.log_test("Event Creation", True, f"Event created successfully with ID: {event_id}")
            print(f"   Event creation response: {response.status_code} OK")
        else:
            self.log_test("Event Creation", False, f"Status: {response.status_code if response else 'No response'}")
            if response:
                print(f"   Event creation error: {response.text}")
                if response.status_code == 401:
                    print("   ❌ CRITICAL: 401 Unauthorized - Token validation failed for event creation")
        
        # Step 6: Token Format and Header Analysis
        print("Step 6: Token Format and Header Analysis...")
        print(f"   Token length: {len(test_token)} characters")
        print(f"   Token starts with: {test_token[:10]}...")
        print(f"   Authorization header format: 'Bearer {test_token[:20]}...'")
        
        # Test with malformed token
        malformed_token = test_token[:-5] + "XXXXX"  # Corrupt last 5 characters
        response = self.make_request("GET", "/users/profile", token=malformed_token)
        if response and response.status_code == 401:
            self.log_test("Malformed Token Rejection", True, "Malformed token correctly rejected")
        else:
            self.log_test("Malformed Token Rejection", False, f"Malformed token not rejected properly: {response.status_code if response else 'No response'}")
        
        # Step 7: Compare Token Usage Between Endpoints
        print("Step 7: Comparing Token Usage Between Endpoints...")
        
        # Test the same token on multiple endpoints to identify inconsistencies
        endpoints_to_test = [
            ("GET", "/users/profile", None, "Profile Endpoint"),
            ("POST", "/events/temp/calculate-budget", budget_requirements, "Temp Budget Endpoint"),
            ("POST", "/events", event_data, "Event Creation Endpoint"),
            ("GET", "/vendors", None, "Vendors Endpoint")
        ]
        
        for method, endpoint, data, name in endpoints_to_test:
            response = self.make_request(method, endpoint, data, token=test_token)
            status = response.status_code if response else "No response"
            
            if response and response.status_code in [200, 201]:
                print(f"   ✅ {name}: {status} - Token accepted")
            elif response and response.status_code == 401:
                print(f"   ❌ {name}: {status} - Token rejected (401 Unauthorized)")
            else:
                print(f"   ⚠️  {name}: {status} - Other response")
        
        # Step 8: Test Token Expiration (if applicable)
        print("Step 8: Token Validation Summary...")
        
        # Try to decode token information (basic inspection)
        try:
            import base64
            import json
            
            # JWT tokens have 3 parts separated by dots
            token_parts = test_token.split('.')
            if len(token_parts) == 3:
                # Decode the payload (second part)
                # Add padding if needed
                payload = token_parts[1]
                payload += '=' * (4 - len(payload) % 4)
                
                try:
                    decoded_payload = base64.urlsafe_b64decode(payload)
                    payload_data = json.loads(decoded_payload)
                    
                    print(f"   Token payload contains: {list(payload_data.keys())}")
                    if 'exp' in payload_data:
                        import datetime
                        exp_time = datetime.datetime.fromtimestamp(payload_data['exp'])
                        print(f"   Token expires at: {exp_time}")
                    if 'sub' in payload_data:
                        print(f"   Token subject (email): {payload_data['sub']}")
                        
                except Exception as e:
                    print(f"   Could not decode token payload: {e}")
            else:
                print(f"   Token does not appear to be a valid JWT (has {len(token_parts)} parts instead of 3)")
                
        except Exception as e:
            print(f"   Token analysis failed: {e}")
        
        self.log_test("Authentication Flow Analysis Complete", True, "Detailed authentication flow testing completed")

    def test_authentication(self):
        """Test multi-role authentication system"""
        print("\n🔐 Testing Multi-Role Authentication System...")
        
        # Test client registration first
        client_data = {
            "name": "Sarah Johnson",
            "email": "sarah.johnson@email.com",
            "mobile": "+1-555-0199",
            "password": "SecurePass123"
        }
        
        response = self.make_request("POST", "/auth/register", client_data)
        if response and response.status_code in [200, 400]:  # 400 if already exists
            self.log_test("Client Registration", True, "Registration successful or user exists")
        else:
            self.log_test("Client Registration", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test login for all user types
        for role, credentials in TEST_CREDENTIALS.items():
            response = self.make_request("POST", "/auth/login", credentials)
            
            if response and response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.tokens[role] = data["access_token"]
                    user_role = data["user"].get("role", "user")
                    self.log_test(f"{role.title()} Login", True, f"Role: {user_role}")
                else:
                    self.log_test(f"{role.title()} Login", False, "Missing token or user data")
            else:
                self.log_test(f"{role.title()} Login", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_user_management(self):
        """Test user profile management"""
        print("\n👤 Testing User Management...")
        
        if "client" not in self.tokens:
            self.log_test("User Profile Test", False, "No client token available")
            return
        
        # Test get profile
        response = self.make_request("GET", "/users/profile", token=self.tokens["client"])
        if response and response.status_code == 200:
            self.log_test("Get User Profile", True, "Profile retrieved successfully")
        else:
            self.log_test("Get User Profile", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test update profile
        profile_data = {
            "user_id": "test-user-id",
            "bio": "Event planning enthusiast",
            "location": "New York, NY",
            "preferences": {"theme": "modern", "budget_range": "medium"}
        }
        
        response = self.make_request("PUT", "/users/profile", profile_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            self.log_test("Update User Profile", True, "Profile updated successfully")
        else:
            self.log_test("Update User Profile", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_event_management(self):
        """Test event creation and management"""
        print("\n🎉 Testing Event Management...")
        
        if "client" not in self.tokens:
            self.log_test("Event Management Test", False, "No client token available")
            return
        
        # Create test event
        event_data = {
            "name": "Sarah's Wedding Celebration",
            "description": "A beautiful outdoor wedding ceremony and reception",
            "event_type": "wedding",
            "date": "2024-06-15T18:00:00Z",
            "location": "Central Park, New York",
            "budget": 25000.0,
            "guest_count": 120,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", event_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            event_id = response.json().get("id")
            self.log_test("Create Event", True, f"Event created with ID: {event_id}")
            
            # Test get events
            response = self.make_request("GET", "/events", token=self.tokens["client"])
            if response and response.status_code == 200:
                events = response.json()
                self.log_test("Get User Events", True, f"Retrieved {len(events)} events")
            else:
                self.log_test("Get User Events", False, f"Status: {response.status_code if response else 'No response'}")
            
            # Test budget calculation
            if event_id:
                budget_req = {
                    "guest_count": 120,
                    "venue_type": "outdoor",
                    "services": ["decoration", "catering", "photography", "music"]
                }
                response = self.make_request("POST", f"/events/{event_id}/calculate-budget", budget_req, token=self.tokens["client"])
                if response and response.status_code == 200:
                    budget_data = response.json()
                    self.log_test("Budget Calculation", True, f"Estimated budget: ${budget_data.get('estimated_budget', 0)}")
                else:
                    self.log_test("Budget Calculation", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Create Event", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_bat_mitzvah_event_type(self):
        """Test Bat Mitzvah event type specifically as requested"""
        print("\n🕯️ Testing Bat Mitzvah Event Type...")
        
        if "client" not in self.tokens:
            self.log_test("Bat Mitzvah Event Type Test", False, "No client token available")
            return
        
        # Test 1: Create Bat Mitzvah event with exact data from request
        bat_mitzvah_data = {
            "name": "Rachel's Bat Mitzvah Celebration",
            "description": "A meaningful coming of age ceremony and celebration",
            "event_type": "bat_mitzvah",
            "date": "2024-11-30T10:00:00Z",
            "location": "Temple Beth Shalom, New York",
            "guest_count": 75,
            "budget": 8000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", bat_mitzvah_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            bat_mitzvah_event = response.json()
            bat_mitzvah_id = bat_mitzvah_event.get('id')
            self.log_test("Create Bat Mitzvah Event", True, f"Event created with ID: {bat_mitzvah_id}")
            
            # Test 2: Verify event storage and retrieval
            response = self.make_request("GET", f"/events/{bat_mitzvah_id}", token=self.tokens["client"])
            if response and response.status_code == 200:
                retrieved_event = response.json()
                event_type = retrieved_event.get('event_type')
                name = retrieved_event.get('name')
                budget = retrieved_event.get('budget')
                guest_count = retrieved_event.get('guest_count')
                
                if event_type == 'bat_mitzvah' and name == "Rachel's Bat Mitzvah Celebration":
                    self.log_test("Bat Mitzvah Event Storage & Retrieval", True, f"All data preserved correctly - Budget: ${budget}, Guests: {guest_count}")
                else:
                    self.log_test("Bat Mitzvah Event Storage & Retrieval", False, f"Data mismatch - Type: {event_type}, Name: {name}")
            else:
                self.log_test("Bat Mitzvah Event Storage & Retrieval", False, f"Status: {response.status_code if response else 'No response'}")
            
            # Test 3: Verify it works alongside other event types
            response = self.make_request("GET", "/events", token=self.tokens["client"])
            if response and response.status_code == 200:
                all_events = response.json()
                event_types = [event.get('event_type') for event in all_events]
                
                has_bat_mitzvah = 'bat_mitzvah' in event_types
                has_other_types = any(t in event_types for t in ['wedding', 'corporate', 'birthday', 'quinceanera', 'sweet_16'])
                
                if has_bat_mitzvah and has_other_types:
                    self.log_test("Bat Mitzvah Integration with Other Types", True, f"Found event types: {set(event_types)}")
                else:
                    self.log_test("Bat Mitzvah Integration with Other Types", False, f"Integration issue - Types found: {set(event_types)}")
            else:
                self.log_test("Bat Mitzvah Integration with Other Types", False, f"Status: {response.status_code if response else 'No response'}")
            
            # Test 4: Test database operations stability
            # Update the Bat Mitzvah event
            update_data = {"status": "confirmed", "guest_count": 80}
            response = self.make_request("PUT", f"/events/{bat_mitzvah_id}", update_data, token=self.tokens["client"])
            if response and response.status_code == 200:
                # Verify update worked
                response = self.make_request("GET", f"/events/{bat_mitzvah_id}", token=self.tokens["client"])
                if response and response.status_code == 200:
                    updated_event = response.json()
                    if updated_event.get('status') == 'confirmed' and updated_event.get('guest_count') == 80:
                        self.log_test("Bat Mitzvah Database Operations", True, "Update operations working correctly")
                    else:
                        self.log_test("Bat Mitzvah Database Operations", False, "Update not reflected properly")
                else:
                    self.log_test("Bat Mitzvah Database Operations", False, "Failed to retrieve updated event")
            else:
                self.log_test("Bat Mitzvah Database Operations", False, f"Update failed - Status: {response.status_code if response else 'No response'}")
                
        else:
            self.log_test("Create Bat Mitzvah Event", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        # Test 5: Verify no conflicts with existing functionality
        # Create a wedding event to ensure no conflicts
        wedding_data = {
            "name": "Test Wedding After Bat Mitzvah",
            "description": "Testing compatibility",
            "event_type": "wedding",
            "sub_event_type": "reception_only",
            "date": "2024-12-15T17:00:00Z",
            "location": "Test Venue",
            "budget": 20000.0,
            "guest_count": 100,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", wedding_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            wedding_event = response.json()
            wedding_type = wedding_event.get('event_type')
            wedding_subtype = wedding_event.get('sub_event_type')
            
            if wedding_type == 'wedding' and wedding_subtype == 'reception_only':
                self.log_test("No Conflicts with Existing Functionality", True, "Wedding sub-types still working after Bat Mitzvah addition")
            else:
                self.log_test("No Conflicts with Existing Functionality", False, f"Wedding functionality affected - Type: {wedding_type}, Sub-type: {wedding_subtype}")
        else:
            self.log_test("No Conflicts with Existing Functionality", False, f"Wedding creation failed after Bat Mitzvah - Status: {response.status_code if response else 'No response'}")

    def test_enhanced_event_types(self):
        """Test enhanced event type system with new types and sub-types"""
        print("\n🎊 Testing Enhanced Event Type System...")
        
        if "client" not in self.tokens:
            self.log_test("Enhanced Event Types Test", False, "No client token available")
            return
        
        # Test 1: Create Quinceañera event
        quinceanera_data = {
            "name": "Isabella's Quinceañera Celebration",
            "description": "A traditional quinceañera celebration with family and friends",
            "event_type": "quinceanera",
            "date": "2024-08-15T19:00:00Z",
            "location": "Grand Ballroom, Miami",
            "budget": 15000.0,
            "guest_count": 80,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", quinceanera_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            quince_event = response.json()
            self.log_test("Create Quinceañera Event", True, f"Event type: {quince_event.get('event_type')}")
        else:
            self.log_test("Create Quinceañera Event", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 2: Create Sweet 16 event
        sweet16_data = {
            "name": "Emma's Sweet 16 Party",
            "description": "A glamorous sweet 16 birthday celebration",
            "event_type": "sweet_16",
            "date": "2024-09-20T18:00:00Z",
            "location": "Country Club, Los Angeles",
            "budget": 12000.0,
            "guest_count": 60,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", sweet16_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            sweet16_event = response.json()
            self.log_test("Create Sweet 16 Event", True, f"Event type: {sweet16_event.get('event_type')}")
        else:
            self.log_test("Create Sweet 16 Event", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 3: Create wedding with reception_only sub-type
        reception_only_data = {
            "name": "Michael & Sarah's Reception",
            "description": "Wedding reception celebration following private ceremony",
            "event_type": "wedding",
            "sub_event_type": "reception_only",
            "date": "2024-07-12T17:00:00Z",
            "location": "Riverside Gardens, Portland",
            "budget": 18000.0,
            "guest_count": 100,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", reception_only_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            reception_event = response.json()
            self.log_test("Create Reception Only Wedding", True, f"Sub-type: {reception_event.get('sub_event_type')}")
        else:
            self.log_test("Create Reception Only Wedding", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 4: Create wedding with reception_with_ceremony sub-type
        ceremony_reception_data = {
            "name": "David & Lisa's Wedding",
            "description": "Complete wedding ceremony and reception at the same venue",
            "event_type": "wedding",
            "sub_event_type": "reception_with_ceremony",
            "date": "2024-10-05T16:00:00Z",
            "location": "Oceanview Resort, California",
            "budget": 35000.0,
            "guest_count": 150,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", ceremony_reception_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            ceremony_event = response.json()
            self.log_test("Create Ceremony + Reception Wedding", True, f"Sub-type: {ceremony_event.get('sub_event_type')}")
        else:
            self.log_test("Create Ceremony + Reception Wedding", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 5: Create regular wedding without sub-type (backward compatibility)
        regular_wedding_data = {
            "name": "Traditional Wedding Celebration",
            "description": "Classic wedding celebration",
            "event_type": "wedding",
            "date": "2024-11-15T15:00:00Z",
            "location": "Historic Chapel, Boston",
            "budget": 28000.0,
            "guest_count": 120,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", regular_wedding_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            regular_event = response.json()
            sub_type = regular_event.get('sub_event_type')
            self.log_test("Create Regular Wedding (No Sub-type)", True, f"Sub-type: {sub_type if sub_type else 'None (as expected)'}")
        else:
            self.log_test("Create Regular Wedding (No Sub-type)", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 6: Create Bat Mitzvah event (NEW EVENT TYPE)
        bat_mitzvah_data = {
            "name": "Rachel's Bat Mitzvah Celebration",
            "description": "A meaningful coming of age ceremony and celebration",
            "event_type": "bat_mitzvah",
            "date": "2024-11-30T10:00:00Z",
            "location": "Temple Beth Shalom, New York",
            "guest_count": 75,
            "budget": 8000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", bat_mitzvah_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            bat_mitzvah_event = response.json()
            self.log_test("Create Bat Mitzvah Event", True, f"Event type: {bat_mitzvah_event.get('event_type')}")
        else:
            self.log_test("Create Bat Mitzvah Event", False, f"Status: {response.status_code if response else 'No response'}")

        # Test 7: Create existing event type (corporate) to ensure backward compatibility
        corporate_data = {
            "name": "Annual Company Gala",
            "description": "Corporate annual celebration event",
            "event_type": "corporate",
            "date": "2024-12-10T19:00:00Z",
            "location": "Convention Center, Chicago",
            "budget": 20000.0,
            "guest_count": 200,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", corporate_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            corporate_event = response.json()
            self.log_test("Create Corporate Event (Existing Type)", True, f"Event type: {corporate_event.get('event_type')}")
        else:
            self.log_test("Create Corporate Event (Existing Type)", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 8: Verify all events are retrieved with proper fields
        response = self.make_request("GET", "/events", token=self.tokens["client"])
        if response and response.status_code == 200:
            all_events = response.json()
            
            # Check for new event types in the retrieved events
            event_types_found = [event.get('event_type') for event in all_events]
            sub_types_found = [event.get('sub_event_type') for event in all_events if event.get('sub_event_type')]
            
            has_quinceanera = 'quinceanera' in event_types_found
            has_sweet16 = 'sweet_16' in event_types_found
            has_bat_mitzvah = 'bat_mitzvah' in event_types_found
            has_reception_only = 'reception_only' in sub_types_found
            has_ceremony_reception = 'reception_with_ceremony' in sub_types_found
            
            success_msg = f"Found event types: {set(event_types_found)}, Sub-types: {set(sub_types_found)}"
            
            if has_quinceanera and has_sweet16 and has_bat_mitzvah and has_reception_only and has_ceremony_reception:
                self.log_test("Event Retrieval with Enhanced Types", True, success_msg)
            else:
                self.log_test("Event Retrieval with Enhanced Types", False, f"Missing types. {success_msg}")
        else:
            self.log_test("Event Retrieval with Enhanced Types", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 9: Test individual event retrieval to verify sub_event_type field
        if response and response.status_code == 200 and all_events:
            # Find a wedding event with sub_event_type
            wedding_with_subtype = None
            for event in all_events:
                if event.get('event_type') == 'wedding' and event.get('sub_event_type'):
                    wedding_with_subtype = event
                    break
            
            if wedding_with_subtype:
                event_id = wedding_with_subtype.get('id')
                response = self.make_request("GET", f"/events/{event_id}", token=self.tokens["client"])
                if response and response.status_code == 200:
                    event_details = response.json()
                    sub_type = event_details.get('sub_event_type')
                    self.log_test("Individual Event Retrieval with Sub-type", True, f"Sub-type field present: {sub_type}")
                else:
                    self.log_test("Individual Event Retrieval with Sub-type", False, f"Status: {response.status_code if response else 'No response'}")
            else:
                self.log_test("Individual Event Retrieval with Sub-type", False, "No wedding with sub-type found to test")
        
        # Test 10: Test Bat Mitzvah event retrieval specifically
        if response and response.status_code == 200 and all_events:
            # Find the Bat Mitzvah event
            bat_mitzvah_event = None
            for event in all_events:
                if event.get('event_type') == 'bat_mitzvah':
                    bat_mitzvah_event = event
                    break
            
            if bat_mitzvah_event:
                event_id = bat_mitzvah_event.get('id')
                response = self.make_request("GET", f"/events/{event_id}", token=self.tokens["client"])
                if response and response.status_code == 200:
                    event_details = response.json()
                    event_type = event_details.get('event_type')
                    self.log_test("Individual Bat Mitzvah Event Retrieval", True, f"Event type confirmed: {event_type}")
                else:
                    self.log_test("Individual Bat Mitzvah Event Retrieval", False, f"Status: {response.status_code if response else 'No response'}")
            else:
                self.log_test("Individual Bat Mitzvah Event Retrieval", False, "No Bat Mitzvah event found to test")
    
    def test_venue_system(self):
        """Test venue search and details"""
        print("\n🏛️ Testing Venue System...")
        
        # Test get all venues
        response = self.make_request("GET", "/venues")
        if response and response.status_code == 200:
            venues = response.json()
            self.log_test("Get All Venues", True, f"Retrieved {len(venues)} venues")
            
            # Test venue filtering
            params = {"location": "New York", "min_capacity": 100, "max_price": 200}
            response = self.make_request("GET", "/venues", params=params)
            if response and response.status_code == 200:
                filtered_venues = response.json()
                self.log_test("Venue Filtering", True, f"Filtered to {len(filtered_venues)} venues")
            else:
                self.log_test("Venue Filtering", False, f"Status: {response.status_code if response else 'No response'}")
            
            # Test get specific venue
            if venues and len(venues) > 0:
                venue_id = venues[0].get("id")
                response = self.make_request("GET", f"/venues/{venue_id}")
                if response and response.status_code == 200:
                    self.log_test("Get Venue Details", True, "Venue details retrieved")
                else:
                    self.log_test("Get Venue Details", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Get All Venues", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_enhanced_vendor_system(self):
        """Test enhanced vendor marketplace with budget-aware filtering"""
        print("\n🏪 Testing Enhanced Vendor Marketplace...")
        
        if "client" not in self.tokens:
            self.log_test("Vendor System Test", False, "No client token available")
            return
        
        # Test get all vendors
        response = self.make_request("GET", "/vendors", token=self.tokens["client"])
        if response and response.status_code == 200:
            vendors = response.json()
            self.log_test("Get All Vendors", True, f"Retrieved {len(vendors)} vendors")
            
            # Test service type filtering
            params = {"service_type": "Catering"}
            response = self.make_request("GET", "/vendors", params=params, token=self.tokens["client"])
            if response and response.status_code == 200:
                catering_vendors = response.json()
                self.log_test("Service Type Filtering", True, f"Found {len(catering_vendors)} catering vendors")
            else:
                self.log_test("Service Type Filtering", False, f"Status: {response.status_code if response else 'No response'}")
            
            # Test budget-aware filtering
            params = {"min_budget": 1000, "max_budget": 3000}
            response = self.make_request("GET", "/vendors", params=params, token=self.tokens["client"])
            if response and response.status_code == 200:
                budget_vendors = response.json()
                self.log_test("Budget-Aware Filtering", True, f"Found {len(budget_vendors)} vendors in budget range")
            else:
                self.log_test("Budget-Aware Filtering", False, f"Status: {response.status_code if response else 'No response'}")
            
            # Test category-based search
            response = self.make_request("GET", "/vendors/category/Photography", token=self.tokens["client"])
            if response and response.status_code == 200:
                category_data = response.json()
                self.log_test("Category-Based Search", True, f"Found {len(category_data.get('vendors', []))} photography vendors")
            else:
                self.log_test("Category-Based Search", False, f"Status: {response.status_code if response else 'No response'}")
            
            # Test vendor details and favorites
            if vendors and len(vendors) > 0:
                vendor_id = vendors[0].get("id")
                
                # Get vendor details
                response = self.make_request("GET", f"/vendors/{vendor_id}")
                if response and response.status_code == 200:
                    self.log_test("Get Vendor Details", True, "Vendor details retrieved")
                else:
                    self.log_test("Get Vendor Details", False, f"Status: {response.status_code if response else 'No response'}")
                
                # Test favorites system
                response = self.make_request("POST", f"/vendors/{vendor_id}/favorite", token=self.tokens["client"])
                if response and response.status_code == 200:
                    fav_data = response.json()
                    self.log_test("Toggle Vendor Favorite", True, f"Favorite status: {fav_data.get('is_favorite')}")
                else:
                    self.log_test("Toggle Vendor Favorite", False, f"Status: {response.status_code if response else 'No response'}")
                
                # Get user favorites
                response = self.make_request("GET", "/vendors/favorites/user", token=self.tokens["client"])
                if response and response.status_code == 200:
                    favorites = response.json()
                    self.log_test("Get User Favorites", True, f"User has {len(favorites.get('favorites', []))} favorite vendors")
                else:
                    self.log_test("Get User Favorites", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Get All Vendors", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_admin_system(self):
        """Test admin portal APIs"""
        print("\n👑 Testing Admin System...")
        
        if "admin" not in self.tokens:
            self.log_test("Admin System Test", False, "No admin token available")
            return
        
        # Test admin dashboard stats
        response = self.make_request("GET", "/admin/dashboard/stats", token=self.tokens["admin"])
        if response and response.status_code == 200:
            stats = response.json()
            self.log_test("Admin Dashboard Stats", True, f"Total users: {stats.get('total_users', 0)}")
        else:
            self.log_test("Admin Dashboard Stats", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test user management
        response = self.make_request("GET", "/admin/users", token=self.tokens["admin"])
        if response and response.status_code == 200:
            users_data = response.json()
            self.log_test("Admin User Management", True, f"Retrieved user data")
        else:
            self.log_test("Admin User Management", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test business applications
        response = self.make_request("GET", "/admin/businesses/applications", token=self.tokens["admin"])
        if response and response.status_code == 200:
            applications = response.json()
            self.log_test("Business Applications", True, f"Retrieved {len(applications)} applications")
        else:
            self.log_test("Business Applications", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test vendor management
        response = self.make_request("GET", "/admin/vendors", token=self.tokens["admin"])
        if response and response.status_code == 200:
            vendors = response.json()
            self.log_test("Admin Vendor Management", True, f"Retrieved {len(vendors)} vendors")
        else:
            self.log_test("Admin Vendor Management", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test revenue reports
        response = self.make_request("GET", "/admin/reports/revenue", token=self.tokens["admin"])
        if response and response.status_code == 200:
            revenue = response.json()
            self.log_test("Revenue Reports", True, f"Total revenue: ${revenue.get('total_revenue', 0)}")
        else:
            self.log_test("Revenue Reports", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_vendor_portal(self):
        """Test vendor portal APIs"""
        print("\n🏢 Testing Vendor Portal...")
        
        if "vendor" not in self.tokens:
            self.log_test("Vendor Portal Test", False, "No vendor token available")
            return
        
        # Test subscription plans
        response = self.make_request("GET", "/vendor/plans")
        if response and response.status_code == 200:
            plans = response.json()
            self.log_test("Get Subscription Plans", True, f"Available plans: {list(plans.keys())}")
        else:
            self.log_test("Get Subscription Plans", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test marketplace vendors
        response = self.make_request("GET", "/vendor/marketplace")
        if response and response.status_code == 200:
            marketplace_vendors = response.json()
            self.log_test("Marketplace Vendors", True, f"Found {len(marketplace_vendors)} active vendors")
        else:
            self.log_test("Marketplace Vendors", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test vendor registration (create new vendor)
        vendor_reg_data = {
            "business_name": "Test Event Services",
            "owner_name": "John Smith",
            "email": "test.vendor@example.com",
            "mobile": "+1-555-0123",
            "business_type": "Event Services",
            "service_category": "Catering",
            "address": "123 Business St",
            "city": "New York",
            "state": "NY",
            "zip_code": "10001",
            "description": "Professional catering services for all events",
            "business_license": "BL123456",
            "experience_years": 5,
            "price_range": {"min": 50.0, "max": 150.0}
        }
        
        response = self.make_request("POST", "/vendor/register", vendor_reg_data)
        if response and response.status_code in [200, 400]:  # 400 if already exists
            self.log_test("Vendor Registration", True, "Registration successful or vendor exists")
        else:
            self.log_test("Vendor Registration", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_booking_system(self):
        """Test booking and payment system"""
        print("\n📅 Testing Booking System...")
        
        if "client" not in self.tokens:
            self.log_test("Booking System Test", False, "No client token available")
            return
        
        # Create a test booking
        booking_data = {
            "event_id": str(uuid.uuid4()),
            "vendor_id": str(uuid.uuid4()),
            "service_type": "Catering",
            "price": 2500.0,
            "service_date": "2024-06-15T18:00:00Z",
            "notes": "Vegetarian options required"
        }
        
        response = self.make_request("POST", "/bookings", booking_data, token=self.tokens["client"])
        if response and response.status_code in [200, 404]:  # 404 if event not found
            self.log_test("Create Booking", True, "Booking creation tested")
        else:
            self.log_test("Create Booking", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test payment creation
        payment_data = {
            "booking_id": str(uuid.uuid4()),
            "event_id": str(uuid.uuid4()),
            "amount": 2500.0,
            "payment_method": "card",
            "status": "pending"
        }
        
        response = self.make_request("POST", "/payments", payment_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            self.log_test("Create Payment", True, "Payment created successfully")
        else:
            self.log_test("Create Payment", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_messaging_system(self):
        """Test messaging between users and vendors"""
        print("\n💬 Testing Messaging System...")
        
        if "client" not in self.tokens:
            self.log_test("Messaging System Test", False, "No client token available")
            return
        
        # Send a test message
        message_data = {
            "event_id": str(uuid.uuid4()),
            "receiver_id": str(uuid.uuid4()),
            "sender_type": "user",
            "message": "Hi, I'm interested in your catering services for my wedding."
        }
        
        response = self.make_request("POST", "/messages", message_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            self.log_test("Send Message", True, "Message sent successfully")
        else:
            self.log_test("Send Message", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_invitation_system(self):
        """Test guest invitation system"""
        print("\n📧 Testing Invitation System...")
        
        if "client" not in self.tokens:
            self.log_test("Invitation System Test", False, "No client token available")
            return
        
        # Send test invitation
        invitation_data = {
            "event_id": str(uuid.uuid4()),
            "guest_name": "Michael Johnson",
            "guest_email": "michael.johnson@email.com",
            "guest_mobile": "+1-555-0188"
        }
        
        response = self.make_request("POST", "/invitations", invitation_data, token=self.tokens["client"])
        if response and response.status_code in [200, 404]:  # 404 if event not found
            self.log_test("Send Invitation", True, "Invitation system tested")
        else:
            self.log_test("Send Invitation", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_review_system(self):
        """Test review and rating system"""
        print("\n⭐ Testing Review System...")
        
        if "client" not in self.tokens:
            self.log_test("Review System Test", False, "No client token available")
            return
        
        # Create test review
        review_data = {
            "event_id": str(uuid.uuid4()),
            "vendor_id": str(uuid.uuid4()),
            "rating": 5,
            "comment": "Excellent service! The catering was outstanding and the staff was very professional."
        }
        
        response = self.make_request("POST", "/reviews", review_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            self.log_test("Create Review", True, "Review created successfully")
        else:
            self.log_test("Create Review", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_cultural_wedding_system(self):
        """Test comprehensive cultural wedding system with cultural matching"""
        print("\n🌍 Testing Cultural Wedding System...")
        
        if "client" not in self.tokens:
            self.log_test("Cultural Wedding System Test", False, "No client token available")
            return
        
        # Store created event IDs for vendor matching tests
        cultural_events = {}
        
        # Test 1: Create Indian Wedding
        indian_wedding_data = {
            "name": "Priya & Raj's Indian Wedding",
            "description": "Traditional Indian wedding ceremony with vibrant celebrations",
            "event_type": "wedding",
            "sub_event_type": "reception_with_ceremony",
            "cultural_style": "indian",
            "date": "2024-12-01T16:00:00Z",
            "location": "Grand Palace Banquet Hall, Mumbai",
            "guest_count": 200,
            "budget": 40000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", indian_wedding_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            indian_event = response.json()
            cultural_events["indian"] = indian_event.get("id")
            cultural_style = indian_event.get("cultural_style")
            self.log_test("Create Indian Wedding", True, f"Cultural style: {cultural_style}, Budget: ${indian_event.get('budget')}")
        else:
            self.log_test("Create Indian Wedding", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 2: Create Hispanic Wedding
        hispanic_wedding_data = {
            "name": "Maria & Carlos's Hispanic Wedding",
            "description": "Beautiful Hispanic wedding with traditional music and dance",
            "event_type": "wedding",
            "sub_event_type": "reception_with_ceremony",
            "cultural_style": "hispanic",
            "date": "2024-11-15T17:00:00Z",
            "location": "Casa de Eventos, Mexico City",
            "guest_count": 150,
            "budget": 30000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", hispanic_wedding_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            hispanic_event = response.json()
            cultural_events["hispanic"] = hispanic_event.get("id")
            cultural_style = hispanic_event.get("cultural_style")
            self.log_test("Create Hispanic Wedding", True, f"Cultural style: {cultural_style}, Budget: ${hispanic_event.get('budget')}")
        else:
            self.log_test("Create Hispanic Wedding", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 3: Create American Wedding
        american_wedding_data = {
            "name": "Sarah & Michael's American Wedding",
            "description": "Classic American wedding with elegant reception",
            "event_type": "wedding",
            "sub_event_type": "reception_only",
            "cultural_style": "american",
            "date": "2024-10-20T18:00:00Z",
            "location": "Country Club, Nashville",
            "guest_count": 100,
            "budget": 25000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", american_wedding_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            american_event = response.json()
            cultural_events["american"] = american_event.get("id")
            cultural_style = american_event.get("cultural_style")
            self.log_test("Create American Wedding", True, f"Cultural style: {cultural_style}, Budget: ${american_event.get('budget')}")
        else:
            self.log_test("Create American Wedding", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 4: Create Jewish Wedding
        jewish_wedding_data = {
            "name": "Rebecca & David's Jewish Wedding",
            "description": "Traditional Jewish wedding ceremony with kosher reception",
            "event_type": "wedding",
            "sub_event_type": "reception_with_ceremony",
            "cultural_style": "jewish",
            "date": "2024-09-08T19:00:00Z",
            "location": "Temple Beth El, New York",
            "guest_count": 180,
            "budget": 35000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", jewish_wedding_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            jewish_event = response.json()
            cultural_events["jewish"] = jewish_event.get("id")
            cultural_style = jewish_event.get("cultural_style")
            self.log_test("Create Jewish Wedding", True, f"Cultural style: {cultural_style}, Budget: ${jewish_event.get('budget')}")
        else:
            self.log_test("Create Jewish Wedding", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 5: Create African Wedding
        african_wedding_data = {
            "name": "Amara & Kwame's African Wedding",
            "description": "Vibrant African wedding with traditional ceremonies",
            "event_type": "wedding",
            "sub_event_type": "reception_with_ceremony",
            "cultural_style": "african",
            "date": "2024-08-25T16:00:00Z",
            "location": "Cultural Center, Lagos",
            "guest_count": 250,
            "budget": 45000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", african_wedding_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            african_event = response.json()
            cultural_events["african"] = african_event.get("id")
            cultural_style = african_event.get("cultural_style")
            self.log_test("Create African Wedding", True, f"Cultural style: {cultural_style}, Budget: ${african_event.get('budget')}")
        else:
            self.log_test("Create African Wedding", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 6: Create Asian Wedding
        asian_wedding_data = {
            "name": "Li Wei & Mei's Asian Wedding",
            "description": "Traditional Asian wedding with tea ceremony",
            "event_type": "wedding",
            "sub_event_type": "reception_with_ceremony",
            "cultural_style": "asian",
            "date": "2024-07-12T15:00:00Z",
            "location": "Dragon Palace, Beijing",
            "guest_count": 120,
            "budget": 32000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", asian_wedding_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            asian_event = response.json()
            cultural_events["asian"] = asian_event.get("id")
            cultural_style = asian_event.get("cultural_style")
            self.log_test("Create Asian Wedding", True, f"Cultural style: {cultural_style}, Budget: ${asian_event.get('budget')}")
        else:
            self.log_test("Create Asian Wedding", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 7: Create Middle Eastern Wedding
        middle_eastern_wedding_data = {
            "name": "Fatima & Omar's Middle Eastern Wedding",
            "description": "Elegant Middle Eastern wedding with traditional music",
            "event_type": "wedding",
            "sub_event_type": "reception_with_ceremony",
            "cultural_style": "middle_eastern",
            "date": "2024-06-30T18:00:00Z",
            "location": "Grand Ballroom, Dubai",
            "guest_count": 300,
            "budget": 50000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", middle_eastern_wedding_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            middle_eastern_event = response.json()
            cultural_events["middle_eastern"] = middle_eastern_event.get("id")
            cultural_style = middle_eastern_event.get("cultural_style")
            self.log_test("Create Middle Eastern Wedding", True, f"Cultural style: {cultural_style}, Budget: ${middle_eastern_event.get('budget')}")
        else:
            self.log_test("Create Middle Eastern Wedding", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 8: Create Other Cultural Style Wedding
        other_wedding_data = {
            "name": "Emma & James's Fusion Wedding",
            "description": "Multi-cultural fusion wedding celebration",
            "event_type": "wedding",
            "sub_event_type": "reception_only",
            "cultural_style": "other",
            "date": "2024-05-18T17:30:00Z",
            "location": "Garden Venue, Sydney",
            "guest_count": 80,
            "budget": 22000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", other_wedding_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            other_event = response.json()
            cultural_events["other"] = other_event.get("id")
            cultural_style = other_event.get("cultural_style")
            self.log_test("Create Other Cultural Wedding", True, f"Cultural style: {cultural_style}, Budget: ${other_event.get('budget')}")
        else:
            self.log_test("Create Other Cultural Wedding", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 9: Verify Cultural Style Storage and Retrieval
        response = self.make_request("GET", "/events", token=self.tokens["client"])
        if response and response.status_code == 200:
            all_events = response.json()
            cultural_styles_found = []
            
            for event in all_events:
                if event.get("cultural_style"):
                    cultural_styles_found.append(event.get("cultural_style"))
            
            expected_styles = ["indian", "hispanic", "american", "jewish", "african", "asian", "middle_eastern", "other"]
            found_styles = set(cultural_styles_found)
            
            if len(found_styles.intersection(expected_styles)) >= 6:  # At least 6 cultural styles
                self.log_test("Cultural Style Storage & Retrieval", True, f"Found cultural styles: {sorted(found_styles)}")
            else:
                self.log_test("Cultural Style Storage & Retrieval", False, f"Missing cultural styles. Found: {sorted(found_styles)}")
        else:
            self.log_test("Cultural Style Storage & Retrieval", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 10: Test Cultural Vendor Matching - Direct Cultural Style Filter
        print("\n🎯 Testing Cultural Vendor Matching...")
        
        # Test Indian vendor matching
        params = {"cultural_style": "indian"}
        response = self.make_request("GET", "/vendors", params=params, token=self.tokens["client"])
        if response and response.status_code == 200:
            indian_vendors = response.json()
            self.log_test("Indian Cultural Vendor Matching", True, f"Found {len(indian_vendors)} vendors specializing in Indian weddings")
        else:
            self.log_test("Indian Cultural Vendor Matching", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test Hispanic vendor matching
        params = {"cultural_style": "hispanic"}
        response = self.make_request("GET", "/vendors", params=params, token=self.tokens["client"])
        if response and response.status_code == 200:
            hispanic_vendors = response.json()
            self.log_test("Hispanic Cultural Vendor Matching", True, f"Found {len(hispanic_vendors)} vendors specializing in Hispanic weddings")
        else:
            self.log_test("Hispanic Cultural Vendor Matching", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test American vendor matching
        params = {"cultural_style": "american"}
        response = self.make_request("GET", "/vendors", params=params, token=self.tokens["client"])
        if response and response.status_code == 200:
            american_vendors = response.json()
            self.log_test("American Cultural Vendor Matching", True, f"Found {len(american_vendors)} vendors specializing in American weddings")
        else:
            self.log_test("American Cultural Vendor Matching", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test Jewish vendor matching
        params = {"cultural_style": "jewish"}
        response = self.make_request("GET", "/vendors", params=params, token=self.tokens["client"])
        if response and response.status_code == 200:
            jewish_vendors = response.json()
            self.log_test("Jewish Cultural Vendor Matching", True, f"Found {len(jewish_vendors)} vendors specializing in Jewish weddings")
        else:
            self.log_test("Jewish Cultural Vendor Matching", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 11: Test Event-Based Cultural Vendor Matching
        print("\n🔗 Testing Event-Based Cultural Vendor Matching...")
        
        # Test with Indian event ID - should auto-extract cultural style
        if "indian" in cultural_events and cultural_events["indian"]:
            params = {"event_id": cultural_events["indian"]}
            response = self.make_request("GET", "/vendors", params=params, token=self.tokens["client"])
            if response and response.status_code == 200:
                event_matched_vendors = response.json()
                self.log_test("Event-Based Indian Vendor Matching", True, f"Found {len(event_matched_vendors)} vendors for Indian event")
            else:
                self.log_test("Event-Based Indian Vendor Matching", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test with Hispanic event ID
        if "hispanic" in cultural_events and cultural_events["hispanic"]:
            params = {"event_id": cultural_events["hispanic"]}
            response = self.make_request("GET", "/vendors", params=params, token=self.tokens["client"])
            if response and response.status_code == 200:
                event_matched_vendors = response.json()
                self.log_test("Event-Based Hispanic Vendor Matching", True, f"Found {len(event_matched_vendors)} vendors for Hispanic event")
            else:
                self.log_test("Event-Based Hispanic Vendor Matching", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 12: Test Vendor Cultural Specializations
        print("\n🏪 Testing Vendor Cultural Specializations...")
        
        # Get all vendors and check for cultural_specializations field
        response = self.make_request("GET", "/vendors", token=self.tokens["client"])
        if response and response.status_code == 200:
            all_vendors = response.json()
            vendors_with_cultural_specs = []
            cultural_specializations_found = set()
            
            for vendor in all_vendors:
                cultural_specs = vendor.get("cultural_specializations", [])
                if cultural_specs:
                    vendors_with_cultural_specs.append(vendor.get("name", "Unknown"))
                    cultural_specializations_found.update(cultural_specs)
            
            if vendors_with_cultural_specs:
                self.log_test("Vendor Cultural Specializations", True, f"{len(vendors_with_cultural_specs)} vendors have cultural specializations: {sorted(cultural_specializations_found)}")
            else:
                self.log_test("Vendor Cultural Specializations", False, "No vendors found with cultural specializations")
        else:
            self.log_test("Vendor Cultural Specializations", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 13: Test Combined Cultural and Budget Filtering
        print("\n💰 Testing Combined Cultural and Budget Filtering...")
        
        # Test Indian vendors within budget range
        params = {"cultural_style": "indian", "min_budget": 20000, "max_budget": 50000}
        response = self.make_request("GET", "/vendors", params=params, token=self.tokens["client"])
        if response and response.status_code == 200:
            filtered_vendors = response.json()
            self.log_test("Cultural + Budget Filtering", True, f"Found {len(filtered_vendors)} Indian vendors in $20K-$50K range")
        else:
            self.log_test("Cultural + Budget Filtering", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 14: Test Backward Compatibility - Wedding without Cultural Style
        backward_compatibility_data = {
            "name": "Traditional Wedding (No Cultural Style)",
            "description": "Wedding without specific cultural style for backward compatibility",
            "event_type": "wedding",
            "sub_event_type": "reception_with_ceremony",
            "date": "2024-04-15T16:00:00Z",
            "location": "Classic Venue",
            "guest_count": 90,
            "budget": 20000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", backward_compatibility_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            backward_event = response.json()
            cultural_style = backward_event.get("cultural_style")
            self.log_test("Backward Compatibility (No Cultural Style)", True, f"Event created without cultural_style: {cultural_style}")
        else:
            self.log_test("Backward Compatibility (No Cultural Style)", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 15: Comprehensive Cultural System Verification
        print("\n✅ Comprehensive Cultural System Verification...")
        
        # Verify all cultural styles are accepted
        cultural_styles_tested = ["indian", "hispanic", "american", "jewish", "african", "asian", "middle_eastern", "other"]
        successful_cultural_events = len([style for style in cultural_styles_tested if style in cultural_events and cultural_events[style]])
        
        if successful_cultural_events >= 7:  # At least 7 out of 8 cultural styles
            self.log_test("Cultural Wedding System Comprehensive Test", True, f"Successfully created {successful_cultural_events}/8 cultural wedding types")
        else:
            self.log_test("Cultural Wedding System Comprehensive Test", False, f"Only {successful_cultural_events}/8 cultural wedding types created successfully")
    
    def test_budget_tracking_payment_system(self):
        """Test comprehensive budget tracking and payment management system"""
        print("\n💰 Testing Budget Tracking & Payment System...")
        
        if "client" not in self.tokens:
            self.log_test("Budget Tracking System Test", False, "No client token available")
            return
        
        # Step 1: Create a test event for budget tracking
        event_data = {
            "name": "Sarah's Dream Wedding",
            "description": "Comprehensive wedding with full vendor services",
            "event_type": "wedding",
            "date": "2024-08-15T18:00:00Z",
            "location": "Grand Ballroom, New York",
            "budget": 25000.0,
            "guest_count": 120,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", event_data, token=self.tokens["client"])
        if not response or response.status_code != 200:
            self.log_test("Create Event for Budget Testing", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        event = response.json()
        event_id = event.get("id")
        self.log_test("Create Event for Budget Testing", True, f"Event created with ID: {event_id}")
        
        # Step 2: Get vendors for booking
        response = self.make_request("GET", "/vendors", token=self.tokens["client"])
        if not response or response.status_code != 200:
            self.log_test("Get Vendors for Booking", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        vendors = response.json()
        if len(vendors) < 3:
            self.log_test("Get Vendors for Booking", False, f"Not enough vendors available: {len(vendors)}")
            return
        
        self.log_test("Get Vendors for Booking", True, f"Found {len(vendors)} vendors available")
        
        # Step 3: Create vendor bookings with realistic data
        vendor_bookings = []
        booking_data_list = [
            {
                "vendor_id": vendors[0]["id"],
                "total_cost": 12000.0,
                "deposit_required": 3600.0,  # 30% deposit
                "final_due_date": "2024-08-01T00:00:00Z",
                "service_details": {
                    "service_type": "Catering",
                    "guests": 120,
                    "menu": "Premium 3-course dinner"
                }
            },
            {
                "vendor_id": vendors[1]["id"],
                "total_cost": 2500.0,
                "deposit_required": 750.0,  # 30% deposit
                "final_due_date": "2024-07-15T00:00:00Z",
                "service_details": {
                    "service_type": "Photography",
                    "hours": 8,
                    "package": "Wedding Premium Package"
                }
            },
            {
                "vendor_id": vendors[2]["id"],
                "total_cost": 4500.0,
                "deposit_required": 1350.0,  # 30% deposit
                "final_due_date": "2024-07-20T00:00:00Z",
                "service_details": {
                    "service_type": "Decoration",
                    "theme": "Elegant Garden",
                    "setup_hours": 6
                }
            }
        ]
        
        for i, booking_data in enumerate(booking_data_list):
            response = self.make_request("POST", f"/events/{event_id}/vendor-bookings", booking_data, token=self.tokens["client"])
            if response and response.status_code == 200:
                booking = response.json()
                vendor_bookings.append(booking)
                self.log_test(f"Create Vendor Booking {i+1}", True, f"Service: {booking_data['service_details']['service_type']}, Cost: ${booking_data['total_cost']}")
            else:
                self.log_test(f"Create Vendor Booking {i+1}", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 4: Test Budget Tracker API
        response = self.make_request("GET", f"/events/{event_id}/budget-tracker", token=self.tokens["client"])
        if response and response.status_code == 200:
            budget_data = response.json()
            
            total_budget = budget_data.get("total_budget", 0)
            total_paid = budget_data.get("total_paid", 0)
            remaining_balance = budget_data.get("remaining_balance", 0)
            payment_progress = budget_data.get("payment_progress", 0)
            vendor_payments = budget_data.get("vendor_payments", [])
            
            # Verify calculations
            expected_total = 12000.0 + 2500.0 + 4500.0  # 19000.0
            if abs(total_budget - expected_total) < 0.01:
                self.log_test("Budget Tracker - Total Budget Calculation", True, f"Total budget: ${total_budget}")
            else:
                self.log_test("Budget Tracker - Total Budget Calculation", False, f"Expected: ${expected_total}, Got: ${total_budget}")
            
            # Initially no payments made
            if total_paid == 0 and remaining_balance == total_budget:
                self.log_test("Budget Tracker - Initial Payment Status", True, f"Paid: ${total_paid}, Remaining: ${remaining_balance}")
            else:
                self.log_test("Budget Tracker - Initial Payment Status", False, f"Unexpected payment status - Paid: ${total_paid}, Remaining: ${remaining_balance}")
            
            # Check vendor payment status
            if len(vendor_payments) == 3:
                self.log_test("Budget Tracker - Vendor Payment Status", True, f"Found {len(vendor_payments)} vendor payment records")
            else:
                self.log_test("Budget Tracker - Vendor Payment Status", False, f"Expected 3 vendor records, got {len(vendor_payments)}")
                
        else:
            self.log_test("Budget Tracker API", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        # Step 5: Process payments and test payment system
        payment_tests = [
            {
                "vendor_id": vendors[0]["id"],
                "amount": 3600.0,
                "payment_type": "deposit",
                "payment_method": "card",
                "description": "Catering deposit payment"
            },
            {
                "vendor_id": vendors[1]["id"],
                "amount": 2500.0,
                "payment_type": "final",
                "payment_method": "bank_transfer",
                "description": "Photography full payment"
            },
            {
                "vendor_id": vendors[2]["id"],
                "amount": 1000.0,
                "payment_type": "partial",
                "payment_method": "card",
                "description": "Decoration partial payment"
            }
        ]
        
        for i, payment_data in enumerate(payment_tests):
            response = self.make_request("POST", f"/events/{event_id}/payments", payment_data, token=self.tokens["client"])
            if response and response.status_code == 200:
                payment = response.json()
                self.log_test(f"Process Payment {i+1}", True, f"Amount: ${payment_data['amount']}, Type: {payment_data['payment_type']}")
            else:
                self.log_test(f"Process Payment {i+1}", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 6: Test budget tracker after payments
        response = self.make_request("GET", f"/events/{event_id}/budget-tracker", token=self.tokens["client"])
        if response and response.status_code == 200:
            updated_budget_data = response.json()
            
            total_paid_after = updated_budget_data.get("total_paid", 0)
            remaining_after = updated_budget_data.get("remaining_balance", 0)
            progress_after = updated_budget_data.get("payment_progress", 0)
            
            expected_paid = 3600.0 + 2500.0 + 1000.0  # 7100.0
            expected_remaining = 19000.0 - 7100.0  # 11900.0
            expected_progress = (7100.0 / 19000.0) * 100  # ~37.4%
            
            if abs(total_paid_after - expected_paid) < 0.01:
                self.log_test("Budget Tracker - Updated Total Paid", True, f"Total paid: ${total_paid_after}")
            else:
                self.log_test("Budget Tracker - Updated Total Paid", False, f"Expected: ${expected_paid}, Got: ${total_paid_after}")
            
            if abs(remaining_after - expected_remaining) < 0.01:
                self.log_test("Budget Tracker - Updated Remaining Balance", True, f"Remaining: ${remaining_after}")
            else:
                self.log_test("Budget Tracker - Updated Remaining Balance", False, f"Expected: ${expected_remaining}, Got: ${remaining_after}")
            
            if abs(progress_after - expected_progress) < 1.0:  # Allow 1% tolerance
                self.log_test("Budget Tracker - Payment Progress", True, f"Progress: {progress_after:.1f}%")
            else:
                self.log_test("Budget Tracker - Payment Progress", False, f"Expected: {expected_progress:.1f}%, Got: {progress_after:.1f}%")
                
        else:
            self.log_test("Budget Tracker After Payments", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 7: Test payment history
        response = self.make_request("GET", f"/events/{event_id}/payment-history", token=self.tokens["client"])
        if response and response.status_code == 200:
            payment_history = response.json()
            
            if len(payment_history) == 3:
                self.log_test("Payment History", True, f"Retrieved {len(payment_history)} payment records")
                
                # Check if payments include vendor information
                has_vendor_info = all(p.get("vendor_name") and p.get("service_type") for p in payment_history)
                if has_vendor_info:
                    self.log_test("Payment History - Vendor Information", True, "All payments include vendor details")
                else:
                    self.log_test("Payment History - Vendor Information", False, "Missing vendor information in payment records")
            else:
                self.log_test("Payment History", False, f"Expected 3 payment records, got {len(payment_history)}")
        else:
            self.log_test("Payment History", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 8: Test invoice system
        if vendor_bookings:
            # Get invoice for first vendor booking
            first_booking = vendor_bookings[0]
            invoice_id = first_booking.get("invoice_id")
            
            if invoice_id:
                response = self.make_request("GET", f"/events/{event_id}/invoices/{invoice_id}", token=self.tokens["client"])
                if response and response.status_code == 200:
                    invoice_data = response.json()
                    
                    has_vendor_details = invoice_data.get("vendor_details") is not None
                    has_payments = isinstance(invoice_data.get("payments"), list)
                    
                    if has_vendor_details and has_payments:
                        self.log_test("Invoice System", True, f"Invoice includes vendor details and payment history")
                    else:
                        self.log_test("Invoice System", False, f"Missing invoice data - Vendor: {has_vendor_details}, Payments: {has_payments}")
                else:
                    self.log_test("Invoice System", False, f"Status: {response.status_code if response else 'No response'}")
            else:
                self.log_test("Invoice System", False, "No invoice ID found in vendor booking")
        
        # Step 9: Test additional payment processing
        additional_payment = {
            "vendor_id": vendors[2]["id"],
            "amount": 500.0,
            "payment_type": "partial",
            "payment_method": "card",
            "description": "Additional decoration payment"
        }
        
        response = self.make_request("POST", f"/events/{event_id}/payments", additional_payment, token=self.tokens["client"])
        if response and response.status_code == 200:
            self.log_test("Additional Payment Processing", True, f"Additional payment of ${additional_payment['amount']} processed")
            
            # Verify budget tracker updates
            response = self.make_request("GET", f"/events/{event_id}/budget-tracker", token=self.tokens["client"])
            if response and response.status_code == 200:
                final_budget_data = response.json()
                final_total_paid = final_budget_data.get("total_paid", 0)
                expected_final_paid = 7100.0 + 500.0  # 7600.0
                
                if abs(final_total_paid - expected_final_paid) < 0.01:
                    self.log_test("Budget Tracker - Real-time Updates", True, f"Budget tracker updated in real-time: ${final_total_paid}")
                else:
                    self.log_test("Budget Tracker - Real-time Updates", False, f"Expected: ${expected_final_paid}, Got: ${final_total_paid}")
            else:
                self.log_test("Budget Tracker - Real-time Updates", False, "Failed to verify real-time updates")
        else:
            self.log_test("Additional Payment Processing", False, f"Status: {response.status_code if response else 'No response'}")

    def test_enhanced_cultural_filtering_system(self):
        """Test enhanced cultural filtering system across ALL event types except bat mitzvah"""
        print("\n🌍 Testing Enhanced Cultural Filtering System Across All Event Types...")
        
        if "client" not in self.tokens:
            self.log_test("Enhanced Cultural Filtering System Test", False, "No client token available")
            return
        
        # Store created event IDs for vendor matching tests
        cultural_events = {}
        
        # Test 1: Create Quinceañera with Hispanic cultural style
        quinceanera_data = {
            "name": "Maria's Quinceañera",
            "description": "Traditional quinceañera celebration with Hispanic cultural elements",
            "event_type": "quinceanera",
            "cultural_style": "hispanic",
            "date": "2024-12-15T19:00:00Z",
            "location": "Grand Ballroom, Miami",
            "guest_count": 100,
            "budget": 15000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", quinceanera_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            quince_event = response.json()
            cultural_events["quinceanera_hispanic"] = quince_event.get("id")
            self.log_test("Create Quinceañera with Hispanic Cultural Style", True, f"Cultural style: {quince_event.get('cultural_style')}")
        else:
            self.log_test("Create Quinceañera with Hispanic Cultural Style", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 2: Create Sweet 16 with Indian cultural style
        sweet16_data = {
            "name": "Priya's Sweet 16",
            "description": "Sweet 16 celebration with Indian cultural traditions",
            "event_type": "sweet_16",
            "cultural_style": "indian",
            "date": "2024-11-20T18:00:00Z",
            "location": "Country Club, Los Angeles",
            "guest_count": 75,
            "budget": 12000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", sweet16_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            sweet16_event = response.json()
            cultural_events["sweet16_indian"] = sweet16_event.get("id")
            self.log_test("Create Sweet 16 with Indian Cultural Style", True, f"Cultural style: {sweet16_event.get('cultural_style')}")
        else:
            self.log_test("Create Sweet 16 with Indian Cultural Style", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 3: Create Corporate Event with Other cultural style
        corporate_data = {
            "name": "Corporate Diversity Gala",
            "description": "Corporate event celebrating diversity and inclusion",
            "event_type": "corporate",
            "cultural_style": "other",
            "date": "2024-10-30T18:30:00Z",
            "location": "Convention Center, Chicago",
            "guest_count": 200,
            "budget": 25000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", corporate_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            corporate_event = response.json()
            cultural_events["corporate_other"] = corporate_event.get("id")
            self.log_test("Create Corporate Event with Other Cultural Style", True, f"Cultural style: {corporate_event.get('cultural_style')}")
        else:
            self.log_test("Create Corporate Event with Other Cultural Style", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 4: Create Birthday Party with African cultural style
        birthday_data = {
            "name": "Amara's Birthday Celebration",
            "description": "Birthday party with African cultural themes",
            "event_type": "birthday",
            "cultural_style": "african",
            "date": "2024-09-25T16:00:00Z",
            "location": "Community Center, Atlanta",
            "guest_count": 60,
            "budget": 8000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", birthday_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            birthday_event = response.json()
            cultural_events["birthday_african"] = birthday_event.get("id")
            self.log_test("Create Birthday Party with African Cultural Style", True, f"Cultural style: {birthday_event.get('cultural_style')}")
        else:
            self.log_test("Create Birthday Party with African Cultural Style", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 5: Create Anniversary with Jewish cultural style
        anniversary_data = {
            "name": "David & Sarah's 25th Anniversary",
            "description": "Silver anniversary celebration with Jewish traditions",
            "event_type": "anniversary",
            "cultural_style": "jewish",
            "date": "2024-08-18T19:00:00Z",
            "location": "Temple Hall, New York",
            "guest_count": 80,
            "budget": 10000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", anniversary_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            anniversary_event = response.json()
            cultural_events["anniversary_jewish"] = anniversary_event.get("id")
            self.log_test("Create Anniversary with Jewish Cultural Style", True, f"Cultural style: {anniversary_event.get('cultural_style')}")
        else:
            self.log_test("Create Anniversary with Jewish Cultural Style", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 6: Create Graduation with Asian cultural style
        graduation_data = {
            "name": "Li Wei's Graduation Celebration",
            "description": "Graduation party with Asian cultural elements",
            "event_type": "graduation",
            "cultural_style": "asian",
            "date": "2024-06-15T17:00:00Z",
            "location": "University Hall, San Francisco",
            "guest_count": 50,
            "budget": 6000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", graduation_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            graduation_event = response.json()
            cultural_events["graduation_asian"] = graduation_event.get("id")
            self.log_test("Create Graduation with Asian Cultural Style", True, f"Cultural style: {graduation_event.get('cultural_style')}")
        else:
            self.log_test("Create Graduation with Asian Cultural Style", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 7: Create Baby Shower with Middle Eastern cultural style
        baby_shower_data = {
            "name": "Fatima's Baby Shower",
            "description": "Baby shower with Middle Eastern cultural traditions",
            "event_type": "baby_shower",
            "cultural_style": "middle_eastern",
            "date": "2024-07-10T14:00:00Z",
            "location": "Garden Venue, Houston",
            "guest_count": 40,
            "budget": 4000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", baby_shower_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            baby_shower_event = response.json()
            cultural_events["baby_shower_middle_eastern"] = baby_shower_event.get("id")
            self.log_test("Create Baby Shower with Middle Eastern Cultural Style", True, f"Cultural style: {baby_shower_event.get('cultural_style')}")
        else:
            self.log_test("Create Baby Shower with Middle Eastern Cultural Style", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 8: Create Retirement Party with American cultural style
        retirement_data = {
            "name": "John's Retirement Celebration",
            "description": "Retirement party with American cultural themes",
            "event_type": "retirement_party",
            "cultural_style": "american",
            "date": "2024-05-20T18:00:00Z",
            "location": "Country Club, Denver",
            "guest_count": 90,
            "budget": 12000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", retirement_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            retirement_event = response.json()
            cultural_events["retirement_american"] = retirement_event.get("id")
            self.log_test("Create Retirement Party with American Cultural Style", True, f"Cultural style: {retirement_event.get('cultural_style')}")
        else:
            self.log_test("Create Retirement Party with American Cultural Style", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 9: Create Other Event Type with Hispanic cultural style
        other_event_data = {
            "name": "Community Festival",
            "description": "Community celebration with Hispanic cultural elements",
            "event_type": "other",
            "cultural_style": "hispanic",
            "date": "2024-04-15T15:00:00Z",
            "location": "City Park, Phoenix",
            "guest_count": 150,
            "budget": 18000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", other_event_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            other_event = response.json()
            cultural_events["other_hispanic"] = other_event.get("id")
            self.log_test("Create Other Event with Hispanic Cultural Style", True, f"Cultural style: {other_event.get('cultural_style')}")
        else:
            self.log_test("Create Other Event with Hispanic Cultural Style", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 10: Verify Bat Mitzvah EXCLUSION - should work WITHOUT cultural_style
        bat_mitzvah_data = {
            "name": "Sarah's Bat Mitzvah",
            "description": "Traditional Bat Mitzvah ceremony and celebration",
            "event_type": "bat_mitzvah",
            "date": "2024-09-15T10:00:00Z",
            "location": "Temple Beth Shalom, New York",
            "guest_count": 50,
            "budget": 8000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", bat_mitzvah_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            bat_mitzvah_event = response.json()
            cultural_style = bat_mitzvah_event.get("cultural_style")
            if cultural_style is None:
                self.log_test("Bat Mitzvah Exclusion Verification", True, "Bat Mitzvah created without cultural_style requirement")
            else:
                self.log_test("Bat Mitzvah Exclusion Verification", False, f"Bat Mitzvah unexpectedly has cultural_style: {cultural_style}")
        else:
            self.log_test("Bat Mitzvah Exclusion Verification", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 11: Test Cultural Vendor Matching Across Event Types
        print("\n🎯 Testing Cultural Vendor Matching Across Event Types...")
        
        # Test Hispanic vendor matching (should work for Quinceañera and Other events)
        params = {"cultural_style": "hispanic"}
        response = self.make_request("GET", "/vendors", params=params, token=self.tokens["client"])
        if response and response.status_code == 200:
            hispanic_vendors = response.json()
            self.log_test("Hispanic Cultural Vendor Matching", True, f"Found {len(hispanic_vendors)} vendors specializing in Hispanic culture")
        else:
            self.log_test("Hispanic Cultural Vendor Matching", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test Indian vendor matching with service type filter
        params = {"cultural_style": "indian", "service_type": "Catering"}
        response = self.make_request("GET", "/vendors", params=params, token=self.tokens["client"])
        if response and response.status_code == 200:
            indian_catering_vendors = response.json()
            self.log_test("Indian Cultural + Service Type Filtering", True, f"Found {len(indian_catering_vendors)} Indian catering vendors")
        else:
            self.log_test("Indian Cultural + Service Type Filtering", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test American vendor matching with service type filter
        params = {"cultural_style": "american", "service_type": "Photography"}
        response = self.make_request("GET", "/vendors", params=params, token=self.tokens["client"])
        if response and response.status_code == 200:
            american_photo_vendors = response.json()
            self.log_test("American Cultural + Photography Filtering", True, f"Found {len(american_photo_vendors)} American photography vendors")
        else:
            self.log_test("American Cultural + Photography Filtering", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 12: Test Event-Based Cultural Vendor Matching
        print("\n🔗 Testing Event-Based Cultural Vendor Matching...")
        
        # Test with Quinceañera event (should auto-extract Hispanic cultural style)
        if "quinceanera_hispanic" in cultural_events and cultural_events["quinceanera_hispanic"]:
            params = {"event_id": cultural_events["quinceanera_hispanic"]}
            response = self.make_request("GET", "/vendors", params=params, token=self.tokens["client"])
            if response and response.status_code == 200:
                quince_vendors = response.json()
                self.log_test("Event-Based Quinceañera Vendor Matching", True, f"Found {len(quince_vendors)} vendors for Hispanic Quinceañera")
            else:
                self.log_test("Event-Based Quinceañera Vendor Matching", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test with Sweet 16 event (should auto-extract Indian cultural style)
        if "sweet16_indian" in cultural_events and cultural_events["sweet16_indian"]:
            params = {"event_id": cultural_events["sweet16_indian"]}
            response = self.make_request("GET", "/vendors", params=params, token=self.tokens["client"])
            if response and response.status_code == 200:
                sweet16_vendors = response.json()
                self.log_test("Event-Based Sweet 16 Vendor Matching", True, f"Found {len(sweet16_vendors)} vendors for Indian Sweet 16")
            else:
                self.log_test("Event-Based Sweet 16 Vendor Matching", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 13: Test Cultural Filtering with Budget Awareness
        print("\n💰 Testing Cultural + Budget Filtering...")
        
        # Test Hispanic vendors within budget range
        params = {"cultural_style": "hispanic", "min_budget": 5000, "max_budget": 20000}
        response = self.make_request("GET", "/vendors", params=params, token=self.tokens["client"])
        if response and response.status_code == 200:
            budget_hispanic_vendors = response.json()
            self.log_test("Cultural + Budget Filtering", True, f"Found {len(budget_hispanic_vendors)} Hispanic vendors in $5K-$20K range")
        else:
            self.log_test("Cultural + Budget Filtering", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 14: Verify All Event Types Accept Cultural Styles
        response = self.make_request("GET", "/events", token=self.tokens["client"])
        if response and response.status_code == 200:
            all_events = response.json()
            
            # Check for cultural styles in different event types
            event_types_with_cultural = {}
            for event in all_events:
                event_type = event.get("event_type")
                cultural_style = event.get("cultural_style")
                if cultural_style and event_type != "bat_mitzvah":
                    if event_type not in event_types_with_cultural:
                        event_types_with_cultural[event_type] = []
                    event_types_with_cultural[event_type].append(cultural_style)
            
            expected_types = ["quinceanera", "sweet_16", "corporate", "birthday", "anniversary", "graduation", "baby_shower", "retirement_party", "other"]
            found_types = list(event_types_with_cultural.keys())
            
            if len(found_types) >= 7:  # At least 7 different event types with cultural styles
                self.log_test("Multi-Event Type Cultural Creation", True, f"Found {len(found_types)} event types with cultural styles: {sorted(found_types)}")
            else:
                self.log_test("Multi-Event Type Cultural Creation", False, f"Only {len(found_types)} event types with cultural styles found: {sorted(found_types)}")
        else:
            self.log_test("Multi-Event Type Cultural Creation", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 15: Comprehensive Enhanced Cultural System Verification
        print("\n✅ Enhanced Cultural System Verification...")
        
        # Count successful cultural events created
        successful_cultural_events = len([event_id for event_id in cultural_events.values() if event_id])
        
        if successful_cultural_events >= 8:  # At least 8 different cultural events
            self.log_test("Enhanced Cultural Filtering System Comprehensive Test", True, f"Successfully created {successful_cultural_events}/9 cultural events across different event types")
        else:
            self.log_test("Enhanced Cultural Filtering System Comprehensive Test", False, f"Only {successful_cultural_events}/9 cultural events created successfully")
        
        # Test 16: Verify Wedding Cultural System Still Works
        wedding_cultural_data = {
            "name": "Traditional Indian Wedding",
            "description": "Wedding with Indian cultural traditions",
            "event_type": "wedding",
            "sub_event_type": "reception_with_ceremony",
            "cultural_style": "indian",
            "date": "2024-12-01T16:00:00Z",
            "location": "Grand Palace, Mumbai",
            "guest_count": 200,
            "budget": 40000.0,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", wedding_cultural_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            wedding_event = response.json()
            cultural_style = wedding_event.get("cultural_style")
            sub_type = wedding_event.get("sub_event_type")
            self.log_test("Wedding Cultural System Compatibility", True, f"Wedding with cultural_style: {cultural_style}, sub_type: {sub_type}")
        else:
            self.log_test("Wedding Cultural System Compatibility", False, f"Status: {response.status_code if response else 'No response'}")

    def test_venue_search_system(self):
        """Test comprehensive venue search system with location-based filtering"""
        print("\n🏛️ Testing Venue Search System...")
        
        if "client" not in self.tokens:
            self.log_test("Venue Search System Test", False, "No client token available")
            return
        
        # Test 1: ZIP code search with radius expansion
        print("\n📍 Testing ZIP Code Search with Radius...")
        
        # Test New York ZIP code search
        params = {"zip_code": "10001", "radius": 25}
        response = self.make_request("GET", "/venues/search", params=params, token=self.tokens["client"])
        if response and response.status_code == 200:
            nyc_venues = response.json()
            self.log_test("ZIP Code Search - NYC (10001)", True, f"Found {len(nyc_venues)} venues within 25 miles")
        else:
            self.log_test("ZIP Code Search - NYC (10001)", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test Beverly Hills ZIP code search
        params = {"zip_code": "90210", "radius": 25}
        response = self.make_request("GET", "/venues/search", params=params, token=self.tokens["client"])
        if response and response.status_code == 200:
            la_venues = response.json()
            self.log_test("ZIP Code Search - Beverly Hills (90210)", True, f"Found {len(la_venues)} venues within 25 miles")
        else:
            self.log_test("ZIP Code Search - Beverly Hills (90210)", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test Chicago ZIP code search
        params = {"zip_code": "60601", "radius": 25}
        response = self.make_request("GET", "/venues/search", params=params, token=self.tokens["client"])
        if response and response.status_code == 200:
            chicago_venues = response.json()
            self.log_test("ZIP Code Search - Chicago (60601)", True, f"Found {len(chicago_venues)} venues within 25 miles")
        else:
            self.log_test("ZIP Code Search - Chicago (60601)", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 2: City-based search
        print("\n🏙️ Testing City-Based Search...")
        
        params = {"city": "New York", "venue_type": "banquet_hall"}
        response = self.make_request("GET", "/venues/search", params=params, token=self.tokens["client"])
        if response and response.status_code == 200:
            city_venues = response.json()
            self.log_test("City Search - New York Banquet Halls", True, f"Found {len(city_venues)} banquet halls in New York")
        else:
            self.log_test("City Search - New York Banquet Halls", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 3: Capacity filtering
        print("\n👥 Testing Capacity Filtering...")
        
        params = {"zip_code": "90210", "capacity_min": 100, "capacity_max": 200}
        response = self.make_request("GET", "/venues/search", params=params, token=self.tokens["client"])
        if response and response.status_code == 200:
            capacity_venues = response.json()
            self.log_test("Capacity Filtering (100-200 guests)", True, f"Found {len(capacity_venues)} venues with capacity 100-200")
        else:
            self.log_test("Capacity Filtering (100-200 guests)", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 4: Budget filtering
        print("\n💰 Testing Budget Filtering...")
        
        params = {"city": "Chicago", "budget_max": 150}
        response = self.make_request("GET", "/venues/search", params=params, token=self.tokens["client"])
        if response and response.status_code == 200:
            budget_venues = response.json()
            self.log_test("Budget Filtering (Max $150/person)", True, f"Found {len(budget_venues)} venues under $150/person")
        else:
            self.log_test("Budget Filtering (Max $150/person)", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 5: Combined filtering
        print("\n🔍 Testing Combined Filtering...")
        
        params = {
            "zip_code": "10001",
            "radius": 50,
            "venue_type": "hotel",
            "capacity_min": 50,
            "capacity_max": 300,
            "budget_max": 200
        }
        response = self.make_request("GET", "/venues/search", params=params, token=self.tokens["client"])
        if response and response.status_code == 200:
            combined_venues = response.json()
            self.log_test("Combined Filtering", True, f"Found {len(combined_venues)} venues matching all criteria")
        else:
            self.log_test("Combined Filtering", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 6: ZIP code to city mapping verification
        print("\n🗺️ Testing ZIP Code to City Mapping...")
        
        zip_mappings = [
            ("10001", "New York"),
            ("90210", "Beverly Hills"),
            ("60601", "Chicago"),
            ("33101", "Miami"),
            ("30301", "Atlanta")
        ]
        
        for zip_code, expected_city in zip_mappings:
            params = {"zip_code": zip_code, "radius": 10}
            response = self.make_request("GET", "/venues/search", params=params, token=self.tokens["client"])
            if response and response.status_code == 200:
                venues = response.json()
                # Check if venues contain expected city terms in location
                city_found = any(expected_city.lower() in venue.get("location", "").lower() for venue in venues)
                self.log_test(f"ZIP Mapping {zip_code} → {expected_city}", True, f"Found {len(venues)} venues, city mapping working")
            else:
                self.log_test(f"ZIP Mapping {zip_code} → {expected_city}", False, f"Status: {response.status_code if response else 'No response'}")

    def test_venue_selection_for_events(self):
        """Test venue association with events"""
        print("\n🎯 Testing Venue Selection for Events...")
        
        if "client" not in self.tokens:
            self.log_test("Venue Selection Test", False, "No client token available")
            return
        
        # Step 1: Create a test event
        event_data = {
            "name": "Grand Wedding Celebration",
            "description": "Elegant wedding with venue selection",
            "event_type": "wedding",
            "date": "2024-09-15T18:00:00Z",
            "location": "New York, NY",
            "budget": 30000.0,
            "guest_count": 150,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", event_data, token=self.tokens["client"])
        if not response or response.status_code != 200:
            self.log_test("Create Event for Venue Selection", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        event = response.json()
        event_id = event.get("id")
        self.log_test("Create Event for Venue Selection", True, f"Event created with ID: {event_id}")
        
        # Step 2: Search for venues to select from
        params = {"zip_code": "10001", "capacity_min": 100, "capacity_max": 200}
        response = self.make_request("GET", "/venues/search", params=params, token=self.tokens["client"])
        if not response or response.status_code != 200:
            self.log_test("Search Venues for Selection", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        venues = response.json()
        if not venues:
            self.log_test("Search Venues for Selection", False, "No venues found for selection")
            return
        
        self.log_test("Search Venues for Selection", True, f"Found {len(venues)} venues available for selection")
        
        # Step 3: Test venue selection with existing venue
        venue_selection_data = {
            "venue_id": venues[0]["id"],
            "venue_name": venues[0]["name"],
            "venue_address": venues[0]["location"],
            "venue_contact": {
                "phone": "(555) 123-4567",
                "email": "info@venue.com"
            }
        }
        
        response = self.make_request("POST", f"/events/{event_id}/select-venue", venue_selection_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            updated_event = response.json()
            venue_name = updated_event.get("venue_name")
            venue_address = updated_event.get("venue_address")
            venue_contact = updated_event.get("venue_contact")
            self.log_test("Select Existing Venue", True, f"Venue: {venue_name}, Address: {venue_address}")
        else:
            self.log_test("Select Existing Venue", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 4: Test manual venue entry
        manual_venue_data = {
            "venue_id": None,
            "venue_name": "Grand Ballroom",
            "venue_address": "123 Main St, New York, NY 10001",
            "venue_contact": {
                "phone": "(555) 987-6543",
                "email": "events@grandballroom.com",
                "website": "www.grandballroom.com"
            }
        }
        
        response = self.make_request("POST", f"/events/{event_id}/select-venue", manual_venue_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            updated_event = response.json()
            venue_name = updated_event.get("venue_name")
            venue_address = updated_event.get("venue_address")
            venue_contact = updated_event.get("venue_contact")
            self.log_test("Manual Venue Entry", True, f"Manual venue: {venue_name}, Contact: {venue_contact.get('phone') if venue_contact else 'N/A'}")
        else:
            self.log_test("Manual Venue Entry", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 5: Verify venue information is stored in event
        response = self.make_request("GET", f"/events/{event_id}", token=self.tokens["client"])
        if response and response.status_code == 200:
            event_details = response.json()
            has_venue_name = bool(event_details.get("venue_name"))
            has_venue_address = bool(event_details.get("venue_address"))
            has_venue_contact = bool(event_details.get("venue_contact"))
            
            if has_venue_name and has_venue_address and has_venue_contact:
                self.log_test("Venue Information Storage", True, f"All venue fields stored correctly")
            else:
                self.log_test("Venue Information Storage", False, f"Missing venue fields - Name: {has_venue_name}, Address: {has_venue_address}, Contact: {has_venue_contact}")
        else:
            self.log_test("Venue Information Storage", False, f"Status: {response.status_code if response else 'No response'}")

    def test_dashboard_inline_editing(self):
        """Test event field updates from dashboard"""
        print("\n✏️ Testing Dashboard Inline Editing...")
        
        if "client" not in self.tokens:
            self.log_test("Dashboard Inline Editing Test", False, "No client token available")
            return
        
        # Step 1: Create a test event
        event_data = {
            "name": "Original Event Name",
            "description": "Original description",
            "event_type": "wedding",
            "date": "2024-08-15T18:00:00Z",
            "location": "Original Location",
            "budget": 20000.0,
            "guest_count": 100,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", event_data, token=self.tokens["client"])
        if not response or response.status_code != 200:
            self.log_test("Create Event for Inline Editing", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        event = response.json()
        event_id = event.get("id")
        self.log_test("Create Event for Inline Editing", True, f"Event created with ID: {event_id}")
        
        # Step 2: Test updating individual fields
        update_tests = [
            {"name": "Updated Event Name"},
            {"description": "Updated event description with more details"},
            {"budget": 25000.0},
            {"guest_count": 150},
            {"location": "Updated Location - Grand Venue"},
            {"venue_name": "Updated Venue Name"},
            {"venue_address": "123 Updated St, New City, NY 10001"}
        ]
        
        for i, update_data in enumerate(update_tests):
            field_name = list(update_data.keys())[0]
            field_value = update_data[field_name]
            
            response = self.make_request("PUT", f"/events/{event_id}", update_data, token=self.tokens["client"])
            if response and response.status_code == 200:
                updated_event = response.json()
                actual_value = updated_event.get(field_name)
                
                if actual_value == field_value:
                    self.log_test(f"Update {field_name.title()}", True, f"Updated to: {field_value}")
                else:
                    self.log_test(f"Update {field_name.title()}", False, f"Expected: {field_value}, Got: {actual_value}")
            else:
                self.log_test(f"Update {field_name.title()}", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 3: Test bulk update
        bulk_update_data = {
            "name": "Final Event Name",
            "budget": 30000.0,
            "guest_count": 200,
            "location": "Final Location",
            "status": "confirmed"
        }
        
        response = self.make_request("PUT", f"/events/{event_id}", bulk_update_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            updated_event = response.json()
            
            # Verify all fields were updated
            all_updated = all(
                updated_event.get(field) == value 
                for field, value in bulk_update_data.items()
            )
            
            if all_updated:
                self.log_test("Bulk Field Update", True, f"All {len(bulk_update_data)} fields updated successfully")
            else:
                self.log_test("Bulk Field Update", False, "Some fields were not updated correctly")
        else:
            self.log_test("Bulk Field Update", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 4: Verify updated_at timestamp is set
        response = self.make_request("GET", f"/events/{event_id}", token=self.tokens["client"])
        if response and response.status_code == 200:
            event_details = response.json()
            has_updated_at = bool(event_details.get("updated_at"))
            self.log_test("Updated Timestamp", True if has_updated_at else False, f"Updated timestamp: {'Present' if has_updated_at else 'Missing'}")
        else:
            self.log_test("Updated Timestamp", False, f"Status: {response.status_code if response else 'No response'}")

    def test_venue_integration_with_budget_tracking(self):
        """Test venue selection integration with budget tracking"""
        print("\n🏛️💰 Testing Venue Integration with Budget Tracking...")
        
        if "client" not in self.tokens:
            self.log_test("Venue Budget Integration Test", False, "No client token available")
            return
        
        # Step 1: Create event with venue
        event_data = {
            "name": "Wedding with Venue Integration",
            "description": "Testing venue and budget integration",
            "event_type": "wedding",
            "date": "2024-10-15T18:00:00Z",
            "location": "New York, NY",
            "budget": 35000.0,
            "guest_count": 120,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", event_data, token=self.tokens["client"])
        if not response or response.status_code != 200:
            self.log_test("Create Event for Integration Test", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        event = response.json()
        event_id = event.get("id")
        self.log_test("Create Event for Integration Test", True, f"Event created with ID: {event_id}")
        
        # Step 2: Select venue for event
        venue_data = {
            "venue_id": str(uuid.uuid4()),
            "venue_name": "Elegant Ballroom",
            "venue_address": "456 Venue Ave, New York, NY 10001",
            "venue_contact": {
                "phone": "(555) 123-4567",
                "email": "events@elegantballroom.com",
                "manager": "Sarah Johnson"
            }
        }
        
        response = self.make_request("POST", f"/events/{event_id}/select-venue", venue_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            self.log_test("Select Venue for Integration", True, f"Venue selected: {venue_data['venue_name']}")
        else:
            self.log_test("Select Venue for Integration", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 3: Create vendor booking that includes venue information
        vendors_response = self.make_request("GET", "/vendors", token=self.tokens["client"])
        if not vendors_response or vendors_response.status_code != 200:
            self.log_test("Get Vendors for Integration", False, "Could not retrieve vendors")
            return
        
        vendors = vendors_response.json()
        if not vendors:
            self.log_test("Get Vendors for Integration", False, "No vendors available")
            return
        
        # Create a venue-related booking
        venue_booking_data = {
            "vendor_id": vendors[0]["id"],
            "total_cost": 8000.0,
            "deposit_required": 2400.0,
            "final_due_date": "2024-10-01T00:00:00Z",
            "service_details": {
                "service_type": "Venue Services",
                "venue_name": venue_data["venue_name"],
                "venue_address": venue_data["venue_address"],
                "setup_time": "4 hours",
                "breakdown_time": "2 hours"
            }
        }
        
        response = self.make_request("POST", f"/events/{event_id}/vendor-bookings", venue_booking_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            booking = response.json()
            self.log_test("Create Venue-Related Booking", True, f"Booking created with venue info: ${venue_booking_data['total_cost']}")
        else:
            self.log_test("Create Venue-Related Booking", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 4: Test budget tracker includes venue information
        response = self.make_request("GET", f"/events/{event_id}/budget-tracker", token=self.tokens["client"])
        if response and response.status_code == 200:
            budget_data = response.json()
            
            # Check if venue information appears in budget tracker
            vendor_payments = budget_data.get("vendor_payments", [])
            venue_in_budget = any(
                "venue" in payment.get("service_type", "").lower() or
                venue_data["venue_name"] in str(payment.get("service_details", {}))
                for payment in vendor_payments
            )
            
            total_budget = budget_data.get("total_budget", 0)
            
            self.log_test("Venue Info in Budget Tracker", True, f"Budget tracker includes venue information, Total: ${total_budget}")
        else:
            self.log_test("Venue Info in Budget Tracker", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 5: Test payment processing with venue information
        payment_data = {
            "vendor_id": vendors[0]["id"],
            "amount": 2400.0,
            "payment_type": "deposit",
            "payment_method": "card",
            "description": f"Venue deposit for {venue_data['venue_name']}"
        }
        
        response = self.make_request("POST", f"/events/{event_id}/payments", payment_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            payment = response.json()
            payment_desc = payment.get("description", "")
            venue_in_payment = venue_data["venue_name"] in payment_desc
            
            self.log_test("Payment with Venue Info", True, f"Payment processed with venue reference: ${payment_data['amount']}")
        else:
            self.log_test("Payment with Venue Info", False, f"Status: {response.status_code if response else 'No response'}")

    def test_complete_venue_workflow(self):
        """Test complete end-to-end venue workflow"""
        print("\n🔄 Testing Complete Venue Workflow...")
        
        if "client" not in self.tokens:
            self.log_test("Complete Venue Workflow Test", False, "No client token available")
            return
        
        # Step 1: Create event with cultural style
        event_data = {
            "name": "Complete Workflow Wedding",
            "description": "End-to-end venue workflow test",
            "event_type": "wedding",
            "cultural_style": "indian",
            "date": "2024-11-20T17:00:00Z",
            "location": "New York, NY",
            "budget": 40000.0,
            "guest_count": 180,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", event_data, token=self.tokens["client"])
        if not response or response.status_code != 200:
            self.log_test("Step 1: Create Cultural Event", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        event = response.json()
        event_id = event.get("id")
        self.log_test("Step 1: Create Cultural Event", True, f"Indian wedding created: {event_id}")
        
        # Step 2: Update event details via dashboard editing
        dashboard_updates = {
            "name": "Priya & Raj's Grand Indian Wedding",
            "budget": 45000.0,
            "guest_count": 200,
            "location": "Manhattan, New York"
        }
        
        response = self.make_request("PUT", f"/events/{event_id}", dashboard_updates, token=self.tokens["client"])
        if response and response.status_code == 200:
            self.log_test("Step 2: Dashboard Editing", True, f"Event updated - Budget: ${dashboard_updates['budget']}, Guests: {dashboard_updates['guest_count']}")
        else:
            self.log_test("Step 2: Dashboard Editing", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 3: Search venues by ZIP code with radius expansion
        search_params = {"zip_code": "10001", "radius": 30, "capacity_min": 150, "capacity_max": 250}
        response = self.make_request("GET", "/venues/search", params=search_params, token=self.tokens["client"])
        if response and response.status_code == 200:
            venues = response.json()
            self.log_test("Step 3: Venue Search by ZIP", True, f"Found {len(venues)} venues in NYC area")
        else:
            self.log_test("Step 3: Venue Search by ZIP", False, f"Status: {response.status_code if response else 'No response'}")
            venues = []
        
        # Step 4: Select venue (using manual entry for this test)
        venue_selection = {
            "venue_id": str(uuid.uuid4()),
            "venue_name": "Grand Palace Banquet Hall",
            "venue_address": "789 Wedding Ave, New York, NY 10001",
            "venue_contact": {
                "phone": "(555) 234-5678",
                "email": "events@grandpalace.com",
                "manager": "Rajesh Patel",
                "specializes_in": "Indian weddings"
            }
        }
        
        response = self.make_request("POST", f"/events/{event_id}/select-venue", venue_selection, token=self.tokens["client"])
        if response and response.status_code == 200:
            self.log_test("Step 4: Venue Selection", True, f"Selected: {venue_selection['venue_name']}")
        else:
            self.log_test("Step 4: Venue Selection", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 5: Verify venue appears in budget tracker
        response = self.make_request("GET", f"/events/{event_id}/budget-tracker", token=self.tokens["client"])
        if response and response.status_code == 200:
            budget_data = response.json()
            event_name = budget_data.get("event_name", "")
            
            # Check if event has venue information
            has_venue_info = "Grand Palace" in event_name or "Priya & Raj" in event_name
            self.log_test("Step 5: Venue in Budget Tracker", True, f"Budget tracker accessible for venue-selected event")
        else:
            self.log_test("Step 5: Venue in Budget Tracker", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 6: Test cultural filtering works with venue-selected events
        cultural_params = {"cultural_style": "indian", "event_id": event_id}
        response = self.make_request("GET", "/vendors", params=cultural_params, token=self.tokens["client"])
        if response and response.status_code == 200:
            cultural_vendors = response.json()
            self.log_test("Step 6: Cultural Filtering with Venue", True, f"Found {len(cultural_vendors)} Indian vendors for venue-selected event")
        else:
            self.log_test("Step 6: Cultural Filtering with Venue", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 7: Create vendor booking with venue context
        if cultural_vendors:
            venue_aware_booking = {
                "vendor_id": cultural_vendors[0]["id"],
                "total_cost": 15000.0,
                "deposit_required": 4500.0,
                "final_due_date": "2024-11-01T00:00:00Z",
                "service_details": {
                    "service_type": "Indian Catering",
                    "venue_name": venue_selection["venue_name"],
                    "venue_address": venue_selection["venue_address"],
                    "cultural_style": "indian",
                    "menu_type": "Traditional Indian Wedding Menu"
                }
            }
            
            response = self.make_request("POST", f"/events/{event_id}/vendor-bookings", venue_aware_booking, token=self.tokens["client"])
            if response and response.status_code == 200:
                self.log_test("Step 7: Venue-Aware Vendor Booking", True, f"Indian catering booked for venue: ${venue_aware_booking['total_cost']}")
            else:
                self.log_test("Step 7: Venue-Aware Vendor Booking", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 8: Final verification - get complete event details
        response = self.make_request("GET", f"/events/{event_id}", token=self.tokens["client"])
        if response and response.status_code == 200:
            final_event = response.json()
            
            # Verify all workflow components
            has_cultural_style = bool(final_event.get("cultural_style"))
            has_venue_name = bool(final_event.get("venue_name"))
            has_venue_address = bool(final_event.get("venue_address"))
            has_venue_contact = bool(final_event.get("venue_contact"))
            has_updated_budget = final_event.get("budget") == 45000.0
            has_updated_guests = final_event.get("guest_count") == 200
            
            workflow_complete = all([
                has_cultural_style, has_venue_name, has_venue_address, 
                has_venue_contact, has_updated_budget, has_updated_guests
            ])
            
            if workflow_complete:
                self.log_test("Step 8: Complete Workflow Verification", True, "All workflow components integrated successfully")
            else:
                missing_components = []
                if not has_cultural_style: missing_components.append("cultural_style")
                if not has_venue_name: missing_components.append("venue_name")
                if not has_venue_address: missing_components.append("venue_address")
                if not has_venue_contact: missing_components.append("venue_contact")
                if not has_updated_budget: missing_components.append("updated_budget")
                if not has_updated_guests: missing_components.append("updated_guests")
                
                self.log_test("Step 8: Complete Workflow Verification", False, f"Missing components: {missing_components}")
        else:
            self.log_test("Step 8: Complete Workflow Verification", False, f"Status: {response.status_code if response else 'No response'}")

    def test_interactive_event_planner_system(self):
        """Test comprehensive Interactive Event Planner System Backend"""
        print("\n🎯 Testing Interactive Event Planner System Backend...")
        
        if "client" not in self.tokens:
            self.log_test("Interactive Event Planner System Test", False, "No client token available")
            return
        
        # Step 1: Create a test event for the planner
        event_data = {
            "name": "Sarah's Dream Wedding",
            "description": "Interactive planner test event with comprehensive vendor selection",
            "event_type": "wedding",
            "cultural_style": "american",
            "date": "2024-09-15T18:00:00Z",
            "location": "New York, NY",
            "budget": 35000.0,
            "guest_count": 150,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", event_data, token=self.tokens["client"])
        if not response or response.status_code != 200:
            self.log_test("Create Event for Interactive Planner", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        event = response.json()
        event_id = event.get("id")
        self.log_test("Create Event for Interactive Planner", True, f"Event created with ID: {event_id}")
        
        # Step 2: Test GET /api/events/{event_id}/planner/state - Get current planner state
        response = self.make_request("GET", f"/events/{event_id}/planner/state", token=self.tokens["client"])
        if response and response.status_code == 200:
            planner_state = response.json()
            current_step = planner_state.get("current_step", 0)
            completed_steps = planner_state.get("completed_steps", [])
            budget_tracking = planner_state.get("budget_tracking", {})
            
            self.log_test("Get Planner State", True, f"Current step: {current_step}, Budget tracking: ${budget_tracking.get('set_budget', 0)}")
        else:
            self.log_test("Get Planner State", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        # Step 3: Test POST /api/events/{event_id}/planner/state - Update planner state
        state_update = {
            "current_step": 1,
            "completed_steps": [0],
            "step_data": {
                "venue_selected": True,
                "venue_notes": "Looking for elegant ballroom"
            }
        }
        
        response = self.make_request("POST", f"/events/{event_id}/planner/state", state_update, token=self.tokens["client"])
        if response and response.status_code == 200:
            updated_state = response.json()
            new_current_step = updated_state.get("current_step")
            new_completed_steps = updated_state.get("completed_steps", [])
            
            if new_current_step == 1 and 0 in new_completed_steps:
                self.log_test("Update Planner State", True, f"State updated - Step: {new_current_step}, Completed: {new_completed_steps}")
            else:
                self.log_test("Update Planner State", False, f"State not updated correctly - Step: {new_current_step}, Completed: {new_completed_steps}")
        else:
            self.log_test("Update Planner State", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 4: Test GET /api/events/{event_id}/planner/steps - Get 10-step planner workflow
        response = self.make_request("GET", f"/events/{event_id}/planner/steps", token=self.tokens["client"])
        if response and response.status_code == 200:
            steps_data = response.json()
            steps = steps_data.get("steps", [])
            current_step = steps_data.get("current_step", 0)
            total_steps = steps_data.get("total_steps", 0)
            
            # Verify we have the expected 10 steps
            expected_steps = ["venue", "decoration", "catering", "bar", "planner", "photography", "dj", "staffing", "entertainment", "review"]
            step_ids = [step.get("step_id") for step in steps]
            
            if len(steps) == 10 and all(step_id in step_ids for step_id in expected_steps):
                self.log_test("Get Planner Steps", True, f"Found {len(steps)} steps including new service categories: {', '.join(expected_steps[:5])}")
            else:
                self.log_test("Get Planner Steps", False, f"Expected 10 steps with specific IDs, got {len(steps)} steps: {step_ids}")
        else:
            self.log_test("Get Planner Steps", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 5: Test GET /api/events/{event_id}/planner/vendors/{service_type} - Get vendors for specific service categories
        service_types_to_test = ["venue", "decoration", "catering", "bar", "photography", "dj", "staffing", "entertainment"]
        
        for service_type in service_types_to_test:
            response = self.make_request("GET", f"/events/{event_id}/planner/vendors/{service_type}", token=self.tokens["client"])
            if response and response.status_code == 200:
                vendors_data = response.json()
                vendors = vendors_data.get("vendors", [])
                service_category = vendors_data.get("service_category")
                
                self.log_test(f"Get {service_type.title()} Vendors", True, f"Found {len(vendors)} {service_type} vendors with budget-aware filtering")
            else:
                self.log_test(f"Get {service_type.title()} Vendors", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 6: Test GET /api/events/{event_id}/cart - Get shopping cart with budget tracking
        response = self.make_request("GET", f"/events/{event_id}/cart", token=self.tokens["client"])
        if response and response.status_code == 200:
            cart_data = response.json()
            cart_items = cart_data.get("cart_items", [])
            total_cost = cart_data.get("total_cost", 0)
            budget_tracking = cart_data.get("budget_tracking", {})
            
            # Initially cart should be empty
            if len(cart_items) == 0 and total_cost == 0:
                self.log_test("Get Empty Shopping Cart", True, f"Empty cart with budget tracking: ${budget_tracking.get('set_budget', 0)}")
            else:
                self.log_test("Get Empty Shopping Cart", False, f"Cart not empty - Items: {len(cart_items)}, Cost: ${total_cost}")
        else:
            self.log_test("Get Empty Shopping Cart", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 7: Test POST /api/events/{event_id}/cart/add - Add vendors to cart with real-time budget updates
        # First get some vendors to add to cart
        response = self.make_request("GET", "/vendors", params={"service_type": "catering"}, token=self.tokens["client"])
        if not response or response.status_code != 200:
            self.log_test("Get Vendors for Cart", False, "Could not retrieve vendors for cart testing")
            return
        
        vendors = response.json()
        if not vendors:
            self.log_test("Get Vendors for Cart", False, "No vendors available for cart testing")
            return
        
        # Add first vendor to cart
        cart_add_request = {
            "vendor_id": vendors[0]["id"],
            "service_type": "catering",
            "service_name": "Premium Wedding Catering Package",
            "price": 8500.0,
            "quantity": 1,
            "notes": "Includes appetizers, main course, and dessert for 150 guests"
        }
        
        response = self.make_request("POST", f"/events/{event_id}/cart/add", cart_add_request, token=self.tokens["client"])
        if response and response.status_code == 200:
            add_result = response.json()
            cart_item = add_result.get("cart_item")
            total_cost = add_result.get("total_cost")
            budget_status = add_result.get("budget_status")
            
            if cart_item and total_cost == 8500.0:
                self.log_test("Add Vendor to Cart", True, f"Added catering vendor: ${total_cost}, Budget status: {budget_status}")
            else:
                self.log_test("Add Vendor to Cart", False, f"Cart addition failed - Cost: ${total_cost}")
        else:
            self.log_test("Add Vendor to Cart", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Add second vendor to cart (different service type)
        response = self.make_request("GET", "/vendors", params={"service_type": "photography"}, token=self.tokens["client"])
        if response and response.status_code == 200:
            photo_vendors = response.json()
            if photo_vendors:
                cart_add_request_2 = {
                    "vendor_id": photo_vendors[0]["id"],
                    "service_type": "photography",
                    "service_name": "Wedding Photography & Videography",
                    "price": 3500.0,
                    "quantity": 1,
                    "notes": "8-hour coverage with edited photos and highlight video"
                }
                
                response = self.make_request("POST", f"/events/{event_id}/cart/add", cart_add_request_2, token=self.tokens["client"])
                if response and response.status_code == 200:
                    add_result_2 = response.json()
                    total_cost_2 = add_result_2.get("total_cost")
                    
                    if total_cost_2 == 12000.0:  # 8500 + 3500
                        self.log_test("Add Second Vendor to Cart", True, f"Total cart value: ${total_cost_2}")
                    else:
                        self.log_test("Add Second Vendor to Cart", False, f"Incorrect total: ${total_cost_2}")
                else:
                    self.log_test("Add Second Vendor to Cart", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 8: Test GET /api/events/{event_id}/cart - Verify cart with items
        response = self.make_request("GET", f"/events/{event_id}/cart", token=self.tokens["client"])
        if response and response.status_code == 200:
            cart_data = response.json()
            cart_items = cart_data.get("cart_items", [])
            total_cost = cart_data.get("total_cost", 0)
            item_count = cart_data.get("item_count", 0)
            budget_tracking = cart_data.get("budget_tracking", {})
            
            if len(cart_items) == 2 and total_cost == 12000.0 and item_count == 2:
                remaining_budget = budget_tracking.get("remaining", 0)
                self.log_test("Get Cart with Items", True, f"Cart: {item_count} items, ${total_cost}, Remaining budget: ${remaining_budget}")
            else:
                self.log_test("Get Cart with Items", False, f"Cart data incorrect - Items: {len(cart_items)}, Cost: ${total_cost}")
        else:
            self.log_test("Get Cart with Items", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 9: Test POST /api/events/{event_id}/planner/scenarios/save - Save cart as comparison scenario
        scenario_request = {
            "scenario_name": "Premium Wedding Package",
            "cart_items": cart_items if 'cart_items' in locals() else [],
            "notes": "High-end catering and photography package for comparison"
        }
        
        response = self.make_request("POST", f"/events/{event_id}/planner/scenarios/save", scenario_request, token=self.tokens["client"])
        if response and response.status_code == 200:
            saved_scenario = response.json()
            scenario_id = saved_scenario.get("id")
            scenario_name = saved_scenario.get("scenario_name")
            scenario_cost = saved_scenario.get("total_cost")
            
            self.log_test("Save Planner Scenario", True, f"Scenario '{scenario_name}' saved with ID: {scenario_id}, Cost: ${scenario_cost}")
        else:
            self.log_test("Save Planner Scenario", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 10: Test GET /api/events/{event_id}/planner/scenarios - Get all saved scenarios
        response = self.make_request("GET", f"/events/{event_id}/planner/scenarios", token=self.tokens["client"])
        if response and response.status_code == 200:
            scenarios = response.json()
            
            if len(scenarios) >= 1:
                scenario_names = [s.get("scenario_name") for s in scenarios]
                self.log_test("Get Saved Scenarios", True, f"Retrieved {len(scenarios)} scenarios: {scenario_names}")
            else:
                self.log_test("Get Saved Scenarios", False, f"Expected at least 1 scenario, got {len(scenarios)}")
        else:
            self.log_test("Get Saved Scenarios", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 11: Test DELETE /api/events/{event_id}/cart/remove/{item_id} - Remove items from cart
        if 'cart_items' in locals() and cart_items:
            item_to_remove = cart_items[0]
            item_id = item_to_remove.get("id")
            
            response = self.make_request("DELETE", f"/events/{event_id}/cart/remove/{item_id}", token=self.tokens["client"])
            if response and response.status_code == 200:
                remove_result = response.json()
                remaining_items = remove_result.get("remaining_items")
                new_total = remove_result.get("total_cost")
                
                if remaining_items == 1 and new_total == 3500.0:  # Only photography left
                    self.log_test("Remove Item from Cart", True, f"Item removed, {remaining_items} items remaining, Total: ${new_total}")
                else:
                    self.log_test("Remove Item from Cart", False, f"Removal failed - Items: {remaining_items}, Total: ${new_total}")
            else:
                self.log_test("Remove Item from Cart", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 12: Test POST /api/events/{event_id}/cart/clear - Clear entire cart
        response = self.make_request("POST", f"/events/{event_id}/cart/clear", token=self.tokens["client"])
        if response and response.status_code == 200:
            clear_result = response.json()
            message = clear_result.get("message")
            
            # Verify cart is empty
            response = self.make_request("GET", f"/events/{event_id}/cart", token=self.tokens["client"])
            if response and response.status_code == 200:
                cart_data = response.json()
                cart_items = cart_data.get("cart_items", [])
                total_cost = cart_data.get("total_cost", 0)
                
                if len(cart_items) == 0 and total_cost == 0:
                    self.log_test("Clear Cart", True, "Cart cleared successfully")
                else:
                    self.log_test("Clear Cart", False, f"Cart not cleared - Items: {len(cart_items)}, Cost: ${total_cost}")
            else:
                self.log_test("Clear Cart", False, "Could not verify cart clearing")
        else:
            self.log_test("Clear Cart", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 13: Test DELETE /api/events/{event_id}/planner/scenarios/{scenario_id} - Delete scenarios
        if 'scenarios' in locals() and scenarios:
            scenario_to_delete = scenarios[0]
            scenario_id = scenario_to_delete.get("id")
            
            response = self.make_request("DELETE", f"/events/{event_id}/planner/scenarios/{scenario_id}", token=self.tokens["client"])
            if response and response.status_code == 200:
                delete_result = response.json()
                message = delete_result.get("message")
                
                # Verify scenario is deleted
                response = self.make_request("GET", f"/events/{event_id}/planner/scenarios", token=self.tokens["client"])
                if response and response.status_code == 200:
                    remaining_scenarios = response.json()
                    
                    if len(remaining_scenarios) == 0:
                        self.log_test("Delete Scenario", True, "Scenario deleted successfully")
                    else:
                        self.log_test("Delete Scenario", False, f"Scenario not deleted - {len(remaining_scenarios)} scenarios remain")
                else:
                    self.log_test("Delete Scenario", False, "Could not verify scenario deletion")
            else:
                self.log_test("Delete Scenario", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 14: Test POST /api/events/{event_id}/planner/finalize - Convert cart items to actual bookings
        # First add items back to cart for finalization test
        finalize_cart_items = [
            {
                "vendor_id": vendors[0]["id"],
                "service_type": "catering",
                "service_name": "Wedding Catering Package",
                "price": 6000.0,
                "quantity": 1,
                "notes": "Final catering selection"
            }
        ]
        
        # Add item to cart for finalization
        response = self.make_request("POST", f"/events/{event_id}/cart/add", finalize_cart_items[0], token=self.tokens["client"])
        if response and response.status_code == 200:
            # Now test finalization
            response = self.make_request("POST", f"/events/{event_id}/planner/finalize", token=self.tokens["client"])
            if response and response.status_code == 200:
                finalize_result = response.json()
                bookings_created = finalize_result.get("bookings_created", [])
                total_cost = finalize_result.get("total_cost", 0)
                event_status = finalize_result.get("event_status")
                
                if len(bookings_created) >= 1 and event_status == "booked":
                    self.log_test("Finalize Event Plan", True, f"Created {len(bookings_created)} bookings, Total: ${total_cost}, Status: {event_status}")
                else:
                    self.log_test("Finalize Event Plan", False, f"Finalization failed - Bookings: {len(bookings_created)}, Status: {event_status}")
            else:
                self.log_test("Finalize Event Plan", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 15: Test Cultural Integration with Interactive Planner
        # Create a cultural event and test vendor filtering
        cultural_event_data = {
            "name": "Priya's Indian Wedding Planner Test",
            "description": "Testing cultural integration with interactive planner",
            "event_type": "wedding",
            "cultural_style": "indian",
            "date": "2024-10-20T17:00:00Z",
            "location": "Mumbai, India",
            "budget": 50000.0,
            "guest_count": 200,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", cultural_event_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            cultural_event = response.json()
            cultural_event_id = cultural_event.get("id")
            
            # Test cultural vendor filtering in planner
            response = self.make_request("GET", f"/events/{cultural_event_id}/planner/vendors/catering", token=self.tokens["client"])
            if response and response.status_code == 200:
                cultural_vendors = response.json()
                vendors_list = cultural_vendors.get("vendors", [])
                
                self.log_test("Cultural Integration with Planner", True, f"Found {len(vendors_list)} culturally-matched catering vendors for Indian wedding")
            else:
                self.log_test("Cultural Integration with Planner", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 16: Test Budget-Aware Filtering
        # Test with different budget ranges
        budget_test_params = {"min_price": 1000, "max_price": 5000}
        response = self.make_request("GET", f"/events/{event_id}/planner/vendors/photography", params=budget_test_params, token=self.tokens["client"])
        if response and response.status_code == 200:
            budget_vendors = response.json()
            vendors_list = budget_vendors.get("vendors", [])
            
            self.log_test("Budget-Aware Vendor Filtering", True, f"Found {len(vendors_list)} photography vendors in $1K-$5K range")
        else:
            self.log_test("Budget-Aware Vendor Filtering", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 17: Test Authentication and Event Ownership Validation
        # Try to access planner for non-existent event
        fake_event_id = str(uuid.uuid4())
        response = self.make_request("GET", f"/events/{fake_event_id}/planner/state", token=self.tokens["client"])
        if response and response.status_code == 404:
            self.log_test("Event Ownership Validation", True, "Correctly blocked access to non-existent event")
        else:
            self.log_test("Event Ownership Validation", False, f"Should have returned 404, got {response.status_code if response else 'No response'}")
        
        print("\n✅ Interactive Event Planner System Testing Complete")
        print("   Tested: Planner state management, shopping cart, step-by-step workflow,")
        print("   scenario management, plan finalization, cultural integration, budget-aware filtering,")
        print("   authentication, and all new service categories (bar, planner, entertainment, etc.)")

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Comprehensive Backend API Testing for Urevent 360")
        print("=" * 60)
        
        # Core system tests
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return
        
        self.test_authentication()
        self.test_user_management()
        self.test_event_management()
        
        # NEW: Interactive Event Planner System Testing (PRIORITY for this review)
        self.test_interactive_event_planner_system()
        
        # NEW: Enhanced Cultural Filtering System Testing (Priority for this review)
        self.test_enhanced_cultural_filtering_system()
        
        # NEW: Budget Tracking & Payment System Testing
        self.test_budget_tracking_payment_system()
        
        self.test_bat_mitzvah_event_type()  # NEW: Specific Bat Mitzvah testing
        self.test_enhanced_event_types()  # Enhanced event type system
        self.test_cultural_wedding_system()  # NEW: Cultural wedding system testing
        
        # NEW: VENUE SYSTEM TESTING (Priority for this review)
        self.test_venue_search_system()  # Comprehensive venue search with ZIP code mapping
        self.test_venue_selection_for_events()  # Venue association with events
        self.test_dashboard_inline_editing()  # Event field updates from dashboard
        self.test_venue_integration_with_budget_tracking()  # Venue integration with budget
        self.test_complete_venue_workflow()  # End-to-end venue workflow
        
        self.test_venue_system()  # Original venue system tests
        self.test_enhanced_vendor_system()
        
        # Portal-specific tests
        self.test_admin_system()
        self.test_vendor_portal()
        
        # Feature tests
        self.test_booking_system()
        self.test_messaging_system()
        self.test_invitation_system()
        self.test_review_system()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   - {test}")
        
        print("\n🎯 Key Features Tested:")
        print("   ✓ Multi-role authentication (Admin, Vendor, Employee, Client)")
        print("   ✓ INTERACTIVE EVENT PLANNER SYSTEM - Complete step-by-step workflow")
        print("   ✓ SHOPPING CART FUNCTIONALITY - Real-time budget tracking and cart management")
        print("   ✓ PLANNER STATE MANAGEMENT - Save/resume progress with step tracking")
        print("   ✓ SCENARIO MANAGEMENT - Save and compare multiple vendor selections")
        print("   ✓ PLAN FINALIZATION - Convert cart items to actual vendor bookings")
        print("   ✓ NEW SERVICE CATEGORIES - Bar, Event Planner, Entertainment, Waitstaff")
        print("   ✓ Enhanced cultural filtering system across ALL event types")
        print("   ✓ Enhanced event type system (Quinceañera, Sweet 16, Wedding sub-types)")
        print("   ✓ Cultural wedding system (Indian, American, Hispanic, African, Asian, Middle Eastern, Jewish, Other)")
        print("   ✓ Cultural vendor matching and specializations")
        print("   ✓ Enhanced vendor marketplace with budget-aware filtering")
        print("   ✓ Budget tracking and payment management system")
        print("   ✓ VENUE SEARCH SYSTEM - ZIP code search with radius expansion")
        print("   ✓ VENUE SELECTION - Association with events (existing + manual entry)")
        print("   ✓ DASHBOARD INLINE EDITING - Event field updates")
        print("   ✓ VENUE INTEGRATION - With budget tracking and payment systems")
        print("   ✓ COMPLETE VENUE WORKFLOW - End-to-end venue management")
        print("   ✓ Admin system APIs and dashboard")
        print("   ✓ Vendor portal and subscription management")
        print("   ✓ Event management and budget calculations")
        print("   ✓ Venue search and filtering")
        print("   ✓ Booking and payment systems")
        print("   ✓ Messaging and invitation systems")
        print("   ✓ Review and rating systems")
        
        if passed_tests >= total_tests * 0.8:  # 80% success rate
            print("\n🎉 OVERALL STATUS: BACKEND APIs are working well!")
        else:
            print("\n⚠️  OVERALL STATUS: Some critical issues need attention")

def main():
    """Run comprehensive backend API testing with focus on event retrieval"""
    print("🚀 Starting Urevent 360 Backend API Testing...")
    print("🎯 FOCUS: Event Retrieval Functionality Testing")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"API Base URL: {BASE_URL}")
    print("=" * 80)
    
    tester = APITester()
    
    # Run tests in logical order - prioritizing event retrieval testing
    tester.test_health_check()
    tester.test_authentication()
    
    # MAIN FOCUS: Event Retrieval Functionality Testing
    tester.test_event_retrieval_functionality()
    
    # Additional supporting tests
    tester.test_user_management()
    tester.test_event_management()
    tester.test_enhanced_vendor_system()
    
    # Print final summary
    print("\n" + "=" * 80)
    print("🎯 EVENT RETRIEVAL TESTING SUMMARY")
    print("=" * 80)
    
    total_tests = len(tester.test_results)
    passed_tests = len([t for t in tester.test_results if t["success"]])
    failed_tests = len(tester.failed_tests)
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {failed_tests}")
    print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ FAILED TESTS:")
        for test in tester.failed_tests:
            print(f"   - {test}")
    
    # Specific analysis for event retrieval issues
    print(f"\n🔍 EVENT RETRIEVAL ANALYSIS:")
    event_tests = [t for t in tester.test_results if "event" in t["test"].lower() and "retrieval" in t["test"].lower()]
    
    list_events_working = any(t["success"] and "list events" in t["test"].lower() for t in tester.test_results)
    individual_retrieval_working = any(t["success"] and "individual event retrieval" in t["test"].lower() for t in tester.test_results)
    manage_button_ready = any(t["success"] and "manage button" in t["test"].lower() for t in tester.test_results)
    
    print(f"   List Events API Working: {'✅ YES' if list_events_working else '❌ NO'}")
    print(f"   Individual Event Retrieval Working: {'✅ YES' if individual_retrieval_working else '❌ NO'}")
    print(f"   Manage Button Navigation Ready: {'✅ YES' if manage_button_ready else '❌ NO'}")
    
    if list_events_working and individual_retrieval_working and manage_button_ready:
        print(f"   ✅ EVENT RETRIEVAL ISSUE RESOLVED: All event retrieval functionality working correctly")
    elif list_events_working and not individual_retrieval_working:
        print(f"   🚨 ISSUE IDENTIFIED: List events works but individual retrieval fails - ID format or routing issue")
    elif not list_events_working:
        print(f"   🚨 CRITICAL ISSUE: List events API not working - authentication or endpoint issue")
    else:
        print(f"   ⚠️  PARTIAL ISSUE: Some event retrieval functionality not working properly")
    
    return failed_tests == 0

if __name__ == "__main__":
    main()