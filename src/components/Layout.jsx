import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Bell, Shield, ShieldAlert, Users, 
  BarChart3, Settings, LogOut, ArrowUp, Search, User as UserIcon, CheckCircle2
} from 'lucide-react';
import api from '../services/api';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [userProfile, setUserProfile] = useState({ username: 'alice.smith', role: 'Security Admin' });
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Fetch user and alerts status for top bar
    api.get('/auth/me')
      .then(res => {
        if (res.data) setUserProfile(res.data);
      })
      .catch(() => {});

    api.get('/alerts?status=new')
      .then(res => {
        if (Array.isArray(res.data)) {
          setActiveAlertsCount(res.data.length);
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'alerts', label: 'Alerts', icon: ShieldAlert, path: '/alerts', badge: activeAlertsCount > 0 ? activeAlertsCount : null },
    { id: 'users', label: 'Users', icon: Users, path: '/users/5' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/' },
    { id: 'settings', label: 'Settings', icon: Settings, action: () => setSettingsModalOpen(true) },
  ];

  const isNavActive = (item) => {
    if (item.id === 'dashboard') return location.pathname === '/';
    if (item.id === 'alerts') return location.pathname.startsWith('/alerts');
    if (item.id === 'users') return location.pathname.startsWith('/users');
    if (item.id === 'analytics') return false;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans relative dot-matrix">
      {/* Ambient background glows */}
      <div className="ambient-glow" />
      <div className="ambient-glow-bottom" />

      {/* Slim Top Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#0A0A0A]/70 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Zone */}
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6D3AEA] to-[#8B5CF6] flex items-center justify-center shadow-glow-purple group-hover:scale-105 transition-transform">
              <Shield size={20} className="text-white" />
            </div>
            <div className="text-xl font-bold tracking-tight text-white flex items-center">
              CYPHER<span className="text-[#8B5CF6]">X</span>
            </div>
          </div>

          {/* Search Input Zone */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users, IPs, threat levels..."
                className="w-full pl-11 pr-4 py-2 bg-white/[0.04] border border-white/10 hover:border-white/20 focus:border-[#8B5CF6] rounded-full text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] transition-all"
              />
            </div>
          </div>

          {/* Actions & User Zone */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Bell */}
            <button
              onClick={() => navigate('/alerts')}
              aria-label="View Alerts"
              className="relative p-2.5 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] transition-colors"
            >
              <Bell size={18} className="text-white/80" />
              {activeAlertsCount > 0 ? (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]" />
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#22C55E]" />
              )}
            </button>

            {/* User Profile Pill / Menu */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#2F7BFF] to-[#8B5CF6] flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {userProfile.username ? userProfile.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-medium text-white/90 hidden sm:inline-block max-w-[100px] truncate">
                  {userProfile.username || 'Operator'}
                </span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-card p-2 border border-white/10 shadow-2xl z-50">
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-sm font-semibold text-white">{userProfile.username}</p>
                    <p className="text-xs text-white/50">{userProfile.email || 'operator@cypherx.internal'}</p>
                  </div>
                  <button
                    onClick={() => { setUserDropdownOpen(false); navigate('/users/5'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl text-xs text-white/80 hover:bg-white/[0.08] transition-colors"
                  >
                    <UserIcon size={14} /> Profile & Inspector
                  </button>
                  <button
                    onClick={() => { setUserDropdownOpen(false); setSettingsModalOpen(true); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/80 hover:bg-white/[0.08] transition-colors"
                  >
                    <Settings size={14} /> System Settings
                  </button>
                  <div className="my-1 border-t border-white/10" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-32">
        {children}
      </main>

      {/* FLOATING BOTTOM DOCK NAVIGATION */}
      <nav 
        aria-label="Main Dock"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1.5 rounded-full bg-black/85 backdrop-blur-2xl border border-white/15 sm:border-emerald-500/25 shadow-dock"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(item);

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) item.action();
                else if (item.path) navigate(item.path);
              }}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-[#6D3AEA] to-[#8B5CF6] text-white shadow-glow-purple scale-105'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Icon size={17} />
              <span className="hidden sm:inline-block">{item.label}</span>
              {item.badge && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#EF4444] text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Back to Top Pill Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          aria-label="Back to Top"
          className="fixed bottom-6 left-6 z-40 hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/75 backdrop-blur-xl border border-white/15 hover:border-white/30 text-white/80 hover:text-white text-xs font-medium shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <ArrowUp size={14} className="text-[#8B5CF6]" />
          <span>Top</span>
        </button>
      )}

      {/* Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card w-full max-w-md p-6 border border-white/15 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6]">
                  <Settings size={18} />
                </div>
                <h3 className="text-base font-bold text-white">System Settings</h3>
              </div>
              <button 
                onClick={() => setSettingsModalOpen(false)}
                className="text-white/40 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 text-xs text-white/80">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex justify-between items-center">
                <span>Model Engine:</span>
                <span className="font-semibold text-[#22C55E] flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Active & Scoring
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex justify-between items-center">
                <span>Scoring Baseline:</span>
                <span className="font-semibold text-white/90">7-Day Behavioral Rolling Average</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex justify-between items-center">
                <span>Anomaly Sensitivity:</span>
                <span className="font-semibold text-[#8B5CF6]">High (Threshold 60)</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="btn-primary px-5 py-2 text-xs text-white font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
