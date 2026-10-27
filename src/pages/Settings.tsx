import React, { useState, useEffect } from 'react';
import { settingsApi, categoriesApi, systemApi, Tenant, Category } from '../services/api';
import { 
  Building2, 
  Image as ImageIcon, 
  Trash2, 
  Plus, 
  Save, 
  Check, 
  AlertCircle,
  Layout
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Settings form
  const [tenantName, setTenantName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Category form
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tData, cData] = await Promise.all([
        settingsApi.get(),
        categoriesApi.list()
      ]);
      setTenant(tData);
      setTenantName(tData.name);
      setLogoUrl(tData.logo_url || '');
      setCategories(cData);
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await settingsApi.update({ name: tenantName, logo_url: logoUrl || null });
      showToast('Configurações salvas com sucesso!');
      // Update local storage name if changed
      const savedUser = localStorage.getItem('texmachina_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        user.tenant_name = tenantName;
        localStorage.setItem('texmachina_user', JSON.stringify(user));
        // Refresh page to sync navbar
        window.location.reload();
      }
    } catch (err) {
      showToast('Erro ao salvar configurações.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('Preencha o nome da categoria.', 'error');
      return;
    }
    setSavingCategory(true);
    try {
      await categoriesApi.create({ name: newCatName, image_url: '' });
      showToast('Categoria adicionada!');
      setNewCatName('');
      const data = await categoriesApi.list();
      setCategories(data);
    } catch (err) {
      showToast('Erro ao adicionar categoria.', 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Excluir esta categoria de máquina?')) return;
    try {
      await categoriesApi.delete(id);
      showToast('Categoria removida.');
      setCategories(categories.filter(c => c.id !== id));
    } catch (err) {
      showToast('Erro ao remover categoria.', 'error');
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSavingSettings(true);
      const { url } = await systemApi.uploadImage(file);
      setLogoUrl(url);
      showToast('Logo carregada!');
    } catch (err) {
      showToast('Erro no upload.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-[#00C2FF] animate-spin shadow-[0_0_20px_rgba(0,194,255,0.4)]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-[#0066FF] border border-[#00C2FF] text-white' : 'bg-red-600 border border-red-400 text-white'
        }`}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2">
          <span className="w-4 h-[1px] bg-[#00C2FF]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#00C2FF]">
            Platform Customization
          </span>
        </div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
          Configurações da Empresa
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile / Branding Section */}
        <section className="glass-card rounded-3xl p-6 border border-white/10 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Layout className="w-5 h-5 text-[#00C2FF]" />
            <h2 className="font-display font-bold text-white">Identidade Visual</h2>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Nome do Aplicativo / Empresa</label>
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full h-11 px-4 glass-input rounded-xl text-sm"
                placeholder="Ex: Minha Empresa Industrial"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Logotipo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-[#0c1424] border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-8 h-8 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="relative group cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogo}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="h-10 px-4 border border-dashed border-white/20 group-hover:border-[#00C2FF]/50 rounded-xl flex items-center justify-center gap-2 bg-white/[0.02] transition-all">
                      <ImageIcon className="w-4 h-4 text-[#00C2FF]" />
                      <span className="text-[10px] font-bold text-gray-300 uppercase">Alterar Logo</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full h-9 px-3 glass-input rounded-xl text-[11px]"
                    placeholder="URL da logo (opcional)"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full h-11 btn-electric rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,102,255,0.3)] disabled:opacity-50"
            >
              {savingSettings ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Salvar Alterações</span>
            </button>
          </form>
        </section>

        {/* Categories Section */}
        <section className="glass-card rounded-3xl p-6 border border-white/10 space-y-6 flex flex-col h-full">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Plus className="w-5 h-5 text-[#00C2FF]" />
            <h2 className="font-display font-bold text-white">Categorias de Máquinas</h2>
          </div>

          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nome da categoria (ex: Tear Circular)"
                className="w-full h-11 px-4 glass-input rounded-xl text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={savingCategory}
              className="w-full h-11 bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 rounded-xl font-bold text-xs text-[#00C2FF] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {savingCategory ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Adicionar Categoria</span>
            </button>
          </form>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
            {categories.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-10">Nenhuma categoria cadastrada.</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 group">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center border border-white/10 text-[#00C2FF]">
                      <Plus className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold text-gray-300">{cat.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
