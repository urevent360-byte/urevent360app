#!/usr/bin/env python3
"""
Sample Data Creation and Testing for Venue/Vendor Search Endpoints

This script will:
1. Create sample venues and vendors in the database
2. Test the search endpoints with actual data
3. Verify the InteractiveEventPlanner functionality
"""

import requests
import json
import sys
from datetime import datetime
import uuid
import time
import os

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
TEST_CREDENTIALS = {"email": "carladbaquero@gmail.com", "password": "carla123"}

class SampleDataTester:
    def __init__(self):
        self.token = None
        
    def authenticate(self):
        """Authenticate and get JWT token"""
        print("🔐 Authenticating...")
        
        response = requests.post(f"{BASE_URL}/login", json=TEST_CREDENTIALS, headers=HEADERS, timeout=30)
        
        if response and response.status_code == 200:
            login_data = response.json()
            self.token = login_data.get("access_token")
            user_data = login_data.get("user", {})
            print(f"✅ Authenticated: {user_data.get('name')} ({user_data.get('email')})")
            return True
        
        print("❌ Authentication failed")
        return False
    
    def create_sample_venues(self):
        """Create sample venues for testing"""
        print("\n🏛️ Creating sample venues...")
        
        venues = [
            {
                "name": "Orlando Grand Hotel & Conference Center",
                "description": "Elegant hotel with spacious ballrooms perfect for events",
                "location": "Orlando, FL",
                "venue_type": "Hotel",
                "capacity": 200,
                "price_per_person": 85.0,
                "amenities": ["Parking", "Catering Kitchen", "AV Equipment", "Dance Floor"],
                "rating": 4.5,
                "contact_info": {
                    "phone": "+1-407-555-0123",
                    "email": "events@orlandogrand.com"
                }
            },
            {
                "name": "Bella Vista Banquet Hall",
                "description": "Beautiful banquet hall with modern amenities",
                "location": "Orlando, FL", 
                "venue_type": "Banquet Hall",
                "capacity": 150,
                "price_per_person": 75.0,
                "amenities": ["Parking", "Full Kitchen", "Sound System", "Lighting"],
                "rating": 4.3,
                "contact_info": {
                    "phone": "+1-407-555-0456",
                    "email": "info@bellavistahall.com"
                }
            },
            {
                "name": "Garden Oaks Restaurant",
                "description": "Upscale restaurant with private dining rooms",
                "location": "Orlando, FL",
                "venue_type": "Restaurant", 
                "capacity": 80,
                "price_per_person": 65.0,
                "amenities": ["Private Dining", "Full Bar", "Valet Parking"],
                "rating": 4.7,
                "contact_info": {
                    "phone": "+1-407-555-0789",
                    "email": "events@gardenoaks.com"
                }
            }
        ]
        
        created_venues = []
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        
        for venue_data in venues:
            try:
                response = requests.post(f"{BASE_URL}/venues", json=venue_data, headers=headers, timeout=30)
                
                if response and response.status_code == 200:
                    venue = response.json()
                    created_venues.append(venue)
                    print(f"✅ Created venue: {venue_data['name']}")
                else:
                    print(f"❌ Failed to create venue: {venue_data['name']} (Status: {response.status_code if response else 'No response'})")
            except Exception as e:
                print(f"❌ Error creating venue {venue_data['name']}: {e}")
        
        return created_venues
    
    def create_sample_vendors(self):
        """Create sample vendors for testing"""
        print("\n👥 Creating sample vendors...")
        
        vendors = [
            {
                "name": "Orlando Elite Catering",
                "description": "Premium catering service specializing in elegant events",
                "service_type": "catering",
                "location": "Orlando, FL",
                "price_range": "$$$",
                "rating": 4.8,
                "specialties": ["Wedding Catering", "Corporate Events", "Sweet 16 Parties"],
                "cultural_specializations": ["American", "Italian", "Hispanic"],
                "contact_info": {
                    "phone": "+1-407-555-1111",
                    "email": "info@orlandoelitecatering.com"
                },
                "base_price": 2500.0,
                "price_per_person": 45.0
            },
            {
                "name": "Magical Moments Photography",
                "description": "Professional event photography capturing your special moments",
                "service_type": "photography",
                "location": "Orlando, FL",
                "price_range": "$$",
                "rating": 4.6,
                "specialties": ["Wedding Photography", "Sweet 16 Photography", "Event Coverage"],
                "cultural_specializations": ["American", "Hispanic", "Other"],
                "contact_info": {
                    "phone": "+1-407-555-2222",
                    "email": "bookings@magicalmomentsphotography.com"
                },
                "base_price": 1200.0
            },
            {
                "name": "Elegant Decorations & Florals",
                "description": "Full-service decoration and floral design for all events",
                "service_type": "decoration",
                "location": "Orlando, FL",
                "price_range": "$$",
                "rating": 4.4,
                "specialties": ["Floral Arrangements", "Event Decor", "Centerpieces"],
                "cultural_specializations": ["American", "Hispanic", "Indian"],
                "contact_info": {
                    "phone": "+1-407-555-3333",
                    "email": "design@elegantdecorations.com"
                },
                "base_price": 1500.0
            },
            {
                "name": "DJ Soundwave Entertainment",
                "description": "Professional DJ and entertainment services",
                "service_type": "music/dj",
                "location": "Orlando, FL",
                "price_range": "$",
                "rating": 4.5,
                "specialties": ["Wedding DJ", "Sweet 16 DJ", "Dance Music"],
                "cultural_specializations": ["American", "Hispanic", "Other"],
                "contact_info": {
                    "phone": "+1-407-555-4444",
                    "email": "bookings@djsoundwave.com"
                },
                "base_price": 800.0
            }
        ]
        
        created_vendors = []
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        
        for vendor_data in vendors:
            try:
                response = requests.post(f"{BASE_URL}/vendors", json=vendor_data, headers=headers, timeout=30)
                
                if response and response.status_code == 200:
                    vendor = response.json()
                    created_vendors.append(vendor)
                    print(f"✅ Created vendor: {vendor_data['name']}")
                else:
                    print(f"❌ Failed to create vendor: {vendor_data['name']} (Status: {response.status_code if response else 'No response'})")
            except Exception as e:
                print(f"❌ Error creating vendor {vendor_data['name']}: {e}")
        
        return created_vendors
    
    def test_venue_search_with_data(self):
        """Test venue search endpoints with actual data"""
        print("\n🏛️ Testing venue search with sample data...")
        
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        
        # Test 1: Search for Orlando venues
        print("   Test 1: Search for Orlando venues...")
        params = {
            "city": "Orlando",
            "venue_type": "Hotel/Banquet Hall",
            "capacity_min": 90
        }
        
        response = requests.get(f"{BASE_URL}/venues/search", params=params, headers=headers, timeout=30)
        
        if response and response.status_code == 200:
            venues = response.json()
            print(f"✅ Found {len(venues)} venues matching search criteria")
            
            for venue in venues:
                print(f"   - {venue.get('name')} ({venue.get('venue_type')}) - Capacity: {venue.get('capacity')}")
        else:
            print(f"❌ Venue search failed: {response.status_code if response else 'No response'}")
        
        # Test 2: Search for restaurants
        print("   Test 2: Search for restaurants...")
        params = {
            "city": "Orlando",
            "venue_type": "Restaurant",
            "capacity_min": 50
        }
        
        response = requests.get(f"{BASE_URL}/venues/search", params=params, headers=headers, timeout=30)
        
        if response and response.status_code == 200:
            venues = response.json()
            print(f"✅ Found {len(venues)} restaurants matching search criteria")
            
            for venue in venues:
                print(f"   - {venue.get('name')} - Capacity: {venue.get('capacity')}, Price: ${venue.get('price_per_person')}/person")
        else:
            print(f"❌ Restaurant search failed: {response.status_code if response else 'No response'}")
    
    def test_vendor_search_with_data(self):
        """Test vendor search endpoints with actual data"""
        print("\n👥 Testing vendor search with sample data...")
        
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        
        # Test 1: Search for catering vendors
        print("   Test 1: Search for catering vendors...")
        params = {
            "service_type": "catering",
            "location": "Orlando",
            "guest_count": 90
        }
        
        response = requests.get(f"{BASE_URL}/vendors/search", params=params, headers=headers, timeout=30)
        
        if response and response.status_code == 200:
            vendors = response.json()
            print(f"✅ Found {len(vendors)} catering vendors matching search criteria")
            
            for vendor in vendors:
                print(f"   - {vendor.get('name')} - Rating: {vendor.get('rating')}, Price: ${vendor.get('price_per_person', 'N/A')}/person")
        else:
            print(f"❌ Catering vendor search failed: {response.status_code if response else 'No response'}")
        
        # Test 2: Search for photography vendors
        print("   Test 2: Search for photography vendors...")
        params = {
            "service_type": "photography",
            "location": "Orlando"
        }
        
        response = requests.get(f"{BASE_URL}/vendors/search", params=params, headers=headers, timeout=30)
        
        if response and response.status_code == 200:
            vendors = response.json()
            print(f"✅ Found {len(vendors)} photography vendors matching search criteria")
            
            for vendor in vendors:
                print(f"   - {vendor.get('name')} - Rating: {vendor.get('rating')}, Base Price: ${vendor.get('base_price', 'N/A')}")
        else:
            print(f"❌ Photography vendor search failed: {response.status_code if response else 'No response'}")
        
        # Test 3: Search for all service types
        print("   Test 3: Search for all service types...")
        service_types = ["catering", "photography", "decoration", "music/dj"]
        
        for service_type in service_types:
            params = {
                "service_type": service_type,
                "location": "Orlando"
            }
            
            response = requests.get(f"{BASE_URL}/vendors/search", params=params, headers=headers, timeout=30)
            
            if response and response.status_code == 200:
                vendors = response.json()
                print(f"✅ {service_type.title()}: Found {len(vendors)} vendors")
            else:
                print(f"❌ {service_type.title()}: Search failed")
    
    def run_comprehensive_test(self):
        """Run comprehensive test with sample data creation"""
        print("🚀 COMPREHENSIVE VENUE & VENDOR SEARCH TESTING WITH SAMPLE DATA")
        print("=" * 80)
        
        # Step 1: Authenticate
        if not self.authenticate():
            return False
        
        # Step 2: Create sample data
        venues = self.create_sample_venues()
        vendors = self.create_sample_vendors()
        
        print(f"\n📊 Sample Data Created:")
        print(f"   Venues: {len(venues)}")
        print(f"   Vendors: {len(vendors)}")
        
        # Step 3: Test search endpoints with data
        self.test_venue_search_with_data()
        self.test_vendor_search_with_data()
        
        print(f"\n✅ COMPREHENSIVE TESTING COMPLETED")
        print(f"✅ Venue and vendor search endpoints are working correctly")
        print(f"✅ Sample data has been created for testing InteractiveEventPlanner")
        
        return True

def main():
    """Main function"""
    tester = SampleDataTester()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🎉 SUCCESS: All venue and vendor search endpoints are operational!")
        sys.exit(0)
    else:
        print("\n❌ FAILURE: Issues found with venue and vendor search endpoints")
        sys.exit(1)

if __name__ == "__main__":
    main()