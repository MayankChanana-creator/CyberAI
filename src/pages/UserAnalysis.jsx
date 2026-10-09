import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  ArrowLeft, User as UserIcon, Shield, Activity, 
  RefreshCw, CheckCircle2, Clock, HardDrive, FileText, Lock 
} from 'lucide-react';

// Semicircle Mini Risk Gauge for User Header
const MiniRiskGauge = ({ score = 75 }) => {
  const radius = 42;
  const stroke = 8;
  const normalizedScore = Math.min(100, Math.max(0, score));
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="relative w-32 h-18 mx-auto flex items-end justify-center overflow-hidden">
      <svg className="w-32 h-32 -rotate-180 transform" viewBox="0 0 110 110">
        <circle
          cx="55"
          cy="55"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
        />
        <circle
          cx="55"
          cy="55"
          r={radius}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute bottom-0 text-center">
        <div className="text-2xl font-extrabold font-mono text-white leading-none">
          {score}
        </div>
        <span className="text-[9px] uppercase font-bold text-white/80 tracking-widest">Score</span>
      </div>
    </div>
  );
};

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 border border-white/15 text-xs rounded-xl shadow-xl">
        <p className="font-semibold text-white/90 mb-1">{label}</p>
        <p className="font-mono text-[#8B5CF6]">
          Score: <span className="font-bold text-white">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const UserAnalysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [riskHistory, setRiskHistory] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const fetchUserData = async () => {
    try {
      const [userRes, historyRes, featuresRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/users/${id}/risk-history`),
        api.get(`/users/${id}/features`)
      ]);
      setUser(userRes.data);
      setRiskHistory(historyRes.data || []);
      setFeatures(featuresRes.data || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      await api.post(`/users/${id}/evaluate`);
      await fetchUserData();
    } catch (error) {
      console.error('Error evaluating user:', error);
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="py-24 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#8B5CF6] border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-white/50 text-sm">Loading security profile...</p>
      </div>
    );
  }

  // Current latest score & level
  const latestRisk = riskHistory.length > 0 ? riskHistory[riskHistory.length - 1] : { score: 45, risk_level: 'Medium' };
  const currentScore = Math.round(latestRisk.score || 45);
  const currentLevel = latestRisk.risk_level || (currentScore >= 80 ? 'Critical' : currentScore >= 60 ? 'High' : 'Low');

  // Realistic mock recent timeline items derived from behavior
  const isSuspicious = user.username === 'eve.hacker';
  const timelineEvents = [
    {
      time: '10 minutes ago',
      title: isSuspicious ? 'Large Volume Data Export' : 'Standard Routine File Download',
      desc: isSuspicious ? 'Exported 14.2 GB of encrypted database backups to external USB.' : 'Downloaded quarterly engineering spec PDF.',
      icon: HardDrive,
      severity: isSuspicious ? 'Critical' : 'Low',
    },
    {
      time: '2 hours ago',
      title: isSuspicious ? 'Late-Night Off-Hours Authentication' : 'Regular VPN Session Connected',
      desc: isSuspicious ? 'Login detected at 02:45 UTC from non-standard Tor exit relay IP.' : 'Authenticated from primary corporate subnet.',
      icon: Lock,
      severity: isSuspicious ? 'High' : 'Low',
    },
    {
      time: '1 day ago',
      title: 'Privilege Access Verification',
      desc: 'Account credentials checked against corporate Active Directory policy.',
      icon: Shield,
      severity: 'Low',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Navigation */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] text-white/80 hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <span className="text-xs uppercase font-semibold text-[#8B5CF6] tracking-wider">User Dossier</span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Investigate Subject #{user.id}
          </h1>
        </div>
      </div>

      {/* HEADER CARD: Avatar, Name, Role, Pink Risk Gauge, Severity Pill */}
      <div className="glass-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: User Profile */}
        <div className="flex items-center gap-5 text-left w-full md:w-auto">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#2F7BFF] via-[#6D3AEA] to-[#8B5CF6] p-1 shadow-glow-purple shrink-0">
            <div className="w-full h-full rounded-[22px] bg-black/30 backdrop-blur-sm flex items-center justify-center text-3xl font-extrabold text-white">
              {user.username.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">{user.username}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                currentLevel === 'Critical' ? 'badge-critical' :
                currentLevel === 'High' ? 'badge-high' :
                currentLevel === 'Medium' ? 'badge-medium' :
                'badge-low'
              }`}>
                {currentLevel}
              </span>
            </div>
            <p className="text-sm text-white/50">{user.department} Department • {user.role || 'Employee'}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
              <span className="flex items-center gap-1.5 text-[#22C55E]">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_8px_#22C55E]" /> Monitored Active
              </span>
              <span>•</span>
              <span className="font-mono">User ID: #{user.id}</span>
            </div>
          </div>
        </div>

        {/* Right: Pink Gradient Risk Score Gauge + Action */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
          <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FF3D9A] via-[#FF54A8] to-[#FF7AC6] text-white shadow-glow-pink border border-white/20 text-center min-w-[160px]">
            <MiniRiskGauge score={currentScore} />
            <div className="text-[11px] font-bold uppercase tracking-wider text-white mt-1">Behavior Risk</div>
          </div>

          <button 
            onClick={handleEvaluate}
            disabled={loading}
            className="btn-primary w-full sm:w-auto px-6 py-3.5 text-xs text-white font-semibold flex items-center justify-center gap-2 shadow-glow-purple disabled:opacity-50"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Shield size={16} />}
            <span>Re-evaluate Risk</span>
          </button>
        </div>
      </div>

      {/* GRID: Behavioral Radar Chart (2 cols) + Recent Event Timeline (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Behavioral Radar Chart */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Activity size={18} className="text-[#8B5CF6]" />
                Behavioral Metric Signature
              </h2>
              <span className="text-xs text-white/40 font-mono">Normalized vs Thresholds</span>
            </div>
            <p className="text-xs text-white/50 mb-4">Multi-factor activity deviations scored against peer group baselines</p>
          </div>

          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={features}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.10)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar 
                  name={user.username} 
                  dataKey="A" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  fill="#8B5CF6" 
                  fillOpacity={0.25} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-white/40 pt-3 border-t border-white/[0.07]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#8B5CF6]" /> Active Vector Profile
            </span>
            <span>Evaluated across 6 vectors</span>
          </div>
        </div>

        {/* Timeline of Recent Events */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Clock size={18} className="text-[#2F7BFF]" />
                Recent Timeline
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/60">Live</span>
            </div>
            <p className="text-xs text-white/50 mb-6">Chronological telemetry events</p>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10 flex-1">
            {timelineEvents.map((event, i) => {
              const Icon = event.icon;
              const isCrit = event.severity === 'Critical';
              const isHigh = event.severity === 'High';
              const dotColor = isCrit ? 'bg-[#EF4444] shadow-[0_0_10px_#EF4444]' : isHigh ? 'bg-[#FB923C] shadow-[0_0_10px_#FB923C]' : 'bg-[#22C55E]';

              return (
                <div key={i} className="relative">
                  {/* Glowing dot */}
                  <span className={`absolute -left-[19px] top-1 w-3 h-3 rounded-full border-2 border-[#0A0A0A] ${dotColor}`} />
                  <div>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-semibold text-white">{event.title}</span>
                      <span className="text-[10px] text-white/40 font-mono">{event.time}</span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">{event.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-white/40 pt-4 border-t border-white/[0.07] mt-4">
            Audited automatically by CypherX Engine
          </div>
        </div>

      </div>

      {/* RISK SCORE HISTORY (30 DAYS) LINE CHART */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Risk Score History (30 Days)</h2>
            <p className="text-xs text-white/50">Historical score trajectory over rolling investigation windows</p>
          </div>
          <span className="text-xs font-mono text-[#8B5CF6] font-semibold">Latest: {currentScore} / 100</span>
        </div>

        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={riskHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                stroke="rgba(255, 255, 255, 0.3)" 
                tick={{ fill: 'rgba(255, 255, 255, 0.45)', fontSize: 10 }}
                tickFormatter={(str) => str ? new Date(str).toLocaleDateString([], { month: 'numeric', day: 'numeric' }) : ''} 
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.3)" 
                tick={{ fill: 'rgba(255, 255, 255, 0.45)', fontSize: 10 }} 
                domain={[0, 100]} 
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Line 
                type="stepAfter" 
                dataKey="score" 
                name="Risk Score"
                stroke="#FF3D9A" 
                strokeWidth={3} 
                dot={{ fill: '#FF3D9A', r: 3 }}
                activeDot={{ r: 7, fill: '#FF7AC6' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default UserAnalysis;
