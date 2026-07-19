import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'om';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.exams': 'Exams',
    'nav.results': 'Results',
    'nav.students': 'Students',
    'nav.admin': 'Admin Control',
    'hero.title': 'The Smart Way to Master Your Exams',
    'hero.subtitle': 'Unified platform for the National Examination syllabus.',
    'auth.getStarted': 'Get Started',
    'auth.login': 'Log In',
    'common.subject': 'Subject',
    'common.grade': 'Grade',
    'common.stream': 'Stream',
    'common.start': 'Start Now',
    'common.continue': 'Continue',
    'common.back': 'Back',
    'common.save': 'Save Changes',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.search': 'Search...',
    'exam.startExam': 'Start Examination',
    'admin.createExam': 'Create New Exam',
    'admin.aiGenerator': 'AI Question Engine',
    'admin.liveStatus': 'Live Activity',
    'admin.activeStudents': 'Active Students',
    'admin.analytics': 'Performance Analytics',
    'admin.bulkImport': 'Bulk Import Students',
    'admin.difficulty': 'Difficulty Level',
    'admin.easy': 'Easy',
    'admin.medium': 'Medium',
    'admin.hard': 'Hard',
    'admin.questionsCount': 'Questions Count',
    'exam.improvementTips': 'Personalized AI Improvement Tips',
    'exam.generatingTips': 'Generating study tips...',
    'role.admin': 'Staff / Administrator',
    'nav.home': 'HOME',
    'nav.about': 'ABOUT',
    'nav.news': 'NEWS',
    'about.title': 'About Biftu Beri Portal',
    'about.mission': 'Our Mission',
    'about.missionDesc': 'To provide secondary school students with the digital tools necessary to excel in national examinations through AI-driven assessment and real-time guidance.',
    'about.creator': 'Creator & Developer',
    'about.founder': 'Jemal Fano Haji',
    'about.founderRole': 'Developer & IT Specialist',
    'news.title': 'Public Announcements',
    'news.empty': 'No new notifications at this time.',
    'news.add': 'Post News',
    'news.placeholder': 'Write important announcement here...',
    'news.success': 'News posted successfully!',
    'staff.manageExams': 'Manage Exams',
    'staff.postNews': 'Post News',
    'exam.remainingTime': 'Remaining Time',
    'exam.timesUp': 'Time is up! Your exam is being submitted automatically.',
    'exam.submitSuccess': 'Exam submitted successfully.',
    'admin.enterTitle': 'Please enter an exam title.',
    'admin.titleTooLong': 'Exam title cannot exceed 100 characters.',
    'admin.invalidDuration': 'Please enter a valid exam duration (minutes).',
    'admin.saveSuccess': 'Exam saved successfully!',
    'results.excellent': 'Excellent Work!',
    'results.keepPracticing': 'Keep Practicing!',
    'results.completedExam': "You've completed the exam",
    'results.finalScore': 'Final Score',
    'results.points': 'Points',
    'results.violations': 'Violations',
    'results.attemptDate': 'Attempt Date',
    'results.detailedReview': 'Detailed Review',
    'results.breakdown': 'Question Breakdown',
    'results.yourAnswer': 'Your answer',
    'results.correctAnswer': 'Correct',
    'results.explanation': 'Explanation',
    'results.retake': 'Retake Exam for Practice',
    'dashboard.recentResults': 'Recent Results',
    'dashboard.noResults': 'No exams completed yet.',
    'dashboard.manageExam': 'Manage Exam',
    'dashboard.takeExam': 'Take Exam',
    'exam.preparing': 'Preparing Your Exam',
    'exam.initSecure': 'Initializing Secure Session',
    'exam.optimizing': 'Optimizing',
    'exam.integrity': 'Integrity Protocol',
    'exam.noSwitch': 'Do not switch tabs during the examination.',
    'exam.timerLimit': 'Time Limit',
    'exam.syncDesc': 'Managed by server-side synchronization.',
    'exam.finishExam': 'Finish Examination',
    'exam.answered': 'You have answered',
    'exam.outOf': 'out of',
    'common.attempts': 'attempts / yaaliiwwan',
    'common.attempt': 'attempt / yaalii',
    'nav.remedial': 'Remedial',
    'nav.requests': 'Requests',
    'admin.scheduler': 'Supplementary Class Scheduler',
    'admin.gaps': 'Academic Support Gaps'
  },
  om: {
    'nav.dashboard': 'Dashboard',
    'nav.exams': 'Qormaata',
    'nav.results': 'Bu\'aa',
    'nav.students': 'Barattoota',
    'nav.admin': 'Admin Control',
    'hero.title': 'Akkaataa Smart Ta\'een Qormaata Keessan Mo\'adhaa',
    'hero.subtitle': 'Sillaabasii Qormaata Biyyaalessaa qophaaye.',
    'auth.getStarted': 'Amma Jalqabaa',
    'auth.login': 'Seenunaa',
    'common.subject': 'Gosa Barnootaa',
    'common.grade': 'Kutaa',
    'common.stream': 'Stream',
    'common.start': 'Amma Jalqabaa',
    'common.continue': 'Itti Fufi',
    'common.back': 'Gara Duubaa',
    'common.save': 'Oolchi',
    'common.cancel': 'Dhiisi',
    'common.delete': 'Haqi',
    'common.search': 'Barbaadi...',
    'exam.startExam': 'Qormaata Jalqabi',
    'admin.createExam': 'Qormaata Haaraa Qopheessi',
    'admin.aiGenerator': 'AI Question Engine',
    'admin.bulkImport': 'Galmee Barattootaa',
    'admin.liveStatus': 'Hordoffii Kallattii',
    'admin.activeStudents': 'Barattoota Live',
    'admin.analytics': 'Xinxala Performance',
    'admin.difficulty': 'Sadarkaa Rakkinaa',
    'admin.easy': 'Salphaa',
    'admin.medium': 'Giddu-galeessa',
    'admin.hard': 'Jabaa',
    'admin.questionsCount': 'Baayyina Gaaffii',
    'exam.improvementTips': 'Gorsa Fooyya\'iinsaa (AI)',
    'exam.generatingTips': 'Gorsa qopheessaa jira...',
    'role.admin': 'Staff / Adminii',
    'nav.home': 'HOME',
    'nav.about': 'Waa\'ee Keenya',
    'nav.news': 'Oduu Haaraa',
    'about.title': 'Waa\'ee Portalii Biftu Beri',
    'about.mission': 'Kaayyoo Keenya',
    'about.missionDesc': 'Barattoota mana barumsaa sadarkaa lammaffaa meeshaalee dijitaalaa qormaata biyyaalessaa irratti qabxii olaanaa fiduuf isaan gargaaran dhiyeessuu.',
    'about.creator': 'Nama Kalaqe',
    'about.founder': 'Jemal Fano Haji',
    'about.founderRole': 'Developer fi Ogeessa IT',
    'news.title': 'Beeksisa Ummataa',
    'news.empty': 'Yeroo ammaa beeksisni haaraan hin jiru.',
    'news.add': 'Oduu Maxxansi',
    'news.placeholder': 'Beeksisa barbaachisaa asirratti barreessi...',
    'news.success': 'Oduun milkaa\'inaan maxxanfameera!',
    'staff.manageExams': 'Qormaatota Bulchi',
    'staff.postNews': 'Oduu Maxxansi',
    'exam.remainingTime': 'Yeroo Hafe',
    'exam.timesUp': 'Yeroon xumurameera! Qormaatni keessan ofumaan ergamaa jira.',
    'exam.submitSuccess': 'Qormaatni milkaa\'inaan ergameera.',
    'results.excellent': 'Hojii Gaarii!',
    'results.keepPracticing': 'Barachuu Itti Fufi!',
    'results.completedExam': 'Qormaata xumuratteetta',
    'results.finalScore': 'Qabxii Xumuraa',
    'results.points': 'Qabxii',
    'results.violations': 'Seera Sarbuu',
    'results.attemptDate': 'Guyyaa Qoramte',
    'results.detailedReview': 'Xinxala Bal\'aa',
    'results.breakdown': 'Tarree Gaaffilee',
    'results.yourAnswer': 'Deebii Keessan',
    'results.correctAnswer': 'Deebii Sirrii',
    'results.explanation': 'Ibsa',
    'results.retake': 'Irra deebi\'ii qorami',
    'dashboard.recentResults': 'Bu\'aawwan Dhiheenyaa',
    'dashboard.noResults': 'Hamma ammaatti qormaatni xumurame hin jiru.',
    'dashboard.manageExam': 'Qormaata Bulchi',
    'dashboard.takeExam': 'Qormaata Fudhadhu',
    'exam.preparing': 'Qormaata Qopheessaa Jirra',
    'exam.initSecure': 'Session Nageenyaa Jalqabaa Jira',
    'exam.optimizing': 'Fooyyeessaa jirra',
    'exam.integrity': 'Seera Nageenyaa',
    'exam.noSwitch': 'Yeroo qormaataa gara tab kaaniitti hin deebi\'inaa.',
    'exam.timerLimit': 'Daangaa Yeroo',
    'exam.syncDesc': 'Hordoffii sirna server-tiin kan bulu.',
    'exam.finishExam': 'Qormaata Xumuri',
    'exam.answered': 'Deebisteetta',
    'exam.outOf': 'keessaa',
    'common.attempts': 'yaaliiwwan / attempts',
    'common.attempt': 'yaalii / attempt',
    'nav.remedial': 'Barnoota Dabalataa',
    'nav.requests': 'Gaaffii Galmeessaa',
    'admin.scheduler': 'Sirna Qophii Barnoota Dabalataa',
    'admin.gaps': 'Hanqinaalee Barumsaa'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
