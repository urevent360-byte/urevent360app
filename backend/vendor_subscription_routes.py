from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
from .server import get_current_user, db

# Vendor subscription routes
vendor_router = APIRouter(prefix="/api/vendor")

# Vendor Subscription Models
class VendorRegistration(BaseModel):
    business_name: str
    owner_name: str
    email: EmailStr
    mobile: str
    business_type: str
    service_category: str
    address: str
    city: str
    state: str
    zip_code: str
    description: str
    website: Optional[str] = None
    social_media: Optional[Dict[str, str]] = {}
    business_license: str
    insurance_info: Optional[str] = None
    experience_years: int
    portfolio_images: List[str] = []
    price_range: Dict[str, float]  # min, max

class VendorSubscription(BaseModel):
    vendor_id: str
    plan_type: str  # basic, premium, enterprise
    monthly_fee: float
    features: List[str]
    status: str = "active"  # active, suspended, cancelled
    start_date: datetime
    next_billing_date: datetime
    payment_method: Optional[str] = None

class VendorProfile(BaseModel):
    id: str
    business_name: str
    owner_name: str
    email: EmailStr
    mobile: str
    business_type: str
    service_category: str
    address: str
    city: str
    state: str
    description: str
    website: Optional[str] = None
    portfolio_images: List[str] = []
    price_range: Dict[str, float]
    rating: float = 0.0
    total_reviews: int = 0
    subscription_status: str
    subscription_plan: str
    created_at: datetime
    verified: bool = False

class VendorService(BaseModel):
    id: str = None
    vendor_id: str
    service_name: str
    service_description: str
    price: float
    duration: Optional[str] = None  # "2 hours", "full day", etc.
    includes: List[str] = []
    add_ons: List[Dict[str, Any]] = []
    availability: List[str] = []

class VendorPayment(BaseModel):
    id: str = None
    vendor_id: str
    amount: float
    payment_type: str  # subscription, commission, withdrawal
    status: str  # pending, completed, failed
    payment_date: datetime
    billing_period: Optional[str] = None

# Subscription Plans
SUBSCRIPTION_PLANS = {
    "basic": {
        "monthly_fee": 99.0,
        "features": [
            "Profile listing",
            "Basic portfolio showcase",
            "Customer inquiries",
            "5 service listings",
            "Basic analytics"
        ]
    },
    "premium": {
        "monthly_fee": 199.0,
        "features": [
            "Enhanced profile listing",
            "Unlimited portfolio showcase",
            "Priority customer inquiries",
            "Unlimited service listings",
            "Advanced analytics",
            "Featured placement",
            "Customer review management"
        ]
    },
    "enterprise": {
        "monthly_fee": 399.0,
        "features": [
            "Premium profile listing",
            "Unlimited portfolio showcase",
            "Top priority customer inquiries",
            "Unlimited service listings",
            "Premium analytics dashboard",
            "Top featured placement",
            "Dedicated account manager",
            "Custom branding options",
            "Lead generation tools"
        ]
    }
}

# Vendor Registration
@vendor_router.post("/register")
async def register_vendor(vendor_data: VendorRegistration):
    """Register a new vendor"""
    # Check if vendor already exists
    existing_vendor = await db.vendors.find_one({"email": vendor_data.email})
    if existing_vendor:
        raise HTTPException(status_code=400, detail="Vendor already registered with this email")
    
    vendor_dict = vendor_data.dict()
    vendor_dict["id"] = str(uuid.uuid4())
    vendor_dict["created_at"] = datetime.utcnow()
    vendor_dict["status"] = "pending_subscription"  # Pending until subscription is activated
    vendor_dict["verified"] = False
    vendor_dict["rating"] = 0.0
    vendor_dict["total_reviews"] = 0
    
    await db.vendors.insert_one(vendor_dict)
    return {"message": "Vendor registered successfully. Please complete subscription to activate your profile.", "vendor_id": vendor_dict["id"]}

