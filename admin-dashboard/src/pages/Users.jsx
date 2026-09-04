import React, { useEffect, useState } from 'react';
import {
  Users, Search, UserCheck, ShieldAlert, Globe, MapPin, Phone, Mail,
  Heart, FileText, AlertTriangle, RefreshCw, Eye, X, Shield, CheckCircle2,
  XCircle, Send, ExternalLink, Calendar, Stethoscope, AlertCircle, Sparkles
} from 'lucide-react';
import api from '../services/api';

const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string' || url.trim() === '' || url === 'pending_upload') return null;
  const clean = url.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('blob:') || clean.startsWith('data:')) {
    return clean;
  }
  const normalized = clean.startsWith('/') ? clean : `/${clean}`;
  return normalized;
};

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedNationality, setSelectedNationality] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchTourists = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/tourists');
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setUsers(list);
    } catch (err) {
      try {
        const fallback = await api.get('/admin/users?role=Tourist');
        const fallbackList = Array.isArray(fallback) ? fallback : (Array.isArray(fallback?.data) ? fallback.data : []);
        setUsers(fallbackList);
      } catch (e) {
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTourists();
  }, []);

  const handleApproveId = async (userId) => {
    try {
      await api.post(`/admin/tourists/${userId}/approve-id`);
      setActionMsg(`Tourist ID #${userId} APPROVED!`);
      fetchTourists();
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, id_verification_status: 'approved' });
      }
    } catch (err) {
      setActionMsg('Failed to approve ID.');
    }
  };

  const handleRejectId = async (userId) => {
    try {
      await api.post(`/admin/tourists/${userId}/reject-id`, { rejection_reason: 'Document illegible or incomplete.' });
      setActionMsg(`Tourist ID #${userId} REJECTED.`);
      fetchTourists();
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, id_verification_status: 'rejected' });
      }
    } catch (err) {
      setActionMsg('Failed to reject ID.');
    }
  };

  const handleRequestLiveLocation = async (userId) => {
    try {
      await api.post(`/admin/tourists/${userId}/location-request`, {
        message: 'RakshaSetu Admin is requesting your live location for safety monitoring.'
      });
      setActionMsg(`Live Location request sent to Tourist #${userId}.`);
    } catch (err) {
      setActionMsg('Failed to send location request.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (u.full_name && u.full_name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.phone && u.phone.includes(term)) ||
      (u.id_number && u.id_number.toLowerCase().includes(term)) ||
      (u.passport_number && u.passport_number.toLowerCase().includes(term)) ||
      String(u.id).includes(term);

    const matchesNat = selectedNationality === 'All' || u.nationality === selectedNationality;
    return matchesSearch && matchesNat;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar — Royal Ocean Gradient Banner */}
      <div className="bg-gradient-to-r from-[#0a2540] via-[#0D47A1] to-[#1e3a8a] text-white p-6 rounded-3xl shadow-xl border border-blue-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5 m-0">
            <Users className="w-6 h-6 text-blue-300" /> Tourist User Security Roster
          </h1>
          <p className="text-xs font-semibold text-blue-100 m-0 mt-1">
            Real-time database roster of registered tourists, identity verification & location consent monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTourists}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-white text-blue-900 font-black text-xs shadow-md hover:bg-blue-50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Roster
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-900 text-xs font-bold border border-blue-200 flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg('')} className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white/85 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Monitored Tourists</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">{users.length}</h3>
          <span className="text-[10px] text-emerald-600 font-semibold">Active Database Records</span>
        </div>
        <div className="bg-white/85 backdrop-blur-md p-4 rounded-2xl border border-red-100 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">In Emergency State</p>
          <h3 className="text-2xl font-black text-red-600 mt-1">
            {users.filter((u) => u.status === 'in_emergency').length}
          </h3>
          <span className="text-[10px] text-red-600 font-semibold">Immediate Priority</span>
        </div>
        <div className="bg-white/85 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">ID Verification Pending</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">
            {users.filter((u) => u.id_verification_status === 'pending' || !u.id_verification_status).length}
          </h3>
          <span className="text-[10px] text-amber-600 font-semibold">Review Required</span>
        </div>
        <div className="bg-white/85 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Location Sharing Enabled</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">
            {users.filter((u) => Boolean(u.location_sharing_active)).length}
          </h3>
          <span className="text-[10px] text-emerald-600 font-semibold font-mono">Consent Granted</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white/85 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search name, phone, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500">Filter Country:</span>
          <select
            value={selectedNationality}
            onChange={(e) => setSelectedNationality(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none"
          >
            <option value="All">All Countries</option>
            <option value="Indian">India 🇮🇳</option>
            <option value="American">United States 🇺🇸</option>
            <option value="French">France 🇫🇷</option>
            <option value="Japanese">Japan 🇯🇵</option>
            <option value="British">United Kingdom 🇬🇧</option>
            <option value="German">Germany 🇩🇪</option>
          </select>
        </div>
      </div>

      {/* Tourists Table */}
      <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Tourist Photo & Name</th>
                <th className="p-4">Verification Status</th>
                <th className="p-4">ID Proof Review</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Location Permission</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Loading registered tourists...</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-600 m-0">No tourist records found</p>
                        <p className="text-[11px] text-slate-400 m-0">New tourist registrations will appear here in real time.</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const photoSrc = resolveMediaUrl(u.profile_image_path || u.profile_image);
                  const idProofSrc = resolveMediaUrl(u.id_proof_url);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {photoSrc ? (
                            <img
                              src={photoSrc}
                              alt={u.full_name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                              }}
                              className="w-11 h-11 rounded-full object-cover border-2 border-blue-600 shadow-xs cursor-pointer"
                              onClick={() => setSelectedUser(u)}
                            />
                          ) : null}
                          <div
                            style={{ display: photoSrc ? 'none' : 'flex' }}
                            className="w-11 h-11 rounded-full bg-blue-100 text-blue-900 border-2 border-blue-300 flex items-center justify-center font-black text-sm shrink-0"
                          >
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'T'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 m-0 text-sm flex items-center gap-1.5">
                              {u.full_name || 'Tourist'}
                              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                RS-TST-{u.id}
                              </span>
                            </p>
                            <p className="text-[10px] text-slate-400 capitalize m-0 mt-0.5">
                              {u.nationality || 'Indian'} • {u.gender || 'Tourist'}{u.dob ? ` • DOB: ${u.dob}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="flex flex-col gap-1 text-[10px]">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-extrabold w-fit ${u.email_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            {u.email_verified ? '✓ Email Verified' : '✕ Email Pending'}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-extrabold w-fit ${u.phone_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            {u.phone_verified ? '✓ Phone Verified' : '✕ Phone Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase ${
                              u.id_verification_status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : u.id_verification_status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}>
                              {u.id_verification_status ? u.id_verification_status.toUpperCase() : 'PENDING'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600">
                              {u.id_type || 'Passport'}: {u.id_number || u.passport_number || 'Not Provided'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {idProofSrc && (
                              <button
                                type="button"
                                onClick={() => setPreviewDocUrl(idProofSrc)}
                                className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[10px] cursor-pointer flex items-center gap-1">
                                <FileText className="w-3 h-3 text-blue-600" /> View Document
                              </button>
                            )}
                            {u.id_verification_status !== 'approved' && (
                              <button
                                onClick={() => handleApproveId(u.id)}
                                className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                            {u.id_verification_status !== 'rejected' && (
                              <button
                                onClick={() => handleRejectId(u.id)}
                                className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 cursor-pointer"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-800 m-0 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-blue-600" /> {u.phone || 'N/A'}
                        </p>
                        <p className="text-[10px] text-slate-500 m-0 mt-0.5 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {u.email || 'N/A'}
                        </p>
                        {u.blood_group && u.blood_group !== 'Prefer not to disclose' && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px]">
                            🩸 {u.blood_group}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          u.status === 'in_emergency'
                            ? 'bg-red-500 text-white font-black animate-pulse'
                            : u.location_sharing_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {u.status === 'in_emergency' ? '🚨 SOS Override' : u.location_sharing_active ? '📍 Sharing: ON' : '🔒 Sharing: OFF'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleRequestLiveLocation(u.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Request GPS
                        </button>
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-900 hover:text-white font-bold text-[11px] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Full Record
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document File Preview Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900 m-0 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Government ID Proof Document Preview
              </h3>
              <button
                onClick={() => setPreviewDocUrl(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-slate-100 max-h-[60vh] flex items-center justify-center p-2 border">
              {previewDocUrl.endsWith('.pdf') ? (
                <iframe src={previewDocUrl} className="w-full h-96 rounded-xl border-none" title="ID Proof PDF" />
              ) : (
                <img src={previewDocUrl} alt="Government ID Proof" className="max-h-[55vh] object-contain rounded-xl" />
              )}
            </div>
            <div className="flex justify-between items-center pt-2">
              <a href={previewDocUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5" /> Open in full window
              </a>
              <button
                onClick={() => setPreviewDocUrl(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tourist Detailed Record Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                {selectedUser.profile_image_path || selectedUser.profile_image ? (
                  <img
                    src={resolveMediaUrl(selectedUser.profile_image_path || selectedUser.profile_image)}
                    alt={selectedUser.full_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-600 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-2xl font-black border-2 border-blue-300">
                    {selectedUser.full_name ? selectedUser.full_name.charAt(0).toUpperCase() : 'T'}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-black text-slate-800 m-0">{selectedUser.full_name}</h3>
                  <p className="text-xs text-slate-500 font-mono m-0 mt-0.5">
                    System ID: RS-TST-{selectedUser.id} | {selectedUser.nationality || 'Tourist'}
                  </p>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase ${
                    selectedUser.id_verification_status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedUser.id_verification_status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    ID Verification: {selectedUser.id_verification_status || 'PENDING'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 space-y-2 border border-slate-100">
                <p className="font-bold text-slate-400 uppercase text-[10px] flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Identification & Passport
                </p>
                <p className="text-slate-800 font-bold">ID Type: <span className="font-normal">{selectedUser.id_type || 'Passport'}</span></p>
                <p className="text-slate-800 font-bold">ID #: <span className="font-mono font-bold text-blue-800">{selectedUser.id_number || selectedUser.passport_number || 'N/A'}</span></p>
                <p className="text-slate-700">Gender: {selectedUser.gender || 'Not specified'}</p>
                <p className="text-slate-700">DOB: {selectedUser.dob || 'Not provided'}</p>
                {selectedUser.id_proof_url && (
                  <button
                    type="button"
                    onClick={() => setPreviewDocUrl(resolveMediaUrl(selectedUser.id_proof_url))}
                    className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg">
                    <FileText className="w-3.5 h-3.5" /> View Uploaded ID Document
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 space-y-2 border border-rose-100">
                <p className="font-bold text-rose-700 uppercase text-[10px] flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-rose-600" /> Emergency Medical Profile
                </p>
                <p className="text-slate-800 font-bold">Blood Group: <span className="text-rose-700 font-black">{selectedUser.blood_group || 'Prefer not to disclose'}</span></p>
                <p className="text-slate-700 font-medium">Conditions / Notes: {selectedUser.emergency_notes || selectedUser.medical_conditions || 'None'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 space-y-2 border border-slate-100 sm:col-span-2">
                <p className="font-bold text-slate-400 uppercase text-[10px] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Location Privacy & Live Coordinates
                </p>
                <p className="text-slate-800 font-bold">
                  Location Permission:{' '}
                  <span className={selectedUser.location_sharing_active ? 'text-emerald-700' : 'text-slate-600'}>
                    {selectedUser.location_sharing_active ? 'GRANTED (Sharing Active)' : 'DISABLED (Sharing Inactive)'}
                  </span>
                </p>
                {selectedUser.location_sharing_active || selectedUser.status === 'in_emergency' ? (
                  <p className="text-emerald-700 font-mono font-bold">
                    GPS Coordinates: Lat {selectedUser.latitude || 28.6139}, Lng {selectedUser.longitude || 77.2090}
                  </p>
                ) : (
                  <p className="text-slate-500 font-medium italic">Live location hidden by tourist privacy settings.</p>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t">
              <div className="flex gap-2">
                {selectedUser.id_verification_status !== 'approved' && (
                  <button
                    onClick={() => handleApproveId(selectedUser.id)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Approve ID
                  </button>
                )}
                {selectedUser.id_verification_status !== 'rejected' && (
                  <button
                    onClick={() => handleRejectId(selectedUser.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 cursor-pointer flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Reject ID
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
