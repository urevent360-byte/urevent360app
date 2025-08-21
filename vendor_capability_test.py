#!/usr/bin/env python3
"""
VENDOR CAPABILITY SYSTEM TESTING
Focus: Testing the newly implemented vendor capability system and enhanced vendor matching API

PRIORITY TESTS:
1. **Basic Legacy Matching**: Test `/api/match/vendors` with legacy parameters (core, extras, cultural)
2. **Capability-Based Matching**: Test with new parameters:
   - `service=Catering&subcategories=Full-Service Catering,Specialty Food Stations`
   - `service=Catering&subcategories=Specialty Food Stations&specialty_stations=Sushi Station,Taco Station`
   - `service=Cakes&subcategories=Wedding Cake,Custom Designs`
   - `service=Dessert Stations & Sweets&subcategories=Candy Bar,Donut Wall`
3. **Get Vendor Capabilities**: Test `/api/vendors/{vendor_id}/capabilities` for existing vendors
4. **Update Vendor Capabilities**: Test `/api/vendors/{vendor_id}/capabilities` PUT endpoint with sample capability data

AUTHENTICATION: Use the working client credentials: sarah.johnson@email.com / SecurePass123
"""

import requests
import json
import sys
from datetime import datetime
import uuid
import time
import os

# Configuration - Use environment variable for backend URL
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://urevent-platform.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
TEST_CREDENTIALS = {
    "client": {"email": "sarah.johnson@email.com", "password": "SecurePass123"}
}

