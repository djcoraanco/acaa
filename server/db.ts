import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const DB_FILE = process.env.DATABASE_FILE || path.resolve(DB_DIR, 'academia.sqlite');

let db: Database;

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  initSchema();
  return db;
}

export function persistDb() {
  if (!db) return;
  const binaryArray = db.export();
  const buffer = Buffer.from(binaryArray);
  fs.writeFileSync(DB_FILE, buffer);
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL, -- 'admin' or 'teacher'
      teacher_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      name TEXT NOT NULL,
      instrument TEXT NOT NULL,
      level TEXT NOT NULL,
      class_day TEXT DEFAULT 'Lunes',
      class_time TEXT DEFAULT '16:00',
      expected_repertoire TEXT DEFAULT '',
      recital_repertoire TEXT DEFAULT '',
      exam_repertoire TEXT DEFAULT '',
      technical_progress_notes TEXT DEFAULT '',
      weekly_notes_json TEXT DEFAULT '{}',
      attendance_json TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS music_reading_sections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      teacher_id TEXT,
      teacher_name TEXT DEFAULT '',
      day_of_week TEXT DEFAULT 'Sábado',
      class_time TEXT DEFAULT '10:00',
      room TEXT DEFAULT 'Aula de Lenguaje Musical 1',
      student_ids_json TEXT DEFAULT '[]',
      sessions_json TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teacher_connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      role TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      user_agent TEXT,
      device_info TEXT,
      location_hint TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      teacher_id TEXT,
      teacher_name TEXT NOT NULL,
      action_type TEXT NOT NULL,
      target_name TEXT,
      description TEXT NOT NULL,
      details_json TEXT DEFAULT '{}',
      ip_address TEXT,
      device_info TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: Ensure admin password is '12345' (migrates from previous 'admin123' if unchanged)
  try {
    const oldHash = hashPassword('admin123');
    const newHash = hashPassword('12345');
    db.run("UPDATE users SET password_hash = ? WHERE username = 'admin' AND password_hash = ?", [newHash, oldHash]);
  } catch (err) {
    console.error('Error in admin password migration:', err);
  }

  // Migration for existing database files: ensure new columns exist
  try {
    db.run(`ALTER TABLE students ADD COLUMN class_day TEXT DEFAULT 'Lunes'`);
  } catch {}
  try {
    db.run(`ALTER TABLE students ADD COLUMN class_time TEXT DEFAULT '16:00'`);
  } catch {}
  try {
    db.run(`ALTER TABLE students ADD COLUMN weekly_notes_json TEXT DEFAULT '{}'`);
  } catch {}
  try {
    db.run(`ALTER TABLE students ADD COLUMN weekly_grades_json TEXT DEFAULT '{}'`);
  } catch {}

  // Check if admin exists; if not, seed initial data
  const checkAdmin = db.exec("SELECT id FROM users WHERE role = 'admin'");
  if (checkAdmin.length === 0 || checkAdmin[0].values.length === 0) {
    seedInitialData();
  } else {
    // Seed initial weekly notes and grades for any student who has an empty weekly_notes_json / weekly_grades_json
    try {
      const existingStds = db.exec("SELECT id, technical_progress_notes, weekly_notes_json, weekly_grades_json FROM students");
      if (existingStds.length > 0 && existingStds[0].values.length > 0) {
        for (const row of existingStds[0].values) {
          const [id, techNotes, weeklyJson, gradesJson] = row;
          if (!weeklyJson || weeklyJson === '{}' || weeklyJson === 'null') {
            const seedNotes: Record<string, string> = {
              '2026-09-07': 'Sesión inaugural: Revisión de afinación y colocación postural. ' + (techNotes ? String(techNotes).slice(0, 130) : ''),
              '2026-09-14': 'Buen control en el pasaje técnico. Continuar con los ejercicios diarios con metrónomo y pulcritud de articulación.',
            };
            db.run("UPDATE students SET weekly_notes_json = ? WHERE id = ?", [JSON.stringify(seedNotes), id]);
          }
          if (!gradesJson || gradesJson === '{}' || gradesJson === 'null') {
            const seedGrades: Record<string, number> = {
              '2026-09-07': 9.2,
              '2026-09-14': 8.8,
              '2026-09-21': 9.5,
              '2026-09-28': 9.0,
            };
            db.run("UPDATE students SET weekly_grades_json = ? WHERE id = ?", [JSON.stringify(seedGrades), id]);
          }
        }
      }
    } catch {}
  }

  // Seed music reading sections if empty
  seedMusicReadingSectionsIfEmpty();

  // Seed audit & connection logs if empty
  seedAuditAndConnectionLogsIfEmpty();

  persistDb();
}

