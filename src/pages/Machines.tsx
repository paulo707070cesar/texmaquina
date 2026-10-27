import React, { useState, useEffect } from 'react';
import { machinesApi, Machine } from '../services/api';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  FileText, 
  Share2, 
  Edit3, 
  Trash2, 
  MapPin, 
  AlertTriangle, 
  Check, 
  X, 
  Image as ImageIcon, 
  Sparkles,
  Download,
  Layout
} from 'lucide-react';
import { ShareFichaModal } from '../components/ShareFichaModal';
import { categoriesApi, Category, systemApi } from '../services/api';



export const Machines: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [machineToShare, setMachineToShare] = useState<Machine | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    model: '',
    description: '',
    price: '',
    image_url: '',
    status: 'disponivel' as 'disponivel' | 'vendido' | 'manutencao',
    origin: 'Brasil',
    warranty: '6 Meses',
    payment_type: 'a_vista' as 'a_vista' | 'financiado',
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Ficha Técnica modal
  const [selectedMachineForSpecs, setSelectedMachineForSpecs] = useState<Machine | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMachines();
    loadCategories();
  }, [search, statusFilter]);

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.list();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadMachines = async () => {
    try {
      setLoading(true);
      const data = await machinesApi.list({
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setMachines(data);
    } catch (err) {
      console.error('Error loading machines:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleOpenAdd = () => {
    setEditingMachine(null);
    setFormData({
      name: '',
      category_id: '',
      model: '',
      description: '',
      price: '',
      image_url: '',
      status: 'disponivel',
      origin: 'Brasil',
      warranty: '6 Meses',
      payment_type: 'a_vista',
    });
    setFormErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setFormData({
      name: machine.name,
      category_id: machine.category_id ? String(machine.category_id) : '',
      model: machine.model,
      description: machine.description,
      price: machine.price.toString(),
      image_url: machine.image_url,
      status: machine.status,
      origin: machine.origin || 'Brasil',
      warranty: machine.warranty || '6 Meses',
      payment_type: machine.payment_type || 'a_vista',
    });
    setFormErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) errors.name = 'Nome da máquina é obrigatório.';
    if (!formData.category_id) errors.category_id = 'Selecione uma categoria.';
    if (!formData.model.trim()) errors.model = 'Modelo/bitola é obrigatório.';
    const numPrice = parseFloat(formData.price);
    if (isNaN(numPrice) || numPrice <= 0) errors.price = 'Informe um preço válido maior que zero.';
    if (!formData.image_url.trim()) errors.image_url = 'A imagem é obrigatória.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitError(null);
    if (!validateForm()) {
      setSubmitError('Confira os campos obrigatórios destacados abaixo e tente novamente.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        category_id: Number(formData.category_id),
        model: formData.model.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        // Persist the exact URL returned by the upload endpoint.
        image_url: formData.image_url.trim(),
        status: formData.status,
        origin: formData.origin,
        warranty: formData.warranty,
        payment_type: formData.payment_type,
      };

      const savedMachine = editingMachine
        ? await machinesApi.update(editingMachine.id, payload)
        : await machinesApi.create(payload);

      // Only close the popup after the API confirms the image URL was saved.
      if (!savedMachine?.id || !savedMachine?.image_url) {
        throw new Error('O servidor não confirmou o cadastro e a imagem. Os dados foram mantidos no formulário; tente novamente.');
      }

      await loadMachines();
      setIsModalOpen(false);
      setEditingMachine(null);
      setFormErrors({});
      showToast(editingMachine ? 'Máquina atualizada com sucesso!' : 'Máquina cadastrada com foto!');
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Erro ao salvar máquina.';
      setSubmitError(message);
      console.error('[Machines] Falha ao salvar cadastro:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!machineToDelete) return;
    setDeleting(true);
    try {
      await machinesApi.delete(machineToDelete.id);
      showToast(`Máquina "${machineToDelete.name}" removida.`);
      setMachineToDelete(null);
      loadMachines();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao remover máquina.');
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = (machine: Machine) => {
    setMachineToShare(machine);
  };

  const totalCount = machines.length;
  const availableCount = machines.filter((m) => m.status === 'disponivel').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#0066FF] border border-[#00C2FF] text-white px-4 py-3 rounded-2xl shadow-[0_0_25px_rgba(0,194,255,0.5)] flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Section */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="w-4 h-[1px] bg-[#00C2FF]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#00C2FF]">
              Inventory Management
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
            Estoque de Máquinas Têxteis
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 flex items-center gap-2 mt-1">
            <span className="inline-block w-2 h-2 rounded-full bg-[#00C2FF] shadow-[0_0_8px_#00C2FF]" />
            <span>{totalCount} máquinas registradas</span>
            <span>•</span>
            <span className="font-semibold text-[#00C2FF]">{availableCount} disponíveis para envio imediato</span>
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          type="button"
          className="h-11 px-5 btn-electric rounded-2xl font-bold text-xs flex items-center justify-center gap-2 self-start sm:self-auto shadow-[0_0_20px_rgba(0,102,255,0.4)]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nova Máquina</span>
        </button>
      </section>

      {/* Search Input & Controls */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
          <Search className="w-5 h-5 text-[#00C2FF]" />
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar fabricante, modelo, bitola, ano ou descrição..."
          className="w-full h-12 pl-12 pr-12 glass-input rounded-2xl text-sm placeholder-gray-500 shadow-inner"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category & Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => { setActiveCategory('Todos'); setStatusFilter('all'); }}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            statusFilter === 'all' && activeCategory === 'Todos'
              ? 'btn-electric shadow-[0_0_15px_rgba(0,102,255,0.4)]'
              : 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/10'
          }`}
        >
          Todos ({machines.length})
        </button>

        <button
          onClick={() => { setActiveCategory('Disponíveis'); setStatusFilter('disponivel'); }}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            statusFilter === 'disponivel'
              ? 'btn-electric shadow-[0_0_15px_rgba(0,102,255,0.4)]'
              : 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/10'
          }`}
        >
          Em Estoque ({machines.filter((m) => m.status === 'disponivel').length})
        </button>

        <button
          onClick={() => { setActiveCategory('Manutenção'); setStatusFilter('manutencao'); }}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            statusFilter === 'manutencao'
              ? 'btn-electric shadow-[0_0_15px_rgba(0,102,255,0.4)]'
              : 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/10'
          }`}
        >
          Manutenção ({machines.filter((m) => m.status === 'manutencao').length})
        </button>

        <button
          onClick={() => { setActiveCategory('Vendidos'); setStatusFilter('vendido'); }}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            statusFilter === 'vendido'
              ? 'btn-electric shadow-[0_0_15px_rgba(0,102,255,0.4)]'
              : 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/10'
          }`}
        >
          Vendidos ({machines.filter((m) => m.status === 'vendido').length})
        </button>
      </div>

      {/* Machinery Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-[#00C2FF] animate-spin mb-3 shadow-[0_0_20px_rgba(0,194,255,0.4)]" />
          <span className="text-xs font-bold text-[#00C2FF]">Carregando catálogo industrial...</span>
        </div>
      ) : machines.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-white/10">
          <span className="material-symbols-outlined text-[48px] text-gray-500">inventory_2</span>
          <h3 className="font-display font-bold text-lg text-white mt-2">Nenhuma máquina encontrada</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            Não localizamos equipamentos com os filtros atuais. Cadastre uma nova máquina ou limpe a busca.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-5 py-2.5 btn-electric text-xs font-bold rounded-xl"
          >
            + Cadastrar Máquina
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map((machine) => {
            const isSold = machine.status === 'vendido';

            return (
              <article
                key={machine.id}
                className="w-full glass-card glass-card-hover rounded-3xl overflow-hidden flex flex-col group"
              >
                {/* Image Header with Industrial Tags */}
                <div className="relative w-full h-52 bg-[#0c1424] overflow-hidden">
                  <img
                    src={machine.image_url}
                    alt={machine.name}
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                      isSold ? 'grayscale-[40%]' : ''
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080C14] via-[#080C14]/40 to-transparent" />

                  {/* Category Pill Tag */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#090E1A]/85 backdrop-blur-md text-[10px] font-bold text-[#00C2FF] border border-[#00C2FF]/30 shadow-md">
                      <span className="material-symbols-outlined text-[13px]">precision_manufacturing</span>
                      <span>{machine.model.split(' ')[0] || 'Tear'}</span>
                    </span>
                  </div>

                  {/* Status Pill Tag */}
                  <div className="absolute top-3 right-3">
                    {machine.status === 'disponivel' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#090E1A]/85 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Em Estoque</span>
                      </span>
                    )}
                    {machine.status === 'manutencao' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#090E1A]/85 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>Manutenção</span>
                      </span>
                    )}
                    {machine.status === 'vendido' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#090E1A]/85 backdrop-blur-md text-[10px] font-bold text-red-400 border border-red-500/30">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        <span>Vendido</span>
                      </span>
                    )}
                  </div>

                  {/* Serial Number Tag */}
                  <div className="absolute bottom-3 left-3 text-white">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-[#00C2FF] drop-shadow-[0_0_8px_rgba(0,194,255,0.6)]">
                      SÉRIE INDUSTRIAL #TEX-0{machine.id}-2024
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#00C2FF] uppercase tracking-wider">
                        {machine.name.split(' ')[0]} Industrial
                      </span>
                      <span className="text-[11px] font-semibold text-gray-400">Ano Recente</span>
                    </div>

                    <h2 className="font-display font-bold text-base sm:text-lg text-white mt-1 leading-snug">
                      {machine.name}
                    </h2>
                    <p className="text-xs font-medium text-gray-400 mt-0.5">
                      Modelo: {machine.model}
                    </p>

                    {/* Telemetry Micro Grid */}
                    <div className="grid grid-cols-3 gap-2 mt-3.5">
                      <div className="bg-white/[0.04] border border-white/5 p-2 rounded-xl flex flex-col">
                        <span className="text-[9px] text-gray-400 uppercase font-semibold">Status</span>
                        <span className="text-xs font-bold text-white capitalize truncate mt-0.5">
                          {machine.status}
                        </span>
                      </div>
                      <div className="bg-white/[0.04] border border-white/5 p-2 rounded-xl flex flex-col">
                        <span className="text-[9px] text-gray-400 uppercase font-semibold">Origem</span>
                        <span className="text-xs font-bold text-white truncate mt-0.5">
                          {machine.origin || 'Brasil'}
                        </span>
                      </div>
                      <div className="bg-white/[0.04] border border-white/5 p-2 rounded-xl flex flex-col">
                        <span className="text-[9px] text-gray-400 uppercase font-semibold">Garantia</span>
                        <span className="text-xs font-bold text-white truncate mt-0.5">
                          {machine.warranty || '6 Meses'}
                        </span>
                      </div>
                    </div>

                    {/* Description preview */}
                    <p className="text-xs text-gray-400 line-clamp-2 mt-3 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                      {machine.description || 'Equipamento inspecionado com laudo industrial completo.'}
                    </p>
                  </div>

                  {/* Price & Location */}
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">
                          Investimento: {machine.payment_type === 'financiado' ? 'FINAME / BNDES' : 'À Vista'}
                        </span>
                        <span className="font-display font-extrabold text-xl text-white tracking-tight tabular-nums">
                          {formatCurrency(Number(machine.price))}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3.5 h-3.5 text-[#00C2FF]" />
                        <span>Brasil</span>
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMachineForSpecs(machine)}
                        className="flex-1 h-10 btn-electric text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,102,255,0.3)]"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ficha Técnica</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(machine)}
                        title="Editar máquina"
                        className="w-10 h-10 bg-white/[0.05] hover:bg-white/[0.10] text-gray-300 hover:text-white border border-white/10 rounded-xl flex items-center justify-center transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setMachineToDelete(machine)}
                        title="Excluir máquina"
                        className="w-10 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShare(machine)}
                        title="Compartilhar Ficha Técnica & Imagem no WhatsApp"
                        className="w-10 h-10 bg-white/[0.05] hover:bg-[#0066FF]/20 text-[#00C2FF] hover:border-[#00C2FF] border border-[#00C2FF]/30 rounded-xl flex items-center justify-center transition-all shadow-[0_0_10px_rgba(0,194,255,0.15)]"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Add / Edit Machine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0B1120] w-full max-w-xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px] text-[#00C2FF]">
                  precision_manufacturing
                </span>
                <h3 className="font-display font-bold text-lg text-white">
                  {editingMachine ? 'Editar Máquina Têxtil' : 'Cadastrar Nova Máquina no Estoque'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-4">
              {submitError && (
                <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <div className="font-bold">Não foi possível salvar a máquina</div>
                  <p className="mt-1">{submitError}</p>
                </div>
              )}
              {Object.keys(formErrors).length > 0 && (
                <div role="alert" className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                  Preencha o nome, selecione a categoria, informe modelo/bitola, preço maior que zero e envie uma foto.
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Nome da Máquina / Fabricante *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Mayer & Cie Relanit 3.2 II"
                  className="w-full h-11 px-3 glass-input rounded-xl text-sm"
                />
                {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Categoria da Máquina *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full h-11 px-3 glass-input rounded-xl text-sm"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                {formErrors.category_id && <p className="text-xs text-red-400 mt-1">{formErrors.category_id}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Modelo / Bitola *
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="Ex: Single Jersey E28 34 Pol"
                    className="w-full h-11 px-3 glass-input rounded-xl text-sm"
                  />
                  {formErrors.model && <p className="text-xs text-red-400 mt-1">{formErrors.model}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Ex: 420000"
                    className="w-full h-11 px-3 glass-input rounded-xl text-sm"
                  />
                  {formErrors.price && <p className="text-xs text-red-400 mt-1">{formErrors.price}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Status no Pátio
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full h-11 px-3 glass-input rounded-xl text-sm"
                  >
                    <option value="disponivel" className="bg-[#0b1120]">Disponível em Estoque</option>
                    <option value="manutencao" className="bg-[#0b1120]">Em Manutenção / Revisão Técnica</option>
                    <option value="vendido" className="bg-[#0b1120]">Vendido / Liquidado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Tipo de Investimento
                  </label>
                  <select
                    value={formData.payment_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_type: e.target.value as any }))}
                    className="w-full h-11 px-3 glass-input rounded-xl text-sm"
                  >
                    <option value="a_vista" className="bg-[#0b1120]">À Vista</option>
                    <option value="financiado" className="bg-[#0b1120]">Financiado (FINAME/BNDES)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Origem do Equipamento
                  </label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                    placeholder="Ex: Brasil (SC)"
                    className="w-full h-11 px-3 glass-input rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Garantia Oferecida
                  </label>
                  <input
                    type="text"
                    value={formData.warranty}
                    onChange={(e) => setFormData(prev => ({ ...prev, warranty: e.target.value }))}
                    placeholder="Ex: 6 Meses de fábrica"
                    className="w-full h-11 px-3 glass-input rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Foto da Máquina *
                </label>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Current Image Preview */}
                  <div className="w-full sm:w-32 h-32 rounded-2xl overflow-hidden bg-[#0c1424] border border-white/10 flex-shrink-0">
                    <img 
                      src={formData.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80'} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80';
                      }}
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                    {/* Upload Area */}
                    <div className="relative group">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          try {
                            setSubmitting(true);
                            const { url } = await systemApi.uploadImage(file);
                            setFormData(prev => ({ ...prev, image_url: url }));
                            showToast('Imagem carregada com sucesso!');
                          } catch (err: any) {
                            showToast(err.response?.data?.error || 'Erro ao fazer upload da imagem.');
                          } finally {
                            setSubmitting(false);
                            // Allow selecting the same file again if a retry is needed.
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }
                        }}
                      />
                      <div 
                        className="h-11 px-4 border-2 border-dashed border-white/10 hover:border-[#00C2FF]/40 rounded-xl flex items-center justify-center gap-2 bg-white/[0.02] transition-all cursor-pointer"
                        onClick={() => {
                          console.log('Div clicked, triggering ref', fileInputRef.current);
                          fileInputRef.current?.click();
                        }}
                      >
                        <ImageIcon className="w-4 h-4 text-[#00C2FF]" />
                        <span className="text-xs font-bold text-gray-300">Fazer Upload de Foto</span>
                      </div>
                    </div>

                  </div>
                </div>


              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Descrição Técnica & Opcionais
                </label>
                <textarea
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detalhes de alimentadores, inversores, automação PLC, voltagem, ano de fabricação, estado de conservação e opcionais inclusos..."
                  className="w-full p-3 glass-input rounded-xl text-sm"
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
                    <span>{editingMachine ? 'Salvar Alterações' : 'Cadastrar Máquina'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert Modal */}
      {machineToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0B1120] w-full max-w-md rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-red-500/30 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-display font-bold text-lg text-white">
                Excluir Equipamento Têxtil?
              </h3>
              <p className="text-xs text-gray-300 mt-2">
                Tem certeza de que deseja remover permanentemente a máquina{' '}
                <strong className="text-white">"{machineToDelete.name}"</strong> (ID #{machineToDelete.id}) do banco de dados?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMachineToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50"
              >
                {deleting ? 'Removendo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ficha Técnica Modal */}
      {selectedMachineForSpecs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0B1120] w-full max-w-2xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="relative h-56 bg-[#090e18]">
              <img
                src={selectedMachineForSpecs.image_url}
                alt={selectedMachineForSpecs.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-black/40" />

              <button
                onClick={() => setSelectedMachineForSpecs(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-3 left-6 text-white">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#0066FF] border border-[#00C2FF]/40 text-white shadow-[0_0_12px_rgba(0,194,255,0.4)]">
                  Ficha Técnica Homologada
                </span>
                <h3 className="font-display font-extrabold text-2xl drop-shadow-md mt-1">
                  {selectedMachineForSpecs.name}
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/5">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Modelo Comercial</span>
                  <p className="text-sm font-bold text-white mt-0.5">{selectedMachineForSpecs.model}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/5">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Investimento</span>
                  <p className="text-sm font-bold text-[#00C2FF] mt-0.5">
                    {formatCurrency(selectedMachineForSpecs.price)}
                    <span className="block text-[10px] font-normal text-gray-400">
                      ({selectedMachineForSpecs.payment_type === 'financiado' ? 'FINAME / BNDES' : 'À Vista'})
                    </span>
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/5">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Disponibilidade</span>
                  <p className="text-sm font-bold text-emerald-400 capitalize mt-0.5">{selectedMachineForSpecs.status}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/5">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Origem</span>
                  <p className="text-sm font-bold text-white mt-0.5">{selectedMachineForSpecs.origin || 'Brasil'}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/5">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Garantia</span>
                  <p className="text-sm font-bold text-white mt-0.5">{selectedMachineForSpecs.warranty || '6 Meses'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-display font-bold text-sm text-white">Memorial Descritivo Completo</h4>
                <p className="text-xs text-gray-300 leading-relaxed mt-1.5 p-4 bg-white/[0.02] rounded-2xl border border-white/5 whitespace-pre-line">
                  {selectedMachineForSpecs.description || 'Sem especificações adicionais cadastradas.'}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleShare(selectedMachineForSpecs)}
                  className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.10] text-[#00C2FF] text-xs font-bold rounded-xl border border-white/10 flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartilhar Proposta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMachineForSpecs(null)}
                  className="px-5 py-2 btn-electric text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(0,102,255,0.4)]"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Compartilhamento da Ficha Técnica e Imagem para WhatsApp */}
      {machineToShare && (
        <ShareFichaModal
          machine={machineToShare}
          onClose={() => setMachineToShare(null)}
          onToast={showToast}
        />
      )}
    </div>
  );
};
