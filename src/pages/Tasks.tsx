import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, Check, Clock3, ListTodo, Plus, Target, Trash2, Pencil, X, TrendingUp } from 'lucide-react';

type DailyTask = { id: string; weekday: number; time: string; title: string; notes: string; done: boolean };
type Goal = { id: string; title: string; deadline: string; progress: number; notes: string };
const weekdays = ['Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado','Domingo'];
const todayWeekday = (new Date().getDay() + 6) % 7;
const taskKey = (tenant: string) => `texmachina_daily_tasks_${tenant}`;
const goalKey = (tenant: string) => `texmachina_goals_${tenant}`;
const id = () => `item-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

export const Tasks: React.FC = () => {
  const { user } = useAuth();
  const tenant = String(user?.tenant_id || user?.tenant_name || user?.id || 'local');
  const location = useLocation();
  const goalsPage = location.pathname.endsWith('/metas');
  const [tasks,setTasks] = useState<DailyTask[]>([]);
  const [loadedTenant,setLoadedTenant] = useState<string|null>(null);
  const [goals,setGoals] = useState<Goal[]>([]);
  const [taskTitle,setTaskTitle] = useState('');
  const [taskDay,setTaskDay] = useState(todayWeekday);
  const [taskTime,setTaskTime] = useState('08:00');
  const [taskNotes,setTaskNotes] = useState('');
  const [goalTitle,setGoalTitle] = useState('');
  const [goalDeadline,setGoalDeadline] = useState('');
  const [goalNotes,setGoalNotes] = useState('');
  const [editingGoal,setEditingGoal] = useState<string|null>(null);

  useEffect(()=>{try{setTasks(JSON.parse(localStorage.getItem(taskKey(tenant))||'[]'));}catch{setTasks([])};try{setGoals(JSON.parse(localStorage.getItem(goalKey(tenant))||'[]'));}catch{setGoals([])}setLoadedTenant(tenant);},[tenant]);
  useEffect(()=>{if(loadedTenant===tenant)localStorage.setItem(taskKey(tenant),JSON.stringify(tasks));},[tasks,tenant,loadedTenant]);
  useEffect(()=>{if(loadedTenant===tenant)localStorage.setItem(goalKey(tenant),JSON.stringify(goals));},[goals,tenant,loadedTenant]);

  const dayTasks=useMemo(()=>tasks.filter(t=>t.weekday===taskDay).sort((a,b)=>a.time.localeCompare(b.time)),[tasks,taskDay]);
  const completed=tasks.filter(t=>t.done).length;
  const progress=tasks.length?Math.round(completed/tasks.length*100):0;
  const resetGoal=()=>{setGoalTitle('');setGoalDeadline('');setGoalNotes('');setEditingGoal(null);};
  const saveGoal=()=>{if(!goalTitle.trim())return;const item:Goal={id:editingGoal||id(),title:goalTitle.trim(),deadline:goalDeadline,progress:editingGoal?(goals.find(g=>g.id===editingGoal)?.progress||0):0,notes:goalNotes.trim()};setGoals(prev=>editingGoal?prev.map(g=>g.id===editingGoal?item:g):[item,...prev]);resetGoal();};
  const editGoal=(g:Goal)=>{setEditingGoal(g.id);setGoalTitle(g.title);setGoalDeadline(g.deadline);setGoalNotes(g.notes);window.scrollTo({top:0,behavior:'smooth'});};

  return <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div><div className="inline-flex items-center gap-2 text-[#00C2FF] text-xs uppercase tracking-widest font-bold"><ListTodo className="w-4 h-4"/> Organização pessoal</div><h1 className="text-3xl font-extrabold text-white mt-2">{goalsPage?'Metas a alcançar':'Tarefas diárias'}</h1><p className="text-sm text-gray-400 mt-1">{goalsPage?'Defina objetivos, acompanhe o progresso e mantenha o foco.':'Monte sua rotina semanal com horário e descrição de cada tarefa.'}</p></div>
      <div className="flex gap-2">
        <Link to="/tarefas" className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold ${!goalsPage?'btn-electric':'bg-white/5 text-gray-300 hover:bg-white/10'}`}><ListTodo className="w-4 h-4"/> Rotina</Link>
        <Link to="/tarefas/metas" className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold ${goalsPage?'btn-electric':'bg-white/5 text-gray-300 hover:bg-white/10'}`}><Target className="w-4 h-4"/> Metas</Link>
      </div>
    </header>
    {!goalsPage ? <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5"><p className="text-xs text-gray-400">Tarefas cadastradas</p><p className="text-3xl font-black text-white mt-2">{tasks.length}</p></div>
        <div className="glass-card rounded-2xl p-5"><p className="text-xs text-gray-400">Concluídas</p><p className="text-3xl font-black text-emerald-400 mt-2">{completed}</p></div>
        <div className="glass-card rounded-2xl p-5"><p className="text-xs text-gray-400">Progresso geral</p><p className="text-3xl font-black text-[#00C2FF] mt-2">{progress}%</p><div className="h-2 rounded-full bg-white/10 mt-3 overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{width:`${progress}%`}}/></div></div>
      </div>
      <section className="glass-card rounded-3xl p-5 sm:p-6 space-y-5">
        <div><h2 className="text-lg font-bold text-white">Cadastrar tarefa semanal</h2><p className="text-xs text-gray-400 mt-1">Escolha o dia, horário e o que precisa fazer.</p></div>
        <form onSubmit={e=>{e.preventDefault();if(!taskTitle.trim())return;setTasks(prev=>[...prev,{id:id(),weekday:taskDay,time:taskTime,title:taskTitle.trim(),notes:taskNotes.trim(),done:false}]);setTaskTitle('');setTaskNotes('');}} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <label className="md:col-span-3 text-xs text-gray-400 space-y-2">Dia da semana<select value={taskDay} onChange={e=>setTaskDay(Number(e.target.value))} className="glass-input w-full rounded-xl p-3 text-sm">{weekdays.map((d,i)=><option key={d} value={i}>{d}</option>)}</select></label>
          <label className="md:col-span-2 text-xs text-gray-400 space-y-2">Horário<input type="time" value={taskTime} onChange={e=>setTaskTime(e.target.value)} className="glass-input w-full rounded-xl p-3 text-sm"/></label>
          <label className="md:col-span-5 text-xs text-gray-400 space-y-2">Tarefa<input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} placeholder="Ex.: revisar pedidos e responder clientes" className="glass-input w-full rounded-xl p-3 text-sm" required/></label>
          <div className="md:col-span-2 flex items-end"><button type="submit" className="btn-electric w-full rounded-xl p-3 text-sm font-bold flex justify-center gap-2"><Plus className="w-4 h-4"/>Adicionar</button></div>
          <label className="md:col-span-12 text-xs text-gray-400 space-y-2">Observações (opcional)<input value={taskNotes} onChange={e=>setTaskNotes(e.target.value)} placeholder="Detalhes ou lembretes" className="glass-input w-full rounded-xl p-3 text-sm"/></label>
        </form>
      </section>
      <section className="glass-card rounded-3xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5"><h2 className="text-lg font-bold text-white">Minha programação</h2><select value={taskDay} onChange={e=>setTaskDay(Number(e.target.value))} className="glass-input rounded-xl px-3 py-2 text-sm">{weekdays.map((d,i)=><option key={d} value={i}>{d}</option>)}</select></div>
        {dayTasks.length===0?<div className="py-10 text-center text-sm text-gray-500">Nenhuma tarefa cadastrada para {weekdays[taskDay].toLowerCase()}.</div>:<div className="space-y-2">{dayTasks.map(t=><article key={t.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3"><button onClick={()=>setTasks(prev=>prev.map(x=>x.id===t.id?{...x,done:!x.done}:x))} aria-label="Marcar tarefa" className={`w-6 h-6 rounded-lg border flex items-center justify-center ${t.done?'bg-emerald-500 border-emerald-500 text-white':'border-white/20 text-transparent'}`}><Check className="w-4 h-4"/></button><span className="text-xs text-[#00C2FF] font-bold min-w-12 flex items-center gap-1"><Clock3 className="w-3.5 h-3.5"/>{t.time}</span><div className="min-w-0 flex-1"><p className={`text-sm font-semibold ${t.done?'text-gray-500 line-through':'text-white'}`}>{t.title}</p>{t.notes&&<p className="text-xs text-gray-500 mt-1">{t.notes}</p>}</div><button onClick={()=>setTasks(prev=>prev.filter(x=>x.id!==t.id))} aria-label="Excluir tarefa" className="p-2 text-gray-500 hover:text-red-300"><Trash2 className="w-4 h-4"/></button></article>)}</div>}
      </section>
    </>:<>
      <section className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2"><div><h2 className="text-lg font-bold text-white">{editingGoal?'Editar meta':'Nova meta'}</h2><p className="text-xs text-gray-400 mt-1">Escreva um objetivo claro e uma data para alcançá-lo.</p></div>{editingGoal&&<button onClick={resetGoal} className="text-gray-400 p-2"><X className="w-4 h-4"/></button>}</div>
        <form onSubmit={e=>{e.preventDefault();saveGoal();}} className="grid grid-cols-1 md:grid-cols-12 gap-3"><label className="md:col-span-7 text-xs text-gray-400 space-y-2">Meta / objetivo<input value={goalTitle} onChange={e=>setGoalTitle(e.target.value)} required placeholder="Ex.: aumentar as vendas em 20%" className="glass-input w-full rounded-xl p-3 text-sm"/></label><label className="md:col-span-3 text-xs text-gray-400 space-y-2">Prazo<input type="date" value={goalDeadline} onChange={e=>setGoalDeadline(e.target.value)} className="glass-input w-full rounded-xl p-3 text-sm"/></label><div className="md:col-span-2 flex items-end"><button className="btn-electric w-full rounded-xl p-3 text-sm font-bold"><Plus className="w-4 h-4 inline mr-1"/>{editingGoal?'Salvar':'Criar meta'}</button></div><label className="md:col-span-12 text-xs text-gray-400 space-y-2">Plano / observações<textarea value={goalNotes} onChange={e=>setGoalNotes(e.target.value)} rows={2} placeholder="Etapas para atingir esta meta" className="glass-input w-full rounded-xl p-3 text-sm"/></label></form>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">{goals.length===0?<div className="glass-card rounded-2xl p-10 text-center text-sm text-gray-500 md:col-span-2">Ainda não há metas. Cadastre seu primeiro objetivo acima.</div>:goals.map(g=><article key={g.id} className="glass-card rounded-2xl p-5 space-y-3"><div className="flex items-start gap-3"><div className="rounded-xl bg-[#0066FF]/20 text-[#00C2FF] p-2"><Target className="w-5 h-5"/></div><div className="min-w-0 flex-1"><h3 className="font-bold text-white">{g.title}</h3>{g.deadline&&<p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><CalendarDays className="w-3 h-3"/>Prazo: {new Date(g.deadline+'T12:00:00').toLocaleDateString('pt-BR')}</p>}</div><button onClick={()=>editGoal(g)} aria-label="Editar meta" className="p-1.5 text-gray-400 hover:text-[#00C2FF]"><Pencil className="w-4 h-4"/></button><button onClick={()=>setGoals(prev=>prev.filter(x=>x.id!==g.id))} aria-label="Excluir meta" className="p-1.5 text-gray-400 hover:text-red-300"><Trash2 className="w-4 h-4"/></button></div>{g.notes&&<p className="text-xs text-gray-400">{g.notes}</p>}<div><div className="flex justify-between text-xs mb-2"><span className="text-gray-400">Progresso</span><strong className="text-[#00C2FF]">{g.progress}%</strong></div><input type="range" min="0" max="100" step="5" value={g.progress} onChange={e=>setGoals(prev=>prev.map(x=>x.id===g.id?{...x,progress:Number(e.target.value)}:x))} className="w-full accent-cyan-400"/><div className="h-2 bg-white/10 rounded-full overflow-hidden mt-1"><div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{width:`${g.progress}%`}}/></div></div><div className="text-xs text-gray-500 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5"/>Atualize a barra conforme avançar.</div></article>)}</section>
    </>}
  </div>;
};
