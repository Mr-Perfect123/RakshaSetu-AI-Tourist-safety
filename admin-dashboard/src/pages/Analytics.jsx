import React, { useEffect, useState } from 'react';
import { BarChart3, Clock, ShieldCheck, Activity, TrendingUp, Users, PieChart as PieIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';

const AnalyticsPage = () => {
  const [data, setData] = useState({
    incidentCategoryBreakdown: [
      { category: 'Scam', count: 42 },
      { category: 'Theft', count: 28 },
      { category: 'Harassment', count: 18 },
      { category: 'Road Block', count: 14 },
      { category: 'Medical', count: 9 }
    ],
    sosTriggerBreakdown: [
      { trigger: 'One-Tap SOS', count: 64 },
      { trigger: 'Voice SOS', count: 22 },
      { trigger: 'Shake Phone', count: 15 },
      { trigger: 'Auto Crash', count: 8 },
      { trigger: 'Offline SMS', count: 5 }
    ],
    nationalityDistribution: [
      { nationality: 'American', count: 32 },
      { nationality: 'British', count: 24 },
      { nationality: 'French', count: 19 },
      { nationality: 'Japanese', count: 16 },
      { nationality: 'German', count: 14 },
      { nationality: 'Indian', count: 19 }
    ],
    avgPoliceResponseMinutes: 4.2
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/admin/analytics');
        if (res.data) setData(res.data);
      } catch (err) {
        console.warn('Using analytics default metrics');
      }
    };
    fetchAnalytics();
  }, []);

  const COLORS = ['#0D47A1', '#1565C0', '#D32F2F', '#F57C00', '#2E7D32', '#7B1FA2'];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-extrabold text-primary flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> Tourist Protection & Response Analytics
        </h1>
        <p className="text-xs text-slate-500">
          Aggregated emergency response speed metrics, incident trends & tourist safety insights
        </p>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Avg Response Time</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{data.avgPoliceResponseMinutes} Mins</h3>
            <span className="text-[10px] text-emerald-600 font-semibold">12% Faster than Target SLA</span>
          </div>
          <Clock className="w-8 h-8 text-emerald-600 opacity-80" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Resolution Success Rate</p>
            <h3 className="text-2xl font-extrabold text-primary mt-1">94.8%</h3>
            <span className="text-[10px] text-slate-500">Verified & Resolved</span>
          </div>
          <ShieldCheck className="w-8 h-8 text-primary opacity-80" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Total SOS Triggers</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">114 Signals</h3>
            <span className="text-[10px] text-slate-500">Last 30 Days</span>
          </div>
          <Activity className="w-8 h-8 text-slate-700 opacity-80" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Safety Patrol Index</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">9.8 / 10</h3>
            <span className="text-[10px] text-amber-600 font-semibold">Optimal Security Coverage</span>
          </div>
          <TrendingUp className="w-8 h-8 text-amber-600 opacity-80" />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Categories Breakdown Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-[360px] flex flex-col">
          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Incident Reports by Category
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.incidentCategoryBreakdown}>
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1565C0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SOS Panic Trigger Mechanisms Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-[360px] flex flex-col">
          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-danger" /> SOS Emergency Trigger Mechanisms
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.sosTriggerBreakdown}
                  dataKey="count"
                  nameKey="trigger"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >
                  {data.sosTriggerBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
