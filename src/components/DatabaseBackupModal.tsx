import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  X,
  Database,
  Download,
  Upload,
  FileCode,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Users,
  GraduationCap,
  Music,
  ShieldCheck,
  Loader2,
  Clock,
  Cloud,
  RefreshCw,
} from 'lucide-react';

interface DatabaseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

interface DbStats {
  fileSizeKb: number;
  teachersCount: number;
  studentsCount: number;
  readingSectionsCount: number;
  usersCount: number;
  databasePath: string;
  lastModified: string;
}

export const DatabaseBackupModal: React.FC<DatabaseBackupModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isDownloadingJson, setIsDownloadingJson] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMessage(null);
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const data = await api.getDbStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error al cargar estadísticas de Firebase:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleDownloadJson = async () => {
    try {
      setIsDownloadingJson(true);
      setError(null);
      setSuccessMessage(null);
      await api.downloadDatabaseJson();
      setSuccessMessage('Copia de seguridad en formato JSON descargada con éxito.');
    } catch (err: any) {
      setError(err.message || 'Error al generar la exportación de Firebase.');
    } finally {
      setIsDownloadingJson(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setError(null);
      setSuccessMessage(null);
      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await api.importDatabaseJson(parsed);
      if (res.success) {
        setSuccessMessage(res.message);
        await loadStats();
        if (onDataChanged) onDataChanged();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError('Error al procesar el archivo JSON: formato incompatible o corrupto.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="database-backup-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="database-backup-modal-content"
        className="bg-white rounded-3xl shadow-2xl border border-neutral-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-neutral-900 to-neutral-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Copia de Seguridad y Sincronización</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                  Firebase Firestore
                </span>
              </h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                Proyecto: <span className="font-mono text-amber-300">acaa-afe48</span> • Respaldo y sincronización
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-backup-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Notifications */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="space-y-1">
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* Guarantee banner */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold">Persistencia Híbrida & Segura</p>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                Todos los datos (profesores, alumnos, asistencias y notas) se guardan en el almacenamiento local y se sincronizan con Cloud Firestore. Puedes importar un respaldo anterior o exportar tus datos en cualquier momento.
              </p>
            </div>
          </div>

          {/* Database Live Stats Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-600 font-semibold px-0.5">
              <span>Registros Actuales</span>
              {stats?.lastModified && (
                <span className="text-[11px] text-neutral-600 font-normal flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-600" />
                  <span>Sincronizado</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 mb-1">
                  <GraduationCap className="w-3.5 h-3.5 text-[#252525]" />
                  <span>Profesores</span>
                </div>
                <div className="text-lg font-black text-[#252525]">
                  {isLoadingStats ? '...' : stats?.teachersCount ?? '—'}
                </div>
              </div>

              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 mb-1">
                  <Users className="w-3.5 h-3.5 text-[#c52227]" />
                  <span>Alumnos</span>
                </div>
                <div className="text-lg font-black text-[#252525]">
                  {isLoadingStats ? '...' : stats?.studentsCount ?? '—'}
                </div>
              </div>

              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 mb-1">
                  <Music className="w-3.5 h-3.5 text-blue-600" />
                  <span>Lectura Musical</span>
                </div>
                <div className="text-lg font-black text-[#252525]">
                  {isLoadingStats ? '...' : stats?.readingSectionsCount ?? '—'}
                </div>
              </div>

              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 mb-1">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Estado Cloud</span>
                </div>
                <div className="text-sm font-black text-emerald-700 mt-1">
                  Protegido
                </div>
              </div>
            </div>
          </div>

          {/* Action Options */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Acciones de Copia y Restauración
            </h4>

            {/* Hidden File Input for Import */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileSelected}
              className="hidden"
            />

            {/* Estado de Sincronización Automática */}
            <div className="p-4 rounded-2xl border border-emerald-200/90 bg-emerald-50/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-950">Sincronización Automática en Vivo</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Activo
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-850 leading-relaxed max-w-md">
                    Cualquier dato ingresado o modificado se sincroniza de forma inmediata y automática con Firebase Cloud Firestore. La aplicación opera en tiempo real directamente sobre la base de datos remota.
                  </p>
                </div>
              </div>
            </div>

            {/* Option 2: Importar Respaldo JSON */}
            <div className="p-4 rounded-2xl border border-neutral-200 hover:border-neutral-300 bg-neutral-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-bold text-[#252525]">Importar Respaldo (.json)</span>
                  <p className="text-[11px] text-neutral-600 leading-relaxed max-w-md">
                    Restaura una copia de seguridad JSON generada previamente desde SQLite o Firebase para poblar la base de datos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-import-json-backup"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-60"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Subir .json</span>
                  </>
                )}
              </button>
            </div>

            {/* Option 3: JSON Full Cloud Export */}
            <div className="p-4 rounded-2xl border-2 border-red-100 hover:border-red-300 bg-red-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#c52227] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileCode className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#252525]">Descargar Copia JSON (.json)</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#c52227]/10 text-[#c52227] text-[10px] font-mono font-bold">
                      Descarga
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-relaxed max-w-md">
                    Descarga todas las colecciones (docentes, cátedras, fichas de alumnos, asistencias, notas, repertorios y sesiones) en un archivo JSON estructurado.
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-download-json-backup"
                onClick={handleDownloadJson}
                disabled={isDownloadingJson}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#c52227] hover:bg-[#a81b20] text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-60"
              >
                {isDownloadingJson ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Exportando...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Descargar .json</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs">
          <div className="text-neutral-600 text-[11px] font-mono">
            Firebase Project: acaa-afe48
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
