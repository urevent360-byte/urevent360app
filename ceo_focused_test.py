#!/usr/bin/env python3
"""
Focused CEO Console Testing - Identify specific issues
"""

import requests
import json
import os
from datetime import datetime, timedelta

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://event-planner-24.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

CEO_CREDENTIALS = {
    "email": "darwin@urevent360.com",
    "password": "ceo123456"
}

def test_ceo_endpoints():
    """Test CEO endpoints to identify issues"""
    
    # Login first
    print("🔐 Logging in as CEO...")
    response = requests.post(f"{BASE_URL}/login", json=CEO_CREDENTIALS, headers=HEADERS)
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        return
    
    data = response.json()
    token = data.get("access_token")
    if not token:
        print("❌ No access token received")
        return
    
    print(f"✅ Login successful, token received")
    
    auth_headers = HEADERS.copy()
    auth_headers["Authorization"] = f"Bearer {token}"
    
    # Test CEO succession status (working)
    print("\n📊 Testing CEO succession status...")
    response = requests.get(f"{BASE_URL}/ceo/succession/status", headers=auth_headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ CEO succession status working")
    else:
        print(f"❌ CEO succession status failed: {response.text}")
    
    # Test CEO insights (failing)
    print("\n📈 Testing CEO insights...")
    start_date = (datetime.utcnow() - timedelta(days=7)).isoformat()
    end_date = datetime.utcnow().isoformat()
    
    params = {"start_date": start_date, "end_date": end_date}
    response = requests.get(f"{BASE_URL}/ceo/insights", headers=auth_headers, params=params)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ CEO insights working")
    else:
        print(f"❌ CEO insights failed: {response.text}")
    
    # Test CEO audit logs (failing)
    print("\n📚 Testing CEO audit logs...")
    params = {"limit": 10, "hours": 24}
    response = requests.get(f"{BASE_URL}/ceo/audit/logs", headers=auth_headers, params=params)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ CEO audit logs working")
    else:
        print(f"❌ CEO audit logs failed: {response.text}")
    
    # Test CEO security status (working)
    print("\n🔒 Testing CEO security status...")
    response = requests.get(f"{BASE_URL}/ceo/security/status", headers=auth_headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ CEO security status working")
    else:
        print(f"❌ CEO security status failed: {response.text}")

if __name__ == "__main__":
    test_ceo_endpoints()