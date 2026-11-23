import React, { useState, useEffect } from 'react';
import { leadsApi, Lead } from '../services/api';
import { 
  Users, 
  Search, 
  PhoneCall, 
  Calendar, 
  Trash2, 
  Edit3, 
  Download, 
  FileSpreadsheet, 
  Check, 
  Plus,
  MessageSquare,
  Sparkles,
  Eye,
  X
} from 'lucide-react';

export const ClientsList: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await leadsApi.list();
      setLeads(data);
    } catch (err) {
      console.error('Error loading leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir este lead?')) return;
    try {
      await leadsApi.delete(id);
      showToast('Lead excluído.');
      loadLeads();
    } catch (err) {
      showToast('Erro ao excluir.');
    }
  };

  const exportToCSV = () => {
    if (leads.length === 0) return;
    const headers = ['ID', 'Cliente', 'Telefone', 'Máquina', 'Preço', 'Status', 'Follow-up', 'Anotações'];
    const rows = filteredLeads.map((l) => [
      l.id,
      `"${l.client_name.replace(/"/g, '""')}"`,
      `"${l.client_phone}"`,
      `"${l.machine_name || 'N/A'}"`,
      l.machine_price || 0,
      l.status,
      l.follow_up_date || '',
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `texmachina_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exportação CSV gerada com sucesso!');
  };

  const filteredLeads = leads.filter((lead) => {
    const q = search.toLowerCase();
    const matchesSearch =
      lead.client_name.toLowerCase().includes(q) ||
      lead.client_phone.includes(q) ||
      (lead.machine_name && lead.machine_name.toLowerCase().includes(q)) ||
      (lead.notes && lead.notes.toLowerCase().includes(q));

    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (val: number | null | undefined) => {
    if (!val) return 'R$ -';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#0066FF] border border-[#00C2FF] text-white px-4 py-3 rounded-2xl shadow-[0_0_25px_rgba(0,194,255,0.5)] flex items-center gap-2 text-xs font-semibold">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="w-4 h-[1px] bg-[#00C2FF]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#00C2FF]">
              Client Relationship Management
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
            Clientes & Carteira de Leads
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Gestão consolidada de contatos industriais, histórico e follow-up telefônico.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="h-11 px-4 bg-white/[0.05] hover:bg-white/[0.10] text-[#00C2FF] font-bold text-xs rounded-2xl border border-white/10 shadow-sm flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Exportar para Excel (CSV)</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
            <Search className="w-4 h-4 text-[#00C2FF]" />
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, telefone, máquina ou anotação..."
            className="w-full h-11 pl-10 pr-4 glass-input rounded-2xl text-xs sm:text-sm placeholder-gray-500"
          />
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full h-11 px-3 glass-input rounded-2xl text-xs sm:text-sm"
          >
            <option value="all" className="bg-[#0b1120]">Todos os Status ({leads.length})</option>
            <option value="novo" className="bg-[#0b1120]">Novo Lead ({leads.filter((l) => l.status === 'novo').length})</option>
            <option value="orcamento" className="bg-[#0b1120]">Orçamento ({leads.filter((l) => l.status === 'orcamento').length})</option>
            <option value="negociacao" className="bg-[#0b1120]">Negociação ({leads.filter((l) => l.status === 'negociacao').length})</option>
            <option value="fechado" className="bg-[#0b1120]">Fechado ({leads.filter((l) => l.status === 'fechado').length})</option>
          </select>
        </div>
      </div>

      {/* Mobile-friendly client list: name and details button only */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="divide-y divide-white/5">
          {loading ? <div className="py-12 text-center text-gray-400 text-sm">Carregando clientes...</div>
          : filteredLeads.length === 0 ? <div className="py-12 text-center text-gray-400 text-sm">Nenhum cliente encontrado.</div>
          : filteredLeads.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-white/[0.03]">
              <p className="font-bold text-white text-sm min-w-0 truncate">{lead.client_name}</p>
              <button onClick={() => setSelectedLead(lead)} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0066FF]/20 border border-[#00C2FF]/30 text-[#00C2FF] text-xs font-bold"><Eye className="w-4 h-4" /> Ver informações</button>
            </div>
          ))}
        </div>
      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelectedLead(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="lead-detail-title" className="w-full sm:max-w-xl max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#0E1626] border border-white/10 shadow-2xl p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-start justify-between gap-3 mb-5">
              <div className="min-w-0"><p className="text-[10px] uppercase tracking-widest font-bold text-[#00C2FF]">Ficha do cliente</p><h2 id="lead-detail-title" className="text-xl font-extrabold text-white mt-1 break-words">{selectedLead.client_name}</h2></div>
              <button onClick={() => setSelectedLead(null)} aria-label="Fechar" className="p-2 rounded-xl text-gray-300 hover:bg-white/10"><X className="w-5 h-5" /></button>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                ['Telefone', selectedLead.client_phone || 'Não informado'],
                ['Status', selectedLead.status || 'Não informado'],
                ['Máquina vinculada', selectedLead.machine_name || 'Interesse geral'],
                ['Modelo', selectedLead.machine_model || 'Não informado'],
                ['Valor estimado', formatCurrency(selectedLead.machine_price)],
                ['Follow-up', selectedLead.follow_up_date || 'Sem agendamento'],
                ['Data de cadastro', selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleString('pt-BR') : 'Não disponível'],
              ].map(([label, value]) => <div key={label} className="rounded-xl bg-white/[0.04] border border-white/5 p-3"><p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p><p className="text-white font-semibold mt-1 break-words">{value}</p></div>)}
              <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3 sm:col-span-2"><p className="text-[10px] uppercase tracking-wide text-gray-400">Anotações / informações cadastradas</p><p className="text-white mt-1 whitespace-pre-wrap break-words">{selectedLead.notes?.trim() || 'Nenhuma anotação cadastrada.'}</p></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-5">
              <a href={`https://wa.me/${selectedLead.client_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold"><MessageSquare className="w-4 h-4" /> WhatsApp</a>
              <button onClick={() => { const id = selectedLead.id; setSelectedLead(null); handleDelete(id); }} className="h-11 px-4 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10 text-sm font-bold"><Trash2 className="w-4 h-4 inline mr-2" />Excluir</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
