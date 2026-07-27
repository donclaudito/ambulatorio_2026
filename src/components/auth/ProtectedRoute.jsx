import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      navigate('/login');
      return;
    }

    // Valida o token com a API backend
    fetch('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Token inválido ou expirado');
        return res.json();
      })
      .then((data) => {
        if (data.dadosUsuario) {
          setIsAuthenticated(true);
          if (data.dadosUsuario.email) {
            localStorage.setItem('userEmail', data.dadosUsuario.email);
            if (data.dadosUsuario.nome) {
              localStorage.setItem('userName', data.dadosUsuario.nome);
            }
          }
        } else {
          throw new Error('Dados do usuário não encontrados');
        }
      })
      .catch((err) => {
        localStorage.removeItem('authToken');
        navigate('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-slate-400 font-medium">Verificando credenciais de segurança...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : null;
}
