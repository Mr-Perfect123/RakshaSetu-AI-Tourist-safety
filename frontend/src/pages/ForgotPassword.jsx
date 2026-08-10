import React, { useState } from 'react';
import { Mail, ArrowRight, ShieldCheck, ArrowLeft, CheckCircle2, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = ({ darkMode }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.message || 'If registered, password reset instructions have been dispatched.');
    } catch (err) {
      setError(err.message || 'Failed to dispatch reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className={`w-full max-w-md p-8 rounded-3xl border shadow-xl space-y-6 ${
        darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3">
          <Link to="/login" className={`p-2 rounded-xl border ${
            darkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold m-0 text-[#0D47A1]">Account Recovery</h1>
            <p className="text-xs text-slate-500 m-0">Reset your RakshaSetu Tourist Credentials</p>
          </div>
        </div>

        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Registered Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:outline-none ${
                  darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-[#0D47A1]'
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs uppercase tracking-wider hover:bg-blue-800 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Sending Recovery Link...' : (
              <>
                <span>Dispatch Recovery Instructions</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 text-center">
          <Link to="/reset-password" className="text-xs font-bold text-[#0D47A1] hover:underline">
            Already have a Reset Token? Reset Password here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
