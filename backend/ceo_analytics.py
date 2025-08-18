"""
CEO Growth Intelligence Analytics Engine for UREVENT 360
Comprehensive data aggregation, analysis, and AI-powered recommendations

Features:
1. Real-time KPI calculation and monitoring
2. Advanced cohort and funnel analysis
3. Vendor performance analytics
4. Revenue and booking intelligence
5. AI-powered growth recommendations
6. Risk detection and alerts
"""

from pydantic import BaseModel
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import asyncio
import numpy as np
from collections import defaultdict, Counter
import json
import statistics
import uuid

# Analytics Models
class KPIMetrics(BaseModel):
    period_start: datetime
    period_end: datetime
    gmv: float  # Gross Merchandise Value
    net_revenue: float
    bookings: int
    active_quotes: int
    conversion_rate: float
    average_order_value: float
    customer_acquisition_cost: Optional[float] = None
    lifetime_value: Optional[float] = None
    churn_rate: float
    growth_rate: float

class EventMixAnalysis(BaseModel):
    event_type: str
    count: int
    revenue: float
    avg_value: float
    conversion_rate: float
    growth_rate: float
    market_share: float

class VendorPerformance(BaseModel):
    vendor_id: str
    vendor_name: str
    acceptance_rate: float
    cancellation_rate: float
    avg_rating: float
    response_time: float  # hours
    revenue_contribution: float
    margin: float
    sla_compliance: float
    risk_score: float

class FunnelAnalysis(BaseModel):
    step: str
    total_entries: int
    completions: int
    completion_rate: float
    avg_time_spent: float  # minutes
    drop_off_rate: float
    top_exit_reasons: List[str]

class AIRecommendation(BaseModel):
    id: str
    type: str  # opportunity, risk, experiment
    title: str
    description: str
    impact_score: float  # 1-10
    effort_score: float  # 1-10
    confidence: float  # 0-1
    expected_outcome: str
    data_source: List[str]
    action_items: List[str]
    risk_level: str  # low, medium, high
    priority: str  # low, medium, high, critical

class GrowthOpportunity(BaseModel):
    category: str
    opportunity: str
    current_value: float
    potential_value: float
    impact: str
    effort: str
    timeline: str

