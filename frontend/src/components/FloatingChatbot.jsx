import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, X, Send, Mic, Volume2, Globe, Shield, MessageSquare, AlertOctagon, Minimize2 } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';

const LANGUAGE_CODES = {
  'English': { speech: 'en-US', tts: 'en-US' },
  'Tamil': { speech: 'ta-IN', tts: 'ta-IN' },
  'Hindi': { speech: 'hi-IN', tts: 'hi-IN' },
  'Kannada': { speech: 'kn-IN', tts: 'kn-IN' },
  'Telugu': { speech: 'te-IN', tts: 'te-IN' },
  'Malayalam': { speech: 'ml-IN', tts: 'ml-IN' },
  'Marathi': { speech: 'mr-IN', tts: 'mr-IN' },
  'French': { speech: 'fr-FR', tts: 'fr-FR' },
  'German': { speech: 'de-DE', tts: 'de-DE' },
  'Japanese': { speech: 'ja-JP', tts: 'ja-JP' },
  'Spanish': { speech: 'es-ES', tts: 'es-ES' }
};

const FloatingChatbot = ({ tourist, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' or 'dispatch'
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Namaste! I am your RakshaSetu AI Safety Sentinel. Ask me about nearby police, safe travel routes, or emergency guidance.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [listening, setListening] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isOpen, loading]);

  // Socket listener for admin dispatch replies
  useEffect(() => {
    const handleAdminMessage = (data) => {
      if (data.isFromAdmin) {
        const newMsg = {
          sender: 'admin',
          text: data.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isHuman: true
        };
        setMessages((prev) => [...prev, newMsg]);
        if (!isOpen) setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on('receive_chat_message', handleAdminMessage);
    return () => {
      socket.off('receive_chat_message', handleAdminMessage);
    };
  }, [isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const textToSend = input.trim();
    if (!textToSend || loading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user', text: textToSend, time };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Relay to admin socket if in dispatch mode
    if (activeTab === 'dispatch') {
      socket.emit('send_chat_message', {
        message: textToSend,
        user: tourist?.full_name || 'Tourist',
        userId: tourist?.id
      });
    }

    try {
      const res = await api.post('/ai/chat', {
        message: textToSend,
        language: selectedLanguage,
        isSosActive: false
      });

      const responseText = res?.data?.response || res?.response || 'RakshaSetu AI logged your query. Stay safe in your area.';
      const aiMsg = {
        sender: activeTab === 'dispatch' ? 'admin' : 'ai',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: selectedLanguage,
        isAi: true,
        apiErrorDetails: res?.data?.apiErrorDetails || res?.apiErrorDetails || null
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: '📍 **Nearby Responders**: Central Police Post CP (0.8 km). Call **112** for immediate emergency services.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAi: true,
          apiErrorDetails: `Network/Client Error: ${err.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    const langCode = LANGUAGE_CODES[selectedLanguage]?.speech || 'en-US';
    recognition.lang = langCode;
    recognition.continuous = false;
    recognition.interimResults = false;

    setListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  };

  const speakText = (text, msgLang) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
      const ttsLang = LANGUAGE_CODES[msgLang || selectedLanguage]?.tts || 'en-US';
      utterance.lang = ttsLang;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Dark mode class helpers
  const cardBg = darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const headerBg = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-[#0D47A1] text-white';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Widget Drawer */}
      {isOpen && (
        <div className={`w-80 sm:w-96 h-[510px] ${cardBg} rounded-3xl border shadow-2xl flex flex-col overflow-hidden mb-3 animate-in slide-in-from-bottom-5 duration-300`}>
          {/* Header */}
          <div className={`${headerBg} p-3.5 flex items-center justify-between shadow-md`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <Bot className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold m-0 leading-tight flex items-center gap-1.5 text-white">
                  RAKSHASETU AI <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                </h3>
                <p className="text-[10px] text-white/80 m-0 font-medium">Multilingual Safety Sentinel</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Picker */}
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/20 text-white border border-white/30 focus:outline-none cursor-pointer"
              >
                <option value="English" className="text-slate-900">EN 🇬🇧</option>
                <option value="Tamil" className="text-slate-900">TA (தமிழ்)</option>
                <option value="Hindi" className="text-slate-900">HI (हिंदी)</option>
                <option value="Kannada" className="text-slate-900">KN (ಕನ್ನಡ)</option>
                <option value="Telugu" className="text-slate-900">TE (తెలుగు)</option>
                <option value="French" className="text-slate-900">FR 🇫🇷</option>
                <option value="German" className="text-slate-900">DE 🇩🇪</option>
                <option value="Japanese" className="text-slate-900">JA 🇯🇵</option>
                <option value="Spanish" className="text-slate-900">ES 🇪🇸</option>
              </select>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                title="Minimize Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dual Mode Tab Selector */}
          <div className={`grid grid-cols-2 text-center text-[11px] font-bold border-b ${
            darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveTab('ai')}
              className={`py-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'ai'
                  ? darkMode ? 'bg-slate-900 text-blue-400 border-b-2 border-blue-400' : 'bg-white text-[#0D47A1] border-b-2 border-[#0D47A1]'
                  : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Gemini AI
            </button>
            <button
              onClick={() => setActiveTab('dispatch')}
              className={`py-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'dispatch'
                  ? darkMode ? 'bg-slate-900 text-blue-400 border-b-2 border-blue-400' : 'bg-white text-[#0D47A1] border-b-2 border-[#0D47A1]'
                  : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-red-500" /> Police Dispatch
            </button>
          </div>

          {/* Messages Body */}
          <div className={`flex-1 p-3 overflow-y-auto space-y-3 ${
            darkMode ? 'bg-slate-900/50' : 'bg-slate-50/50'
          }`}>
            {messages.map((m, idx) => (
              <div key={idx} className={`flex items-start gap-2 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                    m.sender === 'user' ? 'bg-[#0D47A1]' : 'bg-amber-600'
                  }`}
                >
                  {m.sender === 'user' ? 'T' : <Bot className="w-3.5 h-3.5 text-white" />}
                </div>

                <div className="space-y-1 max-w-[80%]">
                  <div
                    className={`p-2.5 rounded-2xl text-[11px] leading-relaxed shadow-xs ${
                      m.sender === 'user'
                        ? 'bg-[#0D47A1] text-white rounded-tr-none'
                        : darkMode
                          ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700 whitespace-pre-line'
                          : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 whitespace-pre-line'
                    }`}
                  >
                    {m.text}
                  </div>

                  {m.apiErrorDetails && (
                    <div className="mt-1.5 p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-[10px] font-mono text-red-500 flex items-start gap-1">
                      <AlertOctagon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span><strong>Gemini API Error Console:</strong> {m.apiErrorDetails}</span>
                    </div>
                  )}

                  {m.sender !== 'user' && (
                    <button
                      onClick={() => speakText(m.text, m.language)}
                      className={`text-[9px] font-bold flex items-center gap-1 cursor-pointer px-1 ${
                        darkMode ? 'text-slate-500 hover:text-blue-400' : 'text-slate-400 hover:text-[#0D47A1]'
                      }`}
                    >
                      <Volume2 className="w-2.5 h-2.5" /> Listen
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className={`flex items-center gap-2 text-[10px] font-semibold italic p-2 ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-500" />
                Gemini AI replying in {selectedLanguage}...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
          <form onSubmit={handleSend} className={`p-2.5 border-t flex items-center gap-2 ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                listening
                  ? 'bg-red-600 text-white animate-pulse'
                  : darkMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title={`Voice Mic (${selectedLanguage})`}
            >
              <Mic className="w-3.5 h-3.5" />
            </button>

            <input
              type="text"
              placeholder={`Ask Gemini in ${selectedLanguage}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={`flex-1 px-3 py-2 rounded-xl border text-[11px] font-medium focus:outline-none ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-[#0D47A1]'
              }`}
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white shadow-sm disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer relative ${
          isOpen
            ? 'bg-slate-800 text-white border-2 border-slate-600'
            : 'bg-gradient-to-br from-[#0D47A1] via-[#1565C0] to-blue-700 border-2 border-blue-400/40 sos-button-pulse'
        }`}
        title="Open AI Safety Chatbot"
      >
        {isOpen ? (
          <Minimize2 className="w-6 h-6 text-white" />
        ) : (
          <>
            <Bot className="w-7 h-7 text-amber-300" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[9px] font-black text-slate-900 shadow-md">
              AI
            </span>
          </>
        )}
      </button>
    </div>
  );
};

export default FloatingChatbot;
