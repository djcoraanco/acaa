import React, { useState } from 'react';
import { api } from '../services/api';
import { AuthUser } from '../types';
import { X, ShieldCheck, KeyRound, User, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

interface AdminProfileModalProps {
  isOpen: boolean;
  currentUser: AuthUser;
  onClose: () => void;
  onUpdated: (user: AuthUser) => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onUpdated,
}) => {
  const [username, setUsername] = useState(currentUser.username || 'admin');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword && newPassword.length < 4) {
      setError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('La confirmación de la contraseña no coincide.');
      return;
    }

    if (!username.trim()) {
      setError('El nombre de usuario no puede estar vacío.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.updateAdminCredentials({
        currentPassword: currentPassword || undefined,
        newUsername: username.trim() !== currentUser.username ? username.trim() : undefined,
        newPassword: newPassword.trim() ? newPassword.trim() : undefined,
      });

      setSuccess('Credenciales del Administrador actualizadas correctamente.');
      onUpdated(res.user);

      setTimeout(() => {
        onClose();
        setSuccess(null);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar credenciales.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="admin-profile-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/75 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="admin-profile-modal-card"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#252525] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#c52227] rounded-xl text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Seguridad del Administrador</h3>
              <p className="text-[11px] text-neutral-300">Modificar usuario y contraseña de acceso</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 text-xs text-neutral-600 flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#c52227] shrink-0" />
          <span>
            Credenciales por defecto: usuario <strong>admin</strong> y clave <strong>12345</strong>. Puede cambiarlas cuando desee.
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-[#c52227] text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 block">Nombre de Usuario (Admin)</label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                id="input-admin-new-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden bg-neutral-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-neutral-100">
            <label className="text-xs font-bold text-neutral-700 block">
              Nueva Contraseña (dejar en blanco para no cambiarla)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                id="input-admin-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva clave (mínimo 4 caracteres)"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden bg-neutral-50 focus:bg-white"
              />
            </div>
          </div>

          {newPassword && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 block">Confirmar Nueva Contraseña</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  id="input-admin-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita la nueva clave"
                  required
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden bg-neutral-50 focus:bg-white"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-save-admin-credentials"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-[#c52227] hover:bg-[#a81b20] rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
