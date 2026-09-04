import React, { useEffect, useState } from 'react';
import { Shield, ShieldAlert, AlertTriangle, ShieldCheck, Users, Activity, CheckCircle, Clock, Bell, Car, Utensils, Ticket, MapPin } from 'lucide-react';
import SosLiveMap from '../components/SosLiveMap';
import api from '../services/api';
import socket from '../services/socket';
import { useLanguage } from '../context/LanguageContext';

const Dashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    activeSosCount: 3,
    totalUsersCount: 1248,
    pendingIncidentsCount: 3,
    safeLocationsCount: 24,
    recentSos: [
      { id: 101, sos_code: 'SOS-RS-8891', tourist_name: 'John Smith (UK)', phone: '+44 7911 123456', latitude: 28.6315, longitude: 77.2167, address: 'Connaught Place, New Delhi', status: 'active', created_at: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: 102, sos_code: 'SOS-RS-4420', tourist_name: 'Elena Rostova', phone: '+7 912 345 6789', latitude: 11.0168, longitude: 76.9558, address: 'Marudamalai Temple, Coimbatore', status: 'dispatched', created_at: new Date(Date.now() - 25 * 60000).toISOString() },
      { id: 103, sos_code: 'SOS-RS-9912', tourist_name: 'Karthik Raja', phone: '+91 94433 22110', latitude: 13.0827, longitude: 80.2707, address: 'Marina Beach, Chennai', status: 'active', created_at: new Date(Date.now() - 2 * 60000).toISOString() }
    ],
    safeLocations: [
      { id: 1, name: 'Central Police Station Connaught Place', type: 'police_station', latitude: 28.6315, longitude: 77.2167, phone: '+911123363364', address: 'Connaught Place, New Delhi' },
      { id: 2, name: 'Ram Manohar Lohia Hospital', type: 'hospital', latitude: 28.6250, longitude: 77.2000, phone: '+911123365555', address: 'Baba Kharak Singh Marg' },
      { id: 3, name: 'Coimbatore City Police Command Center', type: 'police_station', latitude: 11.0168, longitude: 76.9558, phone: '+914222300970', address: 'Avinashi Rd, Coimbatore' }
    ]
  });

  // Live tourist locations from WebSocket
  const [liveTourists, setLiveTourists] = useState([]);
  const [notification, setNotification] = useState(null);

  // Live stream of all tourist activities (Vehicle, Restaurant/Food, Travel, SOS, Incident)
  const [touristActivities, setTouristActivities] = useState([
    {
      id: 101,
      type: 'vehicle_booking',
      title: 'Ride Booked (SEDAN)',
      description: 'Pickup: Connaught Place → Drop: Red Fort (Fare: ₹180)',
      touristName: 'John Doe Tourist',
      timestamp: new Date().toLocaleTimeString()
    },
    {
      id: 102,
      type: 'food_booking',
      title: 'Restaurant Order Placed',
      description: 'Ordered Butter Chicken & Naan @ Karim\'s Delhi (₹450)',
      touristName: 'Emily Clark',
      timestamp: new Date().toLocaleTimeString()
    },
    {
      id: 103,
      type: 'travel_booking',
      title: 'Travel Ticket Booked (TRAIN)',
      description: 'Coimbatore → Chennai via Vande Bharat Express (₹1,365)',
      touristName: 'Karthik Raja',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        const payload = res.data?.data || res.data || {};
        if (payload && typeof payload === 'object') {
          setStats(prev => ({
            ...prev,
            ...payload,
            recentSos: Array.isArray(payload.recentSos) ? payload.recentSos : (prev.recentSos || []),
            safeLocations: Array.isArray(payload.safeLocations) ? payload.safeLocations : (prev.safeLocations || [])
          }));
        }
      } catch (err) {
        console.warn('Using default initial stats');
      }

      // Also try to fetch active SOS
      try {
        const sosRes = await api.get('/sos/active');
        const sosList = sosRes.data?.data || sosRes.data || [];
        if (Array.isArray(sosList)) {
          setStats(prev => ({
            ...prev,
            activeSosCount: sosList.length,
            recentSos: sosList
          }));
        }
      } catch (err) {
        console.warn('SOS fetch from API unavailable, using WebSocket feed');
      }

      // Fetch safe locations
      try {
        const locRes = await api.get('/admin/safe-locations');
        const locList = locRes.data?.data || locRes.data || [];
        if (Array.isArray(locList) && locList.length > 0) {
          setStats(prev => ({ ...prev, safeLocations: locList, safeLocationsCount: locList.length }));
        }
      } catch (err) {
        console.warn('Using default safe locations');
      }

      // Fetch recent tourist activities
      try {
        const actRes = await api.get('/activities?limit=30');
        const actList = actRes.data?.data || actRes.data || [];
        if (Array.isArray(actList) && actList.length > 0) {
          setTouristActivities(actList);
        }
      } catch (err) {}
    };

    loadStats();

    // Socket: Tourist Activity Listeners
    socket.on('tourist_activity', (act) => {
      setTouristActivities(prev => [act, ...prev.slice(0, 29)]);
    });
    socket.on('tourist:activity', (act) => {
      setTouristActivities(prev => [act, ...prev.slice(0, 29)]);
    });

    // Socket: new SOS alert
    socket.on('new_sos_alert', (newSos) => {
      setStats((prev) => {
        const normalized = {
          id: newSos.id || Date.now(),
          sos_code: newSos.sos_code || newSos.sosCode || `SOS-${Date.now()}`,
          tourist_name: newSos.touristName || newSos.tourist_name || 'Tourist',
          phone: newSos.touristPhone || newSos.phone,
          address: newSos.address || 'GPS Broadcast',
          latitude: newSos.latitude || 28.6139,
          longitude: newSos.longitude || 77.2090,
          trigger_type: newSos.trigger_type || newSos.triggerType || 'one_tap',
          nationality: newSos.nationality,
          status: 'active',
          created_at: newSos.created_at || new Date().toISOString()
        };

        const exists = prev.recentSos.some(s => s.sos_code === normalized.sos_code);
        if (exists) return prev;

        return {
          ...prev,
          activeSosCount: prev.activeSosCount + 1,
          recentSos: [normalized, ...prev.recentSos]
        };
      });

      // Show notification
      setNotification({
        message: `🚨 ${newSos.touristName || newSos.tourist_name || 'Tourist'} triggered SOS! Code: ${newSos.sos_code || newSos.sosCode}`,
        timestamp: new Date().toLocaleTimeString()
      });
      setTimeout(() => setNotification(null), 8000);
    });

    // Socket: General Tourist Activity Stream (Vehicle, Food, Travel, Incidents)
    socket.on('tourist_activity', (act) => {
      setTouristActivities((prev) => [
        {
          id: act.id || Date.now(),
          type: act.type,
          title: act.title,
          description: act.description,
          touristName: act.touristName || 'Tourist',
          timestamp: new Date(act.timestamp || Date.now()).toLocaleTimeString()
        },
        ...prev.slice(0, 35)
      ]);

      setNotification({
        message: `🔔 Live Activity: ${act.touristName || 'Tourist'} - ${act.title}`,
        timestamp: new Date().toLocaleTimeString()
      });
      setTimeout(() => setNotification(null), 7000);
    });

    socket.on('new_vehicle_booking', (booking) => {
      setTouristActivities((prev) => [
        {
          id: booking.id || Date.now(),
          type: 'vehicle_booking',
          title: booking.title || 'Vehicle Ride Booked',
          description: booking.description || 'Pickup → Destination',
          touristName: booking.touristName || 'Tourist',
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 35)
      ]);
    });

    socket.on('new_food_order', (order) => {
      setTouristActivities((prev) => [
        {
          id: order.id || Date.now(),
          type: 'food_booking',
          title: order.title || 'Restaurant / Food Order',
          description: order.description || 'Food order placed',
          touristName: order.touristName || 'Tourist',
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 35)
      ]);
    });

    socket.on('new_travel_booking', (booking) => {
      setTouristActivities((prev) => [
        {
          id: booking.id || Date.now(),
          type: 'travel_booking',
          title: booking.title || 'Travel Hub Booking',
          description: booking.description || 'Travel ticket confirmed',
          touristName: booking.touristName || 'Tourist',
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 35)
      ]);
    });

    // Socket: live tourist location updates
    socket.on('live_tourist_location', (data) => {
      setLiveTourists((prev) => {
        const existing = prev.findIndex((t) => t.userId === data.userId);
        const updated = {
          userId: data.userId,
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed || 0,
          touristName: data.touristName || `Tourist #${data.userId}`,
          timestamp: data.timestamp
        };
        if (existing >= 0) {
          const newList = [...prev];
          newList[existing] = updated;
          return newList;
        }
        return [...prev, updated];
      });
    });

    // Socket: tourist location revoked or sharing stopped
    socket.on('tourist_location_revoked', (data) => {
      if (data && data.userId) {
        setLiveTourists((prev) => prev.filter((t) => t.userId !== data.userId));
      }
    });

    socket.on('tourist_location_sharing_stopped', (data) => {
      if (data && data.userId) {
        setLiveTourists((prev) => prev.filter((t) => t.userId !== data.userId));
      }
    });

    // Socket: initial batch of all tourist locations
    socket.on('all_tourist_locations', (allLocations) => {
      if (Array.isArray(allLocations)) {
        setLiveTourists(allLocations);
      }
    });

    // Socket: tourist disconnected
    socket.on('tourist_disconnected', (data) => {
      setLiveTourists((prev) => prev.filter((t) => t.userId !== data.userId));
    });

    // Socket: SOS status updated
    socket.on('sos_status_updated', (data) => {
      setStats((prev) => ({
        ...prev,
        recentSos: prev.recentSos.map(s =>
          (s.id === data.sosId || s.sos_code === data.sosId)
            ? { ...s, status: data.status }
            : s
        ).filter(s => s.status !== 'cancelled'),
        activeSosCount: Math.max(0, prev.activeSosCount - (data.status === 'resolved' || data.status === 'cancelled' ? 1 : 0))
      }));
    });

    return () => {
      socket.off('new_sos_alert');
      socket.off('tourist_activity');
      socket.off('new_vehicle_booking');
      socket.off('new_food_order');
      socket.off('live_tourist_location');
      socket.off('tourist_location_revoked');
      socket.off('tourist_location_sharing_stopped');
      socket.off('new_travel_booking');
      socket.off('live_tourist_location');
      socket.off('all_tourist_locations');
      socket.off('tourist_disconnected');
      socket.off('sos_status_updated');
    };
  }, []);

  const getTimeSince = (dateStr) => {
    if (!dateStr) return 'Just Now';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just Now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'vehicle_booking':
        return <Car className="w-4 h-4 text-blue-600" />;
      case 'food_booking':
        return <Utensils className="w-4 h-4 text-amber-500" />;
      case 'travel_booking':
        return <Ticket className="w-4 h-4 text-purple-600" />;
      case 'sos_alert':
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
      case 'incident_report':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Activity className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar — Royal Ocean Gradient Banner */}
      <div className="bg-gradient-to-r from-[#0a2540] via-[#0D47A1] to-[#1e3a8a] text-white p-6 rounded-3xl shadow-xl flex items-center justify-between border border-blue-900/20">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5 m-0">
            <Shield className="w-6 h-6 text-emerald-400" /> {t('sidebar.dashboard', 'RakshaSetu Command & Safety Control Center')}
          </h1>
          <p className="text-xs font-semibold text-blue-100 m-0 mt-1">
            {t('navbar.subtitle', 'Real-time Emergency Dispatch, Live Tourist Telemetry & Incident Audit Sentinel')}
          </p>
        </div>
      </div>

      {/* SOS & Activity Notification Banner */}
      {notification && (
        <div className="p-4 rounded-2xl bg-indigo-900 text-white shadow-xl animate-pulse flex items-center justify-between gap-4 border border-indigo-700">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-indigo-300 animate-bounce" />
            <div>
              <p className="text-xs sm:text-sm font-bold m-0">{notification.message}</p>
              <p className="text-[10px] text-indigo-300 m-0">{notification.timestamp}</p>
            </div>
          </div>
          <button onClick={() => setNotification(null)} className="px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-bold hover:bg-white/30 cursor-pointer">
            {t('navbar.dismiss', 'Dismiss')}
          </button>
        </div>
      )}

      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-red-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('dashboard.activeSosKpi', 'Active Emergency SOS')}</p>
            <h3 className="text-3xl font-extrabold text-danger mt-1">{stats.activeSosCount}</h3>
            <p className="text-xs text-danger font-semibold mt-1 flex items-center gap-1">
              <Activity className={`w-3.5 h-3.5 ${stats.activeSosCount > 0 ? 'animate-spin' : ''}`} />
              {stats.activeSosCount > 0 ? 'High Priority Dispatch' : 'All Clear'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-danger/10 text-danger flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('dashboard.pendingIncidentsKpi', 'Pending Incidents')}</p>
            <h3 className="text-3xl font-extrabold text-warning mt-1">{stats.pendingIncidentsCount}</h3>
            <p className="text-xs text-slate-500 mt-1">Under Investigation</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-warning flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('dashboard.totalUsersKpi', 'Total Registered Tourists')}</p>
            <h3 className="text-3xl font-extrabold text-primary mt-1">{liveTourists.length || 1}</h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              Live GPS Tracked
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('dashboard.safeLocationsKpi', 'Safe Locations')}</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{stats.safeLocationsCount || stats.safeLocations?.length}</h3>
            <p className="text-xs text-slate-500 mt-1">Rides, Food, Travel, SOS</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map & Live SOS Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              {t('dashboard.liveMap', 'Live Spatial Emergency Command Map')}
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500 font-medium">
                {(liveTourists || []).length} {t('dashboard.touristsTracked', 'tourists tracked')}
              </span>
              <span className="text-slate-500 font-medium">
                {(stats.recentSos || []).filter(s => s.status === 'active').length} {t('dashboard.sosActive', 'SOS active')}
              </span>
            </div>
          </div>
          <div className="flex-1 w-full rounded-xl overflow-hidden">
            <SosLiveMap
              activeSosList={(stats.recentSos || []).filter(s => s.status === 'active')}
              safeLocations={stats.safeLocations || []}
              liveTourists={liveTourists || []}
            />
          </div>
        </div>

        {/* Live SOS Dispatch Stream Panel */}
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-danger flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> {t('dashboard.panicFeed', 'Live Panic Feed')}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-danger/10 text-danger text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-danger animate-ping"></span>
              {t('navbar.liveStatus', 'REALTIME')}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {(stats.recentSos || []).length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-slate-400 text-xs font-medium">{t('dashboard.noSos', 'No active SOS alerts in jurisdiction.')}</p>
                <p className="text-[10px] text-slate-400 mt-1">{t('dashboard.monitoring', 'Monitoring WebSocket for distress signals...')}</p>
              </div>
            ) : (
              (stats.recentSos || []).map((sos) => (
                <div key={sos.id || sos.sos_code} className={`p-3.5 rounded-xl border transition-colors ${
                  sos.status === 'active'
                    ? 'border-red-200 bg-red-50/40 hover:bg-red-50'
                    : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border ${
                        sos.status === 'active' ? 'text-danger border-red-200' : 'text-slate-500 border-slate-200'
                      }`}>
                        {(sos.trigger_type || 'One-Tap SOS').replace('_', ' ')}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 mt-2">{sos.tourist_name || 'Tourist'}</h4>
                      {sos.nationality && (
                        <p className="text-[10px] text-slate-400 mt-0.5">🌍 {sos.nationality}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {getTimeSince(sos.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{sos.address}</p>

                  <div className="mt-3 pt-2 border-t border-red-100/80 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-primary font-mono">{sos.sos_code}</span>
                    {sos.status === 'active' ? (
                      <span className="px-2 py-0.5 rounded-full bg-danger text-white text-[10px] font-bold animate-pulse">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {sos.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Real-time Tourist Activity Audit Stream Card (Rides, Restaurants, Travel Hub, Incidents) */}
      <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              {t('dashboard.activityStream', 'Live Tourist Activity Audit Stream (Rides, Food, Travel & Emergency)')}
            </h2>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
            {t('dashboard.realtimeFeed', 'Real-time Feed Active')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(touristActivities || []).map((act) => (
            <div key={act.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold flex items-center gap-1.5">
                  {getActivityIcon(act.type)}
                  <span>{act.title}</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">{act.timestamp}</span>
              </div>
              <p className="text-xs font-bold text-slate-800 m-0">👤 {act.touristName}</p>
              <p className="text-xs text-slate-600 font-medium m-0 leading-relaxed">{act.description}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
