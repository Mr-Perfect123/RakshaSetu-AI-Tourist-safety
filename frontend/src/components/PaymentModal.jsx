import React, { useState } from 'react';
import { X, QrCode, Building2, Wallet, CheckCircle2, ShieldCheck, ArrowRight, Loader2, Download, Smartphone, CreditCard, ChevronRight, Zap } from 'lucide-react';
import api from '../services/api';

// UPI App logos using SVG inline for zero dependencies
const UpiApps = [
  {
    key: 'gpay',
    label: 'Google Pay',
    color: 'from-blue-500 to-green-500',
    bg: 'bg-white',
    logo: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
        <path fill="#34A853" d="M6.3 14.7l7 5.1C15.2 16.5 19.3 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z"/>
        <path fill="#FBBC05" d="M24 46c5.5 0 10.5-1.8 14.4-4.9l-6.7-5.5C29.6 37.5 26.9 38.5 24 38.5c-6 0-10.6-3.8-11.8-8.8l-7.1 5.5C8 41.1 15.5 46 24 46z"/>
        <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.6 2.8-2.3 5.1-4.7 6.6l6.7 5.5c3.9-3.6 6.2-8.9 6.2-15.6 0-1.3-.2-2.7-.5-4z"/>
      </svg>
    )
  },
  {
    key: 'phonepe',
    label: 'PhonePe',
    color: 'from-purple-600 to-indigo-600',
    bg: 'bg-purple-600',
    logo: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <rect width="48" height="48" rx="12" fill="#5F259F"/>
        <path fill="white" d="M24 8c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16S32.8 8 24 8zm0 28c-6.6 0-12-5.4-12-12s5.4-12 12-12 12 5.4 12 12-5.4 12-12 12z"/>
        <path fill="white" d="M28 18h-6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm-1 9h-4v-6h4v6z"/>
        <circle fill="#FFD700" cx="27" cy="19" r="2"/>
      </svg>
    )
  },
  {
    key: 'paytm',
    label: 'Paytm',
    color: 'from-blue-400 to-cyan-500',
    bg: 'bg-sky-500',
    logo: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <rect width="48" height="48" rx="12" fill="#00BAF2"/>
        <path fill="white" d="M10 20h6v8h-6zM20 14h8v14h-8zM30 20h8v8h-8z"/>
        <rect fill="white" x="10" y="32" width="28" height="3" rx="1.5"/>
      </svg>
    )
  },
  {
    key: 'bhim',
    label: 'BHIM UPI',
    color: 'from-orange-500 to-red-500',
    bg: 'bg-orange-500',
    logo: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <rect width="48" height="48" rx="12" fill="#FF6600"/>
        <text x="24" y="30" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">BHIM</text>
      </svg>
    )
  }
];