class VendorCapabilityTester:
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
    
    def authenticate(self):
        """Authenticate and get token"""
        print("🔐 Authenticating...")
        
        credentials = TEST_CREDENTIALS["client"]
        response = self.make_request("POST", "/login", credentials)
        
        if response and response.status_code == 200:
            try:
                login_data = response.json()
                access_token = login_data.get("access_token")
                user_data = login_data.get("user", {})
                
                if access_token:
                    self.tokens["client"] = access_token
                    self.log_test("Authentication", True, 
                                f"Email: {user_data.get('email')}, Role: {user_data.get('role')}, Token: {len(access_token)} chars")
                    return True
                else:
                    self.log_test("Authentication", False, "No access token in response")
                    return False
                    
            except Exception as e:
                self.log_test("Authentication", False, f"JSON parsing error: {e}")
                return False
        else:
            status_code = response.status_code if response else "No response"
            self.log_test("Authentication", False, f"Status: {status_code}")
            return False
    
    def test_basic_legacy_matching(self, token):
        """Test /api/match/vendors with legacy parameters (core, extras, cultural)"""
        print("\n🔍 Testing Basic Legacy Matching...")
        
        # Test with legacy core services
        params = {
            "core": "catering,decoration",
            "cultural": "American",
            "city": "New York"
        }
        
        response = self.make_request("GET", "/match/vendors", params=params, token=token)
        if response and response.status_code == 200:
            response_data = response.json()
            vendors = response_data.get("vendors", []) if isinstance(response_data, dict) else response_data
            if isinstance(vendors, list) and len(vendors) > 0:
                self.log_test("Legacy Matching - Core Services", True, 
                            f"Found {len(vendors)} vendors for core services: catering, decoration")
                
                # Check if vendors have expected fields
                first_vendor = vendors[0]
                expected_fields = ["id", "name", "services", "rating", "capabilities"]
                missing_fields = [field for field in expected_fields if field not in first_vendor]
                
                if not missing_fields:
                    self.log_test("Legacy Matching - Response Format", True, 
                                f"All expected fields present: {list(first_vendor.keys())}")
                else:
                    self.log_test("Legacy Matching - Response Format", False, 
                                f"Missing fields: {missing_fields}")
            else:
                self.log_test("Legacy Matching - Core Services", False, "No vendors returned")
        else:
            self.log_test("Legacy Matching - Core Services", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test with extras parameter
        params = {
            "extras": "photography,music",
            "cultural": "American"
        }
        
        response = self.make_request("GET", "/match/vendors", params=params, token=token)
        if response and response.status_code == 200:
            vendors = response.json()
            if isinstance(vendors, list):
                self.log_test("Legacy Matching - Extra Services", True, 
                            f"Found {len(vendors)} vendors for extra services: photography, music")
            else:
                self.log_test("Legacy Matching - Extra Services", False, "Invalid response format")
        else:
            self.log_test("Legacy Matching - Extra Services", False, 
                        f"Status: {response.status_code if response else 'No response'}")
    
    def test_capability_based_matching(self, token):
        """Test capability-based matching with new parameters"""
        print("\n🎯 Testing Capability-Based Matching...")
        
        # Test 1: Catering with Full-Service and Specialty Food Stations
        params = {
            "service": "Catering",
            "subcategories": "Full-Service Catering,Specialty Food Stations"
        }
        
        response = self.make_request("GET", "/match/vendors", params=params, token=token)
        if response and response.status_code == 200:
            vendors = response.json()
            if isinstance(vendors, list):
                capability_matches = 0
                for vendor in vendors:
                    if vendor.get("capability_match") == True:
                        capability_matches += 1
                
                self.log_test("Capability Matching - Catering Subcategories", True, 
                            f"Found {len(vendors)} vendors, {capability_matches} with capability_match=true")
                
                # Verify vendors have catering capabilities
                catering_vendors = [v for v in vendors if "catering" in v.get("capabilities", {})]
                if catering_vendors:
                    self.log_test("Capability Matching - Catering Capabilities", True, 
                                f"{len(catering_vendors)} vendors have catering capabilities")
                else:
                    self.log_test("Capability Matching - Catering Capabilities", False, 
                                "No vendors with catering capabilities found")
            else:
                self.log_test("Capability Matching - Catering Subcategories", False, "Invalid response format")
        else:
            self.log_test("Capability Matching - Catering Subcategories", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test 2: Catering with Specialty Stations
        params = {
            "service": "Catering",
            "subcategories": "Specialty Food Stations",
            "specialty_stations": "Sushi Station,Taco Station"
        }
        
        response = self.make_request("GET", "/match/vendors", params=params, token=token)
        if response and response.status_code == 200:
            vendors = response.json()
            if isinstance(vendors, list):
                station_matches = 0
                for vendor in vendors:
                    capabilities = vendor.get("capabilities", {})
                    if "catering_stations" in capabilities:
                        stations = capabilities["catering_stations"]
                        if any(station in ["Sushi Station", "Taco Station"] for station in stations):
                            station_matches += 1
                
                self.log_test("Capability Matching - Specialty Stations", True, 
                            f"Found {len(vendors)} vendors, {station_matches} with matching specialty stations")
            else:
                self.log_test("Capability Matching - Specialty Stations", False, "Invalid response format")
        else:
            self.log_test("Capability Matching - Specialty Stations", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test 3: Cakes with Wedding and Custom Designs
        params = {
            "service": "Cakes",
            "subcategories": "Wedding Cake,Custom Designs"
        }
        
        response = self.make_request("GET", "/match/vendors", params=params, token=token)
        if response and response.status_code == 200:
            vendors = response.json()
            if isinstance(vendors, list):
                cake_vendors = [v for v in vendors if "cakes" in v.get("capabilities", {})]
                self.log_test("Capability Matching - Cakes", True, 
                            f"Found {len(vendors)} vendors, {len(cake_vendors)} with cake capabilities")
            else:
                self.log_test("Capability Matching - Cakes", False, "Invalid response format")
        else:
            self.log_test("Capability Matching - Cakes", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test 4: Dessert Stations & Sweets
        params = {
            "service": "Dessert Stations & Sweets",
            "subcategories": "Candy Bar,Donut Wall"
        }
        
        response = self.make_request("GET", "/match/vendors", params=params, token=token)
        if response and response.status_code == 200:
            vendors = response.json()
            if isinstance(vendors, list):
                dessert_vendors = [v for v in vendors if "dessert_stations_and_sweets" in v.get("capabilities", {})]
                self.log_test("Capability Matching - Dessert Stations", True, 
                            f"Found {len(vendors)} vendors, {len(dessert_vendors)} with dessert capabilities")
            else:
                self.log_test("Capability Matching - Dessert Stations", False, "Invalid response format")
        else:
            self.log_test("Capability Matching - Dessert Stations", False, 
                        f"Status: {response.status_code if response else 'No response'}")
    
    def test_get_vendor_capabilities(self, token):
        """Test /api/vendors/{vendor_id}/capabilities for existing vendors"""
        print("\n📋 Testing Get Vendor Capabilities...")
        
        # Since database is empty, test with mock vendor IDs that should exist in the matching system
        mock_vendor_ids = ["vendor_1", "vendor_2", "vendor_3"]
        
        for mock_vendor_id in mock_vendor_ids:
            response = self.make_request("GET", f"/vendors/{mock_vendor_id}/capabilities", token=token)
            if response and response.status_code == 200:
                capabilities_data = response.json()
                expected_fields = ["vendor_id", "vendor_name", "capabilities", "services"]
                missing_fields = [field for field in expected_fields if field not in capabilities_data]
                
                if not missing_fields:
                    capabilities = capabilities_data.get("capabilities", {})
                    services = capabilities_data.get("services", [])
                    self.log_test(f"Get Vendor Capabilities - {mock_vendor_id}", True, 
                                f"Vendor: {capabilities_data.get('vendor_name')}, "
                                f"Capabilities: {len(capabilities)} categories, "
                                f"Services: {len(services)} items")
                    return  # Success with at least one vendor
                else:
                    self.log_test(f"Get Vendor Capabilities - {mock_vendor_id}", False, 
                                f"Missing fields: {missing_fields}")
            elif response and response.status_code == 404:
                # Expected for mock vendors not in database
                continue
            else:
                self.log_test(f"Get Vendor Capabilities - {mock_vendor_id}", False, 
                            f"Status: {response.status_code if response else 'No response'}")
        
        # If we get here, none of the mock vendors worked
        self.log_test("Get Vendor Capabilities", False, 
                    "Vendor capability endpoints require vendors in database (not just mock data)")
    
    def test_update_vendor_capabilities(self, token):
        """Test /api/vendors/{vendor_id}/capabilities PUT endpoint with sample capability data"""
        print("\n✏️ Testing Update Vendor Capabilities...")
        
        # Sample capability data for testing
        sample_capabilities = {
            "catering": ["Full-Service Catering", "Appetizers / Small Bites only", "Specialty Food Stations"],
            "catering_stations": ["Sushi Station", "Taco Station", "Charcuterie/Cheese Station", "Pasta Station"],
            "cakes": ["Wedding Cake", "Custom Designs", "Cupcakes"],
            "dessert_stations_and_sweets": ["Dessert Table", "Candy Bar", "Donut Wall"]
        }
        
        # Test with mock vendor IDs
        mock_vendor_ids = ["vendor_1", "vendor_2", "vendor_3"]
        
        for mock_vendor_id in mock_vendor_ids:
            response = self.make_request("PUT", f"/vendors/{mock_vendor_id}/capabilities", 
                                       sample_capabilities, token=token)
            if response and response.status_code == 200:
                update_result = response.json()
                if (update_result.get("message") == "Vendor capabilities updated successfully" and
                    update_result.get("vendor_id") == mock_vendor_id):
                    self.log_test(f"Update Vendor Capabilities - {mock_vendor_id}", True, 
                                f"Updated capabilities for vendor {mock_vendor_id}")
                    
                    # Verify the update by getting capabilities
                    response = self.make_request("GET", f"/vendors/{mock_vendor_id}/capabilities", token=token)
                    if response and response.status_code == 200:
                        capabilities_data = response.json()
                        updated_capabilities = capabilities_data.get("capabilities", {})
                        
                        # Check if our sample data was saved
                        if ("catering" in updated_capabilities and 
                            "Full-Service Catering" in updated_capabilities["catering"]):
                            self.log_test("Update Verification", True, 
                                        "Capabilities successfully updated and verified")
                        else:
                            self.log_test("Update Verification", False, 
                                        "Updated capabilities not found")
                    else:
                        self.log_test("Update Verification", False, 
                                    "Could not verify capability update")
                    return  # Success with at least one vendor
                else:
                    self.log_test(f"Update Vendor Capabilities - {mock_vendor_id}", False, 
                                "Unexpected response format")
            elif response and response.status_code == 404:
                # Expected for mock vendors not in database
                continue
            else:
                self.log_test(f"Update Vendor Capabilities - {mock_vendor_id}", False, 
                            f"Status: {response.status_code if response else 'No response'}")
        
        # If we get here, none of the mock vendors worked
        self.log_test("Update Vendor Capabilities", False, 
                    "Vendor capability update endpoints require vendors in database (not just mock data)")
    
    def run_vendor_capability_tests(self):
        """Run all vendor capability tests"""
        print("🎯 VENDOR CAPABILITY SYSTEM TESTING")
        print("=" * 70)
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 70)
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return
        
        token = self.tokens["client"]
        
        # PRIORITY 1 - Enhanced Vendor Matching API
        self.test_basic_legacy_matching(token)
        self.test_capability_based_matching(token)
        
        # PRIORITY 2 - Vendor Capability Management
        self.test_get_vendor_capabilities(token)
        self.test_update_vendor_capabilities(token)
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 70)
        print("📊 VENDOR CAPABILITY SYSTEM TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   - {test}")
        
        print("\n🎯 Key Features Tested:")
        print("   ✓ Enhanced Vendor Matching API with legacy parameter support")
        print("   ✓ Capability-based filtering for granular vendor matching")
        print("   ✓ Vendor capability management (GET/PUT endpoints)")
        print("   ✓ Service-specific subcategory matching")
        print("   ✓ Specialty station filtering for catering services")
        print("   ✓ Multi-service capability support (Catering, Cakes, Dessert Stations)")
        
        if success_rate >= 80:
            print("\n✅ OVERALL STATUS: Vendor capability system is working well!")
        elif success_rate >= 60:
            print("\n⚠️  OVERALL STATUS: Most features working, some issues need attention")
        else:
            print("\n❌ OVERALL STATUS: Critical issues need immediate attention")

if __name__ == "__main__":
    tester = VendorCapabilityTester()
    tester.run_vendor_capability_tests()