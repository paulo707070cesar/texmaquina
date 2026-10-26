import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowRight, Lock, Mail, User as UserIcon, CheckCircle2, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'vendedor'>('vendedor');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { login, register, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setLocalError(err.message || 'Erro na autenticação. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (type: 'admin' | 'vendedor') => {
    setLocalError(null);
    setLoading(true);
    try {
      await quickLogin(type);
      navigate(from, { replace: true });
    } catch (err: any) {
      setLocalError(err.message || 'Erro ao realizar login rápido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] bg-ambient-grid text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient neon sweeps */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-[#0066FF]/20 to-[#00C2FF]/15 blur-[120px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Top laser subtitle line matching BizNext reference */}
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-[#00C2FF]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#00C2FF]">
            Professional Textile Machinery OS
          </span>
          <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-[#00C2FF]" />
        </div>

        {/* Hero Headline with dual gradient matching reference */}
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
          Modern Platform for <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C2FF] via-[#0080FF] to-[#38BDF8] drop-shadow-[0_0_25px_rgba(0,194,255,0.4)]">
            Textile Mills & Sales
          </span>
        </h1>

        <p className="mt-2 text-xs text-gray-400 font-medium">
          Modern Layout for Textile Startups, Mills and Brokerage Companies
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-card py-8 px-6 sm:px-10 rounded-3xl border border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.6)]">
          {/* Mode Switch Tabs */}
          <div className="flex rounded-2xl bg-white/[0.05] p-1 mb-6 border border-white/[0.06]">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setLocalError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                !isRegister 
                  ? 'bg-gradient-to-r from-[#0066FF] to-[#00C2FF] text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Acesso ao Sistema
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setLocalError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                isRegister 
                  ? 'bg-gradient-to-r from-[#0066FF] to-[#00C2FF] text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Novo Cadastro
            </button>
          </div>

          {localError && (
            <div className="mb-5 p-3 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
              <span className="material-symbols-outlined text-sm mt-0.5 text-red-400">error</span>
              <span>{localError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Menezes"
                    className="w-full h-11 pl-10 pr-4 glass-input rounded-xl text-sm placeholder-gray-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                E-mail Corporativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendas@texmachina.com.br"
                  className="w-full h-11 pl-10 pr-4 glass-input rounded-xl text-sm placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-4 glass-input rounded-xl text-sm placeholder-gray-500"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Cargo / Função
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'vendedor')}
                  className="w-full h-11 px-3 glass-input rounded-xl text-sm"
                >
                  <option value="vendedor" className="bg-[#0b1120]">Representante Comercial (Vendedor)</option>
                  <option value="admin" className="bg-[#0b1120]">Diretoria Industrial (Administrador)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-3 btn-electric rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Finalizar Cadastro' : 'Entrar no Sistema'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-[10px] font-bold text-center text-[#00C2FF] uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Acesso Rápido de Demonstração (1 Clique)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuick('admin')}
                disabled={loading}
                className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#00C2FF]/40 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-[#00C2FF]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00C2FF]" />
                  <span>Admin / Gestor</span>
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 truncate block">admin@texmachina...</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuick('vendedor')}
                disabled={loading}
                className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-emerald-400/40 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Vendedor</span>
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 truncate block">vendedor@texmachina...</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Reassurance */}
        <div className="mt-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#00C2FF]" />
          <span>Autenticação JWT Segura • MySQL Hostinger Ready</span>
        </div>
      </div>
    </div>
  );
};
