import { 
  Users, 
  ClipboardCheck, 
  RefreshCcw, 
  Settings, 
  LayoutDashboard,
  PlusCircle,
  Sun,
  Moon,
  Zap,
  BarChart3,
  X,
  CalendarRange,
  ChevronLeft,
  LogOut,
  FileText,
  FileImage,
  ShieldCheck,
  Printer
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  
  if (!user) return null;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard', color: 'cyan',    roles: ['admin'] },
    { icon: CalendarRange,   label: 'Events',        path: '/events',    color: 'violet', roles: ['admin', 'data_entry'] },
    { icon: PlusCircle,      label: 'Registration',  path: '/registration', color: 'emerald', roles: ['admin', 'data_entry'] },
    { icon: FileText,        label: 'Media Registration', path: '/media-registration', color: 'indigo', roles: ['admin', 'data_entry'] },
    { icon: Users,           label: 'Personnel',     path: '/users',     color: 'blue',   roles: ['admin'] },

    { icon: ClipboardCheck,  label: 'Review Queue',   path: '/reviews',   color: 'purple', roles: ['admin', 'auditor'] },
    { icon: ShieldCheck,     label: 'Audit Correction', path: '/audit-correction', color: 'cyan', roles: ['admin', 'auditor'] },
    { icon: Printer,         label: 'Pre-Print Badges', path: '/pre-print', color: 'indigo',  roles: ['admin'] },
    { icon: FileImage,       label: 'Pre-Print Forms', path: '/pre-print-forms', color: 'pink',  roles: ['admin'] },
    { icon: RefreshCcw,      label: 'Sync Records',  path: '/sync',      color: 'amber',   roles: ['admin'] },
    { icon: ShieldCheck,     label: 'Activity Logs', path: '/logs',      color: 'violet', roles: ['admin'] },
    { icon: Settings,        label: 'Settings',      path: '/settings',  color: 'slate',  roles: ['admin'] },
  ].filter(item => item.roles.includes(user.role));

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`fixed inset-y-0 left-0 z-50 lg:static lg:translate-x-0 flex flex-col h-screen ${isMinimized ? 'w-20' : 'w-72'} bg-white dark:bg-[#020617] text-slate-500 dark:text-slate-400 ${isMinimized ? 'border-none' : 'border-r'} border-slate-200 dark:border-slate-800/50 shrink-0 overflow-hidden transition-all duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Brand Header */}
        <div className={`px-4 py-10 relative flex items-center ${isMinimized ? 'justify-center cursor-pointer' : 'justify-between px-8'}`}>
          {isMinimized ? (
            <div onClick={() => setIsMinimized(false)} className="h-10 w-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-800 transition-transform duration-500 hover:scale-105">
               <img src="/logo.png" alt="DG" className="h-6 w-6 object-contain" />
            </div>
          ) : (
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="h-12 w-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-800 transition-transform duration-500 group-hover:scale-105">
               <img src="/logo.png" alt="Digital Group" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-widest uppercase leading-none">Digital Group</h2>
              <span className="text-[10px] font-black italic text-cyan-500 uppercase tracking-[0.3em] mt-1.5 block leading-none">Events Node</span>
            </div>
          </div>
          )}
          {!isMinimized && (
            <>
              <button onClick={() => setIsMinimized(true)} className="hidden lg:flex p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-4 relative overflow-y-auto overflow-x-hidden">
          {!isMinimized && <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-4 px-4">Main Control Panel</div>}
          {menuItems.map((item, index) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                title={isMinimized ? item.label : undefined}
                onClick={() => { if(window.innerWidth < 1024) onClose(); }}
                className={`flex items-center ${isMinimized ? 'justify-center p-3' : 'justify-between p-3.5'} rounded-2xl transition-all duration-300 group relative ${
                  active 
                    ? `bg-${item.color}-500/10 text-${item.color}-600 dark:text-white border border-${item.color}-500/20` 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className={`flex items-center ${isMinimized ? 'justify-center' : 'space-x-4'}`}>
                  <item.icon className={`h-5 w-5 ${active ? `text-${item.color}-500` : 'text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400'} transition-colors duration-300`} />
                  {!isMinimized && <span className={`font-black text-xs uppercase tracking-widest ${active ? 'text-slate-900 dark:text-white' : 'group-hover:text-slate-900 dark:group-hover:text-white'}`}>{item.label}</span>}
                </div>
                {active && !isMinimized && (
                   <div className={`h-1.5 w-1.5 rounded-full bg-${item.color}-500 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse`} />
                )}
                {active && isMinimized && (
                   <div className={`absolute top-0 bottom-0 left-0 w-1 rounded-r-full bg-${item.color}-500`} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle & Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/50 mt-auto bg-slate-50 dark:bg-slate-900/20 backdrop-blur-md relative">
          <button 
            onClick={toggleTheme}
            className={`w-full flex items-center ${isMinimized ? 'justify-center p-3' : 'justify-between p-4'} rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-500 group overflow-hidden relative`}
          >
             <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="flex items-center space-x-3 relative z-10">
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                   {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </div>
                {!isMinimized && (
                <div className="text-left">
                   <div className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none mb-1">
                      {theme === 'dark' ? 'Day Shift' : 'Night Shift'}
                   </div>
                   <div className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">System Interface Override</div>
                </div>
                )}
             </div>
             {!isMinimized && (
             <div className="h-6 w-12 bg-slate-100 dark:bg-slate-800 rounded-full p-1 relative transition-colors duration-500">
                <div className={`h-4 w-4 rounded-full shadow-lg transition-all duration-500 transform ${theme === 'dark' ? 'translate-x-6 bg-amber-500' : 'translate-x-0 bg-white dark:bg-slate-400'}`} />
             </div>
             )}
          </button>

          {/* Admin / User Profile info & Logout */}
          <button 
            onClick={logout}
            className={`mt-3 w-full flex items-center ${isMinimized ? 'justify-center p-3 text-red-500' : 'justify-start space-x-3 p-4 text-slate-500 hover:text-red-500'} rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative group`}
          >
             <LogOut className={`h-4 w-4 ${isMinimized ? '' : 'shrink-0 group-hover:-translate-x-1 transition-transform'}`} />
             {!isMinimized && (
               <div className="text-left flex-1 min-w-0">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none mb-1 truncate">{user?.name}</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest leading-none opacity-60 truncate">{user?.role}</div>
               </div>
             )}
          </button>

          {!isMinimized && (
          <div className="mt-4 px-4 flex items-center justify-between opacity-50">
             <div className="flex items-center space-x-2">
                <Zap className="h-3 w-3 text-cyan-500" />
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">V2.4.0 Kernel</span>
             </div>
             <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">© 2026</span>
          </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
