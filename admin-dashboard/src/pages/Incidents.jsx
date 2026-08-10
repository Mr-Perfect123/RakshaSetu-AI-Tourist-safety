import React from 'react';
import { FileText, AlertTriangle, Eye, CheckCircle } from 'lucide-react';

const Incidents = () => {
  const incidents = [
    {
      id: 1,
      report_code: 'INC-2026-4401',
      category: 'scam',
      title: 'Unregistered Auto Driver Charging Exorbitant Rate',
      description: 'Driver refused to use meter and locked vehicle doors until money was transferred.',
      reporter_name: 'John Doe Tourist',
      severity: 'medium',
      location_name: 'Connaught Place Outer Circle',
      status: 'under_investigation',
      created_at: new Date().toISOString()
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-extrabold text-primary flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" /> Tourist Incident Reports
        </h1>
        <p className="text-xs text-slate-500">Crowd-sourced crime, scam, road block, and accident verification</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {incidents.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                Category: {item.category}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">{item.report_code}</span>
            </div>

            <h3 className="text-sm font-bold text-slate-800">{item.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">📍 {item.location_name}</span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-primary font-semibold uppercase text-[10px]">
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Incidents;