function seedMusicReadingSectionsIfEmpty() {
  try {
    const checkSections = db.exec("SELECT id FROM music_reading_sections");
    if (checkSections.length === 0 || checkSections[0].values.length === 0) {
      // Get student IDs
      const stdRes = db.exec("SELECT id FROM students");
      const allStudentIds: string[] = stdRes.length > 0 ? stdRes[0].values.map((v) => v[0] as string) : [];

      const groupAStudents = allStudentIds.slice(0, 3); // e.g. std-1, std-2, std-3
      const groupBStudents = allStudentIds.slice(2); // e.g. std-3, std-4

      const session1A = {
        date: '2026-09-12',
        weekKey: '2026-09-07',
        topic: 'Figuras rítmicas básicas, compás de 4/4 y lectura en Clave de Sol',
        generalComment: 'Excelente entusiasmo del grupo en la lectura coral de rítmicas a una voz y dictado de alturas do-sol.',
        records: {
          [groupAStudents[0] || 'std-1']: {
            studentId: groupAStudents[0] || 'std-1',
            attendance: 'present',
            participatedTheory: true,
            participatedWritten: true,
            grade: 9.5,
            studentComment: 'Participación muy activa en el solfeo hablado.',
          },
          [groupAStudents[1] || 'std-2']: {
            studentId: groupAStudents[1] || 'std-2',
            attendance: 'present',
            participatedTheory: true,
            participatedWritten: true,
            grade: 9.0,
            studentComment: 'Dictado rítmico completado con precisión.',
          },
          [groupAStudents[2] || 'std-3']: {
            studentId: groupAStudents[2] || 'std-3',
            attendance: 'present',
            participatedTheory: true,
            participatedWritten: false,
            grade: 8.5,
            studentComment: 'Buena entonación; repasar la caligrafía en pentagrama.',
          },
        },
      };

      const session2A = {
        date: '2026-09-19',
        weekKey: '2026-09-14',
        topic: 'Subdivisión ternaria, corcheas y solfeo entonado por grados conjuntos',
        generalComment: 'Práctica con percusión corporal y lectura a dos voces.',
        records: {
          [groupAStudents[0] || 'std-1']: {
            studentId: groupAStudents[0] || 'std-1',
            attendance: 'present',
            participatedTheory: true,
            participatedWritten: true,
            grade: 9.8,
            studentComment: 'Solfeo a primera vista impecable.',
          },
          [groupAStudents[1] || 'std-2']: {
            studentId: groupAStudents[1] || 'std-2',
            attendance: 'present',
            participatedTheory: true,
            participatedWritten: true,
            grade: 9.2,
            studentComment: 'Excelente sincronía rítmica con el grupo.',
          },
          [groupAStudents[2] || 'std-3']: {
            studentId: groupAStudents[2] || 'std-3',
            attendance: 'justified',
            participatedTheory: false,
            participatedWritten: false,
            grade: null,
            studentComment: 'Falta justificada por examen escolar.',
          },
        },
      };

      db.run(
        `INSERT INTO music_reading_sections (id, name, level, teacher_id, teacher_name, day_of_week, class_time, room, student_ids_json, sessions_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'sec-lm-1',
          'Lectura Musical y Rítmica - Grupo A',
          'Grado Elemental 1 y 2',
          'prof-1',
          'Prof. Clara Schumann',
          'Sábado',
          '10:00',
          'Aula Magna 2',
          JSON.stringify(groupAStudents),
          JSON.stringify({
            '2026-09-12': session1A,
            '2026-09-19': session2A,
          }),
        ]
      );

      db.run(
        `INSERT INTO music_reading_sections (id, name, level, teacher_id, teacher_name, day_of_week, class_time, room, student_ids_json, sessions_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'sec-lm-2',
          'Lectura Musical y Lenguaje Avanzado - Grupo B',
          'Grado Medio / Profesional',
          'prof-2',
          'Prof. Niccolò Paganini',
          'Viernes',
          '17:30',
          'Aula 3 de Teclados',
          JSON.stringify(groupBStudents),
          JSON.stringify({}),
        ]
      );
    }
  } catch (err) {
    console.error('Error seeding music reading sections:', err);
  }
}

