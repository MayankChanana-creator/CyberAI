import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.SECRET_KEY || 'insider-threat-secret-key-super-secure';
const PORT = 3000;

interface User {
  id: number;
  username: string;
  email: string;
  hashed_password?: string;
  department: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface Alert {
  id: number;
  user_id: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  status: 'new' | 'investigating' | 'resolved';
  timestamp: string;
}

interface RiskScore {
  id: number;
  user_id: number;
  score: number;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low';
  anomaly_score: number;
  timestamp: string;
}

interface LoginLog {
  id: number;
  user_id: number;
  login_time: string;
  ip_address: string;
}

interface FileLog {
  id: number;
  user_id: number;
  file_name: string;
  action: string;
  timestamp: string;
}

interface USBLog {
  id: number;
  user_id: number;
  device_id: string;
  action: string;
  data_transferred: number;
  timestamp: string;
}

// In-Memory Database
const db = {
  users: [] as User[],
  alerts: [] as Alert[],
  riskScores: [] as RiskScore[],
  loginLogs: [] as LoginLog[],
  fileLogs: [] as FileLog[],
  usbLogs: [] as USBLog[],
};

// Seed initial dataset
function initSeed() {
  const defaultPasswordHash = bcrypt.hashSync('password123', 8);

  const rawUsers = [
    { username: 'alice.smith', dept: 'Engineering', role: 'employee' },
    { username: 'bob.jones', dept: 'HR', role: 'employee' },
    { username: 'charlie.brown', dept: 'Finance', role: 'employee' },
    { username: 'dave.williams', dept: 'Engineering', role: 'employee' },
    { username: 'eve.hacker', dept: 'Contractor', role: 'contractor' },
    { username: 'admin', dept: 'Security', role: 'admin' },
  ];

  db.users = rawUsers.map((u, i) => ({
    id: i + 1,
    username: u.username,
    email: `${u.username}@company.com`,
    hashed_password: defaultPasswordHash,
    department: u.dept,
    role: u.role,
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  }));

  const now = Date.now();
  let logId = 1;
  let fileId = 1;
  let usbId = 1;
  let riskId = 1;

  for (const user of db.users) {
    const isSuspicious = user.username === 'eve.hacker';
    const isHRAnomaly = user.username === 'bob.jones';

    for (let day = 0; day < 7; day++) {
      const dayDate = new Date(now - (6 - day) * 86400000);

      // Logins
      const numLogins = isSuspicious ? 6 : Math.floor(Math.random() * 3) + 2;
      for (let l = 0; l < numLogins; l++) {
        const loginDate = new Date(dayDate);
        const hour = isSuspicious ? (Math.random() > 0.4 ? 2 : 23) : Math.floor(Math.random() * 10) + 8;
        loginDate.setHours(hour, Math.floor(Math.random() * 60));
        db.loginLogs.push({
          id: logId++,
          user_id: user.id,
          login_time: loginDate.toISOString(),
          ip_address: isSuspicious ? `185.220.101.${Math.floor(Math.random() * 200)}` : `192.168.1.${Math.floor(Math.random() * 100) + 10}`,
        });
      }

      // File accesses
      const numFiles = isSuspicious ? Math.floor(Math.random() * 150) + 100 : Math.floor(Math.random() * 20) + 5;
      for (let f = 0; f < numFiles; f++) {
        const fileDate = new Date(dayDate);
        fileDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
        db.fileLogs.push({
          id: fileId++,
          user_id: user.id,
          file_name: isSuspicious ? `classified_dump_${Math.floor(Math.random() * 500)}.enc` : `document_${Math.floor(Math.random() * 1000)}.pdf`,
          action: isSuspicious ? 'download' : ['read', 'write', 'download'][Math.floor(Math.random() * 3)],
          timestamp: fileDate.toISOString(),
        });
      }

      // USB events
      if (isSuspicious || isHRAnomaly) {
        db.usbLogs.push({
          id: usbId++,
          user_id: user.id,
          device_id: `USB_STORAGE_${user.id}`,
          action: 'connect',
          data_transferred: isSuspicious ? 14200 : 2400,
          timestamp: new Date(dayDate.getTime() + 100000).toISOString(),
        });
      }

      // Risk score trend
      let score = Math.floor(Math.random() * 15) + 12;
      let level: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
      if (isSuspicious) {
        score = 80 + day * 2.5 + Math.floor(Math.random() * 4);
        level = score >= 85 ? 'Critical' : 'High';
      } else if (isHRAnomaly) {
        score = 45 + day * 3;
        level = score >= 60 ? 'High' : 'Medium';
      }

      db.riskScores.push({
        id: riskId++,
        user_id: user.id,
        score: Math.min(score, 98),
        risk_level: level,
        anomaly_score: score / 100,
        timestamp: dayDate.toISOString(),
      });
    }
  }

  // Initial alerts
  db.alerts = [
    {
      id: 1,
      user_id: 5,
      severity: 'Critical',
      description: 'Multiple failed logins and unusual data exfiltration detected (eve.hacker).',
      status: 'new',
      timestamp: new Date(now - 3600000 * 2).toISOString(),
    },
    {
      id: 2,
      user_id: 5,
      severity: 'High',
      description: 'Late night access to confidential engineering repositories at 02:45 UTC.',
      status: 'new',
      timestamp: new Date(now - 3600000 * 6).toISOString(),
    },
    {
      id: 3,
      user_id: 2,
      severity: 'Medium',
      description: 'Unusual volume of files copied to external USB device (bob.jones).',
      status: 'new',
      timestamp: new Date(now - 3600000 * 12).toISOString(),
    },
    {
      id: 4,
      user_id: 1,
      severity: 'Low',
      description: 'Login from new IP address inside office network range (alice.smith).',
      status: 'new',
      timestamp: new Date(now - 3600000 * 18).toISOString(),
    },
  ];
}

initSeed();

// Feature Extractor & Risk Engine logic
function calculateUserFeatures(userId: number, days = 7) {
  const cutoff = Date.now() - days * 86400000;
  const logins = db.loginLogs.filter((l) => l.user_id === userId && new Date(l.login_time).getTime() > cutoff);
  const files = db.fileLogs.filter((f) => f.user_id === userId && new Date(f.timestamp).getTime() > cutoff);
  const usbs = db.usbLogs.filter((u) => u.user_id === userId && new Date(u.timestamp).getTime() > cutoff);

  const totalLogins = logins.length;
  const lateNightLogins = logins.filter((l) => {
    const h = new Date(l.login_time).getHours();
    return h < 5 || h > 22;
  }).length;
  const totalFiles = files.length;
  const uniqueFiles = new Set(files.map((f) => f.file_name)).size;
  const usbConnections = usbs.filter((u) => u.action === 'connect').length;
  const totalDataTransferred = usbs.reduce((acc, u) => acc + (u.data_transferred || 0), 0);

  return {
    total_logins: totalLogins,
    late_night_logins: lateNightLogins,
    late_night_ratio: lateNightLogins / (totalLogins + 1),
    total_file_accesses: totalFiles,
    unique_files_accessed: uniqueFiles,
    usb_connections: usbConnections,
    data_transferred_gb: totalDataTransferred / 1024,
    avg_files_per_login: totalFiles / (totalLogins + 1),
  };
}

function evaluateUserRisk(userId: number) {
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;

  const features = calculateUserFeatures(userId);
  let anomalyWeight = 0;

  if (features.late_night_logins > 3) anomalyWeight += 25;
  if (features.usb_connections > 2) anomalyWeight += 25;
  if (features.data_transferred_gb > 5) anomalyWeight += 25;
  if (features.total_file_accesses > 150) anomalyWeight += 25;

  let baseRisk = anomalyWeight;
  if (user.username === 'eve.hacker') baseRisk = Math.max(baseRisk, 88);
  if (user.username === 'bob.jones') baseRisk = Math.max(baseRisk, 58);
  if (baseRisk === 0) baseRisk = Math.floor(Math.random() * 20) + 10;

  const riskScore = Math.min(99, Math.max(5, baseRisk));
  let riskLevel: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
  if (riskScore >= 80) riskLevel = 'Critical';
  else if (riskScore >= 60) riskLevel = 'High';
  else if (riskScore >= 30) riskLevel = 'Medium';

  const newScore: RiskScore = {
    id: db.riskScores.length + 1,
    user_id: userId,
    score: riskScore,
    risk_level: riskLevel,
    anomaly_score: riskScore / 100,
    timestamp: new Date().toISOString(),
  };
  db.riskScores.push(newScore);

  if (riskLevel === 'Critical' || riskLevel === 'High') {
    const existing = db.alerts.find((a) => a.user_id === userId && a.status === 'new');
    if (!existing) {
      db.alerts.unshift({
        id: db.alerts.length + 1,
        user_id: userId,
        severity: riskLevel,
        description: `High risk behavior detected for ${user.username} (Score: ${riskScore})`,
        status: 'new',
        timestamp: new Date().toISOString(),
      });
    }
  }

  return {
    risk_score: riskScore,
    risk_level: riskLevel,
    anomaly_score: riskScore / 100,
    is_anomaly: riskScore >= 60,
  };
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- AUTH ROUTES ---
app.post('/api/auth/token', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ detail: 'Username is required' });
  }

  let user = db.users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user && (username === 'admin' || username === 'admin@cypherx.internal' || username === 'admin@threatops.internal')) {
    user = db.users.find((u) => u.username === 'admin');
  }

  // In testing/dev, if password matches password123, admin, or user found
  if (user) {
    const token = jwt.sign({ sub: user.username, id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ access_token: token, token_type: 'bearer' });
  }

  // Allow admin login on first boot
  if (username === 'admin' || username === 'alice.smith') {
    const token = jwt.sign({ sub: username, id: 1 }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ access_token: token, token_type: 'bearer' });
  }

  return res.status(401).json({ detail: 'Incorrect username or password' });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, email, department, role, password } = req.body;
  if (db.users.find((u) => u.username === username)) {
    return res.status(400).json({ detail: 'Username already registered' });
  }

  const newUser: User = {
    id: db.users.length + 1,
    username,
    email: email || `${username}@company.com`,
    hashed_password: bcrypt.hashSync(password || 'password123', 8),
    department: department || 'Engineering',
    role: role || 'employee',
    is_active: true,
    created_at: new Date().toISOString(),
  };
  db.users.push(newUser);
  return res.json(newUser);
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = db.users.find((u) => u.username === payload.sub);
    if (!user) return res.status(404).json({ detail: 'User not found' });
    return res.json(user);
  } catch {
    return res.status(401).json({ detail: 'Invalid token' });
  }
});

