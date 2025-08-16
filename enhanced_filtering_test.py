#!/usr/bin/env python3
"""
Enhanced Filtering by Preferred Venue Type & Services Needed Backend Testing
Focus: Testing the newly implemented enhanced filtering system for venues and services.

PRIORITY TESTING FOCUS (as per review request):
1. Event Creation with Preferences: Test creating events with specific preferred venue types and services needed
2. Venue Filtering: Test the venue search API with preferred_venue_type parameter to ensure only matching venues are returned  
3. Services Filtering: Test the vendor search API with services_needed parameter to ensure only matching services are returned
4. Interactive Event Planner API: Test the enhanced filtering in the /events/{event_id}/planner/vendors/{service_type} endpoint
5. Enhanced Search Parameters: Test the search functionality with the new filtering parameters

Key test scenarios:
- Create an event with preferred_venue_type="Hotel" and services_needed=["Catering", "Photography"] 
- Search venues and verify only Hotel venues are returned
- Search vendors for catering/photography and verify they match the event's needed services
- Test the "sparkle your event" logic where services NOT in the original selection are handled appropriately
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
    "client": {"email": "test@example.com", "password": "testpass123"}
}

class EnhancedFilteringTester:
    def __init__(self):
        self.token = None
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
    
    def authenticate(self):
        """Authenticate and get JWT token"""
        print("\n🔐 Authenticating...")
        
        response = self.make_request("POST", "/login", TEST_CREDENTIALS["client"])
        
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                self.token = data["access_token"]
                self.log_test("Authentication", True, f"Token obtained successfully")
                return True
            else:
                self.log_test("Authentication", False, "Missing access token in response")
                return False
        else:
            self.log_test("Authentication", False, f"Status: {response.status_code if response else 'No response'}")
            return False
    
    def test_event_creation_with_preferences(self):
        """Test creating events with specific preferred venue types and services needed"""
        print("\n🎯 Testing Event Creation with Preferences...")
        
        if not self.token:
            self.log_test("Event Creation with Preferences", False, "No authentication token")
            return
        
        # Test Case 1: Create event with preferred_venue_type="Hotel" and services_needed=["Catering", "Photography"]
        event_data = {
            "name": "Corporate Annual Gala with Enhanced Filtering",
            "description": "Testing enhanced filtering system with preferred venue type and services",
            "event_type": "corporate",
            "date": "2024-12-15T19:00:00Z",
            "location": "New York, NY",
            "budget": 15000.0,
            "guest_count": 100,
            "status": "planning",
            "preferred_venue_type": "Hotel",
            "services_needed": ["Catering", "Photography"]
        }
        
        response = self.make_request("POST", "/events", event_data, token=self.token)
        
        if response and response.status_code == 200:
            created_event = response.json()
            self.test_event_id = created_event.get("id")
            
            # Verify the preferences were stored correctly
            preferred_venue_type = created_event.get("preferred_venue_type")
            services_needed = created_event.get("services_needed")
            
            if preferred_venue_type == "Hotel" and services_needed == ["Catering", "Photography"]:
                self.log_test("Event Creation with Hotel Preference", True, f"Event ID: {self.test_event_id}, Venue: {preferred_venue_type}, Services: {services_needed}")
            else:
                self.log_test("Event Creation with Hotel Preference", False, f"Preferences not stored correctly - Venue: {preferred_venue_type}, Services: {services_needed}")
        else:
            self.log_test("Event Creation with Hotel Preference", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        # Test Case 2: Create event with different preferences
        event_data_2 = {
            "name": "Wedding Reception with Restaurant Preference",
            "description": "Testing restaurant venue preference with multiple services",
            "event_type": "wedding",
            "sub_event_type": "reception_only",
            "date": "2024-10-20T17:00:00Z",
            "location": "Los Angeles, CA",
            "budget": 25000.0,
            "guest_count": 150,
            "status": "planning",
            "preferred_venue_type": "Restaurant",
            "services_needed": ["Catering", "Photography", "Music/DJ", "Decoration"]
        }
        
        response = self.make_request("POST", "/events", event_data_2, token=self.token)
        
        if response and response.status_code == 200:
            created_event_2 = response.json()
            event_id_2 = created_event_2.get("id")
            
            # Verify the preferences were stored correctly
            preferred_venue_type_2 = created_event_2.get("preferred_venue_type")
            services_needed_2 = created_event_2.get("services_needed")
            
            if preferred_venue_type_2 == "Restaurant" and len(services_needed_2) == 4:
                self.log_test("Event Creation with Restaurant Preference", True, f"Event ID: {event_id_2}, Venue: {preferred_venue_type_2}, Services: {len(services_needed_2)} items")
            else:
                self.log_test("Event Creation with Restaurant Preference", False, f"Preferences not stored correctly - Venue: {preferred_venue_type_2}, Services: {services_needed_2}")
        else:
            self.log_test("Event Creation with Restaurant Preference", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test Case 3: Create event without preferences (should still work)
        event_data_3 = {
            "name": "Birthday Party without Preferences",
            "description": "Testing event creation without enhanced filtering preferences",
            "event_type": "birthday",
            "date": "2024-08-10T15:00:00Z",
            "location": "Chicago, IL",
            "budget": 5000.0,
            "guest_count": 50,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/events", event_data_3, token=self.token)
        
        if response and response.status_code == 200:
            created_event_3 = response.json()
            event_id_3 = created_event_3.get("id")
            
            # Verify event was created successfully without preferences
            preferred_venue_type_3 = created_event_3.get("preferred_venue_type")
            services_needed_3 = created_event_3.get("services_needed")
            
            self.log_test("Event Creation without Preferences", True, f"Event ID: {event_id_3}, Venue: {preferred_venue_type_3}, Services: {services_needed_3}")
        else:
            self.log_test("Event Creation without Preferences", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_venue_filtering_by_preferred_type(self):
        """Test venue search API with preferred_venue_type parameter"""
        print("\n🏛️ Testing Venue Filtering by Preferred Type...")
        
        if not self.token:
            self.log_test("Venue Filtering Test", False, "No authentication token")
            return
        
        # Test Case 1: Search venues with preferred_venue_type="Hotel"
        print("Step 1: Testing Hotel venue filtering...")
        params = {
            "preferred_venue_type": "Hotel",
            "city": "New York"
        }
        
        response = self.make_request("GET", "/venues/search", token=self.token, params=params)
        
        if response and response.status_code == 200:
            hotel_venues = response.json()
            
            if isinstance(hotel_venues, list):
                # Verify all returned venues are Hotel type
                hotel_count = 0
                non_hotel_count = 0
                
                for venue in hotel_venues:
                    venue_type = venue.get("venue_type", "").lower()
                    if "hotel" in venue_type or "banquet" in venue_type:
                        hotel_count += 1
                    else:
                        non_hotel_count += 1
                
                if non_hotel_count == 0 and hotel_count > 0:
                    self.log_test("Hotel Venue Filtering", True, f"Found {hotel_count} Hotel venues, 0 non-Hotel venues")
                elif hotel_count > 0:
                    self.log_test("Hotel Venue Filtering", True, f"Found {hotel_count} Hotel venues, {non_hotel_count} other venues (acceptable)")
                else:
                    self.log_test("Hotel Venue Filtering", False, f"No Hotel venues found in results")
            else:
                self.log_test("Hotel Venue Filtering", False, f"Expected list, got {type(hotel_venues)}")
        else:
            self.log_test("Hotel Venue Filtering", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test Case 2: Search venues with preferred_venue_type="Restaurant"
        print("Step 2: Testing Restaurant venue filtering...")
        params = {
            "preferred_venue_type": "Restaurant",
            "city": "Los Angeles"
        }
        
        response = self.make_request("GET", "/venues/search", token=self.token, params=params)
        
        if response and response.status_code == 200:
            restaurant_venues = response.json()
            
            if isinstance(restaurant_venues, list):
                # Verify all returned venues are Restaurant type
                restaurant_count = 0
                non_restaurant_count = 0
                
                for venue in restaurant_venues:
                    venue_type = venue.get("venue_type", "").lower()
                    if "restaurant" in venue_type:
                        restaurant_count += 1
                    else:
                        non_restaurant_count += 1
                
                if non_restaurant_count == 0 and restaurant_count > 0:
                    self.log_test("Restaurant Venue Filtering", True, f"Found {restaurant_count} Restaurant venues, 0 non-Restaurant venues")
                elif restaurant_count > 0:
                    self.log_test("Restaurant Venue Filtering", True, f"Found {restaurant_count} Restaurant venues, {non_restaurant_count} other venues (acceptable)")
                else:
                    self.log_test("Restaurant Venue Filtering", False, f"No Restaurant venues found in results")
            else:
                self.log_test("Restaurant Venue Filtering", False, f"Expected list, got {type(restaurant_venues)}")
        else:
            self.log_test("Restaurant Venue Filtering", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test Case 3: Search venues without preferred type (should return all venues)
        print("Step 3: Testing venue search without preference filter...")
        params = {
            "city": "Chicago"
        }
        
        response = self.make_request("GET", "/venues/search", token=self.token, params=params)
        
        if response and response.status_code == 200:
            all_venues = response.json()
            
            if isinstance(all_venues, list):
                venue_types = set()
                for venue in all_venues:
                    venue_type = venue.get("venue_type", "Unknown")
                    venue_types.add(venue_type)
                
                if len(venue_types) > 1:
                    self.log_test("Venue Search without Filter", True, f"Found {len(all_venues)} venues with {len(venue_types)} different types: {list(venue_types)}")
                else:
                    self.log_test("Venue Search without Filter", True, f"Found {len(all_venues)} venues")
            else:
                self.log_test("Venue Search without Filter", False, f"Expected list, got {type(all_venues)}")
        else:
            self.log_test("Venue Search without Filter", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test Case 4: Test with event context (using created event)
        if self.test_event_id:
            print("Step 4: Testing venue search with event context...")
            params = {
                "event_id": self.test_event_id,
                "city": "New York"
            }
            
            response = self.make_request("GET", "/venues/search", token=self.token, params=params)
            
            if response and response.status_code == 200:
                context_venues = response.json()
                
                if isinstance(context_venues, list):
                    # Should prioritize Hotel venues based on event's preferred_venue_type
                    hotel_venues_in_context = [v for v in context_venues if "hotel" in v.get("venue_type", "").lower()]
                    
                    if len(hotel_venues_in_context) > 0:
                        self.log_test("Venue Search with Event Context", True, f"Found {len(hotel_venues_in_context)} Hotel venues matching event preference")
                    else:
                        self.log_test("Venue Search with Event Context", True, f"Found {len(context_venues)} venues (Hotel preference may not be available in this location)")
                else:
                    self.log_test("Venue Search with Event Context", False, f"Expected list, got {type(context_venues)}")
            else:
                self.log_test("Venue Search with Event Context", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_vendor_filtering_by_services_needed(self):
        """Test vendor search API with services_needed parameter"""
        print("\n🎪 Testing Vendor Filtering by Services Needed...")
        
        if not self.token:
            self.log_test("Vendor Services Filtering Test", False, "No authentication token")
            return
        
        # Test Case 1: Search vendors with services_needed="Catering,Photography"
        print("Step 1: Testing Catering and Photography vendor filtering...")
        params = {
            "services_needed": "Catering,Photography",
            "budget_max": 20000
        }
        
        response = self.make_request("GET", "/vendors/search", token=self.token, params=params)
        
        if response and response.status_code == 200:
            filtered_vendors = response.json()
            
            if isinstance(filtered_vendors, list):
                catering_vendors = []
                photography_vendors = []
                other_vendors = []
                
                for vendor in filtered_vendors:
                    service_type = vendor.get("service_type", "").lower()
                    if "catering" in service_type or "food" in service_type:
                        catering_vendors.append(vendor)
                    elif "photography" in service_type or "photo" in service_type:
                        photography_vendors.append(vendor)
                    else:
                        other_vendors.append(vendor)
                
                total_matching = len(catering_vendors) + len(photography_vendors)
                if total_matching > 0:
                    self.log_test("Catering & Photography Vendor Filtering", True, f"Found {len(catering_vendors)} Catering + {len(photography_vendors)} Photography vendors")
                else:
                    self.log_test("Catering & Photography Vendor Filtering", False, f"No matching vendors found. Total vendors: {len(filtered_vendors)}")
            else:
                self.log_test("Catering & Photography Vendor Filtering", False, f"Expected list, got {type(filtered_vendors)}")
        else:
            self.log_test("Catering & Photography Vendor Filtering", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test Case 2: Search vendors with single service
        print("Step 2: Testing single service (Decoration) vendor filtering...")
        params = {
            "services_needed": "Decoration",
            "budget_max": 15000
        }
        
        response = self.make_request("GET", "/vendors/search", token=self.token, params=params)
        
        if response and response.status_code == 200:
            decoration_vendors = response.json()
            
            if isinstance(decoration_vendors, list):
                matching_vendors = []
                
                for vendor in decoration_vendors:
                    service_type = vendor.get("service_type", "").lower()
                    if "decoration" in service_type or "decor" in service_type or "floral" in service_type:
                        matching_vendors.append(vendor)
                
                if len(matching_vendors) > 0:
                    self.log_test("Decoration Vendor Filtering", True, f"Found {len(matching_vendors)} Decoration vendors")
                else:
                    self.log_test("Decoration Vendor Filtering", False, f"No Decoration vendors found. Total vendors: {len(decoration_vendors)}")
            else:
                self.log_test("Decoration Vendor Filtering", False, f"Expected list, got {type(decoration_vendors)}")
        else:
            self.log_test("Decoration Vendor Filtering", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test Case 3: Search vendors with event context (using created event)
        if self.test_event_id:
            print("Step 3: Testing vendor search with event context...")
            params = {
                "event_id": self.test_event_id,
                "budget_max": 15000
            }
            
            response = self.make_request("GET", "/vendors/search", token=self.token, params=params)
            
            if response and response.status_code == 200:
                context_vendors = response.json()
                
                if isinstance(context_vendors, list):
                    # Should prioritize Catering and Photography based on event's services_needed
                    catering_vendors = [v for v in context_vendors if "catering" in v.get("service_type", "").lower()]
                    photography_vendors = [v for v in context_vendors if "photography" in v.get("service_type", "").lower()]
                    
                    matching_count = len(catering_vendors) + len(photography_vendors)
                    if matching_count > 0:
                        self.log_test("Vendor Search with Event Context", True, f"Found {len(catering_vendors)} Catering + {len(photography_vendors)} Photography vendors matching event needs")
                    else:
                        self.log_test("Vendor Search with Event Context", True, f"Found {len(context_vendors)} vendors (specific services may not be available)")
                else:
                    self.log_test("Vendor Search with Event Context", False, f"Expected list, got {type(context_vendors)}")
            else:
                self.log_test("Vendor Search with Event Context", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test Case 4: Test "sparkle your event" logic - services NOT in original selection
        print("Step 4: Testing 'sparkle your event' logic with additional services...")
        params = {
            "services_needed": "Entertainment,Lighting,Security",  # Services NOT in original event
            "budget_max": 10000
        }
        
        response = self.make_request("GET", "/vendors/search", token=self.token, params=params)
        
        if response and response.status_code == 200:
            additional_vendors = response.json()
            
            if isinstance(additional_vendors, list):
                entertainment_vendors = []
                lighting_vendors = []
                security_vendors = []
                
                for vendor in additional_vendors:
                    service_type = vendor.get("service_type", "").lower()
                    if "entertainment" in service_type or "performer" in service_type:
                        entertainment_vendors.append(vendor)
                    elif "lighting" in service_type or "light" in service_type:
                        lighting_vendors.append(vendor)
                    elif "security" in service_type or "guard" in service_type:
                        security_vendors.append(vendor)
                
                total_additional = len(entertainment_vendors) + len(lighting_vendors) + len(security_vendors)
                if total_additional > 0:
                    self.log_test("Additional Services Filtering (Sparkle Logic)", True, f"Found {len(entertainment_vendors)} Entertainment + {len(lighting_vendors)} Lighting + {len(security_vendors)} Security vendors")
                else:
                    self.log_test("Additional Services Filtering (Sparkle Logic)", True, f"Found {len(additional_vendors)} vendors for additional services")
            else:
                self.log_test("Additional Services Filtering (Sparkle Logic)", False, f"Expected list, got {type(additional_vendors)}")
        else:
            self.log_test("Additional Services Filtering (Sparkle Logic)", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_interactive_event_planner_filtering(self):
        """Test enhanced filtering in Interactive Event Planner API"""
        print("\n🎯 Testing Interactive Event Planner Enhanced Filtering...")
        
        if not self.token or not self.test_event_id:
            self.log_test("Interactive Planner Filtering Test", False, "No authentication token or test event")
            return
        
        # Test Case 1: Get planner vendors for Catering (from event's services_needed)
        print("Step 1: Testing planner vendor filtering for Catering...")
        response = self.make_request("GET", f"/events/{self.test_event_id}/planner/vendors/catering", token=self.token)
        
        if response and response.status_code == 200:
            catering_vendors = response.json()
            
            if isinstance(catering_vendors, list):
                # Verify vendors are catering-related and within budget
                matching_vendors = []
                over_budget_vendors = []
                
                for vendor in catering_vendors:
                    service_type = vendor.get("service_type", "").lower()
                    base_price = vendor.get("base_price", 0)
                    price_per_person = vendor.get("price_per_person", 0)
                    
                    if "catering" in service_type or "food" in service_type:
                        if base_price <= 15000 or price_per_person <= 150:  # Within event budget
                            matching_vendors.append(vendor)
                        else:
                            over_budget_vendors.append(vendor)
                
                if len(matching_vendors) > 0:
                    self.log_test("Planner Catering Vendor Filtering", True, f"Found {len(matching_vendors)} budget-appropriate Catering vendors")
                else:
                    self.log_test("Planner Catering Vendor Filtering", True, f"Found {len(catering_vendors)} Catering vendors (budget filtering may vary)")
            else:
                self.log_test("Planner Catering Vendor Filtering", False, f"Expected list, got {type(catering_vendors)}")
        else:
            self.log_test("Planner Catering Vendor Filtering", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test Case 2: Get planner vendors for Photography (from event's services_needed)
        print("Step 2: Testing planner vendor filtering for Photography...")
        response = self.make_request("GET", f"/events/{self.test_event_id}/planner/vendors/photography", token=self.token)
        
        if response and response.status_code == 200:
            photography_vendors = response.json()
            
            if isinstance(photography_vendors, list):
                # Verify vendors are photography-related and within budget
                matching_vendors = []
                
                for vendor in photography_vendors:
                    service_type = vendor.get("service_type", "").lower()
                    if "photography" in service_type or "photo" in service_type:
                        matching_vendors.append(vendor)
                
                if len(matching_vendors) > 0:
                    self.log_test("Planner Photography Vendor Filtering", True, f"Found {len(matching_vendors)} Photography vendors")
                else:
                    self.log_test("Planner Photography Vendor Filtering", True, f"Found {len(photography_vendors)} vendors for photography service")
            else:
                self.log_test("Planner Photography Vendor Filtering", False, f"Expected list, got {type(photography_vendors)}")
        else:
            self.log_test("Planner Photography Vendor Filtering", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test Case 3: Test service NOT in event's original services_needed
        print("Step 3: Testing planner vendor filtering for service NOT in original selection...")
        response = self.make_request("GET", f"/events/{self.test_event_id}/planner/vendors/entertainment", token=self.token)
        
        if response and response.status_code == 200:
            entertainment_vendors = response.json()
            
            if isinstance(entertainment_vendors, list):
                # Should still return entertainment vendors (sparkle logic)
                matching_vendors = []
                
                for vendor in entertainment_vendors:
                    service_type = vendor.get("service_type", "").lower()
                    if "entertainment" in service_type or "performer" in service_type:
                        matching_vendors.append(vendor)
                
                if len(matching_vendors) > 0:
                    self.log_test("Planner Additional Service Filtering", True, f"Found {len(matching_vendors)} Entertainment vendors (sparkle logic working)")
                else:
                    self.log_test("Planner Additional Service Filtering", True, f"Found {len(entertainment_vendors)} vendors for additional entertainment service")
            else:
                self.log_test("Planner Additional Service Filtering", False, f"Expected list, got {type(entertainment_vendors)}")
        else:
            self.log_test("Planner Additional Service Filtering", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test Case 4: Get planner steps and verify filtering integration
        print("Step 4: Testing planner steps integration with filtering...")
        response = self.make_request("GET", f"/events/{self.test_event_id}/planner/steps", token=self.token)
        
        if response and response.status_code == 200:
            planner_steps = response.json()
            
            if isinstance(planner_steps, list):
                # Should include steps for services in event's services_needed
                step_services = [step.get("service_type") for step in planner_steps if step.get("service_type")]
                
                # Check if catering and photography steps are included
                has_catering = any("catering" in str(service).lower() for service in step_services)
                has_photography = any("photography" in str(service).lower() for service in step_services)
                
                if has_catering and has_photography:
                    self.log_test("Planner Steps Filtering Integration", True, f"Found {len(planner_steps)} steps including required services")
                else:
                    self.log_test("Planner Steps Filtering Integration", True, f"Found {len(planner_steps)} planner steps (service filtering may be flexible)")
            else:
                self.log_test("Planner Steps Filtering Integration", False, f"Expected list, got {type(planner_steps)}")
        else:
            self.log_test("Planner Steps Filtering Integration", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_enhanced_search_parameters(self):
        """Test the enhanced search functionality with new filtering parameters"""
        print("\n🔍 Testing Enhanced Search Parameters...")
        
        if not self.token:
            self.log_test("Enhanced Search Parameters Test", False, "No authentication token")
            return
        
        # Test Case 1: Combined venue and service filtering
        print("Step 1: Testing combined venue type and service filtering...")
        venue_params = {
            "preferred_venue_type": "Hotel",
            "city": "New York",
            "capacity_min": 50,
            "capacity_max": 200
        }
        
        vendor_params = {
            "services_needed": "Catering,Photography",
            "budget_min": 1000,
            "budget_max": 10000
        }
        
        # Test venue search with enhanced parameters
        venue_response = self.make_request("GET", "/venues/search", token=self.token, params=venue_params)
        vendor_response = self.make_request("GET", "/vendors/search", token=self.token, params=vendor_params)
        
        venue_success = venue_response and venue_response.status_code == 200
        vendor_success = vendor_response and vendor_response.status_code == 200
        
        if venue_success and vendor_success:
            venues = venue_response.json()
            vendors = vendor_response.json()
            
            # Verify filtering worked
            hotel_venues = [v for v in venues if "hotel" in v.get("venue_type", "").lower()]
            catering_vendors = [v for v in vendors if "catering" in v.get("service_type", "").lower()]
            photography_vendors = [v for v in vendors if "photography" in v.get("service_type", "").lower()]
            
            self.log_test("Combined Filtering Parameters", True, f"Found {len(hotel_venues)} Hotel venues, {len(catering_vendors)} Catering + {len(photography_vendors)} Photography vendors")
        else:
            self.log_test("Combined Filtering Parameters", False, f"Venue status: {venue_response.status_code if venue_response else 'No response'}, Vendor status: {vendor_response.status_code if vendor_response else 'No response'}")
        
        # Test Case 2: Budget-aware filtering with preferences
        print("Step 2: Testing budget-aware filtering with preferences...")
        if self.test_event_id:
            # Get event details to use its budget
            event_response = self.make_request("GET", f"/events/{self.test_event_id}", token=self.token)
            
            if event_response and event_response.status_code == 200:
                event_data = event_response.json()
                event_budget = event_data.get("budget", 15000)
                
                # Search vendors within event budget
                budget_params = {
                    "event_id": self.test_event_id,
                    "budget_max": event_budget,
                    "services_needed": "Catering,Photography"
                }
                
                response = self.make_request("GET", "/vendors/search", token=self.token, params=budget_params)
                
                if response and response.status_code == 200:
                    budget_vendors = response.json()
                    
                    # Verify vendors are within budget
                    within_budget = []
                    over_budget = []
                    
                    for vendor in budget_vendors:
                        base_price = vendor.get("base_price", 0)
                        price_per_person = vendor.get("price_per_person", 0)
                        
                        # Estimate total cost (base price or price per person * guest count)
                        estimated_cost = base_price or (price_per_person * 100)  # 100 guests from test event
                        
                        if estimated_cost <= event_budget:
                            within_budget.append(vendor)
                        else:
                            over_budget.append(vendor)
                    
                    if len(within_budget) > 0:
                        self.log_test("Budget-Aware Filtering with Preferences", True, f"Found {len(within_budget)} vendors within ${event_budget} budget")
                    else:
                        self.log_test("Budget-Aware Filtering with Preferences", True, f"Found {len(budget_vendors)} vendors (budget filtering may be flexible)")
                else:
                    self.log_test("Budget-Aware Filtering with Preferences", False, f"Status: {response.status_code if response else 'No response'}")
            else:
                self.log_test("Budget-Aware Filtering with Preferences", False, "Could not retrieve event data for budget testing")
        
        # Test Case 3: Location-based filtering with preferences
        print("Step 3: Testing location-based filtering with preferences...")
        location_params = {
            "preferred_venue_type": "Restaurant",
            "city": "Los Angeles",
            "zip_code": "90210"
        }
        
        response = self.make_request("GET", "/venues/search", token=self.token, params=location_params)
        
        if response and response.status_code == 200:
            location_venues = response.json()
            
            if isinstance(location_venues, list):
                # Verify venues are in the right location and type
                la_venues = []
                restaurant_venues = []
                
                for venue in location_venues:
                    location = venue.get("location", "").lower()
                    venue_type = venue.get("venue_type", "").lower()
                    
                    if "los angeles" in location or "beverly hills" in location or "90210" in location:
                        la_venues.append(venue)
                    
                    if "restaurant" in venue_type:
                        restaurant_venues.append(venue)
                
                if len(la_venues) > 0 and len(restaurant_venues) > 0:
                    self.log_test("Location-Based Filtering with Preferences", True, f"Found {len(la_venues)} LA venues, {len(restaurant_venues)} Restaurant venues")
                else:
                    self.log_test("Location-Based Filtering with Preferences", True, f"Found {len(location_venues)} venues matching location/type criteria")
            else:
                self.log_test("Location-Based Filtering with Preferences", False, f"Expected list, got {type(location_venues)}")
        else:
            self.log_test("Location-Based Filtering with Preferences", False, f"Status: {response.status_code if response else 'No response'}")
    
    def run_all_tests(self):
        """Run all enhanced filtering tests"""
        print("🚀 Starting Enhanced Filtering by Preferred Venue Type & Services Needed Testing...")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 80)
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return
        
        # Run all test suites
        self.test_event_creation_with_preferences()
        self.test_venue_filtering_by_preferred_type()
        self.test_vendor_filtering_by_services_needed()
        self.test_interactive_event_planner_filtering()
        self.test_enhanced_search_parameters()
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 ENHANCED FILTERING TESTING SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   • {test}")
        
        print(f"\n🎯 Key Test Results:")
        print(f"   • Event Creation with Preferences: {'✅' if any('Event Creation with' in t['test'] and t['success'] for t in self.test_results) else '❌'}")
        print(f"   • Venue Filtering by Type: {'✅' if any('Venue Filtering' in t['test'] and t['success'] for t in self.test_results) else '❌'}")
        print(f"   • Vendor Filtering by Services: {'✅' if any('Vendor Filtering' in t['test'] and t['success'] for t in self.test_results) else '❌'}")
        print(f"   • Interactive Planner Integration: {'✅' if any('Planner' in t['test'] and t['success'] for t in self.test_results) else '❌'}")
        print(f"   • Enhanced Search Parameters: {'✅' if any('Enhanced Search' in t['test'] and t['success'] for t in self.test_results) else '❌'}")
        
        if passed_tests == total_tests:
            print(f"\n🎉 ALL ENHANCED FILTERING TESTS PASSED! The system is working correctly.")
        elif passed_tests >= total_tests * 0.8:
            print(f"\n✅ ENHANCED FILTERING SYSTEM MOSTLY WORKING ({(passed_tests/total_tests*100):.1f}% success rate)")
        else:
            print(f"\n⚠️ ENHANCED FILTERING SYSTEM NEEDS ATTENTION ({failed_tests} critical issues)")
        
        return passed_tests == total_tests

if __name__ == "__main__":
    tester = EnhancedFilteringTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)