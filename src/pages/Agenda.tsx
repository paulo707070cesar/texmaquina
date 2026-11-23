import React, { useEffect, useMemo, useState } from 'react';
import { leadsApi, Lead } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Clock3, MapPin, UserRound, Pencil, Trash2, X, CheckCircle2, CalendarCheck, ListTodo } from 'lucide-react';

type Appointment = { id: string; title: string; date: string; time: string; kind: string; client: string; location: string; notes: string; done: boolean };
const pad = (n: number) => String(n).padStart(2, '0');
const localDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
const fromDate = (value: string) => new Date(value + 'T12:00:00');
const formatDate = (value: string) => fromDate(value).toLocaleDateString('pt-BR', {day:'2-digit',month:'long',year:'numeric'});
const emptyForm = (date: string): Appointment => ({id:'',title:'',date,time:'09:00',kind:'Reunião',client:'',location:'',notes:'',done:false});

export const Agenda: React.FC = () => {
  const { user } = useAuth();
  const storageKey = `texmachina_agenda_${user?.tenant_id || user?.tenant_name || user?.id || 'local'}`;
  const [items,setItems] = useState<Appointment[]>([]);
  const [leads,setLeads] = useState<Lead[]>([]);
  const [selectedDate,setSelectedDate] = useState(localDate(new Date()));
  const [month,setMonth] = useState(new Date(new Date().getFullYear(),new Date().getMonth(),1));
  const [modal,setModal] = useState(false);
  const [form,setForm] = useState<Appointment>(emptyForm(selectedDate));
  const [saving,setSaving] = useState(false);

  useEffect(()=>{ try { const saved=localStorage.getItem(storageKey); if(saved) setItems(JSON.parse(saved)); } catch { setItems([]); } },[storageKey]);
  useEffect(()=>{ try { localStorage.setItem(storageKey,JSON.stringify(items)); } catch(e){ console.warn('Agenda local indisponível',e); } },[items,storageKey]);
  useEffect(()=>{ leadsApi.list().then(setLeads).catch(()=>setLeads([])); },[]);

  const leadEvents = useMemo(()=>leads.filter(l=>l.status!=='fechado'&&l.follow_up_date).map(l=>({
    id:`lead-${l.id}`,title:`Follow-up: ${l.client_name}`,date:String(l.follow_up_date).slice(0,10),time:'09:00',kind:'Follow-up',client:l.client_name,location:'',notes:l.machine_name||'Retomar contato comercial',done:false,lead:l
  })),[leads]);
  const allEvents = useMemo(()=>[...items,...leadEvents], [items,leadEvents]);
  const selectedEvents = useMemo(()=>allEvents.filter(e=>e.date===selectedDate).sort((a,b)=>a.time.localeCompare(b.time)),[allEvents,selectedDate]);
  const monthDays = useMemo(()=>{
    const first=new Date(month.getFullYear(),month.getMonth(),1);
    const start=new Date(first); start.setDate(first.getDate()-((first.getDay()+6)%7));
    return Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d;});
  },[month]);
  const monthLabel=month.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  const openNew=()=>{setForm(emptyForm(selectedDate));setModal(true);};
  const editItem=(item:Appointment)=>{setForm({...item});setModal(true);};
  const save=()=>{if(!form.title.trim()||!form.date)return;setSaving(true);const next={...form,id:form.id||`evt-${Date.now()}`};setItems(prev=>form.id?prev.map(x=>x.id===form.id?next:x):[...prev,next]);setSelectedDate(form.date);setMonth(new Date(fromDate(form.date).getFullYear(),fromDate(form.date).getMonth(),1));setModal(false);setSaving(false);};
  const toggleDone=(item:Appointment)=>{if(item.id.startsWith('lead-'))return;setItems(prev=>prev.map(x=>x.id===item.id?{...x,done:!x.done}:x));};
  const remove=(item:Appointment)=>{if(item.id.startsWith('lead-'))return;if(confirm('Excluir este compromisso da agenda?'))setItems(prev=>prev.filter(x=>x.id!==item.id));};
  const changeMonth=(delta:number)=>setMonth(new Date(month.getFullYear(),month.getMonth()+delta,1));

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div><div className="inline-flex items-center gap-2 text-[#00C2FF] text-xs uppercase tracking-widest font-bold"><CalendarDays className="w-4 h-4"/> Planejamento comercial</div><h1 className="text-3xl font-extrabold text-white mt-2">Agenda</h1><p className="text-sm text-gray-400 mt-1">Organize visitas, reuniões, demonstrações e retornos de clientes.</p></div>
      <button onClick={openNew} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl btn-electric font-bold text-sm"><Plus className="w-4 h-4"/> Novo compromisso</button>
    </header>
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)] gap-5">
      <section className="glass-card border border-white/10 rounded-3xl p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-[#0066FF]/20 text-[#00C2FF] flex items-center justify-center"><CalendarDays className="w-5 h-5"/></div><div><h2 className="text-lg font-bold text-white capitalize">{monthLabel}</h2><p className="text-xs text-gray-500">Selecione um dia para ver os eventos</p></div></div>
          <div className="flex gap-1"><button onClick={()=>changeMonth(-1)} aria-label="Mês anterior" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"><ChevronLeft className="w-5 h-5"/></button><button onClick={()=>{const now=new Date();setMonth(new Date(now.getFullYear(),now.getMonth(),1));setSelectedDate(localDate(now));}} className="px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-200">Hoje</button><button onClick={()=>changeMonth(1)} aria-label="Próximo mês" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"><ChevronRight className="w-5 h-5"/></button></div>
        </div>
        <div className="grid grid-cols-7 mb-2">{['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d=><div key={d} className="text-center text-[10px] sm:text-xs text-gray-500 font-bold py-2">{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">{monthDays.map((day,i)=>{const date=localDate(day);const dayEvents=allEvents.filter(e=>e.date===date);const inMonth=day.getMonth()===month.getMonth();const isToday=date===localDate(new Date());const selected=date===selectedDate;return <button key={i} onClick={()=>setSelectedDate(date)} className={`relative min-h-[54px] sm:min-h-[76px] rounded-xl border p-1.5 sm:p-2 text-left transition-all ${selected?'bg-[#0066FF]/25 border-[#00C2FF]/60 ring-1 ring-[#00C2FF]/30':inMonth?'bg-white/[0.025] border-white/[0.06] hover:bg-white/[0.07]':'bg-transparent border-transparent opacity-35'}`}>
            <span className={`text-xs sm:text-sm font-semibold ${isToday?'inline-flex w-6 h-6 items-center justify-center rounded-full bg-[#00C2FF] text-[#06111d]':selected?'text-white':'text-gray-300'}`}>{day.getDate()}</span>
            {dayEvents.length>0&&<div className="mt-1 flex flex-wrap gap-0.5 sm:gap-1">{dayEvents.slice(0,3).map((e,j)=><span key={e.id} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${e.kind==='Follow-up'?'bg-amber-400':e.done?'bg-emerald-400':'bg-[#00C2FF]'}`} />)}{dayEvents.length>3&&<span className="text-[8px] text-gray-400">+{dayEvents.length-3}</span>}</div>}
          </button>;})}</div>
        <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-white/10 text-[11px] text-gray-400"><span className="flex items-center gap-2"><i className="w-2 h-2 rounded-full bg-[#00C2FF]"/>Compromissos</span><span className="flex items-center gap-2"><i className="w-2 h-2 rounded-full bg-amber-400"/>Follow-ups de leads</span><span className="flex items-center gap-2"><i className="w-2 h-2 rounded-full bg-emerald-400"/>Concluídos</span></div>
      </section>
      <section className="glass-card border border-white/10 rounded-3xl p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10"><div><p className="text-[10px] uppercase tracking-widest text-[#00C2FF] font-bold">Programação do dia</p><h2 className="text-xl font-extrabold text-white mt-1">{formatDate(selectedDate)}</h2><p className="text-xs text-gray-400 mt-1">{selectedEvents.length} compromisso(s)</p></div><button onClick={openNew} className="p-2 rounded-xl bg-[#0066FF]/20 text-[#00C2FF] hover:bg-[#0066FF]/35" aria-label="Adicionar compromisso"><Plus className="w-5 h-5"/></button></div>
        <div className="space-y-3 mt-4 max-h-[540px] overflow-y-auto pr-1">
          {selectedEvents.length===0?<div className="py-12 text-center"><CalendarCheck className="w-10 h-10 mx-auto text-gray-600 mb-3"/><p className="text-sm font-semibold text-gray-300">Dia livre</p><p className="text-xs text-gray-500 mt-1">Nenhum compromisso agendado.</p><button onClick={openNew} className="mt-4 text-xs text-[#00C2FF] font-bold hover:underline">Agendar neste dia</button></div>:selectedEvents.map((event:any)=><article key={event.id} className={`p-4 rounded-2xl border ${event.done?'border-emerald-500/20 bg-emerald-500/[0.04]':'border-white/10 bg-white/[0.025]'}`}>
            <div className="flex gap-3"><div className={`w-1 rounded-full self-stretch ${event.kind==='Follow-up'?'bg-amber-400':'bg-[#00C2FF]'}`}/><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className={`font-bold text-sm ${event.done?'text-gray-400 line-through':'text-white'}`}>{event.title}</h3>{!event.id.startsWith('lead-')&&<div className="flex gap-1 shrink-0"><button onClick={()=>editItem(event)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400" aria-label="Editar"><Pencil className="w-3.5 h-3.5"/></button><button onClick={()=>remove(event)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-300" aria-label="Excluir"><Trash2 className="w-3.5 h-3.5"/></button></div>}</div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-400"><span className="flex items-center gap-1"><Clock3 className="w-3 h-3 text-[#00C2FF]"/>{event.time||'Sem horário'}</span>{event.client&&<span className="flex items-center gap-1"><UserRound className="w-3 h-3"/>{event.client}</span>}{event.location&&<span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{event.location}</span>}</div>
              {event.notes&&<p className="text-xs text-gray-400 mt-2 leading-relaxed">{event.notes}</p>}
              {event.id.startsWith('lead-')?<span className="inline-block mt-3 text-[10px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">Follow-up do cadastro de clientes</span>:<button onClick={()=>toggleDone(event)} className={`mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border ${event.done?'text-emerald-300 border-emerald-500/20 bg-emerald-500/10':'text-gray-300 border-white/10 hover:bg-white/5'}`}><CheckCircle2 className="w-3.5 h-3.5"/>{event.done?'Concluído':'Marcar como concluído'}</button>}
            </div></div></article>)}
        </div>
      </section>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><div className="glass-card border border-white/10 rounded-2xl p-4 flex items-center gap-3"><CalendarCheck className="w-5 h-5 text-[#00C2FF]"/><div><p className="text-xs text-gray-400">Compromissos cadastrados</p><p className="text-xl font-extrabold text-white">{items.length}</p></div></div><div className="glass-card border border-white/10 rounded-2xl p-4 flex items-center gap-3"><ListTodo className="w-5 h-5 text-amber-400"/><div><p className="text-xs text-gray-400">Follow-ups ativos</p><p className="text-xl font-extrabold text-white">{leadEvents.length}</p></div></div><div className="glass-card border border-white/10 rounded-2xl p-4 flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400"/><div><p className="text-xs text-gray-400">Concluídos</p><p className="text-xl font-extrabold text-white">{items.filter(i=>i.done).length}</p></div></div></div>
    {modal&&<div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm" onClick={()=>setModal(false)}><form onSubmit={e=>{e.preventDefault();save();}} onClick={e=>e.stopPropagation()} className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0B1322] border border-white/10 shadow-2xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-widest text-[#00C2FF] font-bold">Agenda comercial</p><h2 className="text-xl font-extrabold text-white mt-1">{form.id?'Editar compromisso':'Novo compromisso'}</h2></div><button type="button" onClick={()=>setModal(false)} className="p-2 rounded-lg text-gray-400 hover:bg-white/10"><X className="w-5 h-5"/></button></div>
      <label className="block text-xs font-semibold text-gray-300">Título *<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Ex.: Visita técnica à malharia" className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm text-white outline-none focus:border-[#00C2FF]/50"/></label>
      <div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-gray-300">Data *<input type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm text-white"/></label><label className="text-xs font-semibold text-gray-300">Horário<input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm text-white"/></label></div>
      <label className="block text-xs font-semibold text-gray-300">Tipo<select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value})} className="mt-1.5 w-full rounded-xl bg-[#111c2e] border border-white/10 px-3 py-3 text-sm text-white"><option>Reunião</option><option>Visita técnica</option><option>Demonstração</option><option>Ligação</option><option>Entrega</option><option>Outro</option></select></label>
      <label className="block text-xs font-semibold text-gray-300">Cliente (opcional)<select value={form.client} onChange={e=>setForm({...form,client:e.target.value})} className="mt-1.5 w-full rounded-xl bg-[#111c2e] border border-white/10 px-3 py-3 text-sm text-white"><option value="">Sem cliente vinculado</option>{leads.map(l=><option key={l.id} value={l.client_name}>{l.client_name}</option>)}</select></label>
      <label className="block text-xs font-semibold text-gray-300">Local<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Endereço ou local da reunião" className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm text-white"/></label>
      <label className="block text-xs font-semibold text-gray-300">Observações<textarea rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Detalhes, pauta ou o que levar..." className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm text-white"/></label>
      <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={()=>setModal(false)} className="px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/5">Cancelar</button><button disabled={saving} className="px-5 py-2.5 rounded-xl btn-electric text-sm font-bold disabled:opacity-50">{saving?'Salvando...':'Salvar compromisso'}</button></div>
    </form></div>}
  </div>;
};