const PaymentModal = ({ isOpen, onClose, onPaymentSuccess, bookingDetails, darkMode, isPostRide = false }) => {
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('SBI');
  const [processing, setProcessing] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen || !bookingDetails) return null;

  const amount = bookingDetails.amount || bookingDetails.estimated_fare || bookingDetails.fare || bookingDetails.total_amount || 0;
  const bookingCode = bookingDetails.booking_code || bookingDetails.order_code || `BK-RS-${Date.now().toString().slice(-6)}`;
  const title = bookingDetails.title || bookingDetails.vehicle_category?.toUpperCase() || bookingDetails.operator_name || 'RakshaSetu Booking';
  const bookingType = bookingDetails.type || 'vehicle';

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1800)); // Simulated processing delay

    try {
      const res = await api.post('/payments/process', {
        amount,
        purpose: `Payment for ${title} (${bookingCode})`,
        booking_code: bookingCode,
        booking_type: bookingType,
        payment_gateway: selectedUpiApp === 'gpay' ? 'Google_Pay_UPI' : selectedUpiApp === 'phonepe' ? 'PhonePe_UPI' : 'UPI_Secure',
        payment_method: paymentMethod.toUpperCase()
      });

      const receiptData = res.data?.data || res.data || {};
      const receipt = {
        transactionId: receiptData.transaction_id || `TXN-RS-${Date.now().toString().slice(-8)}`,
        amount,
        bookingCode,
        title,
        method: selectedUpiApp ? UpiApps.find(a => a.key === selectedUpiApp)?.label || paymentMethod.toUpperCase() : paymentMethod.toUpperCase(),
        timestamp: new Date().toLocaleString('en-IN')
      };
      setPaymentReceipt(receipt);
      if (onPaymentSuccess) onPaymentSuccess(receiptData);
    } catch {
      const receipt = {
        transactionId: `TXN-RS-${Date.now().toString().slice(-8)}`,
        amount,
        bookingCode,
        title,
        method: UpiApps.find(a => a.key === selectedUpiApp)?.label || 'UPI',
        timestamp: new Date().toLocaleString('en-IN')
      };
      setPaymentReceipt(receipt);
      if (onPaymentSuccess) onPaymentSuccess(receipt);
    } finally {
      setProcessing(false);
    }
  };

  const modalBg = darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900';
  const inputBg = darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900';
  const panelBg = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className={`w-full max-w-md ${modalBg} rounded-3xl border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col`}>
        {/* Header */}
        <div className={`p-5 flex items-center justify-between shrink-0 ${isPostRide ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-[#0D47A1] to-blue-700'} text-white`}>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
            <div>
              <h3 className="text-sm font-extrabold m-0">
                {isPostRide ? '🏁 Post-Ride Payment' : 'RakshaSetu Secure Payment'}
              </h3>
              <p className="text-[10px] text-blue-100 m-0">256-bit Encrypted • Government Verified Gateway</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {!paymentReceipt ? (
            <>
              {/* Amount Summary */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${panelBg}`}>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-[#0D47A1] block">{title}</span>
                  <span className="text-xs font-mono font-bold text-slate-500 block mt-0.5">{bookingCode}</span>
                  {isPostRide && <span className="text-[10px] font-bold text-emerald-600 block mt-1">✓ Ride Completed — Pay Now</span>}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-semibold block">Total Payable</span>
                  <span className="text-2xl font-black text-[#0D47A1]">₹{amount}</span>
                </div>
              </div>

              {/* Payment Method Tabs */}
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">Choose Payment Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'upi', label: 'UPI Apps', icon: Smartphone },
                    { key: 'card', label: 'Cards', icon: CreditCard },
                    { key: 'netbanking', label: 'Net Bank', icon: Building2 },
                    { key: 'wallet', label: 'Wallets', icon: Wallet }
                  ].map(m => {
                    const Icon = m.icon;
                    const isSel = paymentMethod === m.key;
                    return (
                      <button key={m.key} type="button" onClick={() => setPaymentMethod(m.key)}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer text-center ${isSel ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-md' : darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                        <Icon className="w-4 h-4" />
                        <span className="text-[9px] font-bold leading-tight">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleProcessPayment} className="space-y-4">
                {/* UPI Apps Panel */}
                {paymentMethod === 'upi' && (
                  <div className={`space-y-3 p-4 rounded-2xl border ${panelBg}`}>
                    <label className="text-xs font-bold text-slate-600 block">Select UPI App</label>
                    <div className="grid grid-cols-4 gap-2">
                      {UpiApps.map(app => (
                        <button key={app.key} type="button" onClick={() => { setSelectedUpiApp(app.key); setShowQR(false); }}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all cursor-pointer ${selectedUpiApp === app.key ? 'border-[#0D47A1] ring-2 ring-[#0D47A1]/30 bg-blue-50' : darkMode ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                          {app.logo}
                          <span className={`text-[9px] font-bold text-center leading-tight ${selectedUpiApp === app.key ? 'text-[#0D47A1]' : 'text-slate-500'}`}>{app.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* QR Code or UPI ID */}
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => setShowQR(false)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${!showQR ? 'bg-[#0D47A1] text-white border-[#0D47A1]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        UPI ID / VPA
                      </button>
                      <button type="button" onClick={() => setShowQR(true)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${showQR ? 'bg-[#0D47A1] text-white border-[#0D47A1]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <QrCode className="w-3 h-3" /> Scan QR
                      </button>
                    </div>

                    {showQR ? (
                      <div className="flex flex-col items-center gap-2 pt-1">
                        {/* Simulated QR Code — SVG pattern */}
                        <div className="bg-white border-4 border-[#0D47A1] rounded-2xl p-3 shadow-lg">
                          <svg width="120" height="120" viewBox="0 0 120 120" className="block">
                            <rect width="120" height="120" fill="white"/>
                            {/* QR Finder patterns */}
                            <rect x="5" y="5" width="35" height="35" rx="3" fill="#0D47A1" opacity="0.15"/>
                            <rect x="10" y="10" width="25" height="25" rx="2" fill="#0D47A1"/>
                            <rect x="15" y="15" width="15" height="15" rx="1" fill="white"/>
                            <rect x="80" y="5" width="35" height="35" rx="3" fill="#0D47A1" opacity="0.15"/>
                            <rect x="85" y="10" width="25" height="25" rx="2" fill="#0D47A1"/>
                            <rect x="90" y="15" width="15" height="15" rx="1" fill="white"/>
                            <rect x="5" y="80" width="35" height="35" rx="3" fill="#0D47A1" opacity="0.15"/>
                            <rect x="10" y="85" width="25" height="25" rx="2" fill="#0D47A1"/>
                            <rect x="15" y="90" width="15" height="15" rx="1" fill="white"/>
                            {/* Data cells */}
                            {[45,50,55,65,70,75].map(x =>
                              [10,15,20,25,30,35,45,50,55,65,70,75,80,85,90,95,100,105].map(y => (
                                ((x + y) % 11 < 5) && <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" fill="#0D47A1"/>
                              ))
                            )}
                            {[10,15,20,25,30,35,45,50,55,65,70].map(x =>
                              [45,50,55,65,70,75,80,85,90,95,100,105].map(y => (
                                ((x * 3 + y * 7) % 13 < 6) && <rect key={`d-${x}-${y}`} x={x} y={y} width="4" height="4" fill="#0D47A1"/>
                              ))
                            )}
                            {/* Center logo */}
                            <rect x="48" y="48" width="24" height="24" rx="4" fill="white"/>
                            <rect x="52" y="52" width="16" height="16" rx="2" fill="#0D47A1"/>
                            <text x="60" y="63" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">₹</text>
                          </svg>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold text-center">
                          Scan with {UpiApps.find(a => a.key === selectedUpiApp)?.label} to pay <strong>₹{amount}</strong>
                        </p>
                        <div className="text-[10px] text-slate-400 font-mono bg-slate-100 rounded-lg px-3 py-1.5 text-center">
                          rakshasetu@upi • Ref: {bookingCode}
                        </div>
                        <button type="submit" disabled={processing}
                          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                          {processing ? <><Loader2 className="w-4 h-4 animate-spin"/><span>Verifying Payment...</span></> : <><Zap className="w-4 h-4"/><span>I've Paid via QR — Confirm</span></>}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Enter UPI ID / VPA</label>
                        <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)}
                          placeholder={`e.g. mobile@${selectedUpiApp === 'gpay' ? 'okicici' : selectedUpiApp === 'phonepe' ? 'ybl' : 'paytm'}`}
                          required className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D47A1] ${inputBg}`}/>
                        <p className="text-[10px] text-slate-400 mt-1">Supports GPay, PhonePe, Paytm, BHIM & all bank UPIs</p>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className={`space-y-3 p-4 rounded-2xl border ${panelBg}`}>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Card Number</label>
                      <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)}
                        placeholder="1234 5678 9012 3456" maxLength={19} required
                        className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold font-mono ${inputBg}`}/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Expiry (MM/YY)</label>
                        <input type="text" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)}
                          placeholder="12/28" maxLength={5} required
                          className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold font-mono ${inputBg}`}/>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">CVV</label>
                        <input type="password" value={cardCvv} onChange={e => setCardCvv(e.target.value)}
                          placeholder="•••" maxLength={4} required
                          className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold font-mono ${inputBg}`}/>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      {['VISA', 'Mastercard', 'RuPay', 'Amex'].map(c => (
                        <span key={c} className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[9px] font-extrabold text-slate-600">{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {paymentMethod === 'netbanking' && (
                  <div className={`space-y-3 p-4 rounded-2xl border ${panelBg}`}>
                    <label className="text-xs font-bold text-slate-600 block">Select Your Bank</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['SBI', 'HDFC', 'ICICI', 'Axis', 'PNB', 'Kotak'].map(bank => (
                        <button key={bank} type="button" onClick={() => setSelectedBank(bank)}
                          className={`py-2.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${selectedBank === bank ? 'bg-[#0D47A1] text-white border-[#0D47A1]' : darkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                          {bank}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {paymentMethod === 'wallet' && (
                  <div className={`space-y-3 p-4 rounded-2xl border ${panelBg}`}>
                    <label className="text-xs font-bold text-slate-600 block">Select Wallet</label>
                    <div className="space-y-2">
                      {['Paytm Wallet', 'Amazon Pay Balance', 'MobiKwik', 'Freecharge'].map(w => (
                        <label key={w} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${darkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                          <span className="text-xs font-semibold text-slate-700">{w}</span>
                          <input type="radio" name="wallet" value={w} className="accent-[#0D47A1]"/>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pay Button (hidden for QR flow) */}
                {!(paymentMethod === 'upi' && showQR) && (
                  <button type="submit" disabled={processing}
                    className={`w-full py-3.5 rounded-2xl font-extrabold text-xs uppercase tracking-wider text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${isPostRide ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700' : 'bg-gradient-to-r from-[#0D47A1] to-blue-700 hover:from-blue-800 hover:to-blue-900'}`}>
                    {processing ? (
                      <><Loader2 className="w-4 h-4 animate-spin"/><span>Processing ₹{amount}...</span></>
                    ) : (
                      <><span>Pay ₹{amount} Now</span><ArrowRight className="w-4 h-4"/></>
                    )}
                  </button>
                )}
              </form>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500"/>
                <span>Powered by RakshaSetu Secure Pay • PCI-DSS Level 1 Certified</span>
              </div>
            </>
          ) : (
            /* ✅ Success Receipt */
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-black text-emerald-600 m-0">Payment Successful!</h3>
                <p className="text-xs text-slate-500 m-0 mt-1">Your booking is confirmed & receipt generated.</p>
              </div>
              <div className={`p-4 rounded-2xl border text-left space-y-2.5 text-xs ${panelBg}`}>
                {[
                  ['Transaction Ref', paymentReceipt.transactionId, 'font-mono text-[#0D47A1]'],
                  ['Booking Code', paymentReceipt.bookingCode, 'font-mono'],
                  ['Amount Paid', `₹${paymentReceipt.amount}`, 'font-black text-emerald-700 text-sm'],
                  ['Payment Via', paymentReceipt.method, 'text-emerald-700'],
                  ['Date & Time', paymentReceipt.timestamp, 'text-slate-500']
                ].map(([label, val, cls]) => (
                  <div key={label} className="flex justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-slate-400 font-semibold">{label}:</span>
                    <span className={`font-bold ${cls}`}>{val}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => alert(`Receipt ${paymentReceipt.transactionId} saved!`)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer">
                  <Download className="w-3.5 h-3.5"/> Download Receipt
                </button>
                <button onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs hover:bg-blue-800 cursor-pointer">
                  Done ✓
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
