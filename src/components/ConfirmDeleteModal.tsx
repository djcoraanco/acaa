import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Sí, eliminar',
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="confirm-delete-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="confirm-delete-modal-box"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden"
      >
        <div className="bg-red-50 border-b border-red-100 p-5 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-[#c52227] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-red-950">{title}</h3>
              <p className="text-xs text-red-700 mt-0.5">Esta acción no se puede deshacer.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-red-400 hover:text-red-700 hover:bg-red-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs text-neutral-600 leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 bg-neutral-50 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-200/70 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold bg-[#c52227] hover:bg-[#a81b20] text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
