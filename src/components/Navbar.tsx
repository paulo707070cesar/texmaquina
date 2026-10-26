import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';

import { PWAInstallButton } from './PWAInstallButton';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

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
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#00C2FF] flex items-center justify-center text-white shadow-[0_0_20px_rgba(0,102,255,0.5)] group-hover:shadow-[0_0_28px_rgba(0,194,255,0.8)] transition-all">
                <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-lg tracking-tight text-white group-hover:text-[#00C2FF] transition-colors">
                    TexMachina
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
            </nav>
          </div>

          {/* Right Action Icons & User Info */}
          <div className="flex items-center gap-3">
            <PWAInstallButton />

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors border border-white/5"
                aria-label="Notificações"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00C2FF] shadow-[0_0_8px_#00C2FF]" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-[#0E1626]/95 backdrop-blur-2xl rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] border border-white/10 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="font-display font-bold text-xs text-white">Notificações em Tempo Real</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0066FF]/20 text-[#00C2FF] font-semibold border border-[#00C2FF]/30">
                      3 Novas
                    </span>
                  </div>
                  <div className="divide-y divide-white/5 text-xs py-1">
                    <div className="py-2.5">
                      <p className="font-semibold text-white">Proposta Montex 6500 em revisão</p>
                      <p className="text-gray-400 text-[11px] mt-0.5">Tinturaria Rio Claro agendou vistoria técnica.</p>
                      <span className="text-[10px] text-gray-500">Há 15 minutos</span>
                    </div>
                    <div className="py-2.5">
                      <p className="font-semibold text-white">Lead Novo: Tear Mayer & Cie</p>
                      <p className="text-gray-400 text-[11px] mt-0.5">Malharia Santa Catarina solicitou tabela técnica.</p>
                      <span className="text-[10px] text-gray-500">Há 2 horas</span>
                    </div>
                    <div className="py-2.5">
                      <p className="font-semibold text-[#00C2FF]">Contrato Fechado: Picanol OmniPlus</p>
                      <p className="text-gray-400 text-[11px] mt-0.5">Coteminas assinou via DocuSign (R$ 510.000).</p>
                      <span className="text-[10px] text-emerald-400 font-medium">Hoje</span>
                    </div>
                  </div>
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
