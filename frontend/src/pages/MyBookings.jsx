import React, { useState, useEffect } from 'react';
import { Ticket, Car, Utensils, Plane, Calendar, Clock, MapPin, CheckCircle, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const MyBookings = ({ darkMode }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [vehicleBookings, setVehicleBookings] = useState([]);
  const [travelBookings, setTravelBookings] = useState([]);
  const [foodBookings, setFoodBookings] = useState([]);

  const fetchAllBookings = async () => {
    setLoading(true);
    try {
      const [vRes, tRes, fRes] = await Promise.allSettled([
        api.get('/vehicles/my-bookings'),
        api.get('/travel/my-bookings'),
        api.get('/food/my-bookings')
      ]);

      if (vRes.status === 'fulfilled') {
        const list = vRes.value.data?.data || vRes.value.data || [];
        setVehicleBookings(Array.isArray(list) ? list : []);
      }
      if (tRes.status === 'fulfilled') {
        const list = tRes.value.data?.data || tRes.value.data || [];
        setTravelBookings(Array.isArray(list) ? list : []);
      }
      if (fRes.status === 'fulfilled') {
        const list = fRes.value.data?.data || fRes.value.data || [];
        setFoodBookings(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.warn('Error fetching bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const allList = [
    ...vehicleBookings.map((b) => ({ ...b, itemType: 'vehicle' })),
    ...travelBookings.map((b) => ({ ...b, itemType: 'travel' })),
    ...foodBookings.map((b) => ({ ...b, itemType: 'food' }))
  ].sort((a, b) => new Date(b.created_at || b.booking_date || Date.now()) - new Date(a.created_at || a.booking_date || Date.now()));

  const filteredList = activeTab === 'all'
    ? allList
    : allList.filter((item) => item.itemType === activeTab);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className={`p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 m-0">
            <Ticket className="w-7 h-7 text-purple-600" />
            {t('booking.myBookings', 'My Bookings')}
          </h2>
          <p className={`text-xs font-medium m-0 mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Track and manage all your cab rides, travel tickets, dining reservations, and tourist bookings.
          </p>
        </div>

        <button
          onClick={fetchAllBookings}
          className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
            darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: t('booking.allBookings', 'All Bookings'), icon: Ticket },
          { id: 'vehicle', label: t('booking.ridesTab', 'Cab Rides'), icon: Car },
          { id: 'travel', label: t('booking.travelTab', 'Travel'), icon: Plane },
          { id: 'food', label: t('booking.foodTab', 'Dining'), icon: Utensils }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-2xl border text-xs font-extrabold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                isActive
                  ? 'bg-[#0D47A1] border-[#0D47A1] text-white shadow-md'
                  : darkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-400 font-semibold">Loading your bookings...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${
          darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-600" />
          <h3 className="text-base font-extrabold text-slate-700 dark:text-slate-300">
            {t('booking.noBookings', 'No bookings found.')}
          </h3>
          <p className="text-xs max-w-sm mx-auto mt-1">
            Book cabs, travel tickets, or restaurant tables directly from RakshaSetu to view them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((item, idx) => {
            const isVehicle = item.itemType === 'vehicle';
            const isTravel = item.itemType === 'travel';
            const isFood = item.itemType === 'food';

            const title = isVehicle
              ? `Cab Ride (${item.vehicle_category?.toUpperCase() || 'Taxi'})`
              : isTravel
                ? `Travel Ticket (${item.mode?.toUpperCase() || 'Bus/Train'})`
                : item.restaurant_name || 'Restaurant Dining Booking';

            const sub = isVehicle
              ? `${item.pickup_location} → ${item.destination}`
              : isTravel
                ? `${item.origin} → ${item.destination}`
                : `Table for ${item.guests || 2} guests`;

            const code = item.booking_code || `BK-${item.id}`;
            const fare = item.estimated_fare || item.final_fare || item.total_price || item.amount || 250;
            const status = item.status || 'CONFIRMED';
            const paymentStatus = item.payment_status || 'PENDING';

            return (
              <div
                key={item.id || idx}
                className={`p-5 rounded-3xl border shadow-xs hover:shadow-md transition-all space-y-3 ${
                  darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white ${
                      isVehicle ? 'bg-blue-600' : isTravel ? 'bg-purple-600' : 'bg-amber-600'
                    }`}>
                      {isVehicle ? <Car className="w-5 h-5" /> : isTravel ? <Plane className="w-5 h-5" /> : <Utensils className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold m-0">{title}</h4>
                      <span className="text-[10px] font-mono text-slate-400">{code}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                    status === 'COMPLETED' || status === 'CONFIRMED' || status === 'PAID'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}>
                    {status}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <p className="font-semibold flex items-center gap-1 opacity-90 m-0">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span className="truncate">{sub}</span>
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {item.booking_date || 'Today'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.booking_time || '10:00 AM'}
                    </span>
                  </div>
                </div>

                {item.ride_otp && (
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between">
                    <span className="font-bold">Ride OTP:</span>
                    <span className="font-black text-sm tracking-wider font-mono">{item.ride_otp}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Total Amount</span>
                    <span className="text-base font-black text-[#0D47A1] dark:text-blue-400">₹{fare}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                    paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Payment: {paymentStatus}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
