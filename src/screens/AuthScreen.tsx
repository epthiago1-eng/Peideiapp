import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { syncManager } from '../sync';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
  showToast: (msg: string) => void;
}

type Mode = 'login' | 'signup' | 'forgot';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, showToast }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('ep.Thiago1@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (mode === 'forgot') {
      if (!email.trim()) {
        setErrorMessage('Informe seu e-mail para receber as instruções.');
        return;
      }
      setLoading(true);
      const res = await syncManager.resetPassword(email.trim());
      setLoading(false);
      if (res.success) {
        setInfoMessage('E-mail de recuperação enviado com sucesso. Verifique sua caixa de entrada.');
        showToast('Link de recuperação enviado');
      } else {
        setErrorMessage(res.error || 'Erro ao solicitar recuperação.');
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Preencha seu e-mail e sua senha.');
      return;
    }

    setLoading(true);

    if (mode === 'login') {
      const res = await syncManager.signIn(email.trim(), password);
      setLoading(false);

      if (res.success) {
        showToast('Conectado ao Supabase com sucesso');
        const user = syncManager.getUser();
        if (user) {
          onLoginSuccess(user);
        }
      } else {
        const err = res.error || '';
        if (err.toLowerCase().includes('invalid login credentials')) {
          setErrorMessage('E-mail ou senha incorretos no Supabase. Se ainda não possui conta com esta senha, clique na aba "Criar conta" acima.');
        } else if (err.toLowerCase().includes('email not confirmed')) {
          setErrorMessage('E-mail ainda não confirmado no Supabase. Para acesso instantâneo sem confirmação por link, desmarque "Confirm email" em Authentication > Providers > Email no painel do Supabase.');
        } else {
          setErrorMessage(err || 'Falha ao autenticar.');
        }
      }
    } else if (mode === 'signup') {
      const res = await syncManager.signUp(email.trim(), password);
      setLoading(false);

      if (res.success) {
        if (res.confirmNeeded) {
          setInfoMessage('Conta cadastrada no Supabase! Se o login falhar por confirmação, desmarque "Confirm email" no painel do Supabase para acesso imediato.');
          setMode('login');
        } else {
          showToast('Conta criada com sucesso!');
          const user = syncManager.getUser();
          if (user) {
            onLoginSuccess(user);
          }
        }
      } else {
        setErrorMessage(res.error || 'Erro ao criar conta.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] dark:bg-[#000000] text-[#111114] dark:text-[#f5f5f7] flex flex-col justify-center items-center px-4 py-8">
      {/* Container principal */}
      <div className="w-full max-w-[420px] rounded-[28px] bg-white dark:bg-[#1c1c1e] p-7 shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none border border-black/[0.06] dark:border-white/[0.08] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Logo 84px com gradiente azul/índigo */}
        <div className="flex justify-center mb-4">
          <div
            style={{
              background: 'linear-gradient(135deg, #0a84ff 0%, #5e5ce6 60%, #bf5af2 120%)',
              boxShadow: '0 8px 24px rgba(10,132,255,0.3)',
            }}
            className="flex h-[84px] w-[84px] items-center justify-center rounded-[24px] text-white font-extrabold text-[36px] tracking-tight select-none"
          >
            R$
          </div>
        </div>

        {/* Título & Descrição */}
        <div className="text-center mb-6">
          <h1 className="text-[24px] font-extrabold tracking-tight">RotaPay</h1>
          <p className="text-[13px] text-[#6e6e78] dark:text-[#98989f] mt-1 leading-snug">
            Gestão salarial e escalas offshore no Suriname
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0a84ff]/10 text-[#0a84ff] text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0a84ff] animate-pulse" />
            Nuvem Supabase Ativa
          </div>
        </div>

        {/* Abas / Segmented Control */}
        <div className="grid grid-cols-3 gap-1 p-1 mb-5 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] text-[12px] font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'login'
                ? 'bg-white dark:bg-[#2c2c2e] text-[#111114] dark:text-[#f5f5f7] shadow-xs'
                : 'text-[#6e6e78] dark:text-[#98989f] hover:text-[#111114] dark:hover:text-[#f5f5f7]'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'signup'
                ? 'bg-white dark:bg-[#2c2c2e] text-[#111114] dark:text-[#f5f5f7] shadow-xs'
                : 'text-[#6e6e78] dark:text-[#98989f] hover:text-[#111114] dark:hover:text-[#f5f5f7]'
            }`}
          >
            Criar conta
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setErrorMessage(null);
            }}
            className={`py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'forgot'
                ? 'bg-white dark:bg-[#2c2c2e] text-[#111114] dark:text-[#f5f5f7] shadow-xs'
                : 'text-[#6e6e78] dark:text-[#98989f] hover:text-[#111114] dark:hover:text-[#f5f5f7]'
            }`}
          >
            Recuperar
          </button>
        </div>

        {/* Mensagens de erro */}
        {errorMessage && (
          <div className="mb-4 rounded-xl bg-[#ff453a]/10 p-3 text-[12px] font-medium text-[#ff453a] border border-[#ff453a]/25 leading-relaxed">
            {errorMessage}
          </div>
        )}

        {/* Mensagens informativas */}
        {infoMessage && (
          <div className="mb-4 rounded-xl bg-[#30d158]/10 p-3 text-[12px] font-medium text-[#248a3d] dark:text-[#30d158] border border-[#30d158]/30 leading-relaxed">
            {infoMessage}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#6e6e78] dark:text-[#98989f] mb-1.5">
              E-mail de acesso
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              className="w-full h-11 rounded-xl bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3.5 text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12px] font-semibold text-[#6e6e78] dark:text-[#98989f]">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-medium text-[#0a84ff] hover:underline cursor-pointer"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 rounded-xl bg-[#f7f7fa] dark:bg-[#2c2c2e] px-3.5 text-[14px] font-medium text-[#111114] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] focus:ring-[3px] focus:ring-[#0a84ff]/35 transition outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 rounded-xl bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white font-bold text-[14px] shadow-sm transition active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            )}
            <span>
              {mode === 'login' && (loading ? 'Conectando…' : 'Entrar no RotaPay')}
              {mode === 'signup' && (loading ? 'Criando conta…' : 'Criar minha conta')}
              {mode === 'forgot' && (loading ? 'Enviando…' : 'Enviar link de recuperação')}
            </span>
          </button>
        </form>

        {/* Rodapé do card */}
        <div className="mt-6 pt-4 border-t border-black/[0.06] dark:border-white/[0.08] text-center">
          <p className="text-[11px] text-[#8e8e93] leading-relaxed">
            Seus cálculos, rotações e holerites sincronizam em tempo real com o banco na nuvem.
          </p>
        </div>
      </div>

      {/* Identificação de versão e empresa */}
      <div className="mt-4 text-center text-[11px] text-[#8e8e93]">
        RotaPay v2.0 · TechnipFMC Suriname
      </div>
    </div>
  );
};
