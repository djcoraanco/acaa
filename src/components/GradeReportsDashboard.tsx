import React, { useState, useMemo, useRef } from 'react';
import {
  Student,
  Teacher,
  MusicReadingSection,
  MusicReadingSession,
  SchoolYearWeek,
  AttendanceStatus,
} from '../types';
import {
  Award,
  Calendar,
  FileSpreadsheet,
  Search,
  Filter,
  Users,
  GraduationCap,
  BookOpen,
  Music,
  CheckCircle2,
  AlertTriangle,
  Download,
  Eye,
  X,
  Sparkles,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { getClassDateForWeek } from '../utils/calendarWeeks';

interface GradeReportsDashboardProps {
  teachers: Teacher[];
  sections?: MusicReadingSection[];
  musicSections?: MusicReadingSection[];
  weeks: SchoolYearWeek[];
}

type PeriodType = 'monthly' | 'semester' | 'annual';

export const GradeReportsDashboard: React.FC<GradeReportsDashboardProps> = ({
  teachers = [],
  sections,
  musicSections,
  weeks = [],
}) => {
  const safeSections = useMemo(() => {
    if (Array.isArray(sections)) return sections;
    if (Array.isArray(musicSections)) return musicSections;
    if ((sections as any)?.sections && Array.isArray((sections as any).sections)) return (sections as any).sections;
    return [];
  }, [sections, musicSections]);

  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string>('Septiembre');
  const [selectedSemester, setSelectedSemester] = useState<'sem1' | 'sem2'>('sem1');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportCardRef = useRef<HTMLDivElement>(null);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<{
    student: Student;
    teacher: Teacher;
    section: MusicReadingSection | null;
    stats: any;
  } | null>(null);

  // Month list with labels
  const months = useMemo(() => {
    const list: { name: string; label: string }[] = [];
    const seen = new Set<string>();
    weeks.forEach((w) => {
      if (!seen.has(w.monthName)) {
        seen.add(w.monthName);
        list.push({ name: w.monthName, label: w.monthName });
      }
    });
    return list;
  }, [weeks]);

  // Determine which weeks belong to the selected period
  const activeWeeks = useMemo(() => {
    if (periodType === 'annual') {
      return weeks;
    }
    if (periodType === 'monthly') {
      return weeks.filter((w) => w.monthName === selectedMonth);
    }
    // Semester 1: Sep to Jan (weeks with weekNumber <= 19)
    if (selectedSemester === 'sem1') {
      return weeks.filter((w) => w.weekNumber <= 19);
    }
    // Semester 2: Feb to Jun (weeks with weekNumber > 19)
    return weeks.filter((w) => w.weekNumber > 19);
  }, [periodType, selectedMonth, selectedSemester, weeks]);

  const activeWeekKeys = useMemo(() => new Set(activeWeeks.map((w) => w.weekKey)), [activeWeeks]);

  // Period title string for display and report card
  const periodTitle = useMemo(() => {
    if (periodType === 'monthly') {
      return `Mes de ${selectedMonth} 2026-2027`;
    }
    if (periodType === 'semester') {
      return selectedSemester === 'sem1'
        ? 'Primer Semestre (Septiembre 2026 - Enero 2027)'
        : 'Segundo Semestre (Febrero 2027 - Junio 2027)';
    }
    return 'Curso Académico Completo (2026 - 2027)';
  }, [periodType, selectedMonth, selectedSemester]);

  // Compile all students with their parent teacher and section
  const consolidatedRows = useMemo(() => {
    const rows: {
      student: Student;
      teacher: Teacher;
      section: MusicReadingSection | null;
      instrumentGrades: number[];
      instrumentAvg: number | null;
      instrumentAttendanceRate: number | null;
      instrumentPresentCount: number;
      instrumentTotalClasses: number;
      latestTechnicalComment: string;
      readingGrades: number[];
      readingAvg: number | null;
      readingAttendanceRate: number | null;
      readingPresentCount: number;
      readingTotalClasses: number;
      readingTheoryRate: number | null;
      readingAuditoryRate: number | null;
      readingWrittenRate: number | null;
      overallGrade: number | null;
      qualitativeGrade: string;
    }[] = [];

    teachers.forEach((teacher) => {
      (teacher.students || []).forEach((student) => {
        // Match student's music reading section
        const section = safeSections.find((sec) => (sec.studentIds || []).includes(student.id)) || null;

        // 1. Instrument Calculations for the active weeks
        const weeklyGrades = student.weeklyGrades || {};
        const attendance = student.attendance || {};
        const technicalNotes = student.weeklyTechnicalNotes || {};

        const instGradesInPeriod: number[] = [];
        let instPresent = 0;
        let instTotal = 0;
        let lastComment = '';

        activeWeeks.forEach((w) => {
          const g = weeklyGrades[w.weekKey];
          if (typeof g === 'number' && !isNaN(g)) {
            instGradesInPeriod.push(g);
          }

          const att = attendance[w.weekKey];
          if (att) {
            instTotal++;
            if (att === 'present') instPresent++;
          }

          const note = (technicalNotes[w.weekKey] || '').trim();
          if (note) {
            lastComment = note;
          }
        });

        const instrumentAvg =
          instGradesInPeriod.length > 0
            ? Number(
                (
                  instGradesInPeriod.reduce((acc, curr) => acc + curr, 0) /
                  instGradesInPeriod.length
                ).toFixed(1)
              )
            : null;

        const instrumentAttendanceRate =
          instTotal > 0 ? Math.round((instPresent / instTotal) * 100) : null;

        // 2. Music Reading Calculations for the active weeks
        const readingGradesInPeriod: number[] = [];
        let readingPresent = 0;
        let readingTotal = 0;
        let theoryYes = 0;
        let auditoryYes = 0;

        if (section && section.sessions) {
          const sessionsMap = section.sessions as Record<string, MusicReadingSession>;
          Object.entries(sessionsMap).forEach(([weekKey, sess]) => {
            if (activeWeekKeys.has(weekKey) || (sess.weekKey && activeWeekKeys.has(sess.weekKey))) {
              const rec = sess.records?.[student.id];
              if (rec) {
                if (rec.attendance) {
                  readingTotal++;
                  if (rec.attendance === 'present') readingPresent++;
                }
                if (rec.participatedTheory) theoryYes++;
                if (rec.participatedAuditoryOrSung ?? rec.participatedWritten) auditoryYes++;
                if (typeof rec.grade === 'number' && !isNaN(rec.grade)) {
                  readingGradesInPeriod.push(rec.grade);
                }
              }
            }
          });
        }

        const readingAvg =
          readingGradesInPeriod.length > 0
            ? Number(
                (
                  readingGradesInPeriod.reduce((acc, curr) => acc + curr, 0) /
                  readingGradesInPeriod.length
                ).toFixed(1)
              )
            : null;

        const readingAttendanceRate =
          readingTotal > 0 ? Math.round((readingPresent / readingTotal) * 100) : null;

        const readingTheoryRate =
          readingTotal > 0 ? Math.round((theoryYes / readingTotal) * 100) : null;

        const readingAuditoryRate =
          readingTotal > 0 ? Math.round((auditoryYes / readingTotal) * 100) : null;

        // 3. Consolidated Overall Grade
        let overallGrade: number | null = null;
        if (instrumentAvg !== null && readingAvg !== null) {
          // Weighted: 60% Instrument, 40% Music Reading
          overallGrade = Number((instrumentAvg * 0.6 + readingAvg * 0.4).toFixed(1));
        } else if (instrumentAvg !== null) {
          overallGrade = instrumentAvg;
        } else if (readingAvg !== null) {
          overallGrade = readingAvg;
        }

        // Qualitative text
        let qualitativeGrade = 'Sin Calificar';
        if (overallGrade !== null) {
          if (overallGrade >= 9.0) qualitativeGrade = 'Sobresaliente';
          else if (overallGrade >= 7.0) qualitativeGrade = 'Notable';
          else if (overallGrade >= 6.0) qualitativeGrade = 'Bien';
          else if (overallGrade >= 5.0) qualitativeGrade = 'Suficiente';
          else qualitativeGrade = 'Insuficiente';
        }

        rows.push({
          student,
          teacher,
          section,
          instrumentGrades: instGradesInPeriod,
          instrumentAvg,
          instrumentAttendanceRate,
          instrumentPresentCount: instPresent,
          instrumentTotalClasses: instTotal,
          latestTechnicalComment: lastComment,
          readingGrades: readingGradesInPeriod,
          readingAvg,
          readingAttendanceRate,
          readingPresentCount: readingPresent,
          readingTotalClasses: readingTotal,
          readingTheoryRate,
          readingAuditoryRate,
          readingWrittenRate: readingAuditoryRate,
          overallGrade,
          qualitativeGrade,
        });
      });
    });

    return rows;
  }, [teachers, safeSections, activeWeeks, activeWeekKeys]);

  // Apply filters
  const filteredRows = useMemo(() => {
    return consolidatedRows.filter((r) => {
      if (teacherFilter !== 'all' && r.teacher.id !== teacherFilter) {
        return false;
      }
      if (sectionFilter !== 'all') {
        if (sectionFilter === 'none') {
          if (r.section !== null) return false;
        } else if (r.section?.id !== sectionFilter) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.student.name.toLowerCase().includes(q);
        const matchesInst = r.student.instrument.toLowerCase().includes(q);
        const matchesTeacher = r.teacher.name.toLowerCase().includes(q);
        const matchesSection = (r.section?.name || '').toLowerCase().includes(q);
        return matchesName || matchesInst || matchesTeacher || matchesSection;
      }
      return true;
    });
  }, [consolidatedRows, teacherFilter, sectionFilter, searchQuery]);

  // Overall statistics for the filtered period
  const stats = useMemo(() => {
    const totalStudents = filteredRows.length;
    const evaluatedInstrument = filteredRows.filter((r) => r.instrumentAvg !== null);
    const evaluatedReading = filteredRows.filter((r) => r.readingAvg !== null);

    const avgInst =
      evaluatedInstrument.length > 0
        ? (
            evaluatedInstrument.reduce((sum, r) => sum + (r.instrumentAvg || 0), 0) /
            evaluatedInstrument.length
          ).toFixed(1)
        : null;

    const avgReading =
      evaluatedReading.length > 0
        ? (
            evaluatedReading.reduce((sum, r) => sum + (r.readingAvg || 0), 0) /
            evaluatedReading.length
          ).toFixed(1)
        : null;

    const totalInstAttendance = filteredRows
      .map((r) => r.instrumentAttendanceRate)
      .filter((rate): rate is number => rate !== null);

    const avgAttendance =
      totalInstAttendance.length > 0
        ? Math.round(
            totalInstAttendance.reduce((acc, curr) => acc + curr, 0) /
              totalInstAttendance.length
          )
        : null;

    return {
      totalStudents,
      avgInst,
      avgReading,
      avgAttendance,
    };
  }, [filteredRows]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Estudiante',
      'Instrumento',
      'Nivel',
      'Profesor Tutor',
      'Sección Lectura Musical',
      'Promedio Instrumento',
      'Asistencia Instrumento (%)',
      'Promedio Lectura Musical',
      'Asistencia Lectura (%)',
      'Parte Teórica (%)',
      'Parte Auditiva/Cantada (%)',
      'Calificación Final Boletín',
      'Valoración Cualitativa',
    ];

    const rows = filteredRows.map((r) => [
      `"${r.student.name}"`,
      `"${r.student.instrument}"`,
      `"${r.student.level}"`,
      `"${r.teacher.name}"`,
      `"${r.section?.name || 'Sin sección'}"`,
      r.instrumentAvg !== null ? r.instrumentAvg : '',
      r.instrumentAttendanceRate !== null ? `${r.instrumentAttendanceRate}%` : '',
      r.readingAvg !== null ? r.readingAvg : '',
      r.readingAttendanceRate !== null ? `${r.readingAttendanceRate}%` : '',
      r.readingTheoryRate !== null ? `${r.readingTheoryRate}%` : '',
      r.readingAuditoryRate !== null ? `${r.readingAuditoryRate}%` : '',
      r.overallGrade !== null ? r.overallGrade : '',
      `"${r.qualitativeGrade}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Boletin_Calificaciones_${periodType}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download bulletin as PDF using jsPDF + html2canvas
  const handleDownloadPdf = async (customStudent?: typeof selectedStudentForReport) => {
    const target = customStudent || selectedStudentForReport;
    if (!target) return;

    setIsGeneratingPdf(true);
    try {
      // Allow brief layout cycle for DOM stability
      await new Promise((resolve) => setTimeout(resolve, 120));

      const element =
        reportCardRef.current || document.getElementById('printable-report-card');
      if (!element) {
        throw new Error('No se encontró el contenedor del boletín para exportar.');
      }

      const canvas = await html2canvas(element, {
        scale: 2, // 2x DPI for crisp text rendering
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
      const margin = 10;
      const printWidth = pageWidth - margin * 2;
      const printHeight = (canvas.height * printWidth) / canvas.width;
      const maxAvailableHeight = pageHeight - margin * 2;

      if (printHeight <= maxAvailableHeight) {
        pdf.addImage(
          imgData,
          'PNG',
          margin,
          margin,
          printWidth,
          printHeight,
          undefined,
          'FAST'
        );
      } else {
        // Fit proportionally to a single A4 page
        const scale = maxAvailableHeight / printHeight;
        const scaledWidth = printWidth * scale;
        const xOffset = margin + (printWidth - scaledWidth) / 2;
        pdf.addImage(
          imgData,
          'PNG',
          xOffset,
          margin,
          scaledWidth,
          maxAvailableHeight,
          undefined,
          'FAST'
        );
      }

      const cleanStudentName = target.student.name
        .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      const cleanPeriod = periodTitle
        .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '')
        .trim()
        .replace(/\s+/g, '_');

      pdf.save(`Boletin_${cleanStudentName}_${cleanPeriod}.pdf`);
    } catch (error) {
      console.error('Error al exportar boletín en PDF:', error);
      alert('Hubo un error al generar el PDF del boletín. Por favor, inténtelo nuevamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div id="grade-reports-dashboard" className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#252525] text-white flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-[#c52227]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-[#252525]">
                  Boletines de Calificaciones y Rendimiento Académico
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-red-50 text-[#c52227] font-bold border border-red-200">
                  Panel de Dirección
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Consolidación de calificaciones de Instrumento y Lectura Musical para emisión de boletines mensuales y semestrales.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar Boletines (CSV)</span>
          </button>
        </div>

        {/* Period Selector Tabs */}
        <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-700">Tipo de Boletín:</span>
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPeriodType('monthly')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  periodType === 'monthly'
                    ? 'bg-white text-[#252525] shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setPeriodType('semester')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  periodType === 'semester'
                    ? 'bg-white text-[#252525] shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Semestral
              </button>
              <button
                type="button"
                onClick={() => setPeriodType('annual')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  periodType === 'annual'
                    ? 'bg-white text-[#252525] shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Curso Completo
              </button>
            </div>
          </div>

          {/* Sub-period controls */}
          {periodType === 'monthly' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-neutral-400 text-xs font-medium mr-1">Mes:</span>
              {months.map((m) => (
                <button
                  key={m.name}
                  onClick={() => setSelectedMonth(m.name)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors shrink-0 ${
                    selectedMonth === m.name
                      ? 'bg-[#c52227] text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {periodType === 'semester' && (
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setSelectedSemester('sem1')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  selectedSemester === 'sem1'
                    ? 'bg-[#c52227] text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                1er Semestre (Sep - Ene)
              </button>
              <button
                onClick={() => setSelectedSemester('sem2')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  selectedSemester === 'sem2'
                    ? 'bg-[#c52227] text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                2º Semestre (Feb - Jun)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold text-neutral-600">Alumnos en Listado</span>
            <Users className="w-4 h-4 text-[#252525]" />
          </div>
          <div className="text-2xl font-black text-[#252525]">{stats.totalStudents}</div>
          <p className="text-[11px] text-neutral-400 mt-0.5">{periodTitle}</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold text-neutral-600">Promedio Instrumento</span>
            <Music className="w-4 h-4 text-[#c52227]" />
          </div>
          <div className="text-2xl font-black text-[#c52227]">
            {stats.avgInst !== null ? `${stats.avgInst} / 10` : '—'}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Clases individuales</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold text-neutral-600">Promedio Lectura Musical</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">
            {stats.avgReading !== null ? `${stats.avgReading} / 10` : '—'}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Clases colectivas</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold text-neutral-600">Asistencia Global</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {stats.avgAttendance !== null ? `${stats.avgAttendance}%` : '—'}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Tasa media de asistencia</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por alumno, instrumento o cátedra..."
              className="w-full text-xs pl-8 pr-4 py-2 rounded-xl border border-neutral-200 focus:border-[#c52227] outline-hidden bg-neutral-50 focus:bg-white"
            />
          </div>

          {/* Filter by Teacher */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-500 font-medium">Profesor:</span>
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-xl border border-neutral-200 bg-white font-medium text-neutral-800 focus:border-[#c52227] outline-hidden"
            >
              <option value="all">Todos los profesores</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.department})
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Reading Section */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-500 font-medium">Sección Lectura:</span>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-xl border border-neutral-200 bg-white font-medium text-neutral-800 focus:border-[#c52227] outline-hidden"
            >
              <option value="all">Todas las secciones</option>
              <option value="none">Sin sección asignada</option>
              {safeSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grade Table */}
      <div className="bg-white border border-neutral-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Estudiante</th>
                <th className="py-3 px-3">Profesor Tutor</th>
                <th className="py-3 px-3">Sección Lectura</th>
                <th className="py-3 px-3 text-center bg-red-50/40">Instrumento</th>
                <th className="py-3 px-3 text-center bg-red-50/40">Asistencia Inst.</th>
                <th className="py-3 px-3 text-center bg-blue-50/40">Lectura Musical</th>
                <th className="py-3 px-3 text-center bg-blue-50/40">Teórica / Auditiva</th>
                <th className="py-3 px-3 text-center bg-amber-50/60 font-black">Nota Boletín</th>
                <th className="py-3 px-4 text-right">Boletín Oficial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-neutral-400">
                    No se encontraron estudiantes para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  return (
                    <tr
                      key={row.student.id}
                      className="hover:bg-neutral-50/70 transition-colors"
                    >
                      {/* Student info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-900 text-xs">
                          {row.student.name}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {row.student.instrument} • {row.student.level}
                        </div>
                      </td>

                      {/* Teacher */}
                      <td className="py-3 px-3 text-neutral-700">
                        <span className="font-semibold text-xs block">{row.teacher.name}</span>
                        <span className="text-[10px] text-neutral-400">{row.teacher.department}</span>
                      </td>

                      {/* Music Reading Section */}
                      <td className="py-3 px-3">
                        {row.section ? (
                          <div>
                            <span className="font-semibold text-xs text-neutral-800 block">
                              {row.section.name}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {row.section.dayOfWeek} {row.section.classTime} hrs
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-400 italic">
                            No matriculado
                          </span>
                        )}
                      </td>

                      {/* Instrument Grade */}
                      <td className="py-3 px-3 text-center bg-red-50/20">
                        {row.instrumentAvg !== null ? (
                          <span className="font-bold text-xs text-neutral-900 bg-white px-2 py-1 rounded-md border border-neutral-200">
                            {row.instrumentAvg} / 10
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Instrument Attendance */}
                      <td className="py-3 px-3 text-center bg-red-50/20">
                        {row.instrumentAttendanceRate !== null ? (
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              row.instrumentAttendanceRate >= 80
                                ? 'bg-emerald-50 text-emerald-800'
                                : row.instrumentAttendanceRate >= 60
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-red-50 text-[#c52227]'
                            }`}
                          >
                            {row.instrumentAttendanceRate}%
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Reading Grade */}
                      <td className="py-3 px-3 text-center bg-blue-50/20">
                        {row.readingAvg !== null ? (
                          <span className="font-bold text-xs text-blue-900 bg-white px-2 py-1 rounded-md border border-blue-200">
                            {row.readingAvg} / 10
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Theory / Auditory participation */}
                      <td className="py-3 px-3 text-center bg-blue-50/20">
                        {row.readingTheoryRate !== null || row.readingAuditoryRate !== null ? (
                          <div className="text-[10px] space-y-0.5">
                            <div className="text-blue-700 font-semibold">
                              Teo: {row.readingTheoryRate !== null ? `${row.readingTheoryRate}%` : '—'}
                            </div>
                            <div className="text-purple-700 font-semibold">
                              Aud/Cant: {row.readingAuditoryRate !== null ? `${row.readingAuditoryRate}%` : '—'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Overall Final Grade */}
                      <td className="py-3 px-3 text-center bg-amber-50/40">
                        {row.overallGrade !== null ? (
                          <div>
                            <span className="font-black text-xs text-amber-950 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300">
                              {row.overallGrade}
                            </span>
                            <div className="text-[10px] font-bold text-neutral-600 mt-1">
                              {row.qualitativeGrade}
                            </div>
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">Sin notas</span>
                        )}
                      </td>

                      {/* Action: Open Report Card & Direct PDF Download */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedStudentForReport({
                                student: row.student,
                                teacher: row.teacher,
                                section: row.section,
                                stats: row,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-[#252525] hover:text-white text-neutral-700 rounded-xl text-xs font-bold transition-all border border-neutral-200 shadow-2xs cursor-pointer"
                            title="Ver boletín en pantalla"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const target = {
                                student: row.student,
                                teacher: row.teacher,
                                section: row.section,
                                stats: row,
                              };
                              setSelectedStudentForReport(target);
                              setTimeout(() => {
                                handleDownloadPdf(target);
                              }, 150);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#c52227] hover:bg-[#a81b20] text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            title="Descargar boletín en PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar Boletín</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Report Card Modal */}
      {selectedStudentForReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div
            id="report-card-modal-container"
            className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-3xl w-full my-6 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Toolbar (Non-printed) */}
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50 print:hidden">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#c52227]" />
                <span className="font-bold text-xs text-[#252525]">
                  Boletín Oficial de Calificaciones
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-download-bulletin-pdf"
                  onClick={() => handleDownloadPdf()}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c52227] hover:bg-[#a81b20] text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generando PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Descargar Boletín</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForReport(null)}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div
              id="printable-report-card"
              ref={reportCardRef}
              className="p-8 sm:p-10 space-y-6 bg-white text-neutral-900 printable-card"
            >
              {/* Academy Official Header */}
              <div className="border-b-2 border-[#c52227] pb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#252525] tracking-tight uppercase">
                    Academia de Cuerdas Antonio Aquino
                  </h2>
                  <p className="text-xs text-neutral-500 font-medium">
                    Centro de Formación Musical y Perfeccionamiento Instrumental
                  </p>
                  <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    Ciclo Lectivo 2026 – 2027 • Registro Oficial
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-lg bg-neutral-100 font-black text-xs text-neutral-800 uppercase tracking-wide border border-neutral-200">
                    Boletín de Calificaciones
                  </span>
                  <div className="text-xs font-bold text-[#c52227] mt-1">
                    {periodTitle}
                  </div>
                </div>
              </div>

              {/* Student and Course Metadata Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Alumno/a:
                  </span>
                  <strong className="text-sm text-[#252525]">
                    {selectedStudentForReport.student.name}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Instrumento / Especialidad:
                  </span>
                  <strong className="text-neutral-800">
                    {selectedStudentForReport.student.instrument}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Nivel Académico:
                  </span>
                  <strong className="text-neutral-800">
                    {selectedStudentForReport.student.level}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Profesor Tutor:
                  </span>
                  <strong className="text-neutral-800">
                    {selectedStudentForReport.teacher.name}
                  </strong>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-600">
                  Desglose de Asignaturas y Calificaciones
                </h4>

                <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-neutral-100/70 border-b border-neutral-200 font-bold text-neutral-700 text-[11px]">
                        <th className="py-2.5 px-3">Asignatura</th>
                        <th className="py-2.5 px-3">Profesor</th>
                        <th className="py-2.5 px-3 text-center">Asistencia</th>
                        <th className="py-2.5 px-3 text-center">Nota Numérica</th>
                        <th className="py-2.5 px-3 text-center">Calificación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {/* Instrument Subject */}
                      <tr>
                        <td className="py-3 px-3">
                          <strong className="text-neutral-900 block">
                            Instrumento Principal ({selectedStudentForReport.student.instrument})
                          </strong>
                          <span className="text-[10px] text-neutral-500">
                            Técnica de arco, afinación, repertorio y obras
                          </span>
                        </td>
                        <td className="py-3 px-3 text-neutral-700">
                          {selectedStudentForReport.teacher.name}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {selectedStudentForReport.stats.instrumentAttendanceRate !== null
                            ? `${selectedStudentForReport.stats.instrumentAttendanceRate}%`
                            : '—'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-sm text-neutral-900">
                          {selectedStudentForReport.stats.instrumentAvg !== null
                            ? `${selectedStudentForReport.stats.instrumentAvg} / 10`
                            : 'Pendiente'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-neutral-800">
                          {selectedStudentForReport.stats.instrumentAvg !== null
                            ? selectedStudentForReport.stats.instrumentAvg >= 9
                              ? 'Sobresaliente'
                              : selectedStudentForReport.stats.instrumentAvg >= 7
                              ? 'Notable'
                              : selectedStudentForReport.stats.instrumentAvg >= 5
                              ? 'Aprobado'
                              : 'Insuficiente'
                            : '—'}
                        </td>
                      </tr>

                      {/* Music Reading Subject */}
                      <tr>
                        <td className="py-3 px-3">
                          <strong className="text-neutral-900 block">
                            Lectura Musical y Lenguaje
                          </strong>
                          <span className="text-[10px] text-neutral-500">
                            {selectedStudentForReport.section
                              ? `${selectedStudentForReport.section.name} (Solfeo rítmico, entonado, dictado, parte teórica y parte auditiva/cantada)`
                              : 'Asignatura colectiva de lectura'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-neutral-700">
                          {selectedStudentForReport.section?.teacherName || 'Claustro de Lectura Musical'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {selectedStudentForReport.stats.readingAttendanceRate !== null
                            ? `${selectedStudentForReport.stats.readingAttendanceRate}%`
                            : '—'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-sm text-blue-900">
                          {selectedStudentForReport.stats.readingAvg !== null
                            ? `${selectedStudentForReport.stats.readingAvg} / 10`
                            : 'Pendiente'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-neutral-800">
                          {selectedStudentForReport.stats.readingAvg !== null
                            ? selectedStudentForReport.stats.readingAvg >= 9
                              ? 'Sobresaliente'
                              : selectedStudentForReport.stats.readingAvg >= 7
                              ? 'Notable'
                              : selectedStudentForReport.stats.readingAvg >= 5
                              ? 'Aprobado'
                              : 'Insuficiente'
                            : '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Qualitative Observations and Comments */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-600">
                  Observaciones Técnicas y Pedagógicas
                </h4>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-xs space-y-2">
                  <div>
                    <strong className="text-neutral-800 block text-[11px]">
                      Progreso de Instrumento:
                    </strong>
                    <p className="text-neutral-600 leading-relaxed italic">
                      {selectedStudentForReport.stats.latestTechnicalComment ||
                        selectedStudentForReport.student.technicalProgressNotes ||
                        'Progreso regular conforme a la programación del curso. Se recomienda constancia diaria en el estudio de las escalas y estudios técnicos.'}
                    </p>
                  </div>

                  {selectedStudentForReport.student.expectedRepertoire && (
                    <div className="pt-2 border-t border-neutral-200/80">
                      <strong className="text-neutral-800 block text-[11px]">
                        Repertorio Trabajado:
                      </strong>
                      <p className="text-neutral-600 font-mono text-[11px]">
                        {selectedStudentForReport.student.expectedRepertoire}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Overall Final Result Banner */}
              <div className="p-4 rounded-2xl bg-[#252525] text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Calificación Final Ponderada del Período:
                  </span>
                  <div className="text-xl font-black text-white">
                    {selectedStudentForReport.stats.overallGrade !== null
                      ? `${selectedStudentForReport.stats.overallGrade} / 10`
                      : 'En proceso'}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-neutral-400 block">
                    Valoración Cualitativa:
                  </span>
                  <span className="text-base font-bold text-[#c52227] bg-white px-3 py-0.5 rounded-lg inline-block">
                    {selectedStudentForReport.stats.qualitativeGrade}
                  </span>
                </div>
              </div>

              {/* Formal Signatures Footer */}
              <div className="pt-8 border-t border-neutral-200 grid grid-cols-2 gap-8 text-center text-xs text-neutral-600">
                <div className="space-y-12">
                  <div className="h-10" />
                  <div className="border-t border-neutral-400 pt-1">
                    <strong className="block text-neutral-800">
                      Prof. {selectedStudentForReport.teacher.name}
                    </strong>
                    <span className="text-[10px] text-neutral-400">
                      Profesor/a Tutor de Cátedra
                    </span>
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="h-10" />
                  <div className="border-t border-neutral-400 pt-1">
                    <strong className="block text-neutral-800">
                      Dirección Académica y Jefatura de Estudios
                    </strong>
                    <span className="text-[10px] text-neutral-400">
                      Academia de Cuerdas Antonio Aquino
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
