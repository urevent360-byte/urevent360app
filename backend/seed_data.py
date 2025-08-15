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
    
    # Create client user if not exists
    client_user = await db.users.find_one({"email": "sarah.johnson@email.com"})
    if not client_user:
        client_data = {
            "id": str(uuid.uuid4()),
            "name": "Sarah Johnson",
            "email": "sarah.johnson@email.com",
            "mobile": "+1555123456",
            "role": "user",  # 'user' role for clients
            "hashed_password": get_password_hash("SecurePass123"),
            "created_at": datetime.utcnow(),
            "profile_completed": True
        }
        await db.users.insert_one(client_data)
        print("✅ Client user created: sarah.johnson@email.com / SecurePass123")
    else:
        print("ℹ️ Client user already exists")
    
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
            "cultural_specializations": ["american", "hispanic", "asian"],
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
            "cultural_specializations": ["indian", "american", "middle_eastern"],
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
            "cultural_specializations": ["african", "american", "other"],
            "experience_years": 9,
            "verified": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Spice Route Catering",
            "service_type": "Catering",
            "description": "Authentic Indian cuisine specialists for weddings and celebrations with traditional recipes",
            "location": "San Francisco, CA",
            "price_range": {"min": 35.0, "max": 120.0},
            "rating": 4.9,
            "reviews_count": 145,
            "portfolio": ["https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 678-9012",
                "email": "events@spiceroutecatering.com",
                "website": "www.spiceroutecatering.com"
            },
            "availability": ["weekdays", "weekends"],
            "specialties": ["Indian Cuisine", "Vegetarian Options", "Traditional Sweets", "Live Cooking"],
            "cultural_specializations": ["indian", "asian"],
            "experience_years": 12,
            "verified": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Mariachi & More Entertainment",
            "service_type": "Music/DJ",
            "description": "Traditional Hispanic music and entertainment for authentic cultural celebrations",
            "location": "Los Angeles, CA",
            "price_range": {"min": 800.0, "max": 2500.0},
            "rating": 4.8,
            "reviews_count": 98,
            "portfolio": ["https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop"],
            "contact_info": {
                "phone": "(555) 789-0123",
                "email": "book@mariachiandmore.com",
                "website": "www.mariachiandmore.com"
            },
            "availability": ["weekends", "holidays"],
            "specialties": ["Mariachi Music", "Traditional Dance", "Cultural Entertainment", "Bilingual Services"],
            "cultural_specializations": ["hispanic"],
            "experience_years": 15,
            "verified": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    # Insert data
    await db.venues.insert_many(venues)
    await db.vendors.insert_many(vendors)
    
    print(f"✅ Inserted {len(venues)} venues")
    print(f"✅ Inserted {len(vendors)} vendors")
    
    # Create sample vendor bookings and payments for testing
    print("🎯 Creating sample vendor bookings and payments...")
    
    # Get a sample event to create bookings for
    sample_event = await db.events.find_one({"user_id": admin_user["id"]})
    if sample_event:
        # Get some vendors for bookings
        catering_vendor = await db.vendors.find_one({"service_type": "Catering"})
        photo_vendor = await db.vendors.find_one({"service_type": "Photography"})
        decoration_vendor = await db.vendors.find_one({"service_type": "Decoration"})
        
        sample_bookings = []
        sample_invoices = []
        sample_payments = []
        
        if catering_vendor:
            booking_id = str(uuid.uuid4())
            invoice_id = str(uuid.uuid4())
            
            # Catering booking
            booking = {
                "id": booking_id,
                "event_id": sample_event["id"],
                "vendor_id": catering_vendor["id"],
                "service_details": {
                    "service_type": "Wedding Catering",
                    "guest_count": 150,
                    "menu_type": "Indian Cuisine",
                    "includes": ["Appetizers", "Main Course", "Desserts", "Beverages"]
                },
                "total_cost": 12000.0,
                "deposit_required": 3600.0,  # 30% deposit
                "deposit_paid": 3600.0,
                "total_paid": 3600.0,
                "final_due_date": datetime(2024, 11, 15),
                "booking_status": "confirmed",
                "payment_status": "deposit_paid",
                "invoice_id": invoice_id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            sample_bookings.append(booking)
            
            # Catering invoice
            invoice = {
                "id": invoice_id,
                "vendor_id": catering_vendor["id"],
                "event_id": sample_event["id"],
                "total_amount": 12000.0,
                "deposit_amount": 3600.0,
                "deposit_paid": True,
                "final_amount": 8400.0,
                "final_due_date": datetime(2024, 11, 15),
                "status": "partially_paid",
                "items": [
                    {"description": "Indian Wedding Catering for 150 guests", "quantity": 150, "rate": 80.0, "amount": 12000.0}
                ],
                "terms": "Deposit required to confirm booking. Final payment due 7 days before event.",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            sample_invoices.append(invoice)
            
            # Deposit payment
            payment = {
                "id": str(uuid.uuid4()),
                "event_id": sample_event["id"],
                "vendor_id": catering_vendor["id"],
                "amount": 3600.0,
                "payment_type": "deposit",
                "payment_method": "card",
                "payment_date": datetime.utcnow() - timedelta(days=7),
                "status": "completed",
                "description": "Deposit payment for catering services",
                "transaction_id": "txn_" + str(uuid.uuid4())[:8],
                "created_at": datetime.utcnow()
            }
            sample_payments.append(payment)
        
        if photo_vendor:
            booking_id = str(uuid.uuid4())
            invoice_id = str(uuid.uuid4())
            
            # Photography booking
            booking = {
                "id": booking_id,
                "event_id": sample_event["id"],
                "vendor_id": photo_vendor["id"],
                "service_details": {
                    "service_type": "Wedding Photography",
                    "hours": 8,
                    "includes": ["Ceremony Photos", "Reception Photos", "Edited Photos", "Digital Gallery"]
                },
                "total_cost": 2500.0,
                "deposit_required": 750.0,  # 30% deposit
                "deposit_paid": 750.0,
                "total_paid": 2500.0,  # Fully paid
                "final_due_date": datetime(2024, 11, 20),
                "booking_status": "confirmed",
                "payment_status": "fully_paid",
                "invoice_id": invoice_id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            sample_bookings.append(booking)
            
            # Photography invoice
            invoice = {
                "id": invoice_id,
                "vendor_id": photo_vendor["id"],
                "event_id": sample_event["id"],
                "total_amount": 2500.0,
                "deposit_amount": 750.0,
                "deposit_paid": True,
                "final_amount": 1750.0,
                "final_due_date": datetime(2024, 11, 20),
                "status": "fully_paid",
                "items": [
                    {"description": "Wedding Photography Package - 8 hours", "quantity": 1, "rate": 2500.0, "amount": 2500.0}
                ],
                "terms": "Full payment received. Thank you for your business!",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            sample_invoices.append(invoice)
            
            # Photography payments
            deposit_payment = {
                "id": str(uuid.uuid4()),
                "event_id": sample_event["id"],
                "vendor_id": photo_vendor["id"],
                "amount": 750.0,
                "payment_type": "deposit",
                "payment_method": "card",
                "payment_date": datetime.utcnow() - timedelta(days=14),
                "status": "completed",
                "description": "Deposit payment for photography services",
                "transaction_id": "txn_" + str(uuid.uuid4())[:8],
                "created_at": datetime.utcnow()
            }
            
            final_payment = {
                "id": str(uuid.uuid4()),
                "event_id": sample_event["id"],
                "vendor_id": photo_vendor["id"],
                "amount": 1750.0,
                "payment_type": "final",
                "payment_method": "bank_transfer",
                "payment_date": datetime.utcnow() - timedelta(days=3),
                "status": "completed",
                "description": "Final payment for photography services",
                "transaction_id": "txn_" + str(uuid.uuid4())[:8],
                "created_at": datetime.utcnow()
            }
            sample_payments.extend([deposit_payment, final_payment])
        
        if decoration_vendor:
            booking_id = str(uuid.uuid4())
            invoice_id = str(uuid.uuid4())
            
            # Decoration booking (pending payment)
            booking = {
                "id": booking_id,
                "event_id": sample_event["id"],
                "vendor_id": decoration_vendor["id"],
                "service_details": {
                    "service_type": "Wedding Decoration",
                    "theme": "Indian Traditional",
                    "includes": ["Floral Arrangements", "Stage Decoration", "Table Settings", "Lighting"]
                },
                "total_cost": 4500.0,
                "deposit_required": 1350.0,  # 30% deposit
                "deposit_paid": 0.0,
                "total_paid": 0.0,
                "final_due_date": datetime(2024, 11, 25),
                "booking_status": "confirmed",
                "payment_status": "pending",
                "invoice_id": invoice_id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            sample_bookings.append(booking)
            
            # Decoration invoice
            invoice = {
                "id": invoice_id,
                "vendor_id": decoration_vendor["id"],
                "event_id": sample_event["id"],
                "total_amount": 4500.0,
                "deposit_amount": 1350.0,
                "deposit_paid": False,
                "final_amount": 3150.0,
                "final_due_date": datetime(2024, 11, 25),
                "status": "pending",
                "items": [
                    {"description": "Indian Traditional Wedding Decoration Package", "quantity": 1, "rate": 4500.0, "amount": 4500.0}
                ],
                "terms": "30% deposit required to start work. Remaining balance due on completion.",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            sample_invoices.append(invoice)
        
        # Insert sample data
        if sample_bookings:
            await db.vendor_bookings.insert_many(sample_bookings)
            print(f"✅ Inserted {len(sample_bookings)} sample vendor bookings")
        
        if sample_invoices:
            await db.invoices.insert_many(sample_invoices)
            print(f"✅ Inserted {len(sample_invoices)} sample invoices")
        
        if sample_payments:
            await db.payments.insert_many(sample_payments)
            print(f"✅ Inserted {len(sample_payments)} sample payments")
    
    print("🎉 Database seeding completed!")

if __name__ == "__main__":
    asyncio.run(seed_database())