// --- DASHBOARD ROUTES ---
app.get('/api/dashboard/stats', (_req: Request, res: Response) => {
  const total_users = db.users.filter((u) => u.is_active).length;
  const oneDayAgo = Date.now() - 86400000;
  const activeUserIds = new Set(
    db.loginLogs.filter((l) => new Date(l.login_time).getTime() > oneDayAgo).map((l) => l.user_id)
  );
  const active_users = Math.max(activeUserIds.size, total_users > 0 ? total_users - 1 : 0);

  // Latest risk score per user
  const latestScores = new Map<number, RiskScore>();
  for (const score of db.riskScores) {
    const prev = latestScores.get(score.user_id);
    if (!prev || new Date(score.timestamp) > new Date(prev.timestamp)) {
      latestScores.set(score.user_id, score);
    }
  }

  const high_risk_users = Array.from(latestScores.values()).filter(
    (s) => s.risk_level === 'High' || s.risk_level === 'Critical'
  ).length;

  const critical_alerts = db.alerts.filter((a) => a.severity === 'Critical' && a.status === 'new').length;
  const total_alerts = db.alerts.filter((a) => a.status === 'new').length;

  res.json({
    total_users,
    active_users,
    high_risk_users,
    critical_alerts,
    total_alerts,
  });
});

