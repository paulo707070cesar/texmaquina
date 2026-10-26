import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  useDroppable, 
  useDraggable 
} from '@dnd-kit/core';
import { leadsApi, machinesApi, Lead, Machine } from '../services/api';
import { 
  Plus, 
  PhoneCall, 
  Calendar, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  X, 
  Check, 
  GripVertical, 
  Building2,
  DollarSign,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface ColumnDef {
  id: 'novo' | 'orcamento' | 'negociacao' | 'fechado';
  title: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  description: string;
}

const COLUMNS: ColumnDef[] = [
  {
    id: 'novo',
    title: 'Novo Lead',
    badgeBg: 'bg-[#0066FF]/20',
    badgeText: 'text-[#38BDF8]',
    borderColor: 'border-[#00C2FF]/30',
    description: 'Primeiro contato & cotação técnica',
  },
  {
    id: 'orcamento',
    title: 'Orçamento Enviado',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    borderColor: 'border-amber-500/30',
    description: 'Proposta comercial e condições FINAME',
  },
  {
    id: 'negociacao',
    title: 'Em Negociação',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
    borderColor: 'border-indigo-500/30',
    description: 'Visita fabril e teste operacional',
  },
  {
    id: 'fechado',
    title: 'Fechado / Ganho',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    borderColor: 'border-emerald-500/30',
    description: 'Contrato industrial assinado',
  },
];

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (id: number) => void;
  isOverlay?: boolean;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onEdit, onDelete, isOverlay }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lead-${lead.id}`,
    data: lead,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const formatCurrency = (val: number | null | undefined) => {
    if (!val) return 'Sob consulta';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-card rounded-2xl p-4 border border-white/10 hover:border-[#00C2FF]/40 transition-all ${
        isDragging ? 'opacity-30 ring-2 ring-[#00C2FF]' : ''
      } ${isOverlay ? 'shadow-[0_0_30px_rgba(0,194,255,0.4)] ring-2 ring-[#00C2FF] cursor-grabbing rotate-1 bg-[#0F172A]' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-gray-400 hover:text-[#00C2FF] rounded"
            title="Arraste para mudar de coluna"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <h4 className="font-display font-bold text-sm text-white truncate">
            {lead.client_name}
          </h4>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => onEdit(lead)}
            className="p-1 rounded-lg text-gray-400 hover:text-[#00C2FF] hover:bg-white/[0.06] transition-colors"
            title="Editar lead"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(lead.id)}
            className="p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Excluir lead"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Linked Machine Info */}
      {lead.machine_name && (
        <div className="mt-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-between text-xs">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] uppercase font-bold text-[#00C2FF] block truncate">
              {lead.machine_name}
            </span>
            <span className="text-[11px] text-gray-400 truncate block">
              {lead.machine_model || 'Equipamento têxtil'}
            </span>
          </div>
          <span className="font-bold text-white text-xs whitespace-nowrap tabular-nums">
            {formatCurrency(lead.machine_price)}
          </span>
        </div>
      )}

      {/* Notes / Description - Increased visibility and field size */}
      {lead.notes && (
        <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-inner group-hover:bg-white/[0.05] transition-colors">
          <p className="text-[12px] leading-relaxed text-gray-200 whitespace-pre-wrap">
            {lead.notes}
          </p>
        </div>
      )}

      {/* Footer Details: Phone, Date & WhatsApp */}
      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-[11px] text-gray-300">
            <PhoneCall className="w-3 h-3 text-[#00C2FF]" />
            <span>{lead.client_phone}</span>
          </span>

          {lead.follow_up_date && (
            <span className="flex items-center gap-1 text-[10px] text-amber-300 font-medium">
              <Calendar className="w-3 h-3" />
              <span>Prazo: {lead.follow_up_date}</span>
            </span>
          )}
        </div>

        <a
          href={`https://wa.me/${lead.client_phone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] flex-shrink-0"
          title="Falar no WhatsApp"
        >
          <span className="material-symbols-outlined text-[15px]">chat</span>
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
};

