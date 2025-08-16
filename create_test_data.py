#!/usr/bin/env python3
"""
Create test data for Enhanced Filtering testing
"""

import requests
import json
import os
from datetime import datetime
import uuid

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://eventforge-4.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

def get_auth_token():
    """Get authentication token"""
    login_data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login", json=login_data, headers=HEADERS, timeout=10)
        if response.status_code == 200:
            return response.json().get('access_token')
    except Exception as e:
        print(f"Auth failed: {e}")
    return None

def create_test_venues():
    """Create test venues for filtering tests"""
    venues = [
        {
            "id": str(uuid.uuid4()),
            "name": "Grand Hotel Ballroom",
            "description": "Elegant hotel ballroom perfect for corporate events and weddings",
            "location": "New York, NY",
            "venue_type": "Hotel",
            "capacity": 200,
            "price_per_person": 150.0,
            "amenities": ["parking", "catering_kitchen", "av_equipment", "dance_floor"],
            "rating": 4.8,
            "images": ["https://example.com/hotel1.jpg"],
            "contact_info": {"phone": "555-0101", "email": "events@grandhotel.com"}
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Luxury Banquet Hall",
            "description": "Spacious banquet hall with modern amenities",
            "location": "New York, NY",
            "venue_type": "Banquet Hall",
            "capacity": 300,
            "price_per_person": 120.0,
            "amenities": ["parking", "catering_kitchen", "av_equipment"],
            "rating": 4.5,
            "images": ["https://example.com/banquet1.jpg"],
            "contact_info": {"phone": "555-0102", "email": "info@luxurybanquet.com"}
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Bella Vista Restaurant",
            "description": "Fine dining restaurant with private event space",
            "location": "Los Angeles, CA",
            "venue_type": "Restaurant",
            "capacity": 80,
            "price_per_person": 95.0,
            "amenities": ["full_kitchen", "wine_cellar", "outdoor_patio"],
            "rating": 4.6,
            "images": ["https://example.com/restaurant1.jpg"],
            "contact_info": {"phone": "555-0201", "email": "events@bellavista.com"}
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sunset Garden Venue",
            "description": "Beautiful outdoor garden venue for intimate celebrations",
            "location": "Chicago, IL",
            "venue_type": "Garden",
            "capacity": 150,
            "price_per_person": 85.0,
            "amenities": ["outdoor_space", "garden", "tent_rental"],
            "rating": 4.4,
            "images": ["https://example.com/garden1.jpg"],
            "contact_info": {"phone": "555-0301", "email": "info@sunsetgarden.com"}
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Downtown Conference Center",
            "description": "Modern conference center for corporate events",
            "location": "Chicago, IL",
            "venue_type": "Conference Center",
            "capacity": 500,
            "price_per_person": 75.0,
            "amenities": ["av_equipment", "parking", "catering_kitchen", "wifi"],
            "rating": 4.2,
            "images": ["https://example.com/conference1.jpg"],
            "contact_info": {"phone": "555-0302", "email": "events@downtowncc.com"}
        }
    ]
    
    return venues

