import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  X,
  Database,
  Download,
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
} from 'lucide-react';

interface DatabaseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
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
}) => {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isDownloadingSqlite, setIsDownloadingSqlite] = useState(false);
  const [isDownloadingJson, setIsDownloadingJson] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      console.error('Error al cargar estadísticas de BD:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleDownloadSqlite = async () => {
    try {
      setIsDownloadingSqlite(true);
      setError(null);
      setSuccessMessage(null);
      await api.downloadDatabaseSqlite();
      setSuccessMessage('Base de datos SQLite (.sqlite) descargada con éxito.');
    } catch (err: any) {
      setError(err.message || 'Error al descargar el archivo SQLite.');
    } finally {
      setIsDownloadingSqlite(false);
    }
  };

  const handleDownloadJson = async () => {
    try {
      setIsDownloadingJson(true);
      setError(null);
      setSuccessMessage(null);
      await api.downloadDatabaseJson();
      setSuccessMessage('Respaldo estructurado en JSON (.json) descargado con éxito.');
    } catch (err: any) {
      setError(err.message || 'Error al generar la exportación JSON.');
    } finally {
      setIsDownloadingJson(false);
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
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Copia de Seguridad de la Base de Datos</span>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-mono font-bold">
                  SQLite
                </span>
              </h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                Descarga y resguarda todos los datos ingresados por los profesores
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
              <span>{error}</span>
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
              <p className="font-bold">Garantía de integridad de los datos académicos</p>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                Esta copia descargable conserva íntegramente todas las evaluaciones, calificaciones trimestrales,
                asistencias semana a semana, notas de seguimiento técnico, repertorios de examen y recitales,
                así como las planillas de lectura musical subidas por los docentes.
              </p>
            </div>
          </div>

          {/* Database Live Stats Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-600 font-semibold px-0.5">
              <span>Estado actual de la base de datos</span>
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
                  <span>Tamaño Archivo</span>
                </div>
                <div className="text-lg font-black text-[#252525]">
                  {isLoadingStats ? '...' : `${stats?.fileSizeKb ?? 0} KB`}
                </div>
              </div>
            </div>
          </div>

          {/* Download Options */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Opciones de Descarga y Respaldo
            </h4>

            {/* Option 1: SQLite Database File */}
            <div className="p-4 rounded-2xl border-2 border-red-100 hover:border-red-300 bg-red-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#c52227] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Database className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#252525]">Archivo Nativo SQLite (.sqlite)</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#c52227]/10 text-[#c52227] text-[10px] font-mono font-bold">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-relaxed max-w-md">
                    Descarga el archivo físico <code className="font-mono text-neutral-800 bg-white px-1 py-0.5 rounded border border-neutral-200">academia.sqlite</code> con todos los registros relacionales. Se puede restaurar de inmediato o abrir con cualquier visualizador de SQLite (DB Browser, DBeaver, etc.).
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-download-sqlite-db"
                onClick={handleDownloadSqlite}
                disabled={isDownloadingSqlite}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#c52227] hover:bg-[#a81b20] text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-60"
              >
                {isDownloadingSqlite ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Descargando...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Descargar .sqlite</span>
                  </>
                )}
              </button>
            </div>

            {/* Option 2: JSON Full Export */}
            <div className="p-4 rounded-2xl border border-neutral-200 hover:border-neutral-300 bg-neutral-50/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileCode className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#252525]">Respaldo Estructurado en JSON (.json)</span>
                    <span className="px-2 py-0.5 rounded-md bg-neutral-200 text-neutral-700 text-[10px] font-mono font-bold">
                      Universal
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-relaxed max-w-md">
                    Exportación universal de todos los alumnos, profesores, notas de clase y sesiones de lectura en formato de texto JSON legible. Ideal para migraciones futuras o consulta sin necesidad de software de base de datos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-download-json-backup"
                onClick={handleDownloadJson}
                disabled={isDownloadingJson}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-60"
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
            Ruta interna: data/academia.sqlite
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
