import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: `Bem-vindo, ${data.usuario.nome || data.usuario.email}! Redirecionando para o portal...`,
        });
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('userEmail', data.usuario.email);
          localStorage.setItem('userName', data.usuario.nome);
        }
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setStatus({
          type: 'error',
          message: data.erro || 'E-mail ou senha incorretos.',
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Erro ao conectar com o servidor de autenticação na porta 3000.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setFormData({ email: 'medico@hospital.com', senha: 'senha123' });
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
            SurgicalReport<span className="text-blue-500">Pro</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Acesse o portal de estratégia clínica com suas credenciais
          </p>
        </div>

        {/* Dica de Credenciais Demo */}
        <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-xs text-blue-300 flex items-center justify-between gap-3">
          <div>
            <span className="font-bold block mb-1">💡 Credenciais de Demonstração:</span>
            <span className="font-mono">medico@hospital.com / senha123</span>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 font-semibold text-white transition shadow-md active:scale-95 whitespace-nowrap"
          >
            Preencher
          </button>
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
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="email">
              E-mail Profissional
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="medico@hospital.com"
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-200 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300" htmlFor="senha">
                Senha
              </label>
              <button
                type="button"
                onClick={() => navigate('/recover-password')}
                className="text-xs font-semibold text-blue-400 hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              value={formData.senha}
              onChange={handleChange}
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
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Autenticando...
              </span>
            ) : (
              'Entrar no Portal'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400 border-t border-slate-800/80 pt-6">
          Não tem uma conta?{' '}
          <button onClick={() => navigate('/register')} className="font-semibold text-blue-400 hover:underline">
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
}
