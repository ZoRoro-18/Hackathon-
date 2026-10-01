import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, ArrowRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('demo@khaata.ai');
    setPassword('demo123');
    // We delay the submission slightly so the user sees the fields populate
    setTimeout(() => {
      document.getElementById('login-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-teal-500 rounded-xl shadow-lg shadow-teal-500/20"></div>
            <h2 className="text-3xl font-bold text-white tracking-tight">KhaataAI</h2>
          </div>
          
          <h3 className="text-xl font-semibold text-slate-100 mb-2">Log in to your account</h3>
          <p className="text-slate-400 text-sm mb-8">Welcome back! Please enter your details.</p>

          <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all outline-none"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6 shadow-lg shadow-teal-500/20 disabled:opacity-70"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign in'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">or</span>
              </div>
            </div>

            <button
              onClick={handleDemoLogin}
              type="button"
              className="mt-6 w-full bg-slate-900 hover:bg-slate-700 border border-slate-600 text-slate-200 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Zap size={18} className="text-amber-400" />
              Try Demo Account
            </button>
          </div>
        </div>
        
        <div className="bg-slate-900/50 border-t border-slate-700 p-4 text-center">
          <p className="text-slate-400 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
