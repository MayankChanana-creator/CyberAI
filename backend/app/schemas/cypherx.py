from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class KPIData(BaseModel):
    active_alerts: int
    high_risk_users: int
    events_today: int
    model_status: str  # "trained" | "fallback_rules"

class SeverityDistribution(BaseModel):
    low: int
    medium: int
    high: int
    critical: int
    percentages: Dict[str, float]
    total: int

class HourlyActivityItem(BaseModel):
    hour: str
    events: int

class ActivityOverviewItem(BaseModel):
    day: str
    events: int
    logins: int
    file_access: int

class TopRiskyUserItem(BaseModel):
    user_id: int
    name: str
    department: str
    risk_score: float
    severity: str

class RecentAlertItem(BaseModel):
    id: int
    user: str
    severity: str
    score: float
    created_at: str
    summary: str

class CypherXDashboardSummary(BaseModel):
    kpis: KPIData
    severity_distribution: SeverityDistribution
    hourly_activity: List[HourlyActivityItem]
    activity_overview: List[ActivityOverviewItem]
    top_risky_users: List[TopRiskyUserItem]
    recent_alerts: List[RecentAlertItem]

class SimulationRequest(BaseModel):
    user_id: Optional[int] = 5
    scenario: Optional[str] = "suspicious"  # "suspicious" | "normal"
    os: Optional[str] = "windows"  # "windows" | "linux"
    file_access_count: Optional[int] = 5000
    usb_connections: Optional[int] = 1
    off_hours: Optional[bool] = True

class SimulationResponse(BaseModel):
    user_id: int
    events_created: int
    breakdown_by_type: Dict[str, int]
    os: str
    scenario: str
    next_step: str

class AnalyzeResponse(BaseModel):
    user_id: int
    features: Dict[str, float]
    raw_anomaly_score: float
    is_anomaly: bool
    model_status: str
    explanation: str

class RiskFactorItem(BaseModel):
    factor: str
    points: int
    detail: str

class RiskResponse(BaseModel):
    user_id: int
    risk_score: float
    severity: str
    risk_factors: List[RiskFactorItem]
    alert_id: Optional[int] = None
    explanation: str

class BehavioralMetric(BaseModel):
    metric: str
    user_value: float
    baseline_value: float
    unit: str

class SupportingEvent(BaseModel):
    timestamp: str
    type: str  # login | file_access | usb | transfer
    detail: str
    severity: str

class InvestigationResponse(BaseModel):
    alert: Dict[str, Any]
    user: Dict[str, Any]
    what_triggered: List[RiskFactorItem]
    behavioral_metrics: List[BehavioralMetric]
    baseline_source: str
    supporting_events: List[SupportingEvent]
    analyst_guidance: str

class AlertStatusUpdate(BaseModel):
    status: str  # "open" | "investigating" | "resolved" | "false_positive"

class WorkflowStatusResponse(BaseModel):
    events_collected: int
    anomalies_detected: int
    risks_scored: int
    alerts_generated: int
    investigated: int
    closing_statement: str

class DemoRunResponse(BaseModel):
    simulation: Dict[str, Any]
    analysis: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    alert: Optional[Dict[str, Any]] = None
    closing_statement: str
