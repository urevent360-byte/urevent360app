import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
import uuid
from passlib.context import CryptContext

# Load environment variables
load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_database():
    print("🌱 Seeding database with sample data...")
    
    # Clear existing data
    await db.venues.delete_many({})
    await db.vendors.delete_many({})
    
    # Create admin user if not exists
    admin_user = await db.users.find_one({"email": "admin@urevent360.com"})
    if not admin_user:
        admin_data = {
            "id": str(uuid.uuid4()),
            "name": "Admin User",
            "email": "admin@urevent360.com",
            "mobile": "+1234567890",
            "role": "admin",
            "hashed_password": get_password_hash("admin123"),
            "created_at": datetime.utcnow(),
            "profile_completed": True
        }
        await db.users.insert_one(admin_data)
        print("✅ Admin user created: admin@urevent360.com / admin123")
    else:
        print("ℹ️ Admin user already exists")
    
    # Create vendor user if not exists
    vendor_user = await db.users.find_one({"email": "vendor@example.com"})
    if not vendor_user:
        vendor_data = {
            "id": str(uuid.uuid4()),
            "name": "Demo Vendor Company",
            "email": "vendor@example.com",
            "mobile": "+0987654321",
            "role": "vendor",
            "hashed_password": get_password_hash("vendor123"),
            "created_at": datetime.utcnow(),
            "profile_completed": True
        }
        await db.users.insert_one(vendor_data)
        print("✅ Vendor user created: vendor@example.com / vendor123")
    else:
        print("ℹ️ Vendor user already exists")
    
    # Create employee user if not exists
    employee_user = await db.users.find_one({"email": "employee@example.com"})
    if not employee_user:
        employee_data = {
            "id": str(uuid.uuid4()),
            "name": "Demo Employee",
            "email": "employee@example.com",
            "mobile": "+1122334455",
            "role": "employee",
            "hashed_password": get_password_hash("employee123"),
            "created_at": datetime.utcnow(),
            "profile_completed": True,
            "employee_info": {
                "employee_id": "EMP001",
                "department": "Event Operations",
                "position": "Event Coordinator",
                "hire_date": datetime.utcnow().isoformat(),
                "manager_id": "vendor@example.com",
                "status": "active"
            }
        }
        await db.users.insert_one(employee_data)
        print("✅ Employee user created: employee@example.com / employee123")
    else:
        print("ℹ️ Employee user already exists")
    
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
    
    # Sample Vendors with enhanced data
    vendors = [
        {
            "id": str(uuid.uuid4()),
            "name": "Elite Catering Services",
            "service_type": "Catering",
            "description": "Premium catering services with farm-to-table ingredients and personalized menus for all occasions",
            "location": "New York, NY",
            "price_range": {"min": 50.0, "max": 200.0},
            "rating": 4.8,
            "reviews_count": 127,
            "portfolio": ["https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 123-4567",
                "email": "info@elitecatering.com",
                "website": "www.elitecatering.com"
            },
            "availability": ["weekdays", "weekends"],
            "specialties": ["Wedding Catering", "Corporate Events", "Fine Dining", "Dietary Accommodations"],
            "cultural_specializations": ["american", "jewish", "other"],
            "experience_years": 8,
            "verified": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Elegant Decorations",
            "service_type": "Decoration",
            "description": "Beautiful event decorations that transform any space into magic with attention to detail",
            "location": "Los Angeles, CA",
            "price_range": {"min": 800.0, "max": 5000.0},
            "rating": 4.9,
            "reviews_count": 89,
            "portfolio": ["https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 987-6543",
                "email": "hello@elegantdecorations.com",
                "website": "www.elegantdecorations.com"
            },
            "availability": ["weekends", "holidays"],
            "specialties": ["Wedding Decor", "Theme Parties", "Corporate Styling", "Floral Arrangements"],
            "experience_years": 6,
            "verified": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Capture Moments Photography",
            "service_type": "Photography",
            "description": "Professional wedding and event photography with artistic vision and candid moments",
            "location": "Chicago, IL",
            "price_range": {"min": 1200.0, "max": 3500.0},
            "rating": 4.7,
            "reviews_count": 156,
            "portfolio": ["https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 456-7890",
                "email": "book@capturemoments.com",
                "website": "www.capturemomentsphoto.com"
            },
            "availability": ["weekends", "weekdays"],
            "specialties": ["Wedding Photography", "Portrait Sessions", "Event Coverage", "Photo Editing"],
            "experience_years": 10,
            "verified": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sound & Rhythm DJ Services",
            "service_type": "Music/DJ",
            "description": "Professional DJ services with extensive music library and top-quality equipment",
            "location": "Miami, FL",
            "price_range": {"min": 600.0, "max": 2000.0},
            "rating": 4.6,
            "reviews_count": 93,
            "portfolio": ["https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 321-0987",
                "email": "dj@soundrhythm.com",
                "website": "www.soundrhythmdj.com"
            },
            "availability": ["weekends", "holidays"],
            "specialties": ["Wedding DJ", "Corporate Events", "Party Entertainment", "Sound System"],
            "experience_years": 7,
            "verified": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Luxe Transportation",
            "service_type": "Transportation",
            "description": "Premium transportation services with luxury vehicles for special occasions",
            "location": "Las Vegas, NV",
            "price_range": {"min": 200.0, "max": 800.0},
            "rating": 4.5,
            "reviews_count": 67,
            "portfolio": ["https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 654-3210",
                "email": "info@luxetransport.com",
                "website": "www.luxetransportation.com"
            },
            "availability": ["weekdays", "weekends"],
            "specialties": ["Wedding Transport", "Corporate Transfer", "Airport Service", "Luxury Vehicles"],
            "experience_years": 5,
            "verified": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Brilliant Lighting Solutions",
            "service_type": "Lighting",
            "description": "Professional lighting design and setup for events of all sizes",
            "location": "Atlanta, GA",
            "price_range": {"min": 400.0, "max": 1500.0},
            "rating": 4.4,
            "reviews_count": 78,
            "portfolio": ["https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 789-0123",
                "email": "info@brilliantlighting.com",
                "website": "www.brilliantlightingsolutions.com"
            },
            "availability": ["weekends", "weekdays"],
            "specialties": ["Stage Lighting", "Ambient Lighting", "LED Systems", "Light Show"],
            "experience_years": 4,
            "verified": False,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "SecureGuard Event Security",
            "service_type": "Security",
            "description": "Professional security services for events with trained and licensed personnel",
            "location": "Houston, TX",
            "price_range": {"min": 300.0, "max": 1000.0},
            "rating": 4.3,
            "reviews_count": 45,
            "portfolio": ["https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 012-3456",
                "email": "security@secureguard.com",
                "website": "www.secureguardevents.com"
            },
            "availability": ["weekdays", "weekends"],
            "specialties": ["Event Security", "Crowd Control", "VIP Protection", "Access Control"],
            "experience_years": 12,
            "verified": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "CinemaVision Videography",
            "service_type": "Videography",
            "description": "Cinematic videography services capturing your special moments in stunning quality",
            "location": "Seattle, WA",
            "price_range": {"min": 1500.0, "max": 4000.0},
            "rating": 4.8,
            "reviews_count": 82,
            "portfolio": ["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 345-6789",
                "email": "film@cinemavision.com",
                "website": "www.cinemavisionvideo.com"
            },
            "availability": ["weekends", "holidays"],
            "specialties": ["Wedding Videography", "Corporate Videos", "Event Highlights", "Drone Footage"],
            "experience_years": 9,
            "verified": True,
            "created_at": datetime.utcnow()
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