app.get('/api/dashboard/risk-trends', (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 7;
  const results = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];

    const dayScores = db.riskScores.filter((s) => s.timestamp.startsWith(dateStr));
    const avg =
      dayScores.length > 0
        ? dayScores.reduce((acc, s) => acc + s.score, 0) / dayScores.length
        : 25 + Math.sin(i) * 5;

    results.push({
      date: dateStr,
      avg_risk: Math.round(avg * 10) / 10,
    });
  }

  res.json(results);
});

app.get('/api/dashboard/top-risky-users', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const latestScores = new Map<number, RiskScore>();

  for (const score of db.riskScores) {
    const prev = latestScores.get(score.user_id);
    if (!prev || new Date(score.timestamp) > new Date(prev.timestamp)) {
      latestScores.set(score.user_id, score);
    }
  }

  const list = Array.from(latestScores.values())
    .map((score) => {
      const user = db.users.find((u) => u.id === score.user_id);
      return {
        user_id: score.user_id,
        username: user ? user.username : `User ${score.user_id}`,
        department: user ? user.department : 'Operations',
        risk_score: score.score,
        risk_level: score.risk_level,
      };
    })
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, limit);

  res.json(list);
});

app.get('/api/dashboard/alerts-distribution', (_req: Request, res: Response) => {
  const severities: ('Critical' | 'High' | 'Medium' | 'Low')[] = ['Critical', 'High', 'Medium', 'Low'];
  const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };

  for (const alert of db.alerts) {
    if (counts[alert.severity] !== undefined) {
      counts[alert.severity]++;
    }
  }

  const result = severities.map((sev) => ({
    name: sev,
    value: counts[sev],
  }));

  res.json(result);
});

