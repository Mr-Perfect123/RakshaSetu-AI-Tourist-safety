import React, { useState, useEffect } from 'react';
import { Utensils, CheckCircle2, Search, Clock, ShoppingBag } from 'lucide-react';
import api from '../services/api';

const FoodOrdersAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/food-orders');
        if (res.data) setOrders(res.data);
      } catch (e) {
        console.warn('Failed to fetch admin food orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-amber-500" /> Food Orders & Hotel Delivery Audit
          </h1>
          <p className="text-xs text-slate-500">
            Real-time audit log of tourist food deliveries and verified restaurant fulfillment
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
            <tr>
              <th className="p-4">Order Code</th>
              <th className="p-4">Tourist Name</th>
              <th className="p-4">Restaurant</th>
              <th className="p-4">Hotel Delivery Location</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono font-bold text-[#0D47A1]">{o.order_code}</td>
                <td className="p-4 font-bold text-slate-800">{o.tourist_name || 'Tourist User'}</td>
                <td className="p-4 font-semibold text-slate-700">{o.restaurant_name || 'Hygienic Restaurant'}</td>
                <td className="p-4 font-semibold text-slate-600">{o.delivery_address}</td>
                <td className="p-4 font-black text-slate-900">₹{o.total_amount}</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold uppercase text-[10px]">
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FoodOrdersAdmin;