function seedInitialData() {
  const adminId = 'user-admin-1';
  const adminPassHash = hashPassword('12345');
  db.run(
    `INSERT INTO users (id, username, password_hash, name, role, teacher_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [adminId, 'admin', adminPassHash, 'Director / Administrador', 'admin', null]
  );

  // Seed 3 initial teachers
  const teachersSeed = [
    {
      id: 'prof-1',
      username: 'clara',
      password: 'clara123',
      name: 'Prof. Clara Schumann',
      department: 'Piano Clásico y Teclado',
      students: [
        {
          id: 'std-1',
          name: 'Mateo Fernández Soler',
          instrument: 'Piano',
          level: 'Grado Elemental 3',
          expectedRepertoire: '• J.S. Bach: Pequeños preludios y fugas (BWV 939, 941)\n• W.A. Mozart: Sonata en Do Mayor K. 545 (I y II mov.)\n• C. Czerny: Escuela de la velocidad Op. 299 (Estudios 1-6)',
          recitalRepertoire: '• F. Chopin: Preludio Op. 28 Nº 4 en Mi menor\n• E. Granados: Valses poéticos (selección Nº 1 y 2)',
          examRepertoire: '1. J.S. Bach: Invención a dos voces Nº 4 en Re menor\n2. L.v. Beethoven: Sonata Op. 49 Nº 2 en Sol Mayor (I mov.)\n3. C. Debussy: Le Petit Nègre',
          technicalProgressNotes: 'Excelente control del toque leggiero en pasajes rápidos. Se recomienda reforzar la relajación de muñeca izquierda en arpegios amplios y regularidad del pedal.',
          attendance: {
            '2026-09-07': 'present',
            '2026-09-14': 'present',
            '2026-09-21': 'present',
            '2026-09-28': 'justified',
            '2026-10-05': 'present',
          },
        },
        {
          id: 'std-2',
          name: 'Sofía Valenzuela Gil',
          instrument: 'Piano',
          level: 'Grado Profesional 1',
          expectedRepertoire: '• J.S. Bach: El Clave bien temperado Vol. I (Preludio y Fuga en Do menor)\n• F. Chopin: Nocturno en Do sostenido menor Op. Póstumo\n• S. Rachmaninov: Elegía Op. 3 Nº 1',
          recitalRepertoire: '• C. Debussy: Arabesque Nº 1\n• I. Albéniz: Suite Española (Asturias / Leyenda)',
          examRepertoire: '1. J.S. Bach: Preludio y Fuga Nº 2 en Do menor\n2. L.v. Beethoven: Sonata Op. 10 Nº 1 (Allegro molto)\n3. F. Chopin: Estudio Op. 10 Nº 3 "Tristesse"',
          technicalProgressNotes: 'Madurez interpretativa sobresaliente. Gran sonoridad cantábile en la melodía. Trabajar la independencia polifónica en los registros medios.',
          attendance: {
            '2026-09-07': 'present',
            '2026-09-14': 'present',
            '2026-09-21': 'present',
            '2026-09-28': 'present',
            '2026-10-05': 'present',
          },
        },
      ],
    },
    {
      id: 'prof-2',
      username: 'niccolo',
      password: 'niccolo123',
      name: 'Prof. Niccolò Paganini',
      department: 'Cuerda Frotada (Violín y Viola)',
      students: [
        {
          id: 'std-3',
          name: 'Alejandro Morales Cruz',
          instrument: 'Violín',
          level: 'Grado Elemental 2',
          expectedRepertoire: '• O. Rieding: Concierto en Si menor Op. 35 (I mov.)\n• H. Schradieck: Escuela de la técnica del violín (Sección 1)\n• Wohlfahrt: 60 Estudios Op. 45 (Estudios 1 a 10)',
          recitalRepertoire: '• A. Vivaldi: Concierto en La menor Op. 3 Nº 6 (Allegro)',
          examRepertoire: '1. J.S. Bach: Minueto en Sol Mayor\n2. O. Rieding: Concierto Op. 35 (Completo)\n3. Escala y arpegios en dos octavas (Sol M y La M)',
          technicalProgressNotes: 'Buen progreso en el golpe de arco détaché y distribución sonora. Prestar atención a la colocación del pulgar izquierdo en primera posición para evitar tensión.',
          attendance: {
            '2026-09-07': 'present',
            '2026-09-14': 'absent',
            '2026-09-21': 'present',
            '2026-09-28': 'present',
            '2026-10-05': 'present',
          },
        },
      ],
    },
    {
      id: 'prof-3',
      username: 'andres',
      password: 'andres123',
      name: 'Prof. Andrés Segovia',
      department: 'Guitarra Clásica',
      students: [
        {
          id: 'std-4',
          name: 'Lucía Navarro Rivas',
          instrument: 'Guitarra',
          level: 'Grado Elemental 4',
          expectedRepertoire: '• F. Sor: 24 Estudios progresivos Op. 31 (Nº 1, 3, 5)\n• L. Brouwer: Estudios sencillos (I al V)\n• F. Tárrega: Lágrima y Adelita',
          recitalRepertoire: '• F. Tárrega: Recuerdos de la Alhambra (técnica de trémolo)\n• Gaspar Sanz: Canarios',
          examRepertoire: '1. J.S. Bach: Bourrée en Mi menor (BWV 996)\n2. F. Carulli: Sonata en Do Mayor\n3. L. Brouwer: Danza característica',
          technicalProgressNotes: 'Proyección tímbrica rica y cuidada pulsación apoyada en la mano derecha. Continuar los ejercicios diarios de coordinación metronómica en escalas rápidas.',
          attendance: {
            '2026-09-07': 'present',
            '2026-09-14': 'present',
            '2026-09-21': 'justified',
            '2026-09-28': 'present',
            '2026-10-05': 'present',
          },
        },
      ],
    },
  ];

  for (const t of teachersSeed) {
    db.run(`INSERT INTO teachers (id, name, department) VALUES (?, ?, ?)`, [
      t.id,
      t.name,
      t.department,
    ]);

    const userId = `user-${t.id}`;
    db.run(
      `INSERT INTO users (id, username, password_hash, name, role, teacher_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, t.username, hashPassword(t.password), t.name, 'teacher', t.id]
    );

    for (const s of t.students) {
      db.run(
        `INSERT INTO students (id, teacher_id, name, instrument, level, expected_repertoire, recital_repertoire, exam_repertoire, technical_progress_notes, attendance_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.id,
          t.id,
          s.name,
          s.instrument,
          s.level,
          s.expectedRepertoire,
          s.recitalRepertoire,
          s.examRepertoire,
          s.technicalProgressNotes,
          JSON.stringify(s.attendance),
        ]
      );
    }
  }
}

export function getDbBuffer(): Buffer {
  if (!db) {
    if (fs.existsSync(DB_FILE)) {
      return fs.readFileSync(DB_FILE);
    }
    throw new Error('Base de datos SQLite no inicializada');
  }
  const binaryArray = db.export();
  const buffer = Buffer.from(binaryArray);
  try {
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error al persistir DB_FILE antes de descarga:', err);
  }
  return buffer;
}

export function getDbStats() {
  if (!db) {
    return {
      fileSizeKb: 0,
      teachersCount: 0,
      studentsCount: 0,
      readingSectionsCount: 0,
      usersCount: 0,
      databasePath: 'data/academia.sqlite',
      lastModified: new Date().toISOString(),
    };
  }

  let fileSizeKb = 0;
  try {
    if (fs.existsSync(DB_FILE)) {
      const stats = fs.statSync(DB_FILE);
      fileSizeKb = Math.round(stats.size / 1024);
    }
  } catch {}

  const teachersRes = db.exec('SELECT COUNT(*) FROM teachers');
  const studentsRes = db.exec('SELECT COUNT(*) FROM students');
  const sectionsRes = db.exec('SELECT COUNT(*) FROM music_reading_sections');
  const usersRes = db.exec('SELECT COUNT(*) FROM users');

  return {
    fileSizeKb,
    teachersCount: teachersRes.length > 0 && teachersRes[0].values.length > 0 ? (teachersRes[0].values[0][0] as number) : 0,
    studentsCount: studentsRes.length > 0 && studentsRes[0].values.length > 0 ? (studentsRes[0].values[0][0] as number) : 0,
    readingSectionsCount: sectionsRes.length > 0 && sectionsRes[0].values.length > 0 ? (sectionsRes[0].values[0][0] as number) : 0,
    usersCount: usersRes.length > 0 && usersRes[0].values.length > 0 ? (usersRes[0].values[0][0] as number) : 0,
    databasePath: 'data/academia.sqlite',
    lastModified: new Date().toISOString(),
  };
}

export function getFullBackupData() {
  if (!db) throw new Error('Base de datos SQLite no inicializada');

  // Ensure latest in-memory state is flushed to disk
  persistDb();

  const stats = getDbStats();

  // Teachers
  const teachersRes = db.exec('SELECT id, name, department, created_at FROM teachers ORDER BY name ASC');
  const teachers = teachersRes.length > 0
    ? teachersRes[0].values.map((row) => ({
        id: row[0],
        name: row[1],
        department: row[2],
        createdAt: row[3],
      }))
    : [];

  // Students
  const studentsRes = db.exec(
    `SELECT id, teacher_id, name, instrument, level, class_day, class_time, 
            expected_repertoire, recital_repertoire, exam_repertoire, 
            technical_progress_notes, weekly_notes_json, weekly_grades_json, 
            attendance_json, created_at, updated_at 
     FROM students ORDER BY name ASC`
  );
  const students = studentsRes.length > 0
    ? studentsRes[0].values.map((row) => {
        let weeklyNotes = {};
        let weeklyGrades = {};
        let attendance = {};
        try { weeklyNotes = JSON.parse((row[11] as string) || '{}'); } catch {}
        try { weeklyGrades = JSON.parse((row[12] as string) || '{}'); } catch {}
        try { attendance = JSON.parse((row[13] as string) || '{}'); } catch {}

        return {
          id: row[0],
          teacherId: row[1],
          name: row[2],
          instrument: row[3],
          level: row[4],
          classDay: row[5] || 'Lunes',
          classTime: row[6] || '16:00',
          expectedRepertoire: row[7] || '',
          recitalRepertoire: row[8] || '',
          examRepertoire: row[9] || '',
          technicalProgressNotes: row[10] || '',
          weeklyTechnicalNotes: weeklyNotes,
          weeklyGrades,
          attendance,
          createdAt: row[14],
          updatedAt: row[15],
        };
      })
    : [];

  // Music Reading Sections
  const sectionsRes = db.exec(
    `SELECT id, name, level, teacher_id, teacher_name, day_of_week, class_time, 
            room, student_ids_json, sessions_json, created_at, updated_at 
     FROM music_reading_sections ORDER BY name ASC`
  );
  const musicReadingSections = sectionsRes.length > 0
    ? sectionsRes[0].values.map((row) => {
        let studentIds = [];
        let sessions = {};
        try { studentIds = JSON.parse((row[8] as string) || '[]'); } catch {}
        try { sessions = JSON.parse((row[9] as string) || '{}'); } catch {}

        return {
          id: row[0],
          name: row[1],
          level: row[2],
          teacherId: row[3],
          teacherName: row[4],
          dayOfWeek: row[5],
          classTime: row[6],
          room: row[7],
          studentIds,
          sessions,
          createdAt: row[10],
          updatedAt: row[11],
        };
      })
    : [];

  // Users (sanitized, excluding password_hash)
  const usersRes = db.exec('SELECT id, username, name, role, teacher_id, created_at FROM users ORDER BY name ASC');
  const users = usersRes.length > 0
    ? usersRes[0].values.map((row) => ({
        id: row[0],
        username: row[1],
        name: row[2],
        role: row[3],
        teacherId: row[4],
        createdAt: row[5],
      }))
    : [];

  return {
    meta: {
      exportedAt: new Date().toISOString(),
      academicYear: '2026-2027',
      system: 'Academia Musical - Sistema de Calificaciones, Asistencia y Fichas',
      databaseEngine: 'SQLite (sql.js)',
      databaseFile: 'academia.sqlite',
      stats,
    },
    teachers,
    students,
    musicReadingSections,
    users,
  };
}

function seedAuditAndConnectionLogsIfEmpty() {
  if (!db) return;
  try {
    const check = db.exec("SELECT id FROM audit_logs LIMIT 1");
    if (check.length === 0 || check[0].values.length === 0) {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      // Seed teacher connection records
      db.run(
        `INSERT INTO teacher_connections (id, user_id, username, teacher_name, role, ip_address, user_agent, device_info, location_hint, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'conn-seed-1',
          'user-prof-1',
          'clara',
          'Prof. Clara Schumann',
          'teacher',
          '190.166.45.22',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0',
          'Windows 11 • Google Chrome',
          'Santo Domingo (GMT-4)',
          `${todayStr} 08:30:15`,
        ]
      );
      db.run(
        `INSERT INTO teacher_connections (id, user_id, username, teacher_name, role, ip_address, user_agent, device_info, location_hint, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'conn-seed-2',
          'user-prof-2',
          'niccolo',
          'Prof. Niccolò Paganini',
          'teacher',
          '179.53.112.89',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/17.4',
          'macOS Sonoma • Apple Safari',
          'Santiago de los Caballeros (GMT-4)',
          `${todayStr} 09:12:40`,
        ]
      );

      // Seed audit activity logs
      db.run(
        `INSERT INTO audit_logs (id, user_id, username, teacher_id, teacher_name, action_type, target_name, description, details_json, ip_address, device_info, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'audit-seed-1',
          'user-prof-1',
          'clara',
          'prof-1',
          'Prof. Clara Schumann',
          'grade',
          'Mateo Fernández Soler',
          'Asignó calificación semanal de 9.5 en Piano',
          JSON.stringify({ week: '2026-09-21', grade: 9.5, instrument: 'Piano' }),
          '190.166.45.22',
          'Windows 11 • Google Chrome',
          `${todayStr} 08:35:10`,
        ]
      );
      db.run(
        `INSERT INTO audit_logs (id, user_id, username, teacher_id, teacher_name, action_type, target_name, description, details_json, ip_address, device_info, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'audit-seed-2',
          'user-prof-1',
          'clara',
          'prof-1',
          'Prof. Clara Schumann',
          'attendance',
          'Sofía Valenzuela Gil',
          'Registró asistencia: "Presente" (semana del 28 Sep)',
          JSON.stringify({ week: '2026-09-28', status: 'present' }),
          '190.166.45.22',
          'Windows 11 • Google Chrome',
          `${todayStr} 08:38:22`,
        ]
      );
      db.run(
        `INSERT INTO audit_logs (id, user_id, username, teacher_id, teacher_name, action_type, target_name, description, details_json, ip_address, device_info, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'audit-seed-3',
          'user-prof-2',
          'niccolo',
          'prof-2',
          'Prof. Niccolò Paganini',
          'technical_note',
          'Alejandro Morales Cruz',
          'Actualizó nota técnica semanal: "Excelente articulación en cambio de posición."',
          JSON.stringify({ week: '2026-09-21' }),
          '179.53.112.89',
          'macOS Sonoma • Apple Safari',
          `${todayStr} 09:20:05`,
        ]
      );
      db.run(
        `INSERT INTO audit_logs (id, user_id, username, teacher_id, teacher_name, action_type, target_name, description, details_json, ip_address, device_info, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'audit-seed-4',
          'user-prof-2',
          'niccolo',
          'prof-2',
          'Prof. Niccolò Paganini',
          'repertoire',
          'Alejandro Morales Cruz',
          'Actualizó repertorio de recital: Vivaldi Concierto en La menor Op. 3 Nº 6',
          JSON.stringify({ field: 'recitalRepertoire' }),
          '179.53.112.89',
          'macOS Sonoma • Apple Safari',
          `${todayStr} 09:25:50`,
        ]
      );
    }
  } catch (err) {
    console.error('Error seeding audit logs:', err);
  }
}

export function recordTeacherConnection(params: {
  userId: string;
  username: string;
  teacherName: string;
  role: string;
  ipAddress: string;
  userAgent?: string;
  deviceInfo?: string;
  locationHint?: string;
}) {
  if (!db) return;
  try {
    const id = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    db.run(
      `INSERT INTO teacher_connections (id, user_id, username, teacher_name, role, ip_address, user_agent, device_info, location_hint)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.userId,
        params.username,
        params.teacherName,
        params.role,
        params.ipAddress,
        params.userAgent || '',
        params.deviceInfo || '',
        params.locationHint || '',
      ]
    );
    persistDb();
  } catch (err) {
    console.error('Error recording connection log:', err);
  }
}