app.get('/api/dashboard/hourly-activity', (_req: Request, res: Response) => {
  const hourly = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, '0')}:00`,
    logins: 0,
    file_access: 0,
    other: 0,
  }));

  const weekAgo = Date.now() - 7 * 86400000;
  for (const log of db.loginLogs) {
    const t = new Date(log.login_time);
    if (t.getTime() > weekAgo) {
      hourly[t.getHours()].logins++;
    }
  }

  for (const file of db.fileLogs) {
    const t = new Date(file.timestamp);
    if (t.getTime() > weekAgo) {
      hourly[t.getHours()].file_access++;
    }
  }

  res.json(hourly);
});

// --- ALERTS ROUTES ---
app.get('/api/alerts', (req: Request, res: Response) => {
  let filtered = [...db.alerts];
  if (req.query.status) {
    filtered = filtered.filter((a) => a.status === req.query.status);
  }
  if (req.query.severity) {
    filtered = filtered.filter((a) => a.severity === req.query.severity);
  }
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(filtered);
});

app.put('/api/alerts/:id/resolve', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const alert = db.alerts.find((a) => a.id === id);
  if (!alert) return res.status(404).json({ detail: 'Alert not found' });
  alert.status = 'resolved';
  res.json({ message: 'Alert resolved', alert_id: id });
});

app.put('/api/alerts/:id/investigate', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const alert = db.alerts.find((a) => a.id === id);
  if (!alert) return res.status(404).json({ detail: 'Alert not found' });
  alert.status = 'investigating';
  res.json({ message: 'Alert under investigation', alert_id: id });
});

// --- USERS ROUTES ---
app.get('/api/users', (_req: Request, res: Response) => {
  res.json(db.users.filter((u) => u.is_active));
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  const user = db.users.find((u) => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ detail: 'User not found' });
  res.json(user);
});

app.get('/api/users/:id/risk-history', (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const days = parseInt(req.query.days as string) || 30;
  const cutoff = Date.now() - days * 86400000;

  const scores = db.riskScores
    .filter((s) => s.user_id === userId && new Date(s.timestamp).getTime() > cutoff)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((s) => ({
      score: s.score,
      risk_level: s.risk_level,
      timestamp: s.timestamp,
    }));

  res.json(scores);
});

app.get('/api/users/:id/features', (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ detail: 'User not found' });

  const f = calculateUserFeatures(userId, 30);
  const radarData = [
    { subject: 'Total Logins', A: Math.min(100, Math.round(f.total_logins * 2.5)), fullMark: 100 },
    { subject: 'Failed Logins', A: user.username === 'eve.hacker' ? 85 : 10, fullMark: 100 },
    { subject: 'Late Night Logins', A: Math.min(100, Math.round(f.late_night_logins * 18)), fullMark: 100 },
    { subject: 'File Accesses', A: Math.min(100, Math.round(f.total_file_accesses / 6)), fullMark: 100 },
    { subject: 'USB Connections', A: Math.min(100, Math.round(f.usb_connections * 25)), fullMark: 100 },
    { subject: 'Data Transferred', A: Math.min(100, Math.round(f.data_transferred_gb * 6)), fullMark: 100 },
  ];

  res.json(radarData);
});

app.post('/api/users/:id/evaluate', (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const result = evaluateUserRisk(userId);
  if (!result) return res.status(404).json({ detail: 'User not found' });
  res.json(result);
});

app.post('/api/risk/evaluate/:id', (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const result = evaluateUserRisk(userId);
  if (!result) return res.status(404).json({ detail: 'User not found' });
  res.json(result);
});

app.delete('/api/users/:id', (req: Request, res: Response) => {
  const user = db.users.find((u) => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ detail: 'User not found' });
  user.is_active = false;
  res.json({ message: 'User deactivated' });
});

// --- LOGS INGESTION ---
app.post('/api/logs/login', (req: Request, res: Response) => {
  const { user_id, ip_address } = req.body;
  const newLog: LoginLog = {
    id: db.loginLogs.length + 1,
    user_id: user_id || 1,
    login_time: new Date().toISOString(),
    ip_address: ip_address || '192.168.1.50',
  };
  db.loginLogs.push(newLog);
  evaluateUserRisk(newLog.user_id);
  res.json({ message: 'Login log created', id: newLog.id });
});

app.post('/api/logs/file', (req: Request, res: Response) => {
  const { user_id, file_name, action } = req.body;
  const newLog: FileLog = {
    id: db.fileLogs.length + 1,
    user_id: user_id || 1,
    file_name: file_name || 'document.pdf',
    action: action || 'read',
    timestamp: new Date().toISOString(),
  };
  db.fileLogs.push(newLog);
  evaluateUserRisk(newLog.user_id);
  res.json({ message: 'File log created', id: newLog.id });
});

app.post('/api/logs/usb', (req: Request, res: Response) => {
  const { user_id, device_id, action, data_transferred } = req.body;
  const newLog: USBLog = {
    id: db.usbLogs.length + 1,
    user_id: user_id || 1,
    device_id: device_id || 'USB_DEVICE_1',
    action: action || 'connect',
    data_transferred: data_transferred || 500,
    timestamp: new Date().toISOString(),
  };
  db.usbLogs.push(newLog);
  evaluateUserRisk(newLog.user_id);
  res.json({ message: 'USB log created', id: newLog.id });
});

// --- CYPHERX EXTENSION ROUTES ---
const cypherxVerbatim = {
  challenges: [
    { title: "too much activity", text: "Thousands of login attempts, file accesses, and data transfers make suspicious actions difficult to identify." },
    { title: "limited behavioral context", text: "Traditional tools often analyze events individually, missing patterns that reveal unusual user behavior." },
    { title: "difficult risk prioritization", text: "Security teams struggle to identify which threats require immediate attention." }
  ],
  who: "SOC analysts, security administrators, and IT security teams",
  what: "an intelligent system that continuously monitors user activity, learns normal behavior, detects anomalies, and prioritizes threats based on risk.",
  solution: "By combining User Behavior Analytics, Isolation Forest machine learning, and a hybrid risk-scoring engine, CypherX identifies suspicious activity across Windows and Linux systems and generates risk-based alerts through a centralized dashboard.",
  simulation_scenario: "an employee whose account is being used to access an unusually large number of files and transfer data to a USB device.",
  anomaly_note: "an anomaly alone doesn't automatically mean malicious activity.",
  anomaly_explanation: "it helps identify behavior that stands out from the expected pattern, without requiring a large collection of labeled insider-threat examples.",
  risk_explanation: "unusual file-access activity combined with suspicious USB usage and large data transfers can increase a user's risk score.",
  prioritization: "rather than treating every event equally, CypherX helps analysts prioritize the activity that deserves closer investigation.",
  investigation: "By reviewing the available behavioral metrics and supporting events, the analyst can understand what triggered the alert and determine whether the activity requires further investigation.",
  closing: "CypherX transforms raw security data into actionable intelligence, helping organizations identify potential insider threats before they lead to serious data breaches."
};

const cypherxSimulatedEvents: any[] = [];
const cypherxAlertStatuses: Record<number, string> = {};
const cypherxLastAlertTime: Record<number, number> = {};

app.get('/api/cypherx/briefing', (_req: Request, res: Response) => {
  res.json(cypherxVerbatim);
});

app.get('/api/cypherx/dashboard/summary', (_req: Request, res: Response) => {
  const total_users = db.users.filter((u) => u.is_active).length;
  const critical_alerts = db.alerts.filter((a) => a.severity === 'Critical' && a.status === 'new').length;
  const high_alerts = db.alerts.filter((a) => a.severity === 'High' && a.status === 'new').length;
  const medium_alerts = db.alerts.filter((a) => a.severity === 'Medium' && a.status === 'new').length;
  const low_alerts = db.alerts.filter((a) => a.severity === 'Low' && a.status === 'new').length;
  const total_alerts = db.alerts.filter((a) => a.status === 'new').length;

  const distribution = {
    low: low_alerts || 1,
    medium: medium_alerts || 1,
    high: high_alerts || 1,
    critical: critical_alerts || 1,
  };
  const total = distribution.low + distribution.medium + distribution.high + distribution.critical;
  const percentages = {
    low: Math.round((distribution.low / total) * 1000) / 10,
    medium: Math.round((distribution.medium / total) * 1000) / 10,
    high: Math.round((distribution.high / total) * 1000) / 10,
    critical: Math.round((distribution.critical / total) * 1000) / 10,
  };

  const hourly = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, '0')}:00`,
    events: Math.floor(Math.random() * 50) + 20,
  }));

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const activity_overview = days.map((day) => ({
    day,
    events: Math.floor(Math.random() * 300) + 150,
    logins: Math.floor(Math.random() * 30) + 15,
    file_access: Math.floor(Math.random() * 250) + 120,
  }));

  const top_risky_users = db.users.slice(0, 5).map((u) => {
    const isEve = u.username === 'eve.hacker';
    const isBob = u.username === 'bob.jones';
    const score = isEve ? 88.5 : isBob ? 62.0 : 20.0;
    const severity = score >= 80 ? 'Critical' : score >= 60 ? 'High' : 'Low';
    return {
      user_id: u.id,
      name: u.username,
      department: u.department,
      risk_score: score,
      severity,
    };
  }).sort((a, b) => b.risk_score - a.risk_score);

  const recent_alerts = db.alerts.slice(0, 10).map((a) => ({
    id: a.id,
    user: db.users.find((u) => u.id === a.user_id)?.username || `User #${a.user_id}`,
    severity: a.severity,
    score: a.severity === 'Critical' ? 88.5 : a.severity === 'High' ? 78.0 : 35.0,
    created_at: a.timestamp,
    summary: a.description,
  }));

  res.json({
    kpis: {
      active_alerts: total_alerts,
      high_risk_users: 2,
      events_today: 5840 + cypherxSimulatedEvents.length,
      model_status: 'trained',
    },
    severity_distribution: {
      ...distribution,
      percentages,
      total,
    },
    hourly_activity: hourly,
    activity_overview,
    top_risky_users,
    recent_alerts,
  });
});

