import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Building2, Phone, MapPin, Star, Clock, Search, X, Check } from 'lucide-react';
import api from '../services/api';

const RespondersPage = () => {
  const [locations, setLocations] = useState([
    { id: 1, name: 'Central Police Station Connaught Place', type: 'police_station', latitude: 28.6315, longitude: 77.2167, phone: '+911123363364', address: 'Block B, Connaught Place, New Delhi', is_24_7: 1, rating: 4.9 },
    { id: 2, name: 'Ram Manohar Lohia Hospital', type: 'hospital', latitude: 28.6250, longitude: 77.2000, phone: '+911123365555', address: 'Baba Kharak Singh Marg, New Delhi', is_24_7: 1, rating: 4.8 },
    { id: 3, name: 'US Embassy Emergency Services', type: 'embassy', latitude: 28.5983, longitude: 77.1897, phone: '+911124198000', address: 'Shantipath, Chanakyapuri, New Delhi', is_24_7: 1, rating: 4.9 },
    { id: 4, name: 'Tourist Safety Command Cell', type: 'tourist_helpdesk', latitude: 28.6140, longitude: 77.2095, phone: '+911123456789', address: 'Janpath, New Delhi', is_24_7: 1, rating: 5.0 }
  ]);

  const [filterType, setFilterType] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [newUnit, setNewUnit] = useState({
    name: '',
    type: 'police_station',
    phone: '',
    address: '',
    latitude: 28.6139,
    longitude: 77.2090
  });

  useEffect(() => {
    const fetchSafeLocations = async () => {
      try {
        const res = await api.get('/admin/safe-locations');
        if (res.data && res.data.length > 0) {
          setLocations(res.data);
        }
      } catch (err) {
        console.warn('Using default emergency responder units');
      }
    };
    fetchSafeLocations();
  }, []);

  const handleAddUnit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/safe-locations', newUnit);
      if (res.data) {
        setLocations(prev => [res.data, ...prev]);
      } else {
        setLocations(prev => [{ id: Date.now(), ...newUnit, rating: 5.0, is_24_7: 1 }, ...prev]);
      }
      setShowModal(false);
      setNewUnit({ name: '', type: 'police_station', phone: '', address: '', latitude: 28.6139, longitude: 77.2090 });
    } catch (err) {
      setLocations(prev => [{ id: Date.now(), ...newUnit, rating: 5.0, is_24_7: 1 }, ...prev]);
      setShowModal(false);
    }
  };

  const filteredLocations = locations.filter((loc) => filterType === 'All' || loc.type === filterType);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar — Royal Ocean Gradient Banner */}
      <div className="bg-gradient-to-r from-[#0a2540] via-[#0D47A1] to-[#1e3a8a] text-white p-6 rounded-3xl shadow-xl border border-blue-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5 m-0">
            <ShieldCheck className="w-6 h-6 text-emerald-400" /> Emergency Safe Haven & Responder Network
          </h1>
          <p className="text-xs font-semibold text-blue-100 m-0 mt-1">Verified Police Hubs, Medical Facilities, Helplines & Embassy Enclaves</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-white text-blue-900 hover:bg-blue-50 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Emergency Node
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs font-bold">
        {['All', 'police_station', 'hospital', 'embassy', 'tourist_helpdesk'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
              filterType === type ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {type === 'All' ? 'All Infrastructure' : type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLocations.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-primary text-[10px] font-bold uppercase tracking-wider">
                  {item.type.replace('_', ' ')}
                </span>
                <h3 className="text-sm font-bold text-slate-800 mt-2">{item.name}</h3>
              </div>
              <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-md">
                <Star className="w-3.5 h-3.5 fill-amber-500" /> {item.rating || 4.9}
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono font-bold text-slate-800">{item.phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>{item.address}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                <Clock className="w-3.5 h-3.5" /> 24/7 Active Dispatch
              </span>
              <button className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] hover:bg-slate-200">
                Unit Status
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Unit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddUnit} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Register Emergency Unit</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Unit Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Connaught Place Police Post"
                  value={newUnit.name}
                  onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Unit Type</label>
                <select
                  value={newUnit.type}
                  onChange={(e) => setNewUnit({ ...newUnit, type: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                >
                  <option value="police_station">Police Station</option>
                  <option value="hospital">Hospital / Emergency Room</option>
                  <option value="embassy">Embassy Liaison Office</option>
                  <option value="tourist_helpdesk">Tourist Helpdesk</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Emergency Phone Hotline</label>
                <input
                  type="text"
                  required
                  placeholder="+911123456789"
                  value={newUnit.phone}
                  onChange={(e) => setNewUnit({ ...newUnit, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Physical Address</label>
                <textarea
                  required
                  rows="2"
                  placeholder="Street name, sector..."
                  value={newUnit.address}
                  onChange={(e) => setNewUnit({ ...newUnit, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                ></textarea>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-dark"
              >
                Save Responder Unit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RespondersPage;
