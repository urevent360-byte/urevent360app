from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import os
import bcrypt
import jwt
import pymongo
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from contextlib import asynccontextmanager

# Environment variables
DATABASE_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = "urevent_db"
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

# Security
security = HTTPBearer()

# Database connection
client = AsyncIOMotorClient(DATABASE_URL)
db = client[DATABASE_NAME]

# User Models
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "client"  # admin, vendor, employee, client

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    password_hash: str
    role: str = "client"
    
    # Admin-specific fields
    admin_level: Optional[str] = None  # super_admin, admin, manager
    permissions: List[str] = []
    
    # Vendor-specific fields
    company_name: Optional[str] = None
    service_types: List[str] = []
    business_license: Optional[str] = None
    verification_status: str = "pending"  # pending, verified, suspended
    
    # Employee-specific fields
    employee_id: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    hire_date: Optional[datetime] = None
    manager_id: Optional[str] = None
    status: str = "active"  # active, inactive, terminated
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    profile_completed: bool = False

class UserProfile(BaseModel):
    user_id: str
    bio: Optional[str] = None
    location: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    avatar_url: Optional[str] = None

class EventCreate(BaseModel):
    name: str
    description: Optional[str] = None
    event_type: str  # wedding, corporate, birthday, quinceanera, sweet_16, etc.
    sub_event_type: Optional[str] = None  # For wedding: reception_only, reception_with_ceremony
    cultural_style: Optional[str] = None  # For wedding: indian, american, hispanic, african, asian, middle_eastern, other
    date: datetime
    location: Optional[str] = None
    zipcode: Optional[str] = None
    location_preferences: Optional[Dict[str, Any]] = None  # search_radius, only_exact_location, preferred_areas
    venue_id: Optional[str] = None
    budget: Optional[float] = None
    estimated_budget: Optional[float] = None
    guest_count: Optional[int] = None
    status: str = "planning"  # planning, booked, completed, cancelled
    # Enhanced filtering fields
    preferred_venue_type: Optional[str] = None
    services_needed: Optional[List[str]] = None

