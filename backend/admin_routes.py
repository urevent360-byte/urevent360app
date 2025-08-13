from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from .server import get_current_user, db

# Admin routes
admin_router = APIRouter(prefix="/api/admin")

# Admin Models
class AdminUser(BaseModel):
    id: str
    name: str
    email: EmailStr
    mobile: str
    role: str = "admin"
    created_at: datetime
    is_active: bool = True
    permissions: List[str] = []

class BusinessApplication(BaseModel):
    id: str = None
    business_name: str
    owner_name: str
    email: EmailStr
    mobile: str
    business_type: str
    address: str
    description: str
    documents: List[str] = []
    status: str = "pending"
    applied_at: datetime = None
    reviewed_at: Optional[datetime] = None
    reviewer_id: Optional[str] = None

class CommissionSettings(BaseModel):
    business_id: str
    registration_fee: float
    commission_percentage: float
    subscription_fee: float

class Associate(BaseModel):
    id: str = None
    name: str
    email: EmailStr
    mobile: str
    business_id: str
    role: str
    commission_rate: float
    status: str = "active"
    created_at: datetime = None

class Vendor(BaseModel):
    id: str = None
    name: str
    service_type: str
    contact_info: Dict[str, str]
    commission_rate: float
    status: str = "active"
    created_at: datetime = None

# Admin Authentication Check
async def verify_admin(current_user: dict = Depends(get_current_user)):
    # In a real app, check if user has admin role
    # For demo, we'll allow any authenticated user to access admin
    return current_user

# Users Management Routes
@admin_router.get("/users", response_model=List[dict])
async def get_all_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    admin_user: dict = Depends(verify_admin)
):
    """Get all users with pagination and search"""
    skip = (page - 1) * limit
    query = {}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    users = await db.users.find(query).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {
        "users": users,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@admin_router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    status: dict,
    admin_user: dict = Depends(verify_admin)
):
    """Update user active status"""
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": status.get("is_active", True)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User status updated successfully"}

@admin_router.get("/users/{user_id}/events")
async def get_user_events(
    user_id: str,
    admin_user: dict = Depends(verify_admin)
):
    """Get all events created by a specific user"""
    events = await db.events.find({"user_id": user_id}).to_list(1000)
    return events

# Business Management Routes
@admin_router.get("/businesses/applications")
async def get_business_applications(
    status: Optional[str] = None,
    admin_user: dict = Depends(verify_admin)
):
    """Get business applications with optional status filter"""
    query = {}
    if status:
        query["status"] = status
    
    applications = await db.business_applications.find(query).to_list(1000)
    return applications

@admin_router.post("/businesses/applications")
async def create_business_application(
    application: BusinessApplication,
    admin_user: dict = Depends(verify_admin)
):
    """Create a new business application"""
    app_dict = application.dict()
    app_dict["id"] = str(uuid.uuid4())
    app_dict["applied_at"] = datetime.utcnow()
    app_dict["status"] = "pending"
    
    await db.business_applications.insert_one(app_dict)
    return BusinessApplication(**app_dict)

