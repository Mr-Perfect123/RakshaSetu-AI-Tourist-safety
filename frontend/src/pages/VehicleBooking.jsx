import React, { useState, useEffect } from 'react';
import { Car, Bike, Truck, Bus, Calendar, Clock, MapPin, CheckCircle2, ShieldCheck, UserCheck, ArrowRight, ArrowLeft, AlertCircle, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const VehicleBooking = ({ darkMode }) => {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('sedan');
  const [pickup, setPickup] = useState('Hotel Imperial, Janpath, New Delhi');
  const [destination, setDestination] = useState('Taj Mahal, Agra');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('10:00');
  const [passengers, setPassengers] = useState(2);
  const [distanceKm, setDistanceKm] = useState(210);

  const [fareEstimate, setFareEstimate] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('book'); // 'book' or 'history'

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await api.get('/vehicles/types');
        if (res.data && res.data.length > 0) {
          setVehicleTypes(res.data);
        }
      } catch (e) {
        console.warn('Using default vehicle categories');
      }
    };
    fetchTypes();
  }, []);

  const calculateFare = async () => {
    try {
      const res = await api.post('/vehicles/estimate-fare', {
        category: selectedCategory,
        distanceKm
      });
      setFareEstimate(res.data);
    } catch (e) {
      // Fallback estimate
      setFareEstimate({ estimatedFare: 2500 });
    }
  };

  useEffect(() => {
    calculateFare();
  }, [selectedCategory, distanceKm]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setBookingResult(null);

    try {
      const res = await api.post('/vehicles/book', {
        category: selectedCategory,
        pickupLocation: pickup,
        destination,
        date: bookingDate,
        time: bookingTime,
        passengers,
        estimatedFare: fareEstimate?.estimatedFare || 2500
      });

      setBookingResult(res.data);
      fetchMyBookings();
    } catch (err) {
      alert(`Booking Failed: ${err.message || 'Server error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const res = await api.get('/vehicles/my-bookings');
      if (res.data) setMyBookings(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    if (activeTab === 'history') fetchMyBookings();
  }, [activeTab]);

  const cardBg = darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className={`p-2 rounded-xl border ${
            darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
          }`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold m-0 text-[#0D47A1] flex items-center gap-2">
              <Car className="w-6 h-6 text-blue-600" /> RakshaSetu Verified Vehicle Booking
            </h1>
            <p className="text-xs text-slate-500 m-0">Verified drivers, real-time GPS tracking & 24/7 Police SOS link</p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('book')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'book' ? 'bg-[#0D47A1] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Book Transport
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history' ? 'bg-[#0D47A1] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            My Bookings ({myBookings.length})
          </button>
        </div>
      </div>

      {activeTab === 'book' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Booking Form (Cols 1 & 2) */}
          <div className={`md:col-span-2 ${cardBg} p-6 rounded-3xl border shadow-xs space-y-6`}>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0D47A1] m-0">1. Select Vehicle Category</h2>

            {/* Vehicle Category Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: 'scooter', label: 'Scooter / Bike', icon: Bike, desc: '1 Pass • Quick City' },
                { key: 'hatchback', label: 'Economy Hatch', icon: Car, desc: '3 Pass • Budget' },
                { key: 'sedan', label: 'Comfort Sedan', icon: Car, desc: '4 Pass • AC Deluxe' },
                { key: 'suv', label: 'Safety SUV', icon: Truck, desc: '6 Pass • High Clearance' },
                { key: 'van', label: 'Group Minivan', icon: Bus, desc: '10 Pass • Tourist Guide' }
              ].map((v) => {
                const IconComponent = v.icon;
                const isSelected = selectedCategory === v.key;
                return (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setSelectedCategory(v.key)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border-[#0D47A1] ring-2 ring-[#0D47A1]/20 shadow-sm'
                        : darkMode ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <IconComponent className={`w-6 h-6 mb-2 ${isSelected ? 'text-[#0D47A1]' : 'text-slate-400'}`} />
                    <div className="text-xs font-extrabold text-slate-800">{v.label}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">{v.desc}</div>
                  </button>
                );
              })}
            </div>

            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0D47A1] m-0 pt-2">2. Trip & Pickup Details</h2>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Pickup Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      required
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:outline-none ${
                        darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Destination</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-red-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      required
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:outline-none ${
                        darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${
                      darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Pickup Time</label>
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    required
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${
                      darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Passengers</label>
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(parseInt(e.target.value))}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${
                      darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n} Person(s)</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs uppercase tracking-wider hover:bg-blue-800 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Confirming Verified Dispatch...' : (
                  <>
                    <span>Confirm Verified Booking</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Booking Confirmation / Fare Sidebar (Col 3) */}
          <div className="space-y-6">
            <div className={`${cardBg} p-6 rounded-3xl border shadow-xs space-y-4`}>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Fare Summary</h3>

              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200">
                <span className="text-xs text-slate-500 font-bold block">Estimated Fare</span>
                <span className="text-3xl font-black text-[#0D47A1]">₹{fareEstimate?.estimatedFare || 2500}</span>
                <p className="text-[11px] text-slate-500 font-semibold m-0 mt-1">Includes driver charge, fuel & RakshaSetu GPS Safety link</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-start gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>All RakshaSetu vehicle rides are linked to police dispatch headquarters during transit.</span>
              </div>
            </div>

            {bookingResult && (
              <div className="p-6 rounded-3xl bg-emerald-600 text-white shadow-xl space-y-3">
                <div className="flex items-center gap-2 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5" /> Booking Confirmed!
                </div>
                <div className="text-xs space-y-1">
                  <p className="m-0">Booking Code: <strong>{bookingResult.booking_code}</strong></p>
                  <p className="m-0">Driver: <strong>{bookingResult.driver_name}</strong></p>
                  <p className="m-0">Phone: <strong>{bookingResult.driver_phone}</strong></p>
                  <p className="m-0">Vehicle: <strong>{bookingResult.vehicle_registration}</strong></p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Booking History Tab */
        <div className={`${cardBg} p-6 rounded-3xl border shadow-xs space-y-4`}>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0D47A1] m-0">Your Booking History</h2>

          {myBookings.length === 0 ? (
            <p className="text-xs text-slate-500 font-medium py-6 text-center">No vehicle bookings found on record.</p>
          ) : (
            <div className="space-y-3">
              {myBookings.map((b) => (
                <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-[#0D47A1] block">{b.booking_code} • {b.vehicle_category?.toUpperCase()}</span>
                    <span className="text-xs text-slate-700 font-bold block mt-0.5">{b.pickup_location} → {b.destination}</span>
                    <span className="text-[11px] text-slate-500 font-semibold">{b.booking_date} at {b.booking_time}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 block">₹{b.estimated_fare}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">{b.status}</span>
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

export default VehicleBooking;