class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    description: Optional[str] = None
    event_type: str  # wedding, corporate, birthday, quinceanera, sweet_16, etc.
    sub_event_type: Optional[str] = None  # For wedding: reception_only, reception_with_ceremony
    cultural_style: Optional[str] = None  # For wedding: indian, american, hispanic, african, asian, middle_eastern, other
    date: datetime
    location: Optional[str] = None
    zipcode: Optional[str] = None
    location_preferences: Optional[Dict[str, Any]] = None  # search_radius, only_exact_location, preferred_areas
    venue_id: Optional[str] = None
    venue_name: Optional[str] = None
    venue_address: Optional[str] = None
    venue_contact: Optional[Dict[str, str]] = None
    budget: Optional[float] = None
    estimated_budget: Optional[float] = None
    guest_count: Optional[int] = None
    status: str = "planning"  # planning, booked, completed, cancelled
    requirements: Optional[Dict[str, Any]] = None
    # Enhanced filtering fields
    preferred_venue_type: Optional[str] = None
    services_needed: Optional[List[str]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

class Venue(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    location: str
    venue_type: str  # hotel, restaurant, outdoor, etc.
    capacity: int
    price_per_person: Optional[float] = None
    amenities: List[str] = []
    rating: float = 0.0
    images: List[str] = []
    contact_info: Dict[str, str] = {}

class Vendor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    service_type: str
    location: Optional[str] = None
    price_range: str = "$$"  # $, $$, $$$, $$$$
    rating: float = 0.0
    specialties: List[str] = []
    cultural_specializations: List[str] = []  # indian, hispanic, american, jewish, african, asian, middle_eastern
    contact_info: Dict[str, str] = {}
    
    # Business fields  
    business_name: Optional[str] = None
    license_number: Optional[str] = None
    insurance_info: Optional[Dict[str, Any]] = None
    
    # Pricing fields
    base_price: Optional[float] = None
    price_per_person: Optional[float] = None
    price_per_hour: Optional[float] = None
    minimum_booking: Optional[float] = None
    
    # Availability
    availability: Optional[Dict[str, Any]] = None
    booking_lead_time: Optional[int] = None  # days
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VendorBooking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    vendor_id: str
    vendor_name: str
    service_type: str
    service_name: str
    service_details: Optional[str] = None
    cost: float
    deposit_amount: Optional[float] = None
    deposit_paid: bool = False
    final_payment_due: Optional[datetime] = None
    status: str = "pending"  # pending, confirmed, cancelled, completed
    booking_date: datetime = Field(default_factory=datetime.utcnow)
    event_date: Optional[datetime] = None
    notes: Optional[str] = None
    invoice_id: Optional[str] = None

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    vendor_id: str
    event_id: str
    amount: float
    payment_type: str = "deposit"  # deposit, final, partial
    payment_method: str = "card"  # card, bank_transfer, check, cash
    payment_date: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = None
    reference_number: Optional[str] = None
    status: str = "completed"  # pending, completed, failed, refunded

class CartItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    vendor_id: str
    vendor_name: str
    service_type: str
    service_name: str
    price: float
    quantity: int = 1
    notes: Optional[str] = None
    added_at: datetime = Field(default_factory=datetime.utcnow)

class EventPlannerState(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    current_step: int = 0
    completed_steps: List[int] = []
    cart_items: List[CartItem] = []
    step_data: Dict[str, Any] = {}  # Store step-specific data
    budget_tracking: Dict[str, float] = {
        "set_budget": 0.0,
        "selected_total": 0.0,
        "remaining": 0.0
    }
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

class PlannerScenario(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    name: str
    description: Optional[str] = None
    selected_vendors: Dict[str, str] = {}  # service_type -> vendor_id
    total_cost: float = 0.0
    saved_at: datetime = Field(default_factory=datetime.utcnow)

# Calendar and Appointment Models
class VendorAvailability(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vendor_id: str
    date: datetime
    available_slots: List[Dict[str, str]] = []  # [{"start": "09:00", "end": "17:00"}]
    unavailable_periods: List[Dict[str, str]] = []  # [{"start": "12:00", "end": "13:00", "reason": "lunch"}]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    vendor_id: str
    event_id: Optional[str] = None
    appointment_type: str  # in_person, phone, virtual
    date: datetime
    duration_minutes: int = 60
    location: Optional[str] = None  # For in-person meetings
    phone_number: Optional[str] = None  # For phone calls
    meeting_link: Optional[str] = None  # For virtual meetings (Zoom, Google Meet, etc.)
    status: str = "requested"  # requested, confirmed, completed, cancelled, rescheduled
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    # Vendor response fields
    vendor_response: Optional[str] = None
    vendor_response_at: Optional[datetime] = None
    
    # Client confirmation fields
    client_confirmed: bool = False
    client_confirmed_at: Optional[datetime] = None

class CalendarEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: Optional[str] = None
    event_type: str  # appointment, payment_deadline, event_date, reminder
    date: datetime
    end_date: Optional[datetime] = None
    all_day: bool = False
    location: Optional[str] = None
    related_id: Optional[str] = None  # appointment_id, event_id, etc.
    notification_sent: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Authentication functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def create_jwt_token(user_data: dict) -> str:
    payload = {
        "sub": user_data["email"],
        "user_id": user_data["id"],
        "role": user_data.get("role", "client"),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_jwt_token(token)
    
    user = await db.users.find_one({"email": payload["sub"]})
    if user is None:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    # Convert ObjectId to string for JSON serialization
    user["_id"] = str(user["_id"])
    return user

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting UREVENT 360 Server...")
    yield
    # Shutdown
    print("⭐ UREVENT 360 Server shutting down...")

# FastAPI app
app = FastAPI(
    title="UREVENT 360 API", 
    description="Complete Event Planning Platform",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Router
from fastapi import APIRouter
api_router = APIRouter(prefix="/api")

# Authentication Routes
@api_router.post("/register")
async def register_user(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_dict = user_data.dict()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["password_hash"] = hash_password(user_data.password)
    del user_dict["password"]
    
    await db.users.insert_one(user_dict)
    
    # Create JWT token
    token = create_jwt_token({
        "id": user_dict["id"],
        "email": user_dict["email"],
        "role": user_dict["role"]
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_dict["id"],
            "name": user_dict["name"],
            "email": user_dict["email"],
            "role": user_dict["role"]
        }
    }

@api_router.post("/login")
async def login_user(user_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": user_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create JWT token
    token = create_jwt_token({
        "id": user["id"],
        "email": user["email"],
        "role": user.get("role", "client")
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "client")
        }
    }

@api_router.get("/users/profile")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    # Remove sensitive information
    user_profile = {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user.get("role", "client")
    }
    return user_profile

# Event Routes
@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate, current_user: dict = Depends(get_current_user)):
    event_dict = event_data.dict()
    event_dict["user_id"] = current_user["id"]
    event_dict["id"] = str(uuid.uuid4())
    
    # Enhanced filtering fields are already in EventCreate model, no need to extract from requirements
    
    await db.events.insert_one(event_dict)
    return Event(**event_dict)

@api_router.get("/events", response_model=List[Event])
async def get_events(current_user: dict = Depends(get_current_user)):
    events = await db.events.find({"user_id": current_user["id"]}).to_list(1000)
    return [Event(**event) for event in events]

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return Event(**event)

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, event_data: dict, current_user: dict = Depends(get_current_user)):
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Update event
    event_data["updated_at"] = datetime.utcnow()
    
    # If updating requirements, extract filtering preferences
    if "requirements" in event_data:
        requirements = event_data["requirements"]
        if isinstance(requirements, dict):
            event_data["preferred_venue_type"] = requirements.get("venue_type")
            event_data["services_needed"] = requirements.get("services", [])
    
    await db.events.update_one(
        {"id": event_id, "user_id": current_user["id"]},
        {"$set": event_data}
    )
    
    # Get updated event
    updated_event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    return Event(**updated_event)

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_user: dict = Depends(get_current_user)):
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    try:
        # Delete the event
        result = await db.events.delete_one({"id": event_id, "user_id": current_user["id"]})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Event not found or already deleted")
        
        # Delete associated data (vendor bookings, payments, etc.)
        await db.vendor_bookings.delete_many({"event_id": event_id})
        await db.payments.delete_many({"event_id": event_id})
        await db.event_planner_states.delete_many({"event_id": event_id})
        await db.planner_scenarios.delete_many({"event_id": event_id})
        await db.appointments.delete_many({"event_id": event_id})
        await db.calendar_events.delete_many({"related_id": event_id})
        
        return {
            "message": "Event deleted successfully",
            "deleted_count": result.deleted_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting event: {str(e)}")

@api_router.get("/venues/search")
async def search_venues(
    zip_code: Optional[str] = None,
    city: Optional[str] = None,
    radius: Optional[int] = 25,  # Default 25 miles
    venue_type: Optional[str] = None,
    capacity_min: Optional[int] = None,
    capacity_max: Optional[int] = None,
    budget_min: Optional[float] = None,
    budget_max: Optional[float] = None,
    preferred_venue_type: Optional[str] = None,  # New filtering parameter
    current_user: dict = Depends(get_current_user)
):
    """Search venues based on location and criteria with preference filtering"""
    query = {}
    
    # Location-based search
    zip_to_cities = {
        "10001": ["New York", "NYC", "Manhattan"],
        "90210": ["Beverly Hills", "Los Angeles", "LA"],
        "60601": ["Chicago", "Downtown Chicago"],
        "33101": ["Miami", "Miami Beach"],
        "30301": ["Atlanta", "Downtown Atlanta"]
    }
    
    if zip_code:
        location_terms = [zip_code]
        if zip_code in zip_to_cities:
            location_terms.extend(zip_to_cities[zip_code])
        
        # Create location regex for flexible matching
        location_pattern = '|'.join(location_terms)
        query["location"] = {"$regex": location_pattern, "$options": "i"}
    
    elif city:
        query["location"] = {"$regex": city, "$options": "i"}
    
    # Venue type filter - prioritize preferred venue type if provided
    filter_venue_type = preferred_venue_type or venue_type
    if filter_venue_type and filter_venue_type != 'all':
        # Handle different venue type formats
        venue_type_mappings = {
            "hotel/banquet hall": ["Hotel", "Banquet Hall", "hotel", "banquet"],
            "restaurant": ["Restaurant", "restaurant"],
            "outdoor/garden": ["Garden", "Outdoor", "outdoor", "garden"],
            "community center": ["Community Center", "community"],
            "beach/waterfront": ["Beach", "Waterfront", "beach", "waterfront"],
            "private residence": ["Private", "Residence", "private", "residence"],
            "church/religious venue": ["Church", "Religious", "church", "religious"],
            "conference center": ["Conference Center", "conference"],
            "barn": ["Barn", "barn"]
        }
        
        # Find matching venue types
        search_terms = [filter_venue_type]
        filter_lower = filter_venue_type.lower()
        
        for key, values in venue_type_mappings.items():
            if filter_lower in key.lower() or any(filter_lower in v.lower() for v in values):
                search_terms.extend(values)
        
        # Create regex pattern for venue type matching
        venue_pattern = '|'.join(search_terms)
        query["venue_type"] = {"$regex": venue_pattern, "$options": "i"}
    
    # Capacity filter
    if capacity_min or capacity_max:
        capacity_filter = {}
        if capacity_min:
            capacity_filter["$gte"] = capacity_min
        if capacity_max:
            capacity_filter["$lte"] = capacity_max
        query["capacity"] = capacity_filter
    
    # Budget filter (price per person)
    if budget_min or budget_max:
        budget_filter = {}
        if budget_min:
            budget_filter["$gte"] = budget_min
        if budget_max:
            budget_filter["$lte"] = budget_max
        query["price_per_person"] = budget_filter
    
    venues = await db.venues.find(query).to_list(1000)
    return [Venue(**venue) for venue in venues]

@api_router.post("/events/{event_id}/select-venue")
async def select_venue_for_event(
    event_id: str, 
    venue_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Select a venue for an event"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = {"updated_at": datetime.utcnow()}
    
    if "venue_id" in venue_data:
        # Using existing venue
        venue = await db.venues.find_one({"id": venue_data["venue_id"]})
        if venue:
            update_data.update({
                "venue_id": venue_data["venue_id"],
                "venue_name": venue["name"],
                "venue_address": venue["location"],
                "venue_contact": venue.get("contact_info", {})
            })
    else:
        # Manual venue entry
        update_data.update({
            "venue_name": venue_data.get("venue_name", ""),
            "venue_address": venue_data.get("venue_address", ""),
            "venue_contact": venue_data.get("venue_contact", {})
        })
    
    await db.events.update_one(
        {"id": event_id, "user_id": current_user["id"]},
        {"$set": update_data}
    )
    
    # Get updated event
    updated_event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    return Event(**updated_event)



# Venue Routes
@api_router.get("/venues", response_model=List[Venue])
async def get_venues(
    location: Optional[str] = None,
    venue_type: Optional[str] = None,
    min_capacity: Optional[int] = None,
    max_price: Optional[float] = None
):
    query = {}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if venue_type:
        query["venue_type"] = venue_type
    if min_capacity:
        query["capacity"] = {"$gte": min_capacity}
    if max_price:
        query["price_per_person"] = {"$lte": max_price}
    
    venues = await db.venues.find(query).to_list(1000)
    return [Venue(**venue) for venue in venues]

@api_router.get("/venues/{venue_id}", response_model=Venue)
async def get_venue(venue_id: str):
    venue = await db.venues.find_one({"id": venue_id})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return Venue(**venue)

@api_router.post("/venues", response_model=Venue)
async def create_venue(venue_data: dict, current_user: dict = Depends(get_current_user)):
    """Create a new venue (admin only for testing)"""
    venue_dict = venue_data.copy()
    if "id" not in venue_dict:
        venue_dict["id"] = str(uuid.uuid4())
    
    await db.venues.insert_one(venue_dict)
    return Venue(**venue_dict)

# Enhanced Vendor Routes with Filtering
@api_router.get("/vendors/search")
async def search_vendors(
    budget_min: Optional[float] = None,
    budget_max: Optional[float] = None,
    service_type: Optional[str] = None,
    cultural_style: Optional[str] = None,
    location: Optional[str] = None,
    event_id: Optional[str] = None,
    services_needed: Optional[str] = None,  # New parameter for filtering by needed services
    current_user: dict = Depends(get_current_user)
):
    """Enhanced vendor search with event-specific filtering"""
    query = {}
    
    # Get event details if event_id is provided for contextual filtering
    event_context = None
    if event_id:
        event_context = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    
    # Service type filtering - prioritize services needed from event context
    filter_services = []
    if services_needed:
        filter_services = services_needed.split(',')
    elif event_context and event_context.get("services_needed"):
        filter_services = event_context["services_needed"]
    elif service_type:
        filter_services = [service_type]
    
    if filter_services:
        # Create regex pattern for service type matching
        service_patterns = []
        for service in filter_services:
            service = service.strip().lower()
            # Map frontend service names to backend service types
            service_mappings = {
                "catering": ["catering", "food", "cuisine"],
                "decoration": ["decoration", "decor", "floral"],
                "photography": ["photography", "photo", "photographer"],
                "videography": ["videography", "video", "videographer"],
                "music/dj": ["music", "dj", "audio", "sound"],
                "entertainment": ["entertainment", "performer", "artist"],
                "transportation": ["transportation", "transport", "limo"],
                "security": ["security", "guard"],
                "cleaning": ["cleaning", "cleanup"],
                "lighting": ["lighting", "light"]
            }
            
            # Add the service and its variations
            service_terms = [service]
            for key, values in service_mappings.items():
                if service in key.lower() or any(service in v for v in values):
                    service_terms.extend(values)
            
            service_patterns.extend(service_terms)
        
        if service_patterns:
            service_pattern = '|'.join(service_patterns)
            query["service_type"] = {"$regex": service_pattern, "$options": "i"}
    
    # Budget filtering
    if budget_min is not None or budget_max is not None:
        budget_query = {}
        if budget_min is not None:
            budget_query["$gte"] = budget_min
        if budget_max is not None:
            budget_query["$lte"] = budget_max
        
        # Check both price_per_person and base_price
        query["$or"] = [
            {"price_per_person": budget_query},
            {"base_price": budget_query}
        ]
    
    # Cultural filtering - prioritize from event context
    filter_cultural = cultural_style
    if not filter_cultural and event_context:
        filter_cultural = event_context.get("cultural_style")
    
    if filter_cultural and filter_cultural != "other":
        query["cultural_specializations"] = {"$in": [filter_cultural]}
    
    # Location filtering
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    elif event_context and event_context.get("location"):
        query["location"] = {"$regex": event_context["location"], "$options": "i"}
    
    vendors = await db.vendors.find(query).to_list(1000)
    return [Vendor(**vendor) for vendor in vendors]

@api_router.get("/vendors", response_model=List[Vendor])
async def get_vendors(
    service_type: Optional[str] = None,
    location: Optional[str] = None,
    cultural_style: Optional[str] = None,
    budget_min: Optional[float] = None,
    budget_max: Optional[float] = None
):
    query = {}
    
    if service_type:
        query["service_type"] = {"$regex": service_type, "$options": "i"}
    
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    if cultural_style and cultural_style != "other":
        query["cultural_specializations"] = {"$in": [cultural_style]}
    
    # Budget filtering
    if budget_min is not None or budget_max is not None:
        budget_query = {}
        if budget_min is not None:
            budget_query["$gte"] = budget_min
        if budget_max is not None:
            budget_query["$lte"] = budget_max
        
        # Check both price_per_person and base_price
        query["$or"] = [
            {"price_per_person": budget_query},
            {"base_price": budget_query}
        ]
    
    vendors = await db.vendors.find(query).to_list(1000)
    return [Vendor(**vendor) for vendor in vendors]

@api_router.get("/vendors/{vendor_id}", response_model=Vendor)
async def get_vendor(vendor_id: str):
    vendor = await db.vendors.find_one({"id": vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return Vendor(**vendor)

# Vendor Favorites Routes
@api_router.post("/vendors/{vendor_id}/favorite")
async def toggle_vendor_favorite(vendor_id: str, current_user: dict = Depends(get_current_user)):
    """Toggle vendor as favorite for the current user"""
    user_id = current_user["id"]
    
    # Check if vendor exists
    vendor = await db.vendors.find_one({"id": vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Check if already favorited
    favorite = await db.vendor_favorites.find_one({"user_id": user_id, "vendor_id": vendor_id})
    
    if favorite:
        # Remove from favorites
        await db.vendor_favorites.delete_one({"user_id": user_id, "vendor_id": vendor_id})
        return {"message": "Vendor removed from favorites", "favorited": False}
    else:
        # Add to favorites
        favorite_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "vendor_id": vendor_id,
            "created_at": datetime.utcnow()
        }
        await db.vendor_favorites.insert_one(favorite_data)
        return {"message": "Vendor added to favorites", "favorited": True}

@api_router.get("/vendors/favorites")
async def get_favorite_vendors(current_user: dict = Depends(get_current_user)):
    """Get user's favorite vendors"""
    user_id = current_user["id"]
    
    # Get favorite vendor IDs
    favorites = await db.vendor_favorites.find({"user_id": user_id}).to_list(1000)
    vendor_ids = [fav["vendor_id"] for fav in favorites]
    
    if not vendor_ids:
        return []
    
    # Get vendor details
    vendors = await db.vendors.find({"id": {"$in": vendor_ids}}).to_list(1000)
    return [Vendor(**vendor) for vendor in vendors]

# Message Routes
class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False

@api_router.post("/messages")
async def send_message(message_data: dict, current_user: dict = Depends(get_current_user)):
    message_dict = {
        "id": str(uuid.uuid4()),
        "sender_id": current_user["id"],
        "receiver_id": message_data["receiver_id"],
        "content": message_data["content"],
        "timestamp": datetime.utcnow(),
        "read": False
    }
    
    await db.messages.insert_one(message_dict)
    return Message(**message_dict)

@api_router.get("/messages")
async def get_messages(current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user["id"]},
            {"receiver_id": current_user["id"]}
        ]
    }).sort("timestamp", 1).to_list(1000)
    
    return [Message(**message) for message in messages]

# Budget Calculation Route
@api_router.post("/events/temp/calculate-budget")
async def calculate_temp_budget(requirements: dict, current_user: dict = Depends(get_current_user)):
    """Calculate estimated budget for event planning without creating an event"""
    guest_count = requirements.get("guest_count", 50)
    venue_type = requirements.get("venue_type", "hotel/banquet hall")
    services = requirements.get("services", [])
    
    # Base cost calculation per guest
    base_cost_per_guest = {
        "hotel/banquet hall": 120,
        "restaurant": 100,
        "outdoor/garden": 80,
        "community center": 60,
        "beach/waterfront": 140,
        "private residence": 50,
        "church/religious venue": 40,
        "other": 80
    }
    
    venue_key = venue_type.lower()
    base_cost = guest_count * base_cost_per_guest.get(venue_key, 80)
    
    # Service cost estimations (fixed costs, not per person)
    service_costs = {
        "catering": 2500,
        "decoration": 1500,
        "photography": 1200,
        "videography": 1800,
        "music/dj": 800,
        "entertainment": 400,
        "transportation": 300,
        "security": 200,
        "cleaning": 150,
        "lighting": 500
    }
    
    total_estimated = base_cost
    breakdown = {"base_cost": base_cost}
    
    for service in services:
        service_lower = service.lower()
        if service_lower in service_costs:
            total_estimated += service_costs[service_lower]
            breakdown[service] = service_costs[service_lower]
    
    return {
        "estimated_budget": total_estimated,
        "breakdown": breakdown
    }

@api_router.post("/events/{event_id}/calculate-budget")
async def calculate_budget(event_id: str, requirements: dict, current_user: dict = Depends(get_current_user)):
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Simple budget calculation logic
    base_cost = requirements.get("guest_count", 50) * 100  # $100 per person base
    
    # Add venue cost
    if requirements.get("venue_type"):
        venue_multiplier = {
            "hotel": 1.5,
            "restaurant": 1.2,
            "outdoor": 1.0,
            "banquet": 1.3
        }
        base_cost *= venue_multiplier.get(requirements.get("venue_type"), 1.0)
    
    # Add service costs
    service_costs = {
        "decoration": base_cost * 0.2,
        "catering": base_cost * 0.4,
        "photography": base_cost * 0.15,
        "music": base_cost * 0.1
    }
    
    total_estimated = base_cost
    breakdown = {"base_cost": base_cost}
    
    for service in requirements.get("services", []):
        if service in service_costs:
            total_estimated += service_costs[service]
            breakdown[service] = service_costs[service]
    
    # Update event with estimated budget
    await db.events.update_one(
        {"id": event_id},
        {"$set": {"estimated_budget": total_estimated}}
    )
    
    return {
        "event_id": event_id,
        "estimated_budget": total_estimated,
        "breakdown": breakdown
    }

# Vendor Booking Routes
@api_router.post("/events/{event_id}/vendor-bookings", response_model=VendorBooking)
async def create_vendor_booking(
    event_id: str,
    booking_data: dict,
    current_user: dict = Depends(get_current_user)
):
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Create booking
    booking_dict = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "vendor_id": booking_data["vendor_id"],
        "vendor_name": booking_data["vendor_name"],
        "service_type": booking_data["service_type"],
        "service_name": booking_data["service_name"],
        "service_details": booking_data.get("service_details"),
        "cost": booking_data["cost"],
        "deposit_amount": booking_data.get("deposit_amount", booking_data["cost"] * 0.3),
        "deposit_paid": False,
        "final_payment_due": event["date"],
        "status": "pending",
        "booking_date": datetime.utcnow(),
        "event_date": event["date"],
        "notes": booking_data.get("notes"),
        "invoice_id": f"INV-{str(uuid.uuid4())[:8]}"
    }
    
    await db.vendor_bookings.insert_one(booking_dict)
    return VendorBooking(**booking_dict)

@api_router.get("/events/{event_id}/vendor-bookings")
async def get_event_vendor_bookings(event_id: str, current_user: dict = Depends(get_current_user)):
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    bookings = await db.vendor_bookings.find({"event_id": event_id}).to_list(1000)
    return [VendorBooking(**booking) for booking in bookings]

# Payment Routes
@api_router.post("/vendor-bookings/{booking_id}/payments", response_model=Payment)
async def create_payment(
    booking_id: str,
    payment_data: dict,
    current_user: dict = Depends(get_current_user)
):
    # Verify booking exists and belongs to user's event
    booking = await db.vendor_bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    event = await db.events.find_one({"id": booking["event_id"], "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Create payment
    payment_dict = {
        "id": str(uuid.uuid4()),
        "booking_id": booking_id,
        "vendor_id": booking["vendor_id"],
        "event_id": booking["event_id"],
        "amount": payment_data["amount"],
        "payment_type": payment_data.get("payment_type", "deposit"),
        "payment_method": payment_data.get("payment_method", "card"),
        "payment_date": datetime.utcnow(),
        "description": payment_data.get("description", f"{payment_data.get('payment_type', 'deposit').title()} payment for {booking['service_name']}"),
        "reference_number": f"REF-{str(uuid.uuid4())[:8]}",
        "status": "completed"
    }
    
    await db.payments.insert_one(payment_dict)
    
    # Update booking status if this is a deposit payment
    if payment_data.get("payment_type") == "deposit":
        await db.vendor_bookings.update_one(
            {"id": booking_id},
            {"$set": {"deposit_paid": True, "status": "confirmed"}}
        )
    
    return Payment(**payment_dict)

@api_router.get("/events/{event_id}/budget-tracker")
async def get_budget_tracker(event_id: str, current_user: dict = Depends(get_current_user)):
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get all vendor bookings for this event
    bookings = await db.vendor_bookings.find({"event_id": event_id}).to_list(1000)
    
    # Calculate totals
    total_budget = sum(booking["cost"] for booking in bookings)
    
    # Get all payments for this event
    payments = await db.payments.find({"event_id": event_id}).to_list(1000)
    total_paid = sum(payment["amount"] for payment in payments)
    
    remaining_balance = total_budget - total_paid
    payment_progress = (total_paid / total_budget * 100) if total_budget > 0 else 0
    
    # Get payment history with vendor information
    payment_history = []
    for payment in payments:
        booking = next((b for b in bookings if b["id"] == payment["booking_id"]), None)
        payment_with_vendor = payment.copy()
        if booking:
            payment_with_vendor["vendor_name"] = booking["vendor_name"]
            payment_with_vendor["service_name"] = booking["service_name"]
        payment_history.append(payment_with_vendor)
    
    return {
        "event_id": event_id,
        "total_budget": total_budget,
        "total_paid": total_paid,
        "remaining_balance": remaining_balance,
        "payment_progress": payment_progress,
        "bookings": [VendorBooking(**booking) for booking in bookings],
        "payment_history": payment_history
    }

# Interactive Event Planner Routes
@api_router.get("/events/{event_id}/planner/state")
async def get_planner_state(event_id: str, current_user: dict = Depends(get_current_user)):
    """Get or create event planner state"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get existing state or create new one
    state = await db.event_planner_states.find_one({"event_id": event_id})
    
    if not state:
        # Create new planner state
        state_dict = {
            "id": str(uuid.uuid4()),
            "event_id": event_id,
            "current_step": 0,
            "completed_steps": [],
            "cart_items": [],
            "step_data": {},
            "budget_tracking": {
                "set_budget": event.get("budget", 0.0),
                "selected_total": 0.0,
                "remaining": event.get("budget", 0.0)
            },
            "created_at": datetime.utcnow(),
            "updated_at": None
        }
        await db.event_planner_states.insert_one(state_dict)
        state = state_dict
    
    return EventPlannerState(**state)

@api_router.post("/events/{event_id}/planner/state")
async def save_planner_state(event_id: str, state_data: dict, current_user: dict = Depends(get_current_user)):
    """Save event planner state"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Update state
    state_data["updated_at"] = datetime.utcnow()
    
    await db.event_planner_states.update_one(
        {"event_id": event_id},
        {"$set": state_data},
        upsert=True
    )
    
    return {"message": "Planner state saved successfully"}

@api_router.get("/events/{event_id}/planner/steps")
async def get_planner_steps(event_id: str, current_user: dict = Depends(get_current_user)):
    """Get available planning steps for an event"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Define all 10 planning steps
    steps = [
        {"id": "planning", "title": "Start Planning", "subtitle": "Event overview and setup", "service_type": None},
        {"id": "venue", "title": "Venue", "subtitle": "Find your perfect location", "service_type": "venue"},
        {"id": "decoration", "title": "Decoration", "subtitle": "Style and ambiance", "service_type": "decoration"},
        {"id": "catering", "title": "Catering", "subtitle": "Food and beverages", "service_type": "catering"},
        {"id": "bar", "title": "Bar Service", "subtitle": "Drinks and bartending", "service_type": "bar"},
        {"id": "planner", "title": "Event Planner", "subtitle": "Professional coordination", "service_type": "planner"},
        {"id": "photography", "title": "Photography", "subtitle": "Capture the moments", "service_type": "photography"},
        {"id": "dj", "title": "DJ & Music", "subtitle": "Entertainment and sound", "service_type": "music"},
        {"id": "staffing", "title": "Waitstaff", "subtitle": "Service and support staff", "service_type": "staffing"},
        {"id": "entertainment", "title": "Entertainment", "subtitle": "Special performances", "service_type": "entertainment"},
        {"id": "review", "title": "Review", "subtitle": "Finalize your plan", "service_type": None}
    ]
    
    # Filter steps based on event's services_needed if available
    event_services = event.get("services_needed", [])
    if event_services:
        # Keep planning and review steps, filter others based on needed services
        filtered_steps = []
        
        for step in steps:
            # Always include planning and review steps
            if step["id"] in ["planning", "review"]:
                filtered_steps.append(step)
                continue
            
            # Check if this step's service is needed
            step_service = step.get("service_type")
            if step_service:
                # Map step services to event service names
                service_mappings = {
                    "venue": ["venue"],
                    "decoration": ["decoration", "decor"],
                    "catering": ["catering", "food"],
                    "bar": ["bar", "drinks"],
                    "planner": ["planner", "coordinator"],
                    "photography": ["photography", "photo"],
                    "music": ["music/dj", "dj", "music", "entertainment"],
                    "staffing": ["staffing", "waitstaff", "service"],
                    "entertainment": ["entertainment", "performer"]
                }
                
                # Check if any event service matches this step
                needed_services_lower = [s.lower() for s in event_services]
                step_matches = service_mappings.get(step_service, [step_service])
                
                if any(match.lower() in ' '.join(needed_services_lower) for match in step_matches):
                    filtered_steps.append(step)
        
        return filtered_steps
    
    return steps

@api_router.get("/events/{event_id}/planner/vendors/{service_type}")
async def get_planner_vendors(
    event_id: str, 
    service_type: str, 
    current_user: dict = Depends(get_current_user)
):
    """Get vendors for a specific service type with event context filtering"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Use the enhanced search with event context
    vendors = await search_vendors(
        service_type=service_type,
        event_id=event_id,
        budget_min=None,
        budget_max=event.get("budget"),
        current_user=current_user
    )
    
    return vendors

# Shopping Cart Routes
@api_router.get("/events/{event_id}/cart")
async def get_cart(event_id: str, current_user: dict = Depends(get_current_user)):
    """Get shopping cart for event"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get planner state
    state = await db.event_planner_states.find_one({"event_id": event_id})
    if not state:
        return []
    
    return state.get("cart_items", [])

@api_router.post("/events/{event_id}/cart/add")
async def add_to_cart(event_id: str, item_data: dict, current_user: dict = Depends(get_current_user)):
    """Add item to shopping cart"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Create cart item
    cart_item = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "vendor_id": item_data["vendor_id"],
        "vendor_name": item_data["vendor_name"],
        "service_type": item_data["service_type"],
        "service_name": item_data["service_name"],
        "price": item_data["price"],
        "quantity": item_data.get("quantity", 1),
        "notes": item_data.get("notes"),
        "added_at": datetime.utcnow()
    }
    
    # Get or create planner state
    state = await db.event_planner_states.find_one({"event_id": event_id})
    if not state:
        state = {
            "id": str(uuid.uuid4()),
            "event_id": event_id,
            "current_step": 0,
            "completed_steps": [],
            "cart_items": [],
            "step_data": {},
            "budget_tracking": {
                "set_budget": event.get("budget", 0.0),
                "selected_total": 0.0,
                "remaining": event.get("budget", 0.0)
            },
            "created_at": datetime.utcnow()
        }
        await db.event_planner_states.insert_one(state)
    
    # Add item to cart
    cart_items = state.get("cart_items", [])
    cart_items.append(cart_item)
    
    # Update budget tracking
    selected_total = sum(item["price"] * item.get("quantity", 1) for item in cart_items)
    budget_tracking = state.get("budget_tracking", {})
    budget_tracking["selected_total"] = selected_total
    budget_tracking["remaining"] = budget_tracking.get("set_budget", 0.0) - selected_total
    
    await db.event_planner_states.update_one(
        {"event_id": event_id},
        {
            "$set": {
                "cart_items": cart_items,
                "budget_tracking": budget_tracking,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Item added to cart", "cart_item": cart_item}

@api_router.delete("/events/{event_id}/cart/remove/{item_id}")
async def remove_from_cart(event_id: str, item_id: str, current_user: dict = Depends(get_current_user)):
    """Remove item from shopping cart"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get planner state
    state = await db.event_planner_states.find_one({"event_id": event_id})
    if not state:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Remove item from cart
    cart_items = state.get("cart_items", [])
    cart_items = [item for item in cart_items if item["id"] != item_id]
    
    # Update budget tracking
    selected_total = sum(item["price"] * item.get("quantity", 1) for item in cart_items)
    budget_tracking = state.get("budget_tracking", {})
    budget_tracking["selected_total"] = selected_total
    budget_tracking["remaining"] = budget_tracking.get("set_budget", 0.0) - selected_total
    
    await db.event_planner_states.update_one(
        {"event_id": event_id},
        {
            "$set": {
                "cart_items": cart_items,
                "budget_tracking": budget_tracking,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Item removed from cart"}

@api_router.post("/events/{event_id}/cart/clear")
async def clear_cart(event_id: str, current_user: dict = Depends(get_current_user)):
    """Clear shopping cart"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Update planner state
    budget_tracking = {
        "set_budget": event.get("budget", 0.0),
        "selected_total": 0.0,
        "remaining": event.get("budget", 0.0)
    }
    
    await db.event_planner_states.update_one(
        {"event_id": event_id},
        {
            "$set": {
                "cart_items": [],
                "budget_tracking": budget_tracking,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Cart cleared"}

# Scenario Management Routes
@api_router.post("/events/{event_id}/planner/scenarios/save")
async def save_scenario(event_id: str, scenario_data: dict, current_user: dict = Depends(get_current_user)):
    """Save a planning scenario"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    scenario_dict = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "name": scenario_data["name"],
        "description": scenario_data.get("description"),
        "selected_vendors": scenario_data.get("selected_vendors", {}),
        "total_cost": scenario_data.get("total_cost", 0.0),
        "saved_at": datetime.utcnow()
    }
    
    await db.planner_scenarios.insert_one(scenario_dict)
    return PlannerScenario(**scenario_dict)

@api_router.get("/events/{event_id}/planner/scenarios")
async def get_scenarios(event_id: str, current_user: dict = Depends(get_current_user)):
    """Get saved scenarios for event"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    scenarios = await db.planner_scenarios.find({"event_id": event_id}).to_list(1000)
    return [PlannerScenario(**scenario) for scenario in scenarios]

@api_router.delete("/events/{event_id}/planner/scenarios/{scenario_id}")
async def delete_scenario(event_id: str, scenario_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a planning scenario"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    result = await db.planner_scenarios.delete_one({"id": scenario_id, "event_id": event_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    return {"message": "Scenario deleted"}

# Finalization Route
@api_router.post("/events/{event_id}/planner/finalize")
async def finalize_event_plan(event_id: str, current_user: dict = Depends(get_current_user)):
    """Convert cart items to actual vendor bookings"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if appointments are confirmed for all vendors (pre-booking validation)
    confirmed_appointments = await db.appointments.find({
        "event_id": event_id,
        "client_confirmed": True,
        "status": "confirmed"
    }).to_list(1000)
    
    # Get planner state
    state = await db.event_planner_states.find_one({"event_id": event_id})
    if not state or not state.get("cart_items"):
        raise HTTPException(status_code=400, detail="No items in cart to finalize")
    
    cart_items = state["cart_items"]
    
    # Check if we have confirmed appointments for all vendors
    cart_vendor_ids = [item["vendor_id"] for item in cart_items]
    confirmed_vendor_ids = [apt["vendor_id"] for apt in confirmed_appointments]
    
    missing_appointments = [vid for vid in cart_vendor_ids if vid not in confirmed_vendor_ids]
    if missing_appointments:
        raise HTTPException(
            status_code=400, 
            detail=f"Please schedule and confirm appointments with all vendors before finalizing. Missing appointments for {len(missing_appointments)} vendors."
        )
    
    # Create vendor bookings from cart items
    bookings_created = []
    total_cost = 0.0
    
    for item in cart_items:
        booking_dict = {
            "id": str(uuid.uuid4()),
            "event_id": event_id,
            "vendor_id": item["vendor_id"],
            "vendor_name": item["vendor_name"],
            "service_type": item["service_type"],
            "service_name": item["service_name"],
            "service_details": item.get("notes"),
            "cost": item["price"] * item.get("quantity", 1),
            "deposit_amount": (item["price"] * item.get("quantity", 1)) * 0.3,  # 30% deposit
            "deposit_paid": False,
            "final_payment_due": event["date"],
            "status": "confirmed",  # Auto-confirmed since appointments are confirmed
            "booking_date": datetime.utcnow(),
            "event_date": event["date"],
            "notes": item.get("notes"),
            "invoice_id": f"INV-{str(uuid.uuid4())[:8]}"
        }
        
        await db.vendor_bookings.insert_one(booking_dict)
        bookings_created.append(VendorBooking(**booking_dict))
        total_cost += booking_dict["cost"]
    
    # Create calendar events for payment deadlines
    payment_deadlines = [
        {"days": 7, "title": "Payment Reminder - 1 Week"},
        {"days": 3, "title": "Payment Reminder - 3 Days"},
        {"days": 1, "title": "Final Payment Due Tomorrow"}
    ]
    
    for deadline in payment_deadlines:
        reminder_date = event["date"] - timedelta(days=deadline["days"])
        
        calendar_event = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "title": deadline["title"],
            "description": f"Payment reminder for {event['name']}. Total amount due: ${total_cost:.2f}",
            "event_type": "payment_deadline",
            "date": reminder_date,
            "all_day": True,
            "related_id": event_id,
            "notification_sent": False,
            "created_at": datetime.utcnow()
        }
        
        await db.calendar_events.insert_one(calendar_event)
    
    # Clear cart
    await db.event_planner_states.update_one(
        {"event_id": event_id},
        {
            "$set": {
                "cart_items": [],
                "budget_tracking": {
                    "set_budget": state["budget_tracking"].get("set_budget", 0.0),
                    "selected_total": 0.0,
                    "remaining": state["budget_tracking"].get("set_budget", 0.0)
                },
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Update event status
    await db.events.update_one(
        {"id": event_id},
        {"$set": {"status": "booked", "updated_at": datetime.utcnow()}}
    )
    
    return {
        "message": f"Event plan finalized successfully! Created {len(bookings_created)} vendor bookings.",
        "bookings_created": bookings_created,
        "total_cost": total_cost,
        "payment_deadlines_created": len(payment_deadlines)
    }

# Calendar & Appointment Routes
@api_router.get("/calendar/events")
async def get_calendar_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get calendar events for user"""
    query = {"user_id": current_user["id"]}
    
    # Add date filtering if provided
    if start_date and end_date:
        query["date"] = {
            "$gte": datetime.fromisoformat(start_date.replace('Z', '+00:00')),
            "$lte": datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        }
    
    events = await db.calendar_events.find(query).sort("date", 1).to_list(1000)
    
    # Convert ObjectId to string for JSON serialization
    for event in events:
        if "_id" in event:
            event["_id"] = str(event["_id"])
    
    return events

@api_router.post("/calendar/events")
async def create_calendar_event(
    event_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a new calendar event"""
    calendar_event = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "title": event_data["title"],
        "description": event_data.get("description"),
        "event_type": event_data.get("event_type", "manual"),
        "date": datetime.fromisoformat(event_data["date"].replace('Z', '+00:00')),
        "end_date": datetime.fromisoformat(event_data["end_date"].replace('Z', '+00:00')) if event_data.get("end_date") else None,
        "all_day": event_data.get("all_day", False),
        "location": event_data.get("location"),
        "related_id": event_data.get("related_id"),
        "notification_sent": False,
        "created_at": datetime.utcnow()
    }
    
    await db.calendar_events.insert_one(calendar_event)
    return CalendarEvent(**calendar_event)

@api_router.delete("/calendar/events/{event_id}")
async def delete_calendar_event(event_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a calendar event"""
    result = await db.calendar_events.delete_one({
        "id": event_id,
        "user_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    
    return {"message": "Calendar event deleted"}

# Vendor Availability Routes
@api_router.get("/vendors/{vendor_id}/availability")
async def get_vendor_availability(
    vendor_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get vendor availability"""
    query = {"vendor_id": vendor_id}
    
    if start_date and end_date:
        query["date"] = {
            "$gte": datetime.fromisoformat(start_date.replace('Z', '+00:00')),
            "$lte": datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        }
    
    availability = await db.vendor_availability.find(query).sort("date", 1).to_list(1000)
    
    # Convert ObjectId to string for JSON serialization
    for avail in availability:
        if "_id" in avail:
            avail["_id"] = str(avail["_id"])
    
    return availability

@api_router.post("/vendors/{vendor_id}/availability")
async def set_vendor_availability(
    vendor_id: str,
    availability_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Set vendor availability (vendor only)"""
    # Check if user is the vendor or has permission
    user_role = current_user.get("role", "client")
    if user_role != "vendor":
        # Check if user is admin or the specific vendor
        vendor = await db.vendors.find_one({"id": vendor_id})
        if not vendor or (user_role not in ["admin", "super_admin"]):
            raise HTTPException(status_code=403, detail="Permission denied")
    
    availability = {
        "id": str(uuid.uuid4()),
        "vendor_id": vendor_id,
        "date": datetime.fromisoformat(availability_data["date"].replace('Z', '+00:00')),
        "available_slots": availability_data.get("available_slots", []),
        "unavailable_periods": availability_data.get("unavailable_periods", []),
        "created_at": datetime.utcnow(),
        "updated_at": None
    }
    
    # Update existing or insert new
    await db.vendor_availability.update_one(
        {
            "vendor_id": vendor_id,
            "date": availability["date"]
        },
        {"$set": availability},
        upsert=True
    )
    
    return VendorAvailability(**availability)

# Appointment Routes
@api_router.post("/appointments")
async def create_appointment(
    appointment_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create appointment request"""
    # Verify vendor exists
    vendor = await db.vendors.find_one({"id": appointment_data["vendor_id"]})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    appointment = {
        "id": str(uuid.uuid4()),
        "client_id": current_user["id"],
        "vendor_id": appointment_data["vendor_id"],
        "event_id": appointment_data.get("event_id"),
        "appointment_type": appointment_data["appointment_type"],
        "date": datetime.fromisoformat(appointment_data["date"].replace('Z', '+00:00')),
        "duration_minutes": appointment_data.get("duration_minutes", 60),
        "location": appointment_data.get("location"),
        "phone_number": appointment_data.get("phone_number"),
        "meeting_link": appointment_data.get("meeting_link"),
        "status": "requested",
        "notes": appointment_data.get("notes"),
        "created_at": datetime.utcnow(),
        "updated_at": None,
        "vendor_response": None,
        "vendor_response_at": None,
        "client_confirmed": False,
        "client_confirmed_at": None
    }
    
    await db.appointments.insert_one(appointment)
    return Appointment(**appointment)

@api_router.get("/appointments")
async def get_appointments(current_user: dict = Depends(get_current_user)):
    """Get user appointments"""
    user_role = current_user.get("role", "client")
    
    if user_role == "vendor":
        # Get appointments for vendor
        query = {"vendor_id": current_user["id"]}
    else:
        # Get appointments for client
        query = {"client_id": current_user["id"]}
    
    appointments = await db.appointments.find(query).sort("date", 1).to_list(1000)
    
    # Convert ObjectId to string for JSON serialization
    for apt in appointments:
        if "_id" in apt:
            apt["_id"] = str(apt["_id"])
    
    return appointments

@api_router.put("/appointments/{appointment_id}/respond")
async def respond_to_appointment(
    appointment_id: str,
    response_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Vendor response to appointment request"""
    appointment = await db.appointments.find_one({"id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check if user is the vendor
    if appointment["vendor_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    update_data = {
        "vendor_response": response_data["response"],  # approved, rejected, rescheduled
        "vendor_response_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    if response_data["response"] == "approved":
        update_data["status"] = "confirmed"
    elif response_data["response"] == "rejected":
        update_data["status"] = "cancelled"
    elif response_data["response"] == "rescheduled":
        update_data["status"] = "rescheduled"
        if "new_date" in response_data:
            update_data["date"] = datetime.fromisoformat(response_data["new_date"].replace('Z', '+00:00'))
    
    await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": update_data}
    )
    
    return {"message": "Appointment response recorded"}

@api_router.put("/appointments/{appointment_id}/confirm")
async def confirm_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Client confirmation of appointment"""
    appointment = await db.appointments.find_one({"id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check if user is the client
    if appointment["client_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Check if appointment is approved by vendor
    if appointment["status"] != "confirmed":
        raise HTTPException(status_code=400, detail="Appointment not approved by vendor")
    
    await db.appointments.update_one(
        {"id": appointment_id},
        {
            "$set": {
                "client_confirmed": True,
                "client_confirmed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Create calendar event for both client and vendor
    appointment_title = f"Appointment with {appointment.get('vendor_name', 'Vendor')}"
    
    # Client calendar event
    client_event = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "title": appointment_title,
        "description": f"Appointment for event planning. Type: {appointment['appointment_type']}",
        "event_type": "appointment",
        "date": appointment["date"],
        "end_date": appointment["date"] + timedelta(minutes=appointment["duration_minutes"]),
        "all_day": False,
        "location": appointment.get("location"),
        "related_id": appointment_id,
        "notification_sent": False,
        "created_at": datetime.utcnow()
    }
    
    await db.calendar_events.insert_one(client_event)
    
    return {"message": "Appointment confirmed successfully"}

# User Settings & Profile Management Routes
@api_router.get("/users/language-preference")
async def get_language_preference(current_user: dict = Depends(get_current_user)):
    """Get user language preference"""
    user = await db.users.find_one({"id": current_user["id"]})
    return {"language": user.get("language_preference", "en")}

@api_router.put("/users/language-preference")
async def update_language_preference(language_data: dict, current_user: dict = Depends(get_current_user)):
    """Update user language preference"""
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"language_preference": language_data["language"]}}
    )
    return {"message": "Language preference updated"}

@api_router.get("/users/two-factor-status")
async def get_two_factor_status(current_user: dict = Depends(get_current_user)):
    """Get 2FA status"""
    user = await db.users.find_one({"id": current_user["id"]})
    return {
        "enabled": user.get("two_factor_enabled", False),
        "backup_codes": user.get("backup_codes", [])
    }

@api_router.post("/users/two-factor-generate")
async def generate_two_factor_qr(current_user: dict = Depends(get_current_user)):
    """Generate 2FA QR code"""
    # In a real implementation, you would generate actual QR codes
    # For now, return mock data
    backup_codes = [f"BC{str(uuid.uuid4())[:8].upper()}" for _ in range(10)]
    
    return {
        "qr_code": f"data:image/png;base64,mock_qr_code_for_{current_user['id']}",
        "backup_codes": backup_codes
    }

@api_router.post("/users/two-factor-verify")
async def verify_two_factor_code(verification_data: dict, current_user: dict = Depends(get_current_user)):
    """Verify 2FA code and enable 2FA"""
    code = verification_data.get("code")
    backup_codes = verification_data.get("backup_codes", [])
    
    # In a real implementation, you would verify the actual TOTP code
    # For now, accept any 6-digit code
    if len(code) == 6 and code.isdigit():
        await db.users.update_one(
            {"id": current_user["id"]},
            {
                "$set": {
                    "two_factor_enabled": True,
                    "backup_codes": backup_codes
                }
            }
        )
        return {"message": "2FA enabled successfully"}
    
    raise HTTPException(status_code=400, detail="Invalid verification code")

@api_router.post("/users/two-factor-disable")
async def disable_two_factor(current_user: dict = Depends(get_current_user)):
    """Disable 2FA"""
    await db.users.update_one(
        {"id": current_user["id"]},
        {
            "$set": {
                "two_factor_enabled": False,
                "backup_codes": []
            }
        }
    )
    return {"message": "2FA disabled successfully"}

@api_router.get("/users/privacy-settings")
async def get_privacy_settings(current_user: dict = Depends(get_current_user)):
    """Get privacy settings"""
    user = await db.users.find_one({"id": current_user["id"]})
    
    # Return default privacy settings if none exist
    default_settings = {
        "profile_visibility": "public",
        "email_notifications": True,
        "sms_notifications": False,
        "marketing_emails": True,
        "data_sharing": False,
        "event_visibility": "private",
        "vendor_recommendations": True,
        "analytics_tracking": True,
        "contact_info_sharing": False,
        "review_visibility": "public"
    }
    
    return user.get("privacy_settings", default_settings)

@api_router.put("/users/privacy-settings")
async def update_privacy_settings(settings_data: dict, current_user: dict = Depends(get_current_user)):
    """Update privacy settings"""
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"privacy_settings": settings_data}}
    )
    return {"message": "Privacy settings updated"}

@api_router.get("/users/integrations")
async def get_user_integrations(current_user: dict = Depends(get_current_user)):
    """Get connected integrations"""
    # Mock integration data
    integrations = [
        {
            "id": "google_calendar",
            "name": "Google Calendar",
            "status": "connected",
            "connected_at": "2024-01-15T10:30:00Z"
        },
        {
            "id": "stripe",
            "name": "Stripe",
            "status": "connected",
            "connected_at": "2024-01-10T14:20:00Z"
        }
    ]
    
    return integrations

@api_router.post("/users/integrations/connect")
async def connect_integration(integration_data: dict, current_user: dict = Depends(get_current_user)):
    """Connect new integration"""
    # Mock integration connection
    return {
        "message": f"Successfully connected {integration_data['service']}",
        "redirect_url": f"https://oauth.{integration_data['service']}.com/authorize"
    }

@api_router.get("/users/payment-methods")
async def get_payment_methods(current_user: dict = Depends(get_current_user)):
    """Get saved payment methods"""
    # Mock payment method data
    return [
        {
            "id": "pm_1234567890",
            "type": "card",
            "last4": "4242",
            "brand": "visa",
            "exp_month": 12,
            "exp_year": 2025,
            "is_default": True
        }
    ]

@api_router.get("/users/billing-history")
async def get_billing_history(current_user: dict = Depends(get_current_user)):
    """Get billing history"""
    # Mock billing data
    return [
        {
            "id": "inv_1234567890",
            "date": "2024-01-15T10:30:00Z",
            "amount": 150.00,
            "status": "paid",
            "description": "Event planning fee - Sarah's Wedding"
        }
    ]

@api_router.post("/support/contact")
async def create_support_ticket(ticket_data: dict, current_user: dict = Depends(get_current_user)):
    """Create support ticket"""
    ticket = {
        "id": f"TICKET-{str(uuid.uuid4())[:8].upper()}",
        "user_id": current_user["id"],
        "subject": ticket_data["subject"],
        "message": ticket_data["message"],
        "priority": ticket_data.get("priority", "medium"),
        "status": "open",
        "created_at": datetime.utcnow()
    }
    
    await db.support_tickets.insert_one(ticket)
    return {
        "ticket_id": ticket["id"],
        "message": "Support ticket created successfully"
    }

# Event History Route
@api_router.get("/users/event-history")
async def get_event_history(current_user: dict = Depends(get_current_user)):
    """Get user's event history with comprehensive details"""
    
    # Mock comprehensive event history data
    mock_events = [
        {
            "id": "evt_history_001",
            "name": "Sarah's Wedding Reception",
            "type": "Wedding",
            "sub_type": "Reception Only",
            "date": "2023-09-15T18:00:00Z",
            "status": "completed",
            "venue": {
                "name": "Grand Ballroom Plaza",
                "location": "New York, NY"
            },
            "guests": 150,
            "budget": 25000,
            "total_spent": 23800,
            "vendors": [
                {
                    "id": "vendor_001",
                    "name": "Elegant Catering Co.",
                    "service": "Catering",
                    "cost": 12000,
                    "rating": 5,
                    "review": "Exceptional service and delicious food!"
                },
                {
                    "id": "vendor_002", 
                    "name": "Perfect Moments Photography",
                    "service": "Photography",
                    "cost": 3500,
                    "rating": 5,
                    "review": "Beautiful photos that captured every moment perfectly."
                }
            ],
            "cultural_style": "American",
            "summary": "A magical evening celebrating Sarah and John's union with elegant decor, gourmet cuisine, and unforgettable memories.",
            "created_date": "2023-06-15T10:30:00Z",
            "image_url": "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=600&fit=crop"
        },
        {
            "id": "evt_history_002",
            "name": "Corporate Annual Gala",
            "type": "Corporate Event",
            "sub_type": "Award Ceremony",
            "date": "2023-11-20T19:00:00Z",
            "status": "completed",
            "venue": {
                "name": "Metropolitan Conference Center",
                "location": "Chicago, IL"
            },
            "guests": 300,
            "budget": 45000,
            "total_spent": 42500,
            "vendors": [
                {
                    "id": "vendor_003",
                    "name": "Premium Event Solutions",
                    "service": "Event Planning", 
                    "cost": 8000,
                    "rating": 4,
                    "review": "Professional service with attention to detail."
                },
                {
                    "id": "vendor_004",
                    "name": "Gourmet Corporate Catering",
                    "service": "Catering",
                    "cost": 18000,
                    "rating": 5,
                    "review": "Outstanding quality and presentation for our corporate event."
                }
            ],
            "cultural_style": "Other",
            "summary": "A sophisticated corporate gathering celebrating company achievements with award presentations and networking opportunities.",
            "created_date": "2023-08-10T14:20:00Z",
            "image_url": "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop"
        }
    ]
    
    return {"events": mock_events}

# Preferred Vendors Route
@api_router.get("/users/preferred-vendors")
async def get_preferred_vendors(current_user: dict = Depends(get_current_user)):
    """Get user's preferred vendors"""
    # In a real implementation, this would be based on vendor ratings and usage history
    # For now, return empty list since this is a new feature
    return []

# Include the router in the app
app.include_router(api_router)

# Root route
@app.get("/")
async def root():
    return {
        "message": "🎉 UREVENT 360 API Server", 
        "version": "2.0.0",
        "status": "running",
        "features": [
            "Multi-Role Authentication (Admin/Vendor/Employee/Client)",
            "Enhanced Event Management with Cultural Support",
            "Interactive Event Planner with 10-Step Workflow", 
            "Budget-Aware Vendor Marketplace",
            "Calendar & Appointment Integration System",
            "Venue Search with Location Filtering",
            "Payment Processing & Budget Tracking",
            "Corporate Event Types System",
            "Enhanced Filtering by Preferred Venue Type & Services"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)