interface KanbanColumnProps {
  column: ColumnDef;
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (id: number) => void;
  onQuickAdd: (status: 'novo' | 'orcamento' | 'negociacao' | 'fechado') => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  leads,
  onEditLead,
  onDeleteLead,
  onQuickAdd,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  const columnValue = leads.reduce((sum, l) => sum + (Number(l.machine_price) || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col flex-1 min-w-[280px] sm:min-w-[320px] rounded-3xl bg-[#090E1A]/80 backdrop-blur-xl border-2 transition-all p-4 ${
        isOver
          ? 'border-[#00C2FF] bg-[#0066FF]/10 ring-2 ring-[#00C2FF]/30 shadow-[0_0_25px_rgba(0,194,255,0.2)]'
          : 'border-white/10'
      }`}
    >
      {/* Column Header */}
      <div className="pb-3 border-b border-white/10 mb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${column.badgeBg} ${column.badgeText} ${column.borderColor}`}
            >
              {column.title}
            </span>
            <span className="text-xs font-bold text-gray-400 tabular-nums">
              ({leads.length})
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{column.description}</p>
          <span className="text-[11px] font-bold text-[#00C2FF] mt-0.5 block tabular-nums">
            Total: {formatCurrency(columnValue)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onQuickAdd(column.id)}
          className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] text-[#00C2FF] border border-white/10 flex items-center justify-center transition-colors"
          title={`Adicionar lead em ${column.title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Cards Stream */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
        {leads.length === 0 ? (
          <div className="h-36 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-500 p-4 text-center">
            <span className="text-xs font-semibold">Nenhum lead nesta etapa</span>
            <span className="text-[10px] mt-0.5 text-gray-600">Arraste um card para cá</span>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onEdit={onEditLead}
              onDelete={onDeleteLead}
            />
          ))
        )}
      </div>
    </div>
  );
};

export const Pipeline: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDragLead, setActiveDragLead] = useState<Lead | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState<{
    client_name: string;
    client_phone: string;
    machine_id: string;
    status: 'novo' | 'orcamento' | 'negociacao' | 'fechado';
    notes: string;
    follow_up_date: string;
  }>({
    client_name: '',
    client_phone: '',
    machine_id: '',
    status: 'novo',
    notes: '',
    follow_up_date: '',
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [leadsData, machinesData] = await Promise.all([
        leadsApi.list(),
        machinesApi.list(),
      ]);
      setLeads(leadsData);
      setMachines(machinesData);
    } catch (err) {
      console.error('Error loading pipeline data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = leads.find((l) => `lead-${l.id}` === active.id);
    if (lead) {
      setActiveDragLead(lead);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragLead(null);

    if (!over) return;

    const leadId = parseInt(String(active.id).replace('lead-', ''), 10);
    const targetStatus = over.id as 'novo' | 'orcamento' | 'negociacao' | 'fechado';

    const currentLead = leads.find((l) => l.id === leadId);
    if (!currentLead || currentLead.status === targetStatus) return;

    // Optimistic UI update
    const previousLeads = [...leads];
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: targetStatus } : l))
    );

    try {
      await leadsApi.update(leadId, { status: targetStatus });
      showToast(`Lead "${currentLead.client_name}" movido para "${targetStatus.toUpperCase()}".`);
    } catch (err) {
      setLeads(previousLeads);
      showToast('Falha ao atualizar status no servidor. Revertendo alteração.');
    }
  };

  const handleOpenAdd = (defaultStatus: 'novo' | 'orcamento' | 'negociacao' | 'fechado' = 'novo') => {
    setEditingLead(null);
    setFormData({
      client_name: '',
      client_phone: '',
      machine_id: machines.length > 0 ? String(machines[0].id) : '',
      status: defaultStatus,
      notes: '',
      follow_up_date: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      client_name: lead.client_name,
      client_phone: lead.client_phone,
      machine_id: lead.machine_id ? String(lead.machine_id) : '',
      status: lead.status,
      notes: lead.notes || '',
      follow_up_date: lead.follow_up_date || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteLead = async (id: number) => {
    if (!confirm('Deseja realmente excluir este lead de vendas?')) return;
    try {
      await leadsApi.delete(id);
      showToast('Lead removido com sucesso!');
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao excluir lead.');
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.client_name.trim()) errors.client_name = 'Nome do cliente é obrigatório.';
    if (!formData.client_phone.trim()) errors.client_phone = 'Telefone de contato é obrigatório.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingLead) {
        await leadsApi.update(editingLead.id, {
          client_name: formData.client_name,
          client_phone: formData.client_phone,
          machine_id: formData.machine_id ? parseInt(formData.machine_id, 10) : null,
          status: formData.status,
          notes: formData.notes,
          follow_up_date: formData.follow_up_date || null,
        });
        showToast('Lead atualizado com sucesso!');
      } else {
        await leadsApi.create({
          client_name: formData.client_name,
          client_phone: formData.client_phone,
          machine_id: formData.machine_id ? parseInt(formData.machine_id, 10) : null,
          status: formData.status,
          notes: formData.notes,
          follow_up_date: formData.follow_up_date || null,
        });
        showToast('Novo lead cadastrado no funil!');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao salvar lead.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#0066FF] border border-[#00C2FF] text-white px-4 py-3 rounded-2xl shadow-[0_0_25px_rgba(0,194,255,0.5)] flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
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
              Visual Sales Pipeline
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
            Funil de Vendas (Kanban)
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Arraste os cards para atualizar as fases de negociação (sincronização instantânea com MySQL).
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd('novo')}
          className="h-11 px-5 btn-electric rounded-2xl font-bold text-xs flex items-center justify-center gap-2 self-start sm:self-auto shadow-[0_0_20px_rgba(0,102,255,0.4)]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Novo Lead</span>
        </button>
      </div>

      {/* Kanban Board with dnd-kit */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-[#00C2FF] animate-spin mb-3 shadow-[0_0_20px_rgba(0,194,255,0.4)]" />
          <span className="text-xs font-bold text-[#00C2FF]">Carregando oportunidades...</span>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
            {COLUMNS.map((col) => {
              const colLeads = leads.filter((l) => l.status === col.id);
              return (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  leads={colLeads}
                  onEditLead={handleOpenEdit}
                  onDeleteLead={handleDeleteLead}
                  onQuickAdd={handleOpenAdd}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeDragLead ? (
              <LeadCard
                lead={activeDragLead}
                onEdit={() => {}}
                onDelete={() => {}}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Add / Edit Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0B1120] w-full max-w-lg rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-white">
                {editingLead ? 'Editar Lead / Oportunidade' : 'Novo Lead de Vendas'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLead} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Nome do Cliente / Empresa Têxtil *
                </label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="Ex: Malharia Santa Catarina Ltda"
                  className="w-full h-11 px-3 glass-input rounded-xl text-sm"
                />
                {formErrors.client_name && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.client_name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="text"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  placeholder="Ex: +55 (47) 99881-2244"
                  className="w-full h-11 px-3 glass-input rounded-xl text-sm"
                />
                {formErrors.client_phone && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.client_phone}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Máquina de Interesse
                  </label>
                  <select
                    value={formData.machine_id}
                    onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
                    className="w-full h-11 px-3 glass-input rounded-xl text-sm"
                  >
                    <option value="" className="bg-[#0b1120]">Nenhuma / Interesse Geral</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id} className="bg-[#0b1120]">
                        {m.name} ({m.model})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Etapa do Funil
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full h-11 px-3 glass-input rounded-xl text-sm"
                  >
                    <option value="novo" className="bg-[#0b1120]">1. Novo Lead</option>
                    <option value="orcamento" className="bg-[#0b1120]">2. Em Orçamento</option>
                    <option value="negociacao" className="bg-[#0b1120]">3. Em Negociação</option>
                    <option value="fechado" className="bg-[#0b1120]">4. Fechado / Ganho</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Data Limite de Follow-up
                </label>
                <input
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                  className="w-full h-11 px-3 glass-input rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Anotações da Negociação / Dados Técnicos
                </label>
                <textarea
                  rows={8}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Descreva detalhadamente a negociação, exigências do cliente, prazos, detalhes técnicos da máquina solicitada e próximos passos..."
                  className="w-full p-3 glass-input rounded-xl text-sm min-h-[160px]"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 btn-electric text-xs font-bold rounded-xl shadow-[0_0_20px_rgba(0,102,255,0.4)] disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>{editingLead ? 'Salvar Lead' : 'Cadastrar Lead'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
