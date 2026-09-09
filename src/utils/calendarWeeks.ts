import { SchoolYearWeek } from '../types';

// Generate weekly school weeks from September 1, 2026 to June 30, 2027
export function generateSchoolYearWeeks(): SchoolYearWeek[] {
  const weeks: SchoolYearWeek[] = [];
  
  // Start around first Monday of September 2026:
  // Sep 1, 2026 is a Tuesday. The Monday of that week is Aug 31 or first full school week Monday Sep 7.
  // Academic calendar starts Monday, 7 September 2026 and ends late June 2027 (e.g., June 25, 2027).
  const startDate = new Date(2026, 8, 7); // Sept 7, 2026 (Month index 8 = September)
  const endDate = new Date(2027, 5, 25); // June 25, 2027 (Month index 5 = June)

  const monthNamesEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const shortMonthNamesEs = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const current = new Date(startDate);
  let weekNum = 1;

  while (current <= endDate) {
    const year = current.getFullYear();
    const month = current.getMonth();
    const date = current.getDate();

    // Key format YYYY-MM-DD
    const pad = (n: number) => n.toString().padStart(2, '0');
    const weekKey = `${year}-${pad(month + 1)}-${pad(date)}`;

    // Calculate Sunday of the same week
    const sunday = new Date(current);
    sunday.setDate(current.getDate() + 6);

    const label = `${pad(date)} ${shortMonthNamesEs[month]} - ${pad(sunday.getDate())} ${shortMonthNamesEs[sunday.getMonth()]}`;

    weeks.push({
      weekKey,
      label,
      shortMonth: shortMonthNamesEs[month],
      monthName: `${monthNamesEs[month]} ${year}`,
      year,
      weekNumber: weekNum,
    });

    // Advance 7 days
    current.setDate(current.getDate() + 7);
    weekNum++;
  }

  return weeks;
}

export const DAYS_OF_WEEK: string[] = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const DAY_OFFSETS: Record<string, number> = {
  'Lunes': 0,
  'Martes': 1,
  'Miércoles': 2,
  'Jueves': 3,
  'Viernes': 4,
  'Sábado': 5,
  'Domingo': 6,
};

const monthNamesEs = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const shortMonthNamesEs = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

// Calculate exact class date for a given student's class day in a specific academic week
export function getClassDateForWeek(weekMondayKey: string, classDay: string = 'Lunes'): {
  fullDateStr: string; // e.g. "Miércoles 9 de Septiembre de 2026"
  shortDateStr: string; // e.g. "09 Sep 2026"
  dayName: string; // e.g. "Miércoles"
  dayNumber: number; // e.g. 9
  shortMonth: string; // e.g. "Sep"
  isoDate: string; // e.g. "2026-09-09"
} {
  const parts = weekMondayKey.split('-').map(Number);
  const year = parts[0];
  const month = parts[1] - 1;
  const day = parts[2];

  const date = new Date(year, month, day);
  const offset = DAY_OFFSETS[classDay] ?? 0;
  date.setDate(date.getDate() + offset);

  const resolvedYear = date.getFullYear();
  const resolvedMonth = date.getMonth();
  const resolvedDate = date.getDate();
  const pad = (n: number) => n.toString().padStart(2, '0');

  return {
    fullDateStr: `${classDay} ${resolvedDate} de ${monthNamesEs[resolvedMonth]} de ${resolvedYear}`,
    shortDateStr: `${pad(resolvedDate)} ${shortMonthNamesEs[resolvedMonth]} ${resolvedYear}`,
    dayName: classDay,
    dayNumber: resolvedDate,
    shortMonth: shortMonthNamesEs[resolvedMonth],
    isoDate: `${resolvedYear}-${pad(resolvedMonth + 1)}-${pad(resolvedDate)}`,
  };
}

export const ACADEMIC_WEEKS = generateSchoolYearWeeks();
