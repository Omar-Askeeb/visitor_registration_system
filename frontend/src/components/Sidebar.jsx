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
  Target,
  X,
  CalendarRange,
  ChevronLeft,
  LogOut,
  FileText,
  FileImage,
  ShieldCheck,
  Printer,
  Building2,
  User,
  Download
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
    { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard', color: 'cyan',    perm: 'view_dashboard' },
    { 
      icon: CalendarRange,   
      label: 'Events',       
      path: '/events',    
      color: 'violet', 
      perm: 'view_events',
      subItems: [
        { icon: PlusCircle,      label: 'Registration',  path: '/registration', color: 'emerald', perm: 'register_visitors' },
        { icon: FileText,        label: 'Media Registration', path: '/media-registration', color: 'indigo', perm: 'register_media' },
        { icon: Building2,       label: 'Exhibitors',    path: '/exhibitors',  color: 'indigo', perm: 'manage_users' },
        { icon: ClipboardCheck,  label: 'Review Queue',   path: '/reviews',   color: 'amber', perm: 'review_queue' },
        { icon: ShieldCheck,     label: 'Audit Correction', path: '/audit-correction', color: 'cyan', perm: 'audit_records' },
        { icon: Printer,         label: 'Pre-Print Badges', path: '/pre-print', color: 'indigo',  perm: 'print_badges' },
        { icon: FileImage,       label: 'Pre-Print Forms', path: '/pre-print-forms', color: 'pink',  perm: 'print_badges' },
      ]
    },
    { icon: Users,           label: 'Personnel',     path: '/users',     color: 'blue',   perm: 'manage_users' },
    { icon: Target,          label: 'Training Results', path: '/training-results', color: 'pink', perm: 'audit_records' },
    { icon: RefreshCcw,      label: 'Sync Records',  path: '/sync',      color: 'amber',   perm: 'sync_records' },
    { icon: Download,        label: 'Data Export',   path: '/export',    color: 'emerald', perm: 'manage_settings' },
    { icon: ShieldCheck,     label: 'Activity Logs', path: '/logs',      color: 'violet', perm: 'view_logs' },
    { icon: ShieldCheck,     label: 'Roles',         path: '/roles',       color: 'purple', perm: 'manage_users' },
    { icon: User,            label: 'My Profile',    path: '/profile',     color: 'purple' },
    { icon: Settings,        label: 'Settings',      path: '/settings',  color: 'slate',  perm: 'manage_settings' },
  ].filter(item => {
    if (user.role?.name === 'admin') return true;
    if (!item.perm) return true;
    const hasPerm = user.role?.permissions?.some(p => p.name === item.perm);
    if (item.subItems) {
      item.subItems = item.subItems.filter(sub => {
        if (!sub.perm) return true;
        return user.role?.permissions?.some(p => p.name === sub.perm);
      });
      return item.subItems.length > 0 || hasPerm;
    }
    return hasPerm;
  });

  const [openMenus, setOpenMenus] = useState(['Events']);

  const toggleMenu = (label) => {
    setOpenMenus(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

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
        <nav className="flex-1 px-4 space-y-2 mt-4 relative overflow-y-auto overflow-x-hidden pb-10 custom-scrollbar">
          {!isMinimized && <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-4 px-4">Main Control Panel</div>}
          {menuItems.map((item, index) => {
            const hasSub = item.subItems && item.subItems.length > 0;
            const isSubOpen = openMenus.includes(item.label);
            const isAnySubActive = hasSub && item.subItems.some(sub => location.pathname === sub.path);
            const active = location.pathname === item.path || isAnySubActive;
            
            return (
              <div key={index} className="space-y-1">
                {hasSub ? (
                  <div className="relative group/parent">
                    <Link
                      to={item.path}
                      title={isMinimized ? item.label : undefined}
                      onClick={() => { if(window.innerWidth < 1024 && !hasSub) onClose(); }}
                      className={`flex items-center ${isMinimized ? 'justify-center p-3' : 'justify-between p-3.5'} rounded-2xl transition-all duration-300 relative ${
                        active 
                          ? `bg-${item.color}-500/10 text-${item.color}-600 dark:text-white border border-${item.color}-500/20 shadow-sm` 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      <div className={`flex items-center ${isMinimized ? 'justify-center' : 'space-x-4'}`}>
                        <item.icon className={`h-5 w-5 ${active ? `text-${item.color}-500` : 'text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400'} transition-colors duration-300`} />
                        {!isMinimized && <span className={`font-black text-xs uppercase tracking-widest ${active ? 'text-slate-900 dark:text-white' : 'group-hover:text-slate-900 dark:group-hover:text-white'}`}>{item.label}</span>}
                      </div>
                      
                      {/* Spacer for toggle */}
                      {!isMinimized && <div className="w-8" />}
                    </Link>

                    {/* Separate Toggle Button */}
                    {!isMinimized && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleMenu(item.label);
                        }}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${isSubOpen ? 'text-cyan-500' : 'text-slate-400'}`}
                      >
                        <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${isSubOpen ? '-rotate-90' : ''}`} />
                      </button>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    title={isMinimized ? item.label : undefined}
                    onClick={() => { if(window.innerWidth < 1024) onClose(); }}
                    className={`flex items-center ${isMinimized ? 'justify-center p-3' : 'justify-between p-3.5'} rounded-2xl transition-all duration-300 group relative ${
                      active 
                        ? `bg-${item.color}-500/10 text-${item.color}-600 dark:text-white border border-${item.color}-500/20 shadow-sm` 
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
                  </Link>
                )}

                {/* Submenu Items */}
                {hasSub && isSubOpen && !isMinimized && (
                  <div className="ml-6 pl-4 border-l border-slate-200 dark:border-slate-800 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-300">
                    {item.subItems.map((sub, subIdx) => {
                      const subActive = location.pathname === sub.path;
                      return (
                        <Link
                          key={subIdx}
                          to={sub.path}
                          onClick={() => { if(window.innerWidth < 1024) onClose(); }}
                          className={`flex items-center space-x-3 p-2.5 rounded-xl transition-all duration-200 ${
                            subActive 
                              ? 'text-cyan-500 font-bold bg-cyan-500/5' 
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/30'
                          }`}
                        >
                          <sub.icon className={`h-4 w-4 ${subActive ? 'text-cyan-500' : 'text-slate-400 dark:text-slate-600'}`} />
                          <span className="text-[10px] uppercase font-black tracking-widest">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
          <div className={`mt-3 w-full flex items-center ${isMinimized ? 'flex-col space-y-2' : 'space-x-2'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm`}>
             <button 
                onClick={() => navigate('/profile')}
                title="Account Settings"
                className={`flex items-center flex-1 min-w-0 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isMinimized ? 'justify-center w-full' : 'space-x-3 text-left'}`}
             >
                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                   <User className="h-4 w-4" />
                </div>
                {!isMinimized && (
                   <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none mb-1 truncate">{user?.name}</div>
                      <div className="text-[9px] font-bold uppercase tracking-widest leading-none opacity-60 truncate text-slate-500">{user?.role?.display_name}</div>
                   </div>
                )}
             </button>
             <button 
                onClick={logout}
                title="Logout"
                className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shrink-0"
             >
                <LogOut className="h-4 w-4" />
             </button>
          </div>

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
