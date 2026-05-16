import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ConfirmarEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ loading: true, success: false, message: 'Validando seu e-mail no servidor...' });
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus({ loading: false, success: false, message: 'Token de confirmação não encontrado na URL.' });
      return;
    }

    // Chama a API de autenticação (porta 3000) para validar o token
    fetch('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.dadosUsuario) {
        setStatus({ 
          loading: false, 
          success: true, 
          message: `Parabéns, ${data.dadosUsuario.email}! Seu e-mail foi confirmado com sucesso. Redirecionando para o login...` 
        });
        localStorage.setItem('authToken', token); // Salva o token validado
        localStorage.setItem('userEmail', data.dadosUsuario.email);
        setTimeout(() => navigate('/login'), 3000); // Redireciona para o login após 3 segundos
      } else {
        setStatus({ loading: false, success: false, message: 'Token de confirmação inválido ou expirado.' });
      }
    })
    .catch(err => {
      setStatus({ loading: false, success: false, message: 'Erro ao conectar com o servidor de validação na porta 3000.' });
    });
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100 selection:bg-blue-500/30">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/50 p-8 text-center shadow-2xl backdrop-blur-xl animate-fade-in">
        <div className="mx-auto mb-5 h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 text-2xl font-bold italic">
          S
        </div>
        <h2 className="mb-6 text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Confirmação de Cadastro
        </h2>
        
        {status.loading ? (
          <div className="flex flex-col items-center gap-4 my-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-slate-300 font-medium">{status.message}</p>
          </div>
        ) : (
          <div className={`rounded-2xl border p-6 text-base font-medium backdrop-blur-sm my-4 ${
            status.success 
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}>
            {status.message}
          </div>
        )}

        {!status.loading && (
          <button
            onClick={() => navigate('/login')}
            className="mt-6 w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-4 font-semibold text-slate-200 transition border border-slate-700 shadow-lg active:scale-95"
          >
            Fazer Login
          </button>
        )}
      </div>
    </div>
  );
}
