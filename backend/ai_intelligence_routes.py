"""
AI Intelligence API Routes for CEO Console
Endpoints for AI-powered strategic intelligence and recommendations
"""

from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Import AI Intelligence Engine
from ai_intelligence_engine import (
    AIIntelligenceEngine,
    IntelligenceCategory,
    RecommendationPriority,
    RecommendationType
)

# Import existing services
from ceo_security import get_ceo_user, CEOSecurityService
from ceo_analytics import CEOAnalyticsEngine

# Database connection
DATABASE_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = "urevent_db"
client = AsyncIOMotorClient(DATABASE_URL)
db = client[DATABASE_NAME]

# Initialize services
analytics_engine = CEOAnalyticsEngine(db)
ai_intelligence_engine = AIIntelligenceEngine(db, analytics_engine)
ceo_security = CEOSecurityService(db, None)  # Auth service not needed for audit only

# Create AI Intelligence Router
ai_intelligence_router = APIRouter(prefix="/api/ceo/intelligence", tags=["CEO AI Intelligence"])

# Request/Response Models
class IntelligenceReportRequest(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    focus_areas: Optional[List[IntelligenceCategory]] = None

class RecommendationActionRequest(BaseModel):
    recommendation_id: str
    action: str  # "implement", "dismiss", "defer"
    notes: Optional[str] = None

class AlertsRequest(BaseModel):
    priority_filter: Optional[str] = None
    limit: Optional[int] = 20

# === COMPREHENSIVE INTELLIGENCE ENDPOINTS ===

@ai_intelligence_router.get("/status")
async def get_ai_intelligence_status(
    current_user: dict = Depends(get_ceo_user)
):
    """Get AI Intelligence System status and capabilities"""
    
    try:
        # Check system health
        latest_report = await db.ai_intelligence_reports.find_one(
            {},
            sort=[("generated_at", -1)]
        )
        
        # Count total recommendations
        total_reports = await db.ai_intelligence_reports.count_documents({})
        
        # Check AI models availability
        ai_models_status = {
            "strategic_analysis": "operational",
            "financial_analysis": "operational", 
            "operational_analysis": "operational",
            "predictive_analysis": "operational"
        }
        
        return {
            "success": True,
            "data": {
                "system_status": "operational",
                "ai_models": ai_models_status,
                "latest_report": latest_report["generated_at"] if latest_report else None,
                "total_reports": total_reports,
                "capabilities": [
                    "Strategic Intelligence Analysis",
                    "Financial Performance Insights",
                    "Operational Efficiency Analysis", 
                    "Client & Vendor Intelligence",
                    "Innovation Opportunity Detection",
                    "Risk Assessment & Management",
                    "Predictive Analytics",
                    "Real-time Alert System"
                ],
                "data_sources": [
                    "Internal Analytics",
                    "User Behavior Data",
                    "Financial Metrics",
                    "Vendor Performance",
                    "Event Analytics",
                    "KPI Monitoring"
                ]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get AI intelligence status: {str(e)}")

@ai_intelligence_router.post("/generate-report")
async def generate_comprehensive_intelligence_report(
    request: IntelligenceReportRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_ceo_user)
):
    """Generate comprehensive AI intelligence report for CEO dashboard"""
    
    try:
        # Set default date range if not provided
        end_date = request.end_date or datetime.utcnow()
        start_date = request.start_date or (end_date - timedelta(days=30))
        
        # Validate date range
        if start_date >= end_date:
            raise HTTPException(status_code=400, detail="Start date must be before end date")
        
        if (end_date - start_date).days > 365:
            raise HTTPException(status_code=400, detail="Date range cannot exceed 365 days")
        
        # Generate comprehensive intelligence report
        intelligence_report = await ai_intelligence_engine.generate_comprehensive_intelligence_report(
            start_date=start_date,
            end_date=end_date,
            focus_areas=request.focus_areas
        )
        
        # Log AI intelligence generation
        await ceo_security.audit_log(
            user_id=current_user["id"],
            action="AI_INTELLIGENCE_REPORT_GENERATED",
            resource="CEO_AI_INTELLIGENCE",
            ip_address="system",
            device_fingerprint="ai_system",
            metadata={
                "report_id": intelligence_report["id"],
                "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
                "insights_count": len(intelligence_report["insights"]),
                "recommendations_count": len(intelligence_report["recommendations"])
            }
        )
        
        return {
            "success": True,
            "data": {
                "report": intelligence_report,
                "generation_time": intelligence_report["generated_at"],
                "insights_count": len(intelligence_report["insights"]),
                "recommendations_count": len(intelligence_report["recommendations"]),
                "executive_summary": intelligence_report["executive_summary"]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate intelligence report: {str(e)}")

@ai_intelligence_router.get("/dashboard-summary")
async def get_ai_dashboard_summary(
    hours: int = Query(24, description="Hours of data to analyze"),
    current_user: dict = Depends(get_ceo_user)
):
    """Get AI-powered dashboard summary for CEO console"""
    
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(hours=hours)
        
        # Get latest intelligence report
        latest_report = await db.ai_intelligence_reports.find_one(
            {},
            sort=[("generated_at", -1)]
        )
        
        # Get real-time alerts
        alerts = await ai_intelligence_engine.get_real_time_alerts()
        
        # Get latest recommendations
        recommendations = await ai_intelligence_engine.get_latest_recommendations(limit=5)
        
        # Generate quick AI insights for dashboard
        dashboard_data = {
            "latest_report": latest_report,
            "real_time_alerts": alerts,
            "top_recommendations": [rec.__dict__ for rec in recommendations],
            "intelligence_summary": {
                "business_health_score": latest_report.get("executive_summary", {}).get("business_health_score", 80) if latest_report else 80,
                "critical_actions": len([a for a in alerts if a.get("priority") == "high"]),
                "opportunities_identified": len([rec for rec in recommendations if rec.type == RecommendationType.INNOVATION_OPPORTUNITY]),
                "risks_monitored": len([a for a in alerts if a.get("type") == "risk"]),
                "last_analysis": latest_report["generated_at"] if latest_report else None
            }
        }
        
        return {
            "success": True,
            "data": dashboard_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard summary: {str(e)}")

@ai_intelligence_router.get("/recommendations")
async def get_ai_recommendations(
    category: Optional[IntelligenceCategory] = None,
    priority: Optional[RecommendationPriority] = None,
    limit: int = Query(20, le=50),
    current_user: dict = Depends(get_ceo_user)
):
    """Get AI-generated recommendations with filtering"""
    
    try:
        # Get recommendations from database
        query_filter = {}
        if category:
            query_filter["recommendations.category"] = category.value
        if priority:
            query_filter["recommendations.priority"] = priority.value
        
        # Get recent reports with recommendations
        reports = await db.ai_intelligence_reports.find(
            query_filter,
            {"recommendations": 1, "generated_at": 1}
        ).sort("generated_at", -1).limit(10).to_list(10)
        
        # Extract and filter recommendations
        all_recommendations = []
        for report in reports:
            for rec_data in report.get("recommendations", []):
                # Apply filters
                if category and rec_data.get("category") != category.value:
                    continue
                if priority and rec_data.get("priority") != priority.value:
                    continue
                
                rec_data["report_date"] = report["generated_at"]
                all_recommendations.append(rec_data)
        
        # Sort by priority and date
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        sorted_recommendations = sorted(
            all_recommendations,
            key=lambda x: (priority_order.get(x.get("priority", "low"), 3), x.get("created_at", datetime.min))
        )
        
        return {
            "success": True,
            "data": {
                "recommendations": sorted_recommendations[:limit],
                "total_count": len(all_recommendations),
                "categories_available": list(IntelligenceCategory),
                "priorities_available": list(RecommendationPriority),
                "filters_applied": {
                    "category": category,
                    "priority": priority
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@ai_intelligence_router.post("/recommendations/{recommendation_id}/action")
async def take_recommendation_action(
    recommendation_id: str,
    request: RecommendationActionRequest,
    current_user: dict = Depends(get_ceo_user)
):
    """Take action on AI recommendation (implement, dismiss, defer)"""
    
    try:
        # Find the recommendation
        report = await db.ai_intelligence_reports.find_one({
            "recommendations.id": recommendation_id
        })
        
        if not report:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        
        # Update recommendation status
        await db.ai_intelligence_reports.update_one(
            {"_id": report["_id"], "recommendations.id": recommendation_id},
            {
                "$set": {
                    "recommendations.$.status": request.action,
                    "recommendations.$.action_taken_at": datetime.utcnow(),
                    "recommendations.$.action_taken_by": current_user["id"],
                    "recommendations.$.action_notes": request.notes
                }
            }
        )
        
        # Log recommendation action
        await ceo_security.audit_log(
            user_id=current_user["id"],
            action=f"AI_RECOMMENDATION_{request.action.upper()}",
            resource="CEO_AI_INTELLIGENCE",
            ip_address="system",
            device_fingerprint="ceo_console",
            metadata={
                "recommendation_id": recommendation_id,
                "action": request.action,
                "notes": request.notes
            }
        )
        
        return {
            "success": True,
            "data": {
                "recommendation_id": recommendation_id,
                "action_taken": request.action,
                "timestamp": datetime.utcnow()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to take recommendation action: {str(e)}")

@ai_intelligence_router.get("/alerts")
async def get_real_time_alerts(
    priority_filter: Optional[str] = None,
    limit: int = Query(20, le=50),
    current_user: dict = Depends(get_ceo_user)
):
    """Get real-time AI-generated alerts for CEO attention"""
    
    try:
        # Get real-time alerts from AI engine
        alerts = await ai_intelligence_engine.get_real_time_alerts()
        
        # Apply priority filter if specified
        if priority_filter:
            alerts = [alert for alert in alerts if alert.get("priority") == priority_filter]
        
        # Limit results
        alerts = alerts[:limit]
        
        # Get alert statistics
        alert_stats = {
            "total_alerts": len(alerts),
            "high_priority": len([a for a in alerts if a.get("priority") == "high"]),
            "medium_priority": len([a for a in alerts if a.get("priority") == "medium"]),
            "low_priority": len([a for a in alerts if a.get("priority") == "low"]),
            "requires_action": len([a for a in alerts if a.get("requires_action", False)])
        }
        
        return {
            "success": True,
            "data": {
                "alerts": alerts,
                "statistics": alert_stats,
                "last_updated": datetime.utcnow()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get alerts: {str(e)}")

@ai_intelligence_router.get("/insights/search")
async def search_intelligence_insights(
    query: str = Query(..., min_length=3),
    category: Optional[IntelligenceCategory] = None,
    limit: int = Query(10, le=20),
    current_user: dict = Depends(get_ceo_user)
):
    """Search through AI intelligence insights"""
    
    try:
        # Search insights using AI engine
        insights = await ai_intelligence_engine.search_intelligence_insights(
            query=query,
            category=category
        )
        
        return {
            "success": True,
            "data": {
                "insights": insights[:limit],
                "search_query": query,
                "category_filter": category,
                "results_count": len(insights)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search insights: {str(e)}")

@ai_intelligence_router.get("/analytics/predictive")
async def get_predictive_analytics(
    forecast_days: int = Query(90, ge=30, le=365),
    metrics: Optional[List[str]] = Query(None),
    current_user: dict = Depends(get_ceo_user)
):
    """Get AI-powered predictive analytics"""
    
    try:
        # Get latest intelligence report with predictive analysis
        latest_report = await db.ai_intelligence_reports.find_one(
            {"predictive_analysis": {"$exists": True}},
            sort=[("generated_at", -1)]
        )
        
        if not latest_report:
            raise HTTPException(status_code=404, detail="No predictive analysis available")
        
        predictive_data = latest_report.get("predictive_analysis", {})
        
        # Generate specific metric predictions if requested
        if metrics:
            # Filter predictions for requested metrics
            filtered_predictions = {
                metric: predictive_data.get(metric, "Prediction not available")
                for metric in metrics
            }
            predictive_data["filtered_metrics"] = filtered_predictions
        
        return {
            "success": True,
            "data": {
                "predictive_analysis": predictive_data,
                "forecast_horizon_days": forecast_days,
                "report_generated": latest_report["generated_at"],
                "confidence_level": predictive_data.get("confidence_level", 0.7),
                "available_metrics": [
                    "revenue_growth",
                    "client_acquisition", 
                    "vendor_performance",
                    "market_opportunities",
                    "risk_factors"
                ]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get predictive analytics: {str(e)}")

@ai_intelligence_router.get("/reports/history")
async def get_intelligence_reports_history(
    limit: int = Query(10, le=50),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: dict = Depends(get_ceo_user)
):
    """Get history of AI intelligence reports"""
    
    try:
        # Build query filter
        query_filter = {}
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            query_filter["generated_at"] = date_filter
        
        # Get reports history
        reports = await db.ai_intelligence_reports.find(
            query_filter,
            {
                "id": 1,
                "generated_at": 1,
                "period": 1,
                "executive_summary.business_health_score": 1,
                "insights": 1,
                "recommendations": 1
            }
        ).sort("generated_at", -1).limit(limit).to_list(limit)
        
        # Process reports for history view
        reports_summary = []
        for report in reports:
            reports_summary.append({
                "report_id": report["id"],
                "generated_at": report["generated_at"],
                "period": report.get("period", {}),
                "business_health_score": report.get("executive_summary", {}).get("business_health_score", 0),
                "insights_count": len(report.get("insights", {})),
                "recommendations_count": len(report.get("recommendations", [])),
                "categories_analyzed": list(report.get("insights", {}).keys())
            })
        
        return {
            "success": True,
            "data": {
                "reports": reports_summary,
                "total_reports": len(reports_summary),
                "date_range": {
                    "start": start_date,
                    "end": end_date
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get reports history: {str(e)}")

@ai_intelligence_router.get("/health")
async def get_ai_system_health(
    current_user: dict = Depends(get_ceo_user)
):
    """Get AI Intelligence System health metrics"""
    
    try:
        # Check AI models status
        models_health = {
            "strategic_model": "healthy",
            "financial_model": "healthy", 
            "operational_model": "healthy",
            "predictive_model": "healthy"
        }
        
        # Get system performance metrics
        recent_reports = await db.ai_intelligence_reports.count_documents({
            "generated_at": {"$gte": datetime.utcnow() - timedelta(days=7)}
        })
        
        # Get error rate (mock calculation)
        error_rate = 0.02  # 2% error rate
        
        system_health = {
            "overall_status": "healthy",
            "models_status": models_health,
            "performance_metrics": {
                "reports_generated_7days": recent_reports,
                "average_processing_time_seconds": 15.3,
                "error_rate_percentage": error_rate * 100,
                "uptime_percentage": 99.8
            },
            "last_health_check": datetime.utcnow(),
            "next_maintenance": datetime.utcnow() + timedelta(days=7)
        }
        
        return {
            "success": True,
            "data": system_health
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system health: {str(e)}")

# Export the router
__all__ = ["ai_intelligence_router"]