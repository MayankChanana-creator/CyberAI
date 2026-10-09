from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import random

from ..schemas.cypherx import (
    CypherXDashboardSummary, SimulationRequest, SimulationResponse,
    AnalyzeResponse, RiskResponse, InvestigationResponse,
    AlertStatusUpdate, WorkflowStatusResponse, DemoRunResponse
)
from ..services.cypherx_service import load_verbatim_text

router = APIRouter(prefix="/api/cypherx", tags=["cypherx"])

# In-memory store for demo runtime
in_memory_simulation_events = []
in_memory_alert_statuses = {}
duplicate_alert_cache = {}

@router.get("/briefing")
def get_briefing() -> Dict[str, Any]:
    """Part 1: Introduction - Serves briefing content exactly as specified."""
    return load_verbatim_text()

@router.get("/dashboard/summary", response_model=CypherXDashboardSummary)
def get_dashboard_summary():
    """Step 1: Dashboard summary in ONE single response."""
    now = datetime.utcnow()
    
    kpis = {
        "active_alerts": 4,
        "high_risk_users": 2,
        "events_today": 5840 + len(in_memory_simulation_events),
        "model_status": "trained"
    }

    distribution = {
        "critical": 1,
        "high": 1,
        "medium": 1,
        "low": 1
    }
    total = sum(distribution.values())
    percentages = {k: round((v / total) * 100, 1) for k, v in distribution.items()}

    severity_dist = {
        "low": distribution["low"],
        "medium": distribution["medium"],
        "high": distribution["high"],
        "critical": distribution["critical"],
        "percentages": percentages,
        "total": total
    }

    hourly = []
    for h in range(24):
        hourly.append({
            "hour": f"{h:02d}:00",
            "events": random.randint(40, 180) if 8 <= h <= 18 else random.randint(5, 30)
        })

    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    activity_overview = []
    for d in days:
        logins = random.randint(15, 35)
        files = random.randint(120, 450)
        activity_overview.append({
            "day": d,
            "events": logins + files,
            "logins": logins,
            "file_access": files
        })

    top_risky_users = [
        {"user_id": 5, "name": "eve.hacker", "department": "Contractor", "risk_score": 88.5, "severity": "Critical"},
        {"user_id": 2, "name": "bob.jones", "department": "HR", "risk_score": 62.0, "severity": "High"},
        {"user_id": 3, "name": "charlie.brown", "department": "Finance", "risk_score": 28.0, "severity": "Low"},
        {"user_id": 1, "name": "alice.smith", "department": "Engineering", "risk_score": 18.5, "severity": "Low"},
        {"user_id": 4, "name": "dave.williams", "department": "Engineering", "risk_score": 14.0, "severity": "Low"}
    ]

    recent_alerts = [
        {
            "id": 1,
            "user": "eve.hacker",
            "severity": "Critical",
            "score": 88.5,
            "created_at": (now - timedelta(hours=2)).isoformat(),
            "summary": "Multiple failed logins and unusual data exfiltration detected."
        },
        {
            "id": 2,
            "user": "eve.hacker",
            "severity": "High",
            "score": 78.0,
            "created_at": (now - timedelta(hours=6)).isoformat(),
            "summary": "Late night access to confidential HR and engineering repos."
        },
        {
            "id": 3,
            "user": "bob.jones",
            "severity": "Medium",
            "score": 58.0,
            "created_at": (now - timedelta(hours=12)).isoformat(),
            "summary": "Unusual volume of files copied to external USB device."
        },
        {
            "id": 4,
            "user": "alice.smith",
            "severity": "Low",
            "score": 18.5,
            "created_at": (now - timedelta(hours=18)).isoformat(),
            "summary": "Login from new internal IP address."
        }
    ]

    return {
        "kpis": kpis,
        "severity_distribution": severity_dist,
        "hourly_activity": hourly,
        "activity_overview": activity_overview,
        "top_risky_users": top_risky_users,
        "recent_alerts": recent_alerts
    }

@router.post("/simulate/suspicious-activity", response_model=SimulationResponse)
def simulate_activity(req: SimulationRequest = Body(...)):
    """Step 2: Simulating suspicious activity burst."""
    user_id = req.user_id or 5
    scenario = req.scenario or "suspicious"
    os_type = req.os or "windows"
    file_count = req.file_access_count if scenario == "suspicious" else 15
    usb_count = req.usb_connections if scenario == "suspicious" else 0
    login_count = 1 if req.off_hours else 2

    # Tagging source OS
    event_prefix = "Sysmon/EventLog" if os_type == "windows" else "auditd/syslog"

    events = {
        "login": login_count,
        "file_access": file_count,
        "usb": usb_count
    }
    total_created = sum(events.values())

    timestamp = datetime.utcnow().isoformat()
    sim_record = {
        "timestamp": timestamp,
        "user_id": user_id,
        "scenario": scenario,
        "os": os_type,
        "source": event_prefix,
        "events": events
    }
    in_memory_simulation_events.append(sim_record)

    return {
        "user_id": user_id,
        "events_created": total_created,
        "breakdown_by_type": events,
        "os": os_type,
        "scenario": scenario,
        "next_step": "analyze"
    }

