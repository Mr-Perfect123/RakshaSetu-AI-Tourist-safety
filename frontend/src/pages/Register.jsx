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
  const [registeredUserObj, setRegisteredUserObj] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [step7Error, setStep7Error] = useState('');
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

  // Step 5 Submit Registration Form
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
        if (res.data.user) {
          setRegisteredUserObj(res.data.user);
        }
        setSuccessMsg(`Registration data saved! OTPs sent to ${formData.email} and ${formData.phone}.`);
        setStep(6); // Move to OTP verification
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'This email is already registered.');
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
        }
        if (res.data.user) {
          setRegisteredUserObj(res.data.user);
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
        }
        if (res.data.user) {
          setRegisteredUserObj(res.data.user);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid SMS OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 7 Location Permission Consent & Finalize Login
  const handleLocationConsent = async (allow) => {
    setStep7Error('');
    const userToSave = registeredUserObj || { full_name: formData.full_name, email: formData.email, phone: formData.phone };

    const completeAuth = (userObj) => {
      localStorage.setItem('rakshasetu_tourist_user', JSON.stringify(userObj));
      localStorage.setItem('rakshasetu_last_activity', String(Date.now()));
      if (onLoginSuccess) onLoginSuccess(userObj);
      navigate('/');
    };

    if (allow) {
      if (!navigator.geolocation) {
        completeAuth(userToSave);
        return;
      }
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await api.post('/location/permission', { location_sharing_active: true });
            await api.post('/location/update', {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
            localStorage.setItem('rakshasetu_location_granted', 'true');
            localStorage.setItem('rakshasetu_location_sharing_active', 'true');
          } catch (e) {
          } finally {
            setLoading(false);
            completeAuth(userToSave);
          }
        },
        (err) => {
          setLoading(false);
          localStorage.setItem('rakshasetu_location_granted', 'false');
          completeAuth(userToSave);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      localStorage.setItem('rakshasetu_location_granted', 'false');
      completeAuth(userToSave);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 z-10 text-slate-900 dark:text-white">
        
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0D47A1] text-white flex items-center justify-center font-bold shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-[#0D47A1] dark:text-blue-400 m-0">RAKSHASETU</h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 m-0">Tourist Registration & Verification</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#0D47A1] dark:text-blue-300 font-extrabold text-xs">
            Step {step} of 7
          </span>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: PERSONAL DETAILS */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase flex items-center gap-2 m-0">
              <User className="w-4 h-4 text-blue-600" /> Step 1: Personal Details
            </h2>

            <div>
              <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Karan Sharma"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="tourist@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">Mobile Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!formData.full_name || !formData.email || !formData.phone || !formData.password) {
                  setError('Please fill in all required fields.');
                  return;
                }
                setError('');
                setStep(2);
              }}
              className="w-full py-3.5 rounded-2xl bg-[#0D47A1] text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              Continue to Step 2: Photo Upload <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: PROFILE PHOTO */}
        {step === 2 && (
          <div className="space-y-4 text-xs text-center">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase flex items-center justify-center gap-2 m-0">
              <Camera className="w-4 h-4 text-blue-600" /> Step 2: Tourist Profile Photo
            </h2>

            <div className="w-28 h-28 rounded-full border-4 border-blue-500/30 bg-slate-100 dark:bg-slate-800 mx-auto overflow-hidden flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>

            <input type="file" accept="image/*" onChange={handlePhotoChange} className="block mx-auto text-xs text-slate-500 font-semibold" />

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="w-1/2 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
              </button>
              <button onClick={() => setStep(3)} className="w-1/2 py-3 rounded-2xl bg-[#0D47A1] text-white font-black">
                Continue to Step 3 <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: IDENTITY DOCUMENT */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase flex items-center gap-2 m-0">
              <FileText className="w-4 h-4 text-blue-600" /> Step 3: Identity Verification
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">ID Document Type</label>
                <select
                  value={formData.id_type}
                  onChange={(e) => setFormData({ ...formData, id_type: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                >
                  <option value="Passport">Passport</option>
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="Driving Licence">Driving Licence</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>

              <div>
                <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">Document Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A9821034"
                  value={formData.id_number}
                  onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} className="w-1/2 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
              </button>
              <button onClick={() => setStep(4)} className="w-1/2 py-3 rounded-2xl bg-[#0D47A1] text-white font-black">
                Continue to Step 4 <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: HEALTH INFO */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase flex items-center gap-2 m-0">
              <Heart className="w-4 h-4 text-rose-500" /> Step 4: Medical & Health Profile
            </h2>

            <div>
              <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">Blood Group</label>
              <select
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
              >
                <option value="Prefer not to disclose">Prefer not to disclose</option>
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="O+">O+</option>
                <option value="AB+">AB+</option>
              </select>
            </div>

            <div>
              <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">Emergency Medical Notes</label>
              <textarea
                rows={2}
                placeholder="Allergies or medical conditions..."
                value={formData.emergency_notes}
                onChange={(e) => setFormData({ ...formData, emergency_notes: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(3)} className="w-1/2 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
              </button>
              <button onClick={() => setStep(5)} className="w-1/2 py-3 rounded-2xl bg-[#0D47A1] text-white font-black">
                Continue to Step 5 <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: EMERGENCY CONTACT & SUBMIT */}
        {step === 5 && (
          <form onSubmit={handleNextFromStep5} className="space-y-4 text-xs">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase flex items-center gap-2 m-0">
              <Phone className="w-4 h-4 text-red-500" /> Step 5: Mandatory Emergency Contact
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">Emergency Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">Emergency Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 94433 22110"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(4)} className="w-1/2 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
              </button>
              <button type="submit" disabled={loading} className="w-1/2 py-3.5 rounded-2xl bg-[#0D47A1] text-white font-black">
                {loading ? 'Submitting...' : 'Register & Dispatch OTPs'} <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 6: DUAL OTP SECURITY VERIFICATION */}
        {step === 6 && (
          <div className="space-y-4 text-xs">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase flex items-center gap-2 m-0">
              <Shield className="w-4 h-4 text-blue-600" /> Step 6: Dual OTP Security Verification
            </h2>

            {testOtps && (
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-mono text-xs font-bold">
                💡 Dev Test OTPs: Email OTP: <span className="underline">{testOtps.emailOtp}</span> | SMS OTP: <span className="underline">{testOtps.smsOtp}</span>
              </div>
            )}

            {/* Email OTP Input Box */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-800 dark:text-slate-200">Email OTP ({formData.email})</span>
                {emailVerified ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-[10px]">✓ VERIFIED</span>
                ) : (
                  <span className="text-[10px] text-amber-500 font-bold">Pending</span>
                )}
              </div>
              {!emailVerified && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="6-digit Email OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center font-bold outline-none"
                  />
                  <button onClick={handleVerifyEmailOtp} disabled={loading || !emailOtp} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold cursor-pointer">
                    Verify
                  </button>
                </div>
              )}
            </div>

            {/* SMS OTP Input Box */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-800 dark:text-slate-200">SMS OTP ({formData.phone})</span>
                {smsVerified ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-[10px]">✓ VERIFIED</span>
                ) : (
                  <span className="text-[10px] text-amber-500 font-bold">Pending</span>
                )}
              </div>
              {!smsVerified && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="6-digit SMS OTP"
                    value={smsOtp}
                    onChange={(e) => setSmsOtp(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center font-bold outline-none"
                  />
                  <button onClick={handleVerifySmsOtp} disabled={loading || !smsOtp} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold cursor-pointer">
                    Verify
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(7)}
              disabled={!emailVerified || !smsVerified}
              className={`w-full py-3.5 rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer ${
                emailVerified && smsVerified
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              Proceed to Step 7: Location Permission <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        )}

        {/* STEP 7: LOCATION PERMISSION CONSENT */}
        {step === 7 && (
          <div className="space-y-4 text-xs text-center">
            <div className="w-14 h-14 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <MapPin className="w-8 h-8 animate-bounce" />
            </div>

            <h2 className="text-base font-black text-slate-900 dark:text-white m-0">
              Share live GPS location with RakshaSetu for safety?
            </h2>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-left space-y-1 font-medium">
              <p className="font-bold text-slate-900 dark:text-white m-0 mb-1">Your location is used for:</p>
              <p className="m-0">• Nearby safety alerts & crime heatmaps</p>
              <p className="m-0">• 24/7 Emergency SOS & police dispatch</p>
              <p className="m-0">• Safe route navigation and nearby services</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleLocationConsent(false)}
                disabled={loading}
                className="w-1/2 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
              >
                Not Now
              </button>

              <button
                onClick={() => handleLocationConsent(true)}
                disabled={loading}
                className="w-1/2 py-3.5 rounded-2xl bg-[#0D47A1] text-white font-black shadow-md"
              >
                {loading ? 'Requesting GPS...' : 'ALLOW LOCATION'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Register;
