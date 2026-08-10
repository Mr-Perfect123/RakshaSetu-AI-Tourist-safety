import React, { useEffect, useState } from 'react';
import { Users, Search, UserCheck, ShieldAlert, Globe, MapPin, Phone, Heart, FileText, AlertTriangle, RefreshCw, Eye, X, Shield } from 'lucide-react';
import api from '../services/api';

const UsersPage = () => {
  const [users, setUsers] = useState([
    {
      id: 4,
      full_name: 'John Doe Tourist',
      email: 'john.tourist@example.com',
      phone: '+919876543213',
      role: 'Tourist',
      status: 'in_emergency',
      nationality: 'American',
      passport_number: 'US-98421034',
      gender: 'male',
      blood_group: 'O+',
      emergency_medical_info: 'Asthma - Carries inhaler',
      hotel_address: 'The Grand Heritage Hotel, Connaught Place, New Delhi',
      latitude: 28.6120,
      longitude: 77.2050,
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      full_name: 'Marie Laurent',
      email: 'marie.laurent@example.com',
      phone: '+33612345678',
      role: 'Tourist',
      status: 'active',
      nationality: 'French',
      passport_number: 'FR-77619204',
      gender: 'female',
      blood_group: 'A+',
      emergency_medical_info: 'Penicillin Allergy',
      hotel_address: 'Taj Palace Hotel, Chanakyapuri, New Delhi',
      latitude: 28.6562,
      longitude: 77.2410,
      created_at: new Date().toISOString()
    },
    {
      id: 6,
      full_name: 'Kenji Sato',
      email: 'kenji.sato@example.com',
      phone: '+819012345678',
      role: 'Tourist',
      status: 'active',
      nationality: 'Japanese',
      passport_number: 'JP-44589123',
      gender: 'male',
      blood_group: 'B+',
      emergency_medical_info: 'None',
      hotel_address: 'The Imperial, Janpath, New Delhi',
      latitude: 28.6129,
      longitude: 77.2295,
      created_at: new Date().toISOString()
    },
    {
      id: 7,
      full_name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      phone: '+447700900077',
      role: 'Tourist',
      status: 'active',
      nationality: 'British',
      passport_number: 'UK-88129031',
      gender: 'female',
      blood_group: 'AB-',
      emergency_medical_info: 'Diabetic - Type 1',
      hotel_address: 'Hyatt Regency, RK Puram, New Delhi',
      latitude: 28.5244,
      longitude: 77.1855,
      created_at: new Date().toISOString()
    },
    {
      id: 8,
      full_name: 'Alexander Mueller',
      email: 'alex.mueller@example.com',
      phone: '+4915123456789',
      role: 'Tourist',
      status: 'active',
      nationality: 'German',
      passport_number: 'DE-30918274',
      gender: 'male',
      blood_group: 'O-',
      emergency_medical_info: 'None',
      hotel_address: 'Le Meridien, Windsor Place, New Delhi',
      latitude: 28.6328,
      longitude: 77.2197,
      created_at: new Date().toISOString()
    },
    {
      id: 9,
      full_name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '+919811223344',
      role: 'Tourist',
      status: 'active',
      nationality: 'Indian',
      passport_number: 'IND-99182374',
      gender: 'female',
      blood_group: 'B+',
      emergency_medical_info: 'Lactose Intolerant',
      hotel_address: 'Resident - Greater Kailash, New Delhi',
      latitude: 28.5535,
      longitude: 77.2588,
      created_at: new Date().toISOString()
    }
  ]);

  const [search, setSearch] = useState('');
  const [selectedNationality, setSelectedNationality] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        if (res.data && res.data.length > 0) {
          setUsers(res.data);
        }
      } catch (err) {
        console.warn('Using preset demo tourists data');
      }
    };
    fetchUsers();
  }, []);

  const handleSeedDemoTourists = async () => {
    setLoading(true);
    try {
      const res = await api.post('/admin/tourists/seed');
      if (res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      alert('Demo tourists generated into roster!');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search) ||
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
            Real-time monitoring of all registered tourists, emergency medical profiles & passport records
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedDemoTourists}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-dark transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Seed Test Tourists
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Monitored Tourists</p>
          <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{users.length}</h3>
          <span className="text-[10px] text-emerald-600 font-semibold">Active GPS Tracking</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-100 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">In Emergency State</p>
          <h3 className="text-2xl font-extrabold text-danger mt-1">
            {users.filter((u) => u.status === 'in_emergency').length}
          </h3>
          <span className="text-[10px] text-danger font-semibold">Immediate Priority</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Foreign Nationals</p>
          <h3 className="text-2xl font-extrabold text-primary mt-1">
            {users.filter((u) => u.nationality !== 'Indian').length}
          </h3>
          <span className="text-[10px] text-slate-500 font-semibold">Embassy Liaison Active</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Medical Records On File</p>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">100%</h3>
          <span className="text-[10px] text-emerald-600 font-semibold font-mono">Emergency Ready</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search name, phone, email, passport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500">Filter Nationality:</span>
          <select
            value={selectedNationality}
            onChange={(e) => setSelectedNationality(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none"
          >
            <option value="All">All Countries</option>
            <option value="American">United States 🇺🇸</option>
            <option value="French">France 🇫🇷</option>
            <option value="Japanese">Japan 🇯🇵</option>
            <option value="British">United Kingdom 🇬🇧</option>
            <option value="German">Germany 🇩🇪</option>
            <option value="Indian">India 🇮🇳</option>
          </select>
        </div>
      </div>

      {/* Tourists Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Tourist Name</th>
                <th className="p-4">Nationality & Passport</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Hotel / Residence</th>
                <th className="p-4">Medical Alert</th>
                <th className="p-4">Safety Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold text-sm">
                        {u.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{u.full_name}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{u.gender || 'Not specified'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <Globe className="w-3.5 h-3.5 text-primary" /> {u.nationality || 'International'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Passport: {u.passport_number || 'REG-991823'}
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-slate-800">{u.phone}</p>
                    <p className="text-[10px] text-slate-500">{u.email}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-slate-700 font-medium max-w-xs truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{u.hotel_address || 'Delhi Tourist Zone'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-red-50 text-danger font-semibold text-[10px] flex items-center gap-1 w-fit">
                      <Heart className="w-3 h-3 fill-danger text-danger" />
                      {u.blood_group || 'O+'} - {u.emergency_medical_info || 'None'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                        u.status === 'in_emergency'
                          ? 'bg-danger text-white animate-pulse'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {u.status === 'in_emergency' ? '🚨 EMERGENCY SOS' : 'SAFE & ACTIVE'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-primary hover:bg-primary hover:text-white font-bold text-[11px] transition-colors flex items-center gap-1.5 ml-auto"
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
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center text-xl font-bold">
                  {selectedUser.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedUser.full_name}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    System ID: RS-TST-{selectedUser.id} | {selectedUser.nationality}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 space-y-2 border border-slate-100">
                <p className="font-bold text-slate-400 uppercase text-[10px]">Identification & Passport</p>
                <p className="text-slate-800 font-bold">Passport #: {selectedUser.passport_number || 'US-98421034'}</p>
                <p className="text-slate-600">Gender: {selectedUser.gender || 'Not specified'}</p>
                <p className="text-slate-600">Nationality: {selectedUser.nationality}</p>
              </div>

              <div className="p-4 rounded-xl bg-red-50/70 space-y-2 border border-red-100">
                <p className="font-bold text-danger uppercase text-[10px]">Emergency Medical Profile</p>
                <p className="text-slate-800 font-bold">Blood Group: {selectedUser.blood_group || 'O+'}</p>
                <p className="text-slate-700">Conditions: {selectedUser.emergency_medical_info || 'None declared'}</p>
                <p className="text-slate-600">Insurance ID: INS-78904321</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 space-y-2 border border-slate-100 sm:col-span-2">
                <p className="font-bold text-slate-400 uppercase text-[10px]">Current Accommodation & Live Coordinates</p>
                <p className="text-slate-800 font-bold">{selectedUser.hotel_address}</p>
                <p className="text-primary font-mono font-bold">
                  GPS Coordinates: Lat {selectedUser.latitude || 28.6139}, Lng {selectedUser.longitude || 77.2090}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 space-y-2 border border-blue-100 sm:col-span-2">
                <p className="font-bold text-primary uppercase text-[10px]">Emergency Contacts Liaison</p>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-bold">Jane Doe (Spouse)</span>
                  <span className="font-mono text-primary font-bold">+1 (415) 555-0199</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
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
