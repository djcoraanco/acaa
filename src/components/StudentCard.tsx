import React, { useState } from 'react';
import { Student, SchoolYearWeek, AttendanceStatus } from '../types';
import { AttendanceSheet } from './AttendanceSheet';
import { WeeklyTechnicalNotesSheet } from './WeeklyTechnicalNotesSheet';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { DAYS_OF_WEEK } from '../utils/calendarWeeks';
import {
  BookOpen,
  Music2,
  Award,
  MessageSquare,
  CalendarCheck,
  User,
  Trash2,
  Calendar,
} from 'lucide-react';

interface StudentCardProps {
  student: Student;
  weeks: SchoolYearWeek[];
  canDeleteStudent?: boolean;
  onUpdateStudent: (updated: Student) => void;
  onDeleteStudent: (studentId: string) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  weeks,
  canDeleteStudent = false,
  onUpdateStudent,
  onDeleteStudent,
}) => {
  const [activeTab, setActiveTab] = useState<'repertoire' | 'technical' | 'attendance'>(
    'repertoire'
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleFieldChange = (field: keyof Student, value: string) => {
    onUpdateStudent({
      ...student,
      [field]: value,
    });
  };

  const handleAttendanceChange = (weekKey: string, status: AttendanceStatus) => {
    onUpdateStudent({
      ...student,
      attendance: {
        ...student.attendance,
        [weekKey]: status,
      },
    });
  };

  const handleWeeklyNoteChange = (weekKey: string, note: string) => {
    onUpdateStudent({
      ...student,
      weeklyTechnicalNotes: {
        ...(student.weeklyTechnicalNotes || {}),
        [weekKey]: note,
      },
    });
  };

  const handleWeeklyGradeChange = (weekKey: string, grade: number | null) => {
    onUpdateStudent({
      ...student,
      weeklyGrades: {
        ...(student.weeklyGrades || {}),
        [weekKey]: grade,
      },
    });
  };

  const handleClassDayChange = (classDay: string) => {
    onUpdateStudent({
      ...student,
      classDay,
    });
  };

  const handleClassTimeChange = (classTime: string) => {
    onUpdateStudent({
      ...student,
      classTime,
    });
  };

  const handleGeneralNotesChange = (technicalProgressNotes: string) => {
    onUpdateStudent({
      ...student,
      technicalProgressNotes,
    });
  };

  const weeklyNotesCount = Object.keys(student.weeklyTechnicalNotes || {}).filter(
    (k) => ((student.weeklyTechnicalNotes || {})[k] || '').trim().length > 0
  ).length;

  return (
    <div
      id={`student-card-${student.id}`}
      className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden transition-all"
    >
      {/* Student Card Header */}
      <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/70">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 text-[#252525] flex items-center justify-center font-bold text-sm shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={student.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Nombre completo del alumno"
                className="font-bold text-[#252525] text-base sm:text-lg bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-[#c52227] focus:bg-white px-1 py-0.5 rounded outline-hidden transition-colors"
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-neutral-700">Instrumento:</span>
                <input
                  type="text"
                  value={student.instrument}
                  onChange={(e) => handleFieldChange('instrument', e.target.value)}
                  placeholder="Ej. Violín, Viola, Violonchelo..."
                  className="bg-transparent border-b border-neutral-200 hover:border-neutral-400 focus:border-[#c52227] px-1 py-0.5 rounded outline-hidden text-neutral-800"
                />
              </div>
              <span className="text-neutral-300">•</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-neutral-700">Nivel/Curso:</span>
                <input
                  type="text"
                  value={student.level}
                  onChange={(e) => handleFieldChange('level', e.target.value)}
                  placeholder="Ej. Grado Elemental 2"
                  className="bg-transparent border-b border-neutral-200 hover:border-neutral-400 focus:border-[#c52227] px-1 py-0.5 rounded outline-hidden text-neutral-800"
                />
              </div>
              <span className="text-neutral-300">•</span>
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-neutral-200">
                <Calendar className="w-3.5 h-3.5 text-[#c52227]" />
                <span className="font-semibold text-neutral-700">Día de clase:</span>
                <select
                  value={student.classDay || 'Lunes'}
                  onChange={(e) => handleClassDayChange(e.target.value)}
                  className="bg-transparent font-bold text-neutral-800 outline-hidden cursor-pointer"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Action button: remove student (Only accessible to Admin as requested) */}
        {canDeleteStudent ? (
          <button
            id={`btn-delete-student-${student.id}`}
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 transition-colors self-end sm:self-center font-medium"
            title="Eliminar estudiante (Solo Administrador)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Quitar Alumno</span>
          </button>
        ) : null}
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-neutral-200 px-5 bg-white text-xs font-medium overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('repertoire')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'repertoire'
              ? 'border-[#c52227] text-[#c52227] font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Ficha de Repertorios</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('technical')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'technical'
              ? 'border-[#c52227] text-[#c52227] font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Progreso Técnico Semanal</span>
          {weeklyNotesCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-[#c52227]">
              {weeklyNotesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'attendance'
              ? 'border-[#c52227] text-[#c52227] font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Asistencia Semanal (2026-2027)</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {activeTab === 'repertoire' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Repertorio esperado del ciclo */}
            <div className="space-y-2 flex flex-col">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-800">
                <Music2 className="w-4 h-4 text-[#c52227] shrink-0" />
                <label htmlFor={`expected-${student.id}`}>
                  Repertorio Esperado del Ciclo
                </label>
              </div>
              <p className="text-[11px] text-neutral-400">
                Obras, estudios y piezas obligatorias que el alumno debe abordar en este curso escolar.
              </p>
              <textarea
                id={`expected-${student.id}`}
                rows={5}
                value={student.expectedRepertoire}
                onChange={(e) =>
                  handleFieldChange('expectedRepertoire', e.target.value)
                }
                placeholder="• Ej: Concierto en La Menor de Vivaldi...&#10;• Sevcik Op. 1...&#10;• Escalas y arpegios en 3 octavas..."
                className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden font-mono leading-relaxed bg-neutral-50/50 hover:bg-white resize-y grow transition-colors"
              />
            </div>

            {/* Repertorio de recitales */}
            <div className="space-y-2 flex flex-col">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-800">
                <Award className="w-4 h-4 text-[#c52227] shrink-0" />
                <label htmlFor={`recital-${student.id}`}>
                  Repertorio de Recitales
                </label>
              </div>
              <p className="text-[11px] text-neutral-400">
                Piezas preparadas para audiciones públicas, conciertos de trimestre o recitales de fin de curso.
              </p>
              <textarea
                id={`recital-${student.id}`}
                rows={5}
                value={student.recitalRepertoire}
                onChange={(e) =>
                  handleFieldChange('recitalRepertoire', e.target.value)
                }
                placeholder="• Ej: Danza Española de Falla...&#10;• Meditación de Thais (Massenet)..."
                className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden font-mono leading-relaxed bg-neutral-50/50 hover:bg-white resize-y grow transition-colors"
              />
            </div>

            {/* Repertorio de examenes */}
            <div className="space-y-2 flex flex-col">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-800">
                <BookOpen className="w-4 h-4 text-[#252525] shrink-0" />
                <label htmlFor={`exam-${student.id}`}>
                  Repertorio de Exámenes
                </label>
              </div>
              <p className="text-[11px] text-neutral-400">
                Programa formal para tribunal examinador o pase de nivel (estudios técnicos, obra barroca/clásica/libre).
              </p>
              <textarea
                id={`exam-${student.id}`}
                rows={5}
                value={student.examRepertoire}
                onChange={(e) =>
                  handleFieldChange('examRepertoire', e.target.value)
                }
                placeholder="1. Estudio técnico obligatorio (Kreutzer)...&#10;2. Movimiento de Sonata/Partita barroca...&#10;3. Obra de libre elección..."
                className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden font-mono leading-relaxed bg-neutral-50/50 hover:bg-white resize-y grow transition-colors"
              />
            </div>
          </div>
        )}

        {activeTab === 'technical' && (
          <WeeklyTechnicalNotesSheet
            student={student}
            weeks={weeks}
            onUpdateWeeklyNote={handleWeeklyNoteChange}
            onUpdateWeeklyGrade={handleWeeklyGradeChange}
            onUpdateClassDay={handleClassDayChange}
            onUpdateClassTime={handleClassTimeChange}
            onUpdateGeneralNotes={handleGeneralNotesChange}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceSheet
            weeks={weeks}
            attendance={student.attendance || {}}
            onChangeAttendance={handleAttendanceChange}
            studentName={student.name}
          />
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        title="¿Eliminar alumno de la academia?"
        description={`¿Estás seguro de que deseas eliminar la ficha completa de "${student.name || 'este estudiante'}"? Se borrarán sus repertorios, comentarios técnicos y registro de asistencia en la base de datos.`}
        confirmText="Sí, eliminar alumno"
        onConfirm={() => onDeleteStudent(student.id)}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
