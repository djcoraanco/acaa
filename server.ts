import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  getDb,
  persistDb,
  hashPassword,
  generateToken,
  getDbBuffer,
  getDbStats,
  getFullBackupData,
  recordTeacherConnection,
  recordAuditLog,
  getTeacherConnections,
  getAuditLogs,
  getAuditStats,
} from './server/db.js';

interface AuthenticatedUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'teacher';
  teacherId: string | null;
}

interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

function parseClientInfo(req: Request) {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = '';
  if (typeof forwarded === 'string') {
    ip = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    ip = forwarded[0].trim();
  } else {
    ip = req.socket.remoteAddress || '127.0.0.1';
  }
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  if (ip === '::1' || ip === '127.0.0.1') {
    ip = '127.0.0.1 (Red Local / Servidor)';
  }

  const userAgent = (req.headers['user-agent'] as string) || '';
  let os = 'Dispositivo';
  if (/windows/i.test(userAgent)) os = 'Windows 11/10';
  else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS (Apple)';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/linux/i.test(userAgent)) os = 'Linux';

  let browser = 'Web';
  if (/edg/i.test(userAgent)) browser = 'Microsoft Edge';
  else if (/chrome|crios/i.test(userAgent)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(userAgent)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(userAgent)) browser = 'Apple Safari';

  const deviceInfo = `${os} • ${browser}`;

  let locationHint =
    (req.headers['x-client-timezone'] as string) ||
    (req.body?.clientTimezone as string) ||
    '';
  if (!locationHint) {
    locationHint = 'República Dominicana (América/Santo_Domingo)';
  }

  return { ip, userAgent, deviceInfo, locationHint };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize SQLite database
  const db = await getDb();

  // Authentication Middleware
  const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'No autorizado. Se requiere token de sesión.' });
    }
    const sessionRes = db.exec(
      `SELECT u.id, u.username, u.name, u.role, u.teacher_id
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = ?`,
      [token]
    );

    if (sessionRes.length === 0 || sessionRes[0].values.length === 0) {
      return res.status(401).json({ error: 'Sesión expirada o token inválido.' });
    }

    const [id, username, name, role, teacherId] = sessionRes[0].values[0];
    req.user = {
      id: id as string,
      username: username as string,
      name: name as string,
      role: role as 'admin' | 'teacher',
      teacherId: (teacherId as string) || null,
    };

    next();
  };

  const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso restringido únicamente para Administradores.' });
    }
    next();
  };

  // ==========================================
  // HEALTH CHECK
  // ==========================================
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
  });

  // ==========================================
  // AUTH ROUTES
  // ==========================================

  // POST /api/login
  app.post('/api/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
    }

    const hashed = hashPassword(password);
    const result = db.exec(
      `SELECT id, username, name, role, teacher_id
       FROM users
       WHERE LOWER(username) = LOWER(?) AND password_hash = ?`,
      [username, hashed]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const [id, uName, name, role, teacherId] = result[0].values[0];
    const token = generateToken();

    db.run(`INSERT INTO sessions (token, user_id) VALUES (?, ?)`, [token, id]);
    persistDb();

    // Log connection location and device
    const clientInfo = parseClientInfo(req);
    recordTeacherConnection({
      userId: id as string,
      username: uName as string,
      teacherName: name as string,
      role: role as string,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      deviceInfo: clientInfo.deviceInfo,
      locationHint: clientInfo.locationHint,
    });

    // Record login in audit log
    recordAuditLog({
      userId: id as string,
      username: uName as string,
      teacherId: (teacherId as string) || null,
      teacherName: name as string,
      actionType: 'login',
      targetName: role === 'admin' ? 'Panel de Administración' : 'Perfil de Profesor',
      description: `Inicio de sesión exitoso desde ${clientInfo.ip} (${clientInfo.deviceInfo})`,
      ipAddress: clientInfo.ip,
      deviceInfo: clientInfo.deviceInfo,
    });

    res.json({
      token,
      user: {
        id,
        username: uName,
        name,
        role,
        teacherId: teacherId || null,
      },
    });
  });

  // GET /api/me
  app.get('/api/me', requireAuth, (req: AuthRequest, res: Response) => {
    res.json({ user: req.user });
  });

  // POST /api/logout
  app.post('/api/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      db.run(`DELETE FROM sessions WHERE token = ?`, [token]);
      persistDb();
    }
    res.json({ message: 'Sesión cerrada exitosamente.' });
  });

  // ==========================================
  // ADMIN CREDENTIALS & AUDIT LOG ROUTES
  // ==========================================

  // PUT /api/admin/credentials (Change admin username or password)
  app.put('/api/admin/credentials', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
    const { currentPassword, newUsername, newPassword } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ error: 'No autorizado.' });
    }

    // Verify current password if provided
    if (currentPassword) {
      const currentHashed = hashPassword(currentPassword);
      const checkCurrent = db.exec('SELECT id FROM users WHERE id = ? AND password_hash = ?', [adminId, currentHashed]);
      if (checkCurrent.length === 0 || checkCurrent[0].values.length === 0) {
        return res.status(400).json({ error: 'La contraseña actual ingresada es incorrecta.' });
      }
    }

    if (newUsername && newUsername.trim()) {
      const trimmedU = newUsername.trim();
      const checkU = db.exec('SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?', [trimmedU, adminId]);
      if (checkU.length > 0 && checkU[0].values.length > 0) {
        return res.status(400).json({ error: `El nombre de usuario "${trimmedU}" ya está en uso.` });
      }
      db.run('UPDATE users SET username = ? WHERE id = ?', [trimmedU, adminId]);
    }

    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres.' });
      }
      db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(newPassword.trim()), adminId]);
    }

    persistDb();

    // Log the change
    const clientInfo = parseClientInfo(req);
    recordAuditLog({
      userId: adminId,
      username: req.user!.username,
      teacherId: null,
      teacherName: req.user!.name,
      actionType: 'admin_credential_change',
      targetName: 'Credenciales del Administrador',
      description: 'El Administrador actualizó sus credenciales de acceso (usuario y/o contraseña)',
      ipAddress: clientInfo.ip,
      deviceInfo: clientInfo.deviceInfo,
    });

    const updatedUserRes = db.exec('SELECT id, username, name, role FROM users WHERE id = ?', [adminId]);
    const updatedU = updatedUserRes[0]?.values[0];

    res.json({
      message: 'Credenciales de Administrador actualizadas con éxito.',
      user: updatedU
        ? { id: updatedU[0], username: updatedU[1], name: updatedU[2], role: updatedU[3], teacherId: null }
        : req.user,
    });
  });

  // GET /api/admin/connections (Admin view of teacher connections)
  app.get('/api/admin/connections', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
    const teacherId = req.query.teacherId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 150;
    const connections = getTeacherConnections({ teacherId, limit });
    res.json({ connections });
  });

  // GET /api/admin/audit-logs (Admin view of daily changes)
  app.get('/api/admin/audit-logs', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
    const teacherId = req.query.teacherId as string | undefined;
    const date = req.query.date as string | undefined;
    const actionType = req.query.actionType as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 300;

    const logs = getAuditLogs({ teacherId, date, actionType, limit });
    res.json({ logs });
  });

  // GET /api/admin/audit-stats (Admin summary metrics)
  app.get('/api/admin/audit-stats', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
    const stats = getAuditStats();
    res.json({ stats });
  });

  // ==========================================
  // TEACHERS & STUDENTS ROUTES
  // ==========================================

  // GET /api/teachers
  // Admin receives ALL teachers and students. Teacher receives ONLY their teacher record and students.
  app.get('/api/teachers', requireAuth, (req: AuthRequest, res: Response) => {
    let teachersQuery = 'SELECT id, name, department FROM teachers';
    let queryParams: any[] = [];

    if (req.user?.role === 'teacher') {
      if (!req.user.teacherId) {
        return res.json({ teachers: [] });
      }
      teachersQuery += ' WHERE id = ?';
      queryParams.push(req.user.teacherId);
    }

    teachersQuery += ' ORDER BY name ASC';
    const teachersResult = db.exec(teachersQuery, queryParams);

    if (teachersResult.length === 0) {
      return res.json({ teachers: [] });
    }

    const teachersList = teachersResult[0].values.map(([id, name, department]) => {
      // Get students for this teacher
      const studentsResult = db.exec(
        `SELECT id, name, instrument, level, class_day, class_time, expected_repertoire, recital_repertoire, exam_repertoire, technical_progress_notes, weekly_notes_json, weekly_grades_json, attendance_json
         FROM students
         WHERE teacher_id = ?
         ORDER BY created_at ASC`,
        [id]
      );

      const students =
        studentsResult.length > 0
          ? studentsResult[0].values.map(
              ([sId, sName, inst, lvl, cDay, cTime, expRep, recRep, exRep, techNotes, weeklyJson, gradesJson, attJson]) => {
                let attendance = {};
                try {
                  attendance = JSON.parse((attJson as string) || '{}');
                } catch {
                  attendance = {};
                }
                let weeklyTechnicalNotes = {};
                try {
                  weeklyTechnicalNotes = JSON.parse((weeklyJson as string) || '{}');
                } catch {
                  weeklyTechnicalNotes = {};
                }
                let weeklyGrades = {};
                try {
                  weeklyGrades = JSON.parse((gradesJson as string) || '{}');
                } catch {
                  weeklyGrades = {};
                }
                return {
                  id: sId,
                  name: sName,
                  instrument: inst,
                  level: lvl,
                  classDay: (cDay as string) || 'Lunes',
                  classTime: (cTime as string) || '16:00',
                  expectedRepertoire: expRep || '',
                  recitalRepertoire: recRep || '',
                  examRepertoire: exRep || '',
                  technicalProgressNotes: techNotes || '',
                  weeklyTechnicalNotes,
                  weeklyGrades,
                  attendance,
                };
              }
            )
          : [];

      // If admin, include linked username
      let username = null;
      if (req.user?.role === 'admin') {
        const uRes = db.exec('SELECT username FROM users WHERE teacher_id = ?', [id]);
        if (uRes.length > 0 && uRes[0].values.length > 0) {
          username = uRes[0].values[0][0];
        }
      }

      return {
        id,
        name,
        department,
        username,
        students,
      };
    });

    res.json({ teachers: teachersList });
  });

  // POST /api/teachers (Admin only)
  app.post('/api/teachers', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
    const { name, department, username, password } = req.body;
    if (!name || !department) {
      return res.status(400).json({ error: 'Nombre y cátedra son obligatorios.' });
    }

    const teacherId = `prof-${Date.now()}`;
    db.run(`INSERT INTO teachers (id, name, department) VALUES (?, ?, ?)`, [
      teacherId,
      name,
      department,
    ]);

    // Create user login for this teacher if credentials provided
    const uName = username ? username.trim() : `prof_${Date.now().toString().slice(-4)}`;
    const pass = password ? password : '123456';

    const checkU = db.exec('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', [uName]);
    if (checkU.length > 0 && checkU[0].values.length > 0) {
      return res.status(400).json({ error: `El nombre de usuario "${uName}" ya está registrado.` });
    }

    const userId = `user-${teacherId}`;
    db.run(
      `INSERT INTO users (id, username, password_hash, name, role, teacher_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, uName, hashPassword(pass), name, 'teacher', teacherId]
    );

    persistDb();

    res.status(201).json({
      teacher: {
        id: teacherId,
        name,
        department,
        username: uName,
        students: [],
      },
      message: 'Profesor y credenciales creados exitosamente.',
    });
  });

  // PUT /api/teachers/:id
  app.put('/api/teachers/:id', requireAuth, (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, department, username, password } = req.body;

    // Check permissions: only admin or the teacher themself can edit profile info
    if (req.user?.role !== 'admin' && req.user?.teacherId !== id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar a este profesor.' });
    }

    if (name || department) {
      const currentRes = db.exec(`SELECT name, department FROM teachers WHERE id = ?`, [id]);
      if (currentRes.length > 0 && currentRes[0].values.length > 0) {
        const currentName = currentRes[0].values[0][0];
        const currentDept = currentRes[0].values[0][1];
        const newName = name || currentName;
        const newDept = department || currentDept;
        db.run(`UPDATE teachers SET name = ?, department = ? WHERE id = ?`, [newName, newDept, id]);
        db.run(`UPDATE users SET name = ? WHERE teacher_id = ?`, [newName, id]);
      }
    }

    // Admin can update teacher username
    if (username && username.trim()) {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Solo el administrador puede cambiar el nombre de usuario de los profesores.' });
      }
      const trimmedU = username.trim();
      const checkU = db.exec('SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND teacher_id != ?', [trimmedU, id]);
      if (checkU.length > 0 && checkU[0].values.length > 0) {
        return res.status(400).json({ error: `El nombre de usuario "${trimmedU}" ya está en uso.` });
      }
      db.run(`UPDATE users SET username = ? WHERE teacher_id = ?`, [trimmedU, id]);
    }

    // If password update requested (Admin can update any teacher's password, or teacher can update their own)
    if (password && password.trim()) {
      db.run(`UPDATE users SET password_hash = ? WHERE teacher_id = ?`, [
        hashPassword(password.trim()),
        id,
      ]);
    }

    persistDb();
    res.json({ message: 'Profesor y credenciales actualizados correctamente.' });
  });

  // DELETE /api/teachers/:id (Admin only)
  app.delete('/api/teachers/:id', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    db.run(`DELETE FROM students WHERE teacher_id = ?`, [id]);
    db.run(`DELETE FROM users WHERE teacher_id = ?`, [id]);
    db.run(`DELETE FROM teachers WHERE id = ?`, [id]);
    persistDb();
    res.json({ message: 'Profesor y alumnos eliminados correctamente.' });
  });

  // POST /api/students
  app.post('/api/students', requireAuth, (req: AuthRequest, res: Response) => {
    const {
      teacherId,
      name,
      instrument,
      level,
      classDay,
      classTime,
      expectedRepertoire,
      recitalRepertoire,
      examRepertoire,
      technicalProgressNotes,
      weeklyTechnicalNotes,
      weeklyGrades,
      attendance,
    } = req.body;

    if (!teacherId || !name) {
      return res.status(400).json({ error: 'Datos de estudiante incompletos.' });
    }

    // Permission check: teachers can only add students to their own list
    if (req.user?.role !== 'admin' && req.user?.teacherId !== teacherId) {
      return res.status(403).json({ error: 'No tienes permiso para agregar estudiantes a este profesor.' });
    }

    const studentId = `std-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    db.run(
      `INSERT INTO students (id, teacher_id, name, instrument, level, class_day, class_time, expected_repertoire, recital_repertoire, exam_repertoire, technical_progress_notes, weekly_notes_json, weekly_grades_json, attendance_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        teacherId,
        name,
        instrument || 'Instrumento',
        level || 'Grado Elemental 1',
        classDay || 'Lunes',
        classTime || '16:00',
        expectedRepertoire || '',
        recitalRepertoire || '',
        examRepertoire || '',
        technicalProgressNotes || '',
        JSON.stringify(weeklyTechnicalNotes || {}),
        JSON.stringify(weeklyGrades || {}),
        JSON.stringify(attendance || {}),
      ]
    );

    persistDb();

    // Record audit log for new student
    const clientInfo = parseClientInfo(req);
    recordAuditLog({
      userId: req.user!.id,
      username: req.user!.username,
      teacherId: req.user!.teacherId,
      teacherName: req.user!.name,
      actionType: 'student_create',
      targetName: name,
      description: `Inscribió al alumno ${name} (${instrument || 'Instrumento'})`,
      detailsJson: { studentId, instrument, level },
      ipAddress: clientInfo.ip,
      deviceInfo: clientInfo.deviceInfo,
    });

    res.status(201).json({
      student: {
        id: studentId,
        teacherId,
        name,
        instrument: instrument || 'Instrumento',
        level: level || 'Grado Elemental 1',
        classDay: classDay || 'Lunes',
        classTime: classTime || '16:00',
        expectedRepertoire: expectedRepertoire || '',
        recitalRepertoire: recitalRepertoire || '',
        examRepertoire: examRepertoire || '',
        technicalProgressNotes: technicalProgressNotes || '',
        weeklyTechnicalNotes: weeklyTechnicalNotes || {},
        weeklyGrades: weeklyGrades || {},
        attendance: attendance || {},
      },
    });
  });

  // PUT /api/students/:id
  app.put('/api/students/:id', requireAuth, (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const {
      name,
      instrument,
      level,
      classDay,
      classTime,
      expectedRepertoire,
      recitalRepertoire,
      examRepertoire,
      technicalProgressNotes,
      weeklyTechnicalNotes,
      weeklyGrades,
      attendance,
    } = req.body;

    // Check student ownership
    const studentRes = db.exec(`SELECT teacher_id FROM students WHERE id = ?`, [id]);
    if (studentRes.length === 0 || studentRes[0].values.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado.' });
    }

    const teacherId = studentRes[0].values[0][0];

    // Role check: Teacher can only update their own students!
    if (req.user?.role !== 'admin' && req.user?.teacherId !== teacherId) {
      return res.status(403).json({
        error: 'Acceso denegado. Solo puedes editar los estudiantes de tu propia cátedra.',
      });
    }

    // Query existing student info for audit diff comparison
    const currentStdRes = db.exec(
      'SELECT name, weekly_grades_json, attendance_json, weekly_notes_json, expected_repertoire, recital_repertoire, exam_repertoire FROM students WHERE id = ?',
      [id]
    );

    db.run(
      `UPDATE students
       SET name = ?, instrument = ?, level = ?, class_day = ?, class_time = ?, expected_repertoire = ?, recital_repertoire = ?, exam_repertoire = ?, technical_progress_notes = ?, weekly_notes_json = ?, weekly_grades_json = ?, attendance_json = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name,
        instrument,
        level,
        classDay || 'Lunes',
        classTime || '16:00',
        expectedRepertoire || '',
        recitalRepertoire || '',
        examRepertoire || '',
        technicalProgressNotes || '',
        JSON.stringify(weeklyTechnicalNotes || {}),
        JSON.stringify(weeklyGrades || {}),
        JSON.stringify(attendance || {}),
        id,
      ]
    );

    persistDb();

    // Log the specific change in audit log
    const clientInfo = parseClientInfo(req);
    const studentName = name || (currentStdRes[0]?.values[0]?.[0] as string) || 'Alumno';

    if (currentStdRes.length > 0 && currentStdRes[0].values.length > 0) {
      const [, oldGradesJson, oldAttJson, oldWeeklyNotesJson, oldExp, oldRec, oldExm] = currentStdRes[0].values[0];

      let loggedSpecific = false;

      // 1. Grade change
      if (weeklyGrades) {
        let oldG: any = {};
        try { oldG = JSON.parse((oldGradesJson as string) || '{}'); } catch {}
        const diffWeeks = Object.keys(weeklyGrades).filter((w) => weeklyGrades[w] !== oldG[w]);
        if (diffWeeks.length > 0) {
          const w = diffWeeks[0];
          const val = weeklyGrades[w];
          recordAuditLog({
            userId: req.user!.id,
            username: req.user!.username,
            teacherId: req.user!.teacherId,
            teacherName: req.user!.name,
            actionType: 'grade',
            targetName: studentName,
            description: `Asignó calificación semanal de ${val ?? 'N/A'} al alumno ${studentName} (semana del ${w})`,
            detailsJson: { studentId: id, week: w, grade: val },
            ipAddress: clientInfo.ip,
            deviceInfo: clientInfo.deviceInfo,
          });
          loggedSpecific = true;
        }
      }

      // 2. Attendance change
      if (attendance && !loggedSpecific) {
        let oldA: any = {};
        try { oldA = JSON.parse((oldAttJson as string) || '{}'); } catch {}
        const diffWeeks = Object.keys(attendance).filter((w) => attendance[w] !== oldA[w]);
        if (diffWeeks.length > 0) {
          const w = diffWeeks[0];
          const st = attendance[w];
          const label = st === 'present' ? 'Presente' : st === 'justified' ? 'Falta Justificada' : 'Falta Injustificada';
          recordAuditLog({
            userId: req.user!.id,
            username: req.user!.username,
            teacherId: req.user!.teacherId,
            teacherName: req.user!.name,
            actionType: 'attendance',
            targetName: studentName,
            description: `Registró asistencia "${label}" para ${studentName} (semana del ${w})`,
            detailsJson: { studentId: id, week: w, status: st },
            ipAddress: clientInfo.ip,
            deviceInfo: clientInfo.deviceInfo,
          });
          loggedSpecific = true;
        }
      }

      // 3. Weekly technical note change
      if (weeklyTechnicalNotes && !loggedSpecific) {
        let oldN: any = {};
        try { oldN = JSON.parse((oldWeeklyNotesJson as string) || '{}'); } catch {}
        const diffWeeks = Object.keys(weeklyTechnicalNotes).filter((w) => weeklyTechnicalNotes[w] !== oldN[w]);
        if (diffWeeks.length > 0) {
          const w = diffWeeks[0];
          const text = (weeklyTechnicalNotes[w] || '').trim();
          const preview = text.length > 70 ? text.slice(0, 70) + '...' : text;
          recordAuditLog({
            userId: req.user!.id,
            username: req.user!.username,
            teacherId: req.user!.teacherId,
            teacherName: req.user!.name,
            actionType: 'technical_note',
            targetName: studentName,
            description: `Actualizó observación técnica de ${studentName} (${w}): "${preview}"`,
            detailsJson: { studentId: id, week: w },
            ipAddress: clientInfo.ip,
            deviceInfo: clientInfo.deviceInfo,
          });
          loggedSpecific = true;
        }
      }

      // 4. Repertoire change
      if (
        !loggedSpecific &&
        ((expectedRepertoire !== undefined && expectedRepertoire !== oldExp) ||
          (recitalRepertoire !== undefined && recitalRepertoire !== oldRec) ||
          (examRepertoire !== undefined && examRepertoire !== oldExm))
      ) {
        recordAuditLog({
          userId: req.user!.id,
          username: req.user!.username,
          teacherId: req.user!.teacherId,
          teacherName: req.user!.name,
          actionType: 'repertoire',
          targetName: studentName,
          description: `Actualizó ficha de repertorios (esperado, recital o examen) de ${studentName}`,
          detailsJson: { studentId: id },
          ipAddress: clientInfo.ip,
          deviceInfo: clientInfo.deviceInfo,
        });
        loggedSpecific = true;
      }

      // Fallback general student profile update
      if (!loggedSpecific) {
        recordAuditLog({
          userId: req.user!.id,
          username: req.user!.username,
          teacherId: req.user!.teacherId,
          teacherName: req.user!.name,
          actionType: 'student_update',
          targetName: studentName,
          description: `Guardó cambios en la ficha técnica del estudiante ${studentName}`,
          detailsJson: { studentId: id },
          ipAddress: clientInfo.ip,
          deviceInfo: clientInfo.deviceInfo,
        });
      }
    }

    res.json({ message: 'Estudiante actualizado exitosamente en la base de datos SQLite.' });
  });

  // DELETE /api/students/:id (Admin only)
  app.delete('/api/students/:id', requireAuth, (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Role check: Only admin can delete students as requested!
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado. Los profesores no pueden eliminar alumnos. Esta acción está reservada exclusivamente para el Administrador.',
      });
    }

    const studentRes = db.exec(`SELECT teacher_id, name FROM students WHERE id = ?`, [id]);
    if (studentRes.length === 0 || studentRes[0].values.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado.' });
    }

    const sName = (studentRes[0].values[0][1] as string) || id;

    db.run(`DELETE FROM students WHERE id = ?`, [id]);
    persistDb();

    // Log deletion
    const clientInfo = parseClientInfo(req);
    recordAuditLog({
      userId: req.user!.id,
      username: req.user!.username,
      teacherId: null,
      teacherName: req.user!.name,
      actionType: 'student_delete',
      targetName: sName,
      description: `Eliminó permanentemente al alumno ${sName}`,
      detailsJson: { studentId: id },
      ipAddress: clientInfo.ip,
      deviceInfo: clientInfo.deviceInfo,
    });

    res.json({ message: 'Estudiante eliminado de la base de datos.' });
  });

  // ==========================================
  // ALL STUDENTS ROSTER (For section enrollments)
  // ==========================================
  app.get('/api/all-students', requireAuth, (req: AuthRequest, res: Response) => {
    const stdsResult = db.exec(
      `SELECT s.id, s.name, s.instrument, s.level, s.teacher_id, t.name as teacher_name
       FROM students s
       LEFT JOIN teachers t ON s.teacher_id = t.id
       ORDER BY s.name ASC`
    );

    if (stdsResult.length === 0 || stdsResult[0].values.length === 0) {
      return res.json({ students: [] });
    }

    const students = stdsResult[0].values.map(([id, name, instrument, level, teacherId, teacherName]) => ({
      id,
      name,
      instrument,
      level,
      teacherId,
      teacherName: teacherName || 'Sin profesor asignado',
    }));

    res.json({ students });
  });

  // ==========================================
  // SECCIONES DE LECTURA MUSICAL (GRUPALES)
  // ==========================================

  // GET /api/music-reading-sections
  app.get('/api/music-reading-sections', requireAuth, (req: AuthRequest, res: Response) => {
    const secResult = db.exec(
      `SELECT id, name, level, teacher_id, teacher_name, day_of_week, class_time, room, student_ids_json, sessions_json, created_at, updated_at
       FROM music_reading_sections
       ORDER BY name ASC`
    );

    if (secResult.length === 0 || secResult[0].values.length === 0) {
      return res.json({ sections: [] });
    }

    const sections = secResult[0].values.map(
      ([id, name, level, teacherId, teacherName, dayOfWeek, classTime, room, stdIdsJson, sessJson, createdAt, updatedAt]) => {
        let studentIds: string[] = [];
        try {
          studentIds = JSON.parse((stdIdsJson as string) || '[]');
        } catch {
          studentIds = [];
        }

        let sessions: Record<string, any> = {};
        try {
          sessions = JSON.parse((sessJson as string) || '{}');
        } catch {
          sessions = {};
        }

        return {
          id,
          name,
          level,
          teacherId: teacherId || null,
          teacherName: teacherName || '',
          dayOfWeek: dayOfWeek || 'Sábado',
          classTime: classTime || '10:00',
          room: room || 'Aula 1',
          studentIds,
          sessions,
          createdAt,
          updatedAt,
        };
      }
    );

    res.json({ sections });
  });

  // POST /api/music-reading-sections (Admin only)
  app.post('/api/music-reading-sections', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
    const { name, level, teacherId, teacherName, dayOfWeek, classTime, room, studentIds } = req.body;

    if (!name || !level) {
      return res.status(400).json({ error: 'Nombre de sección y nivel son obligatorios.' });
    }

    const sectionId = `sec-lm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    // If teacherId is passed, find teacher name if not provided
    let resolvedTeacherName = teacherName || '';
    if (teacherId && !resolvedTeacherName) {
      const tRes = db.exec('SELECT name FROM teachers WHERE id = ?', [teacherId]);
      if (tRes.length > 0 && tRes[0].values.length > 0) {
        resolvedTeacherName = tRes[0].values[0][0] as string;
      }
    }

    db.run(
      `INSERT INTO music_reading_sections (id, name, level, teacher_id, teacher_name, day_of_week, class_time, room, student_ids_json, sessions_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sectionId,
        name,
        level,
        teacherId || null,
        resolvedTeacherName,
        dayOfWeek || 'Sábado',
        classTime || '10:00',
        room || 'Aula de Lenguaje Musical 1',
        JSON.stringify(studentIds || []),
        JSON.stringify({}),
      ]
    );

    persistDb();

    res.status(201).json({
      section: {
        id: sectionId,
        name,
        level,
        teacherId: teacherId || null,
        teacherName: resolvedTeacherName,
        dayOfWeek: dayOfWeek || 'Sábado',
        classTime: classTime || '10:00',
        room: room || 'Aula de Lenguaje Musical 1',
        studentIds: studentIds || [],
        sessions: {},
      },
    });
  });

  // PUT /api/music-reading-sections/:id (Admin or assigned teacher)
  app.put('/api/music-reading-sections/:id', requireAuth, (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, level, teacherId, teacherName, dayOfWeek, classTime, room, studentIds, sessions } = req.body;

    const secRes = db.exec('SELECT teacher_id FROM music_reading_sections WHERE id = ?', [id]);
    if (secRes.length === 0 || secRes[0].values.length === 0) {
      return res.status(404).json({ error: 'Sección no encontrada.' });
    }

    const sectionTeacherId = secRes[0].values[0][0];

    // Role check: Only admin or assigned teacher can update
    if (req.user?.role !== 'admin' && req.user?.teacherId !== sectionTeacherId) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta sección de lectura musical.' });
    }

    let resolvedTeacherName = teacherName || '';
    if (teacherId && !resolvedTeacherName) {
      const tRes = db.exec('SELECT name FROM teachers WHERE id = ?', [teacherId]);
      if (tRes.length > 0 && tRes[0].values.length > 0) {
        resolvedTeacherName = tRes[0].values[0][0] as string;
      }
    }

    db.run(
      `UPDATE music_reading_sections
       SET name = ?, level = ?, teacher_id = ?, teacher_name = ?, day_of_week = ?, class_time = ?, room = ?, student_ids_json = ?, sessions_json = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name,
        level,
        teacherId || null,
        resolvedTeacherName,
        dayOfWeek || 'Sábado',
        classTime || '10:00',
        room || 'Aula 1',
        JSON.stringify(studentIds || []),
        JSON.stringify(sessions || {}),
        id,
      ]
    );

    persistDb();

    // Log music reading section modification
    const clientInfo = parseClientInfo(req);
    recordAuditLog({
      userId: req.user!.id,
      username: req.user!.username,
      teacherId: req.user!.teacherId,
      teacherName: req.user!.name,
      actionType: 'music_reading',
      targetName: name || 'Lectura Musical',
      description: `Actualizó sesiones/calificaciones en la sección grupal "${name || 'Lectura Musical'}"`,
      detailsJson: { sectionId: id },
      ipAddress: clientInfo.ip,
      deviceInfo: clientInfo.deviceInfo,
    });

    res.json({ message: 'Sección de lectura musical actualizada exitosamente.' });
  });

  // DELETE /api/music-reading-sections/:id (Admin only)
  app.delete('/api/music-reading-sections/:id', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const secRes = db.exec('SELECT id FROM music_reading_sections WHERE id = ?', [id]);
    if (secRes.length === 0 || secRes[0].values.length === 0) {
      return res.status(404).json({ error: 'Sección no encontrada.' });
    }

    db.run('DELETE FROM music_reading_sections WHERE id = ?', [id]);
    persistDb();

    res.json({ message: 'Sección eliminada exitosamente.' });
  });

  // ==========================================
  // DATABASE BACKUP & EXPORT ROUTES
  // ==========================================

  // GET /api/backup/stats - Status and summary of the database
  app.get('/api/backup/stats', requireAuth, (req: AuthRequest, res: Response) => {
    try {
      const stats = getDbStats();
      res.json({ stats });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al obtener estadísticas de la base de datos.' });
    }
  });

  // GET /api/backup/sqlite - Download the raw SQLite database file (.sqlite)
  app.get('/api/backup/sqlite', requireAuth, (req: AuthRequest, res: Response) => {
    try {
      const buffer = getDbBuffer();
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `academia_backup_${dateStr}.sqlite`;

      res.setHeader('Content-Type', 'application/x-sqlite3');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (err: any) {
      console.error('Error al generar respaldo SQLite:', err);
      res.status(500).json({ error: 'Error al generar la descarga de la base de datos SQLite.' });
    }
  });

  // GET /api/backup/json - Download structured JSON export of all database tables
  app.get('/api/backup/json', requireAuth, (req: AuthRequest, res: Response) => {
    try {
      const backupData = getFullBackupData();
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `academia_backup_${dateStr}.json`;
      const jsonString = JSON.stringify(backupData, null, 2);

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(jsonString);
    } catch (err: any) {
      console.error('Error al generar respaldo JSON:', err);
      res.status(500).json({ error: 'Error al generar el respaldo JSON de la base de datos.' });
    }
  });

  // ==========================================
  // VITE MIDDLEWARE / STATIC ASSETS
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} with SQLite database.`);
  });
}

startServer();
