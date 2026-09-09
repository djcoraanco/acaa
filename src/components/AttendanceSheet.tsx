import React from 'react';
import { SchoolYearWeek, AttendanceStatus } from '../types';
import { Calendar, Check, X, AlertCircle, HelpCircle } from 'lucide-react';

interface AttendanceSheetProps {
  weeks: SchoolYearWeek[];
  attendance: { [weekKey: string]: AttendanceStatus };
  onChangeAttendance: (weekKey: string, status: AttendanceStatus) => void;
  studentName: string;
}

export const AttendanceSheet: React.FC<AttendanceSheetProps> = ({
  weeks,
  attendance,
  onChangeAttendance,
  studentName,
}) => {
  // Cycle status on click: pending -> present -> absent -> justified -> pending
  const cycleStatus = (currentStatus?: AttendanceStatus): AttendanceStatus => {
    switch (currentStatus) {
      case 'present':
        return 'absent';
      case 'absent':
        return 'justified';
      case 'justified':
        return 'pending';
      default:
        return 'present';
    }
  };

  const getStatusBadge = (status?: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" /> Asiste
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-red-50 text-[#c52227] border border-red-200">
            <X className="w-3 h-3 text-[#c52227]" /> Falta
          </span>
        );
      case 'justified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" /> Justif.
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-normal bg-neutral-100 text-neutral-500 border border-neutral-200">
            <HelpCircle className="w-3 h-3" /> Pendiente
          </span>
        );
    }
  };

  // Group weeks by month
  const monthsMap: { [month: string]: SchoolYearWeek[] } = {};
  weeks.forEach((w) => {
    if (!monthsMap[w.monthName]) {
      monthsMap[w.monthName] = [];
    }
    monthsMap[w.monthName].push(w);
  });

  const totalRegistered = Object.values(attendance).length;
  const presentCount = Object.values(attendance).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'absent').length;
  const justifiedCount = Object.values(attendance).filter((s) => s === 'justified').length;

  return (
    <div className="space-y-4">
      {/* Attendance Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-slate-900">
            Asistencia Septiembre 2026 – Junio 2027 ({weeks.length} semanas lectivas)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {presentCount} Asistencias
          </span>
          <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> {absentCount} Faltas
          </span>
          <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> {justifiedCount} Justificadas
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500 italic">
        Haz clic en cualquier semana para alternar el estado (Asistió → Falta → Justificada → Pendiente).
      </p>

      {/* Grid of months and weeks */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto pr-1">
        {Object.entries(monthsMap).map(([monthName, monthWeeks]) => (
          <div
            key={monthName}
            className="border border-slate-200 rounded-xl p-3 bg-white shadow-2xs space-y-2"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-1.5 flex items-center justify-between">
              <span>{monthName}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {monthWeeks.length} clases
              </span>
            </h4>
            <div className="space-y-1.5">
              {monthWeeks.map((week) => {
                const currentStatus = attendance[week.weekKey] || 'pending';
                return (
                  <button
                    key={week.weekKey}
                    type="button"
                    onClick={() =>
                      onChangeAttendance(week.weekKey, cycleStatus(currentStatus))
                    }
                    className="w-full flex items-center justify-between text-left p-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                    title={`Cambiar asistencia para ${studentName} (${week.label})`}
                  >
                    <div className="text-xs">
                      <span className="font-semibold text-slate-700 mr-1.5">
                        Sem. {week.weekNumber}
                      </span>
                      <span className="text-slate-500 text-[11px]">{week.label}</span>
                    </div>
                    {getStatusBadge(currentStatus)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
