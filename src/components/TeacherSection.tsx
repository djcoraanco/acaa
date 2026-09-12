import React, { useState } from 'react';
import { Teacher, Student, SchoolYearWeek } from '../types';
import { StudentCard } from './StudentCard';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { EditTeacherModal } from './EditTeacherModal';
import {
  UserPlus,
  Users,
  GraduationCap,
  Music,
  ChevronDown,
  ChevronUp,
  Trash2,
  KeyRound,
} from 'lucide-react';

interface TeacherSectionProps {
  teacher: Teacher;
  weeks: SchoolYearWeek[];
  canDeleteTeacher: boolean;
  canDeleteStudent?: boolean;
  canAddStudent?: boolean;
  canEditTeacher?: boolean;
  canEditStudentInfo?: boolean;
  onUpdateTeacher: (updated: Teacher) => void;
  onDeleteTeacher: (teacherId: string) => void;
  onAddStudent: (teacherId: string) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  defaultExpanded?: boolean;
}

export const TeacherSection: React.FC<TeacherSectionProps> = ({
  teacher,
  weeks,
  canDeleteTeacher,
  canDeleteStudent = false,
  canAddStudent = false,
  canEditTeacher = false,
  canEditStudentInfo = false,
  onUpdateTeacher,
  onDeleteTeacher,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showDeleteTeacherConfirm, setShowDeleteTeacherConfirm] = useState(false);
  const [isEditCredentialsOpen, setIsEditCredentialsOpen] = useState(false);

  return (
    <section
      id={`teacher-section-${teacher.id}`}
      className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden"
    >
      {/* Teacher Section Header with Dark Charcoal and Brand Red */}
      <div className="bg-[#252525] text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-[#c52227]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {canEditTeacher ? (
                <input
                  type="text"
                  value={teacher.name}
                  onChange={(e) =>
                    onUpdateTeacher({ ...teacher, name: e.target.value })
                  }
                  placeholder="Nombre del Profesor/a"
                  className="font-bold text-lg sm:text-xl text-white bg-transparent border-b border-transparent hover:border-white/30 focus:border-[#c52227] px-1 py-0.5 rounded outline-hidden"
                />
              ) : (
                <span className="font-bold text-lg sm:text-xl text-white px-1 py-0.5">
                  {teacher.name}
                </span>
              )}
              {teacher.username && (
                <span className="text-[11px] bg-white/10 border border-white/20 text-neutral-300 px-2.5 py-0.5 rounded-full font-mono">
                  @{teacher.username}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-300 mt-0.5">
              <Music className="w-3.5 h-3.5 text-[#c52227]" />
              {canEditTeacher ? (
                <input
                  type="text"
                  value={teacher.department}
                  onChange={(e) =>
                    onUpdateTeacher({ ...teacher, department: e.target.value })
                  }
                  placeholder="Cátedra / Especialidad (ej. Piano, Violín, Guitarra)"
                  className="bg-transparent border-b border-white/20 hover:border-white/40 focus:border-[#c52227] px-1 py-0.5 rounded outline-hidden text-neutral-200"
                />
              ) : (
                <span className="text-neutral-200 font-medium px-1 py-0.5">
                  Cátedra de {teacher.department}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end md:self-center">
          {canAddStudent && (
            <button
              id={`btn-add-student-${teacher.id}`}
              type="button"
              onClick={() => {
                onAddStudent(teacher.id);
                setIsExpanded(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#c52227] hover:bg-[#a81b20] text-white rounded-xl shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Agregar Estudiante</span>
            </button>
          )}

          {canDeleteTeacher && (
            <>
              <button
                id={`btn-edit-credentials-${teacher.id}`}
                type="button"
                onClick={() => setIsEditCredentialsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 shadow-xs transition-colors"
                title="Modificar usuario y contraseña de este profesor"
              >
                <KeyRound className="w-3.5 h-3.5 text-neutral-300" />
                <span className="hidden sm:inline">Usuario y Clave</span>
              </button>

              <button
                id={`btn-delete-teacher-${teacher.id}`}
                type="button"
                onClick={() => setShowDeleteTeacherConfirm(true)}
                className="inline-flex items-center p-2 text-neutral-400 hover:text-red-400 hover:bg-white/10 rounded-xl transition-colors border border-transparent hover:border-red-400/30"
                title="Eliminar cátedra y profesor (Solo Admin)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title={isExpanded ? 'Colapsar apartado' : 'Expandir apartado'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Subheader info bar */}
      <div className="px-5 py-2.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-neutral-500" />
          <span>
            Lista de estudiantes asignados:{' '}
            <strong className="text-[#252525]">{teacher.students.length}</strong> alumnos
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-[#c52227] hover:text-[#a81b20] font-semibold"
        >
          {isExpanded ? 'Ocultar fichas' : 'Ver fichas de estudiantes'}
        </button>
      </div>

      {/* Student List */}
      {isExpanded && (
        <div className="p-5 space-y-5 bg-slate-50/50">
          {teacher.students.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-white p-6">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                {canAddStudent
                  ? 'Este profesor no tiene estudiantes todavía'
                  : 'Aún no tienes estudiantes asignados a tu cátedra'}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                {canAddStudent
                  ? 'Agrega al primer alumno para gestionar sus repertorios del ciclo, recitales, exámenes y asistencia.'
                  : 'La dirección académica asignará a tus alumnos en el sistema.'}
              </p>
              {canAddStudent && (
                <button
                  type="button"
                  onClick={() => onAddStudent(teacher.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#c52227] hover:bg-[#a81b20] text-white rounded-xl transition-colors shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Agregar Estudiante Ahora</span>
                </button>
              )}
            </div>
          ) : (
            teacher.students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                weeks={weeks}
                canDeleteStudent={canDeleteStudent}
                canEditStudentInfo={canEditStudentInfo}
                onUpdateStudent={onUpdateStudent}
                onDeleteStudent={onDeleteStudent}
              />
            ))
          )}
        </div>
      )}

      {/* Admin Modals */}
      <EditTeacherModal
        isOpen={isEditCredentialsOpen}
        teacher={teacher}
        onClose={() => setIsEditCredentialsOpen(false)}
        onTeacherUpdated={(updated) => onUpdateTeacher(updated)}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteTeacherConfirm}
        title={`¿Eliminar al profesor/a ${teacher.name}?`}
        description={`Se eliminará permanentemente la cátedra de "${teacher.department}", el acceso del profesor y sus ${teacher.students.length} estudiantes registrados.`}
        confirmText="Sí, eliminar profesor"
        onConfirm={() => onDeleteTeacher(teacher.id)}
        onClose={() => setShowDeleteTeacherConfirm(false)}
      />
    </section>
  );
};
