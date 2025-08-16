from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
import uuid
import logging
from pathlib import Path

# Import vendor subscription routes will be imported later to avoid circular imports

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Urevent 360 API", version="1.0.0")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    mobile: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    mobile: str
    role: str = "user"  # user, admin, vendor
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
    service_type: str  # decoration, catering, photography, etc.
    description: str
    location: str
    price_range: Dict[str, float] = {"min": 0, "max": 1000}
    rating: float = 4.0
    reviews_count: int = 0
    portfolio: List[str] = []
    contact_info: Dict[str, str] = {}
    availability: List[str] = []
    specialties: List[str] = []
    cultural_specializations: List[str] = []  # indian, american, hispanic, african, asian, middle_eastern, other
    experience_years: int = 1
    verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    vendor_id: str
    amount: float
    payment_type: str  # deposit, partial, final, extra
    payment_method: str  # card, bank_transfer, cash, check
    payment_date: datetime = Field(default_factory=datetime.utcnow)
    status: str = "completed"  # pending, completed, failed, refunded
    description: Optional[str] = None
    transaction_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Invoice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vendor_id: str
    event_id: str
    total_amount: float
    deposit_amount: float
    deposit_paid: bool = False
    deposit_due_date: Optional[datetime] = None
    final_amount: float
    final_due_date: datetime
    status: str = "pending"  # pending, partially_paid, fully_paid, overdue
    items: List[Dict[str, Any]] = []  # Service breakdown
    terms: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class VendorBooking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    vendor_id: str
    service_details: Dict[str, Any]
    total_cost: float
    deposit_required: float
    deposit_paid: float = 0.0
    total_paid: float = 0.0
    final_due_date: datetime
    booking_status: str = "confirmed"  # pending, confirmed, completed, cancelled
    payment_status: str = "pending"  # pending, deposit_paid, partially_paid, fully_paid
    invoice_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    vendor_id: str
    service_type: str
    price: float
    status: str = "pending"  # pending, confirmed, completed, cancelled
    booking_date: datetime = Field(default_factory=datetime.utcnow)
    service_date: datetime
    notes: Optional[str] = None

