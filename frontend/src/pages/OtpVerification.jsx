import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, AlertOctagon, Smartphone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const OtpVerification = ({ darkMode }) => {
  const [identifier, setIdentifier] = useState('+919876543210');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/send-otp', { identifier, purpose: 'phone_verify' });
      setMessage(res.message || 'OTP dispatched to target device.');
    } catch (err) {
      setError(err.message || 'Failed to dispatch OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/verify-otp', { identifier, otp_code: otpCode, purpose: 'phone_verify' });
      setMessage('Phone & Tourist identity verified successfully! Redirecting...');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
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
          <Link to="/" className={`p-2 rounded-xl border ${
            darkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold m-0 text-[#0D47A1]">OTP Verification</h1>
            <p className="text-xs text-slate-500 m-0">2FA Emergency Phone Verification</p>
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

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Phone Identifier</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:outline-none ${
                  darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-[#0D47A1]'
                }`}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 cursor-pointer disabled:opacity-50"
              >
                Send OTP
              </button>
            </div>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">6-Digit OTP Verification Code</label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="e.g. 123456"
                  maxLength={6}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm tracking-widest font-black focus:ring-2 focus:outline-none ${
                    darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-[#0D47A1]'
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Default test OTP: <strong>123456</strong></p>
            </div>

            <button
              type="submit"
              disabled={loading || !otpCode.trim()}
              className="w-full py-3 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs uppercase tracking-wider hover:bg-blue-800 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Verifying OTP...' : (
                <>
                  <span>Authenticate OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;
