import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid
import bcrypt

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'urevent360_db')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def create_users():
    print("🌱 Creating basic users...")
    
    # Clear existing users
    await db.users.delete_many({})
    
    # Create basic users
    users = [
        {
            "id": str(uuid.uuid4()),
            "name": "Sarah Johnson",
            "email": "sarah.johnson@email.com",
            "mobile": "+1555123456",
            "role": "user",
            "hashed_password": get_password_hash("SecurePass123"),
            "created_at": datetime.utcnow(),
            "profile_completed": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Carla Baquero",
            "email": "carladbaquero@gmail.com",
            "mobile": "+1555987654",
            "role": "user",
            "hashed_password": get_password_hash("carla123"),
            "created_at": datetime.utcnow(),
            "profile_completed": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Admin User",
            "email": "admin@urevent360.com",
            "mobile": "+1234567890",
            "role": "admin",
            "hashed_password": get_password_hash("admin123"),
            "created_at": datetime.utcnow(),
            "profile_completed": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Demo Vendor Company",
            "email": "vendor@example.com",
            "mobile": "+0987654321",
            "role": "vendor",
            "hashed_password": get_password_hash("vendor123"),
            "created_at": datetime.utcnow(),
            "profile_completed": True
        },
        {
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
    ]
    
    # Insert users
    await db.users.insert_many(users)
    
    print(f"✅ Created {len(users)} users:")
    for user in users:
        print(f"- {user['email']} / {user['hashed_password'][:8]}... (role: {user['role']})")

if __name__ == "__main__":
    asyncio.run(create_users())