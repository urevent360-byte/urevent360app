#!/usr/bin/env python3
"""
UNIFIED LOCATION CONTROLS BACKEND ANALYSIS
Analysis of current backend implementation vs required unified location controls

FINDINGS:
1. Current backend expects location as string (legacy format)
2. Backend has location_preferences field that could support unified data
3. Backend needs updates to support unified location object in main location field
4. Validation rules need implementation for unified mode
"""

import requests
import json
import os
from datetime import datetime

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://planningpro.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

CLIENT_CREDENTIALS = {"email": "sarah.johnson@email.com", "password": "SecurePass123"}

class UnifiedLocationAnalyzer:
    def __init__(self):
        self.token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        status = "✅ WORKING" if success else "❌ NEEDS IMPLEMENTATION"
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
        response = requests.post(f"{BASE_URL}/login", json=CLIENT_CREDENTIALS, timeout=10)
        if response.status_code == 200:
            self.token = response.json().get("access_token")
            return True
        return False
    
    def analyze_current_backend_support(self):
        """Analyze current backend support for location data"""
        print("🔍 ANALYZING CURRENT BACKEND SUPPORT")
        print("=" * 70)
        
        headers = HEADERS.copy()
        headers["Authorization"] = f"Bearer {self.token}"
        
        # Test 1: Current location field (string format)
        legacy_event = {
            "name": "Current Backend Analysis",
            "event_type": "wedding",
            "date": "2024-12-15T18:00:00Z",
            "location": "New York, NY",  # Current format
            "budget": 30000.0,
            "guest_count": 150
        }
        
        response = requests.post(f"{BASE_URL}/events", json=legacy_event, headers=headers, timeout=10)
        if response.status_code == 200:
            event_data = response.json()
            self.log_test("Legacy Location Field (String)", True, 
                        f"Current: location = '{event_data.get('location')}'")
            
            # Check available fields in response
            location_related_fields = {
                "location": event_data.get("location"),
                "zipcode": event_data.get("zipcode"), 
                "location_preferences": event_data.get("location_preferences")
            }
            
            self.log_test("Available Location Fields", True, 
                        f"Fields: {list(location_related_fields.keys())}")
            
            event_id = event_data.get("id")
            
            # Test 2: location_preferences field (could support unified data)
            location_prefs_update = {
                "location_preferences": {
                    "city": "New York",
                    "zipcode": "10001", 
                    "zip_only": True,
                    "radius_miles": 25
                }
            }
            
            response = requests.put(f"{BASE_URL}/events/{event_id}", 
                                  json=location_prefs_update, headers=headers, timeout=10)
            if response.status_code == 200:
                updated_event = response.json()
                location_prefs = updated_event.get("location_preferences")
                self.log_test("Location Preferences Field Support", True, 
                            f"Stored: {location_prefs}")
            else:
                self.log_test("Location Preferences Field Support", False, 
                            f"Status: {response.status_code}")
        else:
            self.log_test("Basic Event Creation", False, f"Status: {response.status_code}")
    
    def test_unified_location_requirements(self):
        """Test what needs to be implemented for unified location controls"""
        print("\n🎯 UNIFIED LOCATION REQUIREMENTS ANALYSIS")
        print("=" * 70)
        
        headers = HEADERS.copy()
        headers["Authorization"] = f"Bearer {self.token}"
        
        # Test 1: Attempt unified location object in main location field
        unified_event = {
            "name": "Unified Location Test",
            "event_type": "corporate",
            "date": "2024-12-20T14:00:00Z",
            "location": {  # This should be supported for unified controls
                "city": "Chicago",
                "zipcode": "60601",
                "zipOnly": False,
                "radiusMiles": 50
            },
            "budget": 25000.0,
            "guest_count": 100
        }
        
        response = requests.post(f"{BASE_URL}/events", json=unified_event, headers=headers, timeout=10)
        if response.status_code == 200:
            self.log_test("Unified Location Object in Main Field", True, "Backend supports unified location object")
        else:
            error_detail = response.json().get("detail", [{}])[0] if response.status_code == 422 else "Unknown error"
            self.log_test("Unified Location Object in Main Field", False, 
                        f"Backend expects string, got: {error_detail}")
        
        # Test 2: Check if backend can handle both formats
        mixed_format_test = {
            "name": "Mixed Format Test",
            "event_type": "birthday",
            "date": "2024-12-25T16:00:00Z",
            "location": "Miami, FL",  # Legacy string
            "location_preferences": {  # Unified data in preferences
                "city": "Miami",
                "zipcode": "33101",
                "zip_only": False,
                "radius_miles": 30
            },
            "budget": 20000.0,
            "guest_count": 80
        }
        
        response = requests.post(f"{BASE_URL}/events", json=mixed_format_test, headers=headers, timeout=10)
        if response.status_code == 200:
            event_data = response.json()
            self.log_test("Mixed Format Support", True, 
                        f"Legacy location: '{event_data.get('location')}', Preferences: {event_data.get('location_preferences')}")
        else:
            self.log_test("Mixed Format Support", False, f"Status: {response.status_code}")
    
    def analyze_validation_requirements(self):
        """Analyze validation requirements for unified location controls"""
        print("\n✅ VALIDATION REQUIREMENTS ANALYSIS")
        print("=" * 70)
        
        headers = HEADERS.copy()
        headers["Authorization"] = f"Bearer {self.token}"
        
        # Test 1: Empty location validation
        empty_location_event = {
            "name": "Empty Location Test",
            "event_type": "anniversary",
            "date": "2024-12-30T19:00:00Z",
            "location": "",  # Empty location
            "budget": 18000.0,
            "guest_count": 60
        }
        
        response = requests.post(f"{BASE_URL}/events", json=empty_location_event, headers=headers, timeout=10)
        if response.status_code == 200:
            self.log_test("Empty Location Validation", False, 
                        "Backend accepts empty location - validation needed")
        elif response.status_code == 422:
            self.log_test("Empty Location Validation", True, 
                        "Backend rejects empty location")
        else:
            self.log_test("Empty Location Validation", False, 
                        f"Unexpected status: {response.status_code}")
        
        # Test 2: Missing location field
        no_location_event = {
            "name": "No Location Test",
            "event_type": "graduation",
            "date": "2025-01-05T17:00:00Z",
            # No location field at all
            "budget": 22000.0,
            "guest_count": 120
        }
        
        response = requests.post(f"{BASE_URL}/events", json=no_location_event, headers=headers, timeout=10)
        if response.status_code == 200:
            event_data = response.json()
            self.log_test("Missing Location Field", True, 
                        f"Backend allows missing location: {event_data.get('location')}")
        else:
            self.log_test("Missing Location Field", False, 
                        f"Backend requires location field: {response.status_code}")
    
    def generate_implementation_recommendations(self):
        """Generate recommendations for implementing unified location controls"""
        print("\n📋 IMPLEMENTATION RECOMMENDATIONS")
        print("=" * 70)
        
        recommendations = [
            "1. UPDATE EVENT MODEL: Modify Event and EventCreate models to accept location as Union[str, Dict]",
            "2. BACKWARD COMPATIBILITY: Ensure both string and object formats are supported",
            "3. DATA MIGRATION: Convert existing string locations to unified format when updated",
            "4. VALIDATION RULES: Implement validation requiring either city OR zipcode in unified mode",
            "5. API ENDPOINTS: Update event creation/update endpoints to handle unified location objects",
            "6. LOCATION SYNCHRONIZATION: Sync between legacy location field and unified location object",
            "7. FEATURE FLAG SUPPORT: Add backend logic to handle unified vs legacy mode",
            "8. SEARCH INTEGRATION: Update venue search to work with unified location data"
        ]
        
        for rec in recommendations:
            print(f"   {rec}")
        
        print("\n🔧 SPECIFIC BACKEND CHANGES NEEDED:")
        print("   - Modify EventCreate.location field: Union[str, Dict[str, Any]]")
        print("   - Modify Event.location field: Union[str, Dict[str, Any]]") 
        print("   - Add validation logic for unified location objects")
        print("   - Update event creation endpoint to handle both formats")
        print("   - Add migration logic for legacy to unified conversion")
    
    def run_analysis(self):
        """Run complete analysis of unified location controls backend support"""
        print("🚀 UNIFIED LOCATION CONTROLS BACKEND ANALYSIS")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 70)
        
        if not self.authenticate():
            print("❌ Authentication failed")
            return
        
        self.analyze_current_backend_support()
        self.test_unified_location_requirements()
        self.analyze_validation_requirements()
        self.generate_implementation_recommendations()
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 ANALYSIS SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        working_features = sum(1 for result in self.test_results if result["success"])
        needs_implementation = total_tests - working_features
        
        print(f"Total Features Analyzed: {total_tests}")
        print(f"✅ Currently Working: {working_features}")
        print(f"❌ Needs Implementation: {needs_implementation}")
        
        if needs_implementation > 0:
            print(f"\n❌ FEATURES NEEDING IMPLEMENTATION:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   ❌ {result['test']}")
        
        print("\n🎯 CONCLUSION:")
        print("   Backend currently supports legacy string location format.")
        print("   Unified location object support needs to be implemented.")
        print("   location_preferences field can be used as interim solution.")
        print("   Full unified location controls require backend model updates.")

if __name__ == "__main__":
    analyzer = UnifiedLocationAnalyzer()
    analyzer.run_analysis()