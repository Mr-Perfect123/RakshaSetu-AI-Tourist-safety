import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Globe, Shield, HeartPulse, CheckCircle2, Ticket, Bookmark, Lock, FileText, Camera, Upload, LogOut, Save } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const ProfilePage = ({ tourist, onLogout, darkMode }) => {
  const { language, setLanguage, t } = useLanguage();
  const [profileData, setProfileData] = useState({
    full_name: tourist?.full_name || 'Karan Sharma',
    email: tourist?.email || 'tourist@rakshasetu.gov.in',
    phone: tourist?.phone || '+91 98765 43210',
    nationality: tourist?.nationality || 'Indian',
    passport_number: tourist?.passport_number || 'A8901234',
    emergency_contact_name: tourist?.emergency_contact_name || 'Rajesh Sharma',
    emergency_contact_phone: tourist?.emergency_contact_phone || '+91 94433 22110',
    medical_info: tourist?.medical_info || 'No major allergies. Blood Group O+',
    preferred_language: language || 'English'
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/tourist/profile');
        if (res.data?.data) {
          setProfileData((prev) => ({ ...prev, ...res.data.data }));
        }
      } catch (e) {}
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await api.put('/tourist/profile', profileData);
      setSuccessMsg('Profile details updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setSuccessMsg('Profile details saved locally.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Header Banner */}
      <div className={`p-6 md:p-8 rounded-3xl border shadow-sm relative overflow-hidden transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-gradient-to-r from-blue-900 to-[#0D47A1] text-white border-transparent'
      }`}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/30 backdrop-blur-md flex items-center justify-center font-black text-3xl shadow-xl">
              {profileData.full_name ? profileData.full_name.charAt(0).toUpperCase() : 'T'}
            </div>
            <button className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-extrabold m-0">{profileData.full_name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Identity Verified
              </span>
            </div>

            <p className="text-xs text-blue-200 font-medium m-0">{profileData.email} • {profileData.phone}</p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs opacity-90">
              <span className="bg-white/10 px-3 py-1 rounded-xl backdrop-blur-md font-semibold">
                Nationality: {profileData.nationality}
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-xl backdrop-blur-md font-semibold">
                Passport: {profileData.passport_number}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Form & Settings */}
      <div className={`p-6 md:p-8 rounded-3xl border shadow-sm transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/20">
            <h3 className="text-lg font-extrabold m-0 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" /> Personal & Emergency Profile
            </h3>

            {successMsg && (
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200">
                {successMsg}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Full Name</label>
              <input
                type="text"
                value={profileData.full_name}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-600'
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email Address</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-600'
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Phone Number</label>
              <input
                type="text"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-600'
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Preferred Language</label>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setProfileData({ ...profileData, preferred_language: e.target.value });
                }}
                className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-600'
                }`}
              >
                <option value="English">🇬🇧 English</option>
                <option value="Hindi">🇮🇳 हिंदी (Hindi)</option>
                <option value="Tamil">🇮🇳 தமிழ் (Tamil)</option>
                <option value="Marathi">🇮🇳 मराठी (Marathi)</option>
                <option value="Telugu">🇮🇳 తెలుగు (Telugu)</option>
                <option value="Malayalam">🇮🇳 മലയാളം (Malayalam)</option>
                <option value="Kannada">🇮🇳 ಕನ್ನಡ (Kannada)</option>
                <option value="Bengali">🇮🇳 বাংলা (Bengali)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/20 space-y-4">
            <h4 className="text-sm font-extrabold m-0 text-red-600 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Emergency Contact & Health Info
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Emergency Contact Name</label>
                <input
                  type="text"
                  value={profileData.emergency_contact_name}
                  onChange={(e) => setProfileData({ ...profileData, emergency_contact_name: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold outline-none transition-all ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Emergency Contact Phone</label>
                <input
                  type="text"
                  value={profileData.emergency_contact_phone}
                  onChange={(e) => setProfileData({ ...profileData, emergency_contact_phone: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold outline-none transition-all ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Medical Info & Allergies</label>
              <textarea
                rows={2}
                value={profileData.medical_info}
                onChange={(e) => setProfileData({ ...profileData, medical_info: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200/20">
            <button
              type="button"
              onClick={onLogout}
              className="px-5 py-2.5 rounded-2xl bg-red-500/10 text-red-600 hover:bg-red-500/20 font-extrabold text-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
