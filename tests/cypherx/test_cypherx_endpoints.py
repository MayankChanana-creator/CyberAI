import pytest
from fastapi.testclient import TestClient
from backend.app.routes.cypherx import router
from fastapi import FastAPI

app = FastAPI(title="CypherX Test App")
app.include_router(router)
client = TestClient(app)

def test_briefing_endpoint():
    res = client.get("/api/cypherx/briefing")
    assert res.status_code == 200
    data = res.json()
    assert "challenges" in data
    assert "who" in data
    assert "solution" in data
    assert "CypherX" in data["solution"]

def test_dashboard_summary():
    res = client.get("/api/cypherx/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert data["kpis"]["model_status"] in ["trained", "fallback_rules"]
    assert "severity_distribution" in data
    assert "top_risky_users" in data
    assert len(data["top_risky_users"]) <= 5
    assert "recent_alerts" in data

def test_simulate_suspicious_activity():
    payload = {
        "user_id": 5,
        "scenario": "suspicious",
        "os": "windows",
        "file_access_count": 5000,
        "usb_connections": 1,
        "off_hours": True
    }
    res = client.post("/api/cypherx/simulate/suspicious-activity", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == 5
    assert data["events_created"] >= 5000
    assert data["next_step"] == "analyze"
    assert data["os"] == "windows"

def test_simulate_normal_activity():
    payload = {
        "user_id": 1,
        "scenario": "normal",
        "os": "linux",
        "file_access_count": 10,
        "usb_connections": 0,
        "off_hours": False
    }
    res = client.post("/api/cypherx/simulate/suspicious-activity", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["scenario"] == "normal"
    assert data["breakdown_by_type"]["usb"] == 0

def test_analyze_endpoint():
    res = client.post("/api/cypherx/analyze/5")
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == 5
    assert "features" in data
    assert "raw_anomaly_score" in data
    assert "explanation" in data
    assert "an anomaly alone doesn't automatically mean malicious activity" in data["explanation"]

def test_risk_and_alert_endpoint():
    res = client.post("/api/cypherx/risk/5")
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == 5
    assert data["risk_score"] > 60
    assert len(data["risk_factors"]) > 0
    assert "explanation" in data

def test_investigation_endpoint():
    res = client.get("/api/cypherx/alerts/1/investigation")
    assert res.status_code == 200
    data = res.json()
    assert "alert" in data
    assert "user" in data
    assert "what_triggered" in data
    assert "behavioral_metrics" in data
    assert "supporting_events" in data
    assert "analyst_guidance" in data

def test_alert_status_patch():
    patch_res = client.patch("/api/cypherx/alerts/1/status", json={"status": "resolved"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "resolved"

    invalid_res = client.patch("/api/cypherx/alerts/1/status", json={"status": "invalid_status"})
    assert invalid_res.status_code == 400

def test_workflow_status():
    res = client.get("/api/cypherx/workflow/status")
    assert res.status_code == 200
    data = res.json()
    assert "events_collected" in data
    assert "anomalies_detected" in data
    assert "closing_statement" in data
    assert "CypherX" in data["closing_statement"]

def test_demo_run():
    res = client.post("/api/cypherx/demo/run?user_id=5")
    assert res.status_code == 200
    data = res.json()
    assert "simulation" in data
    assert "analysis" in data
    assert "risk_assessment" in data
    assert "alert" in data
    assert "closing_statement" in data
