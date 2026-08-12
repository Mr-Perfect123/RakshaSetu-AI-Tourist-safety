import React, { useState } from 'react';
import { Shield, User, Mail, Lock, Phone, Globe, FileText, Camera, Upload, Heart, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, MapPin, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Register = ({ onLoginSuccess, darkMode }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    dob: '',
    gender: 'prefer_not_to_say',
    nationality: 'Indian',
    id_type: 'Passport',
    id_number: '',
    blood_group: 'Prefer not to disclose',
    medical_conditions: '',
    allergies: '',
    medical_requirements: '',
    emergency_notes: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: 'Family',
    emergency_contact_email: ''
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [idPreviewName, setIdPreviewName] = useState('');

  const [emailOtp, setEmailOtp] = useState('');
  const [smsOtp, setSmsOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [smsVerified, setSmsVerified] = useState(false);
  const [testOtps, setTestOtps] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleIdFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdFile(file);
      setIdPreviewName(file.name);
    }
  };

  // Step 1 - Step 5 Validation before registration submit
  const handleNextFromStep5 = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (!formData.emergency_contact_name || !formData.emergency_contact_phone) {
      setError('Primary emergency contact name and phone number are required.');
      return;
    }

    if (formData.emergency_contact_email && formData.emergency_contact_email.trim()) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(formData.emergency_contact_email.trim())) {
        setError('Please enter a valid email format for Emergency Contact Email (e.g. parent@example.com) or leave it blank.');
        return;
      }
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      if (photoFile) data.append('profile_image', photoFile);
      if (idFile) data.append('id_proof', idFile);

      const res = await api.post('/auth/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data) {
        setTestOtps({
          emailOtp: res.data.testEmailOtp,
          smsOtp: res.data.testSmsOtp
        });
        setSuccessMsg(`Registration data saved! OTPs sent to ${formData.email} and ${formData.phone}.`);
        setStep(6); // Move to OTP verification
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'This email is already registered. Please login or use another email.');
    } finally {
      setLoading(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-email-otp', {
        email: formData.email,
        otp_code: emailOtp
      });
      if (res.data && res.data.email_verified) {
        setEmailVerified(true);
        if (res.data.accessToken) {
          localStorage.setItem('rakshasetu_tourist_token', res.data.accessToken);
          localStorage.setItem('token', res.data.accessToken);
          localStorage.setItem('rakshasetu_token', res.data.accessToken);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid Email OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Verify SMS OTP
  const handleVerifySmsOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-phone-otp', {
        phone: formData.phone,
        otp_code: smsOtp
      });
      if (res.data && res.data.phone_verified) {
        setSmsVerified(true);
        if (res.data.accessToken) {
          localStorage.setItem('rakshasetu_tourist_token', res.data.accessToken);
          localStorage.setItem('token', res.data.accessToken);
          localStorage.setItem('rakshasetu_token', res.data.accessToken);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid SMS OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Finish Registration & Complete Location Consent Step
  const handleLocationConsent = async (allow) => {
    if (allow && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await api.post('/location/permission', { location_sharing_active: true });
            await api.post('/location/update', {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          } catch (e) {}
          navigate('/');
        },
        () => navigate('/')
      );
    } else {
      try {
        await api.post('/location/permission', { location_sharing_active: false });
      } catch (e) {}
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-primary uppercase tracking-wide">RAKSHASETU</h1>
          <p className="text-xs font-semibold text-slate-500">AI Powered Tourist Protection & Identity Verification System</p>
        </div>

        {/* Multi-step Progress Indicator */}
        <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 overflow-x-auto pb-2 border-b">
          {[
            { num: 1, label: 'Personal' },
            { num: 2, label: 'Photo' },
            { num: 3, label: 'Identity' },
            { num: 4, label: 'Health' },
            { num: 5, label: 'Emergency' },
            { num: 6, label: 'OTP' },
            { num: 7, label: 'Location' }
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-1 cursor-pointer transition-colors ${
                step === s.num
                  ? 'text-primary font-black border-b-2 border-primary pb-1'
                  : step > s.num
                  ? 'text-emerald-600 font-bold'
                  : 'text-slate-400'
              }`}
              onClick={() => s.num < step && setStep(s.num)}
            >
              <div
                className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  step === s.num
                    ? 'bg-primary text-white'
                    : step > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold text-center border border-red-200 flex items-center justify-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" /> {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center border border-emerald-200 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> {successMsg}
          </div>
        )}

        {/* STEP 1 - BASIC INFORMATION */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Step 1: Basic Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manik Sharma"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="manik@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Number (with Country Code) *</label>
                <input
                  type="text"
                  required
                  placeholder="+919876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Password *</label>
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
                <label className="font-bold text-slate-700 block mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nationality</label>
                <select
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                >
                  <option value="Indian">India 🇮🇳</option>
                  <option value="American">United States 🇺🇸</option>
                  <option value="British">United Kingdom 🇬🇧</option>
                  <option value="French">France 🇫🇷</option>
                  <option value="Japanese">Japan 🇯🇵</option>
                  <option value="German">Germany 🇩🇪</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                if (!formData.full_name || !formData.email || !formData.phone || !formData.password || !formData.dob) {
                  setError('Please fill in all mandatory fields.');
                } else if (formData.password !== formData.confirm_password) {
                  setError('Passwords do not match.');
                } else {
                  setError('');
                  setStep(2);
                }
              }}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold text-xs hover:bg-blue-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Continue to Step 2: Photo Upload <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2 - TOURIST PHOTO UPLOAD */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <h2 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" /> Step 2: Mandatory Tourist Photo
            </h2>
            <p className="text-slate-500">Upload your recent photograph for quick emergency identity identification.</p>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50 text-center">
              {photoPreview ? (
                <div className="space-y-3">
                  <img src={photoPreview} alt="Tourist Preview" className="w-32 h-32 rounded-full object-cover border-4 border-primary mx-auto shadow-md" />
                  <p className="font-bold text-emerald-700">Photo selected cleanly!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Camera className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700">Click to upload recent photo (JPG, JPEG, PNG)</p>
                  <p className="text-[10px] text-slate-400">Max size 10MB</p>
                </div>
              )}

              <input type="file" accept="image/*" onChange={handlePhotoChange} className="mt-4 text-xs font-semibold cursor-pointer" />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="w-1/2 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold flex items-center justify-center gap-1 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep(3)} className="w-1/2 py-3 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-1 cursor-pointer">
                Continue to Step 3: ID Proof <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 - IDENTITY VERIFICATION */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <h2 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Step 3: Government ID Proof
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ID Type *</label>
                <select
                  value={formData.id_type}
                  onChange={(e) => setFormData({ ...formData, id_type: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none font-semibold"
                >
                  <option value="Passport">Passport</option>
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="Driving Licence">Driving Licence</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Other Government ID">Other Government ID</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ID Document Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A9821034 / 8891-2310-9921"
                  value={formData.id_number}
                  onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Upload Government ID Document (PDF, JPG, PNG)</label>
              <input type="file" accept="image/*,application/pdf" onChange={handleIdFileChange} className="w-full p-2 rounded-xl border border-slate-200 cursor-pointer" />
              {idPreviewName && <p className="text-[11px] font-bold text-emerald-700 mt-1">Document attached: {idPreviewName}</p>}
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-700 shrink-0" /> Your ID proof is securely stored and used ONLY for tourist identification and emergency assistance.
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="w-1/2 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold flex items-center justify-center gap-1 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep(4)} className="w-1/2 py-3 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-1 cursor-pointer">
                Continue to Step 4: Health Info <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 - HEALTH INFORMATION */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <h2 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" /> Step 4: Medical & Emergency Health Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Blood Group</label>
                <select
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold focus:outline-none"
                >
                  <option value="Prefer not to disclose">Prefer not to disclose</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Medical Conditions (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Asthma, Diabetes, Hypertension"
                  value={formData.medical_conditions}
                  onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Known Allergies (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Penicillin, Peanuts, Bee stings"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Emergency Medical Notes</label>
              <textarea
                rows="2"
                placeholder="Special instructions for emergency medical responders..."
                value={formData.emergency_notes}
                onChange={(e) => setFormData({ ...formData, emergency_notes: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(3)} className="w-1/2 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold flex items-center justify-center gap-1 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep(5)} className="w-1/2 py-3 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-1 cursor-pointer">
                Continue to Step 5: Emergency Contact <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5 - EMERGENCY CONTACT & REGISTRATION SUBMISSION */}
        {step === 5 && (
          <form onSubmit={handleNextFromStep5} className="space-y-4 text-xs">
            <h2 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> Step 5: Mandatory Emergency Contact
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma (Father)"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Relationship *</label>
                <input
                  type="text"
                  required
                  placeholder="Parent / Spouse / Friend"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Emergency Mobile Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+919811223344"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Emergency Email (Optional)</label>
                <input
                  type="email"
                  placeholder="parent@example.com"
                  value={formData.emergency_contact_email}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setStep(4)} className="w-1/2 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold flex items-center justify-center gap-1 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button type="submit" disabled={loading} className="w-1/2 py-3 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-1 cursor-pointer">
                {loading ? 'Submitting...' : 'Register & Dispatch OTPs'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 6 - DUAL OTP VERIFICATION (EMAIL + SMS) */}
        {step === 6 && (
          <div className="space-y-4 text-xs">
            <h2 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Step 6: Dual OTP Security Verification
            </h2>
            <p className="text-slate-600">Please enter the 6-digit OTP codes sent to your registered Email and Mobile number.</p>

            {testOtps && (
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-[11px] font-mono font-bold">
                💡 Dev Test OTPs Dispatched: Email OTP: <span className="text-purple-700 underline">{testOtps.emailOtp}</span> | SMS OTP: <span className="text-purple-700 underline">{testOtps.smsOtp}</span>
              </div>
            )}

            {/* Email OTP Box */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Mail className="w-4 h-4 text-primary" /> Email OTP ({formData.email})
                </span>
                {emailVerified ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">✓ VERIFIED</span>
                ) : (
                  <span className="text-[10px] text-amber-600 font-bold">Pending</span>
                )}
              </div>
              {!emailVerified && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="Enter 6-digit Email OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-slate-300 font-mono text-center tracking-widest font-bold focus:outline-none"
                  />
                  <button onClick={handleVerifyEmailOtp} disabled={loading || !emailOtp} className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold cursor-pointer">
                    Verify Email
                  </button>
                </div>
              )}
            </div>

            {/* SMS OTP Box */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Phone className="w-4 h-4 text-primary" /> Mobile SMS OTP ({formData.phone})
                </span>
                {smsVerified ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">✓ VERIFIED</span>
                ) : (
                  <span className="text-[10px] text-amber-600 font-bold">Pending</span>
                )}
              </div>
              {!smsVerified && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="Enter 6-digit SMS OTP"
                    value={smsOtp}
                    onChange={(e) => setSmsOtp(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-slate-300 font-mono text-center tracking-widest font-bold focus:outline-none"
                  />
                  <button onClick={handleVerifySmsOtp} disabled={loading || !smsOtp} className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold cursor-pointer">
                    Verify SMS
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(7)}
              disabled={!emailVerified && !smsVerified}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer ${
                emailVerified || smsVerified ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              Proceed to Location Permission <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 7 - LOCATION PERMISSION CONSENT */}
        {step === 7 && (
          <div className="space-y-4 text-xs text-center">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-primary flex items-center justify-center mx-auto">
              <MapPin className="w-8 h-8 animate-bounce" />
            </div>
            <h2 className="text-base font-black text-slate-900">Share your live location with RakshaSetu for safety?</h2>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-left space-y-1.5 font-medium">
              <p className="font-bold text-slate-900 mb-1">Your location is used to provide:</p>
              <p>• Nearby safety alerts & crime advisories</p>
              <p>• High risk & danger zone warnings</p>
              <p>• 24/7 Police & Hospital emergency response</p>
              <p>• Safe route navigation</p>
              <p className="text-[10px] text-slate-400 mt-2 font-bold">Your location is NOT permanently stored without explicit consent.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => handleLocationConsent(false)} className="w-1/2 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer">
                NOT NOW
              </button>
              <button onClick={() => handleLocationConsent(true)} className="w-1/2 py-3 rounded-xl bg-primary text-white font-extrabold cursor-pointer shadow-lg hover:bg-blue-800">
                ALLOW LOCATION
              </button>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-slate-500 pt-2 border-t">
          Already have a tourist account?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
