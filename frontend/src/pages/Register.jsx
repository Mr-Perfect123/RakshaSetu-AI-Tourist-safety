import React, { useState } from 'react';
import { Shield, User, Mail, Lock, Phone, Globe, FileText, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Register = ({ onLoginSuccess, darkMode }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    nationality: 'American',
    passport_number: '',
    gender: 'male',
    blood_group: 'O+',
    hotel_address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', formData);
      if (res.data && res.data.user) {
        localStorage.setItem('rakshasetu_tourist_user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-primary">Tourist Safety Registration</h1>
          <p className="text-xs text-slate-500">Register your travel details for 24/7 protection</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-danger/10 text-danger text-xs font-semibold text-center border border-danger/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="sarah@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number (With Country Code)</label>
              <input
                type="text"
                required
                placeholder="+14155550199"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Nationality</label>
              <select
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
              >
                <option value="American">United States 🇺🇸</option>
                <option value="British">United Kingdom 🇬🇧</option>
                <option value="French">France 🇫🇷</option>
                <option value="Japanese">Japan 🇯🇵</option>
                <option value="German">Germany 🇩🇪</option>
                <option value="Indian">India 🇮🇳</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Passport Number</label>
              <input
                type="text"
                required
                placeholder="US-98421034"
                value={formData.passport_number}
                onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Hotel / Residence Address in India</label>
            <textarea
              rows="2"
              placeholder="e.g. Grand Heritage Hotel, Connaught Place, New Delhi"
              value={formData.hotel_address}
              onChange={(e) => setFormData({ ...formData, hotel_address: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:outline-none"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading ? 'Creating Profile...' : 'Complete Tourist Registration'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
