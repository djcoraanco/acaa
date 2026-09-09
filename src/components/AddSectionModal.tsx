import React, { useState, useEffect } from 'react';
import { Teacher, MusicReadingSection, DayOfWeek } from '../types';
import { X, Users, Music, Calendar, Clock, MapPin, Search, Check } from 'lucide-react';
import { DAYS_OF_WEEK } from '../utils/calendarWeeks';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    level: string;
    teacherId?: string | null;
    teacherName?: string;
    dayOfWeek: string;
    classTime: string;
    room?: string;
    studentIds: string[];
  }) => Promise<void>;
  teachers: Teacher[];
  allStudents: { id: string; name: string; instrument: string; level: string; teacherName: string }[];
  editingSection?: MusicReadingSection | null;
}

export const AddSectionModal: React.FC<AddSectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  teachers,
  allStudents,
  editingSection,
}) => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('Grado Elemental 1');
  const [teacherId, setTeacherId] = useState<string>('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('Sábado');
  const [classTime, setClassTime] = useState('10:00');
  const [room, setRoom] = useState('Aula de Lenguaje Musical 1');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingSection) {
      setName(editingSection.name);
      setLevel(editingSection.level);
      setTeacherId(editingSection.teacherId || '');
      setDayOfWeek((editingSection.dayOfWeek as DayOfWeek) || 'Sábado');
      setClassTime(editingSection.classTime || '10:00');
      setRoom(editingSection.room || 'Aula de Lenguaje Musical 1');
      setSelectedStudentIds(editingSection.studentIds || []);
    } else {
      setName('');
      setLevel('Grado Elemental 1');
      setTeacherId(teachers.length > 0 ? teachers[0].id : '');
      setDayOfWeek('Sábado');
      setClassTime('10:00');
      setRoom('Aula de Lenguaje Musical 1');
      setSelectedStudentIds([]);
    }
    setError(null);
    setStudentSearch('');
  }, [editingSection, isOpen, teachers]);

  if (!isOpen) return null;

  const filteredStudents = allStudents.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.instrument.toLowerCase().includes(q) ||
      s.level.toLowerCase().includes(q) ||
      s.teacherName.toLowerCase().includes(q)
    );
  });

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredStudents.map((s) => s.id);
    setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleDeselectAllFiltered = () => {
    const idsToRemove = new Set(filteredStudents.map((s) => s.id));
    setSelectedStudentIds((prev) => prev.filter((id) => !idsToRemove.has(id)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor indica un nombre para la sección de Lectura Musical.');
      return;
    }
    if (!level.trim()) {
      setError('Por favor especifica el nivel.');
      return;
    }

    const selectedTeacher = teachers.find((t) => t.id === teacherId);

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        level: level.trim(),
        teacherId: teacherId || null,
        teacherName: selectedTeacher ? selectedTeacher.name : '',
        dayOfWeek,
        classTime,
        room: room.trim() || 'Aula 1',
        studentIds: selectedStudentIds,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la sección.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        id="modal-add-music-reading-section"
        className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#252525] text-white flex items-center justify-center">
              <Users className="w-5 h-5 text-[#c52227]" />
            </div>
            <div>
              <h3 className="font-bold text-[#252525] text-base">
                {editingSection ? 'Editar Sección de Lectura Musical' : 'Nueva Sección de Lectura Musical'}
              </h3>
              <p className="text-xs text-neutral-500">
                Grupo colectivo para control de asistencia, solfeo, dictados y notas diarias.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 grow">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-[#c52227] border border-red-200 rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Section Name */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#c52227]" />
                <span>Nombre de la Sección Grupal</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Lectura Musical y Rítmica - Grupo A"
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden bg-neutral-50 focus:bg-white transition-colors font-medium text-neutral-800"
                required
              />
            </div>

            {/* Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800">
                Nivel / Ciclo
              </label>
              <input
                type="text"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="Ej. Grado Elemental 1 y 2, Iniciación..."
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden bg-neutral-50 focus:bg-white"
                required
              />
            </div>

            {/* Assigned Teacher */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800">
                Profesor a Cargo
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:border-[#c52227] focus:ring-1 focus:ring-[#c52227] outline-hidden bg-white text-neutral-800"
              >
                <option value="">-- Sin profesor específico (Dirección) --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Day of Week */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#c52227]" />
                <span>Día Semanal de Clase</span>
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:border-[#c52227] outline-hidden bg-white font-medium text-neutral-800"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#c52227]" />
                <span>Horario</span>
              </label>
              <input
                type="text"
                value={classTime}
                onChange={(e) => setClassTime(e.target.value)}
                placeholder="Ej. 10:00, 16:30"
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:border-[#c52227] outline-hidden bg-white font-medium text-neutral-800"
              />
            </div>

            {/* Room / Classroom */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                <span>Aula / Espacio de Clase</span>
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Ej. Aula de Lenguaje Musical 1, Aula Magna..."
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:border-[#c52227] outline-hidden bg-white"
              />
            </div>
          </div>

          {/* Student Enrollment Selection */}
          <div className="pt-2 border-t border-neutral-100 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#c52227]" />
                  <span>Matrícula de Estudiantes para este Grupo ({selectedStudentIds.length} seleccionados)</span>
                </label>
                <p className="text-[11px] text-neutral-500">
                  Puedes seleccionar alumnos de cualquier cátedra e instrumento para integrar este grupo.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-[11px] font-semibold text-[#c52227] hover:underline"
                >
                  Marcar todos
                </button>
                <span className="text-neutral-300">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAllFiltered}
                  className="text-[11px] font-semibold text-neutral-500 hover:underline"
                >
                  Desmarcar
                </button>
              </div>
            </div>

            {/* Student Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Buscar alumno por nombre, instrumento o profesor tutor..."
                className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-neutral-200 focus:border-[#c52227] outline-hidden bg-neutral-50 focus:bg-white"
              />
            </div>

            {/* Students Checklist */}
            <div className="max-h-52 overflow-y-auto border border-neutral-200 rounded-2xl p-2 space-y-1 bg-neutral-50/50">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-6 text-xs text-neutral-400">
                  No se encontraron estudiantes para los términos buscados.
                </div>
              ) : (
                filteredStudents.map((std) => {
                  const isSelected = selectedStudentIds.includes(std.id);
                  return (
                    <div
                      key={std.id}
                      onClick={() => toggleStudent(std.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-red-50/80 border-red-200 text-neutral-900 shadow-2xs'
                          : 'bg-white border-neutral-200/80 hover:bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#c52227] border-[#c52227] text-white'
                              : 'border-neutral-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#252525] block">
                            {std.name}
                          </span>
                          <span className="text-[11px] text-neutral-500">
                            {std.instrument} • {std.level}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-medium">
                          Tutor: {std.teacherName}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-[#c52227] hover:bg-[#a81b20] text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Guardando...</span>
              ) : (
                <span>{editingSection ? 'Actualizar Sección' : 'Crear Sección Grupal'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