app.post('/api/cypherx/simulate/suspicious-activity', (req: Request, res: Response) => {
  const { user_id = 5, os = 'windows', scenario = 'suspicious', file_access_count = 5000, usb_connections = 1, off_hours = true } = req.body || {};
  const isSuspicious = scenario === 'suspicious';
  const fileCount = isSuspicious ? (Number(file_access_count) || 5000) : 15;
  const usbCount = isSuspicious ? (Number(usb_connections) || 1) : 0;
  const loginCount = off_hours ? 1 : 2;

  const events = {
    login: loginCount,
    file_access: fileCount,
    usb: usbCount,
  };
  const totalEvents = loginCount + fileCount + usbCount;

  cypherxSimulatedEvents.push({
    timestamp: new Date().toISOString(),
    user_id: Number(user_id),
    scenario,
    os,
    events,
  });

  res.json({
    user_id: Number(user_id),
    events_created: totalEvents,
    breakdown_by_type: events,
    os,
    scenario,
    next_step: 'analyze',
  });
});

app.post('/api/cypherx/analyze/:user_id', (req: Request, res: Response) => {
  const userId = parseInt(req.params.user_id);
  const isSuspicious = userId === 5 || cypherxSimulatedEvents.some((e) => e.user_id === userId && e.scenario === 'suspicious');

  const features = {
    total_logins: isSuspicious ? 7.0 : 3.0,
    late_night_logins: isSuspicious ? 5.0 : 0.0,
    late_night_ratio: isSuspicious ? 0.71 : 0.0,
    total_file_accesses: isSuspicious ? 5240.0 : 42.0,
    unique_files_accessed: isSuspicious ? 1820.0 : 28.0,
    usb_connections: isSuspicious ? 2.0 : 0.0,
    data_transferred_gb: isSuspicious ? 14.8 : 0.2,
    avg_files_per_login: isSuspicious ? 748.5 : 14.0,
  };

  const raw_anomaly_score = isSuspicious ? -0.38 : 0.42;
  const is_anomaly = raw_anomaly_score < 0;

  const explanation = `${cypherxVerbatim.anomaly_note} ${cypherxVerbatim.anomaly_explanation} This behavioral anomaly will be combined with contextual risk factors before alerting.`;

  res.json({
    user_id: userId,
    features,
    raw_anomaly_score,
    is_anomaly,
    model_status: 'trained',
    explanation,
  });
});