@admin_router.put("/businesses/applications/{app_id}/review")
async def review_business_application(
    app_id: str,
    review_data: dict,
    admin_user: dict = Depends(verify_admin)
):
    """Approve or reject business application"""
    status = review_data.get("status")  # "approved" or "rejected"
    comments = review_data.get("comments", "")
    
    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.business_applications.update_one(
        {"id": app_id},
        {
            "$set": {
                "status": status,
                "reviewed_at": datetime.utcnow(),
                "reviewer_id": admin_user["id"],
                "review_comments": comments
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # If approved, create business account
    if status == "approved":
        application = await db.business_applications.find_one({"id": app_id})
        business_data = {
            "id": str(uuid.uuid4()),
            "name": application["business_name"],
            "owner_name": application["owner_name"],
            "email": application["email"],
            "mobile": application["mobile"],
            "business_type": application["business_type"],
            "address": application["address"],
            "description": application["description"],
            "status": "active",
            "created_at": datetime.utcnow(),
            "application_id": app_id
        }
        await db.businesses.insert_one(business_data)
    
    return {"message": f"Application {status} successfully"}

@admin_router.get("/businesses")
async def get_businesses(
    status: Optional[str] = None,
    admin_user: dict = Depends(verify_admin)
):
    """Get all registered businesses"""
    query = {}
    if status:
        query["status"] = status
    
    businesses = await db.businesses.find(query).to_list(1000)
    return businesses

@admin_router.put("/businesses/{business_id}/commission")
async def set_business_commission(
    business_id: str,
    commission_data: CommissionSettings,
    admin_user: dict = Depends(verify_admin)
):
    """Set commission rates for a business"""
    commission_dict = commission_data.dict()
    commission_dict["updated_at"] = datetime.utcnow()
    commission_dict["updated_by"] = admin_user["id"]
    
    await db.business_commissions.update_one(
        {"business_id": business_id},
        {"$set": commission_dict},
        upsert=True
    )
    
    return {"message": "Commission settings updated successfully"}

@admin_router.get("/businesses/{business_id}/financials")
async def get_business_financials(
    business_id: str,
    admin_user: dict = Depends(verify_admin)
):
    """Get financial dashboard for a business"""
    # Get commission settings
    commission = await db.business_commissions.find_one({"business_id": business_id})
    
    # Get payment statistics (mock data for demo)
    total_revenue = 50000.0
    commission_earned = 7500.0
    pending_payments = 1200.0
    
    return {
        "business_id": business_id,
        "commission_settings": commission,
        "financials": {
            "total_revenue": total_revenue,
            "commission_earned": commission_earned,
            "pending_payments": pending_payments,
            "payment_history": []
        }
    }

# Associates Management Routes
@admin_router.get("/associates")
async def get_associates(
    business_id: Optional[str] = None,
    admin_user: dict = Depends(verify_admin)
):
    """Get all associates"""
    query = {}
    if business_id:
        query["business_id"] = business_id
    
    associates = await db.associates.find(query).to_list(1000)
    return associates

@admin_router.post("/associates")
async def create_associate(
    associate: Associate,
    admin_user: dict = Depends(verify_admin)
):
    """Create a new associate"""
    assoc_dict = associate.dict()
    assoc_dict["id"] = str(uuid.uuid4())
    assoc_dict["created_at"] = datetime.utcnow()
    
    await db.associates.insert_one(assoc_dict)
    return Associate(**assoc_dict)

@admin_router.get("/associates/{associate_id}/reviews")
async def get_associate_reviews(
    associate_id: str,
    admin_user: dict = Depends(verify_admin)
):
    """Get reviews for an associate"""
    reviews = await db.associate_reviews.find({"associate_id": associate_id}).to_list(1000)
    return reviews

@admin_router.get("/associates/{associate_id}/attendance")
async def get_associate_attendance(
    associate_id: str,
    month: Optional[str] = None,
    admin_user: dict = Depends(verify_admin)
):
    """Get attendance records for an associate"""
    query = {"associate_id": associate_id}
    if month:
        # Filter by month (format: YYYY-MM)
        query["date"] = {"$regex": f"^{month}"}
    
    attendance = await db.associate_attendance.find(query).to_list(1000)
    return attendance

# Vendors Management Routes
@admin_router.get("/vendors")
async def get_vendors(
    service_type: Optional[str] = None,
    admin_user: dict = Depends(verify_admin)
):
    """Get all vendors"""
    query = {}
    if service_type:
        query["service_type"] = service_type
    
    vendors = await db.vendors.find(query).to_list(1000)
    return vendors

@admin_router.put("/vendors/{vendor_id}/commission")
async def set_vendor_commission(
    vendor_id: str,
    commission_data: dict,
    admin_user: dict = Depends(verify_admin)
):
    """Set commission rate for a vendor"""
    result = await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {
            "commission_rate": commission_data.get("commission_rate", 0),
            "updated_at": datetime.utcnow()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {"message": "Vendor commission updated successfully"}

@admin_router.get("/vendors/{vendor_id}/leads")
async def get_vendor_leads(
    vendor_id: str,
    admin_user: dict = Depends(verify_admin)
):
    """Get leads for a specific vendor"""
    leads = await db.vendor_leads.find({"vendor_id": vendor_id}).to_list(1000)
    return leads

# Operations Executive Routes
@admin_router.get("/executives")
async def get_executives(
    admin_user: dict = Depends(verify_admin)
):
    """Get all operation executives"""
    executives = await db.executives.find({}).to_list(1000)
    return executives

@admin_router.post("/executives")
async def create_executive(
    executive_data: dict,
    admin_user: dict = Depends(verify_admin)
):
    """Create a new operation executive"""
    executive = {
        "id": str(uuid.uuid4()),
        "name": executive_data["name"],
        "email": executive_data["email"],
        "role": executive_data["role"],
        "permissions": executive_data.get("permissions", []),
        "created_at": datetime.utcnow(),
        "created_by": admin_user["id"]
    }
    
    await db.executives.insert_one(executive)
    return executive

@admin_router.get("/executives/{executive_id}/tasks")
async def get_executive_tasks(
    executive_id: str,
    admin_user: dict = Depends(verify_admin)
):
    """Get tasks assigned to an executive"""
    tasks = await db.executive_tasks.find({"executive_id": executive_id}).to_list(1000)
    return tasks

@admin_router.post("/executives/{executive_id}/tasks")
async def assign_task_to_executive(
    executive_id: str,
    task_data: dict,
    admin_user: dict = Depends(verify_admin)
):
    """Assign a task to an executive"""
    task = {
        "id": str(uuid.uuid4()),
        "executive_id": executive_id,
        "title": task_data["title"],
        "description": task_data["description"],
        "priority": task_data.get("priority", "medium"),
        "due_date": task_data.get("due_date"),
        "status": "assigned",
        "assigned_at": datetime.utcnow(),
        "assigned_by": admin_user["id"]
    }
    
    await db.executive_tasks.insert_one(task)
    return task

# Analytics and Dashboard Routes
@admin_router.get("/dashboard/stats")
async def get_dashboard_stats(
    admin_user: dict = Depends(verify_admin)
):
    """Get admin dashboard statistics"""
    total_users = await db.users.count_documents({})
    total_events = await db.events.count_documents({})
    pending_applications = await db.business_applications.count_documents({"status": "pending"})
    active_businesses = await db.businesses.count_documents({"status": "active"})
    
    return {
        "total_users": total_users,
        "total_events": total_events,
        "pending_applications": pending_applications,
        "active_businesses": active_businesses,
        "total_vendors": await db.vendors.count_documents({}),
        "total_associates": await db.associates.count_documents({}),
        "revenue_this_month": 125000.0,  # Mock data
        "commission_earned": 18750.0     # Mock data
    }

@admin_router.get("/reports/revenue")
async def get_revenue_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin_user: dict = Depends(verify_admin)
):
    """Get revenue report"""
    # Mock revenue data for demo
    return {
        "total_revenue": 250000.0,
        "commission_revenue": 37500.0,
        "subscription_revenue": 12000.0,
        "monthly_breakdown": [
            {"month": "2024-01", "revenue": 45000.0, "commission": 6750.0},
            {"month": "2024-02", "revenue": 52000.0, "commission": 7800.0},
            {"month": "2024-03", "revenue": 48000.0, "commission": 7200.0}
        ]
    }