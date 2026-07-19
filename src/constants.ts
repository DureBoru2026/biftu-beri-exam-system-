import { GradeLevel, AcademicStream } from './types';

export const SUBJECTS_BY_GRADE: Record<GradeLevel, Record<AcademicStream, string[]>> = {
  '9': {
    'general': ['Afaan Oromoo', 'Amharic', 'English', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Economics', 'Citizenship', 'IT', 'HPE', 'Accounting', 'Agriculture'],
    'natural': [],
    'social': []
  },
  '10': {
    'general': ['Afaan Oromoo', 'Amharic', 'English', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Economics', 'Citizenship', 'IT', 'HPE', 'Accounting', 'Agriculture'],
    'natural': [],
    'social': []
  },
  '11': {
    'general': [],
    'natural': ['Afaan Oromoo', 'English', 'Mathematics', 'Biology', 'Physics', 'Chemistry', 'IT', 'Agriculture', 'Citizenship', 'HPE'],
    'social': ['Afaan Oromoo', 'English', 'Mathematics', 'History', 'Geography', 'Economics', 'Citizenship', 'IT', 'Accounting', 'HPE']
  },
  '12': {
    'general': [],
    'natural': ['Afaan Oromoo', 'English', 'Mathematics', 'Biology', 'Physics', 'Chemistry', 'IT', 'Scholastic Aptitude', 'Citizenship', 'HPE'],
    'social': ['Afaan Oromoo', 'English', 'Mathematics', 'History', 'Geography', 'Economics', 'IT', 'Scholastic Aptitude', 'Citizenship', 'HPE']
  }
};

export const ALL_SUBJECTS = Array.from(new Set(
  Object.values(SUBJECTS_BY_GRADE).flatMap(gradeMap => 
    Object.values(gradeMap).flat()
  )
)).sort();

export function normalizeSubject(sub: string): string {
  if (!sub) return '';
  const s = sub.trim();
  // Map any variations with suffixes to the plain curriculum subject name
  if (s.startsWith('Mathematics') || s.toLowerCase() === 'math' || s.toLowerCase() === 'maths') return 'Mathematics';
  if (s.startsWith('English')) return 'English';
  if (s.startsWith('Biology')) return 'Biology';
  if (s.startsWith('Chemistry')) return 'Chemistry';
  if (s.startsWith('Physics')) return 'Physics';
  if (s.startsWith('History')) return 'History';
  if (s.startsWith('Geography')) return 'Geography';
  if (s.startsWith('Economics')) return 'Economics';
  if (s.startsWith('Citizenship') || s.startsWith('Civics')) return 'Citizenship';
  if (s.startsWith('IT') || s.startsWith('Information Technology') || s.startsWith('Computer Science')) return 'IT';
  if (s.startsWith('HPE') || s.startsWith('Health')) return 'HPE';
  if (s.startsWith('Afaan Oromoo')) return 'Afaan Oromoo';
  if (s.toLowerCase() === 'amharic' || s.startsWith('Amharic')) return 'Amharic';
  if (s.startsWith('Accounting')) return 'Accounting';
  if (s.startsWith('Agriculture')) return 'Agriculture';
  if (s.startsWith('Scholastic Aptitude') || s.startsWith('Aptitude')) return 'Scholastic Aptitude';
  return s;
}

export const DEFAULT_EXAM_DESCRIPTION = {
  en: "Welcome to the Mock Examination. This test is designed to evaluate your readiness for the National EAES Exam. Please ensure you are in a quiet environment, avoid switching tabs, and answer all questions within the given time limit. Good luck!",
  om: "Qormaata madaallii kanaaf baga nagaaan dhuftan. Qormaanni kun qophii keessan madaaluuf kan qophaaye dha. Bakka cal-jecha qabu ta'uu keessan mirkaneeffadhaa, 'tabs' garaa garaa hin jijjiirinaa, akkasumas yeroo kenname keessatti gaaffilee hunda deebisaa. Milkaa'ina!"
};
