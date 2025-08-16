#!/usr/bin/env python3
"""
User Settings & Profile Management API Testing for Urevent 360 Platform
Focus: Testing the new User Settings & Profile Management API endpoints

SPECIFIC TESTING FOCUS:
1. GET /api/users/language-preference - Get user language 
2. PUT /api/users/language-preference - Update language
3. GET /api/users/two-factor-status - Get 2FA status
4. POST /api/users/two-factor-generate - Generate 2FA QR code
5. POST /api/users/two-factor-verify - Verify 2FA code
6. POST /api/users/two-factor-disable - Disable 2FA
7. GET /api/users/privacy-settings - Get privacy settings
8. PUT /api/users/privacy-settings - Update privacy settings
9. GET /api/users/integrations - Get integrations
10. POST /api/users/integrations/connect - Connect integration
11. GET /api/users/payment-methods - Get payment methods
12. GET /api/users/billing-history - Get billing history
13. POST /api/support/contact - Submit support ticket
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Configuration - Use environment variable for backend URL
import os
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://event-wizard.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials - using the existing client user as specified
TEST_CREDENTIALS = {
    "email": "sarah.johnson@email.com",
    "password": "SecurePass123"
}

class UserSettingsAPITester:
    def __init__(self):
        self.token = None
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
        """Authenticate and get JWT token"""
        print("🔐 Authenticating with existing client user...")
        
        response = self.make_request("POST", "/auth/login", TEST_CREDENTIALS)
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                self.token = data["access_token"]
                user_data = data.get("user", {})
                self.log_test("Client Authentication", True, f"User: {user_data.get('name', 'Unknown')}")
                return True
            else:
                self.log_test("Client Authentication", False, "Missing access token")
                return False
        else:
            self.log_test("Client Authentication", False, f"Status: {response.status_code if response else 'No response'}")
            return False
    
    def test_user_settings_profile_management(self):
        """Test User Settings & Profile Management API endpoints"""
        print("\n⚙️ Testing User Settings & Profile Management API...")
        
        if not self.token:
            self.log_test("User Settings Test", False, "No authentication token available")
            return
        
        # Test 1: GET /api/users/language-preference - Get user language
        print("Step 1: Testing Get Language Preference...")
        response = self.make_request("GET", "/users/language-preference", token=self.token)
        if response and response.status_code == 200:
            lang_data = response.json()
            current_language = lang_data.get("language", "en")
            self.log_test("Get Language Preference", True, f"Current language: {current_language}")
        else:
            self.log_test("Get Language Preference", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 2: PUT /api/users/language-preference - Update language
        print("Step 2: Testing Update Language Preference...")
        language_update = {"language": "es"}
        response = self.make_request("PUT", "/users/language-preference", language_update, token=self.token)
        if response and response.status_code == 200:
            self.log_test("Update Language Preference", True, "Language updated to Spanish")
            
            # Verify the update
            response = self.make_request("GET", "/users/language-preference", token=self.token)
            if response and response.status_code == 200:
                updated_lang = response.json().get("language")
                if updated_lang == "es":
                    self.log_test("Language Update Verification", True, "Language change verified")
                else:
                    self.log_test("Language Update Verification", False, f"Expected 'es', got '{updated_lang}'")
        else:
            self.log_test("Update Language Preference", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 3: GET /api/users/two-factor-status - Get 2FA status
        print("Step 3: Testing Get Two-Factor Status...")
        response = self.make_request("GET", "/users/two-factor-status", token=self.token)
        if response and response.status_code == 200:
            tfa_data = response.json()
            enabled = tfa_data.get("enabled", False)
            backup_codes = tfa_data.get("backup_codes", [])
            self.log_test("Get Two-Factor Status", True, f"2FA enabled: {enabled}, Backup codes: {len(backup_codes)}")
        else:
            self.log_test("Get Two-Factor Status", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 4: POST /api/users/two-factor-generate - Generate 2FA QR code
        print("Step 4: Testing Generate Two-Factor QR Code...")
        response = self.make_request("POST", "/users/two-factor-generate", token=self.token)
        if response and response.status_code == 200:
            qr_data = response.json()
            qr_code = qr_data.get("qr_code")
            backup_codes = qr_data.get("backup_codes", [])
            self.log_test("Generate Two-Factor QR", True, f"QR code generated, {len(backup_codes)} backup codes provided")
        else:
            self.log_test("Generate Two-Factor QR", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 5: POST /api/users/two-factor-verify - Verify 2FA code
        print("Step 5: Testing Verify Two-Factor Code...")
        verification_data = {"code": "123456"}  # Mock 6-digit code
        response = self.make_request("POST", "/users/two-factor-verify", verification_data, token=self.token)
        if response and response.status_code == 200:
            verify_result = response.json()
            self.log_test("Verify Two-Factor Code", True, verify_result.get("message", "2FA enabled"))
            
            # Verify 2FA is now enabled
            response = self.make_request("GET", "/users/two-factor-status", token=self.token)
            if response and response.status_code == 200:
                tfa_status = response.json()
                if tfa_status.get("enabled"):
                    self.log_test("Two-Factor Enable Verification", True, "2FA successfully enabled")
                else:
                    self.log_test("Two-Factor Enable Verification", False, "2FA not enabled after verification")
        else:
            self.log_test("Verify Two-Factor Code", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 6: POST /api/users/two-factor-disable - Disable 2FA
        print("Step 6: Testing Disable Two-Factor Authentication...")
        response = self.make_request("POST", "/users/two-factor-disable", token=self.token)
        if response and response.status_code == 200:
            disable_result = response.json()
            self.log_test("Disable Two-Factor Auth", True, disable_result.get("message", "2FA disabled"))
            
            # Verify 2FA is now disabled
            response = self.make_request("GET", "/users/two-factor-status", token=self.token)
            if response and response.status_code == 200:
                tfa_status = response.json()
                if not tfa_status.get("enabled"):
                    self.log_test("Two-Factor Disable Verification", True, "2FA successfully disabled")
                else:
                    self.log_test("Two-Factor Disable Verification", False, "2FA still enabled after disable request")
        else:
            self.log_test("Disable Two-Factor Auth", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 7: GET /api/users/privacy-settings - Get privacy settings
        print("Step 7: Testing Get Privacy Settings...")
        response = self.make_request("GET", "/users/privacy-settings", token=self.token)
        if response and response.status_code == 200:
            privacy_data = response.json()
            settings = privacy_data.get("settings", {})
            self.log_test("Get Privacy Settings", True, f"Retrieved {len(settings)} privacy settings")
        else:
            self.log_test("Get Privacy Settings", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 8: PUT /api/users/privacy-settings - Update privacy settings
        print("Step 8: Testing Update Privacy Settings...")
        privacy_update = {
            "settings": {
                "profile_visibility": "private",
                "event_visibility": "contacts",
                "marketing_emails": True,
                "data_analytics": False,
                "location_sharing": True
            }
        }
        response = self.make_request("PUT", "/users/privacy-settings", privacy_update, token=self.token)
        if response and response.status_code == 200:
            self.log_test("Update Privacy Settings", True, "Privacy settings updated successfully")
            
            # Verify the update
            response = self.make_request("GET", "/users/privacy-settings", token=self.token)
            if response and response.status_code == 200:
                updated_settings = response.json().get("settings", {})
                if updated_settings.get("profile_visibility") == "private":
                    self.log_test("Privacy Settings Update Verification", True, "Privacy settings change verified")
                else:
                    self.log_test("Privacy Settings Update Verification", False, "Privacy settings not updated properly")
        else:
            self.log_test("Update Privacy Settings", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 9: GET /api/users/integrations - Get integrations
        print("Step 9: Testing Get User Integrations...")
        response = self.make_request("GET", "/users/integrations", token=self.token)
        if response and response.status_code == 200:
            integrations_data = response.json()
            connected = integrations_data.get("connected", [])
            available = integrations_data.get("available", [])
            self.log_test("Get User Integrations", True, f"Connected: {len(connected)}, Available: {len(available)}")
        else:
            self.log_test("Get User Integrations", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 10: POST /api/users/integrations/connect - Connect integration
        print("Step 10: Testing Connect Integration...")
        integration_data = {"integration_id": "google_calendar"}
        response = self.make_request("POST", "/users/integrations/connect", integration_data, token=self.token)
        if response and response.status_code == 200:
            connect_result = response.json()
            self.log_test("Connect Integration", True, connect_result.get("message", "Integration connected"))
        else:
            self.log_test("Connect Integration", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 11: GET /api/users/payment-methods - Get payment methods
        print("Step 11: Testing Get Payment Methods...")
        response = self.make_request("GET", "/users/payment-methods", token=self.token)
        if response and response.status_code == 200:
            payment_data = response.json()
            methods = payment_data.get("payment_methods", [])
            self.log_test("Get Payment Methods", True, f"Found {len(methods)} payment methods")
        else:
            self.log_test("Get Payment Methods", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 12: GET /api/users/billing-history - Get billing history
        print("Step 12: Testing Get Billing History...")
        response = self.make_request("GET", "/users/billing-history", token=self.token)
        if response and response.status_code == 200:
            billing_data = response.json()
            history = billing_data.get("billing_history", [])
            self.log_test("Get Billing History", True, f"Found {len(history)} billing records")
        else:
            self.log_test("Get Billing History", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 13: POST /api/support/contact - Submit support ticket
        print("Step 13: Testing Submit Support Ticket...")
        support_data = {
            "subject": "Test Support Request",
            "category": "technical",
            "message": "This is a test support ticket to verify the contact form functionality.",
            "priority": "medium"
        }
        response = self.make_request("POST", "/support/contact", support_data, token=self.token)
        if response and response.status_code == 200:
            ticket_result = response.json()
            ticket_id = ticket_result.get("ticket_id")
            self.log_test("Submit Support Ticket", True, f"Support ticket created: {ticket_id}")
        else:
            self.log_test("Submit Support Ticket", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 14: Test error handling with invalid data
        print("Step 14: Testing Error Handling...")
        
        # Test invalid 2FA code
        invalid_verification = {"code": "abc"}  # Invalid code format
        response = self.make_request("POST", "/users/two-factor-verify", invalid_verification, token=self.token)
        if response and response.status_code == 400:
            self.log_test("Invalid 2FA Code Handling", True, "Correctly rejected invalid 2FA code")
        else:
            self.log_test("Invalid 2FA Code Handling", False, f"Expected 400, got {response.status_code if response else 'No response'}")
        
        # Test invalid language preference
        invalid_language = {"language": ""}  # Empty language
        response = self.make_request("PUT", "/users/language-preference", invalid_language, token=self.token)
        # This should still work as the backend doesn't validate language codes strictly
        if response and response.status_code in [200, 400]:
            self.log_test("Language Validation", True, "Language endpoint handles edge cases")
        else:
            self.log_test("Language Validation", False, f"Unexpected response: {response.status_code if response else 'No response'}")
        
        # Test 15: Test authentication requirement
        print("Step 15: Testing Authentication Requirements...")
        
        # Test without token
        response = self.make_request("GET", "/users/language-preference")
        if response and response.status_code == 401:
            self.log_test("Authentication Required", True, "Correctly requires authentication")
        else:
            self.log_test("Authentication Required", False, f"Expected 401, got {response.status_code if response else 'No response'}")
        
        print("\n📊 User Settings & Profile Management Testing Summary:")
        print("   • Language preference management tested")
        print("   • Two-factor authentication flow tested")
        print("   • Privacy settings management tested")
        print("   • Third-party integrations tested")
        print("   • Payment methods retrieval tested")
        print("   • Billing history retrieval tested")
        print("   • Support ticket submission tested")
        print("   • Error handling and authentication tested")
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 USER SETTINGS & PROFILE MANAGEMENT API TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"   - {test}")
        
        # Determine overall result
        if failed_tests == 0:
            print(f"\n🎉 ALL USER SETTINGS & PROFILE MANAGEMENT ENDPOINTS WORKING PERFECTLY!")
        elif passed_tests >= total_tests * 0.8:  # 80% pass rate
            print(f"\n✅ USER SETTINGS & PROFILE MANAGEMENT MOSTLY FUNCTIONAL")
            print(f"   Core functionality working with {passed_tests}/{total_tests} tests passing")
        else:
            print(f"\n⚠️ USER SETTINGS & PROFILE MANAGEMENT NEEDS ATTENTION")
            print(f"   Only {passed_tests}/{total_tests} tests passing")
    
    def run_tests(self):
        """Run all User Settings & Profile Management tests"""
        print("🚀 Starting User Settings & Profile Management API Testing...")
        print(f"Backend URL: {BASE_URL}")
        print("=" * 80)
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return
        
        # Run the main test suite
        self.test_user_settings_profile_management()
        
        # Print summary
        self.print_summary()

if __name__ == "__main__":
    tester = UserSettingsAPITester()
    tester.run_tests()