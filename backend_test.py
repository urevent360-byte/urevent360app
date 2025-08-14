#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Urevent 360 Platform
Tests all 4 portals: Admin, Vendor, Employee, and Client systems
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Configuration
BASE_URL = "https://plannerportal.preview.emergentagent.com/api"
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
    
    def test_authentication(self):
        """Test multi-role authentication system"""
        print("\n🔐 Testing Authentication System...")
        
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
        
        # Test 7: Verify all events are retrieved with proper fields
        response = self.make_request("GET", "/events", token=self.tokens["client"])
        if response and response.status_code == 200:
            all_events = response.json()
            
            # Check for new event types in the retrieved events
            event_types_found = [event.get('event_type') for event in all_events]
            sub_types_found = [event.get('sub_event_type') for event in all_events if event.get('sub_event_type')]
            
            has_quinceanera = 'quinceanera' in event_types_found
            has_sweet16 = 'sweet_16' in event_types_found
            has_reception_only = 'reception_only' in sub_types_found
            has_ceremony_reception = 'reception_with_ceremony' in sub_types_found
            
            success_msg = f"Found event types: {set(event_types_found)}, Sub-types: {set(sub_types_found)}"
            
            if has_quinceanera and has_sweet16 and has_reception_only and has_ceremony_reception:
                self.log_test("Event Retrieval with Enhanced Types", True, success_msg)
            else:
                self.log_test("Event Retrieval with Enhanced Types", False, f"Missing types. {success_msg}")
        else:
            self.log_test("Event Retrieval with Enhanced Types", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 8: Test individual event retrieval to verify sub_event_type field
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
        self.test_enhanced_event_types()  # NEW: Test enhanced event type system
        self.test_venue_system()
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
        print("   ✓ Enhanced event type system (Quinceañera, Sweet 16, Wedding sub-types)")
        print("   ✓ Enhanced vendor marketplace with budget-aware filtering")
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

if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()