def create_test_vendors():
    """Create test vendors for filtering tests"""
    vendors = [
        {
            "id": str(uuid.uuid4()),
            "name": "Gourmet Catering Co.",
            "description": "Premium catering services for all types of events",
            "service_type": "Catering",
            "location": "New York, NY",
            "price_range": "$$$",
            "rating": 4.8,
            "specialties": ["fine_dining", "international_cuisine", "dietary_restrictions"],
            "cultural_specializations": ["american", "italian", "french"],
            "contact_info": {"phone": "555-1001", "email": "info@gourmetcatering.com"},
            "base_price": 5000.0,
            "price_per_person": 85.0,
            "minimum_booking": 2000.0
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Elite Photography Studio",
            "description": "Professional event photography and videography",
            "service_type": "Photography",
            "location": "New York, NY",
            "price_range": "$$",
            "rating": 4.9,
            "specialties": ["wedding_photography", "corporate_events", "portrait_photography"],
            "cultural_specializations": ["american", "hispanic", "indian"],
            "contact_info": {"phone": "555-1002", "email": "bookings@elitephoto.com"},
            "base_price": 2500.0,
            "price_per_hour": 300.0,
            "minimum_booking": 1500.0
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Elegant Decorations",
            "description": "Full-service event decoration and floral design",
            "service_type": "Decoration",
            "location": "Los Angeles, CA",
            "price_range": "$$",
            "rating": 4.7,
            "specialties": ["floral_arrangements", "table_settings", "lighting_design"],
            "cultural_specializations": ["american", "asian", "middle_eastern"],
            "contact_info": {"phone": "555-2001", "email": "design@elegantdeco.com"},
            "base_price": 3000.0,
            "minimum_booking": 1000.0
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sunset Catering Services",
            "description": "Affordable catering for medium-sized events",
            "service_type": "Catering",
            "location": "Los Angeles, CA",
            "price_range": "$$",
            "rating": 4.5,
            "specialties": ["buffet_style", "cocktail_parties", "corporate_lunch"],
            "cultural_specializations": ["american", "mexican", "asian"],
            "contact_info": {"phone": "555-2002", "email": "orders@sunsetcatering.com"},
            "base_price": 3500.0,
            "price_per_person": 65.0,
            "minimum_booking": 1500.0
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Chicago Photo Pros",
            "description": "Experienced photographers specializing in corporate events",
            "service_type": "Photography",
            "location": "Chicago, IL",
            "price_range": "$",
            "rating": 4.3,
            "specialties": ["corporate_photography", "event_coverage", "headshots"],
            "cultural_specializations": ["american", "african"],
            "contact_info": {"phone": "555-3001", "email": "info@chicagophotopros.com"},
            "base_price": 1800.0,
            "price_per_hour": 250.0,
            "minimum_booking": 800.0
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Party Entertainment Plus",
            "description": "DJ services and entertainment for all occasions",
            "service_type": "Entertainment",
            "location": "Chicago, IL",
            "price_range": "$",
            "rating": 4.4,
            "specialties": ["dj_services", "live_music", "mc_services"],
            "cultural_specializations": ["american", "hispanic", "african"],
            "contact_info": {"phone": "555-3002", "email": "bookings@partyentertainment.com"},
            "base_price": 1200.0,
            "price_per_hour": 200.0,
            "minimum_booking": 600.0
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Bright Lights Productions",
            "description": "Professional lighting and sound equipment rental",
            "service_type": "Lighting",
            "location": "New York, NY",
            "price_range": "$$",
            "rating": 4.6,
            "specialties": ["stage_lighting", "ambient_lighting", "sound_systems"],
            "cultural_specializations": ["american"],
            "contact_info": {"phone": "555-1003", "email": "rentals@brightlights.com"},
            "base_price": 2000.0,
            "minimum_booking": 800.0
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Guardian Security Services",
            "description": "Professional event security and crowd management",
            "service_type": "Security",
            "location": "Los Angeles, CA",
            "price_range": "$",
            "rating": 4.1,
            "specialties": ["event_security", "crowd_control", "vip_protection"],
            "cultural_specializations": ["american"],
            "contact_info": {"phone": "555-2003", "email": "security@guardiansec.com"},
            "base_price": 800.0,
            "price_per_hour": 50.0,
            "minimum_booking": 400.0
        }
    ]
    
    return vendors

def populate_database():
    """Populate database with test data"""
    print("Creating test data for Enhanced Filtering tests...")
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("❌ Could not get authentication token")
        return False
    
    headers = HEADERS.copy()
    headers["Authorization"] = f"Bearer {token}"
    
    # Create venues
    venues = create_test_venues()
    print(f"Creating {len(venues)} test venues...")
    
    for venue in venues:
        try:
            # Use direct database insertion since there might not be a venues POST endpoint
            # For now, let's try to create via a hypothetical endpoint
            response = requests.post(f"{BASE_URL}/venues", json=venue, headers=headers, timeout=10)
            if response.status_code in [200, 201]:
                print(f"   ✅ Created venue: {venue['name']}")
            else:
                print(f"   ⚠️ Venue creation failed for {venue['name']}: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Error creating venue {venue['name']}: {e}")
    
    # Create vendors
    vendors = create_test_vendors()
    print(f"Creating {len(vendors)} test vendors...")
    
    for vendor in vendors:
        try:
            # Use direct database insertion since there might not be a vendors POST endpoint
            response = requests.post(f"{BASE_URL}/vendors", json=vendor, headers=headers, timeout=10)
            if response.status_code in [200, 201]:
                print(f"   ✅ Created vendor: {vendor['name']}")
            else:
                print(f"   ⚠️ Vendor creation failed for {vendor['name']}: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Error creating vendor {vendor['name']}: {e}")
    
    print("✅ Test data creation completed!")
    return True

if __name__ == "__main__":
    populate_database()