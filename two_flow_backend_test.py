#!/usr/bin/env python3
"""
Two-Flow Architecture Backend Testing for Urevent 360 Platform
Focus: Testing the Two-Flow Architecture backend implementation

TESTING SCOPE (as per review request):
1. **Enhanced Event Creation API**: Test POST /api/events with new Two-Flow Architecture fields:
   - preferred_venue_types (array)
   - needed_core_services (array) 
   - needed_extras (array)
   - category_specific (object with culturalStyle and themeOrFormat arrays)

2. **Venue Matching API**: Test GET /api/match/venues with parameters:
   - type (event type)
   - city (location)
   - guestCount (number)
   - preferredTypes (comma-separated venue types)

3. **Vendor Matching API**: Test GET /api/match/vendors with parameters:
   - type (event type)
   - tags (comma-separated vendor tags)
   - core (comma-separated core services)
   - extras (comma-separated extra services) 
   - cultural (comma-separated cultural styles)
   - theme (comma-separated themes/formats)

Test with realistic data like:
- Event type: "wedding"
- City: "New York"  
- Guest count: 150
- Preferred venue types: "Hotel/Banquet Hall,Restaurant"
- Core services: "Catering,Photography,Decoration"
- Cultural styles: "American,Hispanic"
"""

import requests
import json
import sys
from datetime import datetime
import uuid
import time

# Configuration - Use environment variable for backend URL
import os
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://event-portal-6.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
TEST_CREDENTIALS = {
    "admin": {"email": "admin@urevent360.com", "password": "admin123"},
    "vendor": {"email": "vendor@example.com", "password": "vendor123"},
    "employee": {"email": "employee@example.com", "password": "employee123"},
    "client": {"email": "sarah.johnson@email.com", "password": "SecurePass123"}
}

