import React, { useState } from 'react';
import { Shield, Lock, Mail, UserCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [role, setRole] = useState('Admin');
  const [email, setEmail] = useState('admin@rakshasetu.gov.in');
  const [password, setPassword] = useState('Password@123');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const rolePresets = {
    Admin: { email: 'admin@rakshasetu.gov.in', password: 'Password@123', label: 'Admin Command' },
    Police: { email: 'police@rakshasetu.gov.in', password: 'Password@123', label: 'Police Dispatch' },
    Hospital: { email: 'hospital@rakshasetu.gov.in', password: 'Password@123', label: 'Hospital Emergency' },
    Tourist: { email: 'john.tourist@example.com', password: 'Password@123', label: 'Tourist Portal' }
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setEmail(rolePresets[selectedRole].email);
    setPassword(rolePresets[selectedRole].password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl p-8 space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-[#0D47A1] text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-900/40">
            <Shield className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-[#0D47A1] tracking-tight uppercase">RAKSHASETU</h1>
          <p className="text-xs text-slate-600 font-semibold">AI Powered Tourist Protection & Emergency Response System</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl">
          {Object.keys(rolePresets).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleSelect(r)}
              className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                role === r
                  ? 'bg-[#0D47A1] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold text-center border border-red-200 flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Email Identifier</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-slate-50 text-xs font-semibold focus:ring-2 focus:ring-[#0D47A1] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Password Credential</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-slate-50 text-xs font-semibold focus:ring-2 focus:ring-[#0D47A1] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs uppercase tracking-wider hover:bg-blue-800 active:bg-blue-900 transition-all shadow-md shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating Credentials...</span>
            ) : (
              <>
                <span>Access Command System</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            Demo Credentials Loaded for <strong className="text-slate-800 font-bold">{rolePresets[role].label}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
