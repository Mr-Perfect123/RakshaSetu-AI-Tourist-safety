import React, { useState, useEffect } from 'react';
import { Bookmark, Heart, MapPin, Shield, Star, Trash2, ArrowRight, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getPlaceImage } from '../utils/placeImageHelper';

const SavedPlaces = ({ darkMode }) => {
  const { t } = useLanguage();
  const [savedItems, setSavedItems] = useState([]);

  useEffect(() => {
    const loaded = localStorage.getItem('rakshasetu_saved_places');
    if (loaded) {
      try {
        setSavedItems(JSON.parse(loaded));
      } catch (e) {}
    } else {
      // Default curated sample saved places
      const defaults = [
        {
          id: 'taj-mahal-agra',
          name: 'Taj Mahal',
          city: 'Agra',
          state: 'Uttar Pradesh',
          rating: 4.9,
          safetyScore: 92,
          weather: '28°C Sunny',
          image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
          category: 'Historical Monument'
        },
        {
          id: 'baga-beach-goa',
          name: 'Baga Beach',
          city: 'Goa',
          state: 'Goa',
          rating: 4.7,
          safetyScore: 85,
          weather: '30°C Tropical',
          image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
          category: 'Beach & Coastal'
        }
      ];
      setSavedItems(defaults);
      localStorage.setItem('rakshasetu_saved_places', JSON.stringify(defaults));
    }
  }, []);

  const handleRemove = (id) => {
    const updated = savedItems.filter((item) => item.id !== id);
    setSavedItems(updated);
    localStorage.setItem('rakshasetu_saved_places', JSON.stringify(updated));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      <div className={`p-6 rounded-3xl border shadow-sm flex items-center justify-between transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 m-0">
            <Bookmark className="w-7 h-7 text-amber-500 fill-amber-500" />
            {t('nav.saved', 'Saved Items')}
          </h2>
          <p className={`text-xs font-medium m-0 mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Your saved tourist destinations, hotels, restaurants, and activities.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-500 text-xs font-extrabold">
          {savedItems.length} Saved
        </span>
      </div>

      {savedItems.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${
          darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <Heart className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <h3 className="text-base font-extrabold text-slate-700 dark:text-slate-300">
            No saved items yet.
          </h3>
          <p className="text-xs max-w-sm mx-auto mt-1 mb-4">
            Explore destinations or search places and click "Save" to keep track of your favorite spots.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0D47A1] text-white font-extrabold text-xs shadow-md"
          >
            Explore Destinations <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-3xl border overflow-hidden shadow-xs hover:shadow-lg transition-all group ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={getPlaceImage(item)}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  onClick={() => handleRemove(item.id)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/70 text-red-400 hover:text-red-500 hover:bg-slate-900 transition-all cursor-pointer backdrop-blur-md"
                  title="Remove from saved"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-extrabold backdrop-blur-md flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Safety: {item.safetyScore || 88}/100
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-extrabold m-0 leading-snug">{item.name}</h4>
                    <p className="text-xs text-slate-400 font-medium m-0 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-red-500" /> {item.city}, {item.state}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">
                    <Star className="w-3 h-3 fill-amber-500" /> {item.rating || 4.8}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200/20 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-400" /> {item.weather || '28°C Sunny'}
                  </span>

                  <Link
                    to={`/places/${item.id}`}
                    className="px-3 py-1.5 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs flex items-center gap-1 decoration-none"
                  >
                    Explore <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPlaces;
