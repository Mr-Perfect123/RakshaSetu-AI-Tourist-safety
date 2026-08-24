import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard,
  AlertOctagon,
  FileText,
  Users,
  ShieldCheck,
  Flame,
  Database,
  BarChart3,
  Settings,
  Bot,
  AlertTriangle,
  Car,
  Utensils,
  ShieldAlert,
  Ticket
} from 'lucide-react';

const Sidebar = () => {
  const { t } = useLanguage();

  const menuItems = [
    { name: t('sidebar.dashboard', 'Live Command Dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('sidebar.sos', 'Emergency SOS Feed'), path: '/sos', icon: AlertOctagon, badge: 'Live' },
    { name: t('sidebar.alerts', 'Red Emergency Alerts'), path: '/red-alerts', icon: ShieldAlert, badge: 'Critical' },
    { name: t('sidebar.ai', 'AI Safety Chatbot'), path: '/ai-chat', icon: Bot, badge: 'Gemini' },
    { name: t('sidebar.incidents', 'Incident Reports'), path: '/incidents', icon: FileText },
    { name: t('sidebar.zones', 'Danger & Hazard Zones'), path: '/zones', icon: AlertTriangle },
    { name: t('sidebar.vehicles', 'Vehicle Bookings'), path: '/vehicle-bookings', icon: Car },
    { name: t('sidebar.travel', 'Travel Bookings'), path: '/travel-bookings', icon: Ticket },
    { name: t('sidebar.food', 'Food Orders'), path: '/food-orders', icon: Utensils },
    { name: t('sidebar.heatmap', 'Crime Risk Heatmap'), path: '/heatmap', icon: Flame },
    { name: t('sidebar.users', 'Tourist User Roster'), path: '/users', icon: Users },
    { name: t('sidebar.responders', 'Police & Hospitals'), path: '/responders', icon: ShieldCheck },
    { name: t('sidebar.analytics', 'Safety Analytics'), path: '/analytics', icon: BarChart3 },
    { name: t('sidebar.database', 'Database Management'), path: '/database', icon: Database },
    { name: t('sidebar.settings', 'System Settings'), path: '/settings', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-white/90 backdrop-blur-md border-r border-slate-200/80 h-[calc(100vh-65px)] flex flex-col justify-between py-4 px-3 sticky top-[65px] overflow-y-auto shadow-md">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">{t('sidebar.navTitle', 'Emergency Navigation')}</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#0D47A1] text-white shadow-md shadow-blue-900/15'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#0D47A1]'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`px-1.5 py-0.5 rounded-md text-white text-[10px] font-bold ${
                  item.badge === 'Live' || item.badge === 'Critical' ? 'bg-[#D32F2F] animate-pulse' : 'bg-indigo-600'
                }`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl mt-4">
        <div className="flex items-center gap-2 text-[#0D47A1] font-bold text-xs mb-1">
          <ShieldCheck className="w-4 h-4 text-[#0D47A1]" />
          <span>{t('sidebar.activeText', 'AI Engine Active')}</span>
        </div>
        <p className="text-[11px] text-slate-600 m-0">{t('sidebar.subActive', 'Gemini-Flash-Latest REST predictive safety engine active.')}</p>
      </div>
    </aside>
  );
};

export default Sidebar;
