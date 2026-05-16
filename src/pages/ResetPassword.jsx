import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });

  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setStatus({ type: 'error', message: 'Token de redefinição não encontrado na URL.' });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setStatus({ type: 'error', message: 'As senhas não coincidem.' });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: 'Senha redefinida com sucesso! Redirecionando para o login...',
        });
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setStatus({
          type: 'error',
          message: data.erro || 'Não foi possível redefinir a senha.',
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Erro ao conectar com o servidor na porta 3000.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100 selection:bg-blue-500/30">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl animate-fade-in">
        
        {/* Cabeçalho */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 text-2xl font-bold italic">
            S
          </div>
          <h2 className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Criar Nova Senha
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Digite sua nova senha de acesso abaixo
          </p>
        </div>

        {/* Alertas de Status */}
        {status.message && (
          <div className={`mb-6 rounded-2xl border p-4 text-sm font-medium backdrop-blur-sm transition-all ${
            status.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}>
            {status.message}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="novaSenha">
              Nova Senha
            </label>
            <input
              id="novaSenha"
              name="novaSenha"
              type="password"
              required
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-200 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="confirmarSenha">
              Confirmar Nova Senha
            </label>
            <input
              id="confirmarSenha"
              name="confirmarSenha"
              type="password"
              required
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-200 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Redefinir Senha'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400 border-t border-slate-800/80 pt-6">
          <button onClick={() => navigate('/login')} className="font-semibold text-blue-400 hover:underline">
            Voltar para o Login
          </button>
        </div>
      </div>
    </div>
  );
}
