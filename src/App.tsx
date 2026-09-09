import React, { useState, useEffect, useMemo } from 'react';
import { Teacher, Student, AuthUser, MusicReadingSection } from './types';
import { ACADEMIC_WEEKS } from './utils/calendarWeeks';
import { TeacherSection } from './components/TeacherSection';
import { MusicReadingManager } from './components/MusicReadingManager';
import { GradeReportsDashboard } from './components/GradeReportsDashboard';
import { AdminAuditDashboard } from './components/AdminAuditDashboard';
import { AdminProfileModal } from './components/AdminProfileModal';
import { LoginModal } from './components/LoginModal';
import { AddTeacherModal } from './components/AddTeacherModal';
import { DatabaseBackupModal } from './components/DatabaseBackupModal';
import { AcademyLogo } from './components/AcademyLogo';
import { api, getStoredToken } from './services/api';
import {
  GraduationCap,
  Users,
  ShieldCheck,
  LogOut,
  UserPlus,
  RefreshCw,
  Database,
  Search,
  BookOpen,
  Music,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Award,
  Download,
  Radio,
  KeyRound,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [musicReadingSections, setMusicReadingSections] = useState<MusicReadingSection[]>([]);
  const [activeAppTab, setActiveAppTab] = useState<'instrument' | 'reading' | 'reports' | 'audit'>('instrument');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isAdminProfileModalOpen, setIsAdminProfileModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Check stored session on mount
  useEffect(() => {
    async function checkSession() {
      const token = getStoredToken();
      if (!token) {
        setIsLoadingAuth(false);
        setIsLoginModalOpen(true);
        return;
      }

      try {
        const res = await api.getMe();
        setCurrentUser(res.user);
        await loadAllData();
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        setCurrentUser(null);
        setIsLoginModalOpen(true);
      } finally {
        setIsLoadingAuth(false);
      }
    }
    checkSession();
  }, []);

  const loadAllData = async () => {
    setIsLoadingData(true);
    try {
      const [teachersData, readingData] = await Promise.all([
        api.getTeachers(),
        api.getMusicReadingSections(),
      ]);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setMusicReadingSections(Array.isArray(readingData) ? readingData : []);
    } catch (err: any) {
      showNotification('error', err.message || 'Error al cargar datos de SQLite.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleLoginSuccess = async (user: AuthUser) => {
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    showNotification('success', `¡Bienvenido/a, ${user.name}!`);
    await loadAllData();
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setTeachers([]);
    setMusicReadingSections([]);
    setIsLoginModalOpen(true);
  };

  const handleAddStudent = async (teacherId: string) => {
    const targetTeacher = teachers.find((t) => t.id === teacherId);
    if (!targetTeacher) return;

    let defaultInstrument = 'Instrumento';
    if (targetTeacher.department.toLowerCase().includes('piano')) defaultInstrument = 'Piano';
    else if (targetTeacher.department.toLowerCase().includes('cuerda') || targetTeacher.department.toLowerCase().includes('viol')) defaultInstrument = 'Violín';
    else if (targetTeacher.department.toLowerCase().includes('guitarra')) defaultInstrument = 'Guitarra';
    else if (targetTeacher.department.toLowerCase().includes('canto')) defaultInstrument = 'Canto';

    try {
      const res = await api.createStudent({
        teacherId,
        name: 'Nuevo Estudiante',
        instrument: defaultInstrument,
        level: 'Grado Elemental 1',
        classDay: 'Lunes',
        classTime: '16:00',
        expectedRepertoire: '',
        recitalRepertoire: '',
        examRepertoire: '',
        technicalProgressNotes: '',
        weeklyTechnicalNotes: {},
        attendance: {},
      });

      // Update local state
      setTeachers((prev) =>
        prev.map((t) => {
          if (t.id === teacherId) {
            return {
              ...t,
              students: [res.student, ...t.students],
            };
          }
          return t;
        })
      );

      showNotification('success', 'Estudiante creado y guardado en SQLite.');
    } catch (err: any) {
      showNotification('error', err.message || 'Error al crear estudiante.');
    }
  };

  const handleUpdateStudent = async (student: Student) => {
    // Optimistic UI update
    setTeachers((prev) =>
      prev.map((t) => ({
        ...t,
        students: t.students.map((s) => (s.id === student.id ? student : s)),
      }))
    );

    try {
      await api.updateStudent(student.id, student);
    } catch (err: any) {
      showNotification('error', err.message || 'Error al guardar cambios del estudiante.');
      await loadAllData(); // Revert on failure
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await api.deleteStudent(studentId);
      setTeachers((prev) =>
        prev.map((t) => ({
          ...t,
          students: t.students.filter((s) => s.id !== studentId),
        }))
      );
      showNotification('success', 'Estudiante eliminado de SQLite.');
    } catch (err: any) {
      showNotification('error', err.message || 'Error al eliminar estudiante.');
    }
  };

  const handleUpdateTeacher = async (updatedTeacher: Teacher) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === updatedTeacher.id ? { ...t, ...updatedTeacher } : t))
    );

    try {
      await api.updateTeacher(updatedTeacher.id, {
        name: updatedTeacher.name,
        department: updatedTeacher.department,
        username: updatedTeacher.username,
      });
      showNotification('success', 'Datos del profesor guardados en SQLite.');
    } catch (err: any) {
      showNotification('error', err.message || 'Error al actualizar profesor.');
      await loadAllData();
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    try {
      await api.deleteTeacher(teacherId);
      setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
      showNotification('success', 'Profesor eliminado de SQLite.');
    } catch (err: any) {
      showNotification('error', err.message || 'Error al eliminar profesor.');
    }
  };

  const handleTeacherCreated = (newTeacher: Teacher) => {
    setTeachers((prev) => [...prev, newTeacher]);
    showNotification('success', `Profesor "${newTeacher.name}" registrado en SQLite.`);
  };

  // Music Reading Section Handlers
  const handleSaveMusicReadingSection = async (section: MusicReadingSection) => {
    setMusicReadingSections((prev) =>
      prev.map((s) => (s.id === section.id ? section : s))
    );

    try {
      await api.updateMusicReadingSection(section.id, section);
      showNotification('success', `Sección "${section.name}" guardada en SQLite.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Error al guardar cambios de la sección.');
      await loadAllData();
    }
  };

  const handleDeleteMusicReadingSection = async (sectionId: string) => {
    try {
      await api.deleteMusicReadingSection(sectionId);
      setMusicReadingSections((prev) => prev.filter((s) => s.id !== sectionId));
      showNotification('success', 'Sección de lectura eliminada de SQLite.');
    } catch (err: any) {
      showNotification('error', err.message || 'Error al eliminar sección.');
    }
  };

  const handleCreateMusicReadingSection = async (data: {
    name: string;
    level: string;
    teacherId?: string | null;
    teacherName?: string;
    dayOfWeek: string;
    classTime: string;
    room?: string;
    studentIds: string[];
  }) => {
    try {
      const res = await api.createMusicReadingSection(data);
      setMusicReadingSections((prev) => [res.section, ...prev]);
      showNotification('success', `Sección "${res.section.name}" creada en SQLite.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Error al crear sección grupal.');
    }
  };

  // Flat list of all registered students with teacher attribution
  const allStudents = useMemo(() => {
    return teachers.flatMap((t) =>
      (t.students || []).map((s) => ({
        id: s.id,
        name: s.name,
        instrument: s.instrument,
        level: s.level,
        teacherName: t.name,
      }))
    );
  }, [teachers]);

  // Filtered teachers list (by search)
  const filteredTeachers = teachers.filter((t) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesTeacher =
      t.name.toLowerCase().includes(query) || t.department.toLowerCase().includes(query);
    const matchesStudent = t.students.some(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.instrument.toLowerCase().includes(query) ||
        s.level.toLowerCase().includes(query)
    );
    return matchesTeacher || matchesStudent;
  });

  const totalStudents = teachers.reduce((acc, t) => acc + t.students.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans pb-20">
      {/* Toast Notification */}
      {notification && (
        <div
          id="toast-notification"
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-medium animate-in slide-in-from-bottom-5 transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : 'bg-rose-900 text-rose-100 border-rose-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Top Navigation on Pure White Background */}
      <header className="bg-white text-neutral-900 border-b border-neutral-200 sticky top-0 z-30 shadow-xs border-t-4 border-[#c52227]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1 rounded-xl">
              <AcademyLogo size="md" />
            </div>
            <div className="hidden lg:block border-l border-neutral-200 pl-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block font-mono">
                Ciclo 2026 - 2027
              </span>
              <span className="text-xs font-semibold text-neutral-700">
                Gestión & Registro Académico
              </span>
            </div>
          </div>

          {/* User Status and Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <div className="text-xs font-bold text-[#252525] flex items-center justify-end gap-1.5">
                    {currentUser.role === 'admin' ? (
                      <ShieldCheck className="w-4 h-4 text-[#c52227]" />
                    ) : (
                      <GraduationCap className="w-4 h-4 text-neutral-700" />
                    )}
                    <span>{currentUser.name}</span>
                  </div>
                  <div className="text-[11px] font-medium text-neutral-500 font-mono">
                    {currentUser.role === 'admin' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[#c52227] font-semibold">Administrador</span>
                        <span>•</span>
                        <button
                          type="button"
                          id="btn-header-admin-profile"
                          onClick={() => setIsAdminProfileModalOpen(true)}
                          className="inline-flex items-center gap-1 text-[#c52227] hover:underline cursor-pointer font-bold"
                          title="Cambiar usuario o contraseña de Administrador"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Clave</span>
                        </button>
                      </div>
                    ) : (
                      `Profesor (@${currentUser.username})`
                    )}
                  </div>
                </div>

                <button
                  id="btn-logout"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#c52227] bg-neutral-100 hover:bg-red-50 rounded-xl transition-colors border border-neutral-200"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            ) : (
              <button
                id="btn-open-login"
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#c52227] hover:bg-[#a81b20] text-white rounded-xl transition-all shadow-xs"
              >
                <span>Iniciar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Role Notice & Stats Banner */}
      {currentUser && (
        <div className="bg-neutral-50 border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 ${
                  currentUser.role === 'admin'
                    ? 'bg-red-50 text-[#c52227] border border-red-200'
                    : 'bg-[#252525] text-white border border-[#252525]'
                }`}
              >
                {currentUser.role === 'admin' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#c52227]" />
                    <span>Modo Administrador</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-3.5 h-3.5 text-white" />
                    <span>Modo Profesor</span>
                  </>
                )}
              </span>
              <span className="text-neutral-600 hidden md:inline">
                {currentUser.role === 'admin'
                  ? 'Tienes acceso total para añadir profesores, gestionar cátedras, editar claves y administrar fichas de estudiantes.'
                  : 'Tienes acceso de edición a las fichas, repertorios y asistencias de tu propia cátedra.'}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center">
              <div className="flex items-center gap-1.5 text-neutral-600 font-mono text-[11px]">
                <Database className="w-3.5 h-3.5 text-[#c52227]" />
                <span>SQLite: Activo</span>
              </div>
              <button
                onClick={loadAllData}
                disabled={isLoadingData}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-[#c52227] hover:bg-neutral-200 transition-colors cursor-pointer"
                title="Recargar desde SQLite"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-[#c52227]' : ''}`} />
              </button>
              <button
                type="button"
                id="btn-open-backup-modal-top"
                onClick={() => setIsBackupModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-neutral-700 hover:text-white bg-neutral-200/80 hover:bg-[#252525] transition-all cursor-pointer shadow-2xs"
                title="Descargar base de datos y copia de seguridad"
              >
                <Download className="w-3.5 h-3.5 text-[#c52227]" />
                <span>Descargar BD</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Section Switcher Tabs */}
      <div className="bg-white border-b border-neutral-200 sticky top-20 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none">
          <button
            id="tab-instrument-classes"
            type="button"
            onClick={() => setActiveAppTab('instrument')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeAppTab === 'instrument'
                ? 'bg-[#c52227] text-white shadow-xs'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Cátedras de Instrumento</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                activeAppTab === 'instrument' ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
              }`}
            >
              {teachers.length}
            </span>
          </button>

          <button
            id="tab-reading-sections"
            type="button"
            onClick={() => setActiveAppTab('reading')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeAppTab === 'reading'
                ? 'bg-[#c52227] text-white shadow-xs'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Lectura Musical (Grupos)</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                activeAppTab === 'reading' ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
              }`}
            >
              {musicReadingSections.length}
            </span>
          </button>

          {currentUser?.role === 'admin' && (
            <>
              <button
                id="tab-grade-reports"
                type="button"
                onClick={() => setActiveAppTab('reports')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeAppTab === 'reports'
                    ? 'bg-[#252525] text-white shadow-xs'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200'
                }`}
              >
                <Award className="w-4 h-4 text-amber-500" />
                <span>Boletines y Calificaciones</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-200">
                  Admin
                </span>
              </button>

              <button
                id="tab-audit-dashboard"
                type="button"
                onClick={() => setActiveAppTab('audit')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeAppTab === 'audit'
                    ? 'bg-[#c52227] text-white shadow-xs'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200'
                }`}
              >
                <Radio className="w-4 h-4 text-rose-300" />
                <span>Auditoría & Conexiones</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-100 text-[#c52227] font-bold border border-red-200">
                  Admin
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* VIEW 1: Instrument Classes */}
        {activeAppTab === 'instrument' && (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
                <div className="flex items-center justify-between text-neutral-500 mb-1">
                  <span className="text-xs font-semibold text-neutral-600">Cátedras / Profesores</span>
                  <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-[#252525]">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-[#252525]">{teachers.length}</div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {currentUser?.role === 'admin' ? 'Total en la academia' : 'Tu cátedra asignada'}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
                <div className="flex items-center justify-between text-neutral-500 mb-1">
                  <span className="text-xs font-semibold text-neutral-600">Alumnos Registrados</span>
                  <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-[#c52227]">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-[#252525]">{totalStudents}</div>
                <p className="text-[11px] text-neutral-400 mt-0.5">Fichas académicas</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
                <div className="flex items-center justify-between text-neutral-500 mb-1">
                  <span className="text-xs font-semibold text-neutral-600">Semanas Lectivas</span>
                  <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-[#252525]">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-[#252525]">{ACADEMIC_WEEKS.length}</div>
                <p className="text-[11px] text-neutral-400 mt-0.5">Sep 2026 - Jun 2027</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-neutral-500 mb-1">
                    <span className="text-xs font-semibold text-neutral-600">Base de Datos</span>
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-[#c52227]">
                      <Database className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-base font-bold text-[#c52227] flex items-center gap-1.5 pt-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#c52227] animate-pulse"></span>
                    <span>SQLite Conectado</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">data/academia.sqlite</p>
                </div>

                <button
                  type="button"
                  id="btn-open-backup-card"
                  onClick={() => setIsBackupModalOpen(true)}
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-[#252525] text-neutral-700 hover:text-white rounded-xl text-xs font-bold transition-all border border-neutral-200 shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#c52227]" />
                  <span>Descargar Copia de Seguridad</span>
                </button>
              </div>
            </div>

            {/* Toolbar: Search and Admin Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por profesor, cátedra o alumno..."
                  className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden bg-neutral-50 focus:bg-white transition-colors"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  id="btn-download-db-toolbar"
                  onClick={() => setIsBackupModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-neutral-100 hover:bg-[#252525] text-neutral-800 hover:text-white rounded-xl border border-neutral-200 transition-colors cursor-pointer shadow-2xs"
                  title="Descargar respaldo de base de datos"
                >
                  <Download className="w-4 h-4 text-[#c52227]" />
                  <span>Descargar BD</span>
                </button>

                {currentUser?.role === 'admin' && (
                  <button
                    id="btn-admin-add-teacher"
                    onClick={() => setIsAddTeacherModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-[#c52227] hover:bg-[#a81b20] text-white rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Registrar Nuevo Profesor</span>
                  </button>
                )}
              </div>
            </div>

            {/* Teachers Sections */}
            {isLoadingData ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200">
                <RefreshCw className="w-8 h-8 text-[#c52227] animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-neutral-700">Cargando base de datos SQLite...</p>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 p-6">
                <GraduationCap className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-neutral-700">No se encontraron profesores</h3>
                <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-4">
                  {searchQuery
                    ? 'Ningún profesor o alumno coincide con los términos de búsqueda.'
                    : 'No hay profesores registrados en este momento.'}
                </p>
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => setIsAddTeacherModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#c52227] hover:bg-[#a81b20] text-white rounded-xl shadow-xs"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Registrar Primer Profesor</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredTeachers.map((teacher) => (
                  <TeacherSection
                    key={teacher.id}
                    teacher={teacher}
                    weeks={ACADEMIC_WEEKS}
                    canDeleteTeacher={currentUser?.role === 'admin'}
                    canDeleteStudent={currentUser?.role === 'admin'}
                    onUpdateTeacher={handleUpdateTeacher}
                    onDeleteTeacher={handleDeleteTeacher}
                    onAddStudent={handleAddStudent}
                    onUpdateStudent={handleUpdateStudent}
                    onDeleteStudent={handleDeleteStudent}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Music Reading Collective Sections */}
        {activeAppTab === 'reading' && (
          <MusicReadingManager
            sections={musicReadingSections}
            allStudents={allStudents}
            teachers={teachers}
            weeks={ACADEMIC_WEEKS}
            onSaveSection={handleSaveMusicReadingSection}
            onDeleteSection={handleDeleteMusicReadingSection}
            onCreateSection={handleCreateMusicReadingSection}
          />
        )}

        {/* VIEW 3: Admin Grade Reports Dashboard (Monthly & Semesterly) */}
        {activeAppTab === 'reports' && (
          <GradeReportsDashboard
            teachers={teachers}
            sections={musicReadingSections}
            weeks={ACADEMIC_WEEKS}
          />
        )}

        {/* VIEW 4: Admin Audit & Teacher Connections Dashboard */}
        {activeAppTab === 'audit' && currentUser?.role === 'admin' && (
          <AdminAuditDashboard
            teachers={teachers}
            currentUser={currentUser}
            onOpenAdminProfile={() => setIsAdminProfileModalOpen(true)}
          />
        )}
      </main>

      {/* Academy Footer */}
      <footer className="mt-16 bg-white border-t border-neutral-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            <AcademyLogo size="sm" />
          </div>
          <div className="text-center sm:text-right font-medium">
            <p className="text-neutral-800 font-bold">Academia de Cuerdas Antonio Aquino</p>
            <p className="text-[11px] text-neutral-400">Ciclo Académico 2026 - 2027 • Base de datos SQLite</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onLoginSuccess={handleLoginSuccess}
      />

      <AddTeacherModal
        isOpen={isAddTeacherModalOpen}
        onClose={() => setIsAddTeacherModalOpen(false)}
        onTeacherCreated={handleTeacherCreated}
      />

      <DatabaseBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />

      {currentUser && (
        <AdminProfileModal
          isOpen={isAdminProfileModalOpen}
          currentUser={currentUser}
          onClose={() => setIsAdminProfileModalOpen(false)}
          onUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
            showNotification('success', 'Credenciales del Administrador actualizadas con éxito.');
          }}
        />
      )}
    </div>
  );
}
