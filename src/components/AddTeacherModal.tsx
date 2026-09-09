import React, { useState } from 'react';
import { api } from '../services/api';
import { Teacher } from '../types';
import { X, UserPlus, GraduationCap, AlertCircle, CheckCircle } from 'lucide-react';

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeacherCreated: (teacher: Teacher) => void;
}

export const AddTeacherModal: React.FC<AddTeacherModalProps> = ({
  isOpen,
  onClose,
  onTeacherCreated,
}) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !department.trim()) {
      setError('Por favor completa el nombre y la cátedra del profesor.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await api.createTeacher({
        name: name.trim(),
        department: department.trim(),
        username: username.trim() || undefined,
        password: password.trim() || undefined,
      });
      onTeacherCreated(res.teacher);
      setName('');
      setDepartment('');
      setUsername('');
      setPassword('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar al profesor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="add-teacher-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="add-teacher-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden"
      >
        <div className="bg-[#252525] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-[#c52227]" />
            <h3 className="font-bold text-sm">Nuevo Profesor / Cátedra</h3>
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
              Nombre Completo del Profesor/a *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Prof. Antonio Aquino"
              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden bg-neutral-50 focus:bg-white transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 block">
              Especialidad / Cátedra *
            </label>
            <input
              type="text"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Ej: Violín, Viola, Violonchelo, Contrabajo"
              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden bg-neutral-50 focus:bg-white transition-colors"
            />
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <p className="text-[11px] font-bold text-neutral-700 mb-2">
              Credenciales de Acceso para el Profesor (Firebase):
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-neutral-500 block font-medium">Usuario de acceso</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej: aaquino"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:border-[#c52227] outline-hidden bg-neutral-50 focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-neutral-500 block font-medium">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ej: clave123"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:border-[#c52227] outline-hidden bg-neutral-50 focus:bg-white transition-colors"
                />
              </div>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1.5">
              Con este usuario, el profesor podrá ingresar y gestionar exclusivamente a los estudiantes de su cátedra.
            </p>
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
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Profesor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
