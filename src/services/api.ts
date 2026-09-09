import {
  AuthUser,
  Teacher,
  Student,
  MusicReadingSection,
  TeacherConnection,
  AuditLogEntry,
  AuditStats,
  WeeklyAttendance,
} from '../types';
import { firebaseService, getStoredFirebaseUser, seedInitialFirestoreData } from './firebaseService';

const TOKEN_STORAGE_KEY = 'academia_firebase_session_token';

export function getStoredToken(): string | null {
  const fbUser = getStoredFirebaseUser();
  if (fbUser) return fbUser.id;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export const api = {
  async login(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const res = await firebaseService.login(username, password);
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: AuthUser }> {
    return firebaseService.getMe();
  },

  async logout(): Promise<void> {
    setStoredToken(null);
    return firebaseService.logout();
  },

  async getTeachers(): Promise<Teacher[]> {
    return firebaseService.getTeachers();
  },

  async createTeacher(payload: {
    name: string;
    department: string;
    username?: string;
    password?: string;
  }): Promise<{ teacher: Teacher }> {
    return firebaseService.createTeacher(payload);
  },

  async updateTeacher(
    id: string,
    payload: { name?: string; department?: string; username?: string; password?: string }
  ): Promise<void> {
    return firebaseService.updateTeacher(id, payload);
  },

  async deleteTeacher(id: string): Promise<void> {
    return firebaseService.deleteTeacher(id);
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
    attendance: WeeklyAttendance;
  }): Promise<{ student: Student }> {
    return firebaseService.createStudent(payload);
  },

  async updateStudent(id: string, payload: Partial<Student>): Promise<void> {
    return firebaseService.updateStudent(id, payload);
  },

  async deleteStudent(id: string): Promise<void> {
    return firebaseService.deleteStudent(id);
  },

  async getAllStudents(): Promise<{
    students: { id: string; name: string; instrument: string; level: string; teacherId: string; teacherName: string }[];
  }> {
    return firebaseService.getAllStudents();
  },

  async getMusicReadingSections(): Promise<MusicReadingSection[]> {
    return firebaseService.getMusicReadingSections();
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
    return firebaseService.createMusicReadingSection(payload);
  },

  async updateMusicReadingSection(
    id: string,
    payload: Partial<MusicReadingSection>
  ): Promise<void> {
    return firebaseService.updateMusicReadingSection(id, payload);
  },

  async deleteMusicReadingSection(id: string): Promise<void> {
    return firebaseService.deleteMusicReadingSection(id);
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
    return firebaseService.getDbStats();
  },

  async downloadDatabaseSqlite(): Promise<void> {
    // If SQLite download is called, provide the full JSON backup from Firebase Firestore
    return firebaseService.downloadDatabaseJson();
  },

  async downloadDatabaseJson(): Promise<void> {
    return firebaseService.downloadDatabaseJson();
  },

  async updateAdminCredentials(payload: {
    currentPassword?: string;
    newUsername?: string;
    newPassword?: string;
  }): Promise<{ message: string; user: AuthUser }> {
    return firebaseService.updateAdminCredentials(payload);
  },

  async getTeacherConnections(teacherId?: string): Promise<TeacherConnection[]> {
    return firebaseService.getTeacherConnections(teacherId);
  },

  async getAuditLogs(params?: {
    teacherId?: string;
    date?: string;
    actionType?: string;
  }): Promise<AuditLogEntry[]> {
    return firebaseService.getAuditLogs(params);
  },

  async getAuditStats(): Promise<AuditStats> {
    return firebaseService.getAuditStats();
  },

  async syncFirestore(): Promise<{ success: boolean; message: string }> {
    return seedInitialFirestoreData();
  },

  async importDatabaseJson(jsonData: any): Promise<{ success: boolean; message: string }> {
    return firebaseService.importDatabaseJson(jsonData);
  },
};
