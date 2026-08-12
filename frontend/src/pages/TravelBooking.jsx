import React, { useState, useEffect } from 'react';
import { Plane, Train, Bus, Car, Key, ArrowRight, ArrowLeft, Calendar, Clock, MapPin, CheckCircle2, ShieldCheck, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const TRAVEL_TYPES = [
  { key: 'flight', label: 'Flights', icon: Plane, desc: 'Domestic & Regional Flights' },
  { key: 'train', label: 'Trains', icon: Train, desc: 'Express & Vande Bharat' },
  { key: 'bus', label: 'Buses', icon: Bus, desc: 'AC Sleeper & Volvo' },
  { key: 'cab', label: 'Intercity Cabs', icon: Car, desc: 'Verified Outstation Taxis' },
  { key: 'rental', label: 'Self-Drive', icon: Key, desc: '24h Rental Vehicles' }
];

const TravelBooking = ({ darkMode }) => {
  const [travelType, setTravelType] = useState('flight');
  const [fromLocation, setFromLocation] = useState('Coimbatore (CJB)');
  const [toLocation, setToLocation] = useState('Chennai (MAA)');
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [travelTime, setTravelTime] = useState('08:00 AM');
  const [passengers, setPassengers] = useState(1);

  const [availableOptions, setAvailableOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'my-bookings'
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const searchOptions = async () => {
    setLoading(true);
    setBookingSuccess(null);
    try {
      const res = await api.get(
        `/travel/search?travelType=${travelType}&from=${encodeURIComponent(fromLocation)}&to=${encodeURIComponent(toLocation)}&date=${travelDate}&passengers=${passengers}`
      );
      if (res.data && Array.isArray(res.data)) {
        setAvailableOptions(res.data);
      }
    } catch (e) {
      console.warn('Travel search error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchOptions();
  }, [travelType]);

  const handleBook = async (option) => {
    setLoading(true);
    try {
      const res = await api.post('/travel/book', {
        travelType: option.travel_type,
        fromLocation,
        toLocation,
        travelDate,
        travelTime: option.departure_time,
        passengers,
        operatorName: option.operator_name,
        vehicleNumber: option.vehicle_number,
        departureTime: option.departure_time,
        arrivalTime: option.arrival_time,
        duration: option.duration,
        fare: option.fare
      });

      if (res.data) {
        setBookingSuccess(res.data);
        fetchMyBookings();
      }
    } catch (err) {
      alert(`Booking Failed: ${err.message || 'Error booking travel option'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const res = await api.get('/travel/bookings');
      if (res.data) setMyBookings(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    if (activeTab === 'my-bookings') fetchMyBookings();
  }, [activeTab]);

  const cardBg = darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const textClass = darkMode ? 'text-slate-100' : 'text-slate-900';
  const mutedClass = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className={`p-2.5 rounded-xl border decoration-none ${
            darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
          }`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold m-0 text-[#0D47A1] flex items-center gap-2">
              <Ticket className="w-6 h-6 text-blue-600" /> Unified Travel Booking Hub
            </h1>
            <p className="text-xs text-slate-500 m-0">Book Flights, Trains, Buses, Cabs & Rental Vehicles safely</p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'search' ? 'bg-[#0D47A1] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Search & Book
          </button>
          <button
            onClick={() => setActiveTab('my-bookings')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'my-bookings' ? 'bg-[#0D47A1] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            My Bookings ({myBookings.length})
          </button>
        </div>
      </div>

      {activeTab === 'search' ? (
        <div className="space-y-6">
          {/* Travel Type Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {TRAVEL_TYPES.map((t) => {
              const Icon = t.icon;
              const isSelected = travelType === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTravelType(t.key)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-md'
                      : darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-white' : 'text-[#0D47A1]'}`} />
                  <div className="text-xs font-extrabold">{t.label}</div>
                  <div className={`text-[10px] font-medium ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{t.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Search Parameters Box */}
          <div className={`${cardBg} p-6 rounded-3xl border shadow-xs space-y-4`}>
            <form onSubmit={(e) => { e.preventDefault(); searchOptions(); }} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">FROM</label>
                <input
                  type="text"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  required
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${
                    darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">TO</label>
                <input
                  type="text"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  required
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${
                    darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">DATE</label>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  required
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${
                    darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">PASSENGERS</label>
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(parseInt(e.target.value))}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${
                    darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Traveler(s)</option>)}
                </select>
              </div>

              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs hover:bg-blue-800 transition-colors shadow-sm cursor-pointer"
              >
                Search Options
              </button>
            </form>
          </div>

          {/* Success Banner */}
          {bookingSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-2 font-extrabold text-xs">
                <CheckCircle2 className="w-5 h-5" />
                <span>Booking Confirmed! Code: {bookingSuccess.booking_code} ({bookingSuccess.operator_name})</span>
              </div>
              <button
                onClick={() => setActiveTab('my-bookings')}
                className="px-3 py-1 rounded-lg bg-white text-emerald-800 font-extrabold text-xs cursor-pointer"
              >
                View Ticket
              </button>
            </div>
          )}

          {/* Available Options List */}
          <div className="space-y-3">
            <h3 className={`text-xs font-extrabold uppercase tracking-wider ${mutedClass}`}>
              Available {travelType.toUpperCase()} Options ({availableOptions.length})
            </h3>

            {availableOptions.map((opt) => (
              <div key={opt.id} className={`${cardBg} p-5 rounded-3xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#0D47A1]">{opt.operator_name}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold font-mono">
                      {opt.vehicle_number}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-bold flex items-center gap-3">
                    <span>{opt.from_location} → {opt.to_location}</span>
                    <span className="text-slate-400">|</span>
                    <span>Dep: {opt.departure_time}</span>
                    <span className="text-slate-400">|</span>
                    <span>Duration: {opt.duration}</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold block">
                    Available Seats: {opt.available_seats} Seats Left
                  </span>
                </div>

                <div className="flex items-center gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900 block">₹{opt.fare}</span>
                    <span className="text-[10px] text-slate-400 font-medium">per passenger</span>
                  </div>
                  <button
                    onClick={() => handleBook(opt)}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs hover:bg-blue-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Confirming...' : 'Book Ticket'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* My Bookings History Tab */
        <div className={`${cardBg} p-6 rounded-3xl border shadow-xs space-y-4`}>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0D47A1] m-0">Your Travel Tickets</h2>

          {myBookings.length === 0 ? (
            <p className="text-xs text-slate-500 font-medium py-6 text-center">No travel bookings found on record.</p>
          ) : (
            <div className="space-y-3">
              {myBookings.map((b) => (
                <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-[#0D47A1] block">
                      {b.booking_code} • {b.travel_type?.toUpperCase()} ({b.operator_name})
                    </span>
                    <span className="text-xs text-slate-700 font-bold block">{b.from_location} → {b.to_location}</span>
                    <span className="text-[11px] text-slate-500 font-semibold">Date: {b.travel_date} at {b.travel_time}</span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-sm font-black text-slate-900 block">₹{b.fare}</span>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TravelBooking;
