#!/usr/bin/env python3
"""
DEBUG VENDOR CAPABILITY SYSTEM
Debug the vendor capability endpoints to see actual responses
"""

import requests
import json
import os

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://event-planner-24.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

def authenticate():
    """Get authentication token"""
    credentials = {"email": "sarah.johnson@email.com", "password": "SecurePass123"}
    
    try:
        response = requests.post(f"{BASE_URL}/login", headers=HEADERS, json=credentials, timeout=30)
        if response.status_code == 200:
            login_data = response.json()
            return login_data.get("access_token")
        else:
            print(f"Authentication failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"Authentication error: {e}")
        return None

def debug_endpoint(method, endpoint, token, params=None, data=None):
    """Debug an endpoint and show full response"""
    url = f"{BASE_URL}{endpoint}"
    headers = HEADERS.copy()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    print(f"\n🔍 Testing {method} {endpoint}")
    if params:
        print(f"   Params: {params}")
    if data:
        print(f"   Data: {data}")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, params=params, timeout=30)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=30)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data, timeout=30)
        
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"   Response: {json.dumps(response_data, indent=2)}")
        except:
            print(f"   Response Text: {response.text}")
            
    except Exception as e:
        print(f"   Error: {e}")

def main():
    print("🔍 DEBUG VENDOR CAPABILITY SYSTEM")
    print("=" * 50)
    
    # Authenticate
    token = authenticate()
    if not token:
        print("❌ Could not authenticate")
        return
    
    print(f"✅ Authenticated with token: {token[:50]}...")
    
    # Debug vendor matching endpoint
    debug_endpoint("GET", "/match/vendors", token, params={
        "service": "Catering",
        "subcategories": "Full-Service Catering"
    })
    
    # Debug vendors list
    debug_endpoint("GET", "/vendors", token)
    
    # Debug vendor capabilities (try with mock vendor ID)
    debug_endpoint("GET", "/vendors/vendor_1/capabilities", token)
    
    # Debug vendor capabilities update
    sample_capabilities = {
        "catering": ["Full-Service Catering", "Specialty Food Stations"],
        "catering_stations": ["Sushi Station", "Taco Station"]
    }
    debug_endpoint("PUT", "/vendors/vendor_1/capabilities", token, data=sample_capabilities)

if __name__ == "__main__":
    main()