# Vendor Subscription Management
@vendor_router.post("/subscribe")
async def create_subscription(vendor_id: str, plan_type: str, payment_method: str):
    """Create a subscription for a vendor"""
    if plan_type not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid subscription plan")
    
    vendor = await db.vendors.find_one({"id": vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    plan = SUBSCRIPTION_PLANS[plan_type]
    
    subscription = {
        "id": str(uuid.uuid4()),
        "vendor_id": vendor_id,
        "plan_type": plan_type,
        "monthly_fee": plan["monthly_fee"],
        "features": plan["features"],
        "status": "active",
        "start_date": datetime.utcnow(),
        "next_billing_date": datetime.utcnow() + timedelta(days=30),
        "payment_method": payment_method,
        "created_at": datetime.utcnow()
    }
    
    await db.vendor_subscriptions.insert_one(subscription)
    
    # Update vendor status to active
    await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {
            "status": "active",
            "subscription_status": "active",
            "subscription_plan": plan_type,
            "subscription_activated_at": datetime.utcnow()
        }}
    )
    
    # Record payment
    payment = {
        "id": str(uuid.uuid4()),
        "vendor_id": vendor_id,
        "amount": plan["monthly_fee"],
        "payment_type": "subscription",
        "status": "completed",
        "payment_date": datetime.utcnow(),
        "billing_period": f"{datetime.utcnow().strftime('%Y-%m')}"
    }
    await db.vendor_payments.insert_one(payment)
    
    return {"message": "Subscription activated successfully", "subscription_id": subscription["id"]}

# Get Active Subscribed Vendors (for marketplace display)
@vendor_router.get("/marketplace", response_model=List[VendorProfile])
async def get_marketplace_vendors(
    service_type: Optional[str] = None,
    location: Optional[str] = None,
    min_budget: Optional[float] = None,
    max_budget: Optional[float] = None,
    city: Optional[str] = None
):
    """Get only active subscribed vendors for marketplace"""
    query = {
        "status": "active",
        "subscription_status": "active"
    }
    
    if service_type:
        query["service_category"] = service_type
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if location:
        query["$or"] = [
            {"city": {"$regex": location, "$options": "i"}},
            {"state": {"$regex": location, "$options": "i"}},
            {"address": {"$regex": location, "$options": "i"}}
        ]
    
    # Check subscription is not expired
    current_date = datetime.utcnow()
    active_subs = await db.vendor_subscriptions.find({
        "status": "active",
        "next_billing_date": {"$gte": current_date}
    }).to_list(1000)
    
    active_vendor_ids = [sub["vendor_id"] for sub in active_subs]
    query["id"] = {"$in": active_vendor_ids}
    
    if min_budget and max_budget:
        query["$and"] = [
            {"price_range.min": {"$lte": max_budget}},
            {"price_range.max": {"$gte": min_budget}}
        ]
    
    vendors = await db.vendors.find(query).to_list(1000)
    return [VendorProfile(**vendor) for vendor in vendors]

