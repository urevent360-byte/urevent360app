#!/usr/bin/env python3
"""
Core Functionality Test for Start Planning Features
"""

import requests
import json
import os

BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://event-intelligence.preview.emergentagent.com')
BASE_URL = f'{BACKEND_URL}/api'
HEADERS = {'Content-Type': 'application/json'}

def test_core_functionality():
    # Test authentication
    print('🔐 Testing authentication...')
    login_data = {'email': 'sarah.johnson@email.com', 'password': 'SecurePass123'}
    response = requests.post(f'{BASE_URL}/login', json=login_data, headers=HEADERS, timeout=10)

    if response.status_code == 200:
        token = response.json()['access_token']
        auth_headers = HEADERS.copy()
        auth_headers['Authorization'] = f'Bearer {token}'
        print('✅ Authentication successful')
        
        # Test vendor search with available vendors
        print('\n🔍 Testing vendor search...')
        vendors_response = requests.get(f'{BASE_URL}/vendors', headers=auth_headers, timeout=10)
        if vendors_response.status_code == 200:
            vendors = vendors_response.json()
            print(f'✅ Found {len(vendors)} vendors:')
            for vendor in vendors:
                print(f'   - {vendor.get("name", "Unknown")}: {vendor.get("service_type", "Unknown service")}')
        
        # Test event creation with questionnaire data
        print('\n📝 Testing event creation with questionnaire data...')
        event_data = {
            'name': 'Core Functionality Test',
            'event_type': 'wedding',
            'date': '2024-12-15T18:00:00Z',
            'location': 'Test Location',
            'budget': 30000.0,
            'guest_count': 100,
            'preferred_venue_type': 'Hotel/Banquet Hall',
            'services_needed': ['Catering', 'Photography']
        }
        
        event_response = requests.post(f'{BASE_URL}/events', json=event_data, headers=auth_headers, timeout=10)
        if event_response.status_code == 200:
            event = event_response.json()
            event_id = event['id']
            print(f'✅ Event created with questionnaire data: {event_id}')
            
            # Test quote creation
            print('\n📋 Testing quote creation...')
            quote_data = {
                'event_id': event_id,
                'name': 'Test Quote',
                'status': 'in_progress',
                'event_type': event_data['event_type'],
                'budget': event_data['budget'],
                'guest_count': event_data['guest_count'],
                'services_needed': event_data['services_needed']
            }
            
            quote_response = requests.post(f'{BASE_URL}/events/{event_id}/quotes', json=quote_data, headers=auth_headers, timeout=10)
            if quote_response.status_code == 200:
                quote = quote_response.json()
                print(f'✅ Quote created: {quote["id"]}')
                print(f'   Services needed: {quote.get("services_needed", [])}')
                print(f'   Guest count: {quote.get("guest_count", 0)}')
                print(f'   Budget: ${quote.get("budget", 0)}')
            else:
                print(f'❌ Quote creation failed: {quote_response.status_code}')
            
            # Test planner state
            print('\n🎯 Testing planner state...')
            planner_response = requests.get(f'{BASE_URL}/events/{event_id}/planner/state', headers=auth_headers, timeout=10)
            if planner_response.status_code == 200:
                planner_state = planner_response.json()
                budget_tracking = planner_state.get('budget_tracking', {})
                print(f'✅ Planner state initialized:')
                print(f'   Set budget: ${budget_tracking.get("set_budget", 0)}')
                print(f'   Current step: {planner_state.get("current_step", 0)}')
            else:
                print(f'❌ Planner state failed: {planner_response.status_code}')
            
            # Test vendor search with event context
            print('\n🏪 Testing vendor search with event context...')
            vendor_search_response = requests.get(f'{BASE_URL}/vendors/search?event_id={event_id}&service_type=catering', headers=auth_headers, timeout=10)
            if vendor_search_response.status_code == 200:
                search_vendors = vendor_search_response.json()
                print(f'✅ Vendor search with event context: {len(search_vendors)} vendors found')
            else:
                print(f'❌ Vendor search failed: {vendor_search_response.status_code}')
                
            # Test at-home venue logic
            print('\n🏠 Testing at-home venue logic...')
            at_home_venue_response = requests.get(f'{BASE_URL}/venues/search?preferred_venue_type=My Own Private Space', headers=auth_headers, timeout=10)
            if at_home_venue_response.status_code == 200:
                at_home_venues = at_home_venue_response.json()
                if len(at_home_venues) == 0:
                    print('✅ At-home venue logic working: No venues returned for "My Own Private Space"')
                else:
                    print(f'⚠️  At-home venue logic: {len(at_home_venues)} venues returned (should be 0)')
            else:
                print(f'❌ At-home venue search failed: {at_home_venue_response.status_code}')
                
        else:
            print(f'❌ Event creation failed: {event_response.status_code}')
    else:
        print(f'❌ Authentication failed: {response.status_code}')

if __name__ == "__main__":
    test_core_functionality()