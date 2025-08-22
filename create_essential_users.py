#!/usr/bin/env python3
"""
Create essential users for URevent 360 platform access
This fixes the authentication issue by seeding the required users
"""

import os
import asyncio
import bcrypt
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# Database configuration
DATABASE_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = "urevent_db"

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

async def create_essential_users():
    """Create essential test users for platform access"""
    
    # Connect to database
    client = AsyncIOMotorClient(DATABASE_URL)
    db = client[DATABASE_NAME]
    
    # Essential users to create
    essential_users = [
        {
            "email": "carladbaquero@gmail.com",
            "password": "carla123",
            "name": "Carla Baquero", 
            "role": "client",
            "mobile": "+14075330970"
        },
        {
            "email": "sarah.johnson@email.com", 
            "password": "SecurePass123",
            "name": "Sarah Johnson",
            "role": "client",
            "mobile": "+15551234567"
        },
        {
            "email": "admin@urevent360.com",
            "password": "admin123", 
            "name": "Admin User",
            "role": "admin",
            "admin_level": "super_admin",
            "permissions": ["all"]
        },
        {
            "email": "vendor@example.com",
            "password": "vendor123",
            "name": "Vendor User", 
            "role": "vendor",
            "company_name": "Premium Event Services",
            "service_types": ["catering", "decoration", "photography"],
            "verification_status": "verified"
        },
        {
            "email": "employee@example.com",
            "password": "employee123", 
            "name": "Employee User",
            "role": "employee",
            "department": "Operations",
            "position": "Event Coordinator",
            "status": "active"
        }
    ]
    
    created_count = 0
    updated_count = 0
    
    for user_data in essential_users:
        email = user_data["email"]
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": email})
        
        if existing_user:
            print(f"✅ User {email} already exists")
            updated_count += 1
        else:
            # Create new user document
            user_doc = {
                "id": str(uuid.uuid4()),
                "name": user_data["name"],
                "email": user_data["email"],
                "password_hash": hash_password(user_data["password"]),
                "role": user_data["role"],
                "mobile": user_data.get("mobile"),
                "created_at": datetime.utcnow(),
                "profile_completed": True
            }
            
            # Add role-specific fields
            if user_data["role"] == "admin":
                user_doc["admin_level"] = user_data.get("admin_level")
                user_doc["permissions"] = user_data.get("permissions", [])
            elif user_data["role"] == "vendor":
                user_doc["company_name"] = user_data.get("company_name") 
                user_doc["service_types"] = user_data.get("service_types", [])
                user_doc["verification_status"] = user_data.get("verification_status", "pending")
            elif user_data["role"] == "employee":
                user_doc["department"] = user_data.get("department")
                user_doc["position"] = user_data.get("position")  
                user_doc["status"] = user_data.get("status", "active")
                user_doc["hire_date"] = datetime.utcnow()
                user_doc["employee_id"] = f"EMP{str(uuid.uuid4())[:8].upper()}"
            
            # Insert user
            await db.users.insert_one(user_doc)
            print(f"🎉 Created user: {email} ({user_data['role']})")
            created_count += 1
    
    # Verify creation
    total_users = await db.users.count_documents({})
    
    print(f"\n📊 SUMMARY:")
    print(f"   Created: {created_count} new users")
    print(f"   Existing: {updated_count} users")
    print(f"   Total users in database: {total_users}")
    
    print(f"\n🔐 LOGIN CREDENTIALS:")
    for user_data in essential_users:
        print(f"   {user_data['role'].upper()}: {user_data['email']} / {user_data['password']}")
    
    print(f"\n✅ Authentication system ready for use!")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(create_essential_users())