class TwoFlowTester:
    def __init__(self):
        self.tokens = {}
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
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
        if not success:
            self.failed_tests.append(test_name)
    
    def make_request(self, method, endpoint, data=None, headers=None, params=None):
        """Make HTTP request with error handling"""
        try:
            url = f"{BASE_URL}{endpoint}"
            request_headers = HEADERS.copy()
            if headers:
                request_headers.update(headers)
            
            if method.upper() == "GET":
                response = requests.get(url, headers=request_headers, params=params, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, headers=request_headers, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=request_headers, json=data, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=request_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
    
    def authenticate_user(self, role="client"):
        """Authenticate user and get JWT token"""
        print(f"\n🔐 Authenticating {role} user...")
        
        if role not in TEST_CREDENTIALS:
            self.log_test(f"Authentication - {role}", False, f"No credentials for role: {role}")
            return False
        
        credentials = TEST_CREDENTIALS[role]
        response = self.make_request("POST", "/login", credentials)
        
        if response and response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                self.tokens[role] = token
                self.log_test(f"Authentication - {role}", True, f"Token length: {len(token)} chars")
                return True
        
        self.log_test(f"Authentication - {role}", False, f"Status: {response.status_code if response else 'No response'}")
        return False
    
    def get_auth_headers(self, role="client"):
        """Get authorization headers for requests"""
        if role in self.tokens:
            return {"Authorization": f"Bearer {self.tokens[role]}"}
        return {}
    
    def test_enhanced_event_creation(self):
        """Test enhanced event creation API with Two-Flow Architecture fields"""
        print(f"\n🎯 Testing Enhanced Event Creation API...")
        
        # Test data with Two-Flow Architecture fields
        test_events = [
            {
                "name": "Sarah's Dream Wedding",
                "event_type": "wedding",
                "date": "2025-08-15T18:00:00Z",
                "location": "New York, NY",
                "guest_count": 150,
                "status": "planning",
                "preferred_venue_types": ["Hotel/Banquet Hall", "Restaurant"],
                "needed_core_services": ["Catering", "Photography", "Decoration"],
                "needed_extras": ["DJ/Music", "Lighting"],
                "category_specific": {
                    "culturalStyle": ["American", "Hispanic"],
                    "themeOrFormat": ["Elegant", "Traditional"]
                }
            },
            {
                "name": "Corporate Annual Gala",
                "event_type": "corporate",
                "date": "2025-09-20T19:00:00Z",
                "location": "New York, NY",
                "guest_count": 200,
                "status": "planning",
                "preferred_venue_types": ["Hotel/Banquet Hall", "Community Center"],
                "needed_core_services": ["Catering", "Photography"],
                "needed_extras": ["Entertainment", "Security"],
                "category_specific": {
                    "culturalStyle": ["American"],
                    "themeOrFormat": ["Professional", "Formal"]
                }
            }
        ]
        
        for i, event_data in enumerate(test_events, 1):
            print(f"\n   Testing Event Creation #{i}: {event_data['name']}")
            
            response = self.make_request(
                "POST", 
                "/events", 
                event_data, 
                headers=self.get_auth_headers()
            )
            
            if response and response.status_code == 200:
                data = response.json()
                event_id = data.get("id")
                if event_id:
                    self.created_events.append(event_id)
                    self.log_test(
                        f"Enhanced Event Creation #{i}", 
                        True, 
                        f"Event ID: {event_id}, Type: {event_data['event_type']}"
                    )
                    
                    # Verify Two-Flow Architecture fields are stored
                    self.verify_event_fields(event_id, event_data)
                else:
                    self.log_test(f"Enhanced Event Creation #{i}", False, "No event ID returned")
            else:
                status = response.status_code if response else "No response"
                error = response.text if response else "Request failed"
                self.log_test(f"Enhanced Event Creation #{i}", False, f"Status: {status}, Error: {error}")
    
    def verify_event_fields(self, event_id, original_data):
        """Verify that Two-Flow Architecture fields are properly stored"""
        print(f"   Verifying Two-Flow Architecture fields for event {event_id}")
        
        response = self.make_request(
            "GET", 
            f"/events/{event_id}", 
            headers=self.get_auth_headers()
        )
        
        if response and response.status_code == 200:
            event_data = response.json()
            
            # Check Two-Flow Architecture fields
            fields_to_check = [
                "preferred_venue_types",
                "needed_core_services", 
                "needed_extras",
                "category_specific"
            ]
            
            all_fields_present = True
            missing_fields = []
            
            for field in fields_to_check:
                if field not in event_data:
                    all_fields_present = False
                    missing_fields.append(field)
                elif field == "category_specific":
                    # Check nested structure
                    category_data = event_data.get(field, {})
                    if "culturalStyle" not in category_data or "themeOrFormat" not in category_data:
                        all_fields_present = False
                        missing_fields.append(f"{field} nested structure")
            
            if all_fields_present:
                self.log_test(
                    f"Two-Flow Fields Verification - {event_id[:8]}", 
                    True, 
                    f"All fields present: {', '.join(fields_to_check)}"
                )
            else:
                self.log_test(
                    f"Two-Flow Fields Verification - {event_id[:8]}", 
                    False, 
                    f"Missing fields: {', '.join(missing_fields)}"
                )
        else:
            self.log_test(
                f"Two-Flow Fields Verification - {event_id[:8]}", 
                False, 
                f"Could not retrieve event: {response.status_code if response else 'No response'}"
            )
    
    def test_venue_matching_api(self):
        """Test venue matching API for Step-by-Step Mode"""
        print(f"\n🏛️ Testing Venue Matching API...")
        
        test_scenarios = [
            {
                "name": "Wedding Venue Search",
                "params": {
                    "type": "wedding",
                    "city": "New York",
                    "guestCount": 150,
                    "preferredTypes": "Hotel/Banquet Hall,Restaurant"
                }
            },
            {
                "name": "Corporate Event Venue Search",
                "params": {
                    "type": "corporate",
                    "city": "New York",
                    "guestCount": 200,
                    "preferredTypes": "Hotel/Banquet Hall,Community Center"
                }
            },
            {
                "name": "Small Birthday Party Venue Search",
                "params": {
                    "type": "birthday",
                    "city": "New York",
                    "guestCount": 50,
                    "preferredTypes": "Restaurant,Outdoor/Garden"
                }
            }
        ]
        
        for scenario in test_scenarios:
            print(f"\n   Testing: {scenario['name']}")
            
            response = self.make_request(
                "GET",
                "/match/venues",
                params=scenario["params"],
                headers=self.get_auth_headers()
            )
            
            if response and response.status_code == 200:
                data = response.json()
                venues = data.get("venues", [])
                total = data.get("total", 0)
                filters_applied = data.get("filters_applied", {})
                
                self.log_test(
                    f"Venue Matching - {scenario['name']}", 
                    True, 
                    f"Found {total} venues, Filters: {filters_applied}"
                )
                
                # Verify filtering logic
                self.verify_venue_filtering(scenario, venues, filters_applied)
                
            else:
                status = response.status_code if response else "No response"
                error = response.text if response else "Request failed"
                self.log_test(
                    f"Venue Matching - {scenario['name']}", 
                    False, 
                    f"Status: {status}, Error: {error}"
                )
    
    def verify_venue_filtering(self, scenario, venues, filters_applied):
        """Verify that venue filtering logic works correctly"""
        scenario_name = scenario["name"]
        params = scenario["params"]
        
        print(f"   Verifying filtering logic for {scenario_name}")
        
        # Check if venues match the event type
        event_type = params.get("type")
        guest_count = params.get("guestCount")
        preferred_types = params.get("preferredTypes", "").split(",")
        
        filtering_correct = True
        issues = []
        
        for venue in venues:
            # Check event type support
            if event_type and event_type not in venue.get("supportedTypes", []):
                filtering_correct = False
                issues.append(f"Venue {venue['name']} doesn't support {event_type}")
            
            # Check capacity
            if guest_count and venue.get("capacity", 0) < guest_count:
                filtering_correct = False
                issues.append(f"Venue {venue['name']} capacity too small")
            
            # Check preferred venue types
            if preferred_types and preferred_types != [""]:
                venue_types = venue.get("venueTypes", [])
                type_match = any(pref.strip() in venue_types for pref in preferred_types)
                if not type_match:
                    filtering_correct = False
                    issues.append(f"Venue {venue['name']} doesn't match preferred types")
        
        if filtering_correct:
            self.log_test(
                f"Venue Filtering Logic - {scenario_name}", 
                True, 
                f"All {len(venues)} venues match criteria"
            )
        else:
            self.log_test(
                f"Venue Filtering Logic - {scenario_name}", 
                False, 
                f"Issues: {'; '.join(issues[:3])}"  # Show first 3 issues
            )
    
    def test_vendor_matching_api(self):
        """Test vendor matching API for Step-by-Step Mode"""
        print(f"\n🤝 Testing Vendor Matching API...")
        
        test_scenarios = [
            {
                "name": "Wedding Vendor Search",
                "params": {
                    "type": "wedding",
                    "tags": "wedding,celebration",
                    "core": "Catering,Photography,Decoration",
                    "extras": "Music/DJ,Lighting",
                    "cultural": "American,Hispanic",
                    "theme": "Elegant,Traditional"
                }
            },
            {
                "name": "Corporate Event Vendor Search",
                "params": {
                    "type": "corporate",
                    "tags": "corporate,professional",
                    "core": "Catering,Photography",
                    "extras": "Entertainment",
                    "cultural": "American",
                    "theme": "Professional,Formal"
                }
            },
            {
                "name": "Birthday Party Vendor Search",
                "params": {
                    "type": "birthday",
                    "tags": "birthday,celebration",
                    "core": "Catering,Decoration",
                    "extras": "Entertainment",
                    "cultural": "American",
                    "theme": "Fun,Colorful"
                }
            }
        ]
        
        for scenario in test_scenarios:
            print(f"\n   Testing: {scenario['name']}")
            
            response = self.make_request(
                "GET",
                "/match/vendors",
                params=scenario["params"],
                headers=self.get_auth_headers()
            )
            
            if response and response.status_code == 200:
                data = response.json()
                vendors = data.get("vendors", [])
                total = data.get("total", 0)
                filters_applied = data.get("filters_applied", {})
                
                self.log_test(
                    f"Vendor Matching - {scenario['name']}", 
                    True, 
                    f"Found {total} vendors, Filters: {filters_applied}"
                )
                
                # Verify filtering logic
                self.verify_vendor_filtering(scenario, vendors, filters_applied)
                
            else:
                status = response.status_code if response else "No response"
                error = response.text if response else "Request failed"
                self.log_test(
                    f"Vendor Matching - {scenario['name']}", 
                    False, 
                    f"Status: {status}, Error: {error}"
                )
    
    def verify_vendor_filtering(self, scenario, vendors, filters_applied):
        """Verify that vendor filtering logic works correctly"""
        scenario_name = scenario["name"]
        params = scenario["params"]
        
        print(f"   Verifying filtering logic for {scenario_name}")
        
        # Parse filter parameters
        vendor_tags = params.get("tags", "").split(",") if params.get("tags") else []
        core_services = params.get("core", "").split(",") if params.get("core") else []
        cultural_styles = params.get("cultural", "").split(",") if params.get("cultural") else []
        
        filtering_correct = True
        issues = []
        
        for vendor in vendors:
            # Check vendor tags/categories
            if vendor_tags and vendor_tags != [""]:
                vendor_categories = vendor.get("categories", [])
                tag_match = any(tag.strip() in vendor_categories for tag in vendor_tags)
                if not tag_match:
                    filtering_correct = False
                    issues.append(f"Vendor {vendor['name']} doesn't match tags")
            
            # Check core services
            if core_services and core_services != [""]:
                vendor_services = vendor.get("services", [])
                service_match = any(service.strip() in vendor_services for service in core_services)
                if not service_match:
                    filtering_correct = False
                    issues.append(f"Vendor {vendor['name']} doesn't provide core services")
            
            # Check cultural styles
            if cultural_styles and cultural_styles != [""]:
                vendor_cultural = vendor.get("culturalStyles", [])
                cultural_match = any(style.strip() in vendor_cultural for style in cultural_styles)
                if not cultural_match:
                    filtering_correct = False
                    issues.append(f"Vendor {vendor['name']} doesn't support cultural styles")
        
        if filtering_correct:
            self.log_test(
                f"Vendor Filtering Logic - {scenario_name}", 
                True, 
                f"All {len(vendors)} vendors match criteria"
            )
        else:
            self.log_test(
                f"Vendor Filtering Logic - {scenario_name}", 
                False, 
                f"Issues: {'; '.join(issues[:3])}"  # Show first 3 issues
            )
    
    def test_integration_workflow(self):
        """Test complete Two-Flow Architecture workflow"""
        print(f"\n🔄 Testing Complete Two-Flow Architecture Workflow...")
        
        # Step 1: Create event with Two-Flow Architecture preferences
        event_data = {
            "name": "Integration Test Wedding",
            "event_type": "wedding",
            "date": "2025-10-15T17:00:00Z",
            "location": "New York, NY",
            "guest_count": 150,
            "status": "planning",
            "preferred_venue_types": ["Hotel/Banquet Hall", "Restaurant"],
            "needed_core_services": ["Catering", "Photography", "Decoration"],
            "needed_extras": ["Music/DJ"],
            "category_specific": {
                "culturalStyle": ["American", "Hispanic"],
                "themeOrFormat": ["Elegant"]
            }
        }
        
        print("   Step 1: Creating event with Two-Flow preferences...")
        response = self.make_request(
            "POST", 
            "/events", 
            event_data, 
            headers=self.get_auth_headers()
        )
        
        if not (response and response.status_code == 200):
            self.log_test("Integration Workflow", False, "Failed to create event")
            return
        
        event_id = response.json().get("id")
        self.created_events.append(event_id)
        
        # Step 2: Use event preferences to find matching venues
        print("   Step 2: Finding matching venues based on event preferences...")
        venue_response = self.make_request(
            "GET",
            "/match/venues",
            params={
                "type": event_data["event_type"],
                "city": "New York",
                "guestCount": event_data["guest_count"],
                "preferredTypes": ",".join(event_data["preferred_venue_types"])
            },
            headers=self.get_auth_headers()
        )
        
        if not (venue_response and venue_response.status_code == 200):
            self.log_test("Integration Workflow", False, "Failed to find matching venues")
            return
        
        venues = venue_response.json().get("venues", [])
        
        # Step 3: Use event preferences to find matching vendors
        print("   Step 3: Finding matching vendors based on event preferences...")
        vendor_response = self.make_request(
            "GET",
            "/match/vendors",
            params={
                "type": event_data["event_type"],
                "tags": "wedding,celebration",
                "core": ",".join(event_data["needed_core_services"]),
                "extras": ",".join(event_data["needed_extras"]),
                "cultural": ",".join(event_data["category_specific"]["culturalStyle"])
            },
            headers=self.get_auth_headers()
        )
        
        if not (vendor_response and vendor_response.status_code == 200):
            self.log_test("Integration Workflow", False, "Failed to find matching vendors")
            return
        
        vendors = vendor_response.json().get("vendors", [])
        
        # Verify integration success
        if len(venues) > 0 and len(vendors) > 0:
            self.log_test(
                "Integration Workflow", 
                True, 
                f"Complete workflow: Event created, {len(venues)} venues found, {len(vendors)} vendors found"
            )
        else:
            self.log_test(
                "Integration Workflow", 
                False, 
                f"Incomplete results: {len(venues)} venues, {len(vendors)} vendors"
            )
    
    def cleanup_test_data(self):
        """Clean up created test events"""
        print(f"\n🧹 Cleaning up test data...")
        
        for event_id in self.created_events:
            response = self.make_request(
                "DELETE",
                f"/events/{event_id}",
                headers=self.get_auth_headers()
            )
            
            if response and response.status_code == 200:
                print(f"   Deleted event: {event_id}")
            else:
                print(f"   Failed to delete event: {event_id}")
    
    def print_summary(self):
        """Print test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\n" + "="*80)
        print(f"🎯 TWO-FLOW ARCHITECTURE BACKEND TESTING COMPLETED")
        print(f"="*80)
        print(f"📊 SUMMARY:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {passed_tests}")
        print(f"   Failed: {failed_tests}")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"   - {test}")
        
        print(f"\n✅ KEY FINDINGS:")
        print(f"   - Enhanced Event Creation API: {'✅ Working' if any('Enhanced Event Creation' in r['test'] and r['success'] for r in self.test_results) else '❌ Issues'}")
        print(f"   - Venue Matching API: {'✅ Working' if any('Venue Matching' in r['test'] and r['success'] for r in self.test_results) else '❌ Issues'}")
        print(f"   - Vendor Matching API: {'✅ Working' if any('Vendor Matching' in r['test'] and r['success'] for r in self.test_results) else '❌ Issues'}")
        print(f"   - Two-Flow Architecture Fields: {'✅ Working' if any('Two-Flow Fields' in r['test'] and r['success'] for r in self.test_results) else '❌ Issues'}")
        print(f"   - Integration Workflow: {'✅ Working' if any('Integration Workflow' in r['test'] and r['success'] for r in self.test_results) else '❌ Issues'}")
        
        print(f"\n🎉 Two-Flow Architecture backend implementation is {'READY FOR FRONTEND INTEGRATION' if success_rate >= 80 else 'NEEDS FIXES BEFORE FRONTEND INTEGRATION'}")
        print(f"="*80)

def main():
    """Main testing function"""
    print("🚀 Starting Two-Flow Architecture Backend Testing...")
    print(f"Backend URL: {BACKEND_URL}")
    
    tester = TwoFlowTester()
    
    try:
        # Step 1: Authenticate
        if not tester.authenticate_user("client"):
            print("❌ Authentication failed. Cannot proceed with testing.")
            return
        
        # Step 2: Test Enhanced Event Creation API
        tester.test_enhanced_event_creation()
        
        # Step 3: Test Venue Matching API
        tester.test_venue_matching_api()
        
        # Step 4: Test Vendor Matching API
        tester.test_vendor_matching_api()
        
        # Step 5: Test Integration Workflow
        tester.test_integration_workflow()
        
        # Step 6: Print Summary
        tester.print_summary()
        
    except KeyboardInterrupt:
        print("\n⚠️ Testing interrupted by user")
    except Exception as e:
        print(f"\n❌ Testing failed with error: {e}")
    finally:
        # Cleanup
        tester.cleanup_test_data()

if __name__ == "__main__":
    main()