export function recordAuditLog(params: {
  userId: string;
  username: string;
  teacherId?: string | null;
  teacherName: string;
  actionType: string;
  targetName?: string;
  description: string;
  detailsJson?: Record<string, any>;
  ipAddress?: string;
  deviceInfo?: string;
}) {
  if (!db) return;
  try {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    db.run(
      `INSERT INTO audit_logs (id, user_id, username, teacher_id, teacher_name, action_type, target_name, description, details_json, ip_address, device_info)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.userId,
        params.username,
        params.teacherId || null,
        params.teacherName,
        params.actionType,
        params.targetName || '',
        params.description,
        JSON.stringify(params.detailsJson || {}),
        params.ipAddress || '',
        params.deviceInfo || '',
      ]
    );
    persistDb();
  } catch (err) {
    console.error('Error recording audit log:', err);
  }
}

export function getTeacherConnections(filters?: { teacherId?: string; limit?: number }) {
  if (!db) return [];
  try {
    const limit = filters?.limit || 100;
    const res = db.exec(
      `SELECT c.id, c.user_id, c.username, c.teacher_name, c.role, c.ip_address, c.user_agent, c.device_info, c.location_hint, c.created_at, u.teacher_id
       FROM teacher_connections c
       LEFT JOIN users u ON c.user_id = u.id
       ORDER BY c.created_at DESC
       LIMIT ?`,
      [limit]
    );

    if (res.length === 0 || res[0].values.length === 0) return [];

    let rows = res[0].values.map((r) => ({
      id: r[0] as string,
      userId: r[1] as string,
      username: r[2] as string,
      teacherName: r[3] as string,
      role: r[4] as string,
      ipAddress: r[5] as string,
      userAgent: r[6] as string,
      deviceInfo: r[7] as string,
      locationHint: r[8] as string,
      createdAt: r[9] as string,
      teacherId: r[10] as string | null,
    }));

    if (filters?.teacherId) {
      rows = rows.filter((r) => r.teacherId === filters.teacherId);
    }

    return rows;
  } catch (err) {
    console.error('Error fetching teacher connections:', err);
    return [];
  }
}

export function getAuditLogs(filters?: { teacherId?: string; date?: string; actionType?: string; limit?: number }) {
  if (!db) return [];
  try {
    const limit = filters?.limit || 250;
    const res = db.exec(
      `SELECT id, user_id, username, teacher_id, teacher_name, action_type, target_name, description, details_json, ip_address, device_info, created_at
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT ?`,
      [limit]
    );

    if (res.length === 0 || res[0].values.length === 0) return [];

    let rows = res[0].values.map((r) => {
      let details = {};
      try {
        details = JSON.parse((r[8] as string) || '{}');
      } catch {}

      return {
        id: r[0] as string,
        userId: r[1] as string,
        username: r[2] as string,
        teacherId: r[3] as string | null,
        teacherName: r[4] as string,
        actionType: r[5] as string,
        targetName: r[6] as string,
        description: r[7] as string,
        details,
        ipAddress: r[9] as string,
        deviceInfo: r[10] as string,
        createdAt: r[11] as string,
      };
    });

    if (filters?.teacherId) {
      rows = rows.filter((r) => r.teacherId === filters.teacherId);
    }

    if (filters?.date) {
      // Compare substring of YYYY-MM-DD
      const datePrefix = filters.date.slice(0, 10);
      rows = rows.filter((r) => r.createdAt && r.createdAt.startsWith(datePrefix));
    }

    if (filters?.actionType && filters.actionType !== 'all') {
      rows = rows.filter((r) => r.actionType === filters.actionType);
    }

    return rows;
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return [];
  }
}

export function getAuditStats() {
  if (!db) {
    return {
      totalChangesToday: 0,
      activeTeachersToday: 0,
      totalConnections: 0,
      lastConnection: null,
    };
  }

  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    const changesTodayRes = db.exec(
      `SELECT COUNT(*) FROM audit_logs WHERE created_at LIKE ?`,
      [`${todayStr}%`]
    );
    const totalChangesToday =
      changesTodayRes.length > 0 && changesTodayRes[0].values.length > 0
        ? (changesTodayRes[0].values[0][0] as number)
        : 0;

    const activeTeachersRes = db.exec(
      `SELECT COUNT(DISTINCT user_id) FROM audit_logs WHERE created_at LIKE ?`,
      [`${todayStr}%`]
    );
    const activeTeachersToday =
      activeTeachersRes.length > 0 && activeTeachersRes[0].values.length > 0
        ? (activeTeachersRes[0].values[0][0] as number)
        : 0;

    const totalConnRes = db.exec(`SELECT COUNT(*) FROM teacher_connections`);
    const totalConnections =
      totalConnRes.length > 0 && totalConnRes[0].values.length > 0
        ? (totalConnRes[0].values[0][0] as number)
        : 0;

    const lastConnRes = db.exec(
      `SELECT teacher_name, ip_address, location_hint, created_at FROM teacher_connections ORDER BY created_at DESC LIMIT 1`
    );
    let lastConnection: any = null;
    if (lastConnRes.length > 0 && lastConnRes[0].values.length > 0) {
      const row = lastConnRes[0].values[0];
      lastConnection = {
        teacherName: row[0],
        ipAddress: row[1],
        locationHint: row[2],
        createdAt: row[3],
      };
    }

    return {
      totalChangesToday,
      activeTeachersToday,
      totalConnections,
      lastConnection,
    };
  } catch (err) {
    console.error('Error computing audit stats:', err);
    return {
      totalChangesToday: 0,
      activeTeachersToday: 0,
      totalConnections: 0,
      lastConnection: null,
    };
  }
}

