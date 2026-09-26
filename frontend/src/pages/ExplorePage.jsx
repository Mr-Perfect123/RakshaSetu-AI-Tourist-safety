import React, { useState } from 'react';
import { Globe, Flag, CloudSun, ShieldAlert, MapPin, Compass } from 'lucide-react';
import IndiaStateExplorer from '../components/IndiaStateExplorer';
import WorldwideLocationExplorer from '../components/WorldwideLocationExplorer';
import WeatherCard from '../components/WeatherCard';

const ExplorePage = ({ darkMode = false }) => {
  const [activeTab, setActiveTab] = useState('india'); // 'india' | 'world' | 'weather'

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} pb-24 transition-colors duration-300`}>
      {/* Top Header Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-black tracking-wider uppercase">
            <Compass className="w-3.5 h-3.5" /> RakshaSetu Global Travel & Safety Explorer
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white m-0">
                Explore Destinations, Weather & Safety Alerts
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Discover all 28 Indian States & 8 UTs or explore global countries worldwide with real-time Open-Meteo weather and active safety alerts.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shrink-0">
              <button
                onClick={() => setActiveTab('india')}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'india'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>🇮🇳</span>
                <span>India States & UTs</span>
              </button>

              <button
                onClick={() => setActiveTab('world')}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'world'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>🌍</span>
                <span>Worldwide</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'india' && (
          <IndiaStateExplorer darkMode={darkMode} />
        )}

        {activeTab === 'world' && (
          <WorldwideLocationExplorer darkMode={darkMode} />
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
