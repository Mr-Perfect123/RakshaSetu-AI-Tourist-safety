import React, { useState, useEffect } from 'react';
import { Car, Bike, Truck, Bus, Calendar, Clock, MapPin, CheckCircle2, ShieldCheck, UserCheck, ArrowRight, ArrowLeft, AlertCircle, History, Phone, Star, Shield, RefreshCw, Route, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PaymentModal from '../components/PaymentModal';

import TouristMap from '../components/TouristMap';
import axios from 'axios';

const VehicleBooking = ({ darkMode }) => {
  const [selectedCategory, setSelectedCategory] = useState('sedan');
  const [pickup, setPickup] = useState('Coimbatore Railway Station');
  const [destination, setDestination] = useState('Marudamalai Temple, Coimbatore');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('10:00');
  const [passengers, setPassengers] = useState(2);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Routing & Coordinate States
  const [pickupCoords, setPickupCoords] = useState({ lat: 11.0017, lng: 76.9629, name: 'Coimbatore Railway Station' });
  const [destCoords, setDestCoords] = useState({ lat: 11.0478, lng: 76.8524, name: 'Marudamalai Temple' });
  const [distanceKm, setDistanceKm] = useState(16.8);
  const [estimatedTimeMins, setEstimatedTimeMins] = useState(28);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isRouting, setIsRouting] = useState(false);

  const [fareEstimate, setFareEstimate] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('book');

  // Real OSRM Routing Engine
  const calculateRouteAndFare = async () => {
    if (!pickup.trim() || !destination.trim()) return;
    setIsRouting(true);

    try {
      // 1. Geocode Pickup & Destination via OpenStreetMap Nominatim
      let pLat = pickupCoords.lat;
      let pLng = pickupCoords.lng;
      let dLat = destCoords.lat;
      let dLng = destCoords.lng;

      try {
        const [pRes, dRes] = await Promise.all([
          axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(pickup)}&format=json&limit=1`, { headers: { 'User-Agent': 'RakshaSetu/1.0' }, timeout: 3000 }),
          axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`, { headers: { 'User-Agent': 'RakshaSetu/1.0' }, timeout: 3000 })
        ]);

        if (pRes.data && pRes.data[0]) {
          pLat = parseFloat(pRes.data[0].lat);
          pLng = parseFloat(pRes.data[0].lon);
          setPickupCoords({ lat: pLat, lng: pLng, name: pickup });
        }
        if (dRes.data && dRes.data[0]) {
          dLat = parseFloat(dRes.data[0].lat);
          dLng = parseFloat(dRes.data[0].lon);
          setDestCoords({ lat: dLat, lng: dLng, name: destination });
        }
      } catch (geoErr) {
        console.warn('Geocoding fallback');
      }

      // 2. Fetch OSRM Driving Route
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson`;
        const routeRes = await axios.get(osrmUrl, { timeout: 4000 });

        if (routeRes.data && routeRes.data.routes && routeRes.data.routes[0]) {
          const r = routeRes.data.routes[0];
          const distKm = Math.max(Math.round((r.distance / 1000) * 10) / 10, 1.0);
          const durationMin = Math.max(Math.round(r.duration / 60), 3);

          setDistanceKm(distKm);
          setEstimatedTimeMins(durationMin);

          if (r.geometry && Array.isArray(r.geometry.coordinates)) {
            const leafCoords = r.geometry.coordinates.map(c => [c[1], c[0]]);
            setRouteCoordinates(leafCoords);
          }
        }
      } catch (osrmErr) {
        // Fallback distance calculation via Haversine formula
        const R = 6371;
        const dLatRad = ((dLat - pLat) * Math.PI) / 180;
        const dLonRad = ((dLng - pLng) * Math.PI) / 180;
        const a = Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) + Math.cos((pLat * Math.PI) / 180) * Math.cos((dLat * Math.PI) / 180) * Math.sin(dLonRad / 2) * Math.sin(dLonRad / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const haversineDist = Math.round(R * c * 10) / 10 || 12.5;

        setDistanceKm(haversineDist);
        setEstimatedTimeMins(Math.round((haversineDist / 35) * 60));
      }

      // 3. Estimate Dynamic Fare
      try {
        const res = await api.post('/vehicles/estimate-fare', {
          category: selectedCategory,
          distanceKm
        });
        if (res.data) {
          setFareEstimate(res.data?.data || res.data);
        }
      } catch (e) {
        const rates = { hatchback: 14, sedan: 18, suv: 24, luxury: 45, electric: 16 };
        const perKm = rates[selectedCategory] || 18;
        const base = selectedCategory === 'luxury' ? 250 : 80;
        const distCharge = Math.round(distanceKm * perKm);
        const total = Math.round(base + distCharge + 40);

        setFareEstimate({
          baseFare: base,
          perKmRate: perKm,
          distanceCharge: distCharge,
          taxesFees: 40,
          estimatedFare: total
        });
      }
    } finally {
      setIsRouting(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateRouteAndFare();
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedCategory, pickup, destination]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setBookingResult(null);

    try {
      const res = await api.post('/vehicles/book', {
        category: selectedCategory,
        pickupLocation: pickup,
        destination,
        distanceKm,
        date: bookingDate,
        time: bookingTime,
        passengers
      });

      const dataObj = res.data?.data || res.data;
      if (dataObj) {
        setBookingResult(dataObj);
        setShowPaymentModal(true);
        fetchMyBookings();
      }
    } catch (err) {
      alert(`Booking Failed: ${err.message || 'Server error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const res = await api.get('/vehicles/my-bookings');
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list)) setMyBookings(list);
    } catch (e) {}
  };

  useEffect(() => {
    if (activeTab === 'history') fetchMyBookings();
  }, [activeTab]);

  const cardBg = darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const textClass = darkMode ? 'text-slate-100' : 'text-slate-900';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Bar — Frosted Glass Container for High Text Visibility */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
      } backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <Link to="/" className={`p-2.5 rounded-xl border decoration-none ${
            darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className={`text-xl font-extrabold m-0 flex items-center gap-2 ${
              darkMode ? 'text-blue-400' : 'text-blue-900'
            }`}>
              <Car className="w-6 h-6 text-blue-600" /> Dynamic Vehicle & Taxi Dispatch Hub
            </h1>
            <p className={`text-xs font-semibold m-0 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Verified drivers, real-time GPS tracking & 24/7 Police Command link
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('book')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'book' ? 'bg-[#0D47A1] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Book Taxi / Cab
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history' ? 'bg-[#0D47A1] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            My Rides ({myBookings.length})
          </button>
        </div>
      </div>

      {activeTab === 'book' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form (Cols 1 & 2) */}
          <div className={`lg:col-span-2 ${darkMode ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-900'} backdrop-blur-md p-6 rounded-3xl border shadow-md space-y-6`}>
            <h2 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-blue-400' : 'text-blue-900'} m-0`}>1. Select Vehicle Category</h2>

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

            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#0D47A1] m-0 pt-2">2. Route & Trip Details</h2>

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

              {/* Automatic Calculated Distance & Time Display Badge (No Manual Typing) */}
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-bold flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#0D47A1]">
                  <Route className="w-4 h-4 text-blue-600" />
                  <span>Auto-Calculated Map Route: <strong>{distanceKm} km</strong></span>
                </div>
                <span className="text-slate-600">Est. Time: <strong>~{estimatedTimeMins} mins</strong></span>
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
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} Traveler(s)</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs uppercase tracking-wider hover:bg-blue-800 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Assigning Verified Driver...' : (
                  <>
                    <span>Confirm Verified Booking</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Dynamic Fare & Driver Breakdown Sidebar */}
          <div className="space-y-6">
            <div className={`${cardBg} p-6 rounded-3xl border shadow-xs space-y-4`}>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 m-0">Dynamic Fare Breakdown</h3>

              {fareEstimate && (
                <div className="space-y-2 text-xs font-semibold border-b pb-3 border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Fare:</span>
                    <span>₹{fareEstimate.baseFare}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Distance Charge ({distanceKm} km @ ₹{fareEstimate.perKmRate}/km):</span>
                    <span>₹{fareEstimate.distanceCharge}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Applicable Taxes & Fees (12%):</span>
                    <span>₹{fareEstimate.taxesFees}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-[#0D47A1] pt-1">
                    <span>Total Fare:</span>
                    <span>₹{fareEstimate.estimatedFare}</span>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-start gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>All drivers undergo background identity verification with active 24/7 Police Command link during trip transit.</span>
              </div>
            </div>

            {bookingResult && (
              <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-white font-extrabold text-[10px] uppercase ${
                    bookingResult.payment_status === 'paid' ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}>
                    Payment: {bookingResult.payment_status?.toUpperCase() || 'CONFIRMED'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{bookingResult.booking_code}</span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={bookingResult.driver_photo || bookingResult.driver?.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'}
                    alt={bookingResult.driver_name || bookingResult.driver?.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400"
                  />
                  <div>
                    <h4 className="text-sm font-extrabold text-white m-0">
                      {bookingResult.driver_name || bookingResult.driver?.name || 'Karthik Raja (Verified)'}
                    </h4>
                    <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {bookingResult.driver_rating || bookingResult.driver?.rating || 4.95} • Verified Driver
                    </span>
                    <span className="text-[11px] text-slate-300 font-mono block">
                      🚗 {bookingResult.vehicle_registration || bookingResult.driver?.registration_number || 'TN-37-RS-1001'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Driver Contact:</span>
                  <a href={`tel:${bookingResult.driver_phone || bookingResult.driver?.phone || '+919443322110'}`} className="text-emerald-400 font-extrabold hover:underline">
                    📞 {bookingResult.driver_phone || bookingResult.driver?.phone || '+919443322110'}
                  </a>
                </div>

                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs uppercase hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{bookingResult.payment_status === 'paid' ? 'View Payment Receipt' : `Pay ₹${bookingResult.estimated_fare} Now`}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className={`${cardBg} p-6 rounded-3xl border shadow-xs space-y-4`}>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0D47A1] m-0">Your Ride History</h2>

          {myBookings.length === 0 ? (
            <p className="text-xs text-slate-500 font-medium py-6 text-center">No vehicle bookings found on record.</p>
          ) : (
            <div className="space-y-3">
              {myBookings.map((b) => (
                <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-[#0D47A1] block">{b.booking_code} • {b.vehicle_category?.toUpperCase()}</span>
                    <span className="text-xs text-slate-700 font-bold block">{b.pickup_location} → {b.destination}</span>
                    <span className="text-[11px] text-slate-500 font-semibold">Driver: {b.driver_name || b.driver?.name || 'Assigned Driver'} ({b.vehicle_registration || b.driver?.registration_number || 'TN-37-RS'})</span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-sm font-black text-slate-900 block">₹{b.estimated_fare}</span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      b.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {b.payment_status || b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        bookingDetails={{
          amount: bookingResult?.estimated_fare,
          booking_code: bookingResult?.booking_code,
          title: `${selectedCategory.toUpperCase()} Cab Ride`,
          type: 'vehicle'
        }}
        onPaymentSuccess={() => {
          fetchMyBookings();
          setBookingResult(prev => prev ? { ...prev, payment_status: 'paid' } : null);
        }}
        darkMode={darkMode}
      />
    </div>
  );
};

export default VehicleBooking;
