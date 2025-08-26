#!/usr/bin/env python3
"""
Create test users for authentication debugging
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import bcrypt
import uuid
from datetime import datetime

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client['urevent360_db']

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def create_test_users():
    print("🔧 Creating test users for authentication debugging...")
    
    # Test users to create
    test_users = [
        {
            "name": "Carla Baquero",
            "email": "carladbaquero@gmail.com",
            "password": "carla123",
            "role": "client"
        },
        {
            "name": "Sarah Johnson",
            "email": "sarah.johnson@email.com",
            "password": "SecurePass123",
            "role": "client"
        },
        {
            "name": "Admin User",
            "email": "admin@urevent360.com", 
            "password": "admin123",
            "role": "admin"
        },
        {
            "name": "Demo Vendor",
            "email": "vendor@example.com",
            "password": "vendor123", 
            "role": "vendor"
        },
        {
            "name": "Demo Employee",
            "email": "employee@example.com",
            "password": "employee123",
            "role": "employee"
        }
    ]
    
    for user_info in test_users:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_info["email"]})
        
        if existing_user:
            print(f"ℹ️  User {user_info['email']} already exists")
            # Update password hash if needed
            if "password_hash" not in existing_user:
                await db.users.update_one(
                    {"email": user_info["email"]},
                    {"$set": {"password_hash": hash_password(user_info["password"])}}
                )
                print(f"✅ Updated password_hash for {user_info['email']}")
        else:
            # Create new user
            user_data = {
                "id": str(uuid.uuid4()),
                "name": user_info["name"],
                "email": user_info["email"],
                "password_hash": hash_password(user_info["password"]),
                "mobile": None,
                "role": user_info["role"],
                "created_at": datetime.utcnow(),
                "profile_completed": True
            }
            
            await db.users.insert_one(user_data)
            print(f"✅ Created user: {user_info['email']} / {user_info['password']} (role: {user_info['role']})")
    
    # Verify all users
    print("\n🔍 Verifying created users:")
    users = await db.users.find({}).to_list(10)
    for user in users:
        has_password = "password_hash" in user
        print(f"- {user.get('email')} (role: {user.get('role')}) - Password hash: {'✅' if has_password else '❌'}")
    
    print(f"\n🎉 Database now has {len(users)} users ready for authentication testing!")

if __name__ == "__main__":
    asyncio.run(create_test_users())