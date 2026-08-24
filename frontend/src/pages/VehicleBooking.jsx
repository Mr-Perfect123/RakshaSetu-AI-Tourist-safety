import React, { useState, useEffect } from 'react';
import { Car, Bike, Truck, Bus, Calendar, Clock, MapPin, CheckCircle2, ShieldCheck, UserCheck, ArrowRight, ArrowLeft, AlertCircle, History, Phone, Star, Shield, RefreshCw, Route, CreditCard, KeyRound, PlayCircle, FlagTriangleRight, Loader2, BadgeCheck, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PaymentModal from '../components/PaymentModal';
import axios from 'axios';

// Enhanced intercity and intracity distance calculator
const estimateDistanceBetweenLocations = (pickupText, destText) => {
  if (!pickupText || !destText) return 5.0;
  const p = pickupText.toLowerCase().trim();
  const d = destText.toLowerCase().trim();
  if (p === d) return 1.5;
  const hasBoth = (a, b) => (p.includes(a) && d.includes(b)) || (p.includes(b) && d.includes(a));
  if (hasBoth('coimbatore', 'chennai')) return 505.0;
  if (hasBoth('coimbatore', 'bangalore') || hasBoth('coimbatore', 'bengaluru')) return 365.0;
  if (hasBoth('coimbatore', 'ooty')) return 85.5;
  if (hasBoth('coimbatore', 'madurai')) return 215.0;
  if (hasBoth('coimbatore', 'kochi') || hasBoth('coimbatore', 'ernakulam')) return 190.0;
  if (hasBoth('delhi', 'agra') || hasBoth('delhi', 'taj')) return 230.0;
  if (hasBoth('delhi', 'jaipur')) return 280.0;
  if (hasBoth('goa', 'mumbai')) return 580.0;
  if (hasBoth('mumbai', 'pune')) return 148.0;
  if (hasBoth('railway', 'marudamalai')) return 16.8;
  if (hasBoth('airport', 'railway')) return 11.4;
  if (hasBoth('airport', 'marudamalai')) return 24.2;
  if (hasBoth('railway', 'isha')) return 30.5;
  if (hasBoth('airport', 'isha')) return 42.0;
  if (hasBoth('railway', 'gandhipuram')) return 3.5;
  if (hasBoth('connaught', 'airport')) return 18.5;
  if (p.includes('marudamalai') || d.includes('marudamalai')) return 16.8;
  if (p.includes('isha') || d.includes('isha')) return 30.5;
  if (p.includes('airport') || d.includes('airport')) return 18.5;
  let hash1 = 0, hash2 = 0;
  for (let i = 0; i < p.length; i++) hash1 = (hash1 * 31 + p.charCodeAt(i)) % 10007;
  for (let i = 0; i < d.length; i++) hash2 = (hash2 * 37 + d.charCodeAt(i)) % 10007;
  const diff = Math.abs(hash1 - hash2);
  return parseFloat((3.2 + (diff % 220) / 10).toFixed(1));
};

// Ride status progression
const RIDE_PHASES = {
  NONE: 'none',
  BOOKED: 'booked',       // Just booked — show OTP
  RIDE_STARTED: 'started', // Driver scanned OTP
  COMPLETED: 'completed',  // Ride done — pay now
  PAID: 'paid'
};

const VehicleBooking = ({ darkMode }) => {
  const [selectedCategory, setSelectedCategory] = useState('sedan');
  const [pickup, setPickup] = useState('Coimbatore Railway Station');
  const [destination, setDestination] = useState('Marudamalai Temple, Coimbatore');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('10:00');
  const [passengers, setPassengers] = useState(2);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [pickupCoords, setPickupCoords] = useState({ lat: 11.0017, lng: 76.9629 });
  const [destCoords, setDestCoords] = useState({ lat: 11.0478, lng: 76.8524 });
  const [distanceKm, setDistanceKm] = useState(16.8);
  const [estimatedTimeMins, setEstimatedTimeMins] = useState(28);
  const [isRouting, setIsRouting] = useState(false);

  const [fareEstimate, setFareEstimate] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [ridePhase, setRidePhase] = useState(RIDE_PHASES.NONE);
  const [loading, setLoading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('book');

  // OTP entry state (simulate driver entering OTP)
  const [otpEntry, setOtpEntry] = useState('');
  const [otpError, setOtpError] = useState('');
  const [simulatingRide, setSimulatingRide] = useState(false);

  const calculateRouteAndFare = async () => {
    if (!pickup.trim() || !destination.trim()) return;
    setIsRouting(true);
    try {
      let pLat = pickupCoords.lat, pLng = pickupCoords.lng;
      let dLat = destCoords.lat, dLng = destCoords.lng;
      try {
        const [pRes, dRes] = await Promise.all([
          axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(pickup)}&format=json&limit=1`, { headers: { 'User-Agent': 'RakshaSetu/1.0' }, timeout: 3000 }),
          axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`, { headers: { 'User-Agent': 'RakshaSetu/1.0' }, timeout: 3000 })
        ]);
        if (pRes.data?.[0]) { pLat = parseFloat(pRes.data[0].lat); pLng = parseFloat(pRes.data[0].lon); setPickupCoords({ lat: pLat, lng: pLng }); }
        if (dRes.data?.[0]) { dLat = parseFloat(dRes.data[0].lat); dLng = parseFloat(dRes.data[0].lon); setDestCoords({ lat: dLat, lng: dLng }); }
      } catch {}

      try {
        const osrmRes = await axios.get(`https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full`, { timeout: 4000 });
        if (osrmRes.data?.routes?.[0]) {
          const r = osrmRes.data.routes[0];
          setDistanceKm(Math.max(Math.round((r.distance / 1000) * 10) / 10, 1.0));
          setEstimatedTimeMins(Math.max(Math.round(r.duration / 60), 3));
        }
      } catch {
        const haverDist = estimateDistanceBetweenLocations(pickup, destination);
        setDistanceKm(haverDist);
        setEstimatedTimeMins(Math.round((haverDist / 35) * 60));
      }

      try {
        const res = await api.post('/vehicles/estimate-fare', { category: selectedCategory, distanceKm });
        if (res.data) setFareEstimate(res.data?.data || res.data);
      } catch {
        const rates = { scooter: 10, hatchback: 14, sedan: 18, suv: 24, van: 20, luxury: 45 };
        const perKm = rates[selectedCategory] || 18;
        const base = selectedCategory === 'luxury' ? 250 : 80;
        const distCharge = Math.round(distanceKm * perKm);
        setFareEstimate({ baseFare: base, perKmRate: perKm, distanceCharge: distCharge, taxesFees: 40, estimatedFare: Math.round(base + distCharge + 40) });
      }
    } finally { setIsRouting(false); }
  };

  useEffect(() => {
    const timer = setTimeout(calculateRouteAndFare, 500);
    return () => clearTimeout(timer);
  }, [selectedCategory, pickup, destination]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setBookingResult(null);
    setRidePhase(RIDE_PHASES.NONE);
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
        setRidePhase(RIDE_PHASES.BOOKED);
        setOtpEntry('');
        setOtpError('');
        fetchMyBookings();
      }
    } catch (err) {
      alert(`Booking Failed: ${err.message || 'Server error'}`);
    } finally { setLoading(false); }
  };

  // Simulate driver verifying OTP to start ride
  const handleVerifyOtp = () => {
    const correctOtp = bookingResult?.ride_otp || bookingResult?.driver?.rideOtp;
    if (otpEntry === correctOtp) {
      setRidePhase(RIDE_PHASES.RIDE_STARTED);
      setOtpError('');
      setSimulatingRide(true);
      // Simulate ride completion after 5 seconds
      setTimeout(() => {
        setRidePhase(RIDE_PHASES.COMPLETED);
        setSimulatingRide(false);
      }, 5000);
    } else {
      setOtpError(`Invalid OTP. Correct OTP is: ${correctOtp}`);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const res = await api.get('/vehicles/my-bookings');
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list)) setMyBookings(list);
    } catch {}
  };

  useEffect(() => { if (activeTab === 'history') fetchMyBookings(); }, [activeTab]);

  const cardBg = darkMode ? 'bg-slate-800/90 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';

  // ---- Ride Status Panel ----
  const RideStatusPanel = () => {
    if (!bookingResult || ridePhase === RIDE_PHASES.NONE) return null;

    return (
      <div className={`${cardBg} rounded-3xl border shadow-xl overflow-hidden`}>
        {/* Status Header */}
        <div className={`px-6 py-4 flex items-center gap-3 ${
          ridePhase === RIDE_PHASES.BOOKED ? 'bg-gradient-to-r from-blue-700 to-blue-900' :
          ridePhase === RIDE_PHASES.RIDE_STARTED ? 'bg-gradient-to-r from-amber-600 to-orange-600' :
          ridePhase === RIDE_PHASES.COMPLETED ? 'bg-gradient-to-r from-emerald-600 to-teal-700' :
          'bg-gradient-to-r from-slate-700 to-slate-900'
        } text-white`}>
          {ridePhase === RIDE_PHASES.BOOKED && <KeyRound className="w-5 h-5 text-yellow-300"/>}
          {ridePhase === RIDE_PHASES.RIDE_STARTED && <PlayCircle className="w-5 h-5 text-white animate-pulse"/>}
          {ridePhase === RIDE_PHASES.COMPLETED && <FlagTriangleRight className="w-5 h-5 text-white"/>}
          <div>
            <h3 className="text-sm font-extrabold m-0">
              {ridePhase === RIDE_PHASES.BOOKED && '🔑 Ride Booked — Share OTP with Driver'}
              {ridePhase === RIDE_PHASES.RIDE_STARTED && '🚗 Ride In Progress...'}
              {ridePhase === RIDE_PHASES.COMPLETED && '🏁 Ride Complete — Pay Now'}
            </h3>
            <p className="text-[10px] text-white/70 m-0">{bookingResult.booking_code}</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Driver Info */}
          <div className="flex items-center gap-3">
            <img
              src={bookingResult.driver_photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'}
              alt="Driver"
              className="w-14 h-14 rounded-full object-cover border-2 border-emerald-400 shrink-0"
            />
            <div>
              <h4 className="text-sm font-extrabold m-0">{bookingResult.driver_name || 'Karthik Raja'}</h4>
              <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500"/>
                {bookingResult.driver_rating || 4.95} · Verified Driver
              </div>
              <span className="text-[11px] font-mono text-slate-400">🚗 {bookingResult.vehicle_registration || 'TN-37-RS-1001'}</span>
            </div>
            <a href={`tel:${bookingResult.driver_phone || '+919443322110'}`}
              className="ml-auto bg-emerald-100 text-emerald-700 rounded-xl p-2.5 hover:bg-emerald-200 transition-colors">
              <Phone className="w-4 h-4"/>
            </a>
          </div>

          {/* Route Info */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-900 space-y-1">
            <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-emerald-600"/><span>{bookingResult.pickup_location || pickup}</span></div>
            <div className="flex items-center gap-2 pl-1.5 text-slate-400 text-[10px]">↓ {distanceKm} km · ~{estimatedTimeMins} min</div>
            <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-red-500"/><span>{bookingResult.destination || destination}</span></div>
          </div>

          {/* Fare Info */}
          <div className="flex justify-between items-center text-xs font-bold border-t border-slate-100 pt-3">
            <span className="text-slate-500">Estimated Fare</span>
            <span className="text-lg font-black text-[#0D47A1]">₹{bookingResult.estimated_fare || fareEstimate?.estimatedFare}</span>
          </div>

          {/* ===== OTP PHASE ===== */}
          {ridePhase === RIDE_PHASES.BOOKED && (
            <div className="space-y-4">
              {/* Big OTP Display */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0D47A1] to-blue-800 text-white text-center shadow-lg">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-1">Your Ride OTP</p>
                <div className="text-4xl font-black tracking-[0.35em] py-2 letter-spacing-wide">
                  {bookingResult.ride_otp || bookingResult.driver?.rideOtp || '------'}
                </div>
                <p className="text-[10px] text-blue-200 font-semibold">Share this 6-digit OTP with the driver to start your ride</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/>
                <span>Never share your OTP with anyone except the assigned driver face-to-face at pickup.</span>
              </div>

              {/* Simulate OTP Entry (Driver's perspective) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <p className="text-[10px] font-extrabold uppercase text-slate-400">Driver Verification (Enter OTP to Start Ride)</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpEntry}
                    onChange={e => { setOtpEntry(e.target.value.replace(/\D/g,'')); setOtpError(''); }}
                    placeholder="Enter 6-digit OTP"
                    className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-mono font-bold text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0D47A1] ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                  />
                  <button onClick={handleVerifyOtp} disabled={otpEntry.length !== 6}
                    className="px-4 py-2.5 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs hover:bg-blue-800 transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4"/>
                    Start Ride
                  </button>
                </div>
                {otpError && <p className="text-[10px] text-red-600 font-semibold">{otpError}</p>}
                <p className="text-[10px] text-slate-400">Hint: OTP shown above. In real app, driver enters it in their app.</p>
              </div>
            </div>
          )}

          {/* ===== RIDE IN PROGRESS ===== */}
          {ridePhase === RIDE_PHASES.RIDE_STARTED && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-amber-600 shrink-0"/>
                <div>
                  <p className="font-extrabold m-0">Ride In Progress</p>
                  <p className="font-medium m-0 text-amber-700">Your ride has started. Payment will be collected at destination.</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700 text-center">
                🔒 Payment locked until ride completion. No upfront payment required.
              </div>
            </div>
          )}

          {/* ===== PAYMENT AT END ===== */}
          {ridePhase === RIDE_PHASES.COMPLETED && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-3">
                <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0"/>
                <div>
                  <p className="font-extrabold m-0">You've Arrived!</p>
                  <p className="font-medium m-0 text-emerald-700">Ride completed successfully. Please pay the driver now.</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer">
                <Wallet className="w-5 h-5"/>
                Pay ₹{bookingResult.estimated_fare || fareEstimate?.estimatedFare} — End of Ride
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
      } backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <Link to="/" className={`p-2.5 rounded-xl border decoration-none ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className={`text-xl font-extrabold m-0 flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>
              <Car className="w-6 h-6 text-blue-600" /> Dynamic Vehicle & Taxi Dispatch Hub
            </h1>
            <p className={`text-xs font-semibold m-0 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              OTP-secured rides · Pay at destination · 24/7 Police Command link
            </p>
          </div>
        </div>

        <div className="flex bg-slate-200/80 p-1 rounded-xl">
          {['book','history'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === tab ? 'bg-[#0D47A1] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-300'}`}>
              {tab === 'book' ? 'Book Taxi / Cab' : `My Rides (${myBookings.length})`}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'book' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className={`lg:col-span-2 ${darkMode ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-900'} backdrop-blur-md p-6 rounded-3xl border shadow-md space-y-6`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-blue-400' : 'text-blue-900'} m-0`}>1. Select Vehicle Category</h2>
              {isRouting && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin"/>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: 'scooter', label: 'Scooter / Bike', icon: Bike, desc: '1 Pass • Quick City' },
                { key: 'hatchback', label: 'Economy Hatch', icon: Car, desc: '3 Pass • Budget' },
                { key: 'sedan', label: 'Comfort Sedan', icon: Car, desc: '4 Pass • AC Deluxe' },
                { key: 'suv', label: 'Safety SUV', icon: Truck, desc: '6 Pass • High Clearance' },
                { key: 'van', label: 'Group Minivan', icon: Bus, desc: '10 Pass • Tourist Guide' }
              ].map(v => {
                const Icon = v.icon;
                const isSelected = selectedCategory === v.key;
                return (
                  <button key={v.key} type="button" onClick={() => setSelectedCategory(v.key)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected ? 'bg-blue-50 border-[#0D47A1] ring-2 ring-[#0D47A1]/20 shadow-sm' :
                      darkMode ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}>
                    <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-[#0D47A1]' : 'text-slate-400'}`} />
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
                    <input type="text" value={pickup} onChange={e => setPickup(e.target.value)} required
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}/>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Destination</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-red-500 absolute left-3 top-3" />
                    <input type="text" value={destination} onChange={e => setDestination(e.target.value)} required
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}/>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-bold flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#0D47A1]">
                  <Route className="w-4 h-4 text-blue-600"/>
                  <span>Auto-Calculated Route: <strong>{distanceKm} km</strong></span>
                </div>
                <span className="text-slate-600">Est. Time: <strong>~{estimatedTimeMins} mins</strong></span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Date</label>
                  <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} required
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}/>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Pickup Time</label>
                  <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} required
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}/>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Passengers</label>
                  <select value={passengers} onChange={e => setPassengers(parseInt(e.target.value))}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}>
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} Traveler(s)</option>)}
                  </select>
                </div>
              </div>

              {/* Pay-at-end notice */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-[11px] font-semibold">
                <Wallet className="w-4 h-4 text-emerald-600 shrink-0"/>
                <span><strong>Pay at destination</strong> — No upfront payment. You'll be asked to pay via GPay/UPI/Card after your ride completes.</span>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs uppercase tracking-wider hover:bg-blue-800 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                {loading ? 'Assigning Verified Driver...' : <><span>Confirm Booking & Get Ride OTP</span><KeyRound className="w-4 h-4"/></>}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Fare breakdown */}
            <div className={`${cardBg} p-6 rounded-3xl border shadow-xs space-y-4`}>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 m-0">Dynamic Fare Breakdown</h3>
              {fareEstimate && (
                <div className="space-y-2 text-xs font-semibold border-b pb-3 border-slate-100">
                  <div className="flex justify-between text-slate-600"><span>Base Fare:</span><span>₹{fareEstimate.baseFare}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Distance ({distanceKm} km @ ₹{fareEstimate.perKmRate}/km):</span><span>₹{fareEstimate.distanceCharge}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Taxes & Fees (12%):</span><span>₹{fareEstimate.taxesFees}</span></div>
                  <div className="flex justify-between text-base font-black text-[#0D47A1] pt-1"><span>Total Fare:</span><span>₹{fareEstimate.estimatedFare}</span></div>
                </div>
              )}
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-start gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"/>
                <span>All drivers undergo background identity verification. 24/7 Police Command link active during transit.</span>
              </div>
            </div>

            {/* Ride Status Panel */}
            <RideStatusPanel />
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
              {myBookings.map(b => (
                <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-extrabold text-[#0D47A1] block">{b.booking_code} · {b.vehicle_category?.toUpperCase()}</span>
                      <span className="text-xs text-slate-700 font-bold block">{b.pickup_location} → {b.destination}</span>
                      <span className="text-[11px] text-slate-500 font-semibold">Driver: {b.driver_name} ({b.vehicle_registration})</span>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="text-sm font-black text-slate-900 block">₹{b.estimated_fare}</span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                        b.payment_status === 'PAID' || b.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>{b.payment_status || b.status}</span>
                    </div>
                  </div>
                  {b.ride_otp && b.status === 'OTP_PENDING' && (
                    <div className="mt-3 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-center">
                      <span className="text-[10px] text-blue-700 font-semibold">Ride OTP: </span>
                      <span className="text-sm font-black text-[#0D47A1] tracking-widest">{b.ride_otp}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment Modal — Post Ride */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        isPostRide={true}
        bookingDetails={{
          amount: bookingResult?.estimated_fare,
          booking_code: bookingResult?.booking_code,
          title: `${selectedCategory.toUpperCase()} Cab Ride — Post-Ride Payment`,
          type: 'vehicle'
        }}
        onPaymentSuccess={() => {
          setRidePhase(RIDE_PHASES.PAID);
          setShowPaymentModal(false);
          fetchMyBookings();
        }}
        darkMode={darkMode}
      />
    </div>
  );
};

export default VehicleBooking;
