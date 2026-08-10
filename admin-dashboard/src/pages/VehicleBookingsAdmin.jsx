import React, { useState, useEffect } from 'react';
import { Car, CheckCircle2, Search, Clock, MapPin } from 'lucide-react';
import api from '../services/api';

const VehicleBookingsAdmin = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/vehicle-bookings');
        if (res.data) setBookings(res.data);
      } catch (e) {
        console.warn('Failed to fetch admin bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Car className="w-6 h-6 text-blue-600" /> Vehicle Bookings Dispatch & Audit
          </h1>
          <p className="text-xs text-slate-500">
            Real-time audit log of all tourist transport dispatches and verified driver assignments
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
            <tr>
              <th className="p-4">Booking Code</th>
              <th className="p-4">Tourist Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Pickup → Destination</th>
              <th className="p-4">Date & Time</th>
              <th className="p-4">Fare</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono font-bold text-[#0D47A1]">{b.booking_code}</td>
                <td className="p-4 font-bold text-slate-800">{b.tourist_name || 'Tourist User'}</td>
                <td className="p-4 font-semibold text-slate-600 uppercase">{b.vehicle_category}</td>
                <td className="p-4 font-semibold text-slate-700">{b.pickup_location} → {b.destination}</td>
                <td className="p-4 text-slate-500">{b.booking_date} at {b.booking_time}</td>
                <td className="p-4 font-black text-slate-900">₹{b.estimated_fare}</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold uppercase text-[10px]">
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VehicleBookingsAdmin;
