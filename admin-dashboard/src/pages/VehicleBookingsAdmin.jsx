import React, { useState, useEffect } from 'react';
import { Car, CheckCircle2, Search, Clock, MapPin, Bell } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';

const VehicleBookingsAdmin = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const DEFAULT_BOOKINGS = [
    {
      id: 201,
      booking_code: 'BK-RS-883921',
      tourist_name: 'Emily Clark',
      vehicle_category: 'SEDAN',
      pickup_location: 'Coimbatore Railway Station',
      destination: 'Marudamalai Temple',
      booking_date: new Date().toLocaleDateString(),
      booking_time: '10:30 AM',
      estimated_fare: 360,
      status: 'confirmed'
    },
    {
      id: 202,
      booking_code: 'BK-RS-991204',
      tourist_name: 'John Doe Tourist',
      vehicle_category: 'SUV',
      pickup_location: 'IGI Airport Terminal 3',
      destination: 'Taj Palace Hotel, Delhi',
      booking_date: new Date().toLocaleDateString(),
      booking_time: '11:15 AM',
      estimated_fare: 480,
      status: 'completed'
    },
    {
      id: 203,
      booking_code: 'BK-RS-102938',
      tourist_name: 'Karthik Raja',
      vehicle_category: 'INTERCITY TAXI',
      pickup_location: 'Coimbatore Railway Station',
      destination: 'Chennai Central',
      booking_date: new Date().toLocaleDateString(),
      booking_time: '08:00 AM',
      estimated_fare: 9100,
      status: 'in_transit'
    }
  ];

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/vehicle-bookings');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setBookings(res.data);
        } else {
          setBookings(DEFAULT_BOOKINGS);
        }
      } catch (e) {
        setBookings(DEFAULT_BOOKINGS);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();

    // Listen to real-time tourist ride bookings
    socket.on('new_vehicle_booking', (newBooking) => {
      setBookings((prev) => [
        {
          id: newBooking.id || Date.now(),
          booking_code: newBooking.details?.booking_code || `BK-RS-${Date.now().toString().slice(-6)}`,
          tourist_name: newBooking.touristName || 'Tourist User',
          vehicle_category: newBooking.details?.vehicle_category || 'SEDAN',
          pickup_location: newBooking.details?.pickup_location || 'GPS Location',
          destination: newBooking.details?.destination || 'Destination',
          booking_date: new Date().toLocaleDateString(),
          booking_time: new Date().toLocaleTimeString(),
          estimated_fare: newBooking.details?.estimated_fare || 250,
          status: 'confirmed'
        },
        ...prev
      ]);
    });

    return () => {
      socket.off('new_vehicle_booking');
    };
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar — Royal Ocean Gradient Banner */}
      <div className="bg-gradient-to-r from-[#0a2540] via-[#0D47A1] to-[#1e3a8a] text-white p-6 rounded-3xl shadow-xl border border-blue-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5 m-0">
            <Car className="w-6 h-6 text-blue-300" /> Vehicle Bookings Dispatch & Audit
          </h1>
          <p className="text-xs font-semibold text-blue-100 m-0 mt-1">
            Real-time audit log of all tourist transport dispatches and verified driver assignments
          </p>
        </div>
        <span className="px-3.5 py-1.5 rounded-full bg-white/15 text-white text-xs font-black flex items-center gap-1.5 border border-white/20 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
          Live Dispatch Feed
        </span>
      </div>

      <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
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
              <tr key={b.id} className="hover:bg-slate-50 transition-colors">
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
