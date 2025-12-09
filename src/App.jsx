import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import HistoryList from './components/HistoryList';
import VehicleList from './components/VehicleList';
import RegistrationForm from './components/RegistrationForm';
import ScanPage from './components/ScanPage';
import Auth from './components/Auth';
import UserProfile from './components/UserProfile';
import { Car, Search, AlertTriangle, Camera, PlusCircle, List, Clock, LogOut, UserCircle } from 'lucide-react';

import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import { supabase } from './utils/supabaseClient';

function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setRole(session.user.user_metadata.role);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setRole(session.user.user_metadata.role);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">Loading...</div>;
  }

  if (!session) {
    return (
      <ThemeProvider>
        <Auth />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors duration-200">
          <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-colors duration-200">
            <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
              <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white transition-colors flex items-center gap-2">
                <Car className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                주차 단속 관리
              </Link>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link to="/profile" className="p-2 text-gray-500 hover:text-blue-600 transition-colors" title="프로필">
                  <UserCircle className="w-6 h-6" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-3xl mx-auto px-4 py-6 relative">
            <Routes>
              <Route path="/" element={<VehicleList />} />
              <Route
                path="/register"
                element={role === 'manager' ? <RegistrationForm /> : <Navigate to="/" replace />}
              />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/history" element={<HistoryList />} />
              <Route path="/profile" element={<UserProfile />} />
            </Routes>
          </main>

          <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe transition-colors duration-200">
            <div className="flex justify-around items-center h-16 max-w-3xl mx-auto">
              <Link to="/" className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                <List className="w-6 h-6" />
                <span className="text-xs mt-1">차량조회</span>
              </Link>
              <Link to="/scan" className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                <Camera className="w-6 h-6" />
                <span className="text-xs mt-1">스캔</span>
              </Link>
              <Link to="/history" className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                <Clock className="w-6 h-6" />
                <span className="text-xs mt-1">기록</span>
              </Link>

              {role === 'manager' && (
                <Link to="/register" className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                  <PlusCircle className="w-6 h-6" />
                  <span className="text-xs mt-1">등록</span>
                </Link>
              )}
            </div>
          </nav>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