@router.post("/analyze/{user_id}", response_model=AnalyzeResponse)
def analyze_user_anomalies(user_id: int):
    """Step 3: Machine Learning and Anomaly Detection."""
    verbatim = load_verbatim_text()

    is_user_suspicious = (user_id == 5) or any(e["user_id"] == user_id and e["scenario"] == "suspicious" for e in in_memory_simulation_events)

    features = {
        "total_logins": 7.0 if is_user_suspicious else 3.0,
        "late_night_logins": 5.0 if is_user_suspicious else 0.0,
        "late_night_ratio": 0.71 if is_user_suspicious else 0.0,
        "total_file_accesses": 5240.0 if is_user_suspicious else 42.0,
        "unique_files_accessed": 1820.0 if is_user_suspicious else 28.0,
        "usb_connections": 2.0 if is_user_suspicious else 0.0,
        "data_transferred_gb": 14.8 if is_user_suspicious else 0.2,
        "avg_files_per_login": 748.5 if is_user_suspicious else 14.0
    }

    raw_score = -0.38 if is_user_suspicious else 0.42
    is_anomaly = raw_score < 0

    explanation = (
        f"{verbatim['anomaly_note']} {verbatim['anomaly_explanation']} "
        "This behavioral anomaly will be combined with contextual risk factors before alerting."
    )

    return {
        "user_id": user_id,
        "features": features,
        "raw_anomaly_score": raw_score,
        "is_anomaly": is_anomaly,
        "model_status": "trained",
        "explanation": explanation
    }

@router.post("/risk/{user_id}", response_model=RiskResponse)
def compute_risk_and_alert(user_id: int):
    """Step 4: Risk scoring and alerts."""
    verbatim = load_verbatim_text()
    now = datetime.utcnow()

    is_user_suspicious = (user_id == 5) or any(e["user_id"] == user_id and e["scenario"] == "suspicious" for e in in_memory_simulation_events)

    if is_user_suspicious:
        score = 88.5
        severity = "Critical"
        risk_factors = [
            {"factor": "unusual_file_access", "points": 25, "detail": "High volume file accesses (5,000+ files)"},
            {"factor": "suspicious_usb_usage", "points": 25, "detail": "USB mass storage device connected"},
            {"factor": "large_data_transfer", "points": 25, "detail": "14.8 GB transferred to external medium"},
            {"factor": "off_hours_login", "points": 15, "detail": "Off-hours login detected (02:45 UTC)"},
            {"factor": "ml_anomaly", "points": 20, "detail": "Isolation Forest flagged high deviation from peer baseline"}
        ]
    else:
        score = 18.0
        severity = "Low"
        risk_factors = [
            {"factor": "nominal_activity", "points": 10, "detail": "Standard business hour logins and document reads"}
        ]

    # Prevent duplicate alert within same window
    alert_id = None
    if severity in ["High", "Critical"]:
        last_alert_time = duplicate_alert_cache.get(user_id)
        if not last_alert_time or (now - last_alert_time) > timedelta(minutes=60):
            alert_id = 100 + user_id
            duplicate_alert_cache[user_id] = now
        else:
            alert_id = 100 + user_id

    explanation = f"{verbatim['risk_explanation']} {verbatim['prioritization']}"

    return {
        "user_id": user_id,
        "risk_score": score,
        "severity": severity,
        "risk_factors": risk_factors,
        "alert_id": alert_id,
        "explanation": explanation
    }

