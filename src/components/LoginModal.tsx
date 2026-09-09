import React, { useState } from 'react';
import { AuthUser } from '../types';
import { api } from '../services/api';
import { AcademyLogo } from './AcademyLogo';
import { LogIn, KeyRound, User, AlertCircle, Lock } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.login(username.trim(), password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Usuario o contraseña incorrectos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="login-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/75 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="login-modal-card"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden"
      >
        {/* Modal Header on Pure White for Logo */}
        <div className="bg-white p-6 text-center border-b border-neutral-200">
          <div className="inline-flex justify-center p-2 bg-white rounded-2xl mb-1">
            <AcademyLogo size="lg" />
          </div>
          <p className="text-xs text-neutral-500 font-medium">
            Ciclo Académico 2026 - 2027 • Acceso Seguro
          </p>
        </div>

        {/* Security badge notice */}
        <div className="mx-6 mt-5 p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center gap-2.5 text-xs text-neutral-600">
          <Lock className="w-4 h-4 text-[#c52227] shrink-0" />
          <span>Acceso individual para profesores autorizados y administración.</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              id="login-error-alert"
              className="p-3 bg-red-50 border border-red-200 text-[#c52227] text-xs rounded-xl flex items-center gap-2 font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-[#c52227]" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="input-login-username" className="text-xs font-bold text-neutral-700 block">
              Usuario Asignado
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                id="input-login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingrese su usuario..."
                required
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden bg-neutral-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="input-login-password" className="text-xs font-bold text-neutral-700 block">
              Contraseña
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                id="input-login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña..."
                required
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden bg-neutral-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <button
            id="btn-submit-login"
            type="submit"
            disabled={isLoading || !username.trim() || !password}
            className="w-full py-2.5 px-4 bg-[#c52227] hover:bg-[#a81b20] active:bg-[#8e171b] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Verificando credenciales...' : 'Iniciar Sesión'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
