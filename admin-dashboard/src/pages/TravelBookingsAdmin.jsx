import React, { useState, useEffect } from 'react';
import { Ticket, Plane, Train, Bus, Car, Search, RefreshCw, User, Calendar, CheckCircle } from 'lucide-react';
import api from '../services/api';

const TravelBookingsAdmin = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/travel-bookings');
      if (res.data) setBookings(res.data);
    } catch (err) {
      console.warn('Failed to fetch travel bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filtered = bookings.filter(b =>
    (b.tourist_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.booking_code || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.from_location || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.to_location || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 m-0">
            <Ticket className="w-7 h-7 text-[#0D47A1]" /> Travel Bookings Audit & Monitoring
          </h1>
          <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
            Real-time audit log of tourist flight, train, bus, intercity cab & rental bookings
          </p>
        </div>

        <button
          onClick={fetchBookings}
          className="px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-blue-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Audit List
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-7 top-7" />
        <input
          type="text"
          placeholder="Search by Tourist Name, Booking Code, Origin or Destination..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-500">Loading travel bookings...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs font-medium text-slate-500">No travel bookings recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500">
                  <th className="p-4">Code / Type</th>
                  <th className="p-4">Tourist Info</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">Operator / Vehicle</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Fare</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#0D47A1]">
                      {b.booking_code}
                      <span className="block text-[10px] uppercase font-bold text-slate-500 font-sans mt-0.5">
                        {b.travel_type}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{b.tourist_name || 'Tourist'}</div>
                      <div className="text-[11px] text-slate-500">{b.tourist_phone}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      {b.from_location} → {b.to_location}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{b.operator_name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{b.vehicle_number}</div>
                    </td>
                    <td className="p-4 text-slate-600">
                      <div>{b.travel_date}</div>
                      <div className="text-[10px] font-bold text-slate-400">{b.departure_time}</div>
                    </td>
                    <td className="p-4 font-black text-slate-900">
                      ₹{b.fare}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase">
                        {b.status || 'CONFIRMED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelBookingsAdmin;
