import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Shield, Lock, Sparkles, ArrowRight, User as UserIcon, 
  ChevronRight, AlertTriangle, Activity, CheckCircle2 
} from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('alice.smith');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/auth/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      localStorage.setItem('token', response.data.access_token);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoUser = 'alice.smith') => {
    setUsername(demoUser);
    setPassword('password123');
    const formElement = document.getElementById('login-card');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050B24] text-white font-sans relative overflow-x-hidden selection:bg-[#8B5CF6] selection:text-white">
      {/* Background Gradient & Dot Matrix Texture */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050B24] via-[#0B2A8F]/40 to-[#0A0A0A] pointer-events-none" />
      <div className="absolute inset-0 dot-matrix pointer-events-none opacity-40" />

      {/* Ambient Radial Highlights */}
      <div className="ambient-glow" />

      {/* Floating Pill Nav */}
      <div className="relative z-30 pt-6 px-4 max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6D3AEA] to-[#8B5CF6] flex items-center justify-center shadow-glow-purple">
            <Shield size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            CYPHER<span className="text-[#8B5CF6]">X</span>
          </span>
        </div>

        {/* Center Pill Menu */}
        <nav className="hidden md:flex items-center gap-1 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-xl text-xs font-medium text-white/70 shadow-lg">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-white/[0.08] transition-colors">Home</button>
          <button onClick={() => handleQuickDemo('alice.smith')} className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-white/[0.08] transition-colors">Platform</button>
          <button onClick={() => handleQuickDemo('eve.hacker')} className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-white/[0.08] transition-colors">Solutions</button>
          <button onClick={() => handleQuickDemo('bob.jones')} className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-white/[0.08] transition-colors">Resources</button>
        </nav>

        {/* Right CTA */}
        <button
          onClick={() => handleQuickDemo('admin')}
          className="btn-secondary px-5 py-2 text-xs font-semibold text-white/90 shadow-sm"
        >
          Request Demo
        </button>
      </div>

      {/* HERO SECTION */}
      <section className="relative z-20 pt-16 md:pt-24 pb-16 px-4 text-center max-w-5xl mx-auto">
        {/* Small Eyebrow Row */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/12 backdrop-blur-md text-xs font-medium text-white/80 mb-8 shadow-sm">
          <span>Threat Intelligence</span>
          <span className="text-white/40">→</span>
          <span className="text-[#8B5CF6]">Insider Risk</span>
          <span className="text-white/40">→</span>
          <span className="text-[#FF3D9A]">Behavior Analytics</span>
        </div>

        {/* Huge Headline with floating glossy icon badges */}
        <div className="relative mb-6">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-normal lg:font-light tracking-tight text-white leading-[1.08] max-w-4xl mx-auto">
            Insider Threat Detection{' '}
            <span className="relative inline-block font-medium">
              Without
              {/* Glossy Pink Lock Badge */}
              <span className="absolute -top-6 -left-6 sm:-top-8 sm:-left-8 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#FF3D9A] to-[#FF7AC6] p-0.5 shadow-glow-pink flex items-center justify-center transform -rotate-12 hover:rotate-0 transition-transform">
                <span className="w-full h-full rounded-[14px] bg-black/20 flex items-center justify-center backdrop-blur-sm">
                  <Lock size={18} className="text-white drop-shadow" />
                </span>
              </span>
            </span>{' '}
            Complexity
            {/* Glossy Blue Sparkle Badge */}
            <span className="inline-block relative ml-2 align-middle">
              <span className="inline-flex w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#0B2A8F] to-[#2F7BFF] p-0.5 shadow-glow-blue items-center justify-center transform rotate-12 hover:rotate-0 transition-transform">
                <span className="w-full h-full rounded-[14px] bg-black/20 flex items-center justify-center backdrop-blur-sm">
                  <Sparkles size={18} className="text-white drop-shadow" />
                </span>
              </span>
            </span>
          </h1>
        </div>

        {/* Subtext */}
        <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Monitor user behavior, detect anomalies with ML, and stop data theft before damage is done.
        </p>

        {/* Two Pill Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <button
            onClick={() => handleQuickDemo('alice.smith')}
            className="btn-accent px-8 py-3.5 text-sm font-semibold text-white shadow-glow-pink flex items-center gap-2 group"
          >
            <span>Start Monitoring</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => handleQuickDemo('admin')}
            className="btn-secondary px-8 py-3.5 text-sm font-semibold text-white/90"
          >
            Request Demo
          </button>
        </div>

        {/* 3 Tilted Perspective Preview Cards */}
        <div className="relative max-w-4xl mx-auto pt-6 pb-12 perspective-[1000px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Card 1: Alerts by Severity (Horizontal Bars) */}
            <div className="glass-card p-6 border border-white/12 shadow-2xl md:transform md:-rotate-y-6 md:rotate-x-3 hover:transform-none transition-all duration-300 text-left">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Alerts by Severity</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">Real-time</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#EF4444] font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" /> Critical
                    </span>
                    <span className="text-white/80 font-mono">1</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#EF4444] rounded-full w-[25%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#FB923C] font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FB923C]" /> High
                    </span>
                    <span className="text-white/80 font-mono">1</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FB923C] rounded-full w-[25%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#FACC15] font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15]" /> Medium
                    </span>
                    <span className="text-white/80 font-mono">1</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FACC15] rounded-full w-[25%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#22C55E] font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> Low
                    </span>
                    <span className="text-white/80 font-mono">1</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#22C55E] rounded-full w-[25%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Centerpiece Pink Gradient "Risk Score" Gauge Card showing 85 */}
            <div className="rounded-3xl p-6 bg-gradient-to-br from-[#FF3D9A] via-[#FF54A8] to-[#FF7AC6] text-white shadow-glow-pink border border-white/25 md:transform md:scale-105 z-10 hover:scale-110 transition-all duration-300 text-center">
              <div className="flex items-center justify-between mb-3 text-xs font-semibold text-white/90">
                <span>Misconfiguration & Risk</span>
                <span className="px-2 py-0.5 rounded-full bg-black/20 text-white text-[10px]">CRITICAL</span>
              </div>
              
              {/* Semi-circle Gauge Visual */}
              <div className="relative w-36 h-20 mx-auto my-2 overflow-hidden flex items-end justify-center">
                <div className="absolute top-0 w-36 h-36 rounded-full border-8 border-white/20 border-t-white border-r-white transform -rotate-45" />
                <div className="text-4xl font-extrabold tracking-tight font-mono text-white">85</div>
              </div>
              
              <div className="text-xs font-semibold text-white mt-1">High-Risk Anomaly Detected</div>
              <p className="text-[11px] text-white/80 mt-0.5 font-light">eve.hacker • 14.2 GB USB Exfil</p>
            </div>

            {/* Card 3: Open vs Resolved (Line Chart Preview) */}
            <div className="glass-card p-6 border border-white/12 shadow-2xl md:transform md:rotate-y-6 md:rotate-x-3 hover:transform-none transition-all duration-300 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Open vs Resolved</span>
                <span className="text-xs text-[#22C55E] font-medium">+94% fixed</span>
              </div>
              {/* Mini SVG Trend Curve */}
              <div className="h-24 w-full flex items-end pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 45">
                  <defs>
                    <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,38 Q25,30 50,20 T100,6" fill="none" stroke="#8B5CF6" strokeWidth="2.5" />
                  <path d="M0,40 Q25,36 50,30 T100,28" fill="none" stroke="#2F7BFF" strokeWidth="2" strokeDasharray="3 3" />
                  <circle cx="100" cy="6" r="3" fill="#8B5CF6" />
                </svg>
              </div>
              <div className="flex justify-between items-center text-[11px] text-white/50 pt-2 border-t border-white/10 mt-2">
                <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-[#8B5CF6]" /> Resolved</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-[#2F7BFF]" /> Open</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* LOGIN CARD SECTION */}
      <section id="login-card" className="relative z-20 pb-28 px-4 max-w-md mx-auto">
        <div className="glass-card p-8 border border-white/12 shadow-2xl relative">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6D3AEA] to-[#8B5CF6] flex items-center justify-center mx-auto mb-3 shadow-glow-purple">
              <Shield size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Sign In to CypherX</h2>
            <p className="text-xs text-white/50 mt-1">AI-Powered User Behavior Analytics</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Underline Style Input: Username */}
            <div className="relative group">
              <label className="block text-xs font-medium text-white/60 mb-1 transition-colors group-focus-within:text-[#8B5CF6]">
                Username or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 focus:border-[#8B5CF6] py-2.5 text-sm text-white placeholder-white/30 focus:outline-none transition-colors"
                  placeholder="e.g. alice.smith or admin"
                  required
                />
              </div>
            </div>

            {/* Underline Style Input: Password */}
            <div className="relative group">
              <label className="block text-xs font-medium text-white/60 mb-1 transition-colors group-focus-within:text-[#8B5CF6]">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 focus:border-[#8B5CF6] py-2.5 text-sm text-white placeholder-white/30 focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Quick Demo Switcher helper */}
            <div className="pt-1">
              <p className="text-[11px] text-white/40 mb-2">Select quick demo account:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'alice.smith', role: 'Nominal' },
                  { name: 'bob.jones', role: 'Medium Risk' },
                  { name: 'eve.hacker', role: 'Critical Risk' },
                  { name: 'admin', role: 'Admin' },
                ].map((u) => (
                  <button
                    key={u.name}
                    type="button"
                    onClick={() => { setUsername(u.name); setPassword('password123'); }}
                    className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                      username === u.name
                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-white font-medium'
                        : 'bg-white/[0.04] border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {u.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Purple Gradient "Sign In →" Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-sm text-white font-semibold flex items-center justify-center gap-2 shadow-glow-purple disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </section>

      {/* Footer text */}
      <footer className="relative z-20 pb-12 text-center text-xs text-white/40 border-t border-white/5 pt-8">
        <p>CypherX Security Intelligence Platform • AI-Powered Behavior Analytics</p>
      </footer>
    </div>
  );
};

export default Login;
