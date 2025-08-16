#!/usr/bin/env python3
"""
Quick authentication test to debug login issues
"""

import requests
import json
import os

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://eventforge-4.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

def test_register_and_login():
    print(f"Testing authentication with backend: {BASE_URL}")
    
    # Test registration first
    user_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpass123",
        "role": "client"
    }
    
    print("1. Testing registration...")
    try:
        response = requests.post(f"{BASE_URL}/register", json=user_data, headers=HEADERS, timeout=10)
        print(f"   Registration status: {response.status_code}")
        if response.status_code == 200:
            print(f"   Registration response: {response.json()}")
        else:
            print(f"   Registration error: {response.text}")
    except Exception as e:
        print(f"   Registration failed: {e}")
    
    # Test login
    login_data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    print("2. Testing login...")
    try:
        response = requests.post(f"{BASE_URL}/login", json=login_data, headers=HEADERS, timeout=10)
        print(f"   Login status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Login successful! Token: {data.get('access_token', 'No token')[:50]}...")
            return data.get('access_token')
        else:
            print(f"   Login error: {response.text}")
    except Exception as e:
        print(f"   Login failed: {e}")
    
    # Try with existing user credentials
    print("3. Testing with existing user credentials...")
    existing_login = {
        "email": "sarah.johnson@email.com",
        "password": "SecurePass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login", json=existing_login, headers=HEADERS, timeout=10)
        print(f"   Existing user login status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Existing user login successful! Token: {data.get('access_token', 'No token')[:50]}...")
            return data.get('access_token')
        else:
            print(f"   Existing user login error: {response.text}")
    except Exception as e:
        print(f"   Existing user login failed: {e}")
    
    return None

if __name__ == "__main__":
    token = test_register_and_login()
    if token:
        print("✅ Authentication working!")
    else:
        print("❌ Authentication failed!")