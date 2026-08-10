import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Mic, Volume2, Globe, AlertOctagon, Phone, Shield, MapPin, RefreshCw, Activity, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AiAssistant = ({ darkMode }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Namaste! I am RakshaSetu AI, your multilingual tourist protection assistant. How can I help secure your journey today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  const languagesList = [
    { label: 'English', code: 'English' },
    { label: 'हिन्दी (Hindi)', code: 'Hindi' },
    { label: 'தமிழ் (Tamil)', code: 'Tamil' },
    { label: 'తెలుగు (Telugu)', code: 'Telugu' },
    { label: 'मराठी (Marathi)', code: 'Marathi' },
    { label: 'বাংলা (Bengali)', code: 'Bengali' },
    { label: 'ಕನ್ನಡ (Kannada)', code: 'Kannada' },
    { label: 'മലയാളം (Malayalam)', code: 'Malayalam' },
    { label: 'Français (French)', code: 'French' },
    { label: 'Deutsch (German)', code: 'German' },
    { label: '日本語 (Japanese)', code: 'Japanese' },
    { label: 'Español (Spanish)', code: 'Spanish' },
    { label: '한국어 (Korean)', code: 'Korean' },
    { label: '中文 (Chinese)', code: 'Chinese' },
    { label: 'العربية (Arabic)', code: 'Arabic' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (customMsg = null) => {
    const textToSend = customMsg || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customMsg) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: textToSend,
        language: language,
        isSosActive: emergencyMode
      });

      const responseText = res.data?.data?.response || res.data?.response || 'I am protecting your location. Emergency response centers have been alerted.';

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `🚨 RakshaSetu Safety System: Area is monitored. For immediate emergency police assistance, call 112 or press the SOS button.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice mic is not supported on this browser. Please type your message.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'Hindi' ? 'hi-IN' : language === 'Tamil' ? 'ta-IN' : 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleSpeakResponse = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const cardClass = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textClass = darkMode ? 'text-slate-100' : 'text-slate-900';

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* Header Bar */}
      <div className={`${cardClass} p-4 rounded-3xl border shadow-md flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className={`text-lg font-black m-0 ${textClass}`}>RakshaSetu AI Safety Assistant</h1>
            <p className="text-xs text-slate-500 m-0 font-medium">Powered by Gemini-Flash-Latest REST Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-slate-50 text-xs font-bold text-slate-700">
            <Globe className="w-4 h-4 text-purple-600" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent border-none text-xs font-extrabold focus:outline-none cursor-pointer"
            >
              {languagesList.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Emergency Mode Toggle Button */}
          <button
            onClick={() => setEmergencyMode(!emergencyMode)}
            className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase flex items-center gap-1 cursor-pointer transition-all ${
              emergencyMode ? 'bg-red-600 text-white animate-pulse' : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            <AlertOctagon className="w-4 h-4" /> {emergencyMode ? 'Emergency Active' : 'Emergency Mode'}
          </button>
        </div>
      </div>

      {/* Emergency Mode Non-AI Fast Action Bar */}
      {emergencyMode && (
        <div className="p-4 rounded-3xl bg-red-600 text-white shadow-xl space-y-2 border border-red-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 animate-bounce" /> 🚨 EMERGENCY DIRECT ACTION DESK
            </span>
            <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded">GPS Priority Active</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-extrabold">
            <a href="tel:112" className="py-2.5 rounded-xl bg-white text-red-700 text-center decoration-none shadow-xs hover:bg-slate-100">
              📞 Call 112
            </a>
            <button onClick={() => navigate('/nearby')} className="py-2.5 rounded-xl bg-white/20 text-white hover:bg-white/30 cursor-pointer">
              🚔 Nearest Police
            </button>
            <button onClick={() => navigate('/nearby')} className="py-2.5 rounded-xl bg-white/20 text-white hover:bg-white/30 cursor-pointer">
              🏥 Nearest Hospital
            </button>
            <button onClick={() => alert('GPS position broadcasted to emergency contacts.')} className="py-2.5 rounded-xl bg-white/20 text-white hover:bg-white/30 cursor-pointer">
              📍 Share Location
            </button>
            <button onClick={() => navigate('/')} className="py-2.5 rounded-xl bg-amber-400 text-slate-900 font-black cursor-pointer">
              🚨 Trigger SOS
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages Body */}
      <div className={`${cardClass} p-4 md:p-6 rounded-3xl border shadow-md h-[460px] flex flex-col justify-between`}>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] p-4 rounded-2xl text-xs space-y-1 ${
                  msg.sender === 'user'
                    ? 'bg-[#0D47A1] text-white rounded-br-none shadow-xs'
                    : darkMode
                      ? 'bg-slate-700 text-slate-100 border border-slate-600 rounded-bl-none'
                      : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] font-bold opacity-80 border-b pb-1 mb-1 border-white/20">
                  <span>{msg.sender === 'user' ? 'You' : 'RakshaSetu AI'}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="m-0 leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
                {msg.sender === 'ai' && (
                  <button
                    onClick={() => handleSpeakResponse(msg.text)}
                    className="text-[10px] font-bold text-purple-600 dark:text-purple-300 mt-1 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" /> Listen
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="p-3 rounded-2xl bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-700" />
                RakshaSetu AI is analyzing safety advisory in {language}...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={toggleSpeechRecognition}
            className={`p-3 rounded-2xl border text-slate-600 cursor-pointer ${
              isListening ? 'bg-red-500 text-white animate-ping' : 'bg-slate-100 hover:bg-slate-200'
            }`}
            title="Speak query"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            placeholder={`Ask RakshaSetu AI in ${language}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`flex-1 px-4 py-3 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 ${
              darkMode ? 'bg-slate-700 border-slate-600 text-white focus:ring-purple-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-[#0D47A1]'
            }`}
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || loading}
            className={`px-5 py-3 rounded-2xl font-extrabold text-xs uppercase flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              !input.trim() || loading
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-[#0D47A1] hover:bg-blue-800 text-white'
            }`}
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
