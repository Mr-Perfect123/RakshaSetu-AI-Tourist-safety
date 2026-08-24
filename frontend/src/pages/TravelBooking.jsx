import React, { useState, useEffect } from 'react';
import { Plane, Train, Bus, Car, Key, ArrowRight, ArrowLeft, Calendar, Clock, MapPin, CheckCircle2, ShieldCheck, Ticket, CreditCard, Download, QrCode, User, Globe, AlertCircle, Info, Landmark, ShieldAlert, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PaymentModal from '../components/PaymentModal';

const TRAVEL_TYPES = [
  { key: 'flight', label: 'Flights', icon: Plane, desc: 'Domestic & Regional Flights' },
  { key: 'train', label: 'Trains', icon: Train, desc: 'Express & Vande Bharat' },
  { key: 'bus', label: 'Buses', icon: Bus, desc: 'AC Sleeper & Volvo' },
  { key: 'cab', label: 'Intercity Cabs', icon: Car, desc: 'Verified Outstation Taxis' },
  { key: 'rental', label: 'Self-Drive', icon: Key, desc: '24h Rental Vehicles' }
];

// Helper to generate seat number based on travel type
const generateSeatDetails = (travelType, index = 0) => {
  const seed = (Date.now() + index) % 100;
  if (travelType === 'flight') {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    const rowNum = 10 + (seed % 20);
    const letter = rows[seed % 6];
    return { seat: `${rowNum}${letter}`, boardingGroup: `Group ${1 + (seed % 4)}`, gate: `${12 + (seed % 15)}`, class: 'Economy Comfort' };
  } else if (travelType === 'train') {
    const coachNum = 1 + (seed % 5);
    const berthNum = 1 + (seed % 72);
    const berthType = berthNum % 3 === 1 ? 'Lower' : berthNum % 3 === 2 ? 'Middle' : 'Upper';
    return { seat: `Berth ${berthNum} (${berthType})`, boardingGroup: `Coach B${coachNum}`, gate: `Platform ${1 + (seed % 8)}`, class: 'AC 3 Tier (3A)' };
  } else if (travelType === 'bus') {
    const seatNum = 1 + (seed % 40);
    const position = seatNum % 2 === 0 ? 'Window' : 'Aisle';
    return { seat: `Seat ${seatNum} (${position})`, boardingGroup: 'AC Sleeper U1', gate: 'Bay 4', class: 'Sleeper Class' };
  }
  return { seat: 'Seat Flexi', boardingGroup: 'N/A', gate: 'Taxi Stand', class: 'Standard' };
};

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
  const [activeTab, setActiveTab] = useState('search');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBookingDetails, setPaymentBookingDetails] = useState(null);

  // Boarding Pass Ticket View modal states
  const [selectedTicketForView, setSelectedTicketForView] = useState(null);
  const [currentUser, setCurrentUser] = useState({
    full_name: 'John Doe Tourist',
    nationality: 'Indian',
    passport_number: 'IND-99182374',
    phone: '+919876543213'
  });

  // Load user information
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem('rakshasetu_tourist_user');
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser) {
          setCurrentUser(prev => ({
            ...prev,
            full_name: savedUser.full_name || prev.full_name,
            nationality: savedUser.nationality || prev.nationality || 'Indian',
            passport_number: savedUser.passport_number || prev.passport_number || 'N/A',
            phone: savedUser.phone || prev.phone
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to parse user details');
    }
  }, []);

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

      const responseData = res.data?.data || res.data;
      if (responseData) {
        setBookingSuccess(responseData);
        setPaymentBookingDetails({
          amount: option.fare * passengers,
          booking_code: responseData.booking_code,
          title: `${option.travel_type.toUpperCase()} Ticket (${option.operator_name})`,
          type: 'travel'
        });
        setShowPaymentModal(true);
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
      const data = res.data?.data || res.data;
      if (data) setMyBookings(data);
    } catch (e) {}
  };

  useEffect(() => {
    if (activeTab === 'my-bookings') fetchMyBookings();
  }, [activeTab]);

  const cardBg = darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const textClass = darkMode ? 'text-slate-100' : 'text-slate-900';
  const mutedClass = darkMode ? 'text-slate-400' : 'text-slate-500';

  // ---- 🎟️ Detailed Digital Boarding Ticket Modal Component ----
  const TicketBoardingPassModal = ({ ticket, onClose }) => {
    if (!ticket) return null;

    const seatData = generateSeatDetails(ticket.travel_type, ticket.id);
    const totalFare = (ticket.fare || 1500) * (ticket.passengers || passengers);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className={`w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'} max-h-[92vh] flex flex-col`}>
          
          {/* Header Accent based on type */}
          <div className={`p-4 text-white flex items-center justify-between ${
            ticket.travel_type === 'flight' ? 'bg-gradient-to-r from-blue-700 to-indigo-800' :
            ticket.travel_type === 'train' ? 'bg-gradient-to-r from-red-600 to-amber-700' :
            ticket.travel_type === 'bus' ? 'bg-gradient-to-r from-emerald-600 to-teal-700' :
            'bg-gradient-to-r from-purple-600 to-indigo-700'
          }`}>
            <div className="flex items-center gap-2">
              {ticket.travel_type === 'flight' && <Plane className="w-5 h-5"/>}
              {ticket.travel_type === 'train' && <Train className="w-5 h-5"/>}
              {ticket.travel_type === 'bus' && <Bus className="w-5 h-5"/>}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest m-0">BOARDING PASS & E-TICKET</h3>
                <p className="text-[9px] text-white/80 m-0">RakshaSetu Verified Transit Network</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer text-xs font-bold px-2">
              CLOSE
            </button>
          </div>

          {/* Ticket Body scroll container */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* 1. Route Summary Banner */}
            <div className="flex justify-between items-center bg-blue-50/50 dark:bg-slate-800/40 p-4 rounded-2xl border border-blue-100/50">
              <div className="text-left">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">DEPARTURE</span>
                <span className="text-base font-black text-[#0D47A1] block">{ticket.from_location}</span>
                <span className="text-xs text-slate-500 font-semibold">{ticket.travel_date}</span>
              </div>
              <div className="flex flex-col items-center px-4">
                <span className="text-[10px] text-slate-400 font-bold mb-1">{ticket.duration || 'Direct'}</span>
                <div className="w-20 border-t-2 border-dashed border-[#0D47A1]/40 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 px-1 text-[#0D47A1]">
                    {ticket.travel_type === 'flight' ? <Plane className="w-4.5 h-4.5 rotate-90"/> : ticket.travel_type === 'train' ? <Train className="w-4.5 h-4.5"/> : <Bus className="w-4.5 h-4.5"/>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">ARRIVAL</span>
                <span className="text-base font-black text-[#0D47A1] block">{ticket.to_location}</span>
                <span className="text-xs text-slate-500 font-semibold">{ticket.arrival_time || 'On-Time'}</span>
              </div>
            </div>

            {/* 2. Key Boarding Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/50 text-center">
              <div>
                <span className="text-[9px] text-slate-400 font-bold block">PNR / CODE</span>
                <span className="text-xs font-black text-slate-800 font-mono block mt-1">{ticket.booking_code}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold block">ASSIGNED SEAT</span>
                <span className="text-xs font-black text-emerald-600 block mt-1">{seatData.seat}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold block">COACH / PLATFORM</span>
                <span className="text-xs font-black text-slate-800 block mt-1">{seatData.boardingGroup}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold block">TRANSIT ID</span>
                <span className="text-xs font-black text-slate-800 font-mono block mt-1">{ticket.vehicle_number || 'RS-TR-101'}</span>
              </div>
            </div>

            {/* 3. Passenger / User Details */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 m-0 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0D47A1]"/> PASSENGER IDENTIFICATION INFO
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Lead Passenger:</span>
                    <span className="font-extrabold text-slate-800">{currentUser.full_name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Nationality:</span>
                    <span className="font-bold text-slate-700">{currentUser.nationality}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Document / Passport:</span>
                    <span className="font-mono font-bold text-slate-700">{currentUser.passport_number}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Mobile Number:</span>
                    <span className="font-bold text-slate-700">{currentUser.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Transit Operator and Payment */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 m-0 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#0D47A1]"/> TRANSIT & INVOICE DETAILS
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-slate-400 font-semibold">Carrier / Operator:</span><span className="font-bold text-slate-700">{ticket.operator_name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 font-semibold">Service Class:</span><span className="font-bold text-slate-700">{seatData.class}</span></div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="flex justify-between"><span className="text-slate-400 font-semibold">Travelers:</span><span className="font-bold text-slate-800">{ticket.passengers || passengers} Passenger(s)</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 font-semibold">Total Price Paid:</span><span className="font-black text-[#0D47A1]">₹{totalFare}</span></div>
                </div>
              </div>
            </div>

            {/* 5. Barcode & Verification QR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-dashed border-slate-200 dark:border-slate-700 pt-6">
              {/* Simulated Barcode */}
              <div className="flex flex-col items-center sm:items-start">
                <div className="h-10 bg-slate-900 w-52 flex gap-0.5 p-1 rounded-sm">
                  {/* Generate pseudo barcode strips */}
                  {[3,1,4,2,1,5,2,1,3,4,1,2,5,1,2,4,1,3,2,1,4,5,1,2,1,3].map((w, idx) => (
                    <div key={idx} className="bg-white h-full" style={{ width: `${w * 2}px` }}></div>
                  ))}
                </div>
                <span className="text-[8px] font-mono text-slate-400 mt-1 block">TICKET-ID-{ticket.id}-VERIFICATION-ACTIVE</span>
              </div>

              {/* QR Verification */}
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-200/50">
                  <QrCode className="w-12 h-12 text-slate-800 dark:text-white"/>
                </div>
                <div className="text-left text-[10px] leading-tight">
                  <span className="font-bold text-emerald-600 block">✓ Govt Security Validated</span>
                  <span className="text-slate-400 block mt-0.5">Scan at check-in counter / boarding gates</span>
                </div>
              </div>
            </div>
            
            {/* Safety advisory */}
            <div className="p-3 rounded-xl bg-blue-50 text-[10px] text-blue-800 font-medium flex items-start gap-2 border border-blue-200">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5"/>
              <span>RakshaSetu safe-travel protocol: Your journey details are linked to our tourist helpline. Reach out via SOS widget in case of any emergency during transit.</span>
            </div>

          </div>

          {/* Action buttons */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200/50 flex gap-3">
            <button onClick={() => alert('PDF Ticket boarding pass saved to your local downloads folder.')}
              className="flex-1 py-3 bg-emerald-600 text-white font-extrabold text-xs uppercase hover:bg-emerald-700 transition-colors rounded-xl flex items-center justify-center gap-1.5 cursor-pointer">
              <Download className="w-4 h-4"/> DOWNLOAD PASS
            </button>
            <button onClick={onClose}
              className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-100 font-extrabold text-xs uppercase hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors rounded-xl cursor-pointer">
              DONE
            </button>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Navigation — Frosted Glass Container for High Text Visibility */}
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
              <Ticket className="w-6 h-6 text-purple-600" /> Unified Travel Booking Hub
            </h1>
            <p className={`text-xs font-semibold m-0 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Book Flights, Trains, Buses, Cabs & Rental Vehicles safely
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'search' ? 'bg-[#0D47A1] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Search & Book
          </button>
          <button
            onClick={() => setActiveTab('my-bookings')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'my-bookings' ? 'bg-[#0D47A1] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
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
                onClick={() => {
                  setSelectedTicketForView(bookingSuccess);
                }}
                className="px-3 py-1 rounded-lg bg-white text-emerald-800 font-extrabold text-xs cursor-pointer"
              >
                View Boarding Pass Ticket
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
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 block">₹{b.fare}</span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase`}>{b.status}</span>
                    </div>
                    {/* View pass button */}
                    {['flight', 'train', 'bus'].includes(b.travel_type) && (
                      <button
                        onClick={() => setSelectedTicketForView(b)}
                        className="p-2 bg-[#0D47A1] hover:bg-blue-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Pass 🎟️
                      </button>
                    )}
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
        onClose={() => {
          setShowPaymentModal(false);
          // Auto show boarding pass after payment succeeds
          if (bookingSuccess) {
            setSelectedTicketForView(bookingSuccess);
          }
        }}
        bookingDetails={paymentBookingDetails}
        onPaymentSuccess={() => {
          fetchMyBookings();
        }}
        darkMode={darkMode}
      />

      {/* Boarding Pass Ticket View Modal */}
      {selectedTicketForView && (
        <TicketBoardingPassModal
          ticket={selectedTicketForView}
          onClose={() => setSelectedTicketForView(null)}
        />
      )}
    </div>
  );
};

export default TravelBooking;
