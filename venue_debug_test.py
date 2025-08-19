#!/usr/bin/env python3
"""
Quick venue debug test to check venue availability
"""

import requests
import json
import os

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://event-platform-4.preview.emergentagent.com')
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
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def main():
    print("🔍 VENUE DEBUG TEST")
    print("=" * 50)
    
    # Authenticate
    response = make_request("POST", "/login", credentials)
    if not response or response.status_code != 200:
        print("❌ Authentication failed")
        return
    
    token = response.json().get("access_token")
    print("✅ Authenticated")
    
    # Check venues in database
    response = make_request("GET", "/venues", token=token)
    if response and response.status_code == 200:
        venues = response.json()
        print(f"📊 Found {len(venues)} venues in database")
        
        if venues:
            for i, venue in enumerate(venues[:3]):
                print(f"   {i+1}. {venue.get('name', 'Unknown')} - {venue.get('location', 'No location')}")
        else:
            print("   No venues found in database")
            
            # Try to create a test venue
            print("\n🏗️ Creating test venue...")
            test_venue = {
                "name": "Test Miami Venue",
                "description": "Test venue for matching",
                "location": "Miami, FL 33101",
                "venue_type": "Hotel/Banquet Hall",
                "capacity": 200,
                "price_per_person": 85.0,
                "amenities": ["Parking", "Catering", "AV Equipment"],
                "rating": 4.5,
                "contact_info": {"phone": "305-555-0123", "email": "info@testmiami.com"}
            }
            
            response = make_request("POST", "/venues", test_venue, token=token)
            if response and response.status_code == 200:
                print("✅ Test venue created")
            else:
                print(f"❌ Failed to create venue: {response.status_code if response else 'No response'}")
    else:
        print(f"❌ Failed to get venues: {response.status_code if response else 'No response'}")
    
    # Test venue search
    print("\n🔍 Testing venue search...")
    params = {"zip_code": "33101", "radius": 25}
    response = make_request("GET", "/venues/search", params=params, token=token)
    if response and response.status_code == 200:
        venues = response.json()
        print(f"📊 Venue search found {len(venues)} venues")
        
        if venues:
            for venue in venues[:2]:
                print(f"   - {venue.get('name', 'Unknown')} in {venue.get('location', 'Unknown location')}")
    else:
        print(f"❌ Venue search failed: {response.status_code if response else 'No response'}")

if __name__ == "__main__":
    main()