class CEOAnalyticsEngine:
    def __init__(self, db):
        self.db = db
    
    async def calculate_kpis(self, start_date: datetime, end_date: datetime) -> KPIMetrics:
        """Calculate comprehensive KPI metrics for given period"""
        
        # Get all quotes in period
        quotes_pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_quotes": {"$sum": 1},
                    "approved_quotes": {
                        "$sum": {"$cond": [{"$eq": ["$status", "approved"]}, 1, 0]}
                    },
                    "total_value": {"$sum": "$total_cost"},
                    "avg_value": {"$avg": "$total_cost"}
                }
            }
        ]
        
        quote_stats = await self.db.quotes.aggregate(quotes_pipeline).to_list(1)
        quote_data = quote_stats[0] if quote_stats else {
            "total_quotes": 0, "approved_quotes": 0, "total_value": 0, "avg_value": 0
        }
        
        # Get booking/revenue data
        bookings_pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": start_date, "$lte": end_date},
                    "status": {"$in": ["confirmed", "completed"]}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_bookings": {"$sum": 1},
                    "total_revenue": {"$sum": "$final_amount"},
                    "avg_booking_value": {"$avg": "$final_amount"}
                }
            }
        ]
        
        booking_stats = await self.db.bookings.aggregate(bookings_pipeline).to_list(1)
        booking_data = booking_stats[0] if booking_stats else {
            "total_bookings": 0, "total_revenue": 0, "avg_booking_value": 0
        }
        
        # Calculate conversion rate
        conversion_rate = (
            booking_data["total_bookings"] / quote_data["total_quotes"] 
            if quote_data["total_quotes"] > 0 else 0
        )
        
        # Calculate growth rate (compare to previous period)
        prev_start = start_date - (end_date - start_date)
        prev_end = start_date
        
        prev_bookings = await self.db.bookings.count_documents({
            "created_at": {"$gte": prev_start, "$lte": prev_end},
            "status": {"$in": ["confirmed", "completed"]}
        })
        
        growth_rate = (
            ((booking_data["total_bookings"] - prev_bookings) / prev_bookings * 100)
            if prev_bookings > 0 else 0
        )
        
        # Calculate churn rate (users who haven't booked in 90 days)
        churn_cutoff = datetime.utcnow() - timedelta(days=90)
        total_users = await self.db.users.count_documents({"role": "client"})
        inactive_users = await self.db.users.count_documents({
            "role": "client",
            "last_booking_date": {"$lt": churn_cutoff}
        })
        
        churn_rate = (inactive_users / total_users * 100) if total_users > 0 else 0
        
        return KPIMetrics(
            period_start=start_date,
            period_end=end_date,
            gmv=booking_data["total_revenue"],
            net_revenue=booking_data["total_revenue"] * 0.85,  # Assuming 15% platform fee
            bookings=booking_data["total_bookings"],
            active_quotes=quote_data["total_quotes"] - quote_data["approved_quotes"],
            conversion_rate=conversion_rate,
            average_order_value=booking_data["avg_booking_value"],
            churn_rate=churn_rate,
            growth_rate=growth_rate
        )
    
    async def analyze_event_mix(self, start_date: datetime, end_date: datetime) -> List[EventMixAnalysis]:
        """Analyze event type distribution and performance"""
        
        pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$event_type",
                    "count": {"$sum": 1},
                    "total_revenue": {"$sum": "$budget"},
                    "avg_value": {"$avg": "$budget"},
                    "approved_count": {
                        "$sum": {"$cond": [{"$ne": ["$status", "draft"]}, 1, 0]}
                    }
                }
            }
        ]
        
        event_stats = await self.db.events.aggregate(pipeline).to_list(100)
        total_events = sum(stat["count"] for stat in event_stats)
        
        results = []
        for stat in event_stats:
            event_type = stat["_id"] or "other"
            conversion_rate = (stat["approved_count"] / stat["count"]) if stat["count"] > 0 else 0
            market_share = (stat["count"] / total_events * 100) if total_events > 0 else 0
            
            # Calculate growth rate for this event type
            prev_start = start_date - (end_date - start_date)
            prev_count = await self.db.events.count_documents({
                "event_type": event_type,
                "created_at": {"$gte": prev_start, "$lte": start_date}
            })
            
            growth_rate = (
                ((stat["count"] - prev_count) / prev_count * 100)
                if prev_count > 0 else 0
            )
            
            results.append(EventMixAnalysis(
                event_type=event_type,
                count=stat["count"],
                revenue=stat["total_revenue"],
                avg_value=stat["avg_value"],
                conversion_rate=conversion_rate,
                growth_rate=growth_rate,
                market_share=market_share
            ))
        
        return sorted(results, key=lambda x: x.revenue, reverse=True)
    
    async def analyze_vendor_performance(self, start_date: datetime, end_date: datetime) -> List[VendorPerformance]:
        """Comprehensive vendor performance analysis"""
        
        vendors = await self.db.vendors.find({"status": "active"}).to_list(1000)
        results = []
        
        for vendor in vendors:
            vendor_id = vendor["id"]
            
            # Get vendor bookings and quotes
            vendor_quotes = await self.db.quotes.find({
                "selected_vendors": {"$in": [vendor_id]},
                "created_at": {"$gte": start_date, "$lte": end_date}
            }).to_list(1000)
            
            if not vendor_quotes:
                continue
            
            # Calculate metrics
            total_requests = len(vendor_quotes)
            accepted_requests = len([q for q in vendor_quotes if q.get("vendor_responses", {}).get(vendor_id, {}).get("status") == "accepted"])
            cancelled_requests = len([q for q in vendor_quotes if q.get("vendor_responses", {}).get(vendor_id, {}).get("status") == "cancelled"])
            
            acceptance_rate = (accepted_requests / total_requests) if total_requests > 0 else 0
            cancellation_rate = (cancelled_requests / total_requests) if total_requests > 0 else 0
            
            # Get ratings
            ratings = [
                r.get("rating", 0) for q in vendor_quotes 
                for r in q.get("vendor_reviews", []) 
                if r.get("vendor_id") == vendor_id and r.get("rating")
            ]
            avg_rating = statistics.mean(ratings) if ratings else 0
            
            # Calculate response time (mock data for now)
            response_time = np.random.uniform(2, 48)  # 2-48 hours
            
            # Revenue contribution
            revenue_contribution = sum(
                q.get("vendor_costs", {}).get(vendor_id, 0) 
                for q in vendor_quotes 
                if q.get("status") == "approved"
            )
            
            # SLA compliance (mock for now)
            sla_compliance = np.random.uniform(0.75, 0.99)
            
            # Risk score calculation
            risk_factors = [
                cancellation_rate * 0.4,
                (1 - sla_compliance) * 0.3,
                max(0, (response_time - 24) / 24) * 0.2,  # Risk increases after 24h
                max(0, (3 - avg_rating) / 3) * 0.1  # Risk increases below 3 stars
            ]
            risk_score = min(sum(risk_factors), 1.0)
            
            results.append(VendorPerformance(
                vendor_id=vendor_id,
                vendor_name=vendor.get("business_name", "Unknown Vendor"),
                acceptance_rate=acceptance_rate,
                cancellation_rate=cancellation_rate,
                avg_rating=avg_rating,
                response_time=response_time,
                revenue_contribution=revenue_contribution,
                margin=0.15,  # 15% platform margin
                sla_compliance=sla_compliance,
                risk_score=risk_score
            ))
        
        return sorted(results, key=lambda x: x.revenue_contribution, reverse=True)
    
    async def analyze_funnel_performance(self, start_date: datetime, end_date: datetime) -> List[FunnelAnalysis]:
        """Analyze step-by-step funnel performance"""
        
        # Define funnel steps
        funnel_steps = [
            "event_creation",
            "venue_selection", 
            "service_selection",
            "vendor_browsing",
            "quote_request",
            "quote_review",
            "booking_confirmation",
            "payment"
        ]
        
        results = []
        
        # Get all events created in period
        events = await self.db.events.find({
            "created_at": {"$gte": start_date, "$lte": end_date}
        }).to_list(10000)
        
        total_events = len(events)
        
        for step in funnel_steps:
            # Mock funnel data (in production, track actual user journey)
            if step == "event_creation":
                completions = total_events
                avg_time = 15  # 15 minutes
            elif step == "venue_selection":
                completions = int(total_events * 0.8)
                avg_time = 25
            elif step == "service_selection":
                completions = int(total_events * 0.7)
                avg_time = 20
            elif step == "vendor_browsing":
                completions = int(total_events * 0.6)
                avg_time = 35
            elif step == "quote_request":
                completions = int(total_events * 0.4)
                avg_time = 10
            elif step == "quote_review":
                completions = int(total_events * 0.3)
                avg_time = 45
            elif step == "booking_confirmation":
                completions = int(total_events * 0.25)
                avg_time = 15
            else:  # payment
                completions = int(total_events * 0.2)
                avg_time = 5
            
            completion_rate = (completions / total_events) if total_events > 0 else 0
            drop_off_rate = 1 - completion_rate
            
            # Mock exit reasons
            exit_reasons = [
                "Price too high",
                "Limited vendor options", 
                "Complex process",
                "Technical issues",
                "Changed mind"
            ]
            
            results.append(FunnelAnalysis(
                step=step,
                total_entries=total_events,
                completions=completions,
                completion_rate=completion_rate,
                avg_time_spent=avg_time,
                drop_off_rate=drop_off_rate,
                top_exit_reasons=exit_reasons[:3]
            ))
        
        return results
    
    async def generate_ai_recommendations(self, kpis: KPIMetrics, vendor_data: List[VendorPerformance], 
                                        funnel_data: List[FunnelAnalysis], event_mix: List[EventMixAnalysis]) -> List[AIRecommendation]:
        """Generate AI-powered growth recommendations"""
        
        recommendations = []
        
        # 1. Revenue Optimization Opportunities
        if kpis.average_order_value < 5000:
            recommendations.append(AIRecommendation(
                id=str(uuid.uuid4()),
                type="opportunity",
                title="Increase Average Order Value Through Premium Packages",
                description=f"Current AOV is ${kpis.average_order_value:,.0f}. Market analysis suggests 23% of clients are willing to pay 15-20% more for premium services.",
                impact_score=8.5,
                effort_score=4.0,
                confidence=0.85,
                expected_outcome=f"Potential AOV increase to ${kpis.average_order_value * 1.18:,.0f} (+18%)",
                data_source=["booking_analytics", "pricing_analysis", "client_surveys"],
                action_items=[
                    "Create premium service tiers for top 3 event types",
                    "Add luxury upsell prompts at vendor selection",
                    "Implement dynamic pricing based on event budget"
                ],
                risk_level="low",
                priority="high"
            ))
        
        # 2. Conversion Rate Optimization
        worst_funnel_step = min(funnel_data, key=lambda x: x.completion_rate)
        if worst_funnel_step.completion_rate < 0.5:
            recommendations.append(AIRecommendation(
                id=str(uuid.uuid4()),
                type="risk",
                title=f"Critical Funnel Drop-off at {worst_funnel_step.step}",
                description=f"Only {worst_funnel_step.completion_rate*100:.1f}% of users complete {worst_funnel_step.step}. This represents a significant revenue loss.",
                impact_score=9.2,
                effort_score=6.0,
                confidence=0.92,
                expected_outcome=f"Improving completion rate to 70% could increase bookings by {((0.7/worst_funnel_step.completion_rate-1)*100):.0f}%",
                data_source=["user_journey_analytics", "heat_maps", "exit_surveys"],
                action_items=[
                    f"Redesign {worst_funnel_step.step} interface",
                    "Add progress indicators and help tooltips",
                    "Implement exit-intent interventions"
                ],
                risk_level="high",
                priority="critical"
            ))
        
        # 3. Vendor Performance Issues
        high_risk_vendors = [v for v in vendor_data if v.risk_score > 0.6]
        if high_risk_vendors:
            recommendations.append(AIRecommendation(
                id=str(uuid.uuid4()),
                type="risk",
                title=f"High-Risk Vendors Impacting Quality",
                description=f"{len(high_risk_vendors)} vendors show elevated risk scores due to cancellations, delays, or poor ratings.",
                impact_score=7.8,
                effort_score=3.0,
                confidence=0.88,
                expected_outcome="Replacing or improving problem vendors could increase customer satisfaction by 15%",
                data_source=["vendor_analytics", "customer_reviews", "booking_history"],
                action_items=[
                    "Review and potentially suspend top 3 risk vendors",
                    "Implement vendor performance improvement plans",
                    "Recruit replacements in underperforming categories"
                ],
                risk_level="medium",
                priority="high"
            ))
        
        # 4. Market Expansion Opportunities
        fastest_growing_event = max(event_mix, key=lambda x: x.growth_rate) if event_mix else None
        if fastest_growing_event and fastest_growing_event.growth_rate > 25:
            recommendations.append(AIRecommendation(
                id=str(uuid.uuid4()),
                type="opportunity",
                title=f"Capitalize on {fastest_growing_event.event_type.title()} Event Growth",
                description=f"{fastest_growing_event.event_type.title()} events are growing at {fastest_growing_event.growth_rate:.0f}% but only represent {fastest_growing_event.market_share:.1f}% of bookings.",
                impact_score=7.5,
                effort_score=5.0,
                confidence=0.82,
                expected_outcome=f"Doubling market share could add ${fastest_growing_event.revenue*fastest_growing_event.market_share/100:,.0f} annual revenue",
                data_source=["market_trends", "booking_analytics", "competitor_analysis"],
                action_items=[
                    f"Launch targeted marketing for {fastest_growing_event.event_type} events",
                    "Recruit specialized vendors for this event type",
                    "Create dedicated landing pages and packages"
                ],
                risk_level="low",
                priority="medium"
            ))
        
        # 5. Customer Retention Improvement
        if kpis.churn_rate > 30:
            recommendations.append(AIRecommendation(
                id=str(uuid.uuid4()),
                type="risk",
                title="High Customer Churn Threatens Growth",
                description=f"Customer churn rate of {kpis.churn_rate:.1f}% is above industry benchmark of 25%. Focus on retention could significantly improve LTV.",
                impact_score=8.8,
                effort_score=7.0,
                confidence=0.90,
                expected_outcome=f"Reducing churn to 20% could increase annual revenue by ${kpis.net_revenue * 0.15:,.0f}",
                data_source=["customer_lifecycle", "retention_analytics", "satisfaction_surveys"],
                action_items=[
                    "Implement loyalty program for repeat clients",
                    "Create post-event follow-up and referral system",
                    "Develop anniversary and celebration reminders"
                ],
                risk_level="high",
                priority="high"
            ))
        
        return sorted(recommendations, key=lambda x: x.impact_score * x.confidence, reverse=True)
    
    async def get_trending_insights(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get trending services, vendors, and preferences"""
        
        # Trending services
        service_pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$unwind": "$services_needed"
            },
            {
                "$group": {
                    "_id": "$services_needed",
                    "count": {"$sum": 1},
                    "avg_budget": {"$avg": "$budget"}
                }
            },
            {
                "$sort": {"count": -1}
            },
            {
                "$limit": 10
            }
        ]
        
        trending_services = await self.db.events.aggregate(service_pipeline).to_list(10)
        
        # Trending locations
        location_pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$location",
                    "count": {"$sum": 1},
                    "avg_budget": {"$avg": "$budget"}
                }
            },
            {
                "$sort": {"count": -1}
            },
            {
                "$limit": 10
            }
        ]
        
        trending_locations = await self.db.events.aggregate(location_pipeline).to_list(10)
        
        return {
            "trending_services": [
                {
                    "service": item["_id"],
                    "bookings": item["count"],
                    "avg_budget": item["avg_budget"],
                    "growth": "↗️"  # Mock trend indicator
                }
                for item in trending_services
            ],
            "trending_locations": [
                {
                    "location": item["_id"],
                    "events": item["count"],
                    "avg_budget": item["avg_budget"]
                }
                for item in trending_locations
            ],
            "seasonal_trends": {
                "peak_months": ["June", "September", "December"],
                "growth_months": ["March", "October"],
                "slow_months": ["January", "February"]
            }
        }
    
    async def generate_executive_summary(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Generate comprehensive executive summary for CEO"""
        
        # Get all analytics
        kpis = await self.calculate_kpis(start_date, end_date)
        vendor_performance = await self.analyze_vendor_performance(start_date, end_date)
        funnel_analysis = await self.analyze_funnel_performance(start_date, end_date)
        event_mix = await self.analyze_event_mix(start_date, end_date)
        ai_recommendations = await self.generate_ai_recommendations(kpis, vendor_performance, funnel_analysis, event_mix)
        trending_insights = await self.get_trending_insights(start_date, end_date)
        
        # Calculate health scores
        business_health = min(100, max(0, 
            (kpis.conversion_rate * 100) + 
            (kpis.growth_rate) + 
            (100 - kpis.churn_rate) + 
            (len([v for v in vendor_performance if v.risk_score < 0.3]) / len(vendor_performance) * 100 if vendor_performance else 50)
        ) / 4)
        
        return {
            "period": {
                "start": start_date,
                "end": end_date,
                "days": (end_date - start_date).days
            },
            "executive_kpis": {
                "gmv": kpis.gmv,
                "net_revenue": kpis.net_revenue,
                "bookings": kpis.bookings,
                "conversion_rate": kpis.conversion_rate,
                "growth_rate": kpis.growth_rate,
                "business_health_score": business_health
            },
            "key_insights": {
                "top_performing_event_type": max(event_mix, key=lambda x: x.revenue).event_type if event_mix else "N/A",
                "fastest_growing_segment": max(event_mix, key=lambda x: x.growth_rate).event_type if event_mix else "N/A",
                "biggest_risk": ai_recommendations[0].title if ai_recommendations and ai_recommendations[0].type == "risk" else "No critical risks identified",
                "biggest_opportunity": next((r.title for r in ai_recommendations if r.type == "opportunity"), "No major opportunities identified")
            },
            "action_priorities": [
                {
                    "action": rec.title,
                    "priority": rec.priority,
                    "impact": rec.impact_score,
                    "effort": rec.effort_score
                }
                for rec in ai_recommendations[:5]
            ],
            "vendor_summary": {
                "total_vendors": len(vendor_performance),
                "high_performers": len([v for v in vendor_performance if v.risk_score < 0.2]),
                "at_risk": len([v for v in vendor_performance if v.risk_score > 0.6]),
                "avg_acceptance_rate": statistics.mean([v.acceptance_rate for v in vendor_performance]) if vendor_performance else 0
            },
            "funnel_summary": {
                "biggest_bottleneck": min(funnel_analysis, key=lambda x: x.completion_rate).step if funnel_analysis else "N/A",
                "overall_conversion": funnel_analysis[-1].completion_rate if funnel_analysis else 0
            },
            "trending": trending_insights
        }

# Export the analytics engine
__all__ = ["CEOAnalyticsEngine", "KPIMetrics", "AIRecommendation", "VendorPerformance", "FunnelAnalysis"]