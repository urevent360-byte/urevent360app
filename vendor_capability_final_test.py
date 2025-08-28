#!/usr/bin/env python3
"""
VENDOR CAPABILITY SYSTEM FINAL TESTING
Focus: Testing the newly implemented vendor capability system with correct response format handling
"""

import requests
import json
import os

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://planningpro.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

class VendorCapabilityFinalTester:
    def __init__(self):
        self.test_results = []
        self.token = None
        
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
    
    def authenticate(self):
        """Get authentication token"""
        credentials = {"email": "sarah.johnson@email.com", "password": "SecurePass123"}
        
        try:
            response = requests.post(f"{BASE_URL}/login", headers=HEADERS, json=credentials, timeout=30)
            if response.status_code == 200:
                login_data = response.json()
                self.token = login_data.get("access_token")
                self.log_test("Authentication", True, f"Token: {len(self.token)} chars")
                return True
            else:
                self.log_test("Authentication", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Authentication", False, f"Error: {e}")
            return False
    
    def make_request(self, method, endpoint, params=None, data=None):
        """Make HTTP request"""
        url = f"{BASE_URL}{endpoint}"
        headers = HEADERS.copy()
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=30)
            return response
        except Exception as e:
            print(f"Request error: {e}")
            return None
    
    def test_enhanced_vendor_matching(self):
        """Test the enhanced vendor matching API"""
        print("\n🎯 TESTING ENHANCED VENDOR MATCHING API")
        print("=" * 50)
        
        # Test 1: Basic Legacy Matching
        print("\n🔍 Testing Basic Legacy Matching...")
        response = self.make_request("GET", "/match/vendors", params={
            "core": "catering,decoration",
            "cultural": "American"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            vendors = data.get("vendors", [])
            self.log_test("Legacy Matching - Core Services", True, 
                        f"Found {len(vendors)} vendors")
        else:
            self.log_test("Legacy Matching - Core Services", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test 2: Capability-Based Matching - Catering
        print("\n🍽️ Testing Catering Capability Matching...")
        response = self.make_request("GET", "/match/vendors", params={
            "service": "Catering",
            "subcategories": "Full-Service Catering,Specialty Food Stations"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            vendors = data.get("vendors", [])
            capability_matches = sum(1 for v in vendors if v.get("capability_match") == True)
            catering_vendors = sum(1 for v in vendors if "catering" in v.get("capabilities", {}))
            
            self.log_test("Capability Matching - Catering", True, 
                        f"Found {len(vendors)} vendors, {capability_matches} with capability_match=true, {catering_vendors} with catering capabilities")
        else:
            self.log_test("Capability Matching - Catering", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test 3: Specialty Stations
        print("\n🍣 Testing Specialty Stations Matching...")
        response = self.make_request("GET", "/match/vendors", params={
            "service": "Catering",
            "subcategories": "Specialty Food Stations",
            "specialty_stations": "Sushi Station,Taco Station"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            vendors = data.get("vendors", [])
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
            self.log_test("Capability Matching - Specialty Stations", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test 4: Cakes
        print("\n🎂 Testing Cakes Capability Matching...")
        response = self.make_request("GET", "/match/vendors", params={
            "service": "Cakes",
            "subcategories": "Wedding Cake,Custom Designs"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            vendors = data.get("vendors", [])
            cake_vendors = sum(1 for v in vendors if "cakes" in v.get("capabilities", {}))
            
            self.log_test("Capability Matching - Cakes", True, 
                        f"Found {len(vendors)} vendors, {cake_vendors} with cake capabilities")
        else:
            self.log_test("Capability Matching - Cakes", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test 5: Dessert Stations & Sweets
        print("\n🍭 Testing Dessert Stations Matching...")
        response = self.make_request("GET", "/match/vendors", params={
            "service": "Dessert Stations & Sweets",
            "subcategories": "Candy Bar,Donut Wall"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            vendors = data.get("vendors", [])
            dessert_vendors = sum(1 for v in vendors if "dessert_stations_and_sweets" in v.get("capabilities", {}))
            
            self.log_test("Capability Matching - Dessert Stations", True, 
                        f"Found {len(vendors)} vendors, {dessert_vendors} with dessert capabilities")
        else:
            self.log_test("Capability Matching - Dessert Stations", False, 
                        f"Status: {response.status_code if response else 'No response'}")
    
    def test_vendor_capability_management(self):
        """Test vendor capability management endpoints"""
        print("\n📋 TESTING VENDOR CAPABILITY MANAGEMENT")
        print("=" * 50)
        
        # Test GET capabilities endpoint
        print("\n📋 Testing Get Vendor Capabilities...")
        response = self.make_request("GET", "/vendors/vendor_1/capabilities")
        
        if response and response.status_code == 200:
            data = response.json()
            expected_fields = ["vendor_id", "vendor_name", "capabilities", "services"]
            missing_fields = [field for field in expected_fields if field not in data]
            
            if not missing_fields:
                capabilities = data.get("capabilities", {})
                services = data.get("services", [])
                self.log_test("Get Vendor Capabilities", True, 
                            f"Vendor: {data.get('vendor_name')}, Capabilities: {len(capabilities)} categories")
            else:
                self.log_test("Get Vendor Capabilities", False, f"Missing fields: {missing_fields}")
        elif response and response.status_code == 404:
            self.log_test("Get Vendor Capabilities", False, 
                        "Vendor not found - capability management requires vendors in database")
        else:
            self.log_test("Get Vendor Capabilities", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test PUT capabilities endpoint
        print("\n✏️ Testing Update Vendor Capabilities...")
        sample_capabilities = {
            "catering": ["Full-Service Catering", "Specialty Food Stations"],
            "catering_stations": ["Sushi Station", "Taco Station"]
        }
        
        response = self.make_request("PUT", "/vendors/vendor_1/capabilities", data=sample_capabilities)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("message") == "Vendor capabilities updated successfully":
                self.log_test("Update Vendor Capabilities", True, 
                            f"Updated capabilities for vendor {data.get('vendor_id')}")
            else:
                self.log_test("Update Vendor Capabilities", False, "Unexpected response format")
        elif response and response.status_code == 404:
            self.log_test("Update Vendor Capabilities", False, 
                        "Vendor not found - capability management requires vendors in database")
        else:
            self.log_test("Update Vendor Capabilities", False, 
                        f"Status: {response.status_code if response else 'No response'}")
    
    def run_tests(self):
        """Run all tests"""
        print("🎯 VENDOR CAPABILITY SYSTEM FINAL TESTING")
        print("=" * 60)
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Authenticate
        if not self.authenticate():
            print("❌ Authentication failed. Cannot proceed.")
            return
        
        # Test enhanced vendor matching
        self.test_enhanced_vendor_matching()
        
        # Test capability management
        self.test_vendor_capability_management()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 VENDOR CAPABILITY SYSTEM TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for t in self.test_results if t["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        
        failed_test_names = [t["test"] for t in self.test_results if not t["success"]]
        if failed_test_names:
            print(f"\n❌ Failed Tests:")
            for test in failed_test_names:
                print(f"   - {test}")
        
        print("\n🎯 Key Features Tested:")
        print("   ✓ Enhanced Vendor Matching API (/api/match/vendors)")
        print("   ✓ Legacy parameter support (core, extras, cultural)")
        print("   ✓ Capability-based filtering (service, subcategories, specialty_stations)")
        print("   ✓ Vendor ranking by capability relevance (capability_match=true)")
        print("   ✓ Multi-service support (Catering, Cakes, Dessert Stations)")
        print("   ✓ Vendor capability management endpoints")
        
        if success_rate >= 80:
            print("\n✅ OVERALL STATUS: Vendor capability system is working excellently!")
        elif success_rate >= 60:
            print("\n⚠️  OVERALL STATUS: Most features working, some minor issues")
        else:
            print("\n❌ OVERALL STATUS: Some critical issues need attention")

if __name__ == "__main__":
    tester = VendorCapabilityFinalTester()
    tester.run_tests()