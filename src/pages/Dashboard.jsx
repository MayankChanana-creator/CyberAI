import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  Users, Activity, AlertTriangle, ShieldAlert, ArrowRight,
  FileText, Loader2, Shield, Clock, CheckCircle2, 
  Sparkles, ArrowUpRight, ChevronDown
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const SEVERITY_COLORS = {
  Critical: '#EF4444',
  High: '#FB923C',
  Medium: '#FACC15',
  Low: '#22C55E',
};

// Reusable Top KPI Card with Pill Delta Chip & Sparkline
const KpiCard = ({ title, value, subtext, delta, deltaColor = 'text-emerald-400', deltaBg = 'bg-emerald-500/10 border-emerald-500/20', icon: Icon, sparklineColor = '#8B5CF6' }) => (
  <div className="glass-card p-6 flex flex-col justify-between group hover:border-white/20 transition-all duration-200">
    <div className="flex items-start justify-between mb-4">
      <div>
        <span className="text-xs font-medium text-white/50 tracking-wide uppercase">{title}</span>
        <div className="text-3xl lg:text-4xl font-bold tracking-tight text-white mt-1 font-sans">
          {value !== null && value !== undefined ? value : '—'}
        </div>
      </div>
      <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 text-white/80 group-hover:scale-105 transition-transform">
        <Icon size={22} className="text-[#8B5CF6]" />
      </div>
    </div>
    
    <div className="flex items-center justify-between pt-2 border-t border-white/[0.07]">
      <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${deltaBg} ${deltaColor} flex items-center gap-1`}>
        <ArrowUpRight size={12} />
        <span>{delta}</span>
      </div>
      <span className="text-xs text-white/40">{subtext}</span>
    </div>
  </div>
);

// Semicircle SVG Gauge for Risk Score Card
const RiskGauge = ({ score = 85 }) => {
  const radius = 58;
  const stroke = 10;
  const normalizedScore = Math.min(100, Math.max(0, score));
  // Half-circle arc circumference
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="relative w-44 h-24 mx-auto flex items-end justify-center overflow-hidden">
      <svg className="w-44 h-44 -rotate-180 transform" viewBox="0 0 140 140">
        {/* Background Arc */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Filled Score Arc */}
        <circle
          cx="70"
          cy="70"
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
      {/* Center Value */}
      <div className="absolute bottom-1 text-center">
        <div className="text-4xl font-extrabold tracking-tight font-mono text-white leading-none">
          {score}
        </div>
        <span className="text-[10px] uppercase font-bold text-white/80 tracking-widest">/ 100</span>
      </div>
    </div>
  );
};

// Hidden "print-ready" report template
const ReportTemplate = React.forwardRef(({ stats, riskTrends, alertsDist, hourlyAct, riskyUsers }, ref) => {
  const now = new Date();
  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', top: '-9999px', left: '-9999px',
        width: '1200px', background: '#0A0A0A', color: '#FFFFFF',
        fontFamily: "'Outfit', sans-serif", padding: '48px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: '#6D3AEA', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={26} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>CYPHER<span style={{ color: '#8B5CF6' }}>X</span></div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Executive Insider Threat Intelligence Report</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Generated: {now.toLocaleDateString()} at {now.toLocaleTimeString()}</div>
          <div style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(239,68,68,0.2)', border: '1px solid #EF4444', borderRadius: '9999px', fontSize: '11px', color: '#EF4444', fontWeight: '700', marginTop: '6px' }}>CONFIDENTIAL</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Active Alerts', value: stats?.total_alerts ?? 0 },
          { label: 'High-Risk Users', value: stats?.high_risk_users ?? 0 },
          { label: 'Active Users (24h)', value: stats?.active_users ?? 0 },
          { label: 'Critical Alerts', value: stats?.critical_alerts ?? 0 },
        ].map((item) => (
          <div key={item.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{item.label}</div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '4px' }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>High-Risk Subject Inventory</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              <th style={{ padding: '8px' }}>USER</th>
              <th style={{ padding: '8px' }}>DEPARTMENT</th>
              <th style={{ padding: '8px' }}>RISK SCORE</th>
              <th style={{ padding: '8px' }}>LEVEL</th>
            </tr>
          </thead>
          <tbody>
            {riskyUsers.map((u) => (
              <tr key={u.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                <td style={{ padding: '10px 8px', fontWeight: '600' }}>{u.username}</td>
                <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.6)' }}>{u.department}</td>
                <td style={{ padding: '10px 8px', fontWeight: '700' }}>{u.risk_score?.toFixed(1)}</td>
                <td style={{ padding: '10px 8px', color: u.risk_level === 'Critical' ? '#EF4444' : '#FB923C' }}>{u.risk_level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// Custom Dark Glass Recharts Tooltip
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3.5 py-2.5 border border-white/15 shadow-2xl text-xs rounded-xl backdrop-blur-xl">
        <p className="font-semibold text-white/90 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="flex items-center gap-2 text-white/80 font-mono">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span>{entry.name}:</span>
            <span className="font-bold text-white">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const reportRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [riskTrends, setRiskTrends] = useState([]);
  const [alertsDist, setAlertsDist] = useState([]);
  const [hourlyAct, setHourlyAct] = useState([]);
  const [riskyUsers, setRiskyUsers] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activityTimeframe, setActivityTimeframe] = useState('Weekly');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, trendsRes, alertsRes, hourlyRes, usersRes, liveAlertsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/risk-trends'),
          api.get('/dashboard/alerts-distribution'),
          api.get('/dashboard/hourly-activity'),
          api.get('/dashboard/top-risky-users'),
          api.get('/alerts?status=new')
        ]);
        setStats(statsRes.data);
        setRiskTrends(trendsRes.data);
        setAlertsDist(alertsRes.data);
        setHourlyAct(hourlyRes.data);
        setRiskyUsers(usersRes.data);
        setLiveAlerts(liveAlertsRes.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  const generatePDF = async () => {
    if (!reportRef.current || isGenerating) return;
    setIsGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 300));
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#0A0A0A',
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pdfW) / canvas.width;
      let offset = 0;
      let remaining = imgH;
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, offset === 0 ? 0 : -offset, pdfW, imgH, '', 'FAST');
        remaining -= pdfH;
        if (remaining > 0) {
          pdf.addPage();
          offset += pdfH;
        }
      }
      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`CypherX_Security_Intelligence_${dateStr}.pdf`);
    } catch (e) {
      console.error('PDF generation failed:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Compute highest risk score for centerpiece gauge
  const highestRiskScore = riskyUsers.length > 0 ? Math.round(riskyUsers[0].risk_score) : 85;
  const topRiskyUser = riskyUsers.length > 0 ? riskyUsers[0] : { username: 'eve.hacker', department: 'Contractor' };

  // Calculate donut total
  const totalSeverityCount = alertsDist.reduce((acc, curr) => acc + (curr.value || 0), 0) || (stats?.total_alerts ?? 4);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hidden printable report template */}
      <ReportTemplate
        ref={reportRef}
        stats={stats}
        riskTrends={riskTrends}
        alertsDist={alertsDist}
        hourlyAct={hourlyAct}
        riskyUsers={riskyUsers}
      />

      {/* Header Row: Title & Generate Report CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8B5CF6] flex items-center gap-1.5">
              <Sparkles size={13} /> Live Security Intelligence
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Security Overview
          </h1>
          <p className="text-sm text-white/50 mt-1">Real-time behavioral telemetry and anomaly classification</p>
        </div>

        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className="btn-primary px-6 py-3 text-xs font-semibold text-white flex items-center gap-2 shadow-glow-purple disabled:opacity-50"
        >
          {isGenerating ? (
            <><Loader2 size={16} className="animate-spin" /> Generating PDF...</>
          ) : (
            <><FileText size={16} /> Generate Report</>
          )}
        </button>
      </div>

      {/* ROW 1: 4 TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Active Alerts"
          value={stats?.total_alerts}
          subtext="Unresolved incidents"
          delta="+2 vs 24h"
          deltaColor="text-[#EF4444]"
          deltaBg="bg-[#EF4444]/10 border-[#EF4444]/30"
          icon={ShieldAlert}
        />
        <KpiCard
          title="High-Risk Users"
          value={stats?.high_risk_users}
          subtext="Anomaly score > 60"
          delta="Requires review"
          deltaColor="text-[#FB923C]"
          deltaBg="bg-[#FB923C]/10 border-[#FB923C]/30"
          icon={AlertTriangle}
        />
        <KpiCard
          title="Active Users (24h)"
          value={stats?.active_users}
          subtext="Total verified identities"
          delta="99.8% normal"
          deltaColor="text-[#22C55E]"
          deltaBg="bg-[#22C55E]/10 border-[#22C55E]/30"
          icon={Users}
        />
        <KpiCard
          title="Model Status"
          value="Online"
          subtext="ML scoring engine"
          delta="v2.4 active"
          deltaColor="text-[#8B5CF6]"
          deltaBg="bg-[#8B5CF6]/10 border-[#8B5CF6]/30"
          icon={CheckCircle2}
        />
      </div>

      {/* ROW 2: (2/3 + 1/3 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Overview (Bar Chart) */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Activity Overview</h2>
              <p className="text-xs text-white/50">Aggregated user events across system nodes</p>
            </div>
            
            {/* Weekly Dropdown Pill */}
            <div className="flex items-center gap-2">
              <div className="glass-pill px-3 py-1.5 text-xs text-white/80 font-medium flex items-center gap-1.5 cursor-pointer hover:border-white/20">
                <span>{activityTimeframe}</span>
                <ChevronDown size={14} className="text-white/50" />
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyAct.slice(0, 14)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barBlueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2F7BFF" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0B2A8F" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="barPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6D3AEA" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
                <XAxis 
                  dataKey="hour" 
                  stroke="rgba(255, 255, 255, 0.3)" 
                  tick={{ fill: 'rgba(255, 255, 255, 0.45)', fontSize: 11 }} 
                  tickFormatter={(val) => val ? val.split(':')[0] + 'h' : ''}
                />
                <YAxis 
                  stroke="rgba(255, 255, 255, 0.3)" 
                  tick={{ fill: 'rgba(255, 255, 255, 0.45)', fontSize: 11 }} 
                />
                <RechartsTooltip content={<CustomChartTooltip />} />
                <Bar 
                  dataKey="logins" 
                  name="Logins" 
                  fill="url(#barBlueGrad)" 
                  radius={[8, 8, 0, 0]} 
                />
                <Bar 
                  dataKey="file_access" 
                  name="File Access" 
                  fill="url(#barPurpleGrad)" 
                  radius={[8, 8, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-white/50 pt-4 border-t border-white/[0.07] mt-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#2F7BFF]" /> Logins</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#8B5CF6]" /> File Operations</span>
            </div>
            <span className="font-mono text-white/40">Real-time aggregate</span>
          </div>
        </div>

        {/* Threat Severity (Donut Chart) */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Threat Severity</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/60">30-day</span>
            </div>
            <p className="text-xs text-white/50 mb-4">Breakdown of flagged behavior tiers</p>
          </div>

          {/* Donut with centered count */}
          <div className="relative h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={alertsDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={88}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {alertsDist.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={SEVERITY_COLORS[entry.name] || '#8B5CF6'} 
                      stroke="rgba(0,0,0,0.5)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold font-mono text-white leading-none">
                {totalSeverityCount}
              </span>
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider mt-1">
                Alerts
              </span>
            </div>
          </div>

          {/* Right/Bottom Legend with percentages */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/[0.07]">
            {alertsDist.map((item) => {
              const pct = totalSeverityCount > 0 ? Math.round(((item.value || 0) / totalSeverityCount) * 100) : 0;
              const color = SEVERITY_COLORS[item.name] || '#8B5CF6';
              return (
                <div key={item.name} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white/[0.02]">
                  <span className="flex items-center gap-1.5 text-white/70">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {item.name}
                  </span>
                  <span className="font-mono font-semibold text-white">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROW 3: Risk Score Gauge Card, Hourly Area Chart, Top Risky Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Pink Gradient "Risk Score" Gauge Card */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-[#FF3D9A] via-[#FF54A8] to-[#FF7AC6] text-white shadow-glow-pink border border-white/25 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white/90">Critical Risk Gauge</span>
              <span className="px-2.5 py-0.5 rounded-full bg-black/25 text-white text-[10px] font-bold">ANOMALY</span>
            </div>
            <p className="text-xs text-white/80 font-light">Peak insider behavior index</p>
          </div>

          {/* Semicircle Gauge Visual */}
          <div className="my-4">
            <RiskGauge score={highestRiskScore} />
          </div>

          <div className="p-3.5 rounded-2xl bg-black/20 backdrop-blur-md border border-white/15">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-white">{topRiskyUser.username}</span>
              <span className="text-white/90">{topRiskyUser.department}</span>
            </div>
            <p className="text-[11px] text-white/80 mt-1">Exfiltration & suspicious night activity logged</p>
          </div>
        </div>

        {/* Card 2: Hourly Activity Area Chart */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-white tracking-tight">Hourly Network Trend</h2>
              <span className="text-xs text-[#22C55E] font-medium flex items-center gap-1">
                <Activity size={13} /> Active
              </span>
            </div>
            <p className="text-xs text-white/50 mb-4">7-day rolling network risk score</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255, 255, 255, 0.3)" 
                  tick={{ fill: 'rgba(255, 255, 255, 0.45)', fontSize: 10 }}
                  tickFormatter={(s) => s ? s.split('-').slice(1).join('/') : ''}
                />
                <YAxis 
                  stroke="rgba(255, 255, 255, 0.3)" 
                  tick={{ fill: 'rgba(255, 255, 255, 0.45)', fontSize: 10 }}
                />
                <RechartsTooltip content={<CustomChartTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="avg_risk" 
                  name="Average Risk" 
                  stroke="#8B5CF6" 
                  strokeWidth={2.5} 
                  fill="url(#areaPurpleGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between items-center text-xs text-white/40 pt-3 border-t border-white/[0.07]">
            <span>Average Score: ~32.4</span>
            <span className="text-[#8B5CF6]">Stable baseline</span>
          </div>
        </div>

        {/* Card 3: Top Risky Users List */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-white tracking-tight">Top Risky Users</h2>
              <button 
                onClick={() => {
                  if (riskyUsers[0]) navigate(`/users/${riskyUsers[0].user_id}`);
                }}
                className="text-xs text-[#8B5CF6] hover:text-[#FF7AC6] font-semibold flex items-center gap-1 transition-colors"
              >
                Inspect <ArrowRight size={13} />
              </button>
            </div>
            <p className="text-xs text-white/50 mb-4">Ranked by behavioral anomaly engine</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-56 pr-1">
            {riskyUsers.map((user, i) => {
              const isCritical = user.risk_level === 'Critical';
              const isHigh = user.risk_level === 'High';
              return (
                <div 
                  key={user.user_id} 
                  onClick={() => navigate(`/users/${user.user_id}`)}
                  className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-white/20 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2F7BFF] to-[#8B5CF6] flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-[#8B5CF6] transition-colors">
                        {user.username}
                      </div>
                      <div className="text-[11px] text-white/50">{user.department}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isCritical ? 'badge-critical' : isHigh ? 'badge-high' : 'badge-low'
                    }`}>
                      {user.risk_score?.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-white/40 pt-3 border-t border-white/[0.07] flex justify-between items-center">
            <span>Auto-evaluated daily</span>
            <span className="text-[#22C55E]">ML Active</span>
          </div>
        </div>

      </div>

      {/* ROW 4: LIVE ALERTS FEED TABLE */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldAlert size={20} className="text-[#EF4444]" />
              Live Threat Feed
            </h2>
            <p className="text-xs text-white/50">Recent behavioral triggers requiring immediate triage</p>
          </div>
          <button
            onClick={() => navigate('/alerts')}
            className="btn-secondary px-4 py-2 text-xs text-white/90 flex items-center gap-1.5"
          >
            <span>View All Alerts</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">Timestamp</th>
                <th className="py-3 px-4 font-medium">Subject</th>
                <th className="py-3 px-4 font-medium">Severity</th>
                <th className="py-3 px-4 font-medium">Trigger Description</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {liveAlerts.slice(0, 5).map((alert) => {
                const isCrit = alert.severity === 'Critical';
                return (
                  <tr 
                    key={alert.id}
                    className={`hover:bg-white/[0.04] transition-all group ${
                      isCrit ? 'hover:shadow-glow-critical' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-white/60 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-white/40" />
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      User #{alert.user_id}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5 ${
                        alert.severity === 'Critical' ? 'badge-critical' :
                        alert.severity === 'High' ? 'badge-high' :
                        alert.severity === 'Medium' ? 'badge-medium' :
                        'badge-low'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/80 max-w-md truncate">
                      {alert.description}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/users/${alert.user_id}`)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white transition-colors"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
