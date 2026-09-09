import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Teacher, TeacherConnection, AuditLogEntry, AuditStats, AuthUser } from '../types';
import {
  ShieldAlert,
  Radio,
  Activity,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Clock,
  Laptop,
  Globe,
  User,
  GraduationCap,
  Award,
  CheckCircle2,
  FileText,
  Trash2,
  UserPlus,
  KeyRound,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

interface AdminAuditDashboardProps {
  teachers: Teacher[];
  currentUser: AuthUser;
  onOpenAdminProfile: () => void;
}

export const AdminAuditDashboard: React.FC<AdminAuditDashboardProps> = ({
  teachers,
  currentUser,
  onOpenAdminProfile,
}) => {
  const [subTab, setSubTab] = useState<'changes' | 'connections'>('changes');
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [connections, setConnections] = useState<TeacherConnection[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>(''); // YYYY-MM-DD
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [logsData, connData, statsData] = await Promise.all([
        api.getAuditLogs({
          teacherId: selectedTeacherId !== 'all' ? selectedTeacherId : undefined,
          date: filterDate || undefined,
          actionType: selectedActionType !== 'all' ? selectedActionType : undefined,
        }),
        api.getTeacherConnections(selectedTeacherId !== 'all' ? selectedTeacherId : undefined),
        api.getAuditStats(),
      ]);

      setLogs(logsData || []);
      setConnections(connData || []);
      setStats(statsData || null);
    } catch (err) {
      console.error('Error loading audit data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTeacherId, selectedActionType, filterDate]);

  // Quick date presets
  const setQuickDate = (preset: 'today' | 'yesterday' | 'all') => {
    if (preset === 'all') {
      setFilterDate('');
      return;
    }
    const d = new Date();
    if (preset === 'yesterday') {
      d.setDate(d.getDate() - 1);
    }
    const iso = d.toISOString().slice(0, 10);
    setFilterDate(iso);
  };

  // Filter logs by search query
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.teacherName.toLowerCase().includes(q) ||
      log.username.toLowerCase().includes(q) ||
      log.description.toLowerCase().includes(q) ||
      (log.targetName && log.targetName.toLowerCase().includes(q)) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(q))
    );
  });

  // Filter connections by search query
  const filteredConnections = connections.filter((conn) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      conn.teacherName.toLowerCase().includes(q) ||
      conn.username.toLowerCase().includes(q) ||
      conn.ipAddress.toLowerCase().includes(q) ||
      (conn.deviceInfo && conn.deviceInfo.toLowerCase().includes(q)) ||
      (conn.locationHint && conn.locationHint.toLowerCase().includes(q))
    );
  });

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'grade':
        return {
          label: 'Calificación',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <Award className="w-3 h-3 text-emerald-600" />,
        };
      case 'attendance':
        return {
          label: 'Asistencia',
          color: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: <CheckCircle2 className="w-3 h-3 text-blue-600" />,
        };
      case 'technical_note':
        return {
          label: 'Nota Técnica',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <FileText className="w-3 h-3 text-amber-600" />,
        };
      case 'repertoire':
        return {
          label: 'Repertorio',
          color: 'bg-purple-50 text-purple-800 border-purple-200',
          icon: <Activity className="w-3 h-3 text-purple-600" />,
        };
      case 'student_create':
        return {
          label: 'Nuevo Alumno',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <UserPlus className="w-3 h-3 text-emerald-600" />,
        };
      case 'student_delete':
        return {
          label: 'Alumno Eliminado',
          color: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: <Trash2 className="w-3 h-3 text-rose-600" />,
        };
      case 'login':
        return {
          label: 'Conexión / Login',
          color: 'bg-neutral-100 text-neutral-800 border-neutral-300',
          icon: <Globe className="w-3 h-3 text-neutral-600" />,
        };
      case 'admin_credential_change':
        return {
          label: 'Seguridad Admin',
          color: 'bg-red-50 text-[#c52227] border-red-200',
          icon: <KeyRound className="w-3 h-3 text-[#c52227]" />,
        };
      default:
        return {
          label: 'Modificación',
          color: 'bg-neutral-100 text-neutral-700 border-neutral-200',
          icon: <Activity className="w-3 h-3 text-neutral-500" />,
        };
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('es-DO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div id="admin-audit-dashboard" className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-50 text-[#c52227] rounded-2xl shrink-0 border border-red-100">
            <Radio className="w-6 h-6 animate-pulse text-[#c52227]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-neutral-900">
                Auditoría en Tiempo Real & Control de Conexiones
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#c52227] text-white">
                Admin
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1 max-w-2xl leading-relaxed">
              Supervisión de accesos por IP, dispositivos y registro cronológico de todas las notas,
              asistencias y modificaciones realizadas por los profesores en el sistema.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <button
            type="button"
            onClick={onOpenAdminProfile}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-xl border border-neutral-200 transition-colors shadow-2xs"
            title="Cambiar usuario o contraseña de administrador"
          >
            <KeyRound className="w-4 h-4 text-[#c52227]" />
            <span>Editar Clave Admin</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#252525] hover:bg-neutral-800 rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
              Cambios Hoy
            </span>
            <span className="text-2xl font-black text-neutral-900 mt-1 block">
              {stats?.totalChangesToday ?? 0}
            </span>
            <span className="text-[10px] text-neutral-400">Acciones registradas</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
              Profesores Activos Hoy
            </span>
            <span className="text-2xl font-black text-neutral-900 mt-1 block">
              {stats?.activeTeachersToday ?? 0}
            </span>
            <span className="text-[10px] text-neutral-400">Con actividad hoy</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
              Conexiones Totales
            </span>
            <span className="text-2xl font-black text-neutral-900 mt-1 block">
              {stats?.totalConnections ?? connections.length}
            </span>
            <span className="text-[10px] text-neutral-400">Sesiones iniciadas</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex items-center justify-between">
          <div className="overflow-hidden pr-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
              Última Conexión
            </span>
            <span className="text-xs font-bold text-neutral-900 truncate mt-1 block">
              {stats?.lastConnection?.teacherName || 'Ninguna aún'}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono truncate block">
              {stats?.lastConnection?.ipAddress || 'IP Local'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-100 text-neutral-700 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Container with Sub-Tabs */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-neutral-200 px-6 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              id="tab-audit-changes"
              type="button"
              onClick={() => setSubTab('changes')}
              className={`pb-3.5 px-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                subTab === 'changes'
                  ? 'border-[#c52227] text-[#c52227]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Cambios & Actividades Diarias</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-neutral-100 text-neutral-600 font-mono">
                {filteredLogs.length}
              </span>
            </button>

            <button
              id="tab-audit-connections"
              type="button"
              onClick={() => setSubTab('connections')}
              className={`pb-3.5 px-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                subTab === 'connections'
                  ? 'border-[#c52227] text-[#c52227]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Conexiones & Ubicaciones de Profesores</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-neutral-100 text-neutral-600 font-mono">
                {filteredConnections.length}
              </span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="pb-3 relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar profesor, IP o acción..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white outline-hidden focus:border-[#c52227]"
            />
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-neutral-50/70 border-b border-neutral-200 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-500 font-medium shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#c52227]" />
            <span>Filtrar por:</span>
          </div>

          {/* Teacher selector */}
          <select
            id="filter-audit-teacher"
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-white text-neutral-700 font-medium outline-hidden focus:border-[#c52227]"
          >
            <option value="all">Todos los Profesores</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.department})
              </option>
            ))}
          </select>

          {/* Action type selector (only relevant for changes tab) */}
          {subTab === 'changes' && (
            <select
              id="filter-audit-action"
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-white text-neutral-700 font-medium outline-hidden focus:border-[#c52227]"
            >
              <option value="all">Todas las Acciones</option>
              <option value="grade">Calificaciones Semanales</option>
              <option value="attendance">Asistencias</option>
              <option value="technical_note">Observaciones Técnicas</option>
              <option value="repertoire">Repertorios</option>
              <option value="student_create">Inscripción de Alumnos</option>
              <option value="student_delete">Eliminación de Alumnos</option>
              <option value="login">Inicios de Sesión</option>
            </select>
          )}

          {/* Date Picker & Quick Buttons */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              id="filter-audit-date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-white text-neutral-700 font-medium outline-hidden focus:border-[#c52227]"
              title="Filtrar por fecha específica"
            />
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setQuickDate('today')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  filterDate === new Date().toISOString().slice(0, 10)
                    ? 'bg-[#c52227] text-white'
                    : 'bg-white hover:bg-neutral-200 text-neutral-700 border border-neutral-200'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setQuickDate('yesterday')}
                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-neutral-200 text-neutral-700 border border-neutral-200 transition-colors"
              >
                Ayer
              </button>
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setQuickDate('all')}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold bg-neutral-200 hover:bg-neutral-300 text-neutral-700 transition-colors"
                >
                  Limpiar fecha
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Section: SubTab 1 - Changes & Activities */}
        {subTab === 'changes' && (
          <div className="p-6">
            {isLoading ? (
              <div className="py-16 text-center text-neutral-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#c52227]" />
                <p className="text-xs">Cargando registro de auditoría...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold text-neutral-700">No hay cambios registrados</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  No se encontraron acciones con los filtros seleccionados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => {
                  const badge = getActionBadge(log.actionType);
                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2.5 rounded-xl bg-neutral-100 shrink-0 text-neutral-700 mt-0.5">
                          {badge.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${badge.color}`}
                            >
                              {badge.label}
                            </span>

                            <span className="text-xs font-bold text-neutral-900">
                              {log.teacherName}
                            </span>

                            <span className="text-[11px] font-mono text-neutral-400">
                              @{log.username}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                            {log.description}
                          </p>

                          {log.targetName && (
                            <div className="mt-1 text-[11px] text-neutral-500">
                              Afectado:{' '}
                              <span className="font-semibold text-neutral-800">{log.targetName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Meta Information: Timestamp, IP & Device */}
                      <div className="flex sm:flex-col items-end sm:items-end justify-between sm:justify-center gap-1.5 text-right shrink-0 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-600">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          <span>{formatDateTime(log.createdAt)}</span>
                        </div>

                        {log.ipAddress && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400">
                            <Globe className="w-3 h-3 text-neutral-400" />
                            <span>{log.ipAddress}</span>
                          </div>
                        )}

                        {log.deviceInfo && (
                          <div className="hidden sm:flex items-center gap-1 text-[10px] text-neutral-400">
                            <Laptop className="w-3 h-3" />
                            <span>{log.deviceInfo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Content Section: SubTab 2 - Teacher Connections & Locations */}
        {subTab === 'connections' && (
          <div className="p-6">
            <div className="mb-4 p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-start gap-3 text-xs text-blue-900">
              <Globe className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Monitoreo de Red & Ubicación de Accesos</p>
                <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
                  Cada vez que un maestro inicia sesión, el sistema detecta su dirección IP pública, su
                  dispositivo (Windows, Mac, Android, iPhone), el navegador utilizado y su huso horario para
                  verificar desde dónde se conectan a cargar datos.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-neutral-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#c52227]" />
                <p className="text-xs">Cargando conexiones...</p>
              </div>
            ) : filteredConnections.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold text-neutral-700">No hay conexiones registradas</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Las conexiones se guardan automáticamente al ingresar con usuario y contraseña.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-[11px] font-bold text-neutral-500 uppercase tracking-wider bg-neutral-50/50">
                      <th className="py-3 px-4">Profesor / Usuario</th>
                      <th className="py-3 px-4">Dirección IP</th>
                      <th className="py-3 px-4">Ubicación / Región</th>
                      <th className="py-3 px-4">Dispositivo & Navegador</th>
                      <th className="py-3 px-4 text-right">Fecha & Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredConnections.map((conn) => (
                      <tr key={conn.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-neutral-100 text-neutral-700 shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-neutral-900">{conn.teacherName}</div>
                              <div className="text-[11px] font-mono text-neutral-400">
                                @{conn.username} • {conn.role === 'admin' ? 'Administrador' : 'Profesor'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-semibold text-neutral-800">
                          <span className="px-2 py-1 bg-neutral-100 rounded-md border border-neutral-200 text-[11px]">
                            {conn.ipAddress}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-neutral-700 font-medium">
                            <Globe className="w-3.5 h-3.5 text-[#c52227] shrink-0" />
                            <span>{conn.locationHint || 'República Dominicana'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-neutral-600">
                            <Laptop className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>{conn.deviceInfo || 'Navegador Web'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-medium text-neutral-500 text-[11px]">
                          {formatDateTime(conn.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
