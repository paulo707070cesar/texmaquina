import React, { useEffect, useState } from 'react';
import { leadsApi, Lead, settingsApi } from '../services/api';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Layers, 
  Kanban, 
  Users, 
  LogOut, 
  Bell, 
  ShieldCheck, 
  UserCheck,
  Sparkles,
  ArrowRight,
  Settings
} from 'lucide-react';

import { PWAInstallButton } from './PWAInstallButton';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [followUps, setFollowUps] = useState<Lead[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [brand, setBrand] = useState<{ name: string; logo: string | null }>({
    name: user?.tenant_name || 'TexMachina',
    logo: user?.tenant_logo || null,
  });

  useEffect(() => {
    let active = true;
    settingsApi.get().then((tenant) => {
      if (!active) return;
      const next = {
        name: tenant.name || user?.tenant_name || 'TexMachina',
        logo: tenant.logo_url || user?.tenant_logo || null,
      };
      setBrand(next);
      const saved = localStorage.getItem('texmachina_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          parsed.tenant_name = next.name;
          parsed.tenant_logo = next.logo;
          localStorage.setItem('texmachina_user', JSON.stringify(parsed));
        } catch { /* Ignore malformed cached profile. */ }
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [user?.tenant_name, user?.tenant_logo]);

  useEffect(() => {
    let active = true;
    const loadFollowUps = async () => {
      try {
        setNotificationsLoading(true);
        const leads = await leadsApi.list();
        if (!active) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = leads
          .filter((lead) => lead.status !== 'fechado' && lead.follow_up_date)
          .filter((lead) => {
            const date = new Date(String(lead.follow_up_date).slice(0, 10) + 'T00:00:00');
            return !Number.isNaN(date.getTime()) && date <= today;
          })
          .sort((a, b) => (a.follow_up_date || '').localeCompare(b.follow_up_date || ''));
        setFollowUps(due);
      } catch (error) {
        console.error('Não foi possível carregar os follow-ups:', error);
      } finally {
        if (active) setNotificationsLoading(false);
      }
    };
    loadFollowUps();
    return () => { active = false; };
  }, []);

  const formatFollowUpDate = (value: string) => {
    const date = new Date(value.slice(0, 10) + 'T00:00:00');
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#090E1A]/85 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo matching BizNext polygon icon style */}
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#00C2FF] flex items-center justify-center text-white shadow-[0_0_20px_rgba(0,102,255,0.5)] group-hover:shadow-[0_0_28px_rgba(0,194,255,0.8)] transition-all overflow-hidden">
                {brand.logo ? (
                  <img src={brand.logo || undefined} alt={brand.name + " logo"} className="w-full h-full object-contain" />
                ) : (
                  <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
                )}
                {!user?.tenant_logo && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-lg tracking-tight text-white group-hover:text-[#00C2FF] transition-colors">
                    {brand.name}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#0066FF]/20 border border-[#00C2FF]/40 text-[#00C2FF] shadow-[0_0_10px_rgba(0,194,255,0.2)]">
                    Enterprise
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">
                  Textile Machinery OS
                </span>
              </div>
            </NavLink>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-white/10">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0066FF] to-[#00C2FF] text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]'
                      : 'text-gray-300 hover:text-white hover:bg-white/[0.06]'
                  }`
                }
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/machines"
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0066FF] to-[#00C2FF] text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]'
                      : 'text-gray-300 hover:text-white hover:bg-white/[0.06]'
                  }`
                }
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Estoque</span>
              </NavLink>

              <NavLink
                to="/pipeline"
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0066FF] to-[#00C2FF] text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]'
                      : 'text-gray-300 hover:text-white hover:bg-white/[0.06]'
                  }`
                }
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Funil (Kanban)</span>
              </NavLink>

              <NavLink
                to="/leads"
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0066FF] to-[#00C2FF] text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]'
                      : 'text-gray-300 hover:text-white hover:bg-white/[0.06]'
                  }`
                }
              >
                <Users className="w-3.5 h-3.5" />
                <span>Clientes & Leads</span>
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0066FF] to-[#00C2FF] text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]'
                      : 'text-gray-300 hover:text-white hover:bg-white/[0.06]'
                  }`
                }
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configurações</span>
              </NavLink>
            </nav>
          </div>

          {/* Right Action Icons & User Info */}
          <div className="flex items-center gap-3">
            <PWAInstallButton />

            {/* Follow-up notifications from real leads */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors border border-white/5"
                aria-label={`Acompanhamentos pendentes: ${followUps.length}`}
                aria-expanded={showNotifications}
              >
                <Bell className="w-4 h-4" />
                {followUps.length > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-[#090E1A] text-[9px] font-black flex items-center justify-center">{followUps.length > 99 ? "99+" : followUps.length}</span>}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-[min(20rem,calc(100vw-2rem))] bg-[#0E1626]/95 backdrop-blur-2xl rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] border border-white/10 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                    <span className="font-display font-bold text-xs text-white">Acompanhamentos vencidos</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30">{followUps.length}</span>
                  </div>
                  {notificationsLoading ? (
                    <p className="py-5 text-xs text-gray-400 text-center">Carregando acompanhamentos...</p>
                  ) : followUps.length === 0 ? (
                    <div className="py-6 text-center">
                      <Bell className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-white">Tudo em dia!</p>
                      <p className="text-[11px] text-gray-400 mt-1">Não há follow-ups vencidos ou para hoje.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5 text-xs py-1 max-h-72 overflow-y-auto">
                      {followUps.slice(0, 8).map((lead) => {
                        const dateText = (lead.follow_up_date || "").slice(0, 10);
                        const isOverdue = dateText < new Date().toISOString().slice(0, 10);
                        return <div key={lead.id} className="py-3">
                          <p className="font-semibold text-white truncate">{lead.client_name}</p>
                          <p className="text-gray-400 text-[11px] mt-0.5 truncate">{lead.machine_name || "Interesse em máquina"} · {lead.client_phone}</p>
                          <span className={isOverdue ? "text-[10px] font-medium text-red-300" : "text-[10px] font-medium text-amber-300"}>{isOverdue ? "Vencido" : "Para hoje"} · {formatFollowUpDate(dateText)}</span>
                        </div>;
                      })}
                      {followUps.length > 8 && <p className="pt-3 text-center text-[10px] text-gray-400">E mais {followUps.length - 8} acompanhamento(s).</p>}
                    </div>
                  )}
                  <button onClick={() => { setShowNotifications(false); navigate("/leads"); }} className="w-full mt-3 py-2.5 rounded-xl bg-[#0066FF]/20 hover:bg-[#0066FF]/30 border border-[#00C2FF]/20 text-[#00C2FF] text-xs font-bold transition-colors">Abrir clientes e leads</button>
                </div>
              )}
            </div>
            {/* User Profile Pill */}
            {user && (
              <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                <div className="flex flex-col items-end text-right hidden sm:flex">
                  <span className="text-xs font-bold text-white truncate max-w-[140px]">
                    {user.name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#00C2FF]">
                    <span className="material-symbols-outlined text-[10px]">corporate_fare</span>
                    <span>{user.tenant_name}</span>
                  </span>
                </div>

                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00C2FF] text-white flex items-center justify-center font-bold text-xs shadow-[0_0_15px_rgba(0,102,255,0.4)] border border-white/20">
                  {user.name.charAt(0)}
                </div>

                <button
                  onClick={handleLogout}
                  title="Sair do sistema"
                  className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-white/[0.06] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
