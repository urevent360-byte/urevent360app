from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
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
    venue_id: Optional[str] = None
    budget: Optional[float] = None
    estimated_budget: Optional[float] = None
    guest_count: Optional[int] = None
    status: str = "planning"  # planning, booked, completed, cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)

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

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id, "user_id": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return Event(**event)

@api_router.put("/events/{event_id}")
async def update_event(event_id: str, event_data: dict, current_user: dict = Depends(get_current_user)):
    result = await db.events.update_one(
        {"id": event_id, "user_id": current_user["id"]},
        {"$set": event_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event updated successfully"}

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
    
    return {
        "event_id": event_id,
        "event_name": event["name"],
        "total_budget": total_budget,
        "total_paid": total_paid,
        "remaining_balance": remaining_balance,
        "payment_progress": (total_paid / total_budget * 100) if total_budget > 0 else 0,
        "vendor_payments": vendor_payment_status,
        "recent_payments": sorted(payments, key=lambda x: x["payment_date"], reverse=True)[:5]
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