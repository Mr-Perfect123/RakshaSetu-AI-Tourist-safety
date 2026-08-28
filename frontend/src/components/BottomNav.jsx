import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Compass, Map, Bookmark, User, Ticket } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const BottomNav = ({ darkMode }) => {
  const location = useLocation();
  const { t } = useLanguage();
  const currentPath = location.pathname;

  const navItems = [
    { label: t('nav.dashboard', 'Home'), path: '/', icon: Home },
    { label: t('nav.safetyMap', 'Map'), path: '/safety-map', icon: Map },
    { label: t('nav.bookings', 'Bookings'), path: '/bookings', icon: Ticket },
    { label: t('nav.saved', 'Saved'), path: '/saved', icon: Bookmark },
    { label: t('nav.profile', 'Profile'), path: '/profile', icon: User }
  ];

  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg px-2 py-1.5 flex items-center justify-around shadow-lg transition-colors duration-300 ${
      darkMode ? 'bg-slate-900/95 border-slate-800 text-slate-300' : 'bg-white/95 border-slate-200 text-slate-700'
    }`}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 decoration-none ${
              isActive
                ? darkMode
                  ? 'text-blue-400 bg-blue-950/60 font-bold scale-105'
                  : 'text-[#0D47A1] bg-blue-50 font-bold scale-105'
                : darkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNav;