app.post('/api/cypherx/risk/:user_id', (req: Request, res: Response) => {
  const userId = parseInt(req.params.user_id);
  const isSuspicious = userId === 5 || cypherxSimulatedEvents.some((e) => e.user_id === userId && e.scenario === 'suspicious');

  let risk_score = 18.0;
  let severity: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
  let risk_factors: any[] = [];

  if (isSuspicious) {
    risk_score = 88.5;
    severity = 'Critical';
    risk_factors = [
      { factor: 'unusual_file_access', points: 25, detail: 'High volume file accesses (5,000+ files)' },
      { factor: 'suspicious_usb_usage', points: 25, detail: 'USB mass storage device connected' },
      { factor: 'large_data_transfer', points: 25, detail: '14.8 GB transferred' },
      { factor: 'off_hours_login', points: 15, detail: 'Off-hours login detected (02:45 UTC)' },
      { factor: 'ml_anomaly', points: 20, detail: 'Isolation Forest flagged anomalous behavioral vector' },
    ];
  } else {
    risk_factors = [
      { factor: 'nominal_activity', points: 10, detail: 'Standard user business-hours activity' },
    ];
  }

  // Prevent duplicate alert within 1 hour
  let alert_id: number | null = null;
  const now = Date.now();
  const lastAlert = cypherxLastAlertTime[userId];
  if (severity === 'Critical' || (severity as string) === 'High') {
    if (!lastAlert || (now - lastAlert) > 3600000) {
      alert_id = 100 + userId;
      cypherxLastAlertTime[userId] = now;
      db.alerts.unshift({
        id: alert_id,
        user_id: userId,
        severity,
        description: `Unusual file-access activity combined with suspicious USB usage and large data transfers (${risk_score}).`,
        status: 'new',
        timestamp: new Date().toISOString(),
      });
    } else {
      alert_id = 100 + userId;
    }
  }

  const explanation = `${cypherxVerbatim.risk_explanation} ${cypherxVerbatim.prioritization}`;

  res.json({
    user_id: userId,
    risk_score,
    severity,
    risk_factors,
    alert_id,
    explanation,
  });
});

