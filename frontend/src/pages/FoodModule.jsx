import React, { useState, useEffect } from 'react';
import { Utensils, ShoppingBag, Star, Clock, MapPin, Plus, Minus, ArrowLeft, CheckCircle2, ShieldCheck, Search, Trash2, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PaymentModal from '../components/PaymentModal';

const FoodModule = ({ darkMode }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('Hotel Sector, Coimbatore, Tamil Nadu');

  const [activeTab, setActiveTab] = useState('restaurants'); // 'restaurants', 'cart', 'orders'
  const [myOrders, setMyOrders] = useState([]);
  const [orderResult, setOrderResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [gpsCoords, setGpsCoords] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => console.warn('Geolocation unavailable in FoodModule')
      );
    }
  }, []);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const latParam = gpsCoords ? `&lat=${gpsCoords.lat}&lng=${gpsCoords.lng}` : '';
        const res = await api.get(`/food/restaurants?search=${searchQuery}${latParam}`);
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list)) setRestaurants(list);
      } catch (e) {
        console.warn('Using default restaurants');
      }
    };
    fetchRestaurants();
  }, [searchQuery, gpsCoords]);

  const openRestaurantMenu = async (restaurantId) => {
    try {
      const res = await api.get(`/food/restaurants/${restaurantId}`);
      setSelectedRestaurant(res.data);
    } catch (e) {
      alert('Failed to load restaurant menu.');
    }
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateCartQty = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === itemId) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + parseFloat(item.price) * item.qty, 0);
  const deliveryFee = cart.length > 0 ? 30 : 0;
  const cartTotal = cartSubtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !selectedRestaurant) return;
    setLoading(true);
    setOrderResult(null);

    try {
      const res = await api.post('/food/orders', {
        restaurantId: selectedRestaurant.id,
        items: cart,
        deliveryAddress,
        subtotal: cartSubtotal,
        deliveryFee,
        totalAmount: cartTotal
      });

      setOrderResult(res.data);
      setShowPaymentModal(true);
      setCart([]);
      fetchMyOrders();
    } catch (err) {
      alert(`Order Failed: ${err.message || 'Server error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOrders = async () => {
    try {
      const res = await api.get('/food/my-orders');
      if (res.data) setMyOrders(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    if (activeTab === 'orders') fetchMyOrders();
  }, [activeTab]);

  const cardBg = darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Bar — Frosted Glass Container for High Text Visibility */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        darkMode ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
      } backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <Link to="/" className={`p-2 rounded-xl border ${
            darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className={`text-xl font-extrabold m-0 flex items-center gap-2 ${
              darkMode ? 'text-amber-400' : 'text-amber-700 font-extrabold'
            }`}>
              <Utensils className="w-6 h-6 text-amber-500" /> RakshaSetu Verified Tourist Dining & Food
            </h1>
            <p className={`text-xs font-semibold m-0 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Verified hygiene rating, hotel delivery & authentic local cuisine
            </p>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('restaurants'); setSelectedRestaurant(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'restaurants' ? 'bg-[#0D47A1] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Restaurants
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cart' ? 'bg-[#0D47A1] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Cart ({cart.reduce((a, i) => a + i.qty, 0)})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'orders' ? 'bg-[#0D47A1] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            My Orders ({myOrders.length})
          </button>
        </div>
      </div>

      {activeTab === 'restaurants' && !selectedRestaurant && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search restaurants, cuisines, dishes (e.g. Mughlai, Dosa, Karim)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs font-semibold focus:ring-2 focus:outline-none ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            />
          </div>

          {/* Restaurant Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {restaurants.map((r) => (
              <div
                key={r.id}
                onClick={() => openRestaurantMenu(r.id)}
                className={`${cardBg} rounded-3xl border shadow-xs p-5 hover:border-[#0D47A1] transition-all cursor-pointer space-y-3`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 m-0">{r.name}</h3>
                    <p className="text-xs text-slate-500 font-semibold m-0">{r.cuisine_type}</p>
                  </div>
                  <span className="px-2 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {r.rating}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-semibold border-t border-slate-100 pt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" /> {r.delivery_time_min} mins
                  </span>
                  {r.formattedDistance && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {r.formattedDistance}
                    </span>
                  )}
                  <span>Price: {r.price_range}</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Restaurant Menu View */}
      {selectedRestaurant && activeTab === 'restaurants' && (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedRestaurant(null)}
            className="text-xs font-bold text-[#0D47A1] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all restaurants
          </button>

          <div className={`${cardBg} p-6 rounded-3xl border shadow-xs space-y-4`}>
            <div>
              <h2 className="text-lg font-extrabold text-[#0D47A1] m-0">{selectedRestaurant.name}</h2>
              <p className="text-xs text-slate-500 m-0">{selectedRestaurant.cuisine_type} • {selectedRestaurant.address}</p>
            </div>

            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 pt-2">Restaurant Menu</h3>

            <div className="space-y-3">
              {selectedRestaurant.menu?.map((item) => (
                <div key={item.id} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <h4 className="text-xs font-extrabold text-slate-900 m-0">{item.item_name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 m-0 mt-0.5">{item.description}</p>
                    <span className="text-xs font-black text-[#0D47A1] block mt-1">₹{item.price}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCart(item)}
                    className="px-3 py-1.5 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-blue-800 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cart & Checkout View */}
      {activeTab === 'cart' && (
        <div className={`${cardBg} p-6 rounded-3xl border shadow-xs space-y-6`}>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0D47A1] m-0">Your Food Cart</h2>

          {cart.length === 0 ? (
            <p className="text-xs text-slate-500 font-medium py-6 text-center">Your food cart is empty.</p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">{item.item_name}</span>
                      <span className="text-[11px] text-slate-500">₹{item.price} × {item.qty} = <strong>₹{item.price * item.qty}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => updateCartQty(item.id, -1)} className="p-1 rounded-lg bg-slate-200 text-slate-700">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold">{item.qty}</span>
                      <button onClick={() => updateCartQty(item.id, 1)} className="p-1 rounded-lg bg-slate-200 text-slate-700">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Address Entry */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Hotel Delivery Location</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                />
              </div>

              {/* Total & Checkout */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Subtotal:</span> <span>₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Delivery Fee:</span> <span>₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-[#0D47A1] pt-1 border-t border-blue-200">
                  <span>Total Amount:</span> <span>₹{cartTotal}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs uppercase tracking-wider hover:bg-blue-800 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Placing Order...' : 'Place Verified Food Order'}
              </button>
            </div>
          )}

          {orderResult && (
            <div className="p-6 rounded-3xl bg-emerald-600 text-white shadow-xl space-y-2">
              <div className="flex items-center gap-2 font-extrabold text-sm">
                <CheckCircle2 className="w-5 h-5" /> Order Placed!
              </div>
              <p className="text-xs m-0">Order Code: <strong>{orderResult.order_code}</strong></p>
              <p className="text-xs m-0">Est. Delivery: <strong>{orderResult.estimated_delivery_min || 30} mins to hotel desk</strong></p>
            </div>
          )}
        </div>
      )}

      {/* Order History View */}
      {activeTab === 'orders' && (
        <div className={`${cardBg} p-6 rounded-3xl border shadow-xs space-y-4`}>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0D47A1] m-0">Food Order History</h2>

          {myOrders.length === 0 ? (
            <p className="text-xs text-slate-500 font-medium py-6 text-center">No food orders on record.</p>
          ) : (
            <div className="space-y-3">
              {myOrders.map((o) => (
                <div key={o.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-[#0D47A1] block">{o.order_code} • {o.restaurant_name || 'Restaurant'}</span>
                    <span className="text-xs text-slate-700 font-bold block mt-0.5">Delivery To: {o.delivery_address}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 block">₹{o.total_amount}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        bookingDetails={{
          amount: orderResult?.total_amount || orderResult?.totalAmount,
          booking_code: orderResult?.order_code,
          title: `Food Order (${selectedRestaurant?.name || 'Restaurant'})`,
          type: 'food'
        }}
        onPaymentSuccess={() => {
          fetchMyOrders();
        }}
        darkMode={darkMode}
      />
    </div>
  );
};

export default FoodModule;
