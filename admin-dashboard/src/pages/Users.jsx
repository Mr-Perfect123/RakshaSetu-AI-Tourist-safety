import React, { useEffect, useState } from 'react';
import { Users, Search, UserCheck, ShieldAlert, Globe, MapPin, Phone, Heart, FileText, AlertTriangle, RefreshCw, Eye, X, Shield, CheckCircle2, XCircle, Send } from 'lucide-react';
import api from '../services/api';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedNationality, setSelectedNationality] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchTourists = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/tourists');
      if (res.data && Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch (err) {
      try {
        const fallback = await api.get('/admin/users?role=Tourist');
        if (fallback.data) setUsers(fallback.data);
      } catch (e) {}
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
    const matchesSearch =
      (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      (u.phone && u.phone.includes(search)) ||
      (u.passport_number && u.passport_number.toLowerCase().includes(search.toLowerCase()));

    const matchesNat = selectedNationality === 'All' || u.nationality === selectedNationality;
    return matchesSearch && matchesNat;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Tourist User Security Roster
          </h1>
          <p className="text-xs text-slate-500">
            Real-time database roster of registered tourists, identity verification & location consent monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTourists}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-blue-800 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Roster
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs font-bold border border-blue-200 flex justify-between items-center">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg('')} className="text-slate-400 font-bold">✕</button>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Monitored Tourists</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">{users.length}</h3>
          <span className="text-[10px] text-emerald-600 font-semibold">Active Database Records</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">In Emergency State</p>
          <h3 className="text-2xl font-black text-danger mt-1">
            {users.filter((u) => u.status === 'in_emergency').length}
          </h3>
          <span className="text-[10px] text-danger font-semibold">Immediate Priority</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">ID Verification Pending</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">
            {users.filter((u) => u.id_verification_status === 'pending' || !u.id_verification_status).length}
          </h3>
          <span className="text-[10px] text-amber-600 font-semibold">Review Required</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Location Sharing Enabled</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">
            {users.filter((u) => u.location_sharing_active).length}
          </h3>
          <span className="text-[10px] text-emerald-600 font-semibold font-mono">Consent Granted</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search name, phone, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
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
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {u.profile_image_path || u.profile_image ? (
                        <img
                          src={u.profile_image_path || u.profile_image}
                          alt={u.full_name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-primary shadow-xs"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-primary flex items-center justify-center font-black text-sm">
                          {u.full_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-800">{u.full_name}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{u.nationality || 'Indian'} • {u.gender || 'Tourist'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-extrabold ${u.email_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {u.email_verified ? '✓ Email Verified' : '✕ Email Pending'}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-extrabold ${u.phone_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {u.phone_verified ? '✓ Phone Verified' : '✕ SMS Pending'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase ${
                        u.id_verification_status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : u.id_verification_status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {u.id_verification_status ? u.id_verification_status.toUpperCase() : 'PENDING'}
                      </span>
                      {u.id_verification_status !== 'approved' && (
                        <button
                          onClick={() => handleApproveId(u.id)}
                          className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 cursor-pointer"
                        >
                          Approve ID
                        </button>
                      )}
                      {u.id_verification_status !== 'rejected' && (
                        <button
                          onClick={() => handleRejectId(u.id)}
                          className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-slate-800">{u.phone}</p>
                    <p className="text-[10px] text-slate-500">{u.email}</p>
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
                      <Send className="w-3 h-3" /> Request Location
                    </button>
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-primary hover:bg-primary hover:text-white font-bold text-[11px] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Full Record
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tourist Detailed Record Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                {selectedUser.profile_image_path || selectedUser.profile_image ? (
                  <img src={selectedUser.profile_image_path || selectedUser.profile_image} alt={selectedUser.full_name} className="w-14 h-14 rounded-full object-cover border-2 border-primary" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-blue-100 text-primary flex items-center justify-center text-2xl font-black">
                    {selectedUser.full_name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedUser.full_name}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    System ID: RS-TST-{selectedUser.id} | {selectedUser.nationality}
                  </p>
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
                <p className="font-bold text-slate-400 uppercase text-[10px]">Identification & Passport</p>
                <p className="text-slate-800 font-bold">ID Type: {selectedUser.id_type || 'Passport'}</p>
                <p className="text-slate-800 font-bold">ID #: {selectedUser.id_number || selectedUser.passport_number || 'N/A'}</p>
                <p className="text-slate-600">Gender: {selectedUser.gender || 'Not specified'}</p>
                {selectedUser.id_proof_url && (
                  <a href={selectedUser.id_proof_url} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline block mt-1">
                    📄 View ID Document File
                  </a>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-red-50/70 space-y-2 border border-red-100">
                <p className="font-bold text-danger uppercase text-[10px]">Emergency Medical Profile</p>
                <p className="text-slate-800 font-bold">Blood Group: {selectedUser.blood_group || 'O+'}</p>
                <p className="text-slate-700">Conditions / Notes: {selectedUser.emergency_notes || selectedUser.emergency_medical_info || 'None'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 space-y-2 border border-slate-100 sm:col-span-2">
                <p className="font-bold text-slate-400 uppercase text-[10px]">Location Privacy & GPS Coordinates</p>
                <p className="text-slate-800 font-bold">Location Permission: {selectedUser.location_sharing_active ? 'GRANTED (Sharing ON)' : 'DISABLED (Sharing OFF)'}</p>
                {selectedUser.location_sharing_active || selectedUser.status === 'in_emergency' ? (
                  <p className="text-emerald-700 font-mono font-bold">
                    GPS Coordinates: Lat {selectedUser.latitude || 28.6139}, Lng {selectedUser.longitude || 77.2090}
                  </p>
                ) : (
                  <p className="text-slate-500 font-medium italic">Live location hidden by tourist privacy settings.</p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t">
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
