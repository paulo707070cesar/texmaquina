import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { dashboardApi, DashboardStats, Lead } from '../services/api';
import { 
  Layers, 
  Kanban, 
  Users, 
  TrendingUp, 
  Plus, 
  ArrowUpRight, 
  PhoneCall, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  FileText,
  DollarSign,
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (!val) return 'R$ 0';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'novo':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0066FF]/20 text-[#38BDF8] border border-[#00C2FF]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] animate-ping"></span>
            Novo Lead
          </span>
        );
      case 'orcamento':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Orçamento
          </span>
        );
      case 'negociacao':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Em Negociação
          </span>
        );
      case 'fechado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Fechado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header Banner styled like BizNext */}
      <div className="relative glass-card p-6 sm:p-8 rounded-3xl border border-white/10 overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#00C2FF]/15 to-[#0066FF]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            {/* Top subtitle with laser lines */}
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="w-6 h-[1px] bg-gradient-to-r from-transparent to-[#00C2FF]" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#00C2FF]">
                Industrial Textile Intelligence
              </span>
              <span className="w-6 h-[1px] bg-gradient-to-l from-transparent to-[#00C2FF]" />
            </div>

            <h1 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
              Gestão de Máquinas Têxteis &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C2FF] via-[#0080FF] to-[#38BDF8]">
                Funil de Vendas B2B
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-300 mt-2 max-w-2xl leading-relaxed">
              Controle em tempo real de teares circulares, a jato de ar, ramas e fiação. Acompanhamento de propostas técnicas e contratos liquidados.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <NavLink
              to="/machines"
              className="px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.10] text-gray-200 hover:text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-[#00C2FF]" />
              <span>Ver Estoque</span>
            </NavLink>

            <NavLink
              to="/pipeline"
              className="h-11 px-5 btn-electric rounded-2xl font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,102,255,0.4)]"
            >
              <Kanban className="w-4 h-4" />
              <span>Abrir Funil (Kanban)</span>
              <ArrowRight className="w-4 h-4" />
            </NavLink>
          </div>
        </div>
      </div>

      {/* 4 Cards Grid - Replicating the 4 iconic frosted cards from the reference image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Estoque de Máquinas (Website Design style) */}
        <div className="glass-card glass-card-hover p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#00C2FF] shadow-[0_0_15px_rgba(0,194,255,0.2)] mb-4">
              <Layers className="w-6 h-6" />
            </div>

            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Estoque Ativo
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display font-extrabold text-3xl text-white tabular-nums">
                {loading ? '...' : stats?.totalMachines ?? 0}
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                {stats?.availableMachines ?? 0} no pátio
              </span>
            </div>

            <p className="text-xs text-gray-400 mt-2">
              Patrimônio avaliado em {formatCurrency(stats?.availableInventoryValue)}
            </p>
          </div>

          {/* Dots indicator matching reference card bottom */}
          <div className="mt-6 flex items-center justify-center gap-1.5 opacity-60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF]" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Card 2: Pipeline em Negociação (The HIGHLIGHTED ACTIVE CARD with vibrant electric blue gradient!) */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0066FF] to-[#00C2FF] text-white shadow-[0_12px_40px_rgba(0,102,255,0.45)] ring-2 ring-[#00F0FF]/40 flex flex-col justify-between relative overflow-hidden transform sm:-translate-y-1 transition-transform">
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider text-white">
            + 68% Cotações
          </div>

          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>

            <span className="text-xs font-bold text-white/90 uppercase tracking-wider block">
              Pipeline Aberto
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display font-extrabold text-2xl lg:text-3xl text-white tabular-nums">
                {loading ? '...' : formatCurrency(stats?.pipelineValue)}
              </span>
            </div>

            <p className="text-xs text-white/80 mt-2 font-medium">
              {stats?.activeLeads ?? 0} propostas em andamento
            </p>
          </div>

          {/* Active card dots indicator */}
          <div className="mt-6 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
          </div>
        </div>

        {/* Card 3: Leads & Oportunidades (E-Commerce style) */}
        <div className="glass-card glass-card-hover p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#38BDF8] shadow-[0_0_15px_rgba(56,189,248,0.2)] mb-4">
              <Kanban className="w-6 h-6" />
            </div>

            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Leads Qualificados
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display font-extrabold text-3xl text-white tabular-nums">
                {loading ? '...' : stats?.activeLeads ?? 0}
              </span>
              <span className="text-xs font-semibold text-[#00C2FF]">
                {stats?.leadsByStatus.negociacao ?? 0} em visita técnica
              </span>
            </div>

            <p className="text-xs text-gray-400 mt-2">
              Total de {stats?.totalLeads ?? 0} clientes cadastrados
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 opacity-60">
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF]" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Card 4: Vendas Fechadas (24/7 Support style) */}
        <div className="glass-card glass-card-hover p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)] mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Vendas Concluídas
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display font-extrabold text-2xl lg:text-3xl text-white tabular-nums">
                {loading ? '...' : formatCurrency(stats?.closedRevenue)}
              </span>
            </div>

            <p className="text-xs text-emerald-400 mt-2 font-medium">
              {stats?.closedLeads ?? 0} contratos liquidados
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 opacity-60">
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>

      {/* KPI Trust Bar matching the bottom banner of the reference image */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="grid grid-cols-3 gap-6 text-center md:text-left flex-1">
          <div>
            <span className="font-display font-extrabold text-2xl sm:text-3xl text-white block">
              500+
            </span>
            <span className="text-xs text-gray-400 font-medium">Máquinas Transacionadas</span>
          </div>

          <div className="border-x border-white/10 px-4">
            <span className="font-display font-extrabold text-2xl sm:text-3xl text-[#00C2FF] block">
              98%
            </span>
            <span className="text-xs text-gray-400 font-medium">Satisfação das Malharias</span>
          </div>

          <div>
            <span className="font-display font-extrabold text-2xl sm:text-3xl text-white block">
              24/7
            </span>
            <span className="text-xs text-gray-400 font-medium">Suporte & Comissionamento</span>
          </div>
        </div>

        <NavLink
          to="/pipeline"
          className="h-12 px-6 btn-electric rounded-2xl font-bold text-xs flex items-center justify-center gap-2 flex-shrink-0 self-center md:self-auto shadow-[0_0_20px_rgba(0,102,255,0.4)]"
        >
          <span>Avançar Oportunidades</span>
          <ArrowRight className="w-4 h-4" />
        </NavLink>
      </div>

      {/* Pipeline Stage Distribution Progress */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              Funil de Vendas Industrial (Etapas de Negociação)
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Progresso das cotações técnicas no pátio têxtil
            </p>
          </div>
          <NavLink
            to="/pipeline"
            className="text-xs font-bold text-[#00C2FF] hover:underline flex items-center gap-1"
          >
            <span>Ver Kanban Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#0066FF]/30 hover:border-[#00C2FF]/60 transition-all">
            <div className="flex items-center justify-between text-xs font-bold text-[#00C2FF]">
              <span>1. Novo Lead</span>
              <span className="px-2 py-0.5 rounded-full bg-[#0066FF]/20 text-[#00C2FF] border border-[#00C2FF]/30">
                {stats?.leadsByStatus.novo ?? 0}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Primeiro contato fabril ou cotação técnica</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-amber-500/30 hover:border-amber-400/60 transition-all">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300">
              <span>2. Em Orçamento</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {stats?.leadsByStatus.orcamento ?? 0}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Proposta formal com memorial descritivo</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-indigo-500/30 hover:border-indigo-400/60 transition-all">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
              <span>3. Em Negociação</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {stats?.leadsByStatus.negociacao ?? 0}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Visita técnica, teste de fiação/tecelagem</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-emerald-500/30 hover:border-emerald-400/60 transition-all">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
              <span>4. Fechado / Ganho</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {stats?.leadsByStatus.fechado ?? 0}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Contrato assinado e comissionamento</p>
          </div>
        </div>
      </div>

      {/* Recent Leads Table */}
      <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              Oportunidades & Follow-up Recente
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Últimos clientes em negociação com contato direto
            </p>
          </div>

          <NavLink
            to="/leads"
            className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.10] text-[#00C2FF] text-xs font-bold rounded-xl border border-white/10 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Ver Todos os Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="divide-y divide-white/5 overflow-x-auto">
          {stats?.recentLeads && stats.recentLeads.length > 0 ? (
            stats.recentLeads.map((lead: Lead) => (
              <div key={lead.id} className="p-4 sm:p-5 hover:bg-white/[0.03] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-display font-bold text-sm text-white">
                      {lead.client_name}
                    </span>
                    {getStatusBadge(lead.status)}
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-1">
                    {lead.notes || 'Sem observações registradas.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                    <span className="flex items-center gap-1 text-gray-300">
                      <PhoneCall className="w-3.5 h-3.5 text-[#00C2FF]" />
                      <span>{lead.client_phone}</span>
                    </span>

                    {lead.follow_up_date && (
                      <span className="flex items-center gap-1 text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-[11px] font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>Follow-up: {lead.follow_up_date}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  {lead.machine_name && (
                    <div className="text-right hidden sm:block">
                      <span className="block text-xs font-bold text-white">
                        {lead.machine_name}
                      </span>
                      <span className="block text-xs font-semibold text-[#00C2FF]">
                        {formatCurrency(lead.machine_price)}
                      </span>
                    </div>
                  )}

                  <a
                    href={`https://wa.me/${lead.client_phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-gray-400">
              Nenhum lead registrado no momento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
