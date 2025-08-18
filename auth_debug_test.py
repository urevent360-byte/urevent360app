#!/usr/bin/env python3
"""
Simple Authentication Debug Test
Test the authentication flow to identify why frontend sessions aren't persisting
"""

import requests
import json
import os

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://festiva-manager.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

def test_auth_flow():
    print("🔍 Testing Authentication Flow...")
    
    # Step 1: Test login with known credentials
    print("\nStep 1: Testing login...")
    login_data = {"email": "sarah.johnson@email.com", "password": "SecurePass123"}
    
    try:
        response = requests.post(f"{BASE_URL}/login", json=login_data, headers=HEADERS, timeout=30)
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            login_result = response.json()
            print(f"✅ Login successful")
            print(f"Response keys: {list(login_result.keys())}")
            
            # Extract token
            token = login_result.get("access_token")
            user_data = login_result.get("user", {})
            
            if token:
                print(f"✅ Token received: {token[:50]}...")
                print(f"✅ User data: {user_data}")
                
                # Step 2: Test profile endpoint with token
                print("\nStep 2: Testing profile endpoint...")
                auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
                
                profile_response = requests.get(f"{BASE_URL}/users/profile", headers=auth_headers, timeout=30)
                print(f"Profile response status: {profile_response.status_code}")
                
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    print(f"✅ Profile retrieved successfully")
                    print(f"Profile data: {profile_data}")
                elif profile_response.status_code == 404:
                    print("❌ Profile endpoint not found - this could be the issue!")
                    print(f"Response: {profile_response.text}")
                else:
                    print(f"❌ Profile request failed: {profile_response.status_code}")
                    print(f"Response: {profile_response.text}")
                
                # Step 3: Test events endpoint (alternative)
                print("\nStep 3: Testing events endpoint...")
                events_response = requests.get(f"{BASE_URL}/events", headers=auth_headers, timeout=30)
                print(f"Events response status: {events_response.status_code}")
                
                if events_response.status_code == 200:
                    print(f"✅ Events endpoint working")
                else:
                    print(f"❌ Events request failed: {events_response.status_code}")
                    
            else:
                print("❌ No token in login response")
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Login request failed: {e}")

if __name__ == "__main__":
    test_auth_flow()