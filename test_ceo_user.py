#!/usr/bin/env python3
import asyncio
import os
import sys
import uuid
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Add backend to path
sys.path.append('/app/backend')

DATABASE_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = "urevent_db"

async def create_ceo_user():
    client = AsyncIOMotorClient(DATABASE_URL)
    db = client[DATABASE_NAME]
    
    try:
        # Check if CEO already exists
        existing_ceo = await db.users.find_one({"role": "ROLE_CEO"})
        if existing_ceo:
            print(f"✅ CEO already exists: {existing_ceo['name']} ({existing_ceo['email']})")
            return existing_ceo
        
        # Create CEO user (Darwin H. Baquero)
        ceo_data = {
            "id": str(uuid.uuid4()),
            "name": "Darwin H. Baquero",
            "email": "darwin@urevent360.com",
            "password_hash": bcrypt.hashpw("ceo123456".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            "role": "ROLE_CEO",
            "mobile": "+1234567890",
            "created_at": datetime.utcnow(),
            "profile_completed": True,
            "two_factor_enabled": True,
            "two_factor_secret": "JBSWY3DPEHPK3PXP",  # Base32 secret for testing
            "admin_level": "super_admin",
            "permissions": ["all"]
        }
        
        await db.users.insert_one(ceo_data)
        print(f"✅ CEO user created: {ceo_data['name']} ({ceo_data['email']})")
        print(f"📧 Email: {ceo_data['email']}")
        print(f"🔐 Password: ceo123456")
        print(f"🔑 2FA Secret: {ceo_data['two_factor_secret']}")
        
        # Create CEO office record
        ceo_office = {
            "user_id": ceo_data["id"],
            "started_at": datetime.utcnow(),
            "ended_at": None,
            "appointment_reason": "initial_appointment"
        }
        
        await db.ceo_office.insert_one(ceo_office)
        print(f"✅ CEO office record created")
        
        # Create an admin user for testing succession
        admin_data = {
            "id": str(uuid.uuid4()),
            "name": "Test Admin",
            "email": "admin@urevent360.com",
            "password_hash": bcrypt.hashpw("admin123456".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            "role": "ROLE_ADMIN",
            "mobile": "+1234567891",
            "created_at": datetime.utcnow(),
            "profile_completed": True,
            "two_factor_enabled": True,
            "two_factor_secret": "MFRGG43FOQYTEMJR",  # Base32 secret for testing
            "admin_level": "admin",
            "permissions": ["user_management", "reports"]
        }
        
        await db.users.insert_one(admin_data)
        print(f"✅ Admin user created for testing: {admin_data['name']} ({admin_data['email']})")
        print(f"📧 Admin Email: {admin_data['email']}")
        print(f"🔐 Admin Password: admin123456")
        
        return ceo_data
        
    except Exception as e:
        print(f"❌ Error creating CEO user: {e}")
        return None
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_ceo_user())