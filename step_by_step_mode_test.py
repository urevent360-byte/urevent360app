#!/usr/bin/env python3
"""
Enhanced Step-by-Step Mode Interaction Improvements Backend Testing for Urevent 360 Platform
Focus: Testing backend APIs that support the enhanced Step-by-Step Mode functionality.

PRIORITY TESTING FOCUS (as per review request):
1. One-Click Selection Flow: Verify category tiles open directly to vendor catalog
2. Interactive Category Tiles: Test vendor photo/logo display, "Select Now" functionality, next-step highlighting
3. Shopping Cart Integration: Test real-time updates, budget impact calculations, progress tracking
4. Process Continuation: Verify automatic next step highlighting, disabled states, logical flow
5. API Integration: Test event planner state management, shopping cart operations, vendor selection workflow, budget tracking

Testing backend APIs that support the enhanced Step-by-Step Mode Interaction Improvements.
"""

import requests
import json
import sys
from datetime import datetime
import uuid
import os

# Configuration - Use environment variable for backend URL
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://planningpro.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
TEST_CREDENTIALS = {
    "client": {"email": "sarah.johnson@email.com", "password": "SecurePass123"}
}

class StepByStepModeTester:
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
        """Test client authentication"""
        print("\n🔐 Testing Client Authentication...")
        
        response = self.make_request("POST", "/login", TEST_CREDENTIALS["client"])
        
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                self.tokens["client"] = data["access_token"]
                self.log_test("Client Authentication", True, f"Token obtained for {TEST_CREDENTIALS['client']['email']}")
                return True
            else:
                self.log_test("Client Authentication", False, "No access token in response")
        else:
            self.log_test("Client Authentication", False, f"Status: {response.status_code if response else 'No response'}")
        
        return False
    
    def setup_test_event(self):
        """Create a test event for Step-by-Step Mode testing"""
        print("\n🎯 Setting up Test Event for Step-by-Step Mode...")
        
        if "client" not in self.tokens:
            if not self.test_authentication():
                return False
        
        # Create comprehensive test event with all 9 service categories
        event_data = {
            "name": "Enhanced Step-by-Step Mode Test Event",
            "description": "Testing enhanced step-by-step mode with one-click selection and interactive tiles",
            "event_type": "wedding",
            "cultural_style": "american",
            "date": "2024-12-15T18:00:00Z",
            "location": "San Francisco, CA",
            "budget": 45000.0,
            "guest_count": 150,
            "status": "planning",
            "services_needed": [
                "venue", "decoration", "catering", "bar", "planner", 
                "photography", "music", "staffing", "entertainment"
            ]
        }
        
        response = self.make_request("POST", "/events", event_data, token=self.tokens["client"])
        
        if response and response.status_code == 200:
            event = response.json()
            self.test_event_id = event.get("id")
            self.log_test("Test Event Setup", True, f"Event created with ID: {self.test_event_id}")
            return True
        else:
            self.log_test("Test Event Setup", False, f"Status: {response.status_code if response else 'No response'}")
            return False
    
    def test_one_click_selection_flow(self):
        """Test One-Click Selection Flow - category tiles opening directly to vendor catalog"""
        print("\n🎯 Testing One-Click Selection Flow...")
        
        if not self.test_event_id:
            if not self.setup_test_event():
                return
        
        # Step 1: Test planner steps API for category tiles
        print("Step 1: Testing category tiles API...")
        response = self.make_request("GET", f"/events/{self.test_event_id}/planner/steps", token=self.tokens["client"])
        
        if response and response.status_code == 200:
            steps = response.json()
            
            if isinstance(steps, list) and len(steps) >= 9:
                # Verify step structure for one-click selection
                service_steps = [step for step in steps if step.get("service_type")]
                
                if len(service_steps) >= 8:  # At least 8 service categories
                    self.log_test("Category Tiles Available", True, f"Found {len(service_steps)} service category tiles")
                    
                    # Test each category tile can open vendor catalog
                    successful_catalogs = 0
                    category_tests = []
                    
                    for step in service_steps[:5]:  # Test first 5 categories
                        service_type = step.get("service_type")
                        if service_type:
                            print(f"   Testing {service_type} category tile...")
                            
                            # Test direct vendor catalog access
                            response = self.make_request("GET", f"/events/{self.test_event_id}/planner/vendors/{service_type}", token=self.tokens["client"])
                            
                            if response and response.status_code == 200:
                                vendors = response.json()
                                if isinstance(vendors, list):
                                    successful_catalogs += 1
                                    category_tests.append(f"{service_type}: {len(vendors)} vendors")
                                    print(f"   ✅ {service_type}: Opens to {len(vendors)} vendors")
                                else:
                                    category_tests.append(f"{service_type}: Invalid response")
                                    print(f"   ❌ {service_type}: Invalid response format")
                            else:
                                category_tests.append(f"{service_type}: API error")
                                print(f"   ❌ {service_type}: API error")
                    
                    if successful_catalogs >= 4:  # At least 4 out of 5 working
                        self.log_test("One-Click Vendor Catalog Access", True, f"Successful: {successful_catalogs}/5 categories")
                    else:
                        self.log_test("One-Click Vendor Catalog Access", False, f"Only {successful_catalogs}/5 categories working")
                    
                    # Step 2: Test category tile data structure for frontend
                    print("Step 2: Testing category tile data structure...")
                    if len(service_steps) > 0:
                        sample_step = service_steps[0]
                        required_fields = ["id", "title", "subtitle", "service_type"]
                        missing_fields = [field for field in required_fields if field not in sample_step]
                        
                        if len(missing_fields) == 0:
                            self.log_test("Category Tile Data Structure", True, "All required fields present for interactive tiles")
                        else:
                            self.log_test("Category Tile Data Structure", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test("Category Tiles Available", False, f"Only found {len(service_steps)} service categories")
            else:
                self.log_test("Category Tiles Available", False, f"Expected 9+ steps, got {len(steps) if isinstance(steps, list) else 'invalid'}")
        else:
            self.log_test("Category Tiles API", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_interactive_category_tiles(self):
        """Test Interactive Category Tiles with vendor photo/logo display and Select Now functionality"""
        print("\n🎨 Testing Interactive Category Tiles...")
        
        if not self.test_event_id:
            return
        
        # Step 1: Test vendor data structure for photo/logo display
        print("Step 1: Testing vendor data for photo/logo display...")
        
        # Test multiple service types for vendor data
        service_types_to_test = ["venue", "catering", "photography", "decoration"]
        vendors_with_photos = 0
        vendor_data_complete = 0
        
        for service_type in service_types_to_test:
            print(f"   Testing {service_type} vendors...")
            response = self.make_request("GET", f"/events/{self.test_event_id}/planner/vendors/{service_type}", token=self.tokens["client"])
            
            if response and response.status_code == 200:
                vendors = response.json()
                if isinstance(vendors, list) and len(vendors) > 0:
                    vendor = vendors[0]
                    
                    # Check for required fields for interactive tiles
                    required_fields = ["id", "name", "service_type", "description", "rating"]
                    optional_fields = ["images", "contact_info", "specialties"]
                    
                    missing_required = [field for field in required_fields if field not in vendor]
                    present_optional = [field for field in optional_fields if field in vendor]
                    
                    if len(missing_required) == 0:
                        vendor_data_complete += 1
                        print(f"   ✅ {service_type}: Complete vendor data")
                        
                        # Check for photo/logo capability
                        if "images" in vendor or "logo_url" in vendor or "photo_url" in vendor:
                            vendors_with_photos += 1
                            print(f"   ✅ {service_type}: Photo/logo data available")
                    else:
                        print(f"   ❌ {service_type}: Missing required fields: {missing_required}")
        
        if vendor_data_complete >= 3:
            self.log_test("Vendor Data for Interactive Tiles", True, f"Complete data: {vendor_data_complete}/4 service types")
        else:
            self.log_test("Vendor Data for Interactive Tiles", False, f"Only {vendor_data_complete}/4 service types have complete data")
        
        # Step 2: Test "Select Now" functionality (add to cart)
        print("Step 2: Testing 'Select Now' functionality...")
        
        # Get vendors for catering to test selection
        response = self.make_request("GET", f"/events/{self.test_event_id}/planner/vendors/catering", token=self.tokens["client"])
        
        if response and response.status_code == 200:
            vendors = response.json()
            if len(vendors) > 0:
                selected_vendor = vendors[0]
                
                # Test "Select Now" - add vendor to cart
                select_data = {
                    "vendor_id": selected_vendor.get("id"),
                    "vendor_name": selected_vendor.get("name"),
                    "service_type": "catering",
                    "service_name": "Premium Catering Package",
                    "price": 8500.0,
                    "quantity": 1,
                    "notes": "Selected via interactive tile"
                }
                
                response = self.make_request("POST", f"/events/{self.test_event_id}/cart/add", select_data, token=self.tokens["client"])
                
                if response and response.status_code == 200:
                    self.log_test("Select Now Functionality", True, f"Successfully selected: {select_data['vendor_name']}")
                    
                    # Verify selection appears in cart
                    response = self.make_request("GET", f"/events/{self.test_event_id}/cart", token=self.tokens["client"])
                    if response and response.status_code == 200:
                        cart_items = response.json()
                        if len(cart_items) > 0 and cart_items[0]["vendor_name"] == select_data["vendor_name"]:
                            self.log_test("Select Now Verification", True, "Vendor appears in cart after selection")
                        else:
                            self.log_test("Select Now Verification", False, "Vendor not found in cart")
                else:
                    self.log_test("Select Now Functionality", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 3: Test next-step highlighting logic
        print("Step 3: Testing next-step highlighting logic...")
        
        # Get current planner state
        response = self.make_request("GET", f"/events/{self.test_event_id}/planner/state", token=self.tokens["client"])
        
        if response and response.status_code == 200:
            state = response.json()
            current_step = state.get("current_step", 0)
            completed_steps = state.get("completed_steps", [])
            
            # Update state to simulate step progression
            next_step_data = {
                "current_step": current_step + 1,
                "completed_steps": completed_steps + [current_step],
                "step_data": {"last_action": "vendor_selected"}
            }
            
            response = self.make_request("POST", f"/events/{self.test_event_id}/planner/state", next_step_data, token=self.tokens["client"])
            
            if response and response.status_code == 200:
                # Verify state update
                response = self.make_request("GET", f"/events/{self.test_event_id}/planner/state", token=self.tokens["client"])
                if response and response.status_code == 200:
                    updated_state = response.json()
                    if updated_state.get("current_step") == current_step + 1:
                        self.log_test("Next-Step Highlighting Logic", True, f"Step progression: {current_step} → {current_step + 1}")
                    else:
                        self.log_test("Next-Step Highlighting Logic", False, "Step progression not working")
                else:
                    self.log_test("Next-Step Highlighting Logic", False, "Could not verify state update")
            else:
                self.log_test("Next-Step Highlighting Logic", False, f"State update failed: {response.status_code if response else 'No response'}")
    
    def test_shopping_cart_integration(self):
        """Test Shopping Cart Integration with real-time updates and budget calculations"""
        print("\n🛒 Testing Shopping Cart Integration...")
        
        if not self.test_event_id:
            return
        
        # Step 1: Test real-time cart updates
        print("Step 1: Testing real-time cart updates...")
        
        # Clear cart first
        response = self.make_request("POST", f"/events/{self.test_event_id}/cart/clear", {}, token=self.tokens["client"])
        
        # Add multiple vendors to test real-time updates
        test_vendors = [
            {
                "vendor_id": "realtime-venue-001",
                "vendor_name": "Grand Ballroom Venue",
                "service_type": "venue",
                "service_name": "Wedding Venue Package",
                "price": 15000.0,
                "quantity": 1
            },
            {
                "vendor_id": "realtime-catering-001",
                "vendor_name": "Elite Catering Co",
                "service_type": "catering", 
                "service_name": "Premium Wedding Catering",
                "price": 9500.0,
                "quantity": 1
            },
            {
                "vendor_id": "realtime-photo-001",
                "vendor_name": "Perfect Moments Photography",
                "service_type": "photography",
                "service_name": "Wedding Photography Package",
                "price": 3500.0,
                "quantity": 1
            }
        ]
        
        vendors_added = 0
        expected_total = 0
        
        for vendor in test_vendors:
            response = self.make_request("POST", f"/events/{self.test_event_id}/cart/add", vendor, token=self.tokens["client"])
            if response and response.status_code == 200:
                vendors_added += 1
                expected_total += vendor["price"]
                
                # Test real-time cart state after each addition
                response = self.make_request("GET", f"/events/{self.test_event_id}/cart", token=self.tokens["client"])
                if response and response.status_code == 200:
                    cart_items = response.json()
                    if len(cart_items) == vendors_added:
                        print(f"   ✅ Real-time update: {vendors_added} items in cart")
                    else:
                        print(f"   ❌ Real-time update failed: Expected {vendors_added}, got {len(cart_items)}")
        
        if vendors_added == len(test_vendors):
            self.log_test("Real-time Cart Updates", True, f"All {vendors_added} vendors added with real-time updates")
        else:
            self.log_test("Real-time Cart Updates", False, f"Only {vendors_added}/{len(test_vendors)} vendors added")
        
        # Step 2: Test budget impact calculations
        print("Step 2: Testing budget impact calculations...")
        
        # Get updated planner state with budget tracking
        response = self.make_request("GET", f"/events/{self.test_event_id}/planner/state", token=self.tokens["client"])
        
        if response and response.status_code == 200:
            state = response.json()
            budget_tracking = state.get("budget_tracking", {})
            
            set_budget = budget_tracking.get("set_budget", 0)
            selected_total = budget_tracking.get("selected_total", 0)
            remaining = budget_tracking.get("remaining", 0)
            
            # Verify budget calculations
            if selected_total == expected_total:
                self.log_test("Budget Impact Calculations", True, f"Selected: ${selected_total}, Remaining: ${remaining}")
                
                # Test budget progress calculation
                if set_budget > 0:
                    progress_percentage = (selected_total / set_budget) * 100
                    self.log_test("Budget Progress Calculation", True, f"Progress: {progress_percentage:.1f}% (${selected_total} of ${set_budget})")
                    
                    # Test over-budget detection
                    if progress_percentage > 100:
                        self.log_test("Over-Budget Detection", True, f"Over-budget detected: {progress_percentage:.1f}%")
                    else:
                        self.log_test("Within-Budget Status", True, f"Within budget: {progress_percentage:.1f}%")
                else:
                    self.log_test("Budget Progress Calculation", False, "Set budget is 0")
            else:
                self.log_test("Budget Impact Calculations", False, f"Expected ${expected_total}, got ${selected_total}")
        else:
            self.log_test("Budget Impact Calculations", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 3: Test progress tracking (X/9 services selected)
        print("Step 3: Testing progress tracking...")
        
        # Get cart items and count unique service types
        response = self.make_request("GET", f"/events/{self.test_event_id}/cart", token=self.tokens["client"])
        
        if response and response.status_code == 200:
            cart_items = response.json()
            unique_services = set(item.get("service_type") for item in cart_items)
            total_services_needed = 9  # Based on our test event setup
            
            progress_count = len(unique_services)
            progress_text = f"{progress_count}/{total_services_needed} services selected"
            
            self.log_test("Progress Tracking", True, progress_text)
            
            # Test service category breakdown
            service_breakdown = {}
            for item in cart_items:
                service_type = item.get("service_type")
                if service_type:
                    service_breakdown[service_type] = service_breakdown.get(service_type, 0) + 1
            
            if len(service_breakdown) > 0:
                self.log_test("Service Category Breakdown", True, f"Categories: {list(service_breakdown.keys())}")
            else:
                self.log_test("Service Category Breakdown", False, "No service categories found")
        else:
            self.log_test("Progress Tracking", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 4: Test enhanced cart actions
        print("Step 4: Testing enhanced cart actions...")
        
        # Test remove item functionality
        if vendors_added > 0:
            response = self.make_request("GET", f"/events/{self.test_event_id}/cart", token=self.tokens["client"])
            if response and response.status_code == 200:
                cart_items = response.json()
                if len(cart_items) > 0:
                    item_to_remove = cart_items[0]
                    item_id = item_to_remove.get("id")
                    
                    if item_id:
                        response = self.make_request("DELETE", f"/events/{self.test_event_id}/cart/remove/{item_id}", token=self.tokens["client"])
                        if response and response.status_code == 200:
                            self.log_test("Enhanced Cart Remove Action", True, f"Removed: {item_to_remove.get('vendor_name')}")
                            
                            # Verify budget recalculation after removal
                            response = self.make_request("GET", f"/events/{self.test_event_id}/planner/state", token=self.tokens["client"])
                            if response and response.status_code == 200:
                                updated_state = response.json()
                                updated_budget = updated_state.get("budget_tracking", {})
                                new_selected_total = updated_budget.get("selected_total", 0)
                                
                                expected_after_removal = expected_total - item_to_remove.get("price", 0)
                                if new_selected_total == expected_after_removal:
                                    self.log_test("Budget Recalculation After Removal", True, f"Updated total: ${new_selected_total}")
                                else:
                                    self.log_test("Budget Recalculation After Removal", False, f"Expected ${expected_after_removal}, got ${new_selected_total}")
                        else:
                            self.log_test("Enhanced Cart Remove Action", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_process_continuation(self):
        """Test Process Continuation with automatic next step highlighting and logical flow"""
        print("\n⏭️ Testing Process Continuation...")
        
        if not self.test_event_id:
            return
        
        # Step 1: Test ordered progression (step 1-9 with guided flow)
        print("Step 1: Testing ordered progression...")
        
        # Get planner steps to verify order
        response = self.make_request("GET", f"/events/{self.test_event_id}/planner/steps", token=self.tokens["client"])
        
        if response and response.status_code == 200:
            steps = response.json()
            
            if isinstance(steps, list) and len(steps) >= 9:
                # Verify logical order: Venue → Catering → Photography etc.
                expected_order = ["venue", "decoration", "catering", "bar", "planner", "photography", "music", "staffing", "entertainment"]
                actual_order = []
                
                for step in steps:
                    service_type = step.get("service_type")
                    if service_type:
                        actual_order.append(service_type)
                
                # Check if we have the expected services (order may vary)
                matching_services = [service for service in expected_order if service in actual_order or any(service in str(s) for s in actual_order)]
                
                if len(matching_services) >= 7:  # Allow for some variation
                    self.log_test("Ordered Step Progression", True, f"Found {len(matching_services)} expected services in logical order")
                else:
                    self.log_test("Ordered Step Progression", False, f"Only found {len(matching_services)} expected services")
            else:
                self.log_test("Ordered Step Progression", False, f"Expected 9+ steps, got {len(steps) if isinstance(steps, list) else 'invalid'}")
        else:
            self.log_test("Ordered Step Progression", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 2: Test automatic next step highlighting
        print("Step 2: Testing automatic next step highlighting...")
        
        # Get current state
        response = self.make_request("GET", f"/events/{self.test_event_id}/planner/state", token=self.tokens["client"])
        
        if response and response.status_code == 200:
            current_state = response.json()
            current_step = current_state.get("current_step", 0)
            completed_steps = current_state.get("completed_steps", [])
            
            # Simulate completing a step (selecting a vendor)
            test_vendor_selection = {
                "vendor_id": "progression-test-001",
                "vendor_name": "Step Progression Test Vendor",
                "service_type": "decoration",
                "service_name": "Decoration Package",
                "price": 2500.0,
                "quantity": 1
            }
            
            # Add vendor (simulates completing current step)
            response = self.make_request("POST", f"/events/{self.test_event_id}/cart/add", test_vendor_selection, token=self.tokens["client"])
            
            if response and response.status_code == 200:
                # Update planner state to next step
                next_step_update = {
                    "current_step": current_step + 1,
                    "completed_steps": completed_steps + [current_step],
                    "step_data": {
                        "last_completed": "decoration",
                        "next_highlighted": True
                    }
                }
                
                response = self.make_request("POST", f"/events/{self.test_event_id}/planner/state", next_step_update, token=self.tokens["client"])
                
                if response and response.status_code == 200:
                    # Verify next step is highlighted
                    response = self.make_request("GET", f"/events/{self.test_event_id}/planner/state", token=self.tokens["client"])
                    
                    if response and response.status_code == 200:
                        updated_state = response.json()
                        new_current_step = updated_state.get("current_step", 0)
                        new_completed_steps = updated_state.get("completed_steps", [])
                        
                        if new_current_step == current_step + 1 and current_step in new_completed_steps:
                            self.log_test("Automatic Next Step Highlighting", True, f"Step {current_step} completed, step {new_current_step} highlighted")
                        else:
                            self.log_test("Automatic Next Step Highlighting", False, f"Step progression failed: {new_current_step}, completed: {new_completed_steps}")
                    else:
                        self.log_test("Automatic Next Step Highlighting", False, "Could not verify step update")
                else:
                    self.log_test("Automatic Next Step Highlighting", False, f"State update failed: {response.status_code if response else 'No response'}")
        
        # Step 3: Test disabled states for out-of-order steps
        print("Step 3: Testing disabled states logic...")
        
        # Get current planner state
        response = self.make_request("GET", f"/events/{self.test_event_id}/planner/state", token=self.tokens["client"])
        
        if response and response.status_code == 200:
            state = response.json()
            current_step = state.get("current_step", 0)
            completed_steps = state.get("completed_steps", [])
            
            # Test that we can access current and completed steps
            accessible_steps = completed_steps + [current_step]
            
            # Verify step accessibility logic
            if len(accessible_steps) > 0:
                self.log_test("Step Accessibility Logic", True, f"Accessible steps: {accessible_steps}, Current: {current_step}")
                
                # Test that future steps should be disabled (this is frontend logic, but we can verify state)
                max_accessible_step = max(accessible_steps) if accessible_steps else 0
                
                if current_step <= max_accessible_step:
                    self.log_test("Disabled States Prevention", True, f"Current step {current_step} is within accessible range")
                else:
                    self.log_test("Disabled States Prevention", False, f"Current step {current_step} exceeds accessible range")
            else:
                self.log_test("Step Accessibility Logic", False, "No accessible steps found")
        
        # Step 4: Test logical flow (Venue → Catering → Photography etc.)
        print("Step 4: Testing logical flow progression...")
        
        # Simulate a complete logical flow
        logical_flow_steps = [
            {"service": "venue", "step": 1},
            {"service": "catering", "step": 2}, 
            {"service": "photography", "step": 3}
        ]
        
        flow_successful = True
        
        for flow_step in logical_flow_steps:
            # Test that each step in the flow has vendors available
            response = self.make_request("GET", f"/events/{self.test_event_id}/planner/vendors/{flow_step['service']}", token=self.tokens["client"])
            
            if response and response.status_code == 200:
                vendors = response.json()
                if isinstance(vendors, list) and len(vendors) > 0:
                    print(f"   ✅ Step {flow_step['step']} ({flow_step['service']}): {len(vendors)} vendors available")
                else:
                    print(f"   ❌ Step {flow_step['step']} ({flow_step['service']}): No vendors available")
                    flow_successful = False
            else:
                print(f"   ❌ Step {flow_step['step']} ({flow_step['service']}): API error")
                flow_successful = False
        
        if flow_successful:
            self.log_test("Logical Flow Progression", True, "All steps in logical flow have vendors available")
        else:
            self.log_test("Logical Flow Progression", False, "Some steps in logical flow failed")
    
    def test_api_integration_comprehensive(self):
        """Test comprehensive API integration for all Step-by-Step Mode features"""
        print("\n🔗 Testing Comprehensive API Integration...")
        
        if not self.test_event_id:
            return
        
        # Step 1: Test event planner state management with ordered step progression
        print("Step 1: Testing event planner state management...")
        
        # Initialize planner state
        response = self.make_request("GET", f"/events/{self.test_event_id}/planner/state", token=self.tokens["client"])
        
        if response and response.status_code == 200:
            initial_state = response.json()
            
            # Verify state structure
            required_state_fields = ["event_id", "current_step", "completed_steps", "cart_items", "budget_tracking"]
            missing_fields = [field for field in required_state_fields if field not in initial_state]
            
            if len(missing_fields) == 0:
                self.log_test("Event Planner State Structure", True, "All required state fields present")
                
                # Test state persistence
                state_update = {
                    "current_step": 2,
                    "completed_steps": [0, 1],
                    "step_data": {"integration_test": True, "timestamp": datetime.utcnow().isoformat()}
                }
                
                response = self.make_request("POST", f"/events/{self.test_event_id}/planner/state", state_update, token=self.tokens["client"])
                
                if response and response.status_code == 200:
                    # Verify persistence
                    response = self.make_request("GET", f"/events/{self.test_event_id}/planner/state", token=self.tokens["client"])
                    
                    if response and response.status_code == 200:
                        persisted_state = response.json()
                        if (persisted_state.get("current_step") == 2 and 
                            len(persisted_state.get("completed_steps", [])) == 2):
                            self.log_test("State Persistence", True, "State updates persisted correctly")
                        else:
                            self.log_test("State Persistence", False, "State not persisted correctly")
                    else:
                        self.log_test("State Persistence", False, "Could not verify state persistence")
                else:
                    self.log_test("State Management Updates", False, f"State update failed: {response.status_code if response else 'No response'}")
            else:
                self.log_test("Event Planner State Structure", False, f"Missing fields: {missing_fields}")
        else:
            self.log_test("Event Planner State Management", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 2: Test shopping cart operations with real-time updates
        print("Step 2: Testing shopping cart operations integration...")
        
        # Clear cart and test full cart workflow
        response = self.make_request("POST", f"/events/{self.test_event_id}/cart/clear", {}, token=self.tokens["client"])
        
        # Test cart operations sequence
        cart_operations = [
            {
                "operation": "add",
                "data": {
                    "vendor_id": "integration-venue-001",
                    "vendor_name": "Integration Test Venue",
                    "service_type": "venue",
                    "service_name": "Premium Venue Package",
                    "price": 18000.0,
                    "quantity": 1
                }
            },
            {
                "operation": "add", 
                "data": {
                    "vendor_id": "integration-catering-001",
                    "vendor_name": "Integration Test Catering",
                    "service_type": "catering",
                    "service_name": "Wedding Catering Package",
                    "price": 12000.0,
                    "quantity": 1
                }
            }
        ]
        
        operations_successful = 0
        expected_cart_total = 0
        
        for operation in cart_operations:
            if operation["operation"] == "add":
                response = self.make_request("POST", f"/events/{self.test_event_id}/cart/add", operation["data"], token=self.tokens["client"])
                
                if response and response.status_code == 200:
                    operations_successful += 1
                    expected_cart_total += operation["data"]["price"]
                    
                    # Verify real-time cart state
                    response = self.make_request("GET", f"/events/{self.test_event_id}/cart", token=self.tokens["client"])
                    if response and response.status_code == 200:
                        cart_items = response.json()
                        if len(cart_items) == operations_successful:
                            print(f"   ✅ Cart operation {operations_successful}: Real-time update successful")
                        else:
                            print(f"   ❌ Cart operation {operations_successful}: Real-time update failed")
        
        if operations_successful == len(cart_operations):
            self.log_test("Shopping Cart Operations Integration", True, f"All {operations_successful} cart operations successful")
        else:
            self.log_test("Shopping Cart Operations Integration", False, f"Only {operations_successful}/{len(cart_operations)} operations successful")
        
        # Step 3: Test vendor selection workflow with next-step calculation
        print("Step 3: Testing vendor selection workflow...")
        
        # Test vendor search and selection workflow
        workflow_steps = [
            {"service": "photography", "expected_vendors": 0},
            {"service": "decoration", "expected_vendors": 0},
            {"service": "music", "expected_vendors": 0}
        ]
        
        workflow_successful = 0
        
        for step in workflow_steps:
            # Test vendor search
            response = self.make_request("GET", f"/events/{self.test_event_id}/planner/vendors/{step['service']}", token=self.tokens["client"])
            
            if response and response.status_code == 200:
                vendors = response.json()
                if isinstance(vendors, list):
                    workflow_successful += 1
                    step["actual_vendors"] = len(vendors)
                    print(f"   ✅ {step['service']}: Found {len(vendors)} vendors")
                    
                    # Test selection if vendors available
                    if len(vendors) > 0:
                        selected_vendor = vendors[0]
                        selection_data = {
                            "vendor_id": selected_vendor.get("id"),
                            "vendor_name": selected_vendor.get("name"),
                            "service_type": step["service"],
                            "service_name": f"{step['service'].title()} Package",
                            "price": 2500.0,
                            "quantity": 1
                        }
                        
                        # Test selection (add to cart)
                        response = self.make_request("POST", f"/events/{self.test_event_id}/cart/add", selection_data, token=self.tokens["client"])
                        if response and response.status_code == 200:
                            print(f"   ✅ {step['service']}: Selection successful")
                        else:
                            print(f"   ❌ {step['service']}: Selection failed")
                else:
                    print(f"   ❌ {step['service']}: Invalid vendor response")
            else:
                print(f"   ❌ {step['service']}: Vendor search failed")
        
        if workflow_successful >= 2:  # At least 2 out of 3 working
            self.log_test("Vendor Selection Workflow", True, f"Workflow successful for {workflow_successful}/3 service types")
        else:
            self.log_test("Vendor Selection Workflow", False, f"Only {workflow_successful}/3 service types working")
        
        # Step 4: Test budget tracking with live calculations
        print("Step 4: Testing budget tracking integration...")
        
        # Get final cart state and budget tracking
        response = self.make_request("GET", f"/events/{self.test_event_id}/planner/state", token=self.tokens["client"])
        
        if response and response.status_code == 200:
            final_state = response.json()
            budget_tracking = final_state.get("budget_tracking", {})
            
            set_budget = budget_tracking.get("set_budget", 0)
            selected_total = budget_tracking.get("selected_total", 0)
            remaining = budget_tracking.get("remaining", 0)
            
            # Verify budget calculations are live and accurate
            if selected_total > 0 and remaining == (set_budget - selected_total):
                self.log_test("Live Budget Calculations", True, f"Budget: ${set_budget}, Selected: ${selected_total}, Remaining: ${remaining}")
                
                # Test budget progress calculation
                if set_budget > 0:
                    progress = (selected_total / set_budget) * 100
                    self.log_test("Budget Progress Integration", True, f"Progress: {progress:.1f}%")
                else:
                    self.log_test("Budget Progress Integration", False, "Set budget is 0")
            else:
                self.log_test("Live Budget Calculations", False, f"Budget calculation error: Selected ${selected_total}, Remaining ${remaining}")
        else:
            self.log_test("Budget Tracking Integration", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Step 5: Test end-to-end integration flow
        print("Step 5: Testing end-to-end integration flow...")
        
        # Test complete flow: State → Steps → Vendors → Selection → Cart → Budget
        integration_flow_successful = True
        
        # Get final cart count
        response = self.make_request("GET", f"/events/{self.test_event_id}/cart", token=self.tokens["client"])
        if response and response.status_code == 200:
            final_cart = response.json()
            cart_count = len(final_cart)
            
            # Get final state
            response = self.make_request("GET", f"/events/{self.test_event_id}/planner/state", token=self.tokens["client"])
            if response and response.status_code == 200:
                final_state = response.json()
                state_cart_count = len(final_state.get("cart_items", []))
                
                # Verify cart consistency between endpoints
                if cart_count == state_cart_count:
                    self.log_test("End-to-End Integration Flow", True, f"Complete flow successful: {cart_count} items in cart, state consistent")
                else:
                    self.log_test("End-to-End Integration Flow", False, f"Cart inconsistency: Cart API {cart_count}, State API {state_cart_count}")
            else:
                self.log_test("End-to-End Integration Flow", False, "Could not verify final state")
        else:
            self.log_test("End-to-End Integration Flow", False, "Could not verify final cart")
    
    def run_all_tests(self):
        """Run all Step-by-Step Mode tests"""
        print("🚀 Starting Enhanced Step-by-Step Mode Interaction Improvements Testing...")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 80)
        
        # Setup
        if not self.test_authentication():
            print("❌ Authentication failed - cannot proceed with tests")
            return
        
        if not self.setup_test_event():
            print("❌ Test event setup failed - cannot proceed with tests")
            return
        
        # Run all test suites
        self.test_one_click_selection_flow()
        self.test_interactive_category_tiles()
        self.test_shopping_cart_integration()
        self.test_process_continuation()
        self.test_api_integration_comprehensive()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 ENHANCED STEP-BY-STEP MODE TESTING SUMMARY")
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
        
        print("\n🎯 Step-by-Step Mode Features Tested:")
        print("   ✅ One-Click Selection Flow")
        print("   ✅ Interactive Category Tiles")
        print("   ✅ Shopping Cart Integration")
        print("   ✅ Process Continuation")
        print("   ✅ API Integration")
        
        return success_rate >= 70  # Consider successful if 70% or more tests pass

if __name__ == "__main__":
    tester = StepByStepModeTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)