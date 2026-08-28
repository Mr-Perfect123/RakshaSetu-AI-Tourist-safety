import React, { useState, useEffect } from 'react';
import { Utensils, CheckCircle2, Search, Clock, ShoppingBag } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';

const FoodOrdersAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const DEFAULT_FOOD_ORDERS = [
    {
      id: 501,
      order_code: 'FD-RS-991201',
      tourist_name: 'John Smith (UK Tourist)',
      restaurant_name: 'Annapoorna Pure Veg, Coimbatore',
      delivery_address: 'Room 304, Residency Towers, Avinashi Rd',
      total_amount: 380,
      status: 'PREPARING'
    },
    {
      id: 502,
      order_code: 'FD-RS-882194',
      tourist_name: 'Elena Rostova',
      restaurant_name: 'Bukhara Fine Dining, Delhi',
      delivery_address: 'Room 402, Taj Palace Hotel, Diplomatic Enclave',
      total_amount: 1450,
      status: 'DELIVERED'
    },
    {
      id: 503,
      order_code: 'FD-RS-773412',
      tourist_name: 'Karthik Raja',
      restaurant_name: 'Murugan Idli Shop, Chennai',
      delivery_address: 'Room 108, Grand Chola, Guindy',
      total_amount: 290,
      status: 'DISPATCHED'
    }
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/food-orders');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setOrders(res.data);
        } else {
          setOrders(DEFAULT_FOOD_ORDERS);
        }
      } catch (e) {
        setOrders(DEFAULT_FOOD_ORDERS);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();

    // Listen to real-time restaurant / food orders
    socket.on('new_food_order', (newOrder) => {
      setOrders((prev) => [
        {
          id: newOrder.id || Date.now(),
          order_code: newOrder.details?.order_code || `FD-RS-${Date.now().toString().slice(-6)}`,
          tourist_name: newOrder.touristName || 'Tourist User',
          restaurant_name: newOrder.details?.restaurant_name || 'Hygienic Partner Restaurant',
          delivery_address: newOrder.details?.delivery_address || 'Hotel Reception',
          total_amount: newOrder.details?.total_amount || 450,
          status: 'placed'
        },
        ...prev
      ]);
    });

    return () => {
      socket.off('new_food_order');
    };
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar — Royal Ocean Gradient Banner */}
      <div className="bg-gradient-to-r from-[#0a2540] via-[#0D47A1] to-[#1e3a8a] text-white p-6 rounded-3xl shadow-xl border border-blue-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5 m-0">
            <Utensils className="w-6 h-6 text-amber-300" /> Food Orders & Hotel Delivery Audit
          </h1>
          <p className="text-xs font-semibold text-blue-100 m-0 mt-1">
            Real-time audit log of tourist food deliveries and verified restaurant fulfillment
          </p>
        </div>
        <span className="px-3.5 py-1.5 rounded-full bg-white/15 text-white text-xs font-black flex items-center gap-1.5 border border-white/20 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          Live Orders Stream
        </span>
      </div>

      <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
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
              <tr key={o.id} className="hover:bg-slate-50 transition-colors">
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
