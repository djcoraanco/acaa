export type AttendanceStatus = 'present' | 'absent' | 'justified' | 'pending';

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';

export interface WeeklyAttendance {
  // weekKey format: YYYY-MM-DD representing the Monday of each week
  [weekKey: string]: AttendanceStatus;
}

export interface WeeklyTechnicalNotes {
  // weekKey format: YYYY-MM-DD -> technical comment for that week's class
  [weekKey: string]: string;
}

export interface WeeklyGrades {
  // weekKey format: YYYY-MM-DD -> grade 0 to 10 for that week's instrument class
  [weekKey: string]: number | null;
}

export interface Student {
  id: string;
  name: string;
  instrument: string;
  level: string; // e.g. "Grado Elemental 1", "Grado Medio 3", "Iniciación", etc.
  classDay?: string; // e.g. "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
  classTime?: string; // e.g. "16:00"
  expectedRepertoire: string; // Repertorio esperado del ciclo
  recitalRepertoire: string; // Repertorio de recitales
  examRepertoire: string; // Repertorio de exámenes
  technicalProgressNotes: string; // Comentarios generales para evaluar el progreso técnico
  weeklyTechnicalNotes?: WeeklyTechnicalNotes; // Comentarios semanales según el día de clases
  weeklyGrades?: WeeklyGrades; // Calificación por clase de instrumento (0 - 10)
  attendance: WeeklyAttendance;
}

// ==========================================
// SECCIONES DE LECTURA MUSICAL (GRUPALES)
// ==========================================

export interface MusicReadingStudentSessionRecord {
  studentId: string;
  attendance: AttendanceStatus; // present, absent, justified, pending
  participatedTheory: boolean; // Participó en la parte teórica
  participatedAuditoryOrSung?: boolean; // Participó en la parte auditiva / cantada
  participatedWritten?: boolean; // Compatibilidad previa (mapeado a auditiva/cantada)
  grade?: number | null; // Calificación del día (0 - 10)
  studentComment?: string; // Comentario individual opcional
}

export interface MusicReadingSession {
  date: string; // YYYY-MM-DD
  weekKey?: string; // e.g. 2026-09-07
  topic?: string; // e.g. "Lectura en clave de Sol, figuras rítmicas compuestas"
  generalComment: string; // Comentario general de la clase grupal
  records: {
    [studentId: string]: MusicReadingStudentSessionRecord;
  };
}

export interface MusicReadingSection {
  id: string;
  name: string; // e.g. "Lectura Musical Grupo A - Iniciación"
  level: string; // e.g. "Iniciación", "Grado Elemental 1", "Grado Elemental 2"
  teacherId?: string | null; // Profesor a cargo
  teacherName?: string;
  dayOfWeek: string; // e.g. "Sábado", "Lunes"
  classTime: string; // e.g. "10:00"
  room?: string; // e.g. "Aula de Lenguaje 1"
  studentIds: string[]; // IDs de alumnos matriculados en esta sección
  sessions: {
    [sessionDateOrWeekKey: string]: MusicReadingSession;
  };
  createdAt?: string;
  updatedAt?: string;
}

export type ReportPeriodType = 'monthly' | 'semester1' | 'semester2' | 'annual';

export interface Teacher {
  id: string;
  name: string;
  department: string; // e.g. Piano, Cuerda, Viento, Canto, Guitarra
  username?: string;
  students: Student[];
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'teacher';
  teacherId: string | null;
}

export interface SchoolYearWeek {
  weekKey: string; // YYYY-MM-DD (Monday)
  label: string; // e.g. "07 Sep - 13 Sep"
  shortMonth: string; // e.g. "Sep"
  monthName: string; // e.g. "Septiembre 2026"
  year: number;
  weekNumber: number;
}

export interface TeacherConnection {
  id: string;
  userId: string;
  username: string;
  teacherName: string;
  role: string;
  ipAddress: string;
  userAgent?: string;
  deviceInfo?: string;
  locationHint?: string;
  createdAt: string;
  teacherId?: string | null;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  username: string;
  teacherId?: string | null;
  teacherName: string;
  actionType:
    | 'grade'
    | 'attendance'
    | 'technical_note'
    | 'repertoire'
    | 'student_create'
    | 'student_update'
    | 'student_delete'
    | 'music_reading'
    | 'login'
    | 'admin_credential_change'
    | string;
  targetName?: string;
  description: string;
  details?: Record<string, any>;
  ipAddress?: string;
  deviceInfo?: string;
  createdAt: string;
}

export interface AuditStats {
  totalChangesToday: number;
  activeTeachersToday: number;
  totalConnections: number;
  lastConnection: {
    teacherName: string;
    ipAddress: string;
    locationHint: string;
    createdAt: string;
  } | null;
}
