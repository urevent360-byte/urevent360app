import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timedelta
import uuid

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'urevent360_db')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

async def create_sample_event():
    print("🌱 Creating sample event for testing...")
    
    # Get the Carla user
    carla_user = await db.users.find_one({"email": "carladbaquero@gmail.com"})
    if not carla_user:
        print("❌ Carla user not found")
        return
    
    # Create a sample event
    event_id = "dbf4c4e9-6be2-4123-bb82-7a4bfddda972"  # Use the ID from test results
    
    sample_event = {
        "id": event_id,
        "user_id": carla_user["id"],
        "name": "Carla Pacheco",
        "event_type": "Sweet 16",
        "date": datetime.utcnow() + timedelta(days=30),  # datetime object, not string
        "time": "18:00",
        "location": "Orlando",
        "guest_count": 90,
        "budget": 9000.0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "wizard_answers": {
            "basic_info": {
                "name": "Carla Pacheco",
                "location": "Orlando",
                "date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
                "time": "18:00"
            },
            "event_type": "Sweet 16",
            "venue_preferences": ["Hotel/Banquet Hall"],
            "core_services": ["Catering", "Decoration", "Photography", "Lighting", "Music/DJ", "Videography", "Cleaning", "Transportation"],
            "extras": ["Photo Booths", "Cold Spark Machines"],
            "cultural_style": ["American"],
            "guest_count": 90,
            "budget_target": 9000.0
        },
        "status": "planning"
    }
    
    # Delete existing event with same ID and insert new one
    await db.events.delete_one({"id": event_id})
    await db.events.insert_one(sample_event)
    
    print(f"✅ Created sample event: {event_id}")
    print(f"Event: {sample_event['name']} ({sample_event['event_type']})")
    print(f"Date: {sample_event['date']}")
    print(f"Location: {sample_event['location']}")

if __name__ == "__main__":
    asyncio.run(create_sample_event())