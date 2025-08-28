#!/usr/bin/env python3
"""
Comprehensive venue test with venue creation and matching
"""

import requests
import json
import os

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://planningpro.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
credentials = {"email": "sarah.johnson@email.com", "password": "SecurePass123"}

def make_request(method, endpoint, data=None, params=None, token=None):
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
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=30)
        else:
            return None
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def create_test_venues(token):
    """Create test venues for different locations"""
    print("🏗️ Creating test venues...")
    
    venues = [
        {
            "name": "Miami Beach Resort",
            "description": "Luxury beachfront venue",
            "location": "Miami Beach, FL 33101",
            "venue_type": "Hotel/Banquet Hall",
            "capacity": 250,
            "price_per_person": 120.0,
            "amenities": ["Ocean View", "Parking", "Catering"],
            "rating": 4.8,
            "contact_info": {"phone": "305-555-0101", "email": "info@miamibeach.com"}
        },
        {
            "name": "Orlando Grand Palace",
            "description": "Elegant banquet hall",
            "location": "Orlando, FL 32801",
            "venue_type": "Hotel/Banquet Hall",
            "capacity": 300,
            "price_per_person": 85.0,
            "amenities": ["Parking", "Catering", "AV Equipment"],
            "rating": 4.6,
            "contact_info": {"phone": "407-555-0201", "email": "info@orlandopalace.com"}
        },
        {
            "name": "Orlando Garden Venue",
            "description": "Beautiful outdoor setting",
            "location": "Orlando, FL 32801",
            "venue_type": "Outdoor/Garden",
            "capacity": 150,
            "price_per_person": 65.0,
            "amenities": ["Garden", "Natural Lighting"],
            "rating": 4.4,
            "contact_info": {"phone": "407-555-0202", "email": "info@orlandogarden.com"}
        },
        {
            "name": "New York Plaza",
            "description": "Downtown Manhattan venue",
            "location": "New York, NY 10001",
            "venue_type": "Hotel/Banquet Hall",
            "capacity": 200,
            "price_per_person": 150.0,
            "amenities": ["City View", "Valet Parking"],
            "rating": 4.9,
            "contact_info": {"phone": "212-555-0301", "email": "info@nyplaza.com"}
        }
    ]
    
    created_venues = []
    for venue in venues:
        response = make_request("POST", "/venues", venue, token=token)
        if response and response.status_code == 200:
            venue_data = response.json()
            created_venues.append(venue_data)
            print(f"   ✅ Created: {venue['name']} in {venue['location']}")
        else:
            print(f"   ❌ Failed to create: {venue['name']}")
    
    return created_venues

def test_venue_matching_comprehensive(token):
    """Test comprehensive venue matching"""
    print("\n🎯 COMPREHENSIVE VENUE MATCHING TEST")
    print("=" * 60)
    
    # Test 1: Create Miami event and test matching
    print("1. Testing Miami event with ZIP 33101...")
    
    miami_event = {
        "name": "Miami Venue Test Event",
        "event_type": "wedding",
        "date": "2024-12-15T18:00:00Z",
        "location": "Miami",
        "budget": 35000.0,
        "guest_count": 120,
        "location_preferences": {
            "city": "Miami",
            "zipcode": "33101",
            "zip_only": False,
            "radius_miles": 30
        },
        "preferred_venue_types": ["Hotel/Banquet Hall"]
    }
    
    response = make_request("POST", "/events", miami_event, token=token)
    if response and response.status_code == 200:
        event_data = response.json()
        event_id = event_data.get("id")
        print(f"   ✅ Created Miami event: {event_id}")
        
        # Test venue matching
        response = make_request("GET", f"/match/venues/event/{event_id}", token=token)
        if response and response.status_code == 200:
            venue_data = response.json()
            venues = venue_data.get("venues", [])
            location_filter = venue_data.get("location_filter", {})
            
            print(f"   📊 Found {len(venues)} venues")
            print(f"   🔍 Location filter: {location_filter}")
            
            if venues:
                for venue in venues[:2]:
                    print(f"      - {venue.get('name')} (Score: {venue.get('compatibility_score', 0)})")
            
            # Clean up
            make_request("DELETE", f"/events/{event_id}", token=token)
        else:
            print(f"   ❌ Venue matching failed: {response.status_code if response else 'No response'}")
    else:
        print(f"   ❌ Event creation failed: {response.status_code if response else 'No response'}")
    
    # Test 2: Create Orlando event with ZIP-only mode
    print("\n2. Testing Orlando event with ZIP-only mode...")
    
    orlando_event = {
        "name": "Orlando ZIP-Only Test",
        "event_type": "corporate",
        "date": "2024-12-20T19:00:00Z",
        "location": "Orlando",
        "budget": 25000.0,
        "guest_count": 80,
        "location_preferences": {
            "city": "Orlando",
            "zipcode": "32801",
            "zip_only": True,
            "radius_miles": 25  # Should be ignored
        }
    }
    
    response = make_request("POST", "/events", orlando_event, token=token)
    if response and response.status_code == 200:
        event_data = response.json()
        event_id = event_data.get("id")
        print(f"   ✅ Created Orlando event: {event_id}")
        
        # Test venue matching
        response = make_request("GET", f"/match/venues/event/{event_id}", token=token)
        if response and response.status_code == 200:
            venue_data = response.json()
            venues = venue_data.get("venues", [])
            location_filter = venue_data.get("location_filter", {})
            
            print(f"   📊 Found {len(venues)} venues")
            print(f"   🔍 Location filter: {location_filter}")
            print(f"   ✅ ZIP-only mode: {location_filter.get('zip_only')}")
            
            if venues:
                for venue in venues:
                    venue_zip = venue.get('zipcode', 'N/A')
                    print(f"      - {venue.get('name')} (ZIP: {venue_zip})")
            
            # Clean up
            make_request("DELETE", f"/events/{event_id}", token=token)
        else:
            print(f"   ❌ Venue matching failed: {response.status_code if response else 'No response'}")
    else:
        print(f"   ❌ Event creation failed: {response.status_code if response else 'No response'}")

def main():
    print("🎯 COMPREHENSIVE VENUE MATCHING TEST")
    print("=" * 60)
    
    # Authenticate
    response = make_request("POST", "/login", credentials)
    if not response or response.status_code != 200:
        print("❌ Authentication failed")
        return
    
    token = response.json().get("access_token")
    print("✅ Authenticated")
    
    # Create test venues
    created_venues = create_test_venues(token)
    print(f"📊 Created {len(created_venues)} test venues")
    
    # Test venue matching
    test_venue_matching_comprehensive(token)
    
    print("\n✅ Comprehensive venue matching test completed")

if __name__ == "__main__":
    main()