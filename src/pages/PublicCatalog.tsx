import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Building2, Download, Search, Share2, MessageCircle, LoaderCircle } from 'lucide-react';
import { catalogApi, PublicCatalogData, PublicCatalogMachine } from '../services/api';

export const PublicCatalog: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [data, setData] = useState<PublicCatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');

  useEffect(() => {
    let active = true;
    const load = async () => {
      const id = Number(tenantId);
      if (!Number.isInteger(id) || id <= 0) { setError('O link do catálogo é inválido.'); setLoading(false); return; }
      try {
        const result = await catalogApi.getPublic(id);
        if (active) setData(result);
      } catch (err: any) {
        if (active) setError(err?.response?.data?.error || 'Não foi possível carregar este catálogo.');
      } finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [tenantId]);

  const categories = useMemo(() => {
    const names = (data?.machines || []).map(m => m.category_name).filter((n): n is string => Boolean(n));
    return ['Todas', ...Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [data]);

  const machines = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('pt-BR');
    return (data?.machines || []).filter(m => {
      const matchCategory = category === 'Todas' || m.category_name === category;
      const text = [m.name, m.model, m.description, m.category_name, m.origin].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
      return matchCategory && (!q || text.includes(q));
    });
  }, [data, search, category]);

  const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(Number(value) || 0);
  const shareText = (machine?: PublicCatalogMachine) => {
    const link = machine ? window.location.origin + '/catalogo/' + tenantId + '#maquina-' + machine.id : window.location.href;
    const message = machine
      ? 'Confira este equipamento no catálogo da ' + (data?.tenant.name || 'empresa') + ': ' + machine.name + ' (' + machine.model + '). ' + link
      : 'Confira o catálogo de máquinas da ' + (data?.tenant.name || 'empresa') + ': ' + link;
    window.open('https://wa.me/?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); alert('Link do catálogo copiado.'); }
    catch { shareText(); }
  };

  if (loading) return <div className="min-h-[70vh] flex items-center justify-center text-gray-300 gap-3"><LoaderCircle className="animate-spin" /> Carregando catálogo...</div>;
  if (error || !data) return <div className="min-h-[70vh] max-w-xl mx-auto px-5 flex flex-col items-center justify-center text-center gap-4"><AlertCircle className="w-12 h-12 text-[#00C2FF]" /><h1 className="text-2xl font-bold text-white">Catálogo indisponível</h1><p className="text-gray-400">{error || 'Este catálogo não está disponível no momento.'}</p><p className="text-xs text-gray-500">Se você administra esta empresa, entre nas configurações do TexMachina e publique o catálogo.</p></div>;

  return <div className="min-h-screen bg-[#080C14] text-[#E2E8F0]">
    <style>{`
      @media print {
        @page { size: A4; margin: 12mm; }
        body { background: #fff !important; color: #111827 !important; }
        .catalog-print, .catalog-print * { color: #111827 !important; background-color: transparent !important; box-shadow: none !important; text-shadow: none !important; }
        .catalog-print { max-width: none !important; padding: 0 !important; }
        .catalog-card { border: 1px solid #d1d5db !important; break-inside: avoid; page-break-inside: avoid; }
        .catalog-card img { max-height: 55mm !important; object-fit: contain !important; }
        .no-print { display: none !important; }
        .catalog-grid { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 8mm !important; }
        .catalog-header { border-bottom: 2px solid #111827 !important; }
      }
    `}</style>
    <main className="catalog-print max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <header className="catalog-header flex flex-col md:flex-row md:items-center md:justify-between gap-5 pb-7 border-b border-white/10 mb-7">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
            {data.tenant.logo_url ? <img src={data.tenant.logo_url} alt={'Logo ' + data.tenant.name} className="w-full h-full object-contain" /> : <Building2 className="w-8 h-8 text-[#0066FF]" />}
          </div>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00C2FF]">Catálogo comercial</p><h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{data.tenant.name}</h1><p className="text-sm text-gray-400 mt-1">Máquinas industriais disponíveis</p></div>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <button onClick={copyLink} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold hover:bg-white/5"><Share2 className="w-4 h-4" /> Copiar link</button>
          <button onClick={() => shareText()} className="inline-flex items-center gap-2 rounded-xl bg-[#087F5B] px-4 py-3 text-sm font-bold text-white hover:bg-[#099268]"><MessageCircle className="w-4 h-4" /> Compartilhar no WhatsApp</button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#00C2FF] px-4 py-3 text-sm font-bold text-white"><Download className="w-4 h-4" /> Gerar PDF / Imprimir</button>
        </div>
      </header>
      <section className="no-print mb-7 space-y-4">
        <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00C2FF]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por máquina, modelo ou descrição..." className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white outline-none focus:border-[#00C2FF]/60" /></div>
        <div className="flex gap-2 overflow-x-auto pb-1">{categories.map(n => <button key={n} onClick={() => setCategory(n)} className={'shrink-0 rounded-full px-4 py-2 text-xs font-bold border transition-colors ' + (category === n ? 'bg-[#0066FF] border-[#00C2FF] text-white' : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5')}>{n}</button>)}</div>
      </section>
      <div className="flex items-center justify-between gap-3 mb-5"><h2 className="text-lg font-bold text-white">Equipamentos</h2><span className="text-xs text-gray-400">{machines.length} {machines.length === 1 ? 'máquina' : 'máquinas'}</span></div>
      {machines.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center"><Building2 className="w-10 h-10 mx-auto text-gray-500 mb-3" /><h3 className="font-bold text-white">{data.machines.length === 0 ? 'Nenhuma máquina publicada ainda' : 'Nenhum resultado encontrado'}</h3><p className="text-sm text-gray-400 mt-2">{data.machines.length === 0 ? 'Os equipamentos disponíveis aparecerão aqui quando forem cadastrados.' : 'Tente alterar a busca ou selecionar outra categoria.'}</p></div> :
        <div className="catalog-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {machines.map(m => <article id={'maquina-' + m.id} key={m.id} className="catalog-card rounded-2xl overflow-hidden border border-white/10 bg-[#0E1626] flex flex-col">
            <div className="h-56 bg-[#0A101C] flex items-center justify-center overflow-hidden">{m.image_url ? <img src={m.image_url} alt={m.name} loading="lazy" className="w-full h-full object-contain p-3" /> : <Building2 className="w-14 h-14 text-gray-600" />}</div>
            <div className="p-5 flex flex-col gap-3 flex-1">
              <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-wider text-[#00C2FF]">{m.category_name || 'Máquina industrial'}</span><span className="text-[10px] font-semibold rounded-full px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Disponível</span></div>
              <h3 className="text-lg font-bold text-white leading-snug">{m.name}</h3><p className="text-xs text-gray-400">Modelo: {m.model || 'Sob consulta'}</p>
              {m.description && <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{m.description}</p>}
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">{m.origin && <div><span className="block text-gray-500 mb-1">Origem</span>{m.origin}</div>}{m.warranty && <div><span className="block text-gray-500 mb-1">Garantia</span>{m.warranty}</div>}</div>
              <div className="mt-auto pt-3 border-t border-white/10 flex items-center justify-between gap-2"><div><span className="block text-[10px] uppercase tracking-wider text-gray-500">Investimento</span><strong className="text-base text-white">{data.tenant.catalog_show_prices && m.price !== null ? currency(m.price) : 'Preço sob consulta'}</strong></div><button className="no-print inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-gray-200 hover:bg-white/5" onClick={() => shareText(m)}><Share2 className="w-3.5 h-3.5" /> Compartilhar</button></div>
            </div>
          </article>)}
        </div>}
      <footer className="mt-12 pt-5 border-t border-white/10 text-center text-xs text-gray-500">Catálogo comercial de {data.tenant.name} · Informações sujeitas à confirmação de disponibilidade.</footer>
    </main>
  </div>;
};
