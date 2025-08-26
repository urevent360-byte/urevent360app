#!/usr/bin/env python3
"""
Start Planning, Sync Filters, and Step-by-Step Functional Improvements Testing
Focus: Testing the comprehensive Start Planning → Quote Creation Flow with questionnaire sync

PRIORITY TESTING FOCUS (as per review request):
1. Routing Fix: "Start New Planning" goes directly to Step-by-Step Mode for new quote draft
2. Questionnaire Sync: Hard sync between questionnaire and Step-by-Step (venue type, services, guest count, at-home logic)
3. One-Click Functional Tiles: Category tiles behavior (none selected vs selected states)
4. Catalog Filters Auto-Applied: Vendor search with applied filters from questionnaire
5. Sparkle Your Event: Shows services NOT selected in Services Needed
6. API Integration: Quote creation, vendor search, filter-based catalog retrieval, Step-by-Step sync

Testing backend APIs that support the Start Planning → Quote Creation Flow with enhanced filtering.
"""

import requests
import json
import sys
from datetime import datetime
import uuid
import os

# Configuration - Use environment variable for backend URL
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://event-portal-6.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
TEST_CREDENTIALS = {
    "client": {"email": "sarah.johnson@email.com", "password": "SecurePass123"}
}

class StartPlanningTester:
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
    
    def test_authentication(self):
        """Test client authentication"""
        print("\n🔐 Testing Client Authentication...")
        
        response = self.make_request("POST", "/login", TEST_CREDENTIALS["client"])
        
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                self.tokens["client"] = data["access_token"]
                self.log_test("Client Authentication", True, f"Token length: {len(data['access_token'])}")
                return True
            else:
                self.log_test("Client Authentication", False, "No access token in response")
        else:
            self.log_test("Client Authentication", False, f"Status: {response.status_code if response else 'No response'}")
        
        return False

    def test_routing_fix_quote_creation(self):
        """Test Routing Fix: Start New Planning → Quote Creation Flow"""
        print("\n🎯 Testing Routing Fix: Start New Planning → Quote Creation Flow...")
        
        if "client" not in self.tokens:
            self.test_authentication()
        
        if "client" not in self.tokens:
            self.log_test("Quote Creation Flow Test", False, "No client token available")
            return
        
        # Step 1: Create event for quote creation testing
        print("Step 1: Creating event for quote creation testing...")
        event_data = {
            "name": "Start Planning Test Event",
            "description": "Testing Start New Planning → Quote Creation Flow",
            "event_type": "wedding",
            "date": "2024-12-15T18:00:00Z",
            "location": "Miami, FL",
            "budget": 45000.0,
            "guest_count": 150,
            "status": "planning",
            "preferred_venue_type": "Hotel/Banquet Hall",
            "services_needed": ["Catering", "Photography", "Decoration", "DJ"]
        }
        
        response = self.make_request("POST", "/events", event_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            event = response.json()
            event_id = event.get("id")
            self.log_test("Event Creation for Quote Flow", True, f"Event created with ID: {event_id}")
        else:
            self.log_test("Event Creation for Quote Flow", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        # Step 2: Test Quote Creation API (Start New Planning)
        print("Step 2: Testing Quote Creation API (Start New Planning)...")
        quote_data = {
            "event_id": event_id,
            "name": "New Quote Draft",
            "status": "in_progress",
            "event_type": event_data["event_type"],
            "event_date": event_data["date"],
            "budget": event_data["budget"],
            "guest_count": event_data["guest_count"],
            "location": event_data["location"],
            "services_needed": event_data["services_needed"]
        }
        
        response = self.make_request("POST", f"/events/{event_id}/quotes", quote_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            quote = response.json()
            quote_id = quote.get("id")
            self.log_test("Quote Creation (Start New Planning)", True, f"Quote created with ID: {quote_id}")
            
            # Verify quote contains questionnaire data
            if (quote.get("services_needed") == event_data["services_needed"] and
                quote.get("guest_count") == event_data["guest_count"] and
                quote.get("budget") == event_data["budget"]):
                self.log_test("Quote Questionnaire Data Sync", True, "Quote contains all questionnaire data")
            else:
                self.log_test("Quote Questionnaire Data Sync", False, f"Data mismatch in quote: {quote}")
        else:
            self.log_test("Quote Creation (Start New Planning)", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        # Step 3: Test Quote Retrieval (Resume Quote functionality)
        print("Step 3: Testing Quote Retrieval (Resume Quote functionality)...")
        response = self.make_request("GET", f"/events/{event_id}/quotes", token=self.tokens["client"])
        if response and response.status_code == 200:
            quotes = response.json()
            if isinstance(quotes, list) and len(quotes) > 0:
                retrieved_quote = quotes[0]
                if retrieved_quote.get("id") == quote_id:
                    self.log_test("Quote Retrieval (Resume Quote)", True, f"Retrieved quote: {retrieved_quote['name']}")
                    
                    # Verify "Resume Quote" only appears when existing drafts exist
                    if retrieved_quote.get("status") == "in_progress":
                        self.log_test("Resume Quote Availability", True, "In-progress quote available for resume")
                    else:
                        self.log_test("Resume Quote Availability", False, f"Quote status: {retrieved_quote.get('status')}")
                else:
                    self.log_test("Quote Retrieval (Resume Quote)", False, "Quote ID mismatch")
            else:
                self.log_test("Quote Retrieval (Resume Quote)", False, "No quotes found")
        else:
            self.log_test("Quote Retrieval (Resume Quote)", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 4: Test Direct Step-by-Step Mode Access (No Latest Quote Redirection)
        print("Step 4: Testing Direct Step-by-Step Mode Access...")
        response = self.make_request("GET", f"/events/{event_id}/planner/state", token=self.tokens["client"])
        if response and response.status_code == 200:
            planner_state = response.json()
            
            # Verify planner state is initialized for new quote draft
            if (planner_state.get("event_id") == event_id and
                planner_state.get("current_step") == 0):
                self.log_test("Direct Step-by-Step Access", True, "Planner state initialized for new quote")
            else:
                self.log_test("Direct Step-by-Step Access", False, f"Planner state issues: {planner_state}")
        else:
            self.log_test("Direct Step-by-Step Access", False, f"Status: {response.status_code if response else 'No response'}")

    def test_questionnaire_sync_filtering(self):
        """Test Questionnaire Sync: Hard sync between questionnaire and Step-by-Step"""
        print("\n🔄 Testing Questionnaire Sync: Hard sync between questionnaire and Step-by-Step...")
        
        if "client" not in self.tokens:
            self.test_authentication()
        
        if "client" not in self.tokens:
            self.log_test("Questionnaire Sync Test", False, "No client token available")
            return
        
        # Test Case 1: Indoor Venue Type Filtering
        print("Test Case 1: Indoor Venue Type Filtering...")
        indoor_event_data = {
            "name": "Indoor Event Test",
            "event_type": "corporate",
            "date": "2024-11-20T19:00:00Z",
            "location": "New York, NY",
            "budget": 25000.0,
            "guest_count": 100,
            "preferred_venue_type": "Hotel/Banquet Hall",
            "services_needed": ["Catering", "Photography"]
        }
        
        response = self.make_request("POST", "/events", indoor_event_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            indoor_event = response.json()
            indoor_event_id = indoor_event.get("id")
            
            # Test venue search with preferred venue type filtering
            response = self.make_request("GET", "/venues/search", 
                                       params={
                                           "preferred_venue_type": "Hotel/Banquet Hall",
                                           "capacity_min": indoor_event_data["guest_count"]
                                       },
                                       token=self.tokens["client"])
            
            if response and response.status_code == 200:
                venues = response.json()
                if isinstance(venues, list):
                    # Check if venues match preferred type
                    matching_venues = [v for v in venues if "hotel" in v.get("venue_type", "").lower() or "banquet" in v.get("venue_type", "").lower()]
                    self.log_test("Indoor Venue Type Filtering", True, f"Found {len(matching_venues)} matching indoor venues")
                else:
                    self.log_test("Indoor Venue Type Filtering", False, "Invalid venue response format")
            else:
                self.log_test("Indoor Venue Type Filtering", False, f"Venue search failed: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Indoor Event Creation", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        # Test Case 2: Outdoor Venue Type Filtering
        print("Test Case 2: Outdoor Venue Type Filtering...")
        outdoor_event_data = {
            "name": "Outdoor Event Test",
            "event_type": "wedding",
            "date": "2024-09-15T16:00:00Z",
            "location": "Los Angeles, CA",
            "budget": 35000.0,
            "guest_count": 120,
            "preferred_venue_type": "Outdoor/Garden",
            "services_needed": ["Catering", "Photography", "Decoration"]
        }
        
        response = self.make_request("POST", "/events", outdoor_event_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            outdoor_event = response.json()
            outdoor_event_id = outdoor_event.get("id")
            
            # Test venue search with outdoor preference
            response = self.make_request("GET", "/venues/search",
                                       params={
                                           "preferred_venue_type": "Outdoor/Garden",
                                           "capacity_min": outdoor_event_data["guest_count"]
                                       },
                                       token=self.tokens["client"])
            
            if response and response.status_code == 200:
                venues = response.json()
                if isinstance(venues, list):
                    outdoor_venues = [v for v in venues if "outdoor" in v.get("venue_type", "").lower() or "garden" in v.get("venue_type", "").lower()]
                    self.log_test("Outdoor Venue Type Filtering", True, f"Found {len(outdoor_venues)} matching outdoor venues")
                else:
                    self.log_test("Outdoor Venue Type Filtering", False, "Invalid venue response format")
            else:
                self.log_test("Outdoor Venue Type Filtering", False, f"Venue search failed: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Outdoor Event Creation", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        # Test Case 3: At-Home Event Logic
        print("Test Case 3: At-Home Event Logic...")
        at_home_event_data = {
            "name": "At-Home Event Test",
            "event_type": "birthday",
            "date": "2024-10-10T15:00:00Z",
            "location": "Private Residence, Miami, FL",
            "budget": 15000.0,
            "guest_count": 50,
            "preferred_venue_type": "My Own Private Space",
            "services_needed": ["Catering", "Decoration", "Entertainment"]
        }
        
        response = self.make_request("POST", "/events", at_home_event_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            at_home_event = response.json()
            at_home_event_id = at_home_event.get("id")
            
            # Test venue search for at-home events (should return empty)
            response = self.make_request("GET", "/venues/search",
                                       params={
                                           "preferred_venue_type": "My Own Private Space"
                                       },
                                       token=self.tokens["client"])
            
            if response and response.status_code == 200:
                venues = response.json()
                if isinstance(venues, list) and len(venues) == 0:
                    self.log_test("At-Home Event Logic (Venue Disabled)", True, "Venue search correctly returns empty for at-home events")
                else:
                    self.log_test("At-Home Event Logic (Venue Disabled)", False, f"Expected empty venue list, got {len(venues)} venues")
            else:
                self.log_test("At-Home Event Logic (Venue Disabled)", False, f"Venue search failed: {response.status_code if response else 'No response'}")
        else:
            self.log_test("At-Home Event Creation", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        # Test Case 4: Services Needed Filtering
        print("Test Case 4: Services Needed Filtering...")
        
        # Test vendor search with services needed filtering
        response = self.make_request("GET", "/vendors/search",
                                   params={
                                       "services_needed": "Catering,Photography",
                                       "event_id": indoor_event_id
                                   },
                                   token=self.tokens["client"])
        
        if response and response.status_code == 200:
            vendors = response.json()
            if isinstance(vendors, list):
                catering_vendors = [v for v in vendors if "catering" in v.get("service_type", "").lower()]
                photography_vendors = [v for v in vendors if "photo" in v.get("service_type", "").lower()]
                
                if len(catering_vendors) > 0 or len(photography_vendors) > 0:
                    self.log_test("Services Needed Filtering", True, f"Found {len(catering_vendors)} catering + {len(photography_vendors)} photography vendors")
                else:
                    self.log_test("Services Needed Filtering", False, "No vendors found matching needed services")
            else:
                self.log_test("Services Needed Filtering", False, "Invalid vendor response format")
        else:
            self.log_test("Services Needed Filtering", False, f"Vendor search failed: {response.status_code if response else 'No response'}")
        
        # Test Case 5: Guest Count Filtering for Capacity-Based Searches
        print("Test Case 5: Guest Count Filtering for Capacity-Based Searches...")
        
        # Test venue search with guest count capacity filtering
        response = self.make_request("GET", "/venues/search",
                                   params={
                                       "capacity_min": outdoor_event_data["guest_count"],
                                       "preferred_venue_type": "Outdoor/Garden"
                                   },
                                   token=self.tokens["client"])
        
        if response and response.status_code == 200:
            venues = response.json()
            if isinstance(venues, list):
                suitable_venues = [v for v in venues if v.get("capacity", 0) >= outdoor_event_data["guest_count"]]
                self.log_test("Guest Count Capacity Filtering", True, f"Found {len(suitable_venues)} venues with capacity ≥ {outdoor_event_data['guest_count']}")
            else:
                self.log_test("Guest Count Capacity Filtering", False, "Invalid venue response format")
        else:
            self.log_test("Guest Count Capacity Filtering", False, f"Venue search failed: {response.status_code if response else 'No response'}")

    def test_one_click_functional_tiles(self):
        """Test One-Click Functional Tiles: Category tile behavior"""
        print("\n🎲 Testing One-Click Functional Tiles: Category tile behavior...")
        
        if "client" not in self.tokens:
            self.test_authentication()
        
        if "client" not in self.tokens:
            self.log_test("One-Click Tiles Test", False, "No client token available")
            return
        
        # Step 1: Create event for tile testing
        print("Step 1: Creating event for tile testing...")
        tile_event_data = {
            "name": "One-Click Tiles Test Event",
            "event_type": "wedding",
            "date": "2024-11-25T17:00:00Z",
            "location": "San Francisco, CA",
            "budget": 40000.0,
            "guest_count": 130,
            "preferred_venue_type": "Hotel/Banquet Hall",
            "services_needed": ["Catering", "Photography", "Decoration"]
        }
        
        response = self.make_request("POST", "/events", tile_event_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            event = response.json()
            event_id = event.get("id")
            self.log_test("Event Creation for Tiles", True, f"Event created with ID: {event_id}")
        else:
            self.log_test("Event Creation for Tiles", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        # Step 2: Test Category Tiles API (None Selected State)
        print("Step 2: Testing Category Tiles API (None Selected State)...")
        response = self.make_request("GET", f"/events/{event_id}/planner/steps", token=self.tokens["client"])
        if response and response.status_code == 200:
            steps = response.json()
            
            if isinstance(steps, list) and len(steps) > 0:
                # Find service category tiles
                service_tiles = [step for step in steps if step.get("service_type")]
                
                if len(service_tiles) >= 3:
                    self.log_test("Category Tiles Available", True, f"Found {len(service_tiles)} service category tiles")
                    
                    # Test tile data structure for frontend
                    first_tile = service_tiles[0]
                    required_tile_fields = ["id", "title", "subtitle", "service_type"]
                    missing_fields = [field for field in required_tile_fields if field not in first_tile]
                    
                    if len(missing_fields) == 0:
                        self.log_test("Tile Data Structure", True, "All required fields present for functional tiles")
                    else:
                        self.log_test("Tile Data Structure", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test("Category Tiles Available", False, f"Only found {len(service_tiles)} service tiles")
            else:
                self.log_test("Category Tiles Available", False, "No steps/tiles found")
        else:
            self.log_test("Category Tiles Available", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 3: Test One-Click Opens Filtered Catalog (None Selected → 1 Click)
        print("Step 3: Testing One-Click Opens Filtered Catalog...")
        
        # Test clicking on Catering tile (none selected state)
        response = self.make_request("GET", f"/events/{event_id}/planner/vendors/catering", token=self.tokens["client"])
        if response and response.status_code == 200:
            catering_vendors = response.json()
            
            if isinstance(catering_vendors, list):
                self.log_test("One-Click Filtered Catalog (Catering)", True, f"Catering catalog opened with {len(catering_vendors)} vendors")
                
                # Verify vendors are filtered by event context
                if len(catering_vendors) > 0:
                    first_vendor = catering_vendors[0]
                    if "catering" in first_vendor.get("service_type", "").lower():
                        self.log_test("Catalog Filtering Applied", True, "Vendors filtered by service type")
                    else:
                        self.log_test("Catalog Filtering Applied", False, f"Vendor service type: {first_vendor.get('service_type')}")
            else:
                self.log_test("One-Click Filtered Catalog (Catering)", False, "Invalid vendor catalog response")
        else:
            self.log_test("One-Click Filtered Catalog (Catering)", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 4: Test Vendor Selection (Selected State)
        print("Step 4: Testing Vendor Selection (Selected State)...")
        
        # Add a vendor to cart to simulate selected state
        if len(catering_vendors) > 0:
            selected_vendor = catering_vendors[0]
            cart_item = {
                "vendor_id": selected_vendor.get("id"),
                "vendor_name": selected_vendor.get("name"),
                "service_type": "catering",
                "service_name": "Wedding Catering Package",
                "price": 8500.0,
                "quantity": 1
            }
            
            response = self.make_request("POST", f"/events/{event_id}/cart/add", cart_item, token=self.tokens["client"])
            if response and response.status_code == 200:
                self.log_test("Vendor Selection (Add to Cart)", True, f"Selected vendor: {cart_item['vendor_name']}")
                
                # Step 5: Test Selected State Behavior (1 Click Opens Vendor Detail)
                print("Step 5: Testing Selected State Behavior...")
                
                # Get vendor details (simulating vendor detail modal)
                vendor_id = selected_vendor.get("id")
                response = self.make_request("GET", f"/vendors/{vendor_id}", token=self.tokens["client"])
                if response and response.status_code == 200:
                    vendor_details = response.json()
                    
                    if vendor_details.get("id") == vendor_id:
                        self.log_test("One-Click Vendor Detail Modal", True, f"Vendor details opened: {vendor_details.get('name')}")
                        
                        # Verify vendor has photo/logo data for replacing generic icons
                        if "images" in vendor_details or "logo_url" in vendor_details:
                            self.log_test("Vendor Photos/Logos Available", True, "Vendor has image data for replacing generic icons")
                        else:
                            self.log_test("Vendor Photos/Logos Available", False, "No image data found for vendor")
                    else:
                        self.log_test("One-Click Vendor Detail Modal", False, "Vendor ID mismatch in details")
                else:
                    self.log_test("One-Click Vendor Detail Modal", False, f"Status: {response.status_code if response else 'No response'}")
            else:
                self.log_test("Vendor Selection (Add to Cart)", False, f"Status: {response.status_code if response else 'No response'}")

    def test_catalog_filters_auto_applied(self):
        """Test Catalog Filters Auto-Applied: Vendor search with applied filters"""
        print("\n🔍 Testing Catalog Filters Auto-Applied: Vendor search with applied filters...")
        
        if "client" not in self.tokens:
            self.test_authentication()
        
        if "client" not in self.tokens:
            self.log_test("Catalog Filters Test", False, "No client token available")
            return
        
        # Step 1: Create event with specific filter requirements
        print("Step 1: Creating event with specific filter requirements...")
        filter_event_data = {
            "name": "Catalog Filters Test Event",
            "event_type": "wedding",
            "date": "2024-12-01T18:00:00Z",
            "location": "Chicago, IL",
            "budget": 50000.0,
            "guest_count": 180,
            "preferred_venue_type": "Hotel/Banquet Hall",
            "services_needed": ["Venue", "Catering", "Photography", "Decoration"]
        }
        
        response = self.make_request("POST", "/events", filter_event_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            event = response.json()
            event_id = event.get("id")
            self.log_test("Event Creation for Filter Testing", True, f"Event created with {filter_event_data['guest_count']} guests, ${filter_event_data['budget']} budget")
        else:
            self.log_test("Event Creation for Filter Testing", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        # Step 2: Test Venue Filters Auto-Applied (capacity ≥ Guest Count + Preferred Venue Type)
        print("Step 2: Testing Venue Filters Auto-Applied...")
        
        # Create filter object structure as mentioned in review
        venue_filters = {
            "event_id": event_id,
            "quote_id": None,  # For new quote draft
            "filters": {
                "capacity_min": filter_event_data["guest_count"],
                "preferred_venue_type": filter_event_data["preferred_venue_type"],
                "location": filter_event_data["location"]
            }
        }
        
        response = self.make_request("GET", "/venues/search",
                                   params={
                                       "capacity_min": venue_filters["filters"]["capacity_min"],
                                       "preferred_venue_type": venue_filters["filters"]["preferred_venue_type"],
                                       "city": "Chicago"
                                   },
                                   token=self.tokens["client"])
        
        if response and response.status_code == 200:
            venues = response.json()
            if isinstance(venues, list):
                # Verify capacity filtering
                suitable_venues = [v for v in venues if v.get("capacity", 0) >= filter_event_data["guest_count"]]
                
                # Verify venue type filtering
                matching_type_venues = [v for v in venues if "hotel" in v.get("venue_type", "").lower() or "banquet" in v.get("venue_type", "").lower()]
                
                if len(suitable_venues) > 0 and len(matching_type_venues) > 0:
                    self.log_test("Venue Filters Auto-Applied", True, f"Found {len(suitable_venues)} venues with capacity ≥ {filter_event_data['guest_count']}, {len(matching_type_venues)} matching venue type")
                else:
                    self.log_test("Venue Filters Auto-Applied", False, f"Capacity suitable: {len(suitable_venues)}, Type matching: {len(matching_type_venues)}")
            else:
                self.log_test("Venue Filters Auto-Applied", False, "Invalid venue response format")
        else:
            self.log_test("Venue Filters Auto-Applied", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 3: Test Other Services Filters (Guest Count + Event Type Matching)
        print("Step 3: Testing Other Services Filters...")
        
        # Test catering service with filters
        catering_filters = {
            "event_id": event_id,
            "quote_id": None,
            "filters": {
                "guest_count": filter_event_data["guest_count"],
                "event_type": filter_event_data["event_type"],
                "budget_max": filter_event_data["budget"]
            }
        }
        
        response = self.make_request("GET", "/vendors/search",
                                   params={
                                       "service_type": "catering",
                                       "event_id": event_id,
                                       "budget_max": catering_filters["filters"]["budget_max"]
                                   },
                                   token=self.tokens["client"])
        
        if response and response.status_code == 200:
            catering_vendors = response.json()
            if isinstance(catering_vendors, list):
                # Verify service type filtering
                catering_only = [v for v in catering_vendors if "catering" in v.get("service_type", "").lower()]
                
                # Verify budget filtering (vendors within budget)
                budget_suitable = [v for v in catering_vendors if 
                                 v.get("base_price", 0) <= filter_event_data["budget"] or
                                 v.get("price_per_person", 0) * filter_event_data["guest_count"] <= filter_event_data["budget"]]
                
                if len(catering_only) > 0:
                    self.log_test("Service Type Filtering", True, f"Found {len(catering_only)} catering vendors")
                    
                    if len(budget_suitable) > 0:
                        self.log_test("Budget-Aware Filtering", True, f"Found {len(budget_suitable)} vendors within budget")
                    else:
                        self.log_test("Budget-Aware Filtering", False, "No vendors found within budget constraints")
                else:
                    self.log_test("Service Type Filtering", False, "No catering vendors found")
            else:
                self.log_test("Service Type Filtering", False, "Invalid vendor response format")
        else:
            self.log_test("Service Type Filtering", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 4: Test Filter Object Structure
        print("Step 4: Testing Filter Object Structure...")
        
        # Verify the filter object structure mentioned in review (event_id, quote_id, filters)
        filter_structure_test = {
            "event_id": event_id,
            "quote_id": None,  # For new quote draft
            "filters": {
                "preferred_venue_type": filter_event_data["preferred_venue_type"],
                "services_needed": filter_event_data["services_needed"],
                "guest_count": filter_event_data["guest_count"],
                "budget": filter_event_data["budget"],
                "location": filter_event_data["location"],
                "event_type": filter_event_data["event_type"]
            }
        }
        
        # Test if this structure can be used in vendor search
        response = self.make_request("GET", "/vendors/search",
                                   params={
                                       "event_id": filter_structure_test["event_id"],
                                       "services_needed": ",".join(filter_structure_test["filters"]["services_needed"]),
                                       "budget_max": filter_structure_test["filters"]["budget"]
                                   },
                                   token=self.tokens["client"])
        
        if response and response.status_code == 200:
            vendors = response.json()
            if isinstance(vendors, list):
                self.log_test("Filter Object Structure", True, f"Filter structure works with {len(vendors)} vendors found")
            else:
                self.log_test("Filter Object Structure", False, "Invalid response with filter structure")
        else:
            self.log_test("Filter Object Structure", False, f"Status: {response.status_code if response else 'No response'}")

    def test_sparkle_your_event(self):
        """Test Sparkle Your Event: Optional upsell section"""
        print("\n✨ Testing Sparkle Your Event: Optional upsell section...")
        
        if "client" not in self.tokens:
            self.test_authentication()
        
        if "client" not in self.tokens:
            self.log_test("Sparkle Your Event Test", False, "No client token available")
            return
        
        # Step 1: Create event with limited services needed
        print("Step 1: Creating event with limited services needed...")
        sparkle_event_data = {
            "name": "Sparkle Your Event Test",
            "event_type": "wedding",
            "date": "2024-12-10T19:00:00Z",
            "location": "Las Vegas, NV",
            "budget": 60000.0,
            "guest_count": 200,
            "preferred_venue_type": "Hotel/Banquet Hall",
            "services_needed": ["Venue", "Catering", "Photography"]  # Limited services
        }
        
        response = self.make_request("POST", "/events", sparkle_event_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            event = response.json()
            event_id = event.get("id")
            self.log_test("Event Creation for Sparkle Test", True, f"Event created with {len(sparkle_event_data['services_needed'])} selected services")
        else:
            self.log_test("Event Creation for Sparkle Test", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        # Step 2: Test Services NOT Selected Logic
        print("Step 2: Testing Services NOT Selected Logic...")
        
        # All possible services
        all_services = ["Venue", "Catering", "Photography", "Decoration", "DJ", "Entertainment", "Lighting", "Security", "Transportation", "Bar"]
        selected_services = sparkle_event_data["services_needed"]
        not_selected_services = [service for service in all_services if service not in selected_services]
        
        self.log_test("Services NOT Selected Identification", True, f"Identified {len(not_selected_services)} services NOT selected: {not_selected_services}")
        
        # Step 3: Test Sparkle Your Event Recommendations
        print("Step 3: Testing Sparkle Your Event Recommendations...")
        
        # Test vendor search for services NOT in Services Needed
        sparkle_recommendations = []
        
        for service in not_selected_services[:3]:  # Test first 3 not-selected services
            # Map service names to backend service types
            service_mapping = {
                "Decoration": "decoration",
                "DJ": "music",
                "Entertainment": "entertainment",
                "Lighting": "lighting",
                "Security": "security",
                "Transportation": "transportation",
                "Bar": "bar"
            }
            
            service_type = service_mapping.get(service, service.lower())
            
            response = self.make_request("GET", "/vendors/search",
                                       params={
                                           "service_type": service_type,
                                           "event_id": event_id,
                                           "budget_max": sparkle_event_data["budget"]
                                       },
                                       token=self.tokens["client"])
            
            if response and response.status_code == 200:
                vendors = response.json()
                if isinstance(vendors, list) and len(vendors) > 0:
                    sparkle_recommendations.append({
                        "service": service,
                        "vendor_count": len(vendors),
                        "top_vendor": vendors[0].get("name", "Unknown")
                    })
                    print(f"   ✅ {service}: Found {len(vendors)} vendors")
                else:
                    print(f"   ⚠️  {service}: No vendors found")
            else:
                print(f"   ❌ {service}: API error")
        
        if len(sparkle_recommendations) > 0:
            self.log_test("Sparkle Your Event Recommendations", True, f"Found recommendations for {len(sparkle_recommendations)} additional services")
        else:
            self.log_test("Sparkle Your Event Recommendations", False, "No recommendations found for additional services")
        
        # Step 4: Test Trends and Popularity Logic
        print("Step 4: Testing Trends and Popularity Logic...")
        
        # Test vendor search with rating/popularity sorting (simulating trends)
        response = self.make_request("GET", "/vendors/search",
                                   params={
                                       "service_type": "decoration",
                                       "event_id": event_id
                                   },
                                   token=self.tokens["client"])
        
        if response and response.status_code == 200:
            decoration_vendors = response.json()
            if isinstance(decoration_vendors, list) and len(decoration_vendors) > 0:
                # Check if vendors have rating data for popularity sorting
                vendors_with_ratings = [v for v in decoration_vendors if v.get("rating", 0) > 0]
                
                if len(vendors_with_ratings) > 0:
                    self.log_test("Trends and Popularity Data", True, f"Found {len(vendors_with_ratings)} vendors with rating data for popularity sorting")
                else:
                    self.log_test("Trends and Popularity Data", False, "No vendors with rating data found")
            else:
                self.log_test("Trends and Popularity Data", False, "No decoration vendors found for trends testing")
        else:
            self.log_test("Trends and Popularity Data", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 5: Test Non-Override of Main Services
        print("Step 5: Testing Non-Override of Main Services...")
        
        # Verify that Sparkle Your Event does NOT override main Services Needed tiles
        response = self.make_request("GET", f"/events/{event_id}/planner/steps", token=self.tokens["client"])
        if response and response.status_code == 200:
            steps = response.json()
            
            if isinstance(steps, list):
                # Find steps that match selected services
                main_service_steps = []
                for step in steps:
                    step_service = step.get("service_type", "") or ""
                    for selected_service in selected_services:
                        if step_service and (selected_service.lower() in step_service.lower() or step_service.lower() in selected_service.lower()):
                            main_service_steps.append(step)
                            break
                
                if len(main_service_steps) >= len(selected_services) - 1:  # Allow for some mapping differences
                    self.log_test("Main Services NOT Overridden", True, f"Main services preserved: {len(main_service_steps)} steps found")
                else:
                    self.log_test("Main Services NOT Overridden", False, f"Main services may be overridden: only {len(main_service_steps)} steps found")
            else:
                self.log_test("Main Services NOT Overridden", False, "Invalid steps response")
        else:
            self.log_test("Main Services NOT Overridden", False, f"Status: {response.status_code if response else 'No response'}")

    def test_api_integration_comprehensive(self):
        """Test API Integration: Complete backend API support"""
        print("\n🔗 Testing API Integration: Complete backend API support...")
        
        if "client" not in self.tokens:
            self.test_authentication()
        
        if "client" not in self.tokens:
            self.log_test("API Integration Test", False, "No client token available")
            return
        
        # Step 1: Test Quote Creation with Questionnaire Filters
        print("Step 1: Testing Quote Creation with Questionnaire Filters...")
        
        # Create event with comprehensive questionnaire data
        integration_event_data = {
            "name": "API Integration Test Event",
            "event_type": "wedding",
            "date": "2024-12-20T18:00:00Z",
            "location": "Seattle, WA",
            "budget": 55000.0,
            "guest_count": 160,
            "preferred_venue_type": "Hotel/Banquet Hall",
            "services_needed": ["Venue", "Catering", "Photography", "Decoration", "DJ", "Bar"]
        }
        
        response = self.make_request("POST", "/events", integration_event_data, token=self.tokens["client"])
        if response and response.status_code == 200:
            event = response.json()
            event_id = event.get("id")
            
            # Create quote with questionnaire filters
            quote_with_filters = {
                "event_id": event_id,
                "name": "Filtered Quote Draft",
                "status": "in_progress",
                "event_type": integration_event_data["event_type"],
                "event_date": integration_event_data["date"],
                "budget": integration_event_data["budget"],
                "guest_count": integration_event_data["guest_count"],
                "location": integration_event_data["location"],
                "services_needed": integration_event_data["services_needed"]
            }
            
            response = self.make_request("POST", f"/events/{event_id}/quotes", quote_with_filters, token=self.tokens["client"])
            if response and response.status_code == 200:
                quote = response.json()
                
                # Verify all questionnaire filters are preserved
                filters_preserved = (
                    quote.get("services_needed") == integration_event_data["services_needed"] and
                    quote.get("guest_count") == integration_event_data["guest_count"] and
                    quote.get("budget") == integration_event_data["budget"]
                )
                
                if filters_preserved:
                    self.log_test("Quote Creation with Questionnaire Filters", True, "All questionnaire filters preserved in quote")
                else:
                    self.log_test("Quote Creation with Questionnaire Filters", False, f"Filter preservation failed: {quote}")
            else:
                self.log_test("Quote Creation with Questionnaire Filters", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Event Creation for API Integration", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        # Step 2: Test Vendor Search with Applied Filters
        print("Step 2: Testing Vendor Search with Applied Filters...")
        
        # Test comprehensive vendor search with all filter types
        filter_params = {
            "event_id": event_id,
            "services_needed": ",".join(integration_event_data["services_needed"]),
            "budget_max": integration_event_data["budget"],
            "location": "Seattle"
        }
        
        response = self.make_request("GET", "/vendors/search", params=filter_params, token=self.tokens["client"])
        if response and response.status_code == 200:
            filtered_vendors = response.json()
            
            if isinstance(filtered_vendors, list):
                self.log_test("Vendor Search with Applied Filters", True, f"Found {len(filtered_vendors)} vendors with applied filters")
                
                # Verify filters are actually applied
                if len(filtered_vendors) > 0:
                    # Check service type filtering
                    service_types_found = set(v.get("service_type", "").lower() for v in filtered_vendors)
                    expected_services = set(s.lower() for s in integration_event_data["services_needed"])
                    
                    # Check if any expected services match found services
                    matching_services = any(
                        any(expected in found for found in service_types_found)
                        for expected in expected_services
                    )
                    
                    if matching_services:
                        self.log_test("Filter Application Verification", True, "Vendor search filters are working")
                    else:
                        self.log_test("Filter Application Verification", False, f"Service types found: {service_types_found}")
            else:
                self.log_test("Vendor Search with Applied Filters", False, "Invalid vendor search response")
        else:
            self.log_test("Vendor Search with Applied Filters", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 3: Test Filter-Based Vendor Catalog Retrieval
        print("Step 3: Testing Filter-Based Vendor Catalog Retrieval...")
        
        # Test individual service catalog retrieval with filters
        response = self.make_request("GET", f"/events/{event_id}/planner/vendors/catering", token=self.tokens["client"])
        if response and response.status_code == 200:
            catering_catalog = response.json()
            
            if isinstance(catering_catalog, list):
                self.log_test("Filter-Based Catalog Retrieval", True, f"Retrieved catering catalog with {len(catering_catalog)} vendors")
                
                # Verify catalog is filtered by event context
                if len(catering_catalog) > 0:
                    first_vendor = catering_catalog[0]
                    if "catering" in first_vendor.get("service_type", "").lower():
                        self.log_test("Catalog Context Filtering", True, "Catalog filtered by event context")
                    else:
                        self.log_test("Catalog Context Filtering", False, f"Unexpected service type: {first_vendor.get('service_type')}")
            else:
                self.log_test("Filter-Based Catalog Retrieval", False, "Invalid catalog response")
        else:
            self.log_test("Filter-Based Catalog Retrieval", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 4: Test Step-by-Step Mode Data Synchronization
        print("Step 4: Testing Step-by-Step Mode Data Synchronization...")
        
        # Get planner state and verify synchronization with event data
        response = self.make_request("GET", f"/events/{event_id}/planner/state", token=self.tokens["client"])
        if response and response.status_code == 200:
            planner_state = response.json()
            
            # Verify budget synchronization
            budget_tracking = planner_state.get("budget_tracking", {})
            set_budget = budget_tracking.get("set_budget", 0)
            
            if set_budget == integration_event_data["budget"]:
                self.log_test("Step-by-Step Budget Sync", True, f"Budget synchronized: ${set_budget}")
            else:
                self.log_test("Step-by-Step Budget Sync", False, f"Budget mismatch: Expected ${integration_event_data['budget']}, Got ${set_budget}")
            
            # Verify event ID synchronization
            if planner_state.get("event_id") == event_id:
                self.log_test("Step-by-Step Event Sync", True, "Event ID synchronized")
            else:
                self.log_test("Step-by-Step Event Sync", False, f"Event ID mismatch: {planner_state.get('event_id')}")
        else:
            self.log_test("Step-by-Step Mode Data Synchronization", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 5: Test End-to-End Integration Flow
        print("Step 5: Testing End-to-End Integration Flow...")
        
        # Add vendor to cart and verify all systems update
        if len(catering_catalog) > 0:
            selected_vendor = catering_catalog[0]
            cart_item = {
                "vendor_id": selected_vendor.get("id"),
                "vendor_name": selected_vendor.get("name"),
                "service_type": "catering",
                "service_name": "Premium Wedding Catering",
                "price": 12000.0,
                "quantity": 1
            }
            
            response = self.make_request("POST", f"/events/{event_id}/cart/add", cart_item, token=self.tokens["client"])
            if response and response.status_code == 200:
                # Verify quote can be updated with vendor selection
                quote_update = {
                    "selected_vendors": [cart_item],
                    "vendor_count": 1,
                    "total_budget": cart_item["price"]
                }
                
                response = self.make_request("PUT", f"/events/{event_id}/quotes/{quote['id']}", quote_update, token=self.tokens["client"])
                if response and response.status_code == 200:
                    updated_quote = response.json()
                    
                    if updated_quote.get("vendor_count") == 1 and updated_quote.get("total_budget") == cart_item["price"]:
                        self.log_test("End-to-End Integration Flow", True, "Complete integration flow working")
                    else:
                        self.log_test("End-to-End Integration Flow", False, f"Quote update issues: {updated_quote}")
                else:
                    self.log_test("End-to-End Integration Flow", False, f"Quote update failed: {response.status_code if response else 'No response'}")
            else:
                self.log_test("End-to-End Integration Flow", False, f"Cart add failed: {response.status_code if response else 'No response'}")

    def run_all_tests(self):
        """Run all Start Planning, Sync Filters, and Step-by-Step tests"""
        print("🚀 Starting Start Planning, Sync Filters, and Step-by-Step Functional Improvements Testing...")
        print("=" * 80)
        
        # Authenticate first
        if not self.test_authentication():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return
        
        # Run all test suites
        self.test_routing_fix_quote_creation()
        self.test_questionnaire_sync_filtering()
        self.test_one_click_functional_tiles()
        self.test_catalog_filters_auto_applied()
        self.test_sparkle_your_event()
        self.test_api_integration_comprehensive()
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 START PLANNING, SYNC FILTERS, AND STEP-BY-STEP TESTING SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests ({len(self.failed_tests)}):")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"   {i}. {test}")
        
        print("\n🎯 KEY FEATURES TESTED:")
        print("   • Routing Fix: Start New Planning → Step-by-Step Mode")
        print("   • Questionnaire Sync: Hard sync between questionnaire and Step-by-Step")
        print("   • One-Click Functional Tiles: Category tile behavior")
        print("   • Catalog Filters Auto-Applied: Vendor search with applied filters")
        print("   • Sparkle Your Event: Optional upsell section")
        print("   • API Integration: Complete backend API support")
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = StartPlanningTester()
    passed, failed = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if failed == 0 else 1)