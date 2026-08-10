import React, { useState } from 'react';
import { Shield, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = ({ onLoginSuccess, darkMode }) => {
  const [email, setEmail] = useState('john.tourist@example.com');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.accessToken) {
        localStorage.setItem('rakshasetu_tourist_token', res.data.accessToken);
        localStorage.setItem('rakshasetu_tourist_user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-br from-[#0D47A1] to-[#1565C0] text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-900/20">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0D47A1] tracking-tight">RAKSHASETU</h1>
          <p className="text-xs text-slate-500 font-medium">Tourist Safety & Emergency Response Portal</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-danger/10 text-danger text-xs font-semibold text-center border border-danger/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#0D47A1] text-white font-bold text-xs hover:bg-[#1565C0] transition-all shadow-md shadow-blue-900/20 flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Safety Portal'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          New Tourist to India?{' '}
          <Link to="/register" className="font-bold text-primary hover:underline">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
