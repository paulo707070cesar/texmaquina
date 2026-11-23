import React, { useEffect, useState } from 'react';
import { leadsApi, Lead, settingsApi } from '../services/api';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  CalendarDays,
  ListTodo,
  BookOpen,
  Layers, 
  Kanban, 
  Users, 
  LogOut, 
  Bell, 
  ShieldCheck, 
  UserCheck,
  Sparkles,
  ArrowRight,
  Settings,
  Menu,
  X
} from 'lucide-react';

import { PWAInstallButton } from './PWAInstallButton';
import { ThemeToggle } from './ThemeToggle';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
    <header className="sticky top-0 z-[100] bg-[#090E1A]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)] md:fixed md:inset-y-0 md:left-0 md:right-auto md:w-64 md:h-screen md:overflow-y-auto md:border-b-0 md:border-r">
      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 md:px-4 md:h-full">
        <div className="flex items-center justify-between h-16 md:h-full md:flex-col md:items-stretch md:justify-start">
          {/* Brand Logo matching BizNext polygon icon style */}
          <div className="flex items-center gap-2 sm:gap-6 min-w-0 flex-1 md:flex-col md:items-stretch md:gap-0 md:flex-none">
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
                  <span className="font-display font-black text-base sm:text-lg tracking-tight text-white group-hover:text-[#00C2FF] transition-colors truncate max-w-[38vw] sm:max-w-none">
                    {brand.name}
                  </span>
                  <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#0066FF]/20 border border-[#00C2FF]/40 text-[#00C2FF] shadow-[0_0_10px_rgba(0,194,255,0.2)]">
                    Enterprise
                  </span>
                </div>
                <span className="hidden sm:block text-[10px] font-semibold text-gray-400 tracking-wider uppercase">
                  Textile Machinery OS
                </span>
              </div>
            </NavLink>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex md:flex-col md:items-stretch gap-1 md:space-x-0 md:pl-0 md:pt-4 md:mt-4 md:border-l-0 md:border-t md:border-white/10">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 text-left ${
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
                  `w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 text-left ${
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
                  `w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 text-left ${
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
                  `w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 text-left ${
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
                to="/agenda"
                className={({ isActive }) =>
                  `w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 text-left ${isActive
                    ? 'bg-gradient-to-r from-[#0066FF] to-[#00C2FF] text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/[0.06]'}`
                }
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </NavLink>

              <NavLink
                to="/tarefas"
                className={({ isActive }) =>
                  `w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 text-left ${isActive
                    ? 'bg-gradient-to-r from-[#0066FF] to-[#00C2FF] text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/[0.06]'}`
                }
              >
                <ListTodo className="w-3.5 h-3.5" />
                <span>Tarefas & Metas</span>
              </NavLink>

              <NavLink
                to="/biblia"
                className={({ isActive }) =>
                  `w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 text-left ${isActive
                    ? 'bg-gradient-to-r from-[#0066FF] to-[#00C2FF] text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/[0.06]'}`
                }
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Bíblia & Devocional</span>
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 text-left ${
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
          <div className="flex items-center gap-1 sm:gap-3 shrink-0 md:flex-col md:items-stretch md:gap-3 md:mt-auto md:py-4">
            <button onClick={() => setShowMobileMenu(true)} aria-label="Abrir menu" className="md:hidden p-2 rounded-xl text-[#00C2FF] border border-white/10 hover:bg-white/10"><Menu className="w-5 h-5" /></button>
            <div className="hidden md:flex items-center justify-between gap-3 md:rounded-xl md:bg-white/[0.04] md:px-3 md:py-2"><span className="text-xs text-gray-300 md:hidden">Tema</span><ThemeToggle />
            <PWAInstallButton /></div>

            {/* Follow-up notifications from real leads */}
            <div className="relative hidden md:block md:w-full">
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
              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-white/10 md:border-l-0 md:border-t md:pt-3">
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
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
          <aside className="absolute left-0 top-0 bottom-0 h-[100dvh] w-[min(19rem,85vw)] overflow-y-auto bg-[#0B1322] border-r border-white/10 shadow-2xl p-5 flex flex-col" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <div className="font-display font-extrabold text-white text-lg">{brand.name}<p className="text-[10px] text-gray-400 tracking-wider uppercase mt-1">Menu principal</p></div>
              <button onClick={() => setShowMobileMenu(false)} aria-label="Fechar menu" className="p-2 rounded-xl text-gray-300 hover:bg-white/10"><X className="w-5 h-5" /></button>
            </div>
            <nav className="flex flex-col gap-2 py-5">
              {[
                {to:"/",label:"Dashboard",Icon:LayoutDashboard},
                {to:"/machines",label:"Estoque",Icon:Layers},
                {to:"/pipeline",label:"Funil (Kanban)",Icon:Kanban},
                {to:"/leads",label:"Clientes & Leads",Icon:Users},
                {to:"/agenda",label:"Agenda",Icon:CalendarDays},
                {to:"/tarefas",label:"Tarefas & Metas",Icon:ListTodo},\n                {to:"/biblia",label:"Bíblia & Devocional",Icon:BookOpen},
                {to:"/settings",label:"Configurações",Icon:Settings},
              ].map(({to,label,Icon}) => (
                <NavLink key={to} to={to} end={to==="/"} onClick={() => setShowMobileMenu(false)} className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${isActive ? "bg-gradient-to-r from-[#0066FF] to-[#00C2FF] text-white" : "text-gray-300 hover:bg-white/[0.06]"}`}>
                  <Icon className="w-5 h-5" />{label}
                </NavLink>
              ))}
            </nav>
            <div className="space-y-2 border-t border-white/10 pt-4">
              <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">Ações e preferências</p>
              <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2.5"><span className="text-sm font-semibold text-gray-200">Tema</span><ThemeToggle /></div>
              <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2.5"><span className="text-sm font-semibold text-gray-200">Instalar aplicativo</span><PWAInstallButton /></div>
              <button onClick={() => setShowNotifications(!showNotifications)} className="w-full flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-3 text-sm font-semibold text-gray-200 hover:bg-white/[0.08]"><span className="flex items-center gap-3"><Bell className="w-5 h-5 text-[#00C2FF]"/>Acompanhamentos</span><span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-black text-[#090E1A]">{followUps.length}</span></button>
              {showNotifications && <div className="rounded-xl border border-white/10 bg-[#060B14] p-3 max-h-48 overflow-y-auto">{notificationsLoading ? <p className="text-xs text-gray-400">Carregando...</p> : followUps.length === 0 ? <p className="text-xs text-gray-400">Nenhum acompanhamento vencido ou para hoje.</p> : followUps.slice(0,6).map((lead) => <div key={lead.id} className="py-2 border-b border-white/5 last:border-0"><p className="text-xs font-semibold text-white">{lead.client_name}</p><p className="text-[10px] text-gray-400">{lead.follow_up_date ? formatFollowUpDate(lead.follow_up_date) : ''} · {lead.client_phone}</p></div>)}<button onClick={() => {setShowMobileMenu(false); setShowNotifications(false); navigate('/leads');}} className="mt-2 w-full rounded-lg bg-blue-600/20 py-2 text-xs font-bold text-[#00C2FF]">Abrir clientes</button></div>}
              {user && <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2.5"><div className="min-w-0"><p className="text-sm font-bold text-white truncate">{user.name}</p><p className="text-[10px] text-gray-400 truncate">{user.tenant_name}</p></div><button onClick={() => {setShowMobileMenu(false); handleLogout();}} aria-label="Sair" className="p-2 rounded-lg text-red-300 hover:bg-red-500/10"><LogOut className="w-5 h-5"/></button></div>}
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-gray-500">TexMachina · Menu mobile</div>
          </aside>
        </div>
      )}
    </header>
  );
};
