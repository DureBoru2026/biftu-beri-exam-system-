import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Landing from './components/Landing';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import ExamAdmin from './components/ExamAdmin';
import ExamPlayer from './components/ExamPlayer';
import Results from './components/Results';
import ExamReview from './components/ExamReview';

export default function App() {
  const { user, profile, loading } = useAuth();

  React.useEffect(() => {
    localStorage.removeItem('biftu_beri_theme');
    document.documentElement.classList.remove('dark');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
      
      <Route 
        path="/dashboard" 
        element={
          !user ? <Navigate to="/" /> : 
          !profile ? <Onboarding /> : 
          <Dashboard />
        } 
      />

      <Route 
        path="/admin/exams/:examId" 
        element={
          !user || (profile?.role !== 'admin' && profile?.role !== 'staff') ? <Navigate to="/dashboard" /> : <ExamAdmin />
        } 
      />

      <Route 
        path="/exam/:examId/take" 
        element={
          !user ? <Navigate to="/" /> : <ExamPlayer />
        } 
      />

      <Route 
        path="/exam/:examId/review/:attemptId" 
        element={
          !user ? <Navigate to="/" /> : <ExamPlayer />
        } 
      />

      <Route 
        path="/results/:attemptId" 
        element={
          !user ? <Navigate to="/" /> : <Results />
        } 
      />

      <Route 
        path="/review/:examId" 
        element={
          !user || (profile?.role !== 'admin' && profile?.role !== 'staff') ? <Navigate to="/dashboard" /> : <ExamReview />
        } 
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