@router.get("/alerts/{alert_id}/investigation", response_model=InvestigationResponse)
def get_alert_investigation(alert_id: int):
    """Step 5: Investigating the threat."""
    verbatim = load_verbatim_text()

    status = in_memory_alert_statuses.get(alert_id, "investigating")

    alert_info = {
        "id": alert_id,
        "severity": "Critical",
        "status": status,
        "description": "Mass file exfiltration to external USB device during off-hours.",
        "timestamp": datetime.utcnow().isoformat()
    }

    user_info = {
        "id": 5,
        "name": "eve.hacker",
        "role": "contractor",
        "department": "Contractor / SecDevOps"
    }

    what_triggered = [
        {"factor": "large_data_transfer", "points": 25, "detail": "14.8 GB transferred"},
        {"factor": "unusual_file_access", "points": 25, "detail": "5,240 file reads within 10 minutes"},
        {"factor": "suspicious_usb_usage", "points": 25, "detail": "SanDisk USB 3.0 inserted"},
        {"factor": "ml_anomaly", "points": 20, "detail": "Isolation Forest anomaly score -0.38"},
        {"factor": "off_hours_login", "points": 15, "detail": "Authenticated at 02:45 UTC"}
    ]

    behavioral_metrics = [
        {"metric": "File Accesses", "user_value": 5240.0, "baseline_value": 42.0, "unit": "files"},
        {"metric": "USB Connections", "user_value": 2.0, "baseline_value": 0.0, "unit": "devices"},
        {"metric": "Data Transferred", "user_value": 14.8, "baseline_value": 0.2, "unit": "GB"},
        {"metric": "Off-Hours Logins", "user_value": 5.0, "baseline_value": 0.0, "unit": "logins"},
        {"metric": "Failed Logins", "user_value": 8.0, "baseline_value": 1.0, "unit": "attempts"}
    ]

    supporting_events = [
        {
            "timestamp": (datetime.utcnow() - timedelta(minutes=15)).isoformat(),
            "type": "login",
            "detail": "Off-hours login authenticated from 185.220.101.42 (Tor Exit Node)",
            "severity": "High"
        },
        {
            "timestamp": (datetime.utcnow() - timedelta(minutes=12)).isoformat(),
            "type": "file_access",
            "detail": "Bulk traversal across /var/data/confidential_specs (5,240 files)",
            "severity": "Critical"
        },
        {
            "timestamp": (datetime.utcnow() - timedelta(minutes=8)).isoformat(),
            "type": "usb",
            "detail": "USB mass storage device connected: Vendor 0x0781 Product 0x5583",
            "severity": "Critical"
        },
        {
            "timestamp": (datetime.utcnow() - timedelta(minutes=5)).isoformat(),
            "type": "transfer",
            "detail": "14.8 GB archive dump written to /media/usb0/backup.tar.enc",
            "severity": "Critical"
        }
    ]

    return {
        "alert": alert_info,
        "user": user_info,
        "what_triggered": what_triggered,
        "behavioral_metrics": behavioral_metrics,
        "baseline_source": "prior_30_days_user_history",
        "supporting_events": supporting_events,
        "analyst_guidance": verbatim["investigation"]
    }

@router.patch("/alerts/{alert_id}/status")
def update_alert_status(alert_id: int, body: AlertStatusUpdate = Body(...)):
    """Step 5: Update alert status."""
    valid_statuses = ["open", "investigating", "resolved", "false_positive"]
    if body.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    in_memory_alert_statuses[alert_id] = body.status
    return {
        "message": "Alert status updated",
        "alert_id": alert_id,
        "status": body.status
    }

@router.get("/workflow/status", response_model=WorkflowStatusResponse)
def get_workflow_status():
    """Step 6: Workflow pipeline counters and closing statement."""
    verbatim = load_verbatim_text()

    sim_count = len(in_memory_simulation_events)
    events_collected = 5840 + (sim_count * 5002)
    anomalies_detected = 3 + sim_count
    risks_scored = 18 + sim_count
    alerts_generated = 4 + (1 if sim_count > 0 else 0)
    investigated = len(in_memory_alert_statuses)

    return {
        "events_collected": events_collected,
        "anomalies_detected": anomalies_detected,
        "risks_scored": risks_scored,
        "alerts_generated": alerts_generated,
        "investigated": investigated,
        "closing_statement": verbatim["closing"]
    }

@router.post("/demo/run", response_model=DemoRunResponse)
def run_live_demo(user_id: int = Query(default=5)):
    """Step 6: Full live demo execution in one call."""
    verbatim = load_verbatim_text()

    # 1. Simulate
    sim_res = simulate_activity(SimulationRequest(user_id=user_id, scenario="suspicious", os="windows", file_access_count=5000))

    # 2. Analyze
    analyze_res = analyze_user_anomalies(user_id)

    # 3. Risk & Alert
    risk_res = compute_risk_and_alert(user_id)

    # 4. Investigation summary
    alert_id = risk_res["alert_id"] or 1
    inv_res = get_alert_investigation(alert_id)

    return {
        "simulation": sim_res,
        "analysis": analyze_res,
        "risk_assessment": risk_res,
        "alert": inv_res["alert"],
        "closing_statement": verbatim["closing"]
    }
