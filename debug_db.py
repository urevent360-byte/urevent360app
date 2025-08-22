#!/usr/bin/env python3

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

# Database configuration
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'urevent360_db')

async def debug_database():
    """Debug database connection and user data"""
    
    print(f"🔍 Debugging database connection...")
    print(f"   MONGO_URL: {MONGO_URL}")
    print(f"   DB_NAME: {DB_NAME}")
    
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Database connection successful")
        
        # List all databases
        db_list = await client.list_database_names()
        print(f"📚 Available databases: {db_list}")
        
        # List collections in the target database
        collections = await db.list_collection_names()
        print(f"📂 Collections in {DB_NAME}: {collections}")
        
        if 'users' in collections:
            # Count users
            user_count = await db.users.count_documents({})
            print(f"👥 Total users in database: {user_count}")
            
            # List all users
            users = []
            async for user in db.users.find({}, {"email": 1, "name": 1, "role": 1}):
                users.append(user)
            
            print("📋 Users in database:")
            for user in users:
                print(f"   - {user.get('email', 'No email')} ({user.get('name', 'No name')}) - {user.get('role', 'No role')}")
        else:
            print("❌ Users collection not found")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    asyncio.run(debug_database())