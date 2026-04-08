import React from 'react';
import { ArrowUpRight, TrendingUp, Sparkles, Activity } from 'lucide-react';

const StatsCard = ({ label, title, value, count, total, icon: Icon, color, trend }) => {
  // Support both old and new prop names
  const displayTitle = label || title || 'Stat';
  const displayCount = value !== undefined ? value : (count !== undefined ? count : 0);
  const displayTotal = total || 100;
  const percentage   = total ? Math.round((Number(displayCount) / Number(displayTotal)) * 100) : 0;
  
  // Support both short color names and full gradient strings
  const isGradient = color?.includes('from-');
  
  const colorMap = {
    blue: 'from-blue-600 via-blue-500 to-cyan-500',
    emerald: 'from-emerald-600 via-emerald-500 to-teal-500',
    purple: 'from-purple-600 via-purple-500 to-indigo-500',
    cyan: 'from-cyan-600 via-cyan-500 to-blue-500',
  };

  const textMap = {
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    purple: 'text-purple-600 dark:text-purple-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
  };

  const bgMap = {
    blue: 'bg-blue-500/10 border-blue-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20',
    purple: 'bg-purple-500/10 border-purple-500/20',
    cyan: 'bg-cyan-500/10 border-cyan-500/20',
  };

  const activeColor = isGradient ? 'blue' : (color || 'blue');
  const activeGradient = isGradient ? color : (colorMap[activeColor] || colorMap.blue);

  return (
    <div className="bg-slate-50 dark:bg-slate-900/40 backdrop-blur-3xl border border-slate-200 dark:border-slate-800/50 p-6 rounded-[32px] shadow-lg dark:shadow-2xl relative group hover:-translate-y-2 transition-all duration-500 overflow-hidden">
      
      {/* Dynamic Background Glow */}
      <div className={`absolute -right-12 -top-12 h-32 w-32 bg-blue-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
      
      <div className="flex items-start justify-between relative mb-6">
        <div className={`p-3 rounded-2xl ${bgMap[activeColor] || bgMap.blue} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
          {Icon && <Icon className={`h-6 w-6 ${textMap[activeColor] || textMap.blue} drop-shadow-lg`} />}
        </div>
        {trend && (
          <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/10 shadow-lg">
            <TrendingUp className="h-3 w-3" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      
      <div className="relative mb-4">
        <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{displayTitle}</h3>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums drop-shadow-md">
            {displayCount.toLocaleString()}
          </span>
          {total && (
            <span className="text-slate-400 dark:text-slate-600 text-xs font-bold opacity-50 italic">/ {total.toLocaleString()}</span>
          )}
        </div>
      </div>

      {total && (
        <div className="relative pt-2">
          <div className="flex items-center justify-between text-[10px] mb-2">
            <div className="flex items-center space-x-2">
              <Activity className="h-3 w-3 text-slate-400 dark:text-slate-500" />
               <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Growth</span>
            </div>
            <span className={`${textMap[activeColor] || textMap.blue} font-black tracking-widest`}>{percentage}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800/50 rounded-full overflow-hidden p-[1px] border border-slate-300 dark:border-slate-700/30">
            <div 
              className={`h-full bg-gradient-to-r ${activeGradient} rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Decorative Corner Icon */}
      <div className="absolute bottom-2 right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
        <Sparkles className="h-12 w-12 text-white" />
      </div>
    </div>
  );
};

export default StatsCard;
