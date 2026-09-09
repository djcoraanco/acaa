import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Teacher } from '../types';
import { X, KeyRound, UserCheck, AlertCircle, CheckCircle, Lock, User } from 'lucide-react';

interface EditTeacherModalProps {
  isOpen: boolean;
  teacher: Teacher | null;
  onClose: () => void;
  onTeacherUpdated: (updatedTeacher: Teacher) => void;
}

export const EditTeacherModal: React.FC<EditTeacherModalProps> = ({
  isOpen,
  teacher,
  onClose,
  onTeacherUpdated,
}) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (teacher) {
      setName(teacher.name || '');
      setDepartment(teacher.department || '');
      setUsername(teacher.username || '');
      setNewPassword('');
      setError(null);
    }
  }, [teacher]);

  if (!isOpen || !teacher) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !department.trim()) {
      setError('El nombre y la cátedra no pueden estar vacíos.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await api.updateTeacher(teacher.id, {
        name: name.trim(),
        department: department.trim(),
        username: username.trim() || undefined,
        password: newPassword.trim() || undefined,
      });

      const updated: Teacher = {
        ...teacher,
        name: name.trim(),
        department: department.trim(),
        username: username.trim() || teacher.username,
      };

      onTeacherUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar credenciales.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="edit-teacher-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="edit-teacher-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden"
      >
        <div className="bg-[#252525] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-[#c52227]" />
            <div>
              <h3 className="font-bold text-sm">Gestionar Profesor y Credenciales</h3>
              <p className="text-[11px] text-neutral-300">Modificar datos de acceso (Solo Administrador)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-[#c52227] text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#c52227]" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 block">
              Nombre Completo del Profesor
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden bg-neutral-50 focus:bg-white transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 block">
              Cátedra / Especialidad
            </label>
            <input
              type="text"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden bg-neutral-50 focus:bg-white transition-colors"
            />
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <p className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#c52227]" />
              Credenciales de Inicio de Sesión
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-600 block">
                Nombre de Usuario (Login)
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej: clara"
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-neutral-200 focus:border-[#c52227] outline-hidden bg-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-600 block">
                Nueva Contraseña <span className="text-neutral-400 font-normal">(dejar en blanco para mantener la actual)</span>
              </label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Escribe la nueva contraseña aquí..."
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-neutral-200 focus:border-[#c52227] outline-hidden bg-white font-mono transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold bg-[#c52227] hover:bg-[#a81b20] text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
