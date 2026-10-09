// CypherX API Automated Test Suite
import assert from 'assert';

async function runTests() {
  const base = "http://localhost:3000/api/cypherx";
  let testsPassed = 0;

  console.log("Running CypherX API Test Suite...\n");

  // 1. Briefing Endpoint Test
  {
    const res = await fetch(`${base}/briefing`);
    assert.strictEqual(res.status, 200, "Briefing should return 200");
    const data = await res.json();
    assert(Array.isArray(data.challenges), "Challenges should be an array");
    assert.strictEqual(data.challenges.length, 3, "There should be 3 challenges");
    assert(data.solution.includes("CypherX"), "Solution text must mention CypherX");
    console.log("✔ GET /api/cypherx/briefing passed");
    testsPassed++;
  }

  // 2. Dashboard Summary Test
  {
    const res = await fetch(`${base}/dashboard/summary`);
    assert.strictEqual(res.status, 200, "Dashboard summary should return 200");
    const data = await res.json();
    assert(data.kpis && typeof data.kpis.active_alerts === 'number', "KPIs should include active_alerts");
    assert(data.severity_distribution && data.severity_distribution.total > 0, "Severity distribution should have total > 0");
    assert(Array.isArray(data.hourly_activity), "Hourly activity should be an array");
    assert(Array.isArray(data.top_risky_users), "Top risky users should be an array");
    assert(data.top_risky_users.length <= 5, "Top risky users capped at 5");
    assert(Array.isArray(data.recent_alerts), "Recent alerts should be an array");
    console.log("✔ GET /api/cypherx/dashboard/summary passed");
    testsPassed++;
  }

  // 3. Simulating Suspicious Activity Test
  {
    const res = await fetch(`${base}/simulate/suspicious-activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: 5, scenario: "suspicious", os: "windows", file_access_count: 5000, usb_connections: 1, off_hours: true })
    });
    assert.strictEqual(res.status, 200, "Simulation should return 200");
    const data = await res.json();
    assert.strictEqual(data.user_id, 5);
    assert(data.events_created >= 5000);
    assert.strictEqual(data.os, "windows");
    assert.strictEqual(data.next_step, "analyze");
    console.log("✔ POST /api/cypherx/simulate/suspicious-activity (suspicious) passed");
    testsPassed++;
  }

  // 4. Simulating Normal Activity Test
  {
    const res = await fetch(`${base}/simulate/suspicious-activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: 1, scenario: "normal", os: "linux" })
    });
    assert.strictEqual(res.status, 200, "Normal simulation should return 200");
    const data = await res.json();
    assert.strictEqual(data.scenario, "normal");
    assert.strictEqual(data.breakdown_by_type.usb, 0);
    console.log("✔ POST /api/cypherx/simulate/suspicious-activity (normal) passed");
    testsPassed++;
  }

  // 5. Machine Learning Analysis Endpoint Test
  {
    const res = await fetch(`${base}/analyze/5`, { method: "POST" });
    assert.strictEqual(res.status, 200, "Analysis should return 200");
    const data = await res.json();
    assert.strictEqual(data.user_id, 5);
    assert(typeof data.raw_anomaly_score === 'number');
    assert(typeof data.is_anomaly === 'boolean');
    assert(data.explanation.includes("an anomaly alone doesn't automatically mean malicious activity"));
    assert(data.model_status === "trained" || data.model_status === "fallback_rules");
    console.log("✔ POST /api/cypherx/analyze/{user_id} passed");
    testsPassed++;
  }

  // 6. Risk Scoring and Duplicate Alert Prevention Test
  {
    // First call creates/retrieves alert
    const res1 = await fetch(`${base}/risk/5`, { method: "POST" });
    assert.strictEqual(res1.status, 200);
    const data1 = await res1.json();
    assert(data1.risk_score > 60, "Eve should have high/critical risk score");
    assert(Array.isArray(data1.risk_factors) && data1.risk_factors.length > 0);
    assert(data1.alert_id !== null, "Alert ID should be generated");

    // Second call within same window prevents duplicate creation (reuses alert_id)
    const res2 = await fetch(`${base}/risk/5`, { method: "POST" });
    assert.strictEqual(res2.status, 200);
    const data2 = await res2.json();
    assert.strictEqual(data2.alert_id, data1.alert_id, "Duplicate alert prevented in same window");
    console.log("✔ POST /api/cypherx/risk/{user_id} & duplicate prevention passed");
    testsPassed++;
  }

  // 7. Threat Investigation Endpoint Test
  {
    const res = await fetch(`${base}/alerts/1/investigation`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.alert && data.alert.id === 1);
    assert(data.user && data.user.name);
    assert(Array.isArray(data.what_triggered) && data.what_triggered.length > 0);
    assert(Array.isArray(data.behavioral_metrics) && data.behavioral_metrics.length > 0);
    assert(Array.isArray(data.supporting_events) && data.supporting_events.length > 0);
    assert(data.analyst_guidance.includes("By reviewing the available behavioral metrics"));
    console.log("✔ GET /api/cypherx/alerts/{alert_id}/investigation passed");
    testsPassed++;
  }

  // 8. Alert Status Patch Test
  {
    const res = await fetch(`${base}/alerts/1/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "investigating" })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "investigating");

    // Invalid status validation
    const badRes = await fetch(`${base}/alerts/1/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "invalid_status_xyz" })
    });
    assert.strictEqual(badRes.status, 400, "Invalid status should return 400");
    console.log("✔ PATCH /api/cypherx/alerts/{alert_id}/status (valid & validation) passed");
    testsPassed++;
  }

  // 9. Workflow Status Test
  {
    const res = await fetch(`${base}/workflow/status`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.events_collected > 0);
    assert(data.anomalies_detected >= 0);
    assert(data.closing_statement.includes("CypherX transforms raw security data"));
    console.log("✔ GET /api/cypherx/workflow/status passed");
    testsPassed++;
  }

  // 10. Demo Run Endpoint Test
  {
    const res = await fetch(`${base}/demo/run?user_id=5`, { method: "POST" });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.simulation && data.simulation.events_created >= 5000);
    assert(data.analysis && data.analysis.is_anomaly === true);
    assert(data.risk_assessment && data.risk_assessment.risk_score >= 80);
    assert(data.alert && data.alert.severity === "Critical");
    assert(data.closing_statement.includes("CypherX"));
    console.log("✔ POST /api/cypherx/demo/run passed");
    testsPassed++;
  }

  console.log(`\n🎉 All ${testsPassed}/10 CypherX tests completed successfully!`);
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
