import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
import uuid

# Load environment variables
load_dotenv()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_database():
    print("🌱 Seeding database with sample data...")
    
    # Clear existing data
    await db.venues.delete_many({})
    await db.vendors.delete_many({})
    
    # Sample Venues
    venues = [
        {
            "id": str(uuid.uuid4()),
            "name": "Grand Ballroom Hotel",
            "description": "Elegant ballroom perfect for weddings and corporate events with crystal chandeliers and marble floors",
            "location": "Downtown, New York",
            "venue_type": "Hotel",
            "capacity": 300,
            "price_per_person": 150.0,
            "amenities": ["Parking", "Catering Kitchen", "AV Equipment", "Bridal Suite", "Valet Service"],
            "rating": 4.8,
            "images": ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop"],
            "contact_info": {
                "phone": "(555) 123-4567",
                "email": "events@grandballroom.com",
                "website": "www.grandballroomhotel.com"
            }
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sunset Garden Venue",
            "description": "Beautiful outdoor garden with mountain views, perfect for intimate ceremonies",
            "location": "Hillside, California",
            "venue_type": "Garden",
            "capacity": 150,
            "price_per_person": 120.0,
            "amenities": ["Garden Setting", "Mountain Views", "Parking", "Outdoor Kitchen", "Ceremony Arch"],
            "rating": 4.9,
            "images": ["https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800&h=600&fit=crop"],
            "contact_info": {
                "phone": "(555) 987-6543",
                "email": "bookings@sunsetgarden.com",
                "website": "www.sunsetgarden.com"
            }
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Oceanview Pavilion",
            "description": "Beachfront venue with panoramic ocean views and private beach access",
            "location": "Miami Beach, Florida",
            "venue_type": "Beach",
            "capacity": 200,
            "price_per_person": 180.0,
            "amenities": ["Ocean Views", "Beach Access", "Catering Kitchen", "Parking", "Sound System"],
            "rating": 4.7,
            "images": ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop"],
            "contact_info": {
                "phone": "(555) 456-7890",
                "email": "events@oceanview.com",
                "website": "www.oceanviewpavilion.com"
            }
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Metropolitan Conference Center",
            "description": "Modern facility ideal for corporate events and conferences with state-of-the-art technology",
            "location": "Business District, Chicago",
            "venue_type": "Conference Center",
            "capacity": 500,
            "price_per_person": 95.0,
            "amenities": ["AV Equipment", "WiFi", "Catering", "Parking", "Business Center", "Multiple Rooms"],
            "rating": 4.5,
            "images": ["https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop"],
            "contact_info": {
                "phone": "(555) 321-0987",
                "email": "corporate@metroconf.com",
                "website": "www.metroconference.com"
            }
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Rustic Barn Venue",
            "description": "Charming rustic barn with vintage decor and countryside views",
            "location": "Countryside, Texas",
            "venue_type": "Barn",
            "capacity": 120,
            "price_per_person": 110.0,
            "amenities": ["Rustic Decor", "Countryside Views", "Parking", "Outdoor Space", "Fire Pit"],
            "rating": 4.6,
            "images": ["https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=800&h=600&fit=crop"],
            "contact_info": {
                "phone": "(555) 555-0123",
                "email": "info@rusticbarn.com",
                "website": "www.rusticbarnvenue.com"
            }
        }
    ]
    
    # Sample Vendors
    vendors = [
        {
            "id": str(uuid.uuid4()),
            "name": "Elite Catering Services",
            "service_type": "Catering",
            "description": "Premium catering for all types of events with customizable menus and professional service",
            "location": "New York, NY",
            "price_range": {"min": 50.0, "max": 150.0},
            "rating": 4.8,
            "portfolio": ["https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 123-4567",
                "email": "info@elitecatering.com",
                "website": "www.elitecatering.com"
            },
            "availability": ["weekdays", "weekends"]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Elegant Decorations",
            "service_type": "Decoration",
            "description": "Beautiful event decorations that transform any space into magic with attention to detail",
            "location": "Los Angeles, CA",
            "price_range": {"min": 800.0, "max": 5000.0},
            "rating": 4.9,
            "portfolio": ["https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 987-6543",
                "email": "hello@elegantdecorations.com",
                "website": "www.elegantdecorations.com"
            },
            "availability": ["weekends", "holidays"]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Capture Moments Photography",
            "service_type": "Photography",
            "description": "Professional wedding and event photography with artistic vision and candid moments",
            "location": "Chicago, IL",
            "price_range": {"min": 1200.0, "max": 3500.0},
            "rating": 4.7,
            "portfolio": ["https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 456-7890",
                "email": "book@capturemoments.com",
                "website": "www.capturemomentsphoto.com"
            },
            "availability": ["weekends", "weekdays"]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sound & Rhythm DJ Services",
            "service_type": "Music/DJ",
            "description": "Professional DJ services with extensive music library and top-quality equipment",
            "location": "Miami, FL",
            "price_range": {"min": 600.0, "max": 2000.0},
            "rating": 4.6,
            "portfolio": ["https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 321-0987",
                "email": "dj@soundrhythm.com",
                "website": "www.soundrhythmdj.com"
            },
            "availability": ["weekends", "weekdays", "holidays"]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Bloom & Petals Florist",
            "service_type": "Flowers",
            "description": "Fresh flowers and beautiful arrangements for every occasion with creative designs",
            "location": "Seattle, WA",
            "price_range": {"min": 300.0, "max": 2500.0},
            "rating": 4.8,
            "portfolio": ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 654-3210",
                "email": "orders@bloompetals.com",
                "website": "www.bloompetals.com"
            },
            "availability": ["weekdays", "weekends"]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Luxury Transportation Co.",
            "service_type": "Transportation",
            "description": "Premium transportation services with luxury vehicles and professional chauffeurs",
            "location": "San Francisco, CA",
            "price_range": {"min": 200.0, "max": 800.0},
            "rating": 4.5,
            "portfolio": ["https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 111-2233",
                "email": "book@luxurytrans.com",
                "website": "www.luxurytransportation.com"
            },
            "availability": ["weekdays", "weekends", "holidays"]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Creative Videography Studio",
            "service_type": "Videography",
            "description": "Cinematic event videography capturing every special moment with artistic storytelling",
            "location": "Austin, TX",
            "price_range": {"min": 1500.0, "max": 4000.0},
            "rating": 4.7,
            "portfolio": ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 777-8888",
                "email": "info@creativevideo.com",
                "website": "www.creativevideostudio.com"
            },
            "availability": ["weekends", "weekdays"]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Perfect Makeup Artists",
            "service_type": "Makeup Artist",
            "description": "Professional makeup and hair styling for special events with premium products",
            "location": "Las Vegas, NV",
            "price_range": {"min": 250.0, "max": 800.0},
            "rating": 4.9,
            "portfolio": ["https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 999-0000",
                "email": "beauty@perfectmakeup.com",
                "website": "www.perfectmakeupartists.com"
            },
            "availability": ["weekends", "weekdays"]
        }
    ]
    
    # Insert data
    await db.venues.insert_many(venues)
    await db.vendors.insert_many(vendors)
    
    print(f"✅ Inserted {len(venues)} venues")
    print(f"✅ Inserted {len(vendors)} vendors")
    print("🎉 Database seeding completed!")

if __name__ == "__main__":
    asyncio.run(seed_database())