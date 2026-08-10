import React, { useState, useEffect } from 'react';
import { ShieldCheck, Phone, MapPin, Star, ArrowLeft, Building2, Hospital } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const NearbyHelp = ({ darkMode }) => {
  const [locations, setLocations] = useState([
    { id: 1, name: 'Central Police Station Connaught Place', type: 'police_station', latitude: 28.6315, longitude: 77.2167, phone: '+911123363364', address: 'Block B, Connaught Place, New Delhi', distance: '0.8 km' },
    { id: 2, name: 'Ram Manohar Lohia Emergency Hospital', type: 'hospital', latitude: 28.6250, longitude: 77.2000, phone: '+911123365555', address: 'Baba Kharak Singh Marg, New Delhi', distance: '1.4 km' },
    { id: 3, name: 'US Embassy Emergency Services', type: 'embassy', latitude: 28.5983, longitude: 77.1897, phone: '+911124198000', address: 'Shantipath, Chanakyapuri, New Delhi', distance: '3.2 km' },
    { id: 4, name: 'Janpath Tourist Safety Command Helpdesk', type: 'tourist_helpdesk', latitude: 28.6140, longitude: 77.2095, phone: '+911123456789', address: 'Janpath Road, New Delhi', distance: '0.3 km' }
  ]);

  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchSafeLocations = async () => {
      try {
        const res = await api.get('/admin/safe-locations');
        if (res.data && res.data.length > 0) setLocations(res.data);
      } catch (err) {
        console.warn('Using preset nearby help units');
      }
    };
    fetchSafeLocations();
  }, []);

  const filtered = locations.filter((l) => filter === 'All' || l.type === filter);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-primary flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" /> Verified Emergency Responders & Helpdesks
          </h1>
          <p className="text-xs text-slate-500">24/7 verified police posts, emergency trauma centers & embassy support</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs font-bold">
        {['All', 'police_station', 'hospital', 'embassy', 'tourist_helpdesk'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3.5 py-1.5 rounded-lg capitalize transition-colors ${
              filter === type ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {type === 'All' ? 'All Nearby Responders' : type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Responder Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-primary text-[10px] font-bold uppercase">
                  {item.type.replace('_', ' ')}
                </span>
                <h3 className="text-sm font-bold text-slate-800 mt-2">{item.name}</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                {item.distance || '0.9 km'} away
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{item.address}</span>
              </div>
              <div className="flex items-center gap-2 font-mono font-bold text-primary">
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{item.phone}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">24/7 Active Duty</span>
              <a
                href={`tel:${item.phone}`}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-colors decoration-none"
              >
                Call Hotline
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NearbyHelp;
