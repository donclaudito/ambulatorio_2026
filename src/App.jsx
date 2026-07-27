import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginForm from './pages/LoginForm';
import RegisterForm from './pages/RegisterForm';
import ConfirmarEmail from './pages/ConfirmarEmail';
import RecoverPassword from './pages/RecoverPassword';
import ResetPassword from './pages/ResetPassword';
import SurgicalDashboard from './pages/SurgicalDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas de Autenticação */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/confirmar" element={<ConfirmarEmail />} />
        <Route path="/recover-password" element={<RecoverPassword />} />
        <Route path="/redefinir-senha" element={<ResetPassword />} />

        {/* Rota Privada do Painel Cirúrgico */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SurgicalDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <SurgicalDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
