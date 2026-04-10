import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import UserManagement from './pages/UserManagement';
import ReviewForms from './pages/ReviewForms';
import SyncRecords from './pages/SyncRecords';
import Settings from './pages/Settings';
import EventManagement from './pages/EventManagement';
import Login from './pages/Login';
import ActivityLogs from './pages/ActivityLogs';
import AuditCorrection from './pages/AuditCorrection';
import PrePrintBadges from './pages/PrePrintBadges';
import PrePrintForms from './pages/PrePrintForms';

function ProtectedRoute({ element, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return element;
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const getDefaultRoute = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/dashboard';
    if (user.role === 'data_entry') return '/events';
    if (user.role === 'auditor') return '/reviews';
    return '/login';
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#020617] overflow-hidden transition-colors duration-300">
      {user && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        {user && (
          <header className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800/50 sticky top-0 z-30">
            <div className="flex items-center space-x-3">
               <img src="/logo.png" alt="Logo" className="h-8 w-8" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Events Node</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
            >
              <Menu className="h-6 w-6" />
            </button>
          </header>
        )}

        <main className="flex-1 overflow-y-auto w-full">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
            <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
            
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} allowedRoles={['admin']} />} />
            <Route path="/users" element={<ProtectedRoute element={<UserManagement />} allowedRoles={['admin']} />} />
            <Route path="/settings" element={<ProtectedRoute element={<Settings />} allowedRoles={['admin']} />} />
            <Route path="/sync" element={<ProtectedRoute element={<SyncRecords />} allowedRoles={['admin']} />} />
            <Route path="/logs" element={<ProtectedRoute element={<ActivityLogs />} allowedRoles={['admin']} />} />
            <Route path="/pre-print" element={<ProtectedRoute element={<PrePrintBadges />} allowedRoles={['admin']} />} />
            <Route path="/pre-print-forms" element={<ProtectedRoute element={<PrePrintForms />} allowedRoles={['admin']} />} />
            
            <Route path="/events" element={<ProtectedRoute element={<EventManagement />} allowedRoles={['admin', 'data_entry']} />} />
            <Route path="/registration" element={<ProtectedRoute element={<Registration />} allowedRoles={['admin', 'data_entry']} />} />
            
            <Route path="/reviews" element={<ProtectedRoute element={<ReviewForms />} allowedRoles={['admin', 'auditor']} />} />
            <Route path="/audit-correction" element={<ProtectedRoute element={<AuditCorrection />} allowedRoles={['admin', 'auditor']} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App