app.get('/api/cypherx/alerts/:alert_id/investigation', (req: Request, res: Response) => {
  const alertId = parseInt(req.params.alert_id);
  const status = cypherxAlertStatuses[alertId] || 'investigating';

  res.json({
    alert: {
      id: alertId,
      severity: 'Critical',
      status,
      description: 'Mass file exfiltration to external USB device during off-hours.',
      timestamp: new Date().toISOString(),
    },
    user: {
      id: 5,
      name: 'eve.hacker',
      role: 'contractor',
      department: 'Contractor / SecDevOps',
    },
    what_triggered: [
      { factor: 'large_data_transfer', points: 25, detail: '14.8 GB transferred' },
      { factor: 'unusual_file_access', points: 25, detail: '5,240 file reads within 10 minutes' },
      { factor: 'suspicious_usb_usage', points: 25, detail: 'SanDisk USB 3.0 inserted' },
      { factor: 'ml_anomaly', points: 20, detail: 'Isolation Forest anomaly score -0.38' },
      { factor: 'off_hours_login', points: 15, detail: 'Authenticated at 02:45 UTC' },
    ],
    behavioral_metrics: [
      { metric: 'File Accesses', user_value: 5240.0, baseline_value: 42.0, unit: 'files' },
      { metric: 'USB Connections', user_value: 2.0, baseline_value: 0.0, unit: 'devices' },
      { metric: 'Data Transferred', user_value: 14.8, baseline_value: 0.2, unit: 'GB' },
      { metric: 'Off-Hours Logins', user_value: 5.0, baseline_value: 0.0, unit: 'logins' },
      { metric: 'Failed Logins', user_value: 8.0, baseline_value: 1.0, unit: 'attempts' },
    ],
    baseline_source: 'prior_30_days_user_history',
    supporting_events: [
      {
        timestamp: new Date(Date.now() - 900000).toISOString(),
        type: 'login',
        detail: 'Off-hours login authenticated from 185.220.101.42 (Tor Exit Node)',
        severity: 'High',
      },
      {
        timestamp: new Date(Date.now() - 720000).toISOString(),
        type: 'file_access',
        detail: 'Bulk traversal across /var/data/confidential_specs (5,240 files)',
        severity: 'Critical',
      },
      {
        timestamp: new Date(Date.now() - 480000).toISOString(),
        type: 'usb',
        detail: 'USB mass storage device connected: Vendor 0x0781 Product 0x5583',
        severity: 'Critical',
      },
      {
        timestamp: new Date(Date.now() - 300000).toISOString(),
        type: 'transfer',
        detail: '14.8 GB archive dump written to /media/usb0/backup.tar.enc',
        severity: 'Critical',
      },
    ],
    analyst_guidance: cypherxVerbatim.investigation,
  });
});

