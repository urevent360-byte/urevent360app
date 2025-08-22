#!/usr/bin/env python3

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

# Database configuration
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'urevent360_db')

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_carla_user():
    """Create the Carla user for testing"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔧 Creating Carla user for authentication...")
    
    # User data
    user_data = {
        "name": "Carla Baquero",
        "email": "carladbaquero@gmail.com",
        "password_hash": pwd_context.hash("carla123"),
        "role": "client",
        "id": "carla-baquero-client-001"
    }
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data["email"]})
    if existing_user:
        print(f"✅ User {user_data['email']} already exists")
    else:
        # Insert user
        result = await db.users.insert_one(user_data)
        print(f"✅ Created user: {user_data['email']} / carla123 (role: {user_data['role']})")
    
    # Verify the user
    user = await db.users.find_one({"email": user_data["email"]})
    if user:
        print(f"🔍 Verified user: {user['email']} (role: {user['role']}) - Password hash: {'✅' if user['password_hash'] else '❌'}")
    else:
        print(f"❌ Failed to create/verify user: {user_data['email']}")
    
    client.close()
    print("🎉 Carla user creation completed!")

if __name__ == "__main__":
    asyncio.run(create_carla_user())