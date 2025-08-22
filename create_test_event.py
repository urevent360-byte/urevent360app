#!/usr/bin/env python3
"""
Create a test event directly via backend API for testing edit functionality
"""

import requests
import json
import os

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://planperfect-3.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

def create_test_event():
    print("🚀 Creating test event for edit functionality testing...")
    
    # Step 1: Login to get token
    login_data = {"email": "sarah.johnson@email.com", "password": "SecurePass123"}
    response = requests.post(f"{BASE_URL}/login", json=login_data, headers=HEADERS, timeout=30)
    
    if response.status_code == 200:
        token = response.json().get("access_token")
        print("✅ Login successful")
        
        # Step 2: Create test event with questionnaire information
        event_data = {
            "name": "Test Wedding Event - Edit Demo",
            "description": "This event is created to test the edit functionality for questionnaire fields",
            "event_type": "wedding",
            "cultural_style": "american", 
            "date": "2024-12-20T19:00:00Z",
            "location": "Los Angeles, CA",
            "budget": 35000.0,
            "guest_count": 120,
            "preferred_venue_type": "hotel/banquet hall",
            "services_needed": ["catering", "photography", "decoration", "music/dj"],
            "status": "planning"
        }
        
        auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/events", json=event_data, headers=auth_headers, timeout=30)
        
        if response.status_code == 200:
            event = response.json()
            print(f"✅ Test event created successfully!")
            print(f"Event ID: {event.get('id')}")
            print(f"Event Name: {event.get('name')}")
            print(f"Event Type: {event.get('event_type')}")
            print(f"Cultural Style: {event.get('cultural_style')}")
            print(f"Venue Type: {event.get('preferred_venue_type')}")
            print(f"Services: {event.get('services_needed')}")
            return event.get('id')
        else:
            print(f"❌ Failed to create event: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    else:
        print(f"❌ Login failed: {response.status_code}")
        return None

if __name__ == "__main__":
    create_test_event()