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
  Sparkles
} from 'lucide-react';

export const ClientsList: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

      {/* Table view in dark glass */}
      <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white/[0.04] text-[#00C2FF] uppercase font-bold text-[10px] tracking-wider border-b border-white/10">
                <th className="py-3.5 px-4">Cliente / Contato</th>
                <th className="py-3.5 px-4">Telefone</th>
                <th className="py-3.5 px-4">Máquina Vinculada</th>
                <th className="py-3.5 px-4">Valor Estimado</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Follow-up</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    Carregando lista de clientes...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    Nenhum cliente encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block text-sm">
                        {lead.client_name}
                      </span>
                      {lead.notes && (
                        <span className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                          {lead.notes}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-gray-300">
                      <span className="font-medium">{lead.client_phone}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      {lead.machine_name ? (
                        <div>
                          <span className="font-semibold text-[#00C2FF] block truncate max-w-[200px]">
                            {lead.machine_name}
                          </span>
                          <span className="text-[10px] text-gray-400 block truncate max-w-[200px]">
                            {lead.machine_model}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">Interesse Geral</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white tabular-nums whitespace-nowrap">
                      {formatCurrency(lead.machine_price)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          lead.status === 'fechado'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : lead.status === 'negociacao'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            : lead.status === 'orcamento'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-[#0066FF]/20 text-[#38BDF8] border-[#00C2FF]/30'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-gray-400">
                      {lead.follow_up_date ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          <Calendar className="w-3 h-3" />
                          <span>{lead.follow_up_date}</span>
                        </span>
                      ) : (
                        <span className="text-gray-500">Sem agendamento</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`https://wa.me/${lead.client_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all"
                        >
                          <span className="material-symbols-outlined text-[14px]">chat</span>
                          <span>WhatsApp</span>
                        </a>

                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/[0.05]"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
