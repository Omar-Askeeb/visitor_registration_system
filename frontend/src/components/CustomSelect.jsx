import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomSelect = ({ label, value, options, onChange, required, placeholder = 'Select...', loading = false, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  const optionsRef = useRef(null);
  const [searchString, setSearchString] = useState('');
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // Scroll to selected option when it changes
  useEffect(() => {
    if (isOpen && value && optionsRef.current) {
      const selectedEl = optionsRef.current.querySelector(`[data-value="${value}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [value, isOpen]);

  const handleKeyDown = (e) => {
    if (loading) return;

    if (e.key === ' ' && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        // Simple next item logic
        const currentIndex = options.findIndex(opt => opt.value === value);
        const nextIndex = (currentIndex + 1) % options.length;
        onChange(options[nextIndex].value);
      }
    }

    if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex(opt => opt.value === value);
      const prevIndex = (currentIndex - 1 + options.length) % options.length;
      onChange(options[prevIndex].value);
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const char = e.key.toLowerCase();
      const newSearchString = searchString + char;
      setSearchString(newSearchString);

      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => setSearchString(''), 1000);

      const found = options.find(opt => 
        String(opt.label).toLowerCase().startsWith(newSearchString)
      );

      if (found) {
        onChange(found.value);
      }
    }
  };

  return (
    <div className="flex flex-col space-y-2" ref={containerRef}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {label} {required && '*'}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={loading}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={`w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 border ${
            isOpen 
              ? 'border-cyan-500 ring-4 ring-cyan-500/10' 
              : 'border-slate-200 dark:border-slate-700/60'
          } rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white transition-all duration-300 shadow-sm disabled:opacity-50`}
        >
          <div className="flex items-center space-x-3">
            {Icon && <Icon className={`h-4 w-4 ${isOpen ? 'text-cyan-500' : 'text-slate-400'}`} />}
            <span className={!selectedOption ? 'text-slate-400 dark:text-slate-600' : 'font-semibold'}>
              {loading ? 'Loading...' : (selectedOption ? selectedOption.label : placeholder)}
            </span>
          </div>
          {loading ? (
            <div className="h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-500 ${isOpen ? 'rotate-180 text-cyan-500' : ''}`} />
          )}
        </button>

        {isOpen && (
          <div 
            ref={optionsRef}
            className="absolute z-[100] mt-2 w-full bg-white/90 dark:bg-[#0c1325]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-300 max-h-60 overflow-y-auto"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                data-value={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-all duration-200 group flex items-center justify-between ${
                  value === opt.value
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{opt.label}</span>
                {value === opt.value && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomSelect;
