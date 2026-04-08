import React, { useState } from 'react';
import { Mail, Lock, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("يرجى إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور");
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'بيانات الدخول غير صحيحة');
      }

      login(data.user, data.token);

      switch (data.user.role) {
        case 'admin':      navigate('/dashboard'); break;
        case 'data_entry': navigate('/events');    break;
        case 'auditor':    navigate('/reviews');   break;
        default:           navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden text-right" dir="rtl">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md p-8 md:p-10 bg-slate-900/60 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-5">
            <img src="/logo.png" alt="Digital Events" className="h-20 w-20 object-contain drop-shadow-2xl" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">مرحباً بك مجدداً</h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">سجل الدخول للمتابعة إلى لوحة التحكم</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl mb-6 text-sm font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400">البريد الإلكتروني أو رقم الهاتف</label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all font-sans"
                placeholder="admin@example.com أو 0911234567"
                dir="auto"
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400">كلمة المرور</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all font-sans"
                placeholder="••••••••"
                dir="auto"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full relative flex items-center justify-center p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm tracking-wide shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:hover:translate-y-0 overflow-hidden group mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>تسجيل الدخول</span>
            )}
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