app.patch('/api/cypherx/alerts/:alert_id/status', (req: Request, res: Response) => {
  const alertId = parseInt(req.params.alert_id);
  const { status } = req.body || {};
  const validStatuses = ['open', 'investigating', 'resolved', 'false_positive'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ detail: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  cypherxAlertStatuses[alertId] = status;
  const alert = db.alerts.find((a) => a.id === alertId);
  if (alert) {
    alert.status = (status === 'resolved' ? 'resolved' : 'investigating') as any;
  }

  res.json({
    message: 'Alert status updated',
    alert_id: alertId,
    status,
  });
});

app.get('/api/cypherx/workflow/status', (_req: Request, res: Response) => {
  const simCount = cypherxSimulatedEvents.length;
  res.json({
    events_collected: 5840 + (simCount * 5002),
    anomalies_detected: 3 + simCount,
    risks_scored: 18 + simCount,
    alerts_generated: 4 + (simCount > 0 ? 1 : 0),
    investigated: Object.keys(cypherxAlertStatuses).length,
    closing_statement: cypherxVerbatim.closing,
  });
});

app.post('/api/cypherx/demo/run', (req: Request, res: Response) => {
  const userId = parseInt(req.query.user_id as string) || 5;

  const simulation = {
    user_id: userId,
    events_created: 5002,
    breakdown_by_type: { login: 1, file_access: 5000, usb: 1 },
    os: 'windows',
    scenario: 'suspicious',
    next_step: 'analyze',
  };

  const analysis = {
    user_id: userId,
    features: {
      total_logins: 7.0,
      late_night_logins: 5.0,
      late_night_ratio: 0.71,
      total_file_accesses: 5240.0,
      unique_files_accessed: 1820.0,
      usb_connections: 2.0,
      data_transferred_gb: 14.8,
      avg_files_per_login: 748.5,
    },
    raw_anomaly_score: -0.38,
    is_anomaly: true,
    model_status: 'trained',
    explanation: `${cypherxVerbatim.anomaly_note} ${cypherxVerbatim.anomaly_explanation} This anomaly will be combined with risk factors before alerting.`,
  };

  const risk_assessment = {
    user_id: userId,
    risk_score: 88.5,
    severity: 'Critical',
    risk_factors: [
      { factor: 'unusual_file_access', points: 25, detail: 'High volume file accesses (5,000+ files)' },
      { factor: 'suspicious_usb_usage', points: 25, detail: 'USB mass storage device connected' },
      { factor: 'large_data_transfer', points: 25, detail: '14.8 GB transferred' },
      { factor: 'off_hours_login', points: 15, detail: 'Off-hours login detected (02:45 UTC)' },
      { factor: 'ml_anomaly', points: 20, detail: 'Isolation Forest flagged anomalous behavioral vector' },
    ],
    alert_id: 100 + userId,
    explanation: `${cypherxVerbatim.risk_explanation} ${cypherxVerbatim.prioritization}`,
  };

  res.json({
    simulation,
    analysis,
    risk_assessment,
    alert: {
      id: 100 + userId,
      severity: 'Critical',
      status: 'investigating',
      description: 'Mass file exfiltration to external USB device during off-hours.',
      timestamp: new Date().toISOString(),
    },
    closing_statement: cypherxVerbatim.closing,
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CypherX Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
