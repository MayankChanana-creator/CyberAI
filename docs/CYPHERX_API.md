# CypherX API Documentation

The CypherX API extends the insider threat detection engine with an end-to-end live demo workflow, behavioral telemetry aggregation, multi-factor risk scoring, and interactive alert investigation.

---

## 1. Introduction Content
### `GET /api/cypherx/briefing`
Returns the core briefing content including problem statements, target personas, and system capabilities.

```bash
curl -X GET "http://localhost:3000/api/cypherx/briefing"
```

**Response Example:**
```json
{
  "challenges": [
    {
      "title": "too much activity",
      "text": "Thousands of login attempts, file accesses, and data transfers make suspicious actions difficult to identify."
    },
    {
      "title": "limited behavioral context",
      "text": "Traditional tools often analyze events individually, missing patterns that reveal unusual user behavior."
    },
    {
      "title": "difficult risk prioritization",
      "text": "Security teams struggle to identify which threats require immediate attention."
    }
  ],
  "who": "SOC analysts, security administrators, and IT security teams",
  "what": "an intelligent system that continuously monitors user activity, learns normal behavior, detects anomalies, and prioritizes threats based on risk.",
  "solution": "By combining User Behavior Analytics, Isolation Forest machine learning, and a hybrid risk-scoring engine, CypherX identifies suspicious activity across Windows and Linux systems and generates risk-based alerts through a centralized dashboard."
}
```

---

## 2. Dashboard Summary
### `GET /api/cypherx/dashboard/summary`
Returns all metrics, severity distributions, hourly buckets, top risky users, and recent alerts in a single consolidated payload.

```bash
curl -X GET "http://localhost:3000/api/cypherx/dashboard/summary"
```

---

## 3. Suspicious Activity Simulation
### `POST /api/cypherx/simulate/suspicious-activity`
Generates a realistic telemetry burst of file accesses, USB connections, and logins tagged with OS source types (Windows Sysmon / Linux auditd).

```bash
curl -X POST "http://localhost:3000/api/cypherx/simulate/suspicious-activity" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 5,
    "scenario": "suspicious",
    "os": "windows",
    "file_access_count": 5000,
    "usb_connections": 1,
    "off_hours": true
  }'
```

---

## 4. Machine Learning & Anomaly Detection
### `POST /api/cypherx/analyze/{user_id}`
Extracts multi-vector behavioral features and scores deviations using an Isolation Forest anomaly detection model.

```bash
curl -X POST "http://localhost:3000/api/cypherx/analyze/5"
```

---

## 5. Multi-Factor Risk Scoring & Alerting
### `POST /api/cypherx/risk/{user_id}`
Combines raw ML anomalies with domain heuristic penalties to produce prioritized risk scores and deduplicated incident alerts.

```bash
curl -X POST "http://localhost:3000/api/cypherx/risk/5"
```

---

## 6. Threat Investigation & Status Triage
### `GET /api/cypherx/alerts/{alert_id}/investigation`
Returns enriched contextual evidence, radar-ready metric comparisons against rolling 30-day baselines, and chronological event timelines.

```bash
curl -X GET "http://localhost:3000/api/cypherx/alerts/1/investigation"
```

### `PATCH /api/cypherx/alerts/{alert_id}/status`
Updates an alert's lifecycle status. Allowed values: `open`, `investigating`, `resolved`, `false_positive`.

```bash
curl -X PATCH "http://localhost:3000/api/cypherx/alerts/1/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved"}'
```

---

## 7. Workflow Status & 1-Click Live Demo
### `GET /api/cypherx/workflow/status`
Returns 24-hour pipeline throughput metrics across event collection, anomaly detection, risk evaluation, and investigation.

```bash
curl -X GET "http://localhost:3000/api/cypherx/workflow/status"
```

### `POST /api/cypherx/demo/run`
Executes the full pipeline (simulation → analysis → risk assessment → alert generation) in one invocation.

```bash
curl -X POST "http://localhost:3000/api/cypherx/demo/run?user_id=5"
```