# Vendor Profile Management
@vendor_router.get("/profile/{vendor_id}")
async def get_vendor_profile(vendor_id: str):
    """Get vendor profile details"""
    vendor = await db.vendors.find_one({"id": vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Get subscription details
    subscription = await db.vendor_subscriptions.find_one({"vendor_id": vendor_id, "status": "active"})
    
    # Get services
    services = await db.vendor_services.find({"vendor_id": vendor_id}).to_list(1000)
    
    # Get recent payments
    payments = await db.vendor_payments.find({"vendor_id": vendor_id}).sort("payment_date", -1).limit(5).to_list(5)
    
    return {
        "profile": vendor,
        "subscription": subscription,
        "services": services,
        "recent_payments": payments
    }

@vendor_router.put("/profile/{vendor_id}")
async def update_vendor_profile(vendor_id: str, profile_data: dict):
    """Update vendor profile"""
    result = await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {**profile_data, "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {"message": "Profile updated successfully"}

# Vendor Services Management
@vendor_router.post("/services")
async def add_vendor_service(service: VendorService):
    """Add a new service for vendor"""
    service_dict = service.dict()
    service_dict["id"] = str(uuid.uuid4())
    service_dict["created_at"] = datetime.utcnow()
    
    await db.vendor_services.insert_one(service_dict)
    return VendorService(**service_dict)

@vendor_router.get("/services/{vendor_id}")
async def get_vendor_services(vendor_id: str):
    """Get all services for a vendor"""
    services = await db.vendor_services.find({"vendor_id": vendor_id}).to_list(1000)
    return services

@vendor_router.put("/services/{service_id}")
async def update_vendor_service(service_id: str, service_data: dict):
    """Update a vendor service"""
    result = await db.vendor_services.update_one(
        {"id": service_id},
        {"$set": {**service_data, "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"message": "Service updated successfully"}

@vendor_router.delete("/services/{service_id}")
async def delete_vendor_service(service_id: str):
    """Delete a vendor service"""
    result = await db.vendor_services.delete_one({"id": service_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"message": "Service deleted successfully"}

# Subscription Management
@vendor_router.get("/subscription/{vendor_id}")
async def get_vendor_subscription(vendor_id: str):
    """Get vendor subscription details"""
    subscription = await db.vendor_subscriptions.find_one({"vendor_id": vendor_id, "status": "active"})
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    return subscription

@vendor_router.put("/subscription/{vendor_id}/upgrade")
async def upgrade_subscription(vendor_id: str, new_plan: str):
    """Upgrade vendor subscription plan"""
    if new_plan not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid subscription plan")
    
    current_sub = await db.vendor_subscriptions.find_one({"vendor_id": vendor_id, "status": "active"})
    if not current_sub:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    plan = SUBSCRIPTION_PLANS[new_plan]
    
    # Update subscription
    await db.vendor_subscriptions.update_one(
        {"vendor_id": vendor_id, "status": "active"},
        {"$set": {
            "plan_type": new_plan,
            "monthly_fee": plan["monthly_fee"],
            "features": plan["features"],
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Update vendor record
    await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {"subscription_plan": new_plan}}
    )
    
    return {"message": f"Subscription upgraded to {new_plan} successfully"}

@vendor_router.post("/subscription/{vendor_id}/cancel")
async def cancel_subscription(vendor_id: str, reason: Optional[str] = None):
    """Cancel vendor subscription"""
    await db.vendor_subscriptions.update_one(
        {"vendor_id": vendor_id, "status": "active"},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.utcnow(),
            "cancellation_reason": reason
        }}
    )
    
    # Update vendor status
    await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {
            "status": "inactive",
            "subscription_status": "cancelled"
        }}
    )
    
    return {"message": "Subscription cancelled successfully"}

# Payment and Billing
@vendor_router.get("/billing/{vendor_id}")
async def get_vendor_billing(vendor_id: str):
    """Get vendor billing history"""
    payments = await db.vendor_payments.find({"vendor_id": vendor_id}).sort("payment_date", -1).to_list(1000)
    
    subscription = await db.vendor_subscriptions.find_one({"vendor_id": vendor_id, "status": "active"})
    
    return {
        "payments": payments,
        "subscription": subscription,
        "next_billing_date": subscription["next_billing_date"] if subscription else None
    }

@vendor_router.post("/billing/{vendor_id}/process")
async def process_monthly_billing(vendor_id: str):
    """Process monthly billing for vendor"""
    subscription = await db.vendor_subscriptions.find_one({"vendor_id": vendor_id, "status": "active"})
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    # Create payment record
    payment = {
        "id": str(uuid.uuid4()),
        "vendor_id": vendor_id,
        "amount": subscription["monthly_fee"],
        "payment_type": "subscription",
        "status": "completed",  # In real app, integrate with payment gateway
        "payment_date": datetime.utcnow(),
        "billing_period": datetime.utcnow().strftime('%Y-%m')
    }
    
    await db.vendor_payments.insert_one(payment)
    
    # Update next billing date
    next_billing = subscription["next_billing_date"] + timedelta(days=30)
    await db.vendor_subscriptions.update_one(
        {"vendor_id": vendor_id, "status": "active"},
        {"$set": {"next_billing_date": next_billing}}
    )
    
    return {"message": "Monthly billing processed successfully", "payment_id": payment["id"]}

# Analytics for Vendors
@vendor_router.get("/analytics/{vendor_id}")
async def get_vendor_analytics(vendor_id: str):
    """Get vendor analytics and performance metrics"""
    # Get inquiries/leads
    leads = await db.vendor_leads.find({"vendor_id": vendor_id}).to_list(1000)
    
    # Get bookings
    bookings = await db.bookings.find({"vendor_id": vendor_id}).to_list(1000)
    
    # Calculate metrics
    total_leads = len(leads)
    total_bookings = len(bookings)
    conversion_rate = (total_bookings / total_leads * 100) if total_leads > 0 else 0
    
    monthly_leads = len([l for l in leads if datetime.fromisoformat(l["created_at"].replace('Z', '+00:00')).month == datetime.utcnow().month])
    monthly_bookings = len([b for b in bookings if datetime.fromisoformat(b["booking_date"].replace('Z', '+00:00')).month == datetime.utcnow().month])
    
    total_revenue = sum([b["price"] for b in bookings if b["status"] == "completed"])
    
    return {
        "total_leads": total_leads,
        "total_bookings": total_bookings,
        "conversion_rate": round(conversion_rate, 2),
        "monthly_leads": monthly_leads,
        "monthly_bookings": monthly_bookings,
        "total_revenue": total_revenue,
        "average_booking_value": round(total_revenue / total_bookings, 2) if total_bookings > 0 else 0
    }

# Get subscription plans
@vendor_router.get("/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    return SUBSCRIPTION_PLANS