# Interactive Event Planner Models
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
    saved_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PlannerScenario(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    scenario_name: str
    cart_items: List[CartItem] = []
    total_cost: float = 0.0
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Request/Response Models for Interactive Planner
class AddToCartRequest(BaseModel):
    vendor_id: str
    service_type: str
    service_name: str
    price: float
    quantity: int = 1
    notes: Optional[str] = None

class UpdatePlannerStateRequest(BaseModel):
    current_step: int
    step_data: Optional[Dict[str, Any]] = None
    completed_steps: Optional[List[int]] = None

class SaveScenarioRequest(BaseModel):
    scenario_name: str
    cart_items: List[CartItem]
    notes: Optional[str] = None

class PlannerStepInfo(BaseModel):
    step_id: str
    title: str
    subtitle: str
    icon: str
    color: str
    completed: bool = False
    vendor_count: int = 0

# Preferred Vendors Models
class PreferredVendor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    vendor_id: str
    vendor_name: str
    service_type: str
    average_rating: float = 0.0
    total_bookings: int = 0
    last_used: datetime = Field(default_factory=datetime.utcnow)
    total_spent: float = 0.0
    notes: Optional[str] = None
    added_at: datetime = Field(default_factory=datetime.utcnow)

class VendorRating(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    vendor_id: str
    event_id: str
    booking_id: str
    rating: int  # 1-5 stars
    review: Optional[str] = None
    service_quality: int = 0
    communication: int = 0
    timeliness: int = 0
    value_for_money: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Loan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    event_id: str
    loan_amount: float
    loan_provider: str
    interest_rate: float
    tenure_months: int
    status: str = "applied"  # applied, approved, rejected, disbursed
    application_date: datetime = Field(default_factory=datetime.utcnow)

class Invitation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    guest_name: str
    guest_email: EmailStr
    guest_mobile: Optional[str] = None
    status: str = "sent"  # sent, delivered, opened, responded
    rsvp_status: Optional[str] = None  # attending, not_attending, maybe
    sent_at: datetime = Field(default_factory=datetime.utcnow)

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    vendor_id: Optional[str] = None
    venue_id: Optional[str] = None
    user_id: str
    rating: int  # 1-5
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    sender_id: str
    receiver_id: str
    sender_type: str  # user, vendor
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False

# Appointment & Calendar Models
class VendorAvailability(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vendor_id: str
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: str  # HH:MM format (e.g., "09:00")
    end_time: str    # HH:MM format (e.g., "17:00")
    appointment_types: List[str]  # ["in_person", "phone", "virtual"]
    location: Optional[str] = None  # For in-person meetings
    timezone: str = "UTC"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    vendor_id: str
    event_id: Optional[str] = None
    appointment_type: str  # "in_person", "phone", "virtual"
    scheduled_datetime: datetime
    duration_minutes: int = 60
    status: str = "pending"  # pending, approved, confirmed, declined, cancelled, completed
    client_notes: Optional[str] = None
    vendor_notes: Optional[str] = None
    
    # Type-specific fields
    location: Optional[str] = None  # For in-person meetings
    phone_number: Optional[str] = None  # For phone calls
    meeting_link: Optional[str] = None  # For virtual meetings
    
    # Cart context - what client wants to discuss
    cart_items: List[Dict[str, Any]] = []
    estimated_budget: Optional[float] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    approved_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class CalendarEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: Optional[str] = None
    event_type: str  # "appointment", "payment_deadline", "reminder", "note"
    date: datetime
    all_day: bool = False
    
    # Related references
    appointment_id: Optional[str] = None
    booking_id: Optional[str] = None
    vendor_id: Optional[str] = None
    
    # Reminder settings
    reminder_minutes: List[int] = []  # e.g., [1440, 60] for 24h and 1h before
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Request Models for Appointment APIs
class CreateAppointmentRequest(BaseModel):
    vendor_id: str
    event_id: Optional[str] = None
    appointment_type: str  # "in_person", "phone", "virtual"
    scheduled_datetime: datetime
    duration_minutes: int = 60
    client_notes: Optional[str] = None
    location: Optional[str] = None
    phone_number: Optional[str] = None
    cart_items: List[Dict[str, Any]] = []
    estimated_budget: Optional[float] = None

class VendorAvailabilityRequest(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str
    appointment_types: List[str]
    location: Optional[str] = None
    timezone: str = "UTC"

class AppointmentResponseRequest(BaseModel):
    status: str  # "approved", "declined"
    vendor_notes: Optional[str] = None
    suggested_datetime: Optional[datetime] = None
    meeting_link: Optional[str] = None

class CalendarEventRequest(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: str = "note"
    date: datetime
    all_day: bool = False
    reminder_minutes: List[int] = []

# Utility Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    
    # Convert ObjectId to string for serialization
    if "_id" in user:
        user["id"] = str(user["_id"])
        del user["_id"]
    
    return user

# Authentication Routes
@api_router.post("/auth/register")
async def register(user: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    user_dict.pop("password")
    user_dict["hashed_password"] = hashed_password
    user_dict["id"] = str(uuid.uuid4())
    user_dict["role"] = "user"  # Default role
    user_dict["created_at"] = datetime.utcnow()
    user_dict["profile_completed"] = False
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user": User(**user_dict)}

@api_router.post("/auth/login")
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user": User(**user)}

# User Routes
@api_router.get("/users/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    profile = await db.user_profiles.find_one({"user_id": current_user["id"]})
    
    # Convert ObjectId to string if present
    if profile and "_id" in profile:
        profile["id"] = str(profile["_id"])
        del profile["_id"]
    
    return {"user": User(**current_user), "profile": profile}

@api_router.put("/users/profile")
async def update_profile(profile: UserProfile, current_user: dict = Depends(get_current_user)):
    profile_dict = profile.dict()
    profile_dict["user_id"] = current_user["id"]
    
    await db.user_profiles.update_one(
        {"user_id": current_user["id"]},
        {"$set": profile_dict},
        upsert=True
    )
    return {"message": "Profile updated successfully"}

# Event Routes
@api_router.post("/events", response_model=Event)
async def create_event(event: EventCreate, current_user: dict = Depends(get_current_user)):
    event_dict = event.dict()
    event_dict["user_id"] = current_user["id"]
    event_dict["id"] = str(uuid.uuid4())
    event_dict["created_at"] = datetime.utcnow()
    
    await db.events.insert_one(event_dict)
    return Event(**event_dict)

@api_router.get("/events", response_model=List[Event])
async def get_user_events(current_user: dict = Depends(get_current_user)):
    events = await db.events.find({"user_id": current_user["id"]}).to_list(1000)
    return [Event(**event) for event in events]

# Event Management Routes

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return Event(**event)

@api_router.put("/events/{event_id}")
async def update_event(
    event_id: str, 
    event_updates: dict, 
    current_user: dict = Depends(get_current_user)
):
    """Update event details from dashboard"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Prepare update data
    update_data = {}
    
    # Allow updating specific fields
    updatable_fields = [
        'name', 'description', 'date', 'location', 'venue_id', 'venue_name',
        'venue_address', 'budget', 'guest_count', 'status', 'requirements'
    ]
    
    for field in updatable_fields:
        if field in event_updates:
            update_data[field] = event_updates[field]
    
    if update_data:
        update_data['updated_at'] = datetime.utcnow()
        await db.events.update_one(
            {"id": event_id},
            {"$set": update_data}
        )
    
    # Get updated event
    updated_event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    return Event(**updated_event)

@api_router.delete("/events/{event_id}")
async def delete_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an event and all associated data"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    try:
        # Delete all associated data in order
        
        # 1. Delete planner states and scenarios
        await db.planner_states.delete_many({"event_id": event_id})
        await db.planner_scenarios.delete_many({"event_id": event_id})
        
        # 2. Delete payments associated with this event
        await db.payments.delete_many({"event_id": event_id})
        
        # 3. Delete vendor bookings and their invoices
        vendor_bookings = await db.vendor_bookings.find({"event_id": event_id}).to_list(1000)
        for booking in vendor_bookings:
            # Delete associated invoices
            if booking.get("invoice_id"):
                await db.invoices.delete_one({"id": booking["invoice_id"]})
        
        await db.vendor_bookings.delete_many({"event_id": event_id})
        
        # 4. Finally delete the event itself
        result = await db.events.delete_one({"id": event_id, "user_id": current_user["id"]})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Event not found")
        
        return {
            "message": "Event deleted successfully",
            "event_id": event_id,
            "deleted_data": {
                "planner_states": "deleted",
                "scenarios": "deleted", 
                "payments": "deleted",
                "vendor_bookings": len(vendor_bookings),
                "invoices": len([b for b in vendor_bookings if b.get("invoice_id")]),
                "event": "deleted"
            }
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
    current_user: dict = Depends(get_current_user)
):
    """Search venues based on location and criteria"""
    query = {}
    
    # Location-based search
    if zip_code:
        # In a real app, you'd use geolocation APIs to find venues within radius of ZIP code
        # For now, we'll do a simple text search that includes the ZIP or nearby cities
        location_terms = [zip_code]
        
        # Add common city names for popular ZIP codes (simplified for demo)
        zip_to_cities = {
            '10001': ['New York', 'Manhattan', 'NYC'],
            '90210': ['Beverly Hills', 'Los Angeles', 'LA'],
            '60601': ['Chicago', 'IL'],
            '33101': ['Miami', 'FL'],
            '30301': ['Atlanta', 'GA']
        }
        
        if zip_code in zip_to_cities:
            location_terms.extend(zip_to_cities[zip_code])
        
        # Create location regex for flexible matching
        location_pattern = '|'.join(location_terms)
        query["location"] = {"$regex": location_pattern, "$options": "i"}
    
    elif city:
        query["location"] = {"$regex": city, "$options": "i"}
    
    # Venue type filter
    if venue_type and venue_type != 'all':
        query["venue_type"] = venue_type
    
    # Capacity filter
    if capacity_min or capacity_max:
        capacity_filter = {}
        if capacity_min:
            capacity_filter["$gte"] = capacity_min
        if capacity_max:
            capacity_filter["$lte"] = capacity_max
        query["capacity"] = capacity_filter
    
    # Budget filter (price per person or base price)
    if budget_min or budget_max:
        budget_filter = {}
        if budget_min:
            budget_filter["$gte"] = budget_min
        if budget_max:
            budget_filter["$lte"] = budget_max
        query["price_per_person"] = budget_filter
    
    # Search venues
    venues = await db.venues.find(query).limit(20).to_list(20)
    
    # Add distance indicator (simplified for demo)
    for venue in venues:
        venue["estimated_distance"] = "Within selected radius"
        venue["match_score"] = 85  # Simplified matching score
    
    return [Venue(**venue) for venue in venues]

@api_router.post("/events/{event_id}/select-venue")
async def select_venue_for_event(
    event_id: str,
    venue_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Associate a venue with an event"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Update event with venue information
    venue_update = {
        "venue_id": venue_data.get("venue_id"),
        "venue_name": venue_data.get("venue_name"),
        "venue_address": venue_data.get("venue_address"),
        "venue_contact": venue_data.get("venue_contact"),
        "updated_at": datetime.utcnow()
    }
    
    await db.events.update_one(
        {"id": event_id},
        {"$set": venue_update}
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

# Vendor Routes
@api_router.get("/vendors", response_model=List[Vendor])
async def get_vendors(
    service_type: Optional[str] = None,
    location: Optional[str] = None,
    min_budget: Optional[float] = None,
    max_budget: Optional[float] = None,
    event_id: Optional[str] = None,
    cultural_style: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if service_type and service_type != 'all':
        query["service_type"] = service_type
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    # Cultural style filtering - match vendors who specialize in the cultural style
    if cultural_style:
        query["cultural_specializations"] = {"$in": [cultural_style]}
    
    # Budget filtering logic
    if min_budget or max_budget or event_id:
        budget_filter = {}
        
        # If event_id is provided, get the event budget and use it for smart filtering
        if event_id:
            event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
            if event and event.get("budget"):
                event_budget = float(event["budget"])
                # Auto-extract cultural style from event if not provided
                if not cultural_style and event.get("cultural_style"):
                    query["cultural_specializations"] = {"$in": [event["cultural_style"]]}
                    
                # Adjust budget filtering based on event budget
                budget_filter["price_range.min"] = {"$lte": event_budget * 0.8}  # Show vendors within 80% of budget
                # Allocate 15% of total event budget per service category
                service_budget = event_budget * 0.15
                budget_filter = {
                    "$and": [
                        {"price_range.min": {"$lte": service_budget}},
                        {"price_range.max": {"$gte": service_budget * 0.5}}  # Allow some flexibility
                    ]
                }
        
        # Manual budget filters override event-based filtering
        if min_budget and max_budget:
            budget_filter = {
                "$and": [
                    {"price_range.min": {"$lte": max_budget}},
                    {"price_range.max": {"$gte": min_budget}}
                ]
            }
        elif min_budget:
            budget_filter = {"price_range.max": {"$gte": min_budget}}
        elif max_budget:
            budget_filter = {"price_range.min": {"$lte": max_budget}}
        
        if budget_filter:
            query.update(budget_filter)
    
    vendors = await db.vendors.find(query).to_list(1000)
    return [Vendor(**vendor) for vendor in vendors]

@api_router.get("/vendors/{vendor_id}", response_model=Vendor)
async def get_vendor_details(vendor_id: str):
    vendor = await db.vendors.find_one({"id": vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return Vendor(**vendor)

@api_router.get("/vendors/category/{category}")
async def get_vendors_by_category(
    category: str,
    current_user: dict = Depends(get_current_user)
):
    vendors = await db.vendors.find({"service_type": category}).to_list(1000)
    return {"vendors": [Vendor(**vendor) for vendor in vendors], "category": category}

@api_router.post("/vendors/{vendor_id}/favorite")
async def toggle_vendor_favorite(
    vendor_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Check if vendor exists
    vendor = await db.vendors.find_one({"id": vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Check if already favorited
    existing_favorite = await db.user_favorites.find_one({
        "user_id": current_user["id"],
        "vendor_id": vendor_id
    })
    
    if existing_favorite:
        # Remove from favorites
        await db.user_favorites.delete_one({
            "user_id": current_user["id"],
            "vendor_id": vendor_id
        })
        return {"message": "Removed from favorites", "is_favorite": False}
    else:
        # Add to favorites
        favorite_data = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "vendor_id": vendor_id,
            "created_at": datetime.utcnow()
        }
        await db.user_favorites.insert_one(favorite_data)
        return {"message": "Added to favorites", "is_favorite": True}

@api_router.get("/vendors/favorites/user")
async def get_user_favorite_vendors(current_user: dict = Depends(get_current_user)):
    favorites = await db.user_favorites.find({"user_id": current_user["id"]}).to_list(1000)
    vendor_ids = [fav["vendor_id"] for fav in favorites]
    
    if not vendor_ids:
        return {"favorites": []}
    
    vendors = await db.vendors.find({"id": {"$in": vendor_ids}}).to_list(1000)
    return {"favorites": [Vendor(**vendor) for vendor in vendors]}

# Booking Routes
@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking: Booking, current_user: dict = Depends(get_current_user)):
    # Verify event belongs to user
    event = await db.events.find_one({"id": booking.event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    booking_dict = booking.dict()
    booking_dict["id"] = str(uuid.uuid4())
    booking_dict["booking_date"] = datetime.utcnow()
    
    await db.bookings.insert_one(booking_dict)
    return Booking(**booking_dict)

@api_router.get("/bookings/event/{event_id}", response_model=List[Booking])
async def get_event_bookings(event_id: str, current_user: dict = Depends(get_current_user)):
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    bookings = await db.bookings.find({"event_id": event_id}).to_list(1000)
    return [Booking(**booking) for booking in bookings]

# Payment Routes
@api_router.post("/payments", response_model=Payment)
async def create_payment(payment: Payment, current_user: dict = Depends(get_current_user)):
    payment_dict = payment.dict()
    payment_dict["id"] = str(uuid.uuid4())
    payment_dict["payment_date"] = datetime.utcnow()
    
    await db.payments.insert_one(payment_dict)
    return Payment(**payment_dict)

# Loan Routes
@api_router.post("/loans", response_model=Loan)
async def apply_loan(loan: Loan, current_user: dict = Depends(get_current_user)):
    loan_dict = loan.dict()
    loan_dict["user_id"] = current_user["id"]
    loan_dict["id"] = str(uuid.uuid4())
    loan_dict["application_date"] = datetime.utcnow()
    
    await db.loans.insert_one(loan_dict)
    return Loan(**loan_dict)

# Invitation Routes
@api_router.post("/invitations", response_model=Invitation)
async def send_invitation(invitation: Invitation, current_user: dict = Depends(get_current_user)):
    # Verify event belongs to user
    event = await db.events.find_one({"id": invitation.event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    invitation_dict = invitation.dict()
    invitation_dict["id"] = str(uuid.uuid4())
    invitation_dict["sent_at"] = datetime.utcnow()
    
    await db.invitations.insert_one(invitation_dict)
    return Invitation(**invitation_dict)

@api_router.get("/invitations/event/{event_id}", response_model=List[Invitation])
async def get_event_invitations(event_id: str, current_user: dict = Depends(get_current_user)):
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    invitations = await db.invitations.find({"event_id": event_id}).to_list(1000)
    return [Invitation(**invitation) for invitation in invitations]

# Review Routes
@api_router.post("/reviews", response_model=Review)
async def create_review(review: Review, current_user: dict = Depends(get_current_user)):
    review_dict = review.dict()
    review_dict["user_id"] = current_user["id"]
    review_dict["id"] = str(uuid.uuid4())
    review_dict["created_at"] = datetime.utcnow()
    
    await db.reviews.insert_one(review_dict)
    return Review(**review_dict)

# Message Routes
@api_router.post("/messages", response_model=Message)
async def send_message(message: Message, current_user: dict = Depends(get_current_user)):
    message_dict = message.dict()
    message_dict["sender_id"] = current_user["id"]
    message_dict["id"] = str(uuid.uuid4())
    message_dict["timestamp"] = datetime.utcnow()
    
    await db.messages.insert_one(message_dict)
    return Message(**message_dict)

@api_router.get("/messages/event/{event_id}", response_model=List[Message])
async def get_event_messages(event_id: str, current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find({
        "event_id": event_id,
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
        "beach/waterfront": 150,
        "private residence": 70,
        "church/religious venue": 40,
        "other": 90
    }
    
    base_cost = guest_count * base_cost_per_guest.get(venue_type.lower(), 90)
    
    # Service costs
    service_costs = {
        "catering": guest_count * 45,
        "decoration": guest_count * 15,
        "photography": 800,
        "videography": 1200,
        "music/dj": 600,
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
        "estimated_budget": total_estimated,
        "breakdown": breakdown
    }

# Budget Tracking & Payment Management Routes

@api_router.get("/events/{event_id}/budget-tracker")
async def get_budget_tracker(event_id: str, current_user: dict = Depends(get_current_user)):
    """Get comprehensive budget tracking information for an event"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get all vendor bookings for this event
    vendor_bookings = await db.vendor_bookings.find({"event_id": event_id}).to_list(1000)
    
    # Get all payments for this event
    payments = await db.payments.find({"event_id": event_id}).to_list(1000)
    
    # Calculate totals
    total_budget = sum(booking["total_cost"] for booking in vendor_bookings)
    total_paid = sum(payment["amount"] for payment in payments if payment["status"] == "completed")
    remaining_balance = total_budget - total_paid
    
    # Calculate vendor-specific payment status
    vendor_payment_status = []
    for booking in vendor_bookings:
        vendor_payments = [p for p in payments if p["vendor_id"] == booking["vendor_id"]]
        vendor_total_paid = sum(p["amount"] for p in vendor_payments if p["status"] == "completed")
        vendor_remaining = booking["total_cost"] - vendor_total_paid
        
        # Get vendor details
        vendor = await db.vendors.find_one({"id": booking["vendor_id"]})
        
        vendor_payment_status.append({
            "vendor_id": booking["vendor_id"],
            "vendor_name": vendor["name"] if vendor else "Unknown Vendor",
            "service_type": vendor["service_type"] if vendor else "Unknown",
            "total_amount": booking["total_cost"],
            "total_paid": vendor_total_paid,
            "remaining_balance": vendor_remaining,
            "deposit_required": booking["deposit_required"],
            "deposit_paid": booking["deposit_paid"],
            "final_due_date": booking["final_due_date"],
            "payment_status": booking["payment_status"],
            "booking_status": booking["booking_status"]
        })
    
    # Convert recent payments to proper format
    recent_payments = []
    for payment in sorted(payments, key=lambda x: x["payment_date"], reverse=True)[:5]:
        recent_payments.append({
            "id": payment["id"],
            "vendor_id": payment["vendor_id"],
            "amount": payment["amount"],
            "payment_type": payment["payment_type"],
            "payment_method": payment["payment_method"],
            "payment_date": payment["payment_date"],
            "status": payment["status"],
            "description": payment.get("description", "")
        })
    
    return {
        "event_id": event_id,
        "event_name": event["name"],
        "total_budget": total_budget,
        "total_paid": total_paid,
        "remaining_balance": remaining_balance,
        "payment_progress": (total_paid / total_budget * 100) if total_budget > 0 else 0,
        "vendor_payments": vendor_payment_status,
        "recent_payments": recent_payments
    }

@api_router.post("/events/{event_id}/vendor-bookings")
async def create_vendor_booking(
    event_id: str, 
    booking_data: dict, 
    current_user: dict = Depends(get_current_user)
):
    """Create a new vendor booking for an event"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Verify vendor exists
    vendor = await db.vendors.find_one({"id": booking_data["vendor_id"]})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Create vendor booking
    booking = VendorBooking(
        event_id=event_id,
        vendor_id=booking_data["vendor_id"],
        service_details=booking_data.get("service_details", {}),
        total_cost=booking_data["total_cost"],
        deposit_required=booking_data.get("deposit_required", booking_data["total_cost"] * 0.3),
        final_due_date=datetime.fromisoformat(booking_data["final_due_date"])
    )
    
    booking_dict = booking.dict()
    await db.vendor_bookings.insert_one(booking_dict)
    
    # Create associated invoice
    invoice = Invoice(
        vendor_id=booking_data["vendor_id"],
        event_id=event_id,
        total_amount=booking_data["total_cost"],
        deposit_amount=booking_dict["deposit_required"],
        final_amount=booking_data["total_cost"] - booking_dict["deposit_required"],
        final_due_date=datetime.fromisoformat(booking_data["final_due_date"]),
        items=booking_data.get("service_items", [])
    )
    
    invoice_dict = invoice.dict()
    await db.invoices.insert_one(invoice_dict)
    
    # Update booking with invoice ID
    await db.vendor_bookings.update_one(
        {"id": booking_dict["id"]},
        {"$set": {"invoice_id": invoice_dict["id"]}}
    )
    
    # Update booking_dict to include invoice_id for return
    booking_dict["invoice_id"] = invoice_dict["id"]
    
    return VendorBooking(**booking_dict)

@api_router.post("/events/{event_id}/payments")
async def make_payment(
    event_id: str,
    payment_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Process a payment for a vendor"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Verify vendor booking exists
    booking = await db.vendor_bookings.find_one({
        "event_id": event_id,
        "vendor_id": payment_data["vendor_id"]
    })
    if not booking:
        raise HTTPException(status_code=404, detail="Vendor booking not found")
    
    # Create payment record
    payment = Payment(
        event_id=event_id,
        vendor_id=payment_data["vendor_id"],
        amount=payment_data["amount"],
        payment_type=payment_data.get("payment_type", "partial"),
        payment_method=payment_data.get("payment_method", "card"),
        description=payment_data.get("description", ""),
        transaction_id=payment_data.get("transaction_id")
    )
    
    payment_dict = payment.dict()
    await db.payments.insert_one(payment_dict)
    
    # Update vendor booking payment status
    current_total_paid = booking["total_paid"] + payment_data["amount"]
    
    # Update payment status based on amount paid
    if payment_data.get("payment_type") == "deposit":
        booking["deposit_paid"] = min(booking["deposit_paid"] + payment_data["amount"], booking["deposit_required"])
    
    booking["total_paid"] = current_total_paid
    
    if current_total_paid >= booking["total_cost"]:
        payment_status = "fully_paid"
    elif current_total_paid >= booking["deposit_required"]:
        payment_status = "deposit_paid"
    elif current_total_paid > 0:
        payment_status = "partially_paid"
    else:
        payment_status = "pending"
    
    await db.vendor_bookings.update_one(
        {"id": booking["id"]},
        {
            "$set": {
                "total_paid": current_total_paid,
                "deposit_paid": booking["deposit_paid"],
                "payment_status": payment_status,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Update invoice status
    if booking.get("invoice_id"):
        invoice_status = "fully_paid" if current_total_paid >= booking["total_cost"] else "partially_paid"
        await db.invoices.update_one(
            {"id": booking["invoice_id"]},
            {
                "$set": {
                    "status": invoice_status,
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    return Payment(**payment_dict)

@api_router.get("/events/{event_id}/invoices/{invoice_id}")
async def get_invoice(
    event_id: str,
    invoice_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed invoice information"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get invoice
    invoice = await db.invoices.find_one({"id": invoice_id, "event_id": event_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Get vendor details
    vendor = await db.vendors.find_one({"id": invoice["vendor_id"]})
    
    # Get related payments
    payments = await db.payments.find({
        "event_id": event_id,
        "vendor_id": invoice["vendor_id"]
    }).to_list(1000)
    
    invoice_data = Invoice(**invoice).dict()
    invoice_data["vendor_details"] = vendor
    invoice_data["payments"] = payments
    
    return invoice_data

@api_router.get("/events/{event_id}/payment-history")
async def get_payment_history(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get complete payment history for an event"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get all payments with vendor details
    payments = await db.payments.find({"event_id": event_id}).sort("payment_date", -1).to_list(1000)
    
    payment_history = []
    for payment in payments:
        vendor = await db.vendors.find_one({"id": payment["vendor_id"]})
        payment_info = Payment(**payment).dict()
        payment_info["vendor_name"] = vendor["name"] if vendor else "Unknown Vendor"
        payment_info["service_type"] = vendor["service_type"] if vendor else "Unknown"
        payment_history.append(payment_info)
    
    return payment_history

# ============================================================================
# Interactive Event Planner System API Routes
# ============================================================================

@api_router.get("/events/{event_id}/planner/state")
async def get_planner_state(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get the current state of the interactive event planner for an event"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get existing planner state or create default
    planner_state = await db.planner_states.find_one({"event_id": event_id})
    
    if not planner_state:
        # Create default state
        default_state = EventPlannerState(
            event_id=event_id,
            budget_tracking={
                "set_budget": event.get("budget", 0.0),
                "selected_total": 0.0,
                "remaining": event.get("budget", 0.0)
            }
        )
        await db.planner_states.insert_one(default_state.dict())
        planner_state = default_state.dict()
    
    return EventPlannerState(**planner_state)

@api_router.post("/events/{event_id}/planner/state")
async def update_planner_state(
    event_id: str,
    state_update: UpdatePlannerStateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update the planner state (current step, completed steps, step data)"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = {
        "current_step": state_update.current_step,
        "updated_at": datetime.utcnow()
    }
    
    if state_update.completed_steps is not None:
        update_data["completed_steps"] = state_update.completed_steps
    
    if state_update.step_data is not None:
        update_data["step_data"] = state_update.step_data
    
    await db.planner_states.update_one(
        {"event_id": event_id},
        {"$set": update_data},
        upsert=True
    )
    
    # Get updated state
    updated_state = await db.planner_states.find_one({"event_id": event_id})
    return EventPlannerState(**updated_state)

@api_router.get("/events/{event_id}/cart")
async def get_cart(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get the current shopping cart for an event planner session"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get planner state with cart items
    planner_state = await db.planner_states.find_one({"event_id": event_id})
    
    if not planner_state or not planner_state.get("cart_items"):
        return {
            "cart_items": [],
            "total_cost": 0.0,
            "item_count": 0,
            "budget_tracking": {
                "set_budget": event.get("budget", 0.0),
                "selected_total": 0.0,
                "remaining": event.get("budget", 0.0)
            }
        }
    
    cart_items = planner_state["cart_items"]
    total_cost = sum(item["price"] * item["quantity"] for item in cart_items)
    set_budget = event.get("budget", 0.0)
    
    return {
        "cart_items": cart_items,
        "total_cost": total_cost,
        "item_count": len(cart_items),
        "budget_tracking": {
            "set_budget": set_budget,
            "selected_total": total_cost,
            "remaining": set_budget - total_cost
        }
    }

@api_router.post("/events/{event_id}/cart/add")
async def add_to_cart(
    event_id: str,
    cart_request: AddToCartRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add a vendor service to the shopping cart"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Verify vendor exists
    vendor = await db.vendors.find_one({"id": cart_request.vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Get or create planner state
    planner_state = await db.planner_states.find_one({"event_id": event_id})
    
    if not planner_state:
        planner_state = EventPlannerState(
            event_id=event_id,
            budget_tracking={
                "set_budget": event.get("budget", 0.0),
                "selected_total": 0.0,
                "remaining": event.get("budget", 0.0)
            }
        ).dict()
        await db.planner_states.insert_one(planner_state)
    
    # Create cart item
    cart_item = CartItem(
        event_id=event_id,
        vendor_id=cart_request.vendor_id,
        vendor_name=vendor["name"],
        service_type=cart_request.service_type,
        service_name=cart_request.service_name,
        price=cart_request.price,
        quantity=cart_request.quantity,
        notes=cart_request.notes
    )
    
    # Check if item with same service type already exists (replace if so)
    cart_items = planner_state.get("cart_items", [])
    cart_items = [item for item in cart_items if item["service_type"] != cart_request.service_type]
    cart_items.append(cart_item.dict())
    
    # Calculate new totals
    total_cost = sum(item["price"] * item["quantity"] for item in cart_items)
    set_budget = event.get("budget", 0.0)
    
    # Update planner state
    await db.planner_states.update_one(
        {"event_id": event_id},
        {
            "$set": {
                "cart_items": cart_items,
                "budget_tracking": {
                    "set_budget": set_budget,
                    "selected_total": total_cost,
                    "remaining": set_budget - total_cost
                },
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "Item added to cart successfully",
        "cart_item": cart_item.dict(),
        "total_cost": total_cost,
        "budget_status": "over_budget" if total_cost > set_budget else "within_budget"
    }

@api_router.delete("/events/{event_id}/cart/remove/{item_id}")
async def remove_from_cart(
    event_id: str,
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove an item from the shopping cart"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get planner state
    planner_state = await db.planner_states.find_one({"event_id": event_id})
    if not planner_state:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Remove item from cart
    cart_items = planner_state.get("cart_items", [])
    cart_items = [item for item in cart_items if item["id"] != item_id]
    
    # Recalculate totals
    total_cost = sum(item["price"] * item["quantity"] for item in cart_items)
    set_budget = event.get("budget", 0.0)
    
    # Update planner state
    await db.planner_states.update_one(
        {"event_id": event_id},
        {
            "$set": {
                "cart_items": cart_items,
                "budget_tracking": {
                    "set_budget": set_budget,
                    "selected_total": total_cost,
                    "remaining": set_budget - total_cost
                },
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "Item removed from cart successfully",
        "total_cost": total_cost,
        "remaining_items": len(cart_items)
    }

@api_router.post("/events/{event_id}/cart/clear")
async def clear_cart(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Clear all items from the shopping cart"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    set_budget = event.get("budget", 0.0)
    
    # Clear cart and reset budget tracking
    await db.planner_states.update_one(
        {"event_id": event_id},
        {
            "$set": {
                "cart_items": [],
                "budget_tracking": {
                    "set_budget": set_budget,
                    "selected_total": 0.0,
                    "remaining": set_budget
                },
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    return {"message": "Cart cleared successfully"}

@api_router.post("/events/{event_id}/planner/finalize")
async def finalize_event_plan(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Finalize the event plan by converting cart items to actual bookings"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get planner state
    planner_state = await db.planner_states.find_one({"event_id": event_id})
    if not planner_state or not planner_state.get("cart_items"):
        raise HTTPException(status_code=400, detail="No items in cart to finalize")
    
    # APPOINTMENT VALIDATION: Check if all vendors have confirmed appointments
    vendor_ids_in_cart = list(set([item["vendor_id"] for item in planner_state["cart_items"]]))
    
    appointment_validation = {}
    for vendor_id in vendor_ids_in_cart:
        # Check if there's a confirmed appointment with this vendor for this event
        confirmed_appointment = await db.appointments.find_one({
            "client_id": current_user["id"],
            "vendor_id": vendor_id,
            "$or": [
                {"event_id": event_id},
                {"event_id": None}  # General appointments also count
            ],
            "status": "confirmed"
        })
        
        if not confirmed_appointment:
            vendor = await db.users.find_one({"id": vendor_id})
            vendor_name = vendor.get("name", "Unknown Vendor") if vendor else "Unknown Vendor"
            appointment_validation[vendor_id] = {
                "vendor_name": vendor_name,
                "has_confirmed_appointment": False
            }
        else:
            appointment_validation[vendor_id] = {
                "vendor_name": confirmed_appointment.get("vendor_name", "Vendor"),
                "has_confirmed_appointment": True,
                "appointment_id": confirmed_appointment["id"]
            }
    
    # Check if any vendors don't have confirmed appointments
    missing_appointments = [v for v in appointment_validation.values() if not v["has_confirmed_appointment"]]
    
    if missing_appointments:
        vendor_names = [v["vendor_name"] for v in missing_appointments]
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot finalize booking. Missing confirmed appointments with: {', '.join(vendor_names)}. Please schedule and confirm appointments with all vendors before finalizing your booking."
        )
    
    # Create vendor bookings for each cart item
    bookings_created = []
    total_cost = 0
    
    for cart_item in planner_state["cart_items"]:
        # Create vendor booking
        booking = VendorBooking(
            event_id=event_id,
            vendor_id=cart_item["vendor_id"],
            service_details={
                "service_name": cart_item["service_name"],
                "service_type": cart_item["service_type"],
                "quantity": cart_item["quantity"],
                "notes": cart_item.get("notes", "")
            },
            total_cost=cart_item["price"] * cart_item["quantity"],
            deposit_required=cart_item["price"] * cart_item["quantity"] * 0.3,  # 30% deposit
            final_due_date=event["date"] - timedelta(days=7)  # Due 7 days before event
        )
        
        booking_dict = booking.dict()
        await db.vendor_bookings.insert_one(booking_dict)
        
        # Create associated invoice
        invoice = Invoice(
            vendor_id=cart_item["vendor_id"],
            event_id=event_id,
            total_amount=booking_dict["total_cost"],
            deposit_amount=booking_dict["deposit_required"],
            final_amount=booking_dict["total_cost"] - booking_dict["deposit_required"],
            final_due_date=booking_dict["final_due_date"],
            items=[{
                "service_name": cart_item["service_name"],
                "quantity": cart_item["quantity"],
                "unit_price": cart_item["price"],
                "total_price": cart_item["price"] * cart_item["quantity"]
            }]
        )
        
        invoice_dict = invoice.dict()
        await db.invoices.insert_one(invoice_dict)
        
        # Update booking with invoice ID
        await db.vendor_bookings.update_one(
            {"id": booking_dict["id"]},
            {"$set": {"invoice_id": invoice_dict["id"]}}
        )
        
        bookings_created.append({
            "booking_id": booking_dict["id"],
            "invoice_id": invoice_dict["id"],
            "vendor_name": cart_item["vendor_name"],
            "service_type": cart_item["service_type"],
            "total_cost": booking_dict["total_cost"]
        })
        
        total_cost += booking_dict["total_cost"]
        
        # CREATE AUTOMATIC PAYMENT DEADLINE EVENTS
        vendor = await db.users.find_one({"id": cart_item["vendor_id"]})
        vendor_name = vendor.get("name", cart_item["vendor_name"]) if vendor else cart_item["vendor_name"]
        
        await create_payment_deadline_events(
            booking_id=booking_dict["id"],
            user_id=current_user["id"],
            vendor_name=vendor_name,
            payment_amount=booking_dict["total_cost"],
            due_date=booking_dict["final_due_date"]
        )
    
    # Update event status and clear cart
    await db.events.update_one(
        {"id": event_id},
        {"$set": {"status": "booked", "updated_at": datetime.utcnow()}}
    )
    
    # Clear the cart after finalizing
    await db.planner_states.update_one(
        {"event_id": event_id},
        {
            "$set": {
                "cart_items": [],
                "current_step": 0,
                "completed_steps": list(range(7)),  # Mark all steps as completed
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "Event plan finalized successfully",
        "bookings_created": bookings_created,
        "total_cost": total_cost,
        "event_status": "booked"
    }

@api_router.get("/events/{event_id}/planner/steps")
async def get_planner_steps(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get the planner steps with vendor counts and completion status"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get planner state
    planner_state = await db.planner_states.find_one({"event_id": event_id})
    completed_steps = planner_state.get("completed_steps", []) if planner_state else []
    
    # Define the planner steps
    steps = [
        {
            "step_id": "venue",
            "title": "Select Venue",
            "subtitle": "Choose the perfect location for your event",
            "icon": "MapPin",
            "color": "bg-blue-500",
            "service_types": ["venue"]
        },
        {
            "step_id": "decoration",
            "title": "Event Decoration",
            "subtitle": "Transform your space with beautiful decorations",
            "icon": "Sparkles",
            "color": "bg-purple-500",
            "service_types": ["decoration"]
        },
        {
            "step_id": "catering",
            "title": "Catering Services",
            "subtitle": "Delight your guests with amazing food",
            "icon": "Utensils",
            "color": "bg-green-500",
            "service_types": ["catering"]
        },
        {
            "step_id": "bar",
            "title": "Bar Services",
            "subtitle": "Professional bar and beverage service",
            "icon": "Wine",
            "color": "bg-amber-500",
            "service_types": ["bar", "beverage"]
        },
        {
            "step_id": "planner",
            "title": "Event Planner",
            "subtitle": "Professional event planning and coordination",
            "icon": "Calendar",
            "color": "bg-teal-500",
            "service_types": ["planning", "coordination"]
        },
        {
            "step_id": "photography",
            "title": "Photography & Video",
            "subtitle": "Capture every precious moment",
            "icon": "Camera",
            "color": "bg-indigo-500",
            "service_types": ["photography", "videography"]
        },
        {
            "step_id": "dj",
            "title": "DJ & Music",
            "subtitle": "Set the perfect mood with music",
            "icon": "Music",
            "color": "bg-red-500",
            "service_types": ["dj", "music", "entertainment"]
        },
        {
            "step_id": "staffing",
            "title": "Waitstaff Service",
            "subtitle": "Professional staff for seamless service",
            "icon": "UserCheck",
            "color": "bg-orange-500",
            "service_types": ["staffing", "waitstaff"]
        },
        {
            "step_id": "entertainment",
            "title": "Entertainment",
            "subtitle": "Additional entertainment for your guests",
            "icon": "Zap",
            "color": "bg-pink-500",
            "service_types": ["entertainment", "performers"]
        },
        {
            "step_id": "review",
            "title": "Review & Confirm",
            "subtitle": "Review your selections and finalize your event plan",
            "icon": "CheckCircle",
            "color": "bg-emerald-500",
            "service_types": []
        }
    ]
    
    # Get vendor counts for each step
    for i, step in enumerate(steps):
        step["step_number"] = i
        step["completed"] = i in completed_steps
        
        if step["service_types"]:
            # Count vendors for this service type
            vendor_count = await db.vendors.count_documents({
                "service_type": {"$in": step["service_types"]}
            })
            step["vendor_count"] = vendor_count
        else:
            step["vendor_count"] = 0
    
    return {
        "steps": steps,
        "current_step": planner_state.get("current_step", 0) if planner_state else 0,
        "total_steps": len(steps)
    }

@api_router.post("/events/{event_id}/planner/scenarios/save")
async def save_planner_scenario(
    event_id: str,
    scenario_request: SaveScenarioRequest,
    current_user: dict = Depends(get_current_user)
):
    """Save the current cart as a comparison scenario"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Calculate total cost
    total_cost = sum(item.price * item.quantity for item in scenario_request.cart_items)
    
    # Create scenario
    scenario = PlannerScenario(
        event_id=event_id,
        scenario_name=scenario_request.scenario_name,
        cart_items=scenario_request.cart_items,
        total_cost=total_cost,
        notes=scenario_request.notes
    )
    
    scenario_dict = scenario.dict()
    await db.planner_scenarios.insert_one(scenario_dict)
    
    return PlannerScenario(**scenario_dict)

@api_router.get("/events/{event_id}/planner/scenarios")
async def get_planner_scenarios(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all saved scenarios for comparison"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    scenarios = await db.planner_scenarios.find({"event_id": event_id}).to_list(1000)
    return [PlannerScenario(**scenario) for scenario in scenarios]

@api_router.delete("/events/{event_id}/planner/scenarios/{scenario_id}")
async def delete_planner_scenario(
    event_id: str,
    scenario_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a saved scenario"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    result = await db.planner_scenarios.delete_one({
        "id": scenario_id,
        "event_id": event_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    return {"message": "Scenario deleted successfully"}

@api_router.get("/events/{event_id}/planner/vendors/{service_type}")
async def get_planner_vendors(
    event_id: str,
    service_type: str,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get vendors for a specific planner step with enhanced filtering"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Build query
    query = {}
    
    # Service type mapping for flexible searching
    service_type_mapping = {
        "venue": ["venue"],
        "decoration": ["decoration"],
        "catering": ["catering"],
        "bar": ["bar", "beverage"],
        "planner": ["planning", "coordination"],
        "photography": ["photography", "videography"],
        "dj": ["dj", "music", "entertainment"],
        "staffing": ["staffing", "waitstaff"],
        "entertainment": ["entertainment", "performers"]
    }
    
    if service_type in service_type_mapping:
        query["service_type"] = {"$in": service_type_mapping[service_type]}
    else:
        query["service_type"] = service_type
    
    # Add cultural filtering if event has cultural style
    if event.get("cultural_style"):
        query["cultural_specializations"] = {"$in": [event["cultural_style"]]}
    
    # Budget-aware filtering based on event budget
    if event.get("budget"):
        event_budget = float(event["budget"])
        # Allocate 15% of total budget per service category
        service_budget = event_budget * 0.15
        
        # Show vendors within service budget range
        query["$and"] = [
            {"price_range.min": {"$lte": service_budget}},
            {"price_range.max": {"$gte": service_budget * 0.3}}  # Allow some flexibility
        ]
    
    # Manual price filtering overrides automatic filtering
    if min_price or max_price:
        price_filter = {}
        if min_price:
            price_filter["price_range.max"] = {"$gte": min_price}
        if max_price:
            price_filter["price_range.min"] = {"$lte": max_price}
        query.update(price_filter)
    
    # Search filtering
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"specialties": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}}
        ]
    
    # Get vendors
    vendors = await db.vendors.find(query).limit(20).to_list(20)
    
    # Add additional metadata
    for vendor in vendors:
        vendor["service_category"] = service_type
        vendor["budget_fit"] = "good"  # Simplified for now
        
        # Calculate recommended price based on service type
        base_price = vendor["price_range"]["min"]
        if service_type in ["catering", "venue"]:
            vendor["recommended_price"] = base_price * event.get("guest_count", 50)
        else:
            vendor["recommended_price"] = base_price
    
    return {
        "vendors": [Vendor(**vendor) for vendor in vendors],
        "service_type": service_type,
        "count": len(vendors),
        "filters_applied": {
            "cultural_style": event.get("cultural_style"),
            "budget_aware": bool(event.get("budget")),
            "search_term": search
        }
    }

# ============================================================================
# Preferred Vendors System API Routes  
# ============================================================================

@api_router.get("/users/preferred-vendors")
async def get_preferred_vendors(current_user: dict = Depends(get_current_user)):
    """Get user's preferred vendors list"""
    preferred_vendors = await db.preferred_vendors.find({"user_id": current_user["id"]}).sort("last_used", -1).to_list(1000)
    
    # Get full vendor details for each preferred vendor
    vendor_list = []
    for pref_vendor in preferred_vendors:
        vendor = await db.vendors.find_one({"id": pref_vendor["vendor_id"]})
        if vendor:
            vendor_info = Vendor(**vendor).dict()
            vendor_info["preferred_info"] = {
                "average_rating": pref_vendor["average_rating"],
                "total_bookings": pref_vendor["total_bookings"],
                "last_used": pref_vendor["last_used"],
                "total_spent": pref_vendor["total_spent"],
                "notes": pref_vendor.get("notes", "")
            }
            vendor_list.append(vendor_info)
    
    return {
        "preferred_vendors": vendor_list,
        "count": len(vendor_list)
    }

@api_router.post("/users/preferred-vendors/{vendor_id}")
async def add_preferred_vendor(
    vendor_id: str,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Manually add a vendor to preferred list"""
    # Verify vendor exists
    vendor = await db.vendors.find_one({"id": vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Check if already in preferred list
    existing = await db.preferred_vendors.find_one({
        "user_id": current_user["id"],
        "vendor_id": vendor_id
    })
    
    if existing:
        return {"message": "Vendor already in preferred list", "action": "none"}
    
    # Add to preferred vendors
    preferred_vendor = PreferredVendor(
        user_id=current_user["id"],
        vendor_id=vendor_id,
        vendor_name=vendor["name"],
        service_type=vendor["service_type"],
        notes=notes
    )
    
    await db.preferred_vendors.insert_one(preferred_vendor.dict())
    
    return {"message": "Vendor added to preferred list", "action": "added"}

@api_router.delete("/users/preferred-vendors/{vendor_id}")
async def remove_preferred_vendor(
    vendor_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove a vendor from preferred list"""
    result = await db.preferred_vendors.delete_one({
        "user_id": current_user["id"],
        "vendor_id": vendor_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Preferred vendor not found")
    
    return {"message": "Vendor removed from preferred list"}

@api_router.post("/events/{event_id}/rate-vendor/{vendor_id}")
async def rate_vendor(
    event_id: str,
    vendor_id: str,
    rating_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Rate a vendor after event completion and automatically add to preferred if rating is high"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Verify vendor booking exists
    booking = await db.vendor_bookings.find_one({
        "event_id": event_id,
        "vendor_id": vendor_id
    })
    if not booking:
        raise HTTPException(status_code=404, detail="Vendor booking not found")
    
    # Create vendor rating
    rating = VendorRating(
        user_id=current_user["id"],
        vendor_id=vendor_id,
        event_id=event_id,
        booking_id=booking["id"],
        rating=rating_data["rating"],
        review=rating_data.get("review"),
        service_quality=rating_data.get("service_quality", rating_data["rating"]),
        communication=rating_data.get("communication", rating_data["rating"]),
        timeliness=rating_data.get("timeliness", rating_data["rating"]),
        value_for_money=rating_data.get("value_for_money", rating_data["rating"])
    )
    
    await db.vendor_ratings.insert_one(rating.dict())
    
    # If rating is 4 or 5 stars, automatically add to preferred vendors
    if rating_data["rating"] >= 4:
        # Check if already in preferred list
        existing = await db.preferred_vendors.find_one({
            "user_id": current_user["id"],
            "vendor_id": vendor_id
        })
        
        # Get vendor details
        vendor = await db.vendors.find_one({"id": vendor_id})
        
        if not existing and vendor:
            # Add to preferred vendors
            preferred_vendor = PreferredVendor(
                user_id=current_user["id"],
                vendor_id=vendor_id,
                vendor_name=vendor["name"],
                service_type=vendor["service_type"],
                average_rating=rating_data["rating"],
                total_bookings=1,
                last_used=datetime.utcnow(),
                total_spent=booking["total_cost"],
                notes=f"Automatically added after {rating_data['rating']}-star rating"
            )
            
            await db.preferred_vendors.insert_one(preferred_vendor.dict())
            added_to_preferred = True
        elif existing:
            # Update existing preferred vendor stats
            await db.preferred_vendors.update_one(
                {"user_id": current_user["id"], "vendor_id": vendor_id},
                {
                    "$set": {
                        "last_used": datetime.utcnow(),
                        "average_rating": (existing["average_rating"] + rating_data["rating"]) / 2,
                        "total_bookings": existing["total_bookings"] + 1,
                        "total_spent": existing["total_spent"] + booking["total_cost"]
                    }
                }
            )
            added_to_preferred = True
        else:
            added_to_preferred = False
    else:
        added_to_preferred = False
    
    return {
        "message": "Vendor rating submitted successfully",
        "rating": rating.dict(),
        "added_to_preferred": added_to_preferred
    }

@api_router.get("/users/preferred-vendors/recommendations/{event_id}")
async def get_preferred_vendor_recommendations(
    event_id: str,
    service_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get preferred vendor recommendations for an event"""
    # Verify event belongs to user
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Build query for preferred vendors
    query = {"user_id": current_user["id"]}
    if service_type:
        query["service_type"] = service_type
    
    # Get preferred vendors for this service type
    preferred_vendors = await db.preferred_vendors.find(query).sort("average_rating", -1).to_list(1000)
    
    # Get full vendor details
    recommendations = []
    for pref_vendor in preferred_vendors:
        vendor = await db.vendors.find_one({"id": pref_vendor["vendor_id"]})
        if vendor:
            # Check cultural match
            cultural_match = True
            if event.get("cultural_style") and vendor.get("cultural_specializations"):
                cultural_match = event["cultural_style"] in vendor["cultural_specializations"]
            
            # Check budget compatibility
            budget_compatible = True
            if event.get("budget"):
                service_budget = event["budget"] * 0.15  # 15% per service
                budget_compatible = (
                    vendor["price_range"]["min"] <= service_budget and
                    vendor["price_range"]["max"] >= service_budget * 0.5
                )
            
            recommendation = {
                "vendor": Vendor(**vendor).dict(),
                "preferred_info": {
                    "average_rating": pref_vendor["average_rating"],
                    "total_bookings": pref_vendor["total_bookings"],
                    "last_used": pref_vendor["last_used"],
                    "total_spent": pref_vendor["total_spent"],
                    "notes": pref_vendor.get("notes", "")
                },
                "match_score": {
                    "cultural_match": cultural_match,
                    "budget_compatible": budget_compatible,
                    "overall_score": 90 if (cultural_match and budget_compatible) else 70
                }
            }
            recommendations.append(recommendation)
    
    # Sort by match score and rating
    recommendations.sort(key=lambda x: (x["match_score"]["overall_score"], x["preferred_info"]["average_rating"]), reverse=True)
    
    return {
        "recommendations": recommendations,
        "event_cultural_style": event.get("cultural_style"),
        "event_budget": event.get("budget"),
        "service_type": service_type
    }

# ============================================================================
# User Settings & Profile Management API Routes
# ============================================================================

@api_router.put("/users/profile")
async def update_user_profile(
    profile_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile information"""
    try:
        # Update user profile
        await db.users.update_one(
            {"id": current_user["id"]},
            {
                "$set": {
                    "name": profile_data.get("name", current_user["name"]),
                    "email": profile_data.get("email", current_user["email"]),
                    "mobile": profile_data.get("mobile", current_user.get("mobile")),
                    "bio": profile_data.get("bio", ""),
                    "location": profile_data.get("location", ""),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"message": "Profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@api_router.put("/users/avatar")
async def upload_avatar(
    avatar: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload user avatar/profile picture"""
    try:
        # In a real implementation, you'd upload to cloud storage
        # For now, we'll just return a placeholder URL
        avatar_url = f"https://ui-avatars.com/api/?name={current_user['name']}&background=7c3aed&color=fff&size=200"
        
        # Update user avatar URL
        await db.users.update_one(
            {"id": current_user["id"]},
            {
                "$set": {
                    "avatar_url": avatar_url,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"message": "Avatar updated successfully", "avatar_url": avatar_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload avatar: {str(e)}")

@api_router.get("/users/language-preference")
async def get_language_preference(current_user: dict = Depends(get_current_user)):
    """Get user's language preference"""
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        user = current_user  # Fallback to current_user data
    return {"language": user.get("language", "en")}

@api_router.put("/users/language-preference")
async def update_language_preference(
    language_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user's language preference"""
    try:
        await db.users.update_one(
            {"id": current_user["id"]},
            {
                "$set": {
                    "language": language_data["language"],
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"message": "Language preference updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update language: {str(e)}")

@api_router.get("/users/two-factor-status")
async def get_two_factor_status(current_user: dict = Depends(get_current_user)):
    """Get user's two-factor authentication status"""
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        user = current_user  # Fallback to current_user data
    return {
        "enabled": user.get("two_factor_enabled", False),
        "backup_codes": user.get("backup_codes", []) if user.get("two_factor_enabled") else []
    }

@api_router.post("/users/two-factor-generate")
async def generate_two_factor_qr(current_user: dict = Depends(get_current_user)):
    """Generate QR code for two-factor authentication setup"""
    try:
        # Generate mock QR code and backup codes
        qr_code = f"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        backup_codes = [
            "12345678", "87654321", "11223344", "44332211", "55667788",
            "88776655", "99001122", "22110099", "33445566", "66554433"
        ]
        
        return {
            "qr_code": qr_code,
            "backup_codes": backup_codes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate 2FA setup: {str(e)}")

@api_router.post("/users/two-factor-verify")
async def verify_two_factor_code(
    verification_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Verify two-factor authentication code and enable 2FA"""
    try:
        # In a real implementation, you'd verify the TOTP code
        # For demo purposes, accept any 6-digit code
        code = verification_data.get("code", "")
        if len(code) == 6 and code.isdigit():
            # Enable 2FA for user
            backup_codes = [
                "12345678", "87654321", "11223344", "44332211", "55667788",
                "88776655", "99001122", "22110099", "33445566", "66554433"
            ]
            
            await db.users.update_one(
                {"id": current_user["id"]},
                {
                    "$set": {
                        "two_factor_enabled": True,
                        "backup_codes": backup_codes,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return {"message": "Two-factor authentication enabled successfully"}
        else:
            raise HTTPException(status_code=400, detail="Invalid verification code")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify 2FA: {str(e)}")

@api_router.post("/users/two-factor-disable")
async def disable_two_factor(current_user: dict = Depends(get_current_user)):
    """Disable two-factor authentication"""
    try:
        await db.users.update_one(
            {"id": current_user["id"]},
            {
                "$set": {
                    "two_factor_enabled": False,
                    "updated_at": datetime.utcnow()
                },
                "$unset": {
                    "backup_codes": ""
                }
            }
        )
        
        return {"message": "Two-factor authentication disabled successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to disable 2FA: {str(e)}")

@api_router.post("/users/two-factor-regenerate-backup")
async def regenerate_backup_codes(current_user: dict = Depends(get_current_user)):
    """Regenerate backup codes for two-factor authentication"""
    try:
        backup_codes = [
            "98765432", "23456789", "34567890", "45678901", "56789012",
            "67890123", "78901234", "89012345", "90123456", "01234567"
        ]
        
        await db.users.update_one(
            {"id": current_user["id"]},
            {
                "$set": {
                    "backup_codes": backup_codes,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"backup_codes": backup_codes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to regenerate backup codes: {str(e)}")

@api_router.get("/users/privacy-settings")
async def get_privacy_settings(current_user: dict = Depends(get_current_user)):
    """Get user's privacy settings"""
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        user = current_user  # Fallback to current_user data
    default_settings = {
        "profile_visibility": "public",
        "event_visibility": "public",
        "contact_info_visibility": "contacts",
        "activity_sharing": True,
        "data_analytics": True,
        "marketing_emails": False,
        "third_party_sharing": False,
        "search_indexing": True,
        "location_sharing": False,
        "photo_tagging": True
    }
    
    return {"settings": user.get("privacy_settings", default_settings)}

@api_router.put("/users/privacy-settings")
async def update_privacy_settings(
    privacy_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user's privacy settings"""
    try:
        await db.users.update_one(
            {"id": current_user["id"]},
            {
                "$set": {
                    "privacy_settings": privacy_data["settings"],
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"message": "Privacy settings updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update privacy settings: {str(e)}")

@api_router.get("/users/integrations")
async def get_user_integrations(current_user: dict = Depends(get_current_user)):
    """Get user's connected integrations"""
    # Mock data for integrations
    connected = [
        {
            "id": "google_cal_123",
            "integration_id": "google_calendar",
            "account_name": "personal@gmail.com",
            "connected_at": datetime.utcnow().isoformat()
        },
        {
            "id": "stripe_456",
            "integration_id": "stripe",
            "account_name": "Business Account",
            "connected_at": datetime.utcnow().isoformat()
        }
    ]
    
    available = []  # This would be populated from a configuration
    
    return {"connected": connected, "available": available}

@api_router.post("/users/integrations/connect")
async def connect_integration(
    integration_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Connect a third-party integration"""
    try:
        # In a real implementation, this would initiate OAuth flow
        integration_id = integration_data["integration_id"]
        
        return {
            "message": f"Integration {integration_id} connected successfully",
            "redirect_url": None  # Would contain OAuth URL in real implementation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect integration: {str(e)}")

@api_router.post("/users/integrations/disconnect")
async def disconnect_integration(
    integration_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Disconnect a third-party integration"""
    try:
        integration_id = integration_data["integration_id"]
        
        return {"message": f"Integration {integration_id} disconnected successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to disconnect integration: {str(e)}")

@api_router.get("/users/payment-methods")
async def get_payment_methods(current_user: dict = Depends(get_current_user)):
    """Get user's saved payment methods"""
    # Mock payment methods data
    payment_methods = [
        {
            "id": "pm_123",
            "card_number": "4242424242424242",
            "expiry_month": "12",
            "expiry_year": "2025",
            "is_default": True
        }
    ]
    
    return {"payment_methods": payment_methods}

@api_router.post("/users/payment-methods")
async def add_payment_method(
    payment_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Add a new payment method"""
    try:
        # In a real implementation, this would integrate with Stripe/payment processor
        return {"message": "Payment method added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add payment method: {str(e)}")

@api_router.delete("/users/payment-methods/{method_id}")
async def remove_payment_method(
    method_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove a payment method"""
    try:
        return {"message": "Payment method removed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove payment method: {str(e)}")

@api_router.put("/users/payment-methods/{method_id}/default")
async def set_default_payment_method(
    method_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Set a payment method as default"""
    try:
        return {"message": "Default payment method updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update default payment method: {str(e)}")

@api_router.get("/users/billing-history")
async def get_billing_history(current_user: dict = Depends(get_current_user)):
    """Get user's billing history"""
    # Mock billing history
    billing_history = [
        {
            "id": "bill_123",
            "date": datetime.utcnow().isoformat(),
            "description": "Premium Plan - Monthly",
            "amount": 29.99,
            "status": "paid",
            "invoice_id": "inv_123"
        }
    ]
    
    return {"billing_history": billing_history}

@api_router.get("/users/subscription")
async def get_user_subscription(current_user: dict = Depends(get_current_user)):
    """Get user's subscription information"""
    # Mock subscription data
    subscription = {
        "plan_name": "Premium Plan",
        "description": "Full access to all features",
        "amount": 29.99,
        "interval": "month",
        "next_billing_date": (datetime.utcnow() + timedelta(days=30)).isoformat()
    }
    
    return {"subscription": subscription}

@api_router.get("/users/invoices/{invoice_id}/download")
async def download_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download an invoice PDF"""
    try:
        # In a real implementation, this would generate and return a PDF
        return {"message": "Invoice download would be implemented here"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download invoice: {str(e)}")

@api_router.post("/support/contact")
async def submit_contact_form(
    contact_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Submit a contact/support form"""
    try:
        # In a real implementation, this would send an email or create a ticket
        support_ticket = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "subject": contact_data["subject"],
            "category": contact_data["category"],
            "message": contact_data["message"],
            "priority": contact_data["priority"],
            "status": "open",
            "created_at": datetime.utcnow()
        }
        
        await db.support_tickets.insert_one(support_ticket)
        
        return {"message": "Support ticket created successfully", "ticket_id": support_ticket["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit contact form: {str(e)}")

@api_router.get("/users/billing-address")
async def get_billing_address(current_user: dict = Depends(get_current_user)):
    """Get user's billing address"""
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        user = current_user
    
    billing_address = user.get("billing_address", {})
    return {"billing_address": billing_address}

@api_router.put("/users/billing-address")
async def update_billing_address(
    billing_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user's billing address"""
    try:
        await db.users.update_one(
            {"id": current_user["id"]},
            {
                "$set": {
                    "billing_address": billing_data,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"message": "Billing address updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update billing address: {str(e)}")

@api_router.get("/users/booking-history")
async def get_booking_history(current_user: dict = Depends(get_current_user)):
    """Get user's booking and order history"""
    # Mock booking history for development
    bookings = [
        {
            "id": "booking_123",
            "event_name": "Sarah's Wedding Reception",
            "vendor_name": "Elegant Catering Co.",
            "service_type": "Catering",
            "amount": 4500.00,
            "status": "completed",
            "booking_date": (datetime.utcnow() - timedelta(days=60)).isoformat(),
            "event_date": (datetime.utcnow() - timedelta(days=30)).isoformat(),
            "invoice_id": "inv_123"
        },
        {
            "id": "booking_456",
            "event_name": "Corporate Annual Gala",
            "vendor_name": "Premier Photography",
            "service_type": "Photography",
            "amount": 2800.00,
            "status": "completed",
            "booking_date": (datetime.utcnow() - timedelta(days=90)).isoformat(),
            "event_date": (datetime.utcnow() - timedelta(days=60)).isoformat(),
            "invoice_id": "inv_456"
        },
        {
            "id": "booking_789",
            "event_name": "Birthday Celebration",
            "vendor_name": "Royal Decorations",
            "service_type": "Decoration",
            "amount": 1200.00,
            "status": "upcoming",
            "booking_date": datetime.utcnow().isoformat(),
            "event_date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "invoice_id": "inv_789"
        }
    ]
    
    return {"bookings": bookings}

@api_router.get("/invoices/{invoice_id}/download")
async def download_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download an invoice PDF"""
    try:
        # In a real implementation, this would generate and return a PDF
        # For now, return a success message
        return {"message": f"Invoice {invoice_id} download initiated", "filename": f"invoice-{invoice_id}.pdf"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download invoice: {str(e)}")

@api_router.get("/users/preferred-vendors")
async def get_preferred_vendors(current_user: dict = Depends(get_current_user)):
    """Get user's preferred vendors"""
    # Mock preferred vendors data
    preferred_vendors = [
        {
            "id": "vendor_123",
            "name": "Elegant Catering Co.",
            "service_type": "Catering",
            "rating": 4.9,
            "events_count": 5,
            "total_spent": 12500,
            "last_hired": (datetime.utcnow() - timedelta(days=30)).isoformat(),
            "contact": {
                "phone": "+1-555-0123",
                "email": "info@elegantcatering.com",
                "location": "New York, NY"
            },
            "specialties": ["Wedding Catering", "Corporate Events", "Fine Dining"],
            "notes": "Excellent service, professional staff, amazing food quality.",
            "added_date": (datetime.utcnow() - timedelta(days=300)).isoformat(),
            "average_cost": 2500,
            "image_url": "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&h=200&fit=crop"
        },
        {
            "id": "vendor_456",
            "name": "Premier Photography",
            "service_type": "Photography",
            "rating": 4.8,
            "events_count": 3,
            "total_spent": 4200,
            "last_hired": (datetime.utcnow() - timedelta(days=45)).isoformat(),
            "contact": {
                "phone": "+1-555-0456",
                "email": "contact@premierphotography.com",
                "location": "Brooklyn, NY"
            },
            "specialties": ["Wedding Photography", "Event Coverage", "Portrait Photography"],
            "notes": "Creative shots, punctual, great to work with.",
            "added_date": (datetime.utcnow() - timedelta(days=240)).isoformat(),
            "average_cost": 1400,
            "image_url": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=300&h=200&fit=crop"
        }
    ]
    
    return {"vendors": preferred_vendors}

@api_router.delete("/users/preferred-vendors/{vendor_id}")
async def remove_preferred_vendor(
    vendor_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove a vendor from user's preferred list"""
    try:
        # In a real implementation, this would remove from database
        return {"message": "Vendor removed from preferred list successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove preferred vendor: {str(e)}")

@api_router.get("/users/blocked-vendors")
async def get_blocked_vendors(current_user: dict = Depends(get_current_user)):
    """Get user's blocked vendors"""
    # Mock blocked vendors data
    blocked_vendors = [
        {
            "id": "vendor_999",
            "name": "Unreliable Vendors Inc.",
            "service_type": "DJ & Music",
            "rating": 2.1,
            "blocked_date": (datetime.utcnow() - timedelta(days=60)).isoformat(),
            "reason": "Poor service quality, arrived late, unprofessional behavior",
            "events_count": 1
        }
    ]
    
    return {"vendors": blocked_vendors}

@api_router.post("/users/blocked-vendors")
async def block_vendor(
    block_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Block a vendor for the user"""
    try:
        vendor_id = block_data["vendor_id"]
        reason = block_data["reason"]
        
        # In a real implementation, this would add to blocked vendors collection
        blocked_vendor = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "vendor_id": vendor_id,
            "reason": reason,
            "blocked_date": datetime.utcnow().isoformat()
        }
        
        return {"message": "Vendor blocked successfully", "blocked_vendor": blocked_vendor}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to block vendor: {str(e)}")

@api_router.delete("/users/blocked-vendors/{vendor_id}")
async def unblock_vendor(
    vendor_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Unblock a vendor for the user"""
    try:
        # In a real implementation, this would remove from blocked vendors collection
        return {"message": "Vendor unblocked successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to unblock vendor: {str(e)}")

@api_router.get("/users/event-history")
async def get_event_history(current_user: dict = Depends(get_current_user)):
    """Get user's event history"""
    # Mock event history data
    event_history = [
        {
            "id": "event_123",
            "name": "Sarah's Wedding Reception",
            "type": "Wedding",
            "sub_type": "Reception Only",
            "date": (datetime.utcnow() - timedelta(days=90)).isoformat(),
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
                    "id": "v1",
                    "name": "Elegant Catering Co.",
                    "service": "Catering",
                    "cost": 12500,
                    "rating": 5,
                    "review": "Outstanding service, delicious food, professional staff"
                },
                {
                    "id": "v2",
                    "name": "Premier Photography",
                    "service": "Photography",
                    "cost": 2800,
                    "rating": 5,
                    "review": "Amazing shots, captured every moment perfectly"
                }
            ],
            "cultural_style": "American",
            "summary": "A beautiful wedding reception celebrating Sarah and John's special day.",
            "created_date": (datetime.utcnow() - timedelta(days=120)).isoformat(),
            "image_url": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=250&fit=crop"
        },
        {
            "id": "event_456",
            "name": "Corporate Annual Gala",
            "type": "Corporate",
            "date": (datetime.utcnow() - timedelta(days=180)).isoformat(),
            "status": "completed",
            "venue": {
                "name": "Manhattan Conference Center",
                "location": "Manhattan, NY"
            },
            "guests": 200,
            "budget": 15000,
            "total_spent": 14200,
            "vendors": [
                {
                    "id": "v5",
                    "name": "Business Catering Plus",
                    "service": "Catering",
                    "cost": 8000,
                    "rating": 4,
                    "review": "Professional service, good food quality"
                }
            ],
            "cultural_style": "American",
            "summary": "Successful corporate gala celebrating company achievements.",
            "created_date": (datetime.utcnow() - timedelta(days=210)).isoformat(),
            "image_url": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=250&fit=crop"
        }
    ]
    
    return {"events": event_history}

@api_router.post("/events/duplicate")
async def duplicate_event(
    duplicate_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Duplicate an existing event for reuse"""
    try:
        # Create new event based on existing event data
        new_event = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "name": duplicate_data["name"],
            "type": duplicate_data["type"],
            "sub_type": duplicate_data.get("sub_type"),
            "cultural_style": duplicate_data.get("cultural_style"),
            "venue_preferences": duplicate_data.get("venue_preferences"),
            "vendor_selections": duplicate_data.get("vendor_selections", []),
            "estimated_budget": duplicate_data.get("estimated_budget"),
            "estimated_guests": duplicate_data.get("estimated_guests"),
            "status": "planning",
            "created_at": datetime.utcnow().isoformat()
        }
        
        # In a real implementation, this would be saved to database
        
        return {"message": "Event duplicated successfully", "event_id": new_event["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to duplicate event: {str(e)}")

@api_router.get("/events/{event_id}/summary-pdf")
async def download_event_summary(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download event summary as PDF"""
    try:
        # In a real implementation, this would generate a PDF summary
        return {"message": f"Event summary PDF for {event_id} would be generated here"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate event summary: {str(e)}")

# Import admin and vendor routes after all functions are defined to avoid circular imports
# Temporarily disabled due to circular import issues
# try:
#     from admin_routes import admin_router
#     from vendor_subscription_routes import vendor_router
#     
#     # Include admin and vendor routers in the app
#     app.include_router(admin_router)
#     app.include_router(vendor_router)
#     print("✅ Admin and vendor routes loaded successfully")
# except ImportError as e:
#     print(f"⚠️ Warning: Could not load admin/vendor routes: {e}")
#     # Continue without these routes for now

# ====================================================================
# APPOINTMENT & CALENDAR SYSTEM API ENDPOINTS
# ====================================================================

# Vendor Availability Management
@api_router.post("/vendors/availability")
async def create_vendor_availability(
    availability: VendorAvailabilityRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create vendor availability time slot"""
    if current_user.get("role") != "vendor":
        raise HTTPException(status_code=403, detail="Only vendors can set availability")
    
    availability_data = VendorAvailability(
        vendor_id=current_user["id"],
        **availability.dict()
    )
    
    result = await db.vendor_availability.insert_one(availability_data.dict())
    return {"message": "Availability created successfully", "id": availability_data.id}

@api_router.get("/vendors/availability")
async def get_vendor_availability(
    current_user: dict = Depends(get_current_user)
):
    """Get vendor's availability schedule"""
    if current_user.get("role") != "vendor":
        raise HTTPException(status_code=403, detail="Only vendors can access this")
    
    availability = await db.vendor_availability.find(
        {"vendor_id": current_user["id"], "is_active": True}
    ).to_list(None)
    
    return {"availability": availability}

@api_router.get("/vendors/{vendor_id}/availability")
async def get_public_vendor_availability(
    vendor_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get vendor's public availability for booking appointments"""
    availability = await db.vendor_availability.find(
        {"vendor_id": vendor_id, "is_active": True}
    ).to_list(None)
    
    # Get existing appointments to filter out booked slots
    existing_appointments = await db.appointments.find({
        "vendor_id": vendor_id,
        "status": {"$in": ["approved", "confirmed"]},
        "scheduled_datetime": {"$gte": datetime.utcnow()}
    }).to_list(None)
    
    return {
        "availability": availability,
        "booked_slots": [apt["scheduled_datetime"] for apt in existing_appointments]
    }

@api_router.put("/vendors/availability/{availability_id}")
async def update_vendor_availability(
    availability_id: str,
    availability: VendorAvailabilityRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update vendor availability"""
    if current_user.get("role") != "vendor":
        raise HTTPException(status_code=403, detail="Only vendors can update availability")
    
    update_data = availability.dict()
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.vendor_availability.update_one(
        {"id": availability_id, "vendor_id": current_user["id"]},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Availability slot not found")
    
    return {"message": "Availability updated successfully"}

@api_router.delete("/vendors/availability/{availability_id}")
async def delete_vendor_availability(
    availability_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete vendor availability"""
    if current_user.get("role") != "vendor":
        raise HTTPException(status_code=403, detail="Only vendors can delete availability")
    
    result = await db.vendor_availability.update_one(
        {"id": availability_id, "vendor_id": current_user["id"]},
        {"$set": {"is_active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Availability slot not found")
    
    return {"message": "Availability deleted successfully"}

# Appointment Management
@api_router.post("/appointments")
async def create_appointment(
    appointment_request: CreateAppointmentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Client creates appointment request with vendor"""
    # Validate vendor exists
    vendor = await db.users.find_one({"id": appointment_request.vendor_id, "role": "vendor"})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Check if time slot is available
    existing_appointment = await db.appointments.find_one({
        "vendor_id": appointment_request.vendor_id,
        "scheduled_datetime": appointment_request.scheduled_datetime,
        "status": {"$in": ["approved", "confirmed"]}
    })
    
    if existing_appointment:
        raise HTTPException(status_code=400, detail="Time slot not available")
    
    # Create appointment
    appointment = Appointment(
        client_id=current_user["id"],
        **appointment_request.dict()
    )
    
    result = await db.appointments.insert_one(appointment.dict())
    
    # Create notification for vendor
    await create_appointment_notification(
        vendor_id=appointment_request.vendor_id,
        client_name=current_user.get("name", "Client"),
        appointment_type=appointment_request.appointment_type,
        scheduled_datetime=appointment_request.scheduled_datetime,
        appointment_id=appointment.id
    )
    
    # Add to client's calendar
    calendar_event = CalendarEvent(
        user_id=current_user["id"],
        title=f"Appointment with {vendor.get('name', 'Vendor')}",
        description=f"{appointment_request.appointment_type.title()} appointment for event planning",
        event_type="appointment",
        date=appointment_request.scheduled_datetime,
        appointment_id=appointment.id,
        vendor_id=appointment_request.vendor_id,
        reminder_minutes=[1440, 60]  # 24h and 1h reminders
    )
    await db.calendar_events.insert_one(calendar_event.dict())
    
    return {"message": "Appointment request created successfully", "appointment_id": appointment.id}

@api_router.get("/appointments")
async def get_appointments(
    current_user: dict = Depends(get_current_user)
):
    """Get user's appointments (client or vendor)"""
    if current_user.get("role") == "vendor":
        appointments = await db.appointments.find(
            {"vendor_id": current_user["id"]}
        ).sort("scheduled_datetime", 1).to_list(None)
    else:
        appointments = await db.appointments.find(
            {"client_id": current_user["id"]}
        ).sort("scheduled_datetime", 1).to_list(None)
    
    # Enrich with client/vendor information
    for appointment in appointments:
        if current_user.get("role") == "vendor":
            client = await db.users.find_one({"id": appointment["client_id"]})
            appointment["client_info"] = {
                "name": client.get("name") if client else "Unknown Client",
                "email": client.get("email") if client else ""
            }
        else:
            vendor = await db.users.find_one({"id": appointment["vendor_id"]})
            appointment["vendor_info"] = {
                "name": vendor.get("name") if vendor else "Unknown Vendor",
                "service": vendor.get("service") if vendor else "",
                "rating": vendor.get("rating", 0)
            }
    
    return {"appointments": appointments}

@api_router.get("/appointments/{appointment_id}")
async def get_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific appointment details"""
    appointment = await db.appointments.find_one({"id": appointment_id})
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check access permissions
    if (current_user["id"] != appointment["client_id"] and 
        current_user["id"] != appointment["vendor_id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Enrich with additional info
    client = await db.users.find_one({"id": appointment["client_id"]})
    vendor = await db.users.find_one({"id": appointment["vendor_id"]})
    
    appointment["client_info"] = {
        "name": client.get("name") if client else "Unknown Client",
        "email": client.get("email") if client else "",
        "phone": client.get("phone") if client else ""
    }
    appointment["vendor_info"] = {
        "name": vendor.get("name") if vendor else "Unknown Vendor",
        "service": vendor.get("service") if vendor else "",
        "rating": vendor.get("rating", 0),
        "contact": vendor.get("contact_info", {}) if vendor else {}
    }
    
    return {"appointment": appointment}

@api_router.put("/appointments/{appointment_id}/respond")
async def respond_to_appointment(
    appointment_id: str,
    response: AppointmentResponseRequest,
    current_user: dict = Depends(get_current_user)
):
    """Vendor responds to appointment request (approve/decline)"""
    appointment = await db.appointments.find_one({"id": appointment_id})
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Only vendor can respond
    if current_user["id"] != appointment["vendor_id"]:
        raise HTTPException(status_code=403, detail="Only the vendor can respond to this appointment")
    
    # Update appointment status
    update_data = {
        "status": response.status,
        "vendor_notes": response.vendor_notes,
        "updated_at": datetime.utcnow()
    }
    
    if response.status == "approved":
        update_data["approved_at"] = datetime.utcnow()
        if response.meeting_link and appointment["appointment_type"] == "virtual":
            update_data["meeting_link"] = response.meeting_link
        if response.suggested_datetime:
            update_data["scheduled_datetime"] = response.suggested_datetime
    
    result = await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": update_data}
    )
    
    # Notify client of vendor response
    client = await db.users.find_one({"id": appointment["client_id"]})
    if client:
        await create_appointment_response_notification(
            client_id=appointment["client_id"],
            vendor_name=current_user.get("name", "Vendor"),
            status=response.status,
            appointment_type=appointment["appointment_type"],
            scheduled_datetime=appointment["scheduled_datetime"],
            appointment_id=appointment_id
        )
    
    return {"message": f"Appointment {response.status} successfully"}

@api_router.put("/appointments/{appointment_id}/confirm")
async def confirm_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Client confirms approved appointment"""
    appointment = await db.appointments.find_one({"id": appointment_id})
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Only client can confirm
    if current_user["id"] != appointment["client_id"]:
        raise HTTPException(status_code=403, detail="Only the client can confirm this appointment")
    
    if appointment["status"] != "approved":
        raise HTTPException(status_code=400, detail="Appointment must be approved before confirmation")
    
    # Update appointment status
    result = await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {
            "status": "confirmed",
            "confirmed_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Add to vendor's calendar
    vendor = await db.users.find_one({"id": appointment["vendor_id"]})
    calendar_event = CalendarEvent(
        user_id=appointment["vendor_id"],
        title=f"Appointment with {current_user.get('name', 'Client')}",
        description=f"{appointment['appointment_type'].title()} appointment for event planning",
        event_type="appointment",
        date=appointment["scheduled_datetime"],
        appointment_id=appointment_id,
        vendor_id=appointment["vendor_id"],
        reminder_minutes=[1440, 60]  # 24h and 1h reminders
    )
    await db.calendar_events.insert_one(calendar_event.dict())
    
    return {"message": "Appointment confirmed successfully"}

@api_router.put("/appointments/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: str,
    reason: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Cancel appointment (client or vendor)"""
    appointment = await db.appointments.find_one({"id": appointment_id})
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check if user is involved in appointment
    if (current_user["id"] != appointment["client_id"] and 
        current_user["id"] != appointment["vendor_id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update appointment status
    result = await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {
            "status": "cancelled",
            "cancellation_reason": reason,
            "cancelled_by": current_user["id"],
            "cancelled_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Remove from calendars
    await db.calendar_events.delete_many({"appointment_id": appointment_id})
    
    return {"message": "Appointment cancelled successfully"}

# Calendar Management
@api_router.get("/calendar")
async def get_calendar_events(
    start_date: str = None,
    end_date: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get user's calendar events"""
    filter_query = {"user_id": current_user["id"]}
    
    if start_date and end_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            filter_query["date"] = {"$gte": start_dt, "$lte": end_dt}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
    
    events = await db.calendar_events.find(filter_query).sort("date", 1).to_list(None)
    
    # Also include appointments as calendar events
    appointment_query = {"$or": [
        {"client_id": current_user["id"]},
        {"vendor_id": current_user["id"]}
    ]}
    
    if start_date and end_date:
        appointment_query["scheduled_datetime"] = filter_query.get("date", {})
    
    appointments = await db.appointments.find(appointment_query).to_list(None)
    
    # Convert appointments to calendar event format
    for apt in appointments:
        is_client = apt["client_id"] == current_user["id"]
        other_user_id = apt["vendor_id"] if is_client else apt["client_id"]
        other_user = await db.users.find_one({"id": other_user_id})
        other_name = other_user.get("name", "Unknown") if other_user else "Unknown"
        
        events.append({
            "id": f"appointment_{apt['id']}",
            "title": f"Appointment with {other_name}",
            "description": f"{apt['appointment_type'].title()} - {apt.get('client_notes', '')}",
            "event_type": "appointment",
            "date": apt["scheduled_datetime"],
            "appointment_id": apt["id"],
            "status": apt["status"]
        })
    
    return {"events": events}

@api_router.post("/calendar")
async def create_calendar_event(
    event_request: CalendarEventRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create custom calendar event/note"""
    calendar_event = CalendarEvent(
        user_id=current_user["id"],
        **event_request.dict()
    )
    
    result = await db.calendar_events.insert_one(calendar_event.dict())
    return {"message": "Calendar event created successfully", "id": calendar_event.id}

@api_router.put("/calendar/{event_id}")
async def update_calendar_event(
    event_id: str,
    event_request: CalendarEventRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update calendar event"""
    update_data = event_request.dict()
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.calendar_events.update_one(
        {"id": event_id, "user_id": current_user["id"]},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    
    return {"message": "Calendar event updated successfully"}

@api_router.delete("/calendar/{event_id}")
async def delete_calendar_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete calendar event"""
    result = await db.calendar_events.delete_one({
        "id": event_id, 
        "user_id": current_user["id"],
        "event_type": {"$ne": "appointment"}  # Don't delete appointment events
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    
    return {"message": "Calendar event deleted successfully"}

# Notification System for Appointments
async def create_appointment_notification(vendor_id: str, client_name: str, appointment_type: str, 
                                       scheduled_datetime: datetime, appointment_id: str):
    """Create notification for vendor when appointment is requested"""
    # This would integrate with your notification system
    # For now, we'll create a simple in-app notification
    
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": vendor_id,
        "type": "appointment_request",
        "title": "New Appointment Request",
        "message": f"{client_name} requested a {appointment_type} appointment on {scheduled_datetime.strftime('%Y-%m-%d %H:%M')}",
        "data": {
            "appointment_id": appointment_id,
            "client_name": client_name,
            "appointment_type": appointment_type,
            "scheduled_datetime": scheduled_datetime.isoformat()
        },
        "read": False,
        "created_at": datetime.utcnow()
    }
    
    await db.notifications.insert_one(notification)
    
    # TODO: Send email/SMS notifications here
    # await send_email_notification(vendor_email, notification)
    # await send_sms_notification(vendor_phone, notification)

async def create_appointment_response_notification(client_id: str, vendor_name: str, status: str,
                                                 appointment_type: str, scheduled_datetime: datetime, 
                                                 appointment_id: str):
    """Create notification for client when vendor responds to appointment"""
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": client_id,
        "type": "appointment_response",
        "title": f"Appointment {status.title()}",
        "message": f"{vendor_name} has {status} your {appointment_type} appointment on {scheduled_datetime.strftime('%Y-%m-%d %H:%M')}",
        "data": {
            "appointment_id": appointment_id,
            "vendor_name": vendor_name,
            "status": status,
            "appointment_type": appointment_type,
            "scheduled_datetime": scheduled_datetime.isoformat()
        },
        "read": False,
        "created_at": datetime.utcnow()
    }
    
    await db.notifications.insert_one(notification)

# Payment Deadline Automation
async def create_payment_deadline_events(booking_id: str, user_id: str, vendor_name: str, 
                                       payment_amount: float, due_date: datetime):
    """Automatically create calendar events for payment deadlines"""
    # Main payment deadline
    payment_event = CalendarEvent(
        user_id=user_id,
        title=f"Payment Due: {vendor_name}",
        description=f"Final payment of ${payment_amount:,.2f} due for {vendor_name}",
        event_type="payment_deadline",
        date=due_date,
        booking_id=booking_id,
        reminder_minutes=[10080, 4320, 1440]  # 7 days, 3 days, 1 day
    )
    
    await db.calendar_events.insert_one(payment_event.dict())
    
    # Create reminder events
    reminder_dates = [
        due_date - timedelta(days=7),
        due_date - timedelta(days=3),
        due_date - timedelta(days=1)
    ]
    
    for i, reminder_date in enumerate(reminder_dates):
        if reminder_date > datetime.utcnow():
            days_before = [7, 3, 1][i]
            reminder_event = CalendarEvent(
                user_id=user_id,
                title=f"Payment Reminder: {vendor_name}",
                description=f"Payment of ${payment_amount:,.2f} due in {days_before} day(s)",
                event_type="reminder",
                date=reminder_date,
                booking_id=booking_id
            )
            await db.calendar_events.insert_one(reminder_event.dict())

# Include router in main app
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": "Urevent 360 API"}