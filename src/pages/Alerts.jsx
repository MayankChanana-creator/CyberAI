import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  ShieldAlert, CheckCircle2, Clock, Search, 
  Filter, Eye, ArrowRight, ShieldCheck, AlertTriangle 
} from 'lucide-react';

const SEVERITY_ACCENT_COLORS = {
  Critical: '#EF4444',
  High: '#FB923C',
  Medium: '#FACC15',
  Low: '#22C55E',
};

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlerts();
  }, [activeFilter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = { status: 'new' };
      if (activeFilter !== 'All') {
        params.severity = activeFilter;
      }
      const response = await api.get('/alerts', { params });
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.put(`/alerts/${id}/resolve`);
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      String(alert.user_id).includes(term) ||
      (alert.description && alert.description.toLowerCase().includes(term)) ||
      (alert.severity && alert.severity.toLowerCase().includes(term))
    );
  });

  const filterChips = ['All', 'Critical', 'High', 'Medium', 'Low'];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#EF4444] flex items-center gap-1.5">
              <ShieldAlert size={14} /> Security Incident Triage
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Active Security Alerts
          </h1>
          <p className="text-sm text-white/50 mt-1">Real-time alerts triggered by insider behavioral heuristics</p>
        </div>

        {/* Count summary badge */}
        <div className="glass-pill px-4 py-2 flex items-center gap-2 text-xs font-semibold text-white/80">
          <span className="w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]" />
          <span>{filteredAlerts.length} Unresolved Incidents</span>
        </div>
      </div>

      {/* Filter Bar: Pill Chips + Search Pill */}
      <div className="glass-card p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Severity Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {filterChips.map((chip) => {
            const isActive = activeFilter === chip;
            return (
              <button
                key={chip}
                onClick={() => setActiveFilter(chip)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#6D3AEA] to-[#8B5CF6] text-white shadow-glow-purple'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>

        {/* Search Pill */}
        <div className="relative min-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by user or description..."
            className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/10 hover:border-white/20 focus:border-[#8B5CF6] rounded-full text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] transition-all"
          />
        </div>
      </div>

      {/* Glass Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6 font-medium">Incident Time</th>
                <th className="py-4 px-6 font-medium">Subject</th>
                <th className="py-4 px-6 font-medium">Severity</th>
                <th className="py-4 px-6 font-medium">Trigger Description</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredAlerts.map((alert) => {
                const accentColor = SEVERITY_ACCENT_COLORS[alert.severity] || '#8B5CF6';
                const isCrit = alert.severity === 'Critical';

                return (
                  <tr
                    key={alert.id}
                    className={`hover:bg-white/[0.06] transition-all duration-200 group relative ${
                      isCrit ? 'hover:shadow-glow-critical' : ''
                    }`}
                  >
                    {/* Timestamp */}
                    <td className="py-4 px-6 text-white/70 font-mono whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-white/40" />
                        <span>{new Date(alert.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </td>

                    {/* Subject User */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#2F7BFF] to-[#8B5CF6] flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
                          {alert.user_id}
                        </div>
                        <span className="font-semibold text-white">User #{alert.user_id}</span>
                      </div>
                    </td>

                    {/* Severity Pill */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5 ${
                        alert.severity === 'Critical' ? 'badge-critical' :
                        alert.severity === 'High' ? 'badge-high' :
                        alert.severity === 'Medium' ? 'badge-medium' :
                        'badge-low'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {alert.severity}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-4 px-6 text-white/80 max-w-md font-sans">
                      <p className="line-clamp-2 leading-relaxed">{alert.description}</p>
                    </td>

                    {/* Actions: View / Resolve */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/users/${alert.user_id}`)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white transition-all flex items-center gap-1.5"
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={() => handleResolve(alert.id)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] border border-[#22C55E]/30 transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={13} /> Resolve
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-16 px-6 text-center text-white/50">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-16 h-16 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center mb-4 text-[#22C55E] shadow-[0_0_25px_rgba(34,197,94,0.3)]">
                        <ShieldCheck size={32} />
                      </div>
                      <p className="text-base font-bold text-white mb-1">No Active Incidents</p>
                      <p className="text-xs text-white/50">All detected security behavioral flags have been resolved or filtered.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
