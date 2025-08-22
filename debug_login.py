#!/usr/bin/env python3

import asyncio
import bcrypt
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

def verify_password_bcrypt(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def verify_password_passlib(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)

async def debug_login():
    """Debug the login issue"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔍 Debugging login for carladbaquero@gmail.com...")
    
    # Find user
    user = await db.users.find_one({"email": "carladbaquero@gmail.com"})
    if not user:
        print("❌ User not found in database")
        client.close()
        return
    
    print(f"✅ User found: {user['email']}")
    print(f"   Name: {user.get('name', 'N/A')}")
    print(f"   Role: {user.get('role', 'N/A')}")
    print(f"   Password hash: {user['password_hash'][:50]}...")
    
    # Test password verification
    test_password = "carla123"
    
    # Method 1: bcrypt directly (as used in backend)
    try:
        bcrypt_result = verify_password_bcrypt(test_password, user['password_hash'])
        print(f"   Bcrypt verification: {'✅ PASS' if bcrypt_result else '❌ FAIL'}")
    except Exception as e:
        print(f"   Bcrypt verification: ❌ ERROR - {e}")
    
    # Method 2: passlib (as used in user creation)
    try:
        passlib_result = verify_password_passlib(test_password, user['password_hash'])
        print(f"   Passlib verification: {'✅ PASS' if passlib_result else '❌ FAIL'}")
    except Exception as e:
        print(f"   Passlib verification: ❌ ERROR - {e}")
    
    # Test creating new hash with bcrypt directly
    print("\n🔄 Testing hash compatibility...")
    bcrypt_hash = bcrypt.hashpw(test_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    print(f"   New bcrypt hash: {bcrypt_hash[:50]}...")
    
    bcrypt_verify = verify_password_bcrypt(test_password, bcrypt_hash)
    print(f"   New bcrypt verify: {'✅ PASS' if bcrypt_verify else '❌ FAIL'}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_login())