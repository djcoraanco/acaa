import React, { useState, useMemo, useEffect } from 'react';
import {
  MusicReadingSection,
  MusicReadingSession,
  MusicReadingStudentSessionRecord,
  AttendanceStatus,
  SchoolYearWeek,
  Teacher,
} from '../types';
import { getClassDateForWeek } from '../utils/calendarWeeks';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  AlertCircle,
  Award,
  BookOpen,
  MessageSquare,
  CheckCheck,
  GraduationCap,
} from 'lucide-react';
import { AddSectionModal } from './AddSectionModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface MusicReadingManagerProps {
  sections: MusicReadingSection[];
  allStudents: { id: string; name: string; instrument: string; level: string; teacherName: string }[];
  teachers: Teacher[];
  weeks: SchoolYearWeek[];
  onSaveSection: (section: MusicReadingSection) => Promise<void>;
  onDeleteSection: (sectionId: string) => Promise<void>;
  onCreateSection: (data: {
    name: string;
    level: string;
    teacherId?: string | null;
    teacherName?: string;
    dayOfWeek: string;
    classTime: string;
    room?: string;
    studentIds: string[];
  }) => Promise<void>;
}

export const MusicReadingManager: React.FC<MusicReadingManagerProps> = ({
  sections = [],
  allStudents = [],
  teachers = [],
  weeks = [],
  onSaveSection,
  onDeleteSection,
  onCreateSection,
}) => {
  const safeSections = useMemo(() => {
    if (Array.isArray(sections)) return sections;
    if ((sections as any)?.sections && Array.isArray((sections as any).sections)) return (sections as any).sections;
    return [];
  }, [sections]);

  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    safeSections.length > 0 ? safeSections[0].id : ''
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingSection, setEditingSection] = useState<MusicReadingSection | null>(null);
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null);

  // Sync selectedSectionId when safeSections changes
  useEffect(() => {
    if (safeSections.length > 0) {
      if (!selectedSectionId || !safeSections.some((s) => s.id === selectedSectionId)) {
        setSelectedSectionId(safeSections[0].id);
      }
    }
  }, [safeSections, selectedSectionId]);

  // Active section
  const currentSection = useMemo(() => {
    return safeSections.find((s) => s.id === selectedSectionId) || safeSections[0] || null;
  }, [safeSections, selectedSectionId]);

  // Selected week for active session in this section
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(weeks[0]?.weekKey || '2026-09-07');

  // Enrolled students objects in current section
  const enrolledStudents = useMemo(() => {
    if (!currentSection) return [];
    const idSet = new Set(currentSection.studentIds || []);
    return allStudents.filter((s) => idSet.has(s.id));
  }, [currentSection, allStudents]);

  // Current session object
  const currentSession: MusicReadingSession = useMemo(() => {
    if (!currentSection) {
      return {
        date: '',
        weekKey: selectedWeekKey,
        topic: '',
        generalComment: '',
        records: {},
      };
    }

    const sessionsMap = currentSection.sessions || {};
    const existing = sessionsMap[selectedWeekKey];

    if (existing) {
      return existing;
    }

    // Default calculated date based on section day of week
    const dateInfo = getClassDateForWeek(selectedWeekKey, currentSection.dayOfWeek || 'Sábado');
    return {
      date: dateInfo.isoDate,
      weekKey: selectedWeekKey,
      topic: '',
      generalComment: '',
      records: {},
    };
  }, [currentSection, selectedWeekKey]);

  // Handle updates to the active session
  const handleUpdateCurrentSession = (updatedSession: MusicReadingSession) => {
    if (!currentSection) return;

    const currentSessions = { ...(currentSection.sessions || {}) };
    currentSessions[selectedWeekKey] = updatedSession;

    onSaveSection({
      ...currentSection,
      sessions: currentSessions,
    });
  };

  // Student Record updater inside current session
  const handleStudentRecordChange = (
    studentId: string,
    updates: Partial<MusicReadingStudentSessionRecord>
  ) => {
    const existingRec: MusicReadingStudentSessionRecord = currentSession.records[studentId] || {
      studentId,
      attendance: undefined,
      participatedTheory: false,
      participatedAuditoryOrSung: false,
      participatedWritten: false,
      grade: null,
      studentComment: '',
    };

    const newRec: MusicReadingStudentSessionRecord = { ...existingRec, ...updates };

    const updatedSession: MusicReadingSession = {
      ...currentSession,
      records: {
        ...currentSession.records,
        [studentId]: newRec,
      },
    };

    handleUpdateCurrentSession(updatedSession);
  };

  // Mark all enrolled students as present in current session
  const handleMarkAllPresent = () => {
    const newRecords: { [studentId: string]: MusicReadingStudentSessionRecord } = {
      ...currentSession.records,
    };

    enrolledStudents.forEach((std) => {
      const current = newRecords[std.id] || {
        studentId: std.id,
        attendance: undefined,
        participatedTheory: false,
        participatedAuditoryOrSung: false,
        participatedWritten: false,
        grade: null,
        studentComment: '',
      };
      newRecords[std.id] = {
        ...current,
        attendance: 'present',
      };
    });

    handleUpdateCurrentSession({
      ...currentSession,
      records: newRecords,
    });
  };

  // Stats calculation for active session
  const sessionStats = useMemo(() => {
    const recordsList = Object.values(currentSession.records || {});
    const totalEnrolled = enrolledStudents.length;
    const presentCount = recordsList.filter((r) => r.attendance === 'present').length;
    const absentCount = recordsList.filter((r) => r.attendance === 'absent').length;
    const justifiedCount = recordsList.filter((r) => r.attendance === 'justified').length;
    const theoryCount = recordsList.filter((r) => r.participatedTheory).length;
    const auditoryCount = recordsList.filter(
      (r) => Boolean(r.participatedAuditoryOrSung ?? r.participatedWritten)
    ).length;

    const grades = recordsList
      .map((r) => r.grade)
      .filter((g): g is number => typeof g === 'number' && !isNaN(g));
    const avgGrade =
      grades.length > 0 ? (grades.reduce((sum, g) => sum + g, 0) / grades.length).toFixed(1) : null;

    return {
      totalEnrolled,
      presentCount,
      absentCount,
      justifiedCount,
      theoryCount,
      auditoryCount,
      avgGrade,
      gradedCount: grades.length,
    };
  }, [currentSession, enrolledStudents]);

  return (
    <div id="music-reading-manager" className="space-y-6">
      {/* Sections Selector & Admin Bar */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#252525] text-white flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-[#c52227]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-[#252525]">
                  Secciones de Lectura Musical y Lenguaje
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-bold border border-neutral-200">
                  Clases Colectivas
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Control de asistencia colectiva, parte teórica y parte auditiva/cantada, notas de clase y calificaciones de solfeo.
              </p>
            </div>
          </div>

          <button
            id="btn-add-reading-section"
            type="button"
            onClick={() => {
              setEditingSection(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#c52227] hover:bg-[#a81b20] text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nueva Sección</span>
          </button>
        </div>

        {/* Section Tabs / Badges */}
        {safeSections.length === 0 ? (
          <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 space-y-2">
            <Users className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="text-xs font-semibold text-neutral-600">
              No hay secciones grupales creadas todavía.
            </p>
            <p className="text-[11px] text-neutral-400 max-w-sm mx-auto">
              Haz clic en "Crear Nueva Sección" para agrupar alumnos y comenzar a registrar sus evaluaciones colectivas.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
            {safeSections.map((sec) => {
              const isSelected = currentSection?.id === sec.id;
              const studentCount = (sec.studentIds || []).length;
              return (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-[#252525] text-white border-[#252525] shadow-xs'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <span>{sec.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {studentCount} {studentCount === 1 ? 'alumno' : 'alumnos'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Section Details & Session Control */}
      {currentSection && (
        <div className="space-y-5">
          {/* Section Info Card */}
          <div className="bg-neutral-50/70 border border-neutral-200 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-black text-[#252525]">{currentSection.name}</h4>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#252525] text-white">
                  {currentSection.level}
                </span>
                {currentSection.teacherName && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-[#c52227]" />
                    Prof. {currentSection.teacherName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-neutral-600 flex-wrap">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#c52227]" />
                  <span>Día: <strong className="text-neutral-900">{currentSection.dayOfWeek}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Horario: <strong className="text-neutral-900">{currentSection.classTime} hrs</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Espacio: <strong className="text-neutral-900">{currentSection.room}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#c52227]" />
                  <span>Matriculados: <strong className="text-neutral-900">{enrolledStudents.length} estudiantes</strong></span>
                </div>
              </div>
            </div>

            {/* Section Actions */}
            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingSection(currentSection);
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-xl transition-colors shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
                <span>Editar Matrícula / Datos</span>
              </button>

              <button
                type="button"
                onClick={() => setDeletingSectionId(currentSection.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#c52227] hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
                title="Eliminar esta sección"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            </div>
          </div>

          {/* Academic Weeks Navigation for this Section */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#c52227]" />
                <h4 className="text-xs font-bold text-[#252525] uppercase tracking-wider">
                  Seleccionar Clase Semanal (Ciclo 2026–2027)
                </h4>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  disabled={enrolledStudents.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Marcar Todos Asisten</span>
                </button>
              </div>
            </div>

            {/* Weeks Selector Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
              {weeks.map((w) => {
                const dateInfo = getClassDateForWeek(w.weekKey, currentSection.dayOfWeek || 'Sábado');
                const isSelected = selectedWeekKey === w.weekKey;
                const existing = (currentSection.sessions || {})[w.weekKey];
                const hasData = existing && (
                  Object.keys(existing.records || {}).length > 0 ||
                  Boolean(existing.topic) ||
                  Boolean(existing.generalComment)
                );

                return (
                  <button
                    key={w.weekKey}
                    type="button"
                    onClick={() => setSelectedWeekKey(w.weekKey)}
                    className={`px-3 py-2 rounded-xl text-left transition-all shrink-0 border ${
                      isSelected
                        ? 'bg-[#252525] text-white border-[#252525] shadow-xs'
                        : hasData
                        ? 'bg-red-50/70 border-red-200 text-neutral-800 hover:bg-red-50'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[11px]">Sem {w.weekNumber}</span>
                      {hasData && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c52227]" />
                      )}
                    </div>
                    <div className={`text-[10px] ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                      {dateInfo.dayNumber} {dateInfo.shortMonth}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Session Topic & General Observations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#c52227]" />
                  <span>Tema / Contenidos del Día</span>
                </label>
                <input
                  type="text"
                  value={currentSession.topic || ''}
                  onChange={(e) =>
                    handleUpdateCurrentSession({
                      ...currentSession,
                      topic: e.target.value,
                    })
                  }
                  placeholder="Ej. Solfeo rítmico a dos voces, dictado melódico en Do M, intervalos de 3ª..."
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden bg-neutral-50 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#252525]" />
                  <span>Observaciones Generales de la Clase Grupal</span>
                </label>
                <input
                  type="text"
                  value={currentSession.generalComment || ''}
                  onChange={(e) =>
                    handleUpdateCurrentSession({
                      ...currentSession,
                      generalComment: e.target.value,
                    })
                  }
                  placeholder="Ej. Excelente atención del grupo, reforzar lectura rítmica en compás de 6/8..."
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden bg-neutral-50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Session Quick Metrics Bar */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-semibold text-neutral-700">
                  Asistencia:{' '}
                  <strong className="text-emerald-700">{sessionStats.presentCount} asisten</strong> /{' '}
                  <strong className="text-[#c52227]">{sessionStats.absentCount} faltas</strong>
                </span>
                <span className="text-neutral-300">|</span>
                <span className="font-semibold text-neutral-700">
                  Parte Teórica:{' '}
                  <strong className="text-blue-700">{sessionStats.theoryCount} participaron</strong>
                </span>
                <span className="text-neutral-300">|</span>
                <span className="font-semibold text-neutral-700">
                  Parte Auditiva/Cantada:{' '}
                  <strong className="text-purple-700">{sessionStats.auditoryCount} participaron</strong>
                </span>
              </div>

              {sessionStats.avgGrade && (
                <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-amber-900 font-bold">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>Promedio de la sesión: {sessionStats.avgGrade} / 10</span>
                </div>
              )}
            </div>

            {/* Students Session Evaluation Table */}
            <div className="pt-2">
              <div className="text-xs font-bold text-neutral-800 mb-2 flex items-center justify-between">
                <span>Evaluación Individual por Estudiante en esta Clase</span>
                <span className="text-[11px] text-neutral-400 font-normal">
                  {enrolledStudents.length} estudiantes matriculados
                </span>
              </div>

              {enrolledStudents.length === 0 ? (
                <div className="text-center py-8 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                  <Users className="w-6 h-6 text-neutral-400 mx-auto" />
                  <p className="text-xs font-semibold text-neutral-700">
                    No hay estudiantes matriculados en esta sección.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSection(currentSection);
                      setIsAddModalOpen(true);
                    }}
                    className="text-xs font-bold text-[#c52227] hover:underline"
                  >
                    Matricular estudiantes ahora
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {enrolledStudents.map((std) => {
                    const record = currentSession.records[std.id] || {
                      studentId: std.id,
                      attendance: undefined,
                      participatedTheory: false,
                      participatedAuditoryOrSung: false,
                      participatedWritten: false,
                      grade: null,
                      studentComment: '',
                    };

                    return (
                      <div
                        key={std.id}
                        id={`reading-row-${std.id}`}
                        className="bg-white border border-neutral-200 rounded-2xl p-3.5 space-y-3 transition-all hover:border-neutral-300 shadow-2xs"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          {/* Student Info */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-neutral-100 text-[#252525] font-bold text-xs flex items-center justify-center shrink-0">
                              {std.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-[#252525] flex items-center gap-2">
                                <span>{std.name}</span>
                                <span className="text-[10px] font-medium text-neutral-400">
                                  ({std.instrument})
                                </span>
                              </div>
                              <span className="text-[10px] text-neutral-500">
                                Tutor: {std.teacherName} • {std.level}
                              </span>
                            </div>
                          </div>

                          {/* Attendance Buttons */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-semibold text-neutral-500 mr-1">
                              Asistencia:
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleStudentRecordChange(std.id, {
                                  attendance: record.attendance === 'present' ? undefined : 'present',
                                })
                              }
                              className={`px-2.5 py-1 text-xs rounded-lg font-bold flex items-center gap-1 transition-colors ${
                                record.attendance === 'present'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-neutral-100 text-neutral-600 hover:bg-emerald-50 hover:text-emerald-800'
                              }`}
                            >
                              <Check className="w-3 h-3" />
                              <span>Asiste</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleStudentRecordChange(std.id, {
                                  attendance: record.attendance === 'absent' ? undefined : 'absent',
                                })
                              }
                              className={`px-2.5 py-1 text-xs rounded-lg font-bold flex items-center gap-1 transition-colors ${
                                record.attendance === 'absent'
                                  ? 'bg-[#c52227] text-white shadow-xs'
                                  : 'bg-neutral-100 text-neutral-600 hover:bg-red-50 hover:text-[#c52227]'
                              }`}
                            >
                              <X className="w-3 h-3" />
                              <span>Falta</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleStudentRecordChange(std.id, {
                                  attendance: record.attendance === 'justified' ? undefined : 'justified',
                                })
                              }
                              className={`px-2.5 py-1 text-xs rounded-lg font-bold flex items-center gap-1 transition-colors ${
                                record.attendance === 'justified'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-neutral-100 text-neutral-600 hover:bg-amber-50 hover:text-amber-800'
                              }`}
                            >
                              <AlertCircle className="w-3 h-3" />
                              <span>Justificada</span>
                            </button>
                          </div>

                          {/* Theory & Written Participation Toggles */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <label className="flex items-center gap-1.5 cursor-pointer bg-neutral-50 hover:bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200 transition-colors">
                              <input
                                type="checkbox"
                                checked={Boolean(record.participatedTheory)}
                                onChange={(e) =>
                                  handleStudentRecordChange(std.id, {
                                    participatedTheory: e.target.checked,
                                  })
                                }
                                className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                              />
                              <span className="text-[11px] font-bold text-neutral-700">
                                Parte Teórica
                              </span>
                            </label>

                            <label className="flex items-center gap-1.5 cursor-pointer bg-neutral-50 hover:bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200 transition-colors">
                              <input
                                type="checkbox"
                                checked={Boolean(record.participatedAuditoryOrSung ?? record.participatedWritten)}
                                onChange={(e) =>
                                  handleStudentRecordChange(std.id, {
                                    participatedAuditoryOrSung: e.target.checked,
                                    participatedWritten: e.target.checked,
                                  })
                                }
                                className="w-3.5 h-3.5 accent-purple-600 rounded cursor-pointer"
                              />
                              <span className="text-[11px] font-bold text-neutral-700">
                                Parte Auditiva/Cantada
                              </span>
                            </label>
                          </div>

                          {/* Grade per Day */}
                          <div className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1 rounded-xl border border-neutral-200 shrink-0">
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-[11px] font-bold text-neutral-700">Nota:</span>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              value={record.grade !== null && record.grade !== undefined ? record.grade : ''}
                              onChange={(e) => {
                                const val =
                                  e.target.value === ''
                                    ? null
                                    : Math.min(10, Math.max(0, parseFloat(e.target.value)));
                                handleStudentRecordChange(std.id, { grade: val });
                              }}
                              placeholder="—"
                              className="w-12 text-center text-xs font-bold bg-white border border-neutral-300 rounded px-1 py-0.5 focus:border-[#c52227] focus:outline-hidden"
                            />
                            <span className="text-[10px] text-neutral-400 font-bold">/ 10</span>
                          </div>
                        </div>

                        {/* Individual Student Comment */}
                        <div className="flex items-center gap-2 pt-1 border-t border-neutral-100">
                          <MessageSquare className="w-3 h-3 text-neutral-400 shrink-0" />
                          <input
                            type="text"
                            value={record.studentComment || ''}
                            onChange={(e) =>
                              handleStudentRecordChange(std.id, { studentComment: e.target.value })
                            }
                            placeholder={`Comentario de lectura para ${std.name} (ej. Afinación de solfeo, dictado rítmico, tarea pendiente)...`}
                            className="w-full text-xs px-2.5 py-1 rounded-lg border border-neutral-200 focus:border-[#c52227] outline-hidden bg-neutral-50/60 focus:bg-white text-neutral-800"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Section Modal */}
      <AddSectionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSection(null);
        }}
        onSubmit={async (data) => {
          if (editingSection) {
            await onSaveSection({
              ...editingSection,
              ...data,
            });
          } else {
            await onCreateSection(data);
          }
        }}
        teachers={teachers}
        allStudents={allStudents}
        editingSection={editingSection}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingSectionId)}
        title="¿Eliminar sección de Lectura Musical?"
        description="Esta acción eliminará el grupo y los registros de asistencia y notas de sus sesiones grupales. Las fichas de los estudiantes en sus cátedras de instrumento se mantendrán intactas."
        confirmText="Sí, eliminar sección"
        onConfirm={async () => {
          if (deletingSectionId) {
            await onDeleteSection(deletingSectionId);
            setDeletingSectionId(null);
          }
        }}
        onClose={() => setDeletingSectionId(null)}
      />
    </div>
  );
};
