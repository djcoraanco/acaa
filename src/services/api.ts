import {
  AuthUser,
  Teacher,
  Student,
  MusicReadingSection,
  TeacherConnection,
  AuditLogEntry,
  AuditStats,
} from '../types';

const TOKEN_STORAGE_KEY = 'academia_sqlite_session_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Error en la solicitud (${res.status})`);
  }

  return data;
}

export const api = {
  async login(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
    let clientTimezone = '';
    try {
      clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {}

    const data = await request<{ token: string; user: AuthUser }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, clientTimezone }),
    });
    setStoredToken(data.token);
    return data;
  },

  async getMe(): Promise<{ user: AuthUser }> {
    return request<{ user: AuthUser }>('/api/me');
  },

  async logout(): Promise<void> {
    try {
      await request('/api/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      setStoredToken(null);
    }
  },

  async getTeachers(): Promise<Teacher[]> {
    const data = await request<{ teachers: Teacher[] }>('/api/teachers');
    return data.teachers;
  },

  async createTeacher(payload: {
    name: string;
    department: string;
    username?: string;
    password?: string;
  }): Promise<{ teacher: Teacher }> {
    return request<{ teacher: Teacher }>('/api/teachers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateTeacher(
    id: string,
    payload: { name?: string; department?: string; username?: string; password?: string }
  ): Promise<void> {
    await request(`/api/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteTeacher(id: string): Promise<void> {
    await request(`/api/teachers/${id}`, {
      method: 'DELETE',
    });
  },

  async createStudent(payload: {
    teacherId: string;
    name: string;
    instrument: string;
    level: string;
    classDay?: string;
    classTime?: string;
    expectedRepertoire: string;
    recitalRepertoire: string;
    examRepertoire: string;
    technicalProgressNotes: string;
    weeklyTechnicalNotes?: Record<string, string>;
    weeklyGrades?: Record<string, number | null>;
    attendance: Record<string, string>;
  }): Promise<{ student: Student }> {
    return request<{ student: Student }>('/api/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateStudent(id: string, payload: Partial<Student>): Promise<void> {
    await request(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteStudent(id: string): Promise<void> {
    await request(`/api/students/${id}`, {
      method: 'DELETE',
    });
  },

  async getAllStudents(): Promise<{
    students: { id: string; name: string; instrument: string; level: string; teacherId: string; teacherName: string }[];
  }> {
    return request<{
      students: { id: string; name: string; instrument: string; level: string; teacherId: string; teacherName: string }[];
    }>('/api/all-students');
  },

  async getMusicReadingSections(): Promise<MusicReadingSection[]> {
    const data = await request<{ sections: MusicReadingSection[] }>('/api/music-reading-sections');
    return Array.isArray(data?.sections) ? data.sections : [];
  },

  async createMusicReadingSection(payload: {
    name: string;
    level: string;
    teacherId?: string | null;
    teacherName?: string;
    dayOfWeek: string;
    classTime: string;
    room?: string;
    studentIds: string[];
  }): Promise<{ section: MusicReadingSection }> {
    return request<{ section: MusicReadingSection }>('/api/music-reading-sections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateMusicReadingSection(
    id: string,
    payload: Partial<MusicReadingSection>
  ): Promise<void> {
    await request(`/api/music-reading-sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteMusicReadingSection(id: string): Promise<void> {
    await request(`/api/music-reading-sections/${id}`, {
      method: 'DELETE',
    });
  },

  async getDbStats(): Promise<{
    fileSizeKb: number;
    teachersCount: number;
    studentsCount: number;
    readingSectionsCount: number;
    usersCount: number;
    databasePath: string;
    lastModified: string;
  }> {
    const data = await request<{ stats: any }>('/api/backup/stats');
    return data.stats;
  },

  async downloadDatabaseSqlite(): Promise<void> {
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/backup/sqlite', { headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'No se pudo descargar la base de datos.');
    }

    const blob = await res.blob();
    const dateStr = new Date().toISOString().slice(0, 10);
    let filename = `academia_backup_${dateStr}.sqlite`;

    const disposition = res.headers.get('Content-Disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async downloadDatabaseJson(): Promise<void> {
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/backup/json', { headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'No se pudo generar el respaldo JSON.');
    }

    const blob = await res.blob();
    const dateStr = new Date().toISOString().slice(0, 10);
    let filename = `academia_backup_${dateStr}.json`;

    const disposition = res.headers.get('Content-Disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async updateAdminCredentials(payload: {
    currentPassword?: string;
    newUsername?: string;
    newPassword?: string;
  }): Promise<{ message: string; user: AuthUser }> {
    return request<{ message: string; user: AuthUser }>('/api/admin/credentials', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async getTeacherConnections(teacherId?: string): Promise<TeacherConnection[]> {
    const query = teacherId ? `?teacherId=${encodeURIComponent(teacherId)}` : '';
    const res = await request<{ connections: TeacherConnection[] }>(`/api/admin/connections${query}`);
    return res.connections;
  },

  async getAuditLogs(params?: {
    teacherId?: string;
    date?: string;
    actionType?: string;
  }): Promise<AuditLogEntry[]> {
    const q = new URLSearchParams();
    if (params?.teacherId) q.set('teacherId', params.teacherId);
    if (params?.date) q.set('date', params.date);
    if (params?.actionType) q.set('actionType', params.actionType);
    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await request<{ logs: AuditLogEntry[] }>(`/api/admin/audit-logs${qs}`);
    return res.logs;
  },

  async getAuditStats(): Promise<AuditStats> {
    const res = await request<{ stats: AuditStats }>('/api/admin/audit-stats');
    return res.stats;
  },
};

