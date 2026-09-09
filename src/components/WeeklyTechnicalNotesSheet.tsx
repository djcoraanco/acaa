import React, { useState, useMemo } from 'react';
import { Student, SchoolYearWeek, AttendanceStatus } from '../types';
import { getClassDateForWeek, DAYS_OF_WEEK } from '../utils/calendarWeeks';
import {
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Search,
  MessageSquare,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  CalendarDays,
  Sparkles,
  Bookmark,
  Award,
} from 'lucide-react';

interface WeeklyTechnicalNotesSheetProps {
  student: Student;
  weeks: SchoolYearWeek[];
  onUpdateWeeklyNote: (weekKey: string, note: string) => void;
  onUpdateWeeklyGrade: (weekKey: string, grade: number | null) => void;
  onUpdateClassDay: (classDay: string) => void;
  onUpdateClassTime: (classTime: string) => void;
  onUpdateGeneralNotes: (generalNotes: string) => void;
}

export const WeeklyTechnicalNotesSheet: React.FC<WeeklyTechnicalNotesSheetProps> = ({
  student,
  weeks,
  onUpdateWeeklyNote,
  onUpdateWeeklyGrade,
  onUpdateClassDay,
  onUpdateClassTime,
  onUpdateGeneralNotes,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [onlyWithNotes, setOnlyWithNotes] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showGeneralNotes, setShowGeneralNotes] = useState<boolean>(false);

  const studentClassDay = student.classDay || 'Lunes';
  const studentClassTime = student.classTime || '16:00';
  const weeklyNotes = student.weeklyTechnicalNotes || {};
  const weeklyGrades = student.weeklyGrades || {};
  const attendance = student.attendance || {};

  // Calculate student average grade
  const validGrades = Object.values(weeklyGrades).filter((g): g is number => typeof g === 'number' && !isNaN(g));
  const averageGrade = validGrades.length > 0
    ? (validGrades.reduce((sum, g) => sum + g, 0) / validGrades.length).toFixed(1)
    : null;

  // Months available
  const months = useMemo(() => {
    const map = new Map<string, string>();
    weeks.forEach((w) => {
      if (!map.has(w.monthName)) {
        map.set(w.monthName, w.shortMonth);
      }
    });
    return Array.from(map.entries()).map(([monthName, shortMonth]) => ({
      monthName,
      shortMonth,
    }));
  }, [weeks]);

  // Filtered weeks
  const filteredWeeks = useMemo(() => {
    return weeks.filter((w) => {
      if (selectedMonth !== 'all' && w.monthName !== selectedMonth) {
        return false;
      }
      const note = weeklyNotes[w.weekKey] || '';
      if (onlyWithNotes && !note.trim()) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const dateInfo = getClassDateForWeek(w.weekKey, studentClassDay);
        const matchesDate = dateInfo.fullDateStr.toLowerCase().includes(query);
        const matchesNote = note.toLowerCase().includes(query);
        const matchesWeek = `semana ${w.weekNumber}`.includes(query);
        return matchesDate || matchesNote || matchesWeek;
      }
      return true;
    });
  }, [weeks, selectedMonth, onlyWithNotes, searchQuery, weeklyNotes, studentClassDay]);

  // Statistics
  const totalWeeks = weeks.length;
  const commentedWeeksCount = Object.keys(weeklyNotes).filter(
    (k) => (weeklyNotes[k] || '').trim().length > 0
  ).length;
  const percentage = totalWeeks > 0 ? Math.round((commentedWeeksCount / totalWeeks) * 100) : 0;

  const getAttendanceBadge = (status?: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" /> Asiste
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-[#c52227] border border-red-200">
            <X className="w-3 h-3 text-[#c52227]" /> Falta
          </span>
        );
      case 'justified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" /> Justificada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-neutral-500 bg-neutral-100 border border-neutral-200">
            <HelpCircle className="w-3 h-3 text-neutral-400" /> Asistencia Pendiente
          </span>
        );
    }
  };

  return (
    <div id={`weekly-notes-container-${student.id}`} className="space-y-4">
      {/* Student Class Schedule Header */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#252525] text-white flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-[#c52227]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-[#252525] text-sm">
                Registro Semanal de Progreso Técnico
              </h4>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-200/80 text-neutral-700 font-semibold">
                Ciclo 2026 – 2027
              </span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Las fechas de cada comentario se calculan automáticamente según el día semanal de clase de{' '}
              <strong className="text-[#252525] font-semibold">{student.name}</strong>.
            </p>
          </div>
        </div>

        {/* Schedule Selector */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-neutral-200 shrink-0 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-4 h-4 text-[#c52227]" />
            <span className="font-bold text-neutral-700">Día de clase:</span>
            <select
              value={studentClassDay}
              onChange={(e) => onUpdateClassDay(e.target.value)}
              className="bg-neutral-50 border border-neutral-300 rounded-lg px-2 py-1 font-semibold text-neutral-800 text-xs focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden cursor-pointer"
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-neutral-200" />

          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span className="font-semibold text-neutral-600">Hora:</span>
            <input
              type="text"
              value={studentClassTime}
              onChange={(e) => onUpdateClassTime(e.target.value)}
              placeholder="16:00"
              className="w-16 bg-neutral-50 border border-neutral-300 rounded-lg px-2 py-1 font-medium text-neutral-800 text-xs focus:border-[#c52227] outline-hidden text-center"
            />
          </div>
        </div>
      </div>

      {/* Progress metrics and filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-neutral-200 rounded-xl p-3">
        {/* Progress indicator */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
            <CheckCircle2 className="w-4 h-4 text-[#c52227]" />
            <span>
              {commentedWeeksCount} de {totalWeeks} semanas comentadas
            </span>
          </div>
          <div className="hidden md:flex items-center w-28 h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
            <div
              className="h-full bg-[#c52227] rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-[#c52227] bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
            {percentage}%
          </span>

          {averageGrade && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Promedio: {averageGrade} / 10</span>
            </div>
          )}
        </div>

        {/* Filter and search */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar fecha o comentario..."
              className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 focus:border-[#c52227] outline-hidden bg-neutral-50 focus:bg-white w-44 sm:w-52"
            />
          </div>

          <button
            type="button"
            onClick={() => setOnlyWithNotes(!onlyWithNotes)}
            className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1 font-medium ${
              onlyWithNotes
                ? 'bg-neutral-800 text-white border-neutral-800'
                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Con comentarios</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGeneralNotes(!showGeneralNotes)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-1 font-medium"
          >
            <FileText className="w-3.5 h-3.5 text-[#c52227]" />
            <span>{showGeneralNotes ? 'Ocultar Resumen General' : 'Ver Resumen General'}</span>
          </button>
        </div>
      </div>

      {/* Month Pills Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setSelectedMonth('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 ${
            selectedMonth === 'all'
              ? 'bg-[#c52227] text-white shadow-xs'
              : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
          }`}
        >
          Todo el Curso ({weeks.length})
        </button>
        {months.map((m) => {
          const isSelected = selectedMonth === m.monthName;
          return (
            <button
              key={m.monthName}
              type="button"
              onClick={() => setSelectedMonth(m.monthName)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                isSelected
                  ? 'bg-[#252525] text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {m.shortMonth}
            </button>
          );
        })}
      </div>

      {/* General Annual Observations Collapsible */}
      {showGeneralNotes && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Observaciones Generales y Objetivos Anuales de la Cátedra</span>
          </div>
          <p className="text-[11px] text-amber-800">
            Este apartado recopila el diagnóstico general, metas de fin de curso y conclusiones del progreso técnico global del alumno.
          </p>
          <textarea
            rows={4}
            value={student.technicalProgressNotes || ''}
            onChange={(e) => onUpdateGeneralNotes(e.target.value)}
            placeholder="Escribe el balance general, diagnóstico del alumno o metas globales del curso..."
            className="w-full text-xs p-3 rounded-xl border border-amber-200 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden leading-relaxed resize-y"
          />
        </div>
      )}

      {/* Weekly Comments List */}
      <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
        {filteredWeeks.length === 0 ? (
          <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300 space-y-2">
            <MessageSquare className="w-8 h-8 text-neutral-400 mx-auto" />
            <p className="text-xs font-semibold text-neutral-600">
              No hay semanas que coincidan con los filtros seleccionados.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedMonth('all');
                setOnlyWithNotes(false);
                setSearchQuery('');
              }}
              className="text-xs font-bold text-[#c52227] hover:underline"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          filteredWeeks.map((week) => {
            const dateInfo = getClassDateForWeek(week.weekKey, studentClassDay);
            const currentNote = weeklyNotes[week.weekKey] || '';
            const attStatus = attendance[week.weekKey];
            const hasComment = currentNote.trim().length > 0;

            return (
              <div
                key={week.weekKey}
                id={`weekly-card-${student.id}-${week.weekKey}`}
                className={`border rounded-2xl p-4 bg-white transition-all ${
                  hasComment
                    ? 'border-neutral-300 shadow-2xs'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {/* Week Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-neutral-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-[#252525] text-white text-[11px] font-bold tracking-wide">
                      Semana {week.weekNumber}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                      <Calendar className="w-3.5 h-3.5 text-[#c52227]" />
                      <span>{dateInfo.fullDateStr}</span>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-medium">
                      ({studentClassTime} hrs)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Calificación de la clase de instrumento */}
                    <div className="flex items-center gap-1 bg-neutral-50 px-2 py-1 rounded-lg border border-neutral-200">
                      <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-[11px] font-semibold text-neutral-600">Nota:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={weeklyGrades[week.weekKey] !== undefined && weeklyGrades[week.weekKey] !== null ? weeklyGrades[week.weekKey]! : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Math.min(10, Math.max(0, parseFloat(e.target.value)));
                          onUpdateWeeklyGrade(week.weekKey, val);
                        }}
                        placeholder="—"
                        className="w-12 text-center text-xs font-bold bg-white border border-neutral-300 rounded px-1 py-0.5 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] focus:outline-hidden"
                      />
                      <span className="text-[10px] text-neutral-400 font-bold">/10</span>
                      {weeklyGrades[week.weekKey] !== undefined && weeklyGrades[week.weekKey] !== null && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            weeklyGrades[week.weekKey]! >= 9
                              ? 'bg-emerald-100 text-emerald-800'
                              : weeklyGrades[week.weekKey]! >= 7
                              ? 'bg-blue-100 text-blue-800'
                              : weeklyGrades[week.weekKey]! >= 5
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-[#c52227]'
                          }`}
                        >
                          {weeklyGrades[week.weekKey]! >= 9
                            ? 'Sobresaliente'
                            : weeklyGrades[week.weekKey]! >= 7
                            ? 'Notable'
                            : weeklyGrades[week.weekKey]! >= 5
                            ? 'Aprobado'
                            : 'Insuficiente'}
                        </span>
                      )}
                    </div>

                    {getAttendanceBadge(attStatus)}
                    {hasComment && (
                      <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                        Registrado
                      </span>
                    )}
                  </div>
                </div>

                {/* Week Technical Note Editor */}
                <div className="space-y-1.5">
                  <label
                    htmlFor={`note-${student.id}-${week.weekKey}`}
                    className="text-[11px] font-semibold text-neutral-600 block flex items-center justify-between"
                  >
                    <span>Comentario técnico y tareas de la clase:</span>
                    {hasComment && (
                      <span className="text-[10px] text-neutral-400 font-normal">
                        {currentNote.trim().length} caracteres
                      </span>
                    )}
                  </label>
                  <textarea
                    id={`note-${student.id}-${week.weekKey}`}
                    rows={3}
                    value={currentNote}
                    onChange={(e) => onUpdateWeeklyNote(week.weekKey, e.target.value)}
                    placeholder={`Comentario de la clase del ${dateInfo.fullDateStr}: postura, afinación, técnica de arco, compases trabajados, tareas asignadas para la próxima semana...`}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden leading-relaxed bg-neutral-50/60 hover:bg-white focus:bg-white resize-y transition-colors font-sans text-neutral-800"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
