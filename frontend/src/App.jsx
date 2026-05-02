import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import UserManagement from './pages/UserManagement';
import RolesManagement from './pages/RolesManagement';
import Exhibitors from './pages/Exhibitors';
import ReviewForms from './pages/ReviewForms';
import SyncRecords from './pages/SyncRecords';
import Settings from './pages/Settings';
import EventManagement from './pages/EventManagement';
import DataExport from './pages/DataExport';
import Login from './pages/Login';
import ActivityLogs from './pages/ActivityLogs';
import AuditCorrection from './pages/AuditCorrection';
import PrePrintBadges from './pages/PrePrintBadges';
import PrePrintForms from './pages/PrePrintForms';
import MediaRegistration from './pages/MediaRegistration';
import Profile from './pages/Profile';


function ProtectedRoute({ element, requiredPermission }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  
  if (requiredPermission) {
    const hasPerm = user.role?.name === 'admin' || user.role?.permissions?.some(p => p.name === requiredPermission);
    if (!hasPerm) {
      return <Navigate to="/profile" replace />;
    }
  }
  return element;
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const getDefaultRoute = () => {
    if (!user) return '/login';
    const perms = user.role?.permissions || [];
    const has = (n) => perms.some(p => p.name === n) || user.role?.name === 'admin';

    if (has('view_dashboard')) return '/dashboard';
    if (has('view_events')) return '/events';
    if (has('review_queue')) return '/reviews';
    if (has('register_visitors')) return '/registration';
    return '/profile';
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
            
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} requiredPermission="view_dashboard" />} />
            <Route path="/users" element={<ProtectedRoute element={<UserManagement />} requiredPermission="manage_users" />} />
            <Route path="/roles" element={<ProtectedRoute element={<RolesManagement />} requiredPermission="manage_users" />} />
            <Route path="/exhibitors" element={<ProtectedRoute element={<Exhibitors />} requiredPermission="manage_users" />} />
            <Route path="/settings" element={<ProtectedRoute element={<Settings />} requiredPermission="manage_settings" />} />
            <Route path="/sync" element={<ProtectedRoute element={<SyncRecords />} requiredPermission="sync_records" />} />
            <Route path="/logs" element={<ProtectedRoute element={<ActivityLogs />} requiredPermission="view_logs" />} />
            <Route path="/export" element={<ProtectedRoute element={<DataExport />} requiredPermission="manage_settings" />} />
            <Route path="/pre-print" element={<ProtectedRoute element={<PrePrintBadges />} requiredPermission="print_badges" />} />
            <Route path="/pre-print-forms" element={<ProtectedRoute element={<PrePrintForms />} requiredPermission="print_badges" />} />
            
            <Route path="/events" element={<ProtectedRoute element={<EventManagement />} requiredPermission="view_events" />} />
            <Route path="/registration" element={<ProtectedRoute element={<Registration />} requiredPermission="register_visitors" />} />
            <Route path="/media-registration" element={<ProtectedRoute element={<MediaRegistration />} requiredPermission="register_media" />} />
            
            <Route path="/reviews" element={<ProtectedRoute element={<ReviewForms />} requiredPermission="review_queue" />} />

            <Route path="/audit-correction" element={<ProtectedRoute element={<AuditCorrection />} requiredPermission="audit_records" />} />
            <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App
