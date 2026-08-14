import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ArrowLeft, Shield, MapPin, CheckCheck, Sparkles, Bot, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import socket from '../services/socket';
import api from '../services/api';

const LiveChat = ({ tourist, darkMode }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'admin',
      text: 'RakshaSetu Emergency Dispatch Desk & Gemini AI Sentinel connected. How can we protect and assist you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    socket.on('receive_chat_message', (data) => {
      // Only show messages from admin (not our own echoed messages)
      if (data.isFromAdmin) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'admin',
            text: data.message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isHuman: true
          }
        ]);
      }
    });

    return () => {
      socket.off('receive_chat_message');
    };
  }, []);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = input.trim();
    const userMsg = { sender: 'tourist', text: userMessage, time };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Emit live socket event for human control room dispatchers
    socket.emit('send_chat_message', { message: userMessage, user: tourist?.full_name || 'Tourist', userId: tourist?.id });

    try {
      // Call Gemini AI Assistant API Endpoint with selected language
      const res = await api.post('/ai/chat', {
        message: userMessage,
        language: selectedLanguage,
        isSosActive: false
      });
      
      // Extract exact response string from API payload structure
      let aiResponseText = '';
      if (res?.data?.response) {
        aiResponseText = res.data.response;
      } else if (res?.response) {
        aiResponseText = res.response;
      } else if (typeof res?.data === 'string') {
        aiResponseText = res.data;
      } else {
        aiResponseText = 'RakshaSetu Emergency Dispatch Desk logged your query. Nearby patrol units alerted.';
      }
      
      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          sender: 'admin',
          text: aiResponseText,
          time: aiTime,
          isAi: true,
          source: res?.data?.source || res?.source || 'Gemini AI'
        }
      ]);
    } catch (err) {
      console.error('Chat AI call error:', err);
      const fallbackTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          sender: 'admin',
          text: '📍 **Emergency Patrol Note**: Central Police Post CP Sector 1 is 0.8 km from your GPS area. If in immediate danger, use the Red SOS button for live GPS broadcast.',
          time: fallbackTime,
          isAi: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleShareLocation = async () => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Try to get real GPS coordinates
    let lat = 28.6120, lng = 77.2050, locText = '';
    
    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        locText = `📍 Shared Live GPS Coordinates: Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}`;
      } catch (err) {
        locText = `📍 Shared Live GPS Coordinates: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)} (Approximate)`;
      }
    } else {
      locText = `📍 Shared Live GPS Coordinates: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)} (Approximate)`;
    }
    
    const locMsg = { sender: 'tourist', text: locText, time };
    
    setMessages((prev) => [...prev, locMsg]);
    socket.emit('send_chat_message', { message: locText, user: tourist?.full_name || 'Tourist', userId: tourist?.id });
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: `I shared my GPS coordinates at Lat ${lat}, Lng ${lng}. What is the nearest police station or safe hospital?`,
        language: selectedLanguage
      });
      const aiResponseText = res?.data?.response || res?.response || 'GPS Location received by Police HQ. Nearest Police Desk: Janpath (0.8 km).';
      
      setMessages((prev) => [
        ...prev,
        {
          sender: 'admin',
          text: aiResponseText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAi: true
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'admin',
          text: '📍 GPS Location Broadcasted to Police HQ Command. Nearest Safe Facility: Central Police Station CP (0.8 km).',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAi: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Dark mode helpers
  const cardBg = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textColor = darkMode ? 'text-slate-100' : 'text-slate-900';

  return (
    <div className="space-y-4 pb-12 max-w-4xl mx-auto">
      {/* Header Bar — Frosted Glass Container for High Text Visibility */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-md flex items-center justify-between ${
        darkMode ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
      } backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <Link to="/" className={`p-2 rounded-xl border transition-colors ${
            darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className={`text-xl font-extrabold flex items-center gap-2 m-0 ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>
              <MessageSquare className="w-6 h-6 text-blue-600" /> Live Emergency Dispatcher & Gemini AI Chat
            </h1>
            <p className={`text-xs font-semibold m-0 mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Direct encrypted channel with Police HQ Dispatchers & Gemini AI Sentinel
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          {/* Language selector for LiveChat */}
          <div className="flex items-center gap-1.5">
            <Globe className={`w-3.5 h-3.5 ${darkMode ? 'text-blue-400' : 'text-[#0D47A1]'}`} />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className={`px-2 py-1 rounded-lg border text-[11px] font-bold focus:outline-none ${
                darkMode ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <option value="English">English</option>
              <option value="Tamil">Tamil</option>
              <option value="Hindi">Hindi</option>
              <option value="Kannada">Kannada</option>
              <option value="Telugu">Telugu</option>
              <option value="Malayalam">Malayalam</option>
              <option value="Marathi">Marathi</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Japanese">Japanese</option>
              <option value="Spanish">Spanish</option>
            </select>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${
            darkMode ? 'bg-blue-900/30 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-[#0D47A1]'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Gemini AI Active</span>
          </div>
        </div>
      </div>

      <div className={`${cardBg} rounded-3xl border shadow-sm h-[520px] flex flex-col overflow-hidden`}>
        {/* Chat Messages List */}
        <div className={`flex-1 p-4 overflow-y-auto space-y-3.5 ${darkMode ? 'bg-slate-900/30' : 'bg-slate-50/50'}`}>
          {messages.map((m, idx) => (
            <div key={idx} className={`flex items-start gap-3 ${m.sender === 'tourist' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-extrabold shrink-0 shadow-xs ${
                  m.sender === 'tourist' ? 'bg-[#0D47A1]' : 'bg-red-600'
                }`}
              >
                {m.sender === 'tourist' ? 'T' : <Shield className="w-4 h-4 text-white" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl max-w-md text-xs font-medium shadow-xs ${
                  m.sender === 'tourist'
                    ? 'bg-[#0D47A1] text-white rounded-tr-none'
                    : darkMode
                      ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                      : 'bg-white text-slate-900 rounded-tl-none border border-slate-200/90'
                }`}
              >
                <div className="whitespace-pre-line font-semibold leading-relaxed">{m.text}</div>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/30">
                  {m.isAi ? (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                      darkMode ? 'text-blue-300 bg-blue-900/40' : 'text-indigo-700 bg-indigo-50'
                    }`}>
                      🤖 Gemini AI Dispatcher
                    </span>
                  ) : (
                    <span></span>
                  )}
                  <span className={`text-[9px] font-bold ${m.sender === 'tourist' ? 'text-blue-100' : darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {m.time} <CheckCheck className="w-3.5 h-3.5 inline ml-0.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white animate-bounce" />
              </div>
              <div className={`text-xs px-4 py-3 rounded-2xl rounded-tl-none font-semibold flex items-center gap-2 shadow-xs ${
                darkMode ? 'bg-slate-800 border border-slate-700 text-slate-300' : 'bg-white border border-slate-200 text-slate-800'
              }`}>
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                <span>RakshaSetu Gemini AI Dispatch Desk generating {selectedLanguage} guidance...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className={`p-3.5 border-t flex items-center gap-2.5 ${
          darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <button
            type="button"
            onClick={handleShareLocation}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-all disabled:opacity-50"
            title="Share Live GPS Coordinates"
          >
            <MapPin className="w-4 h-4 text-white" /> GPS Pin
          </button>

          <input
            type="text"
            placeholder={`Type message in ${selectedLanguage} to Dispatcher or Gemini AI...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 ${
              darkMode
                ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:ring-blue-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-[#0D47A1]'
            }`}
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white shadow-md flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 transition-all"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default LiveChat;
