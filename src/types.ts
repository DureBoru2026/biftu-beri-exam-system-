export type UserRole = 'admin' | 'student' | 'staff';
export type GradeLevel = '9' | '10' | '11' | '12';
export type AcademicStream = 'natural' | 'social' | 'general';

export interface UserProfile {
  uid: string;
  name: string; // Used for historical/admin profiles
  fullName?: string; // Used for students specifically
  email: string;
  role: UserRole;
  grade?: GradeLevel;
  stream?: AcademicStream;
  school?: string;
  createdAt: any;
  sid?: string; // Student ID
  studentId?: string; // For parents to link to a student
  age?: number;
  address?: string;
  department?: string;
  subject?: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  grade: GradeLevel;
  stream: AcademicStream;
  durationMinutes: number;
  description: string;
  creatorId: string;
  createdAt: any;
  dueDate?: any;
  status: 'draft' | 'published' | 'archived';
  questionCount?: number;
  type?: 'model' | 'final' | 'eaes_mock' | 'mid';
  mockNumber?: number;
}

export interface Question {
  id: string;
  text: string;
  topic?: string;
  type: 'multiple-choice';
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  points: number;
  orderIndex?: number;
}

export interface ExamAttempt {
  id: string;
  userId: string;
  userName?: string; // Added for admin live tracking
  examId: string;
  examTitle?: string; // Added for redundancy/reports
  examSubject?: string; // Added for subjects analytics
  startedAt: any;
  finishedAt?: any;
  status: 'ongoing' | 'completed' | 'timed-out';
  score?: number;
  totalPoints?: number;
  violations?: number;
  answersCount?: number;
  updatedAt?: any; // Added for live tracking filter
}

export interface Answer {
  id: string;
  questionId: string;
  selectedOptionIndex: number;
  isCorrect?: boolean;
  answeredAt: any;
}

export interface StudentMark {
  id: string;
  studentId: string; // matches user's uid
  studentName: string;
  studentSid: string;
  subject: string;
  assessmentType: 'continuous_assessment' | 'mid_exam' | 'final_exam' | 'mock_exam';
  score: number; // score obtained
  totalPoints: number; // target max points e.g. 30, 40, 100
  term: 'term_1' | 'term_2';
  recordedBy: string;
  recordedAt: any;
}
