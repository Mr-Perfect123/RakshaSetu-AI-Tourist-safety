import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Bot, User, ShieldAlert, ArrowLeft, Volume2, Mic, Globe, CheckCircle2, Heart, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

// Language code mapping for speech recognition and TTS
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
  'Spanish': { speech: 'es-ES', tts: 'es-ES' },
  'Korean': { speech: 'ko-KR', tts: 'ko-KR' },
  'Chinese': { speech: 'zh-CN', tts: 'zh-CN' },
  'Arabic': { speech: 'ar-SA', tts: 'ar-SA' },
  'Portuguese': { speech: 'pt-BR', tts: 'pt-BR' },
  'Russian': { speech: 'ru-RU', tts: 'ru-RU' }
};

const AiAssistant = ({ darkMode }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Namaste! I am your RakshaSetu AI Safety Sentinel. Ask me about nearby police, safe travel routes, emergency guidance, or local translations.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isSosActive, setIsSosActive] = useState(false);
  const [listening, setListening] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/ai/history');
        if (res.data && res.data.length > 0) {
          const formatted = res.data.map(h => ({
            sender: h.sender,
            text: h.message
          }));
          setMessages(formatted);
        }
      } catch (err) {
        console.warn('Using initial AI welcome message');
      }
    };
    fetchHistory();
  }, []);

  const handleSend = async (queryText = null) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: textToSend,
        language: selectedLanguage,
        isSosActive
      });

      if (res.data && res.data.response) {
        setMessages((prev) => [...prev, {
          sender: 'ai',
          text: res.data.response,
          language: res.data.language,
          apiErrorDetails: res.data.apiErrorDetails || null
        }]);
      } else if (res.response) {
        setMessages((prev) => [...prev, {
          sender: 'ai',
          text: res.response,
          language: res.language,
          apiErrorDetails: res.apiErrorDetails || null
        }]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: '📍 **Nearby Emergency Responders**:\n- **Central Police Post**: 0.8 km (24/7 Active Duty)\n- **Emergency Trauma Hospital**: 1.4 km\n- **National Helpline**: Call **112** for immediate dispatch.',
          apiErrorDetails: `Network/Client Error: ${err.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Voice Input Speech Recognition — supports all languages
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Use proper language code from mapping
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

  // Text-To-Speech Read Aloud — uses correct language voice
  const speakText = (text, msgLanguage) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));

      // Set language for TTS
      const ttsLang = LANGUAGE_CODES[msgLanguage || selectedLanguage]?.tts || 'en-US';
      utterance.lang = ttsLang;

      // Try to find a matching voice
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang.startsWith(ttsLang.split('-')[0]));
      if (matchedVoice) utterance.voice = matchedVoice;

      window.speechSynthesis.speak(utterance);
    }
  };

  // Dark mode class helpers
  const cardBg = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textColor = darkMode ? 'text-slate-100' : 'text-slate-900';
  const mutedColor = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-4 pb-12 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/" className={`p-2 rounded-xl border transition-colors ${
            darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className={`text-lg font-extrabold flex items-center gap-2 m-0 ${darkMode ? 'text-blue-400' : 'text-[#0D47A1]'}`}>
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" /> Multilingual Gemini AI Safety Sentinel
            </h1>
            <p className={`text-[11px] m-0 ${mutedColor}`}>Emergency guidance, medical first-aid & regional translation</p>
          </div>
        </div>

        {/* Language Selector Dropdown */}
        <div className="flex items-center gap-2">
          <Globe className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-[#0D47A1]'}`} />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 shadow-xs ${
              darkMode
                ? 'bg-slate-800 border-slate-600 text-slate-200 focus:ring-blue-500'
                : 'bg-white border-slate-200 text-slate-700 focus:ring-[#0D47A1]'
            }`}
          >
            <option value="English">English 🇬🇧</option>
            <option value="Tamil">Tamil (தமிழ்) 🇮🇳</option>
            <option value="Hindi">Hindi (हिंदी) 🇮🇳</option>
            <option value="Kannada">Kannada (ಕನ್ನಡ) 🇮🇳</option>
            <option value="Telugu">Telugu (తెలుగు) 🇮🇳</option>
            <option value="Malayalam">Malayalam (മലയാളം) 🇮🇳</option>
            <option value="Marathi">Marathi (मराठी) 🇮🇳</option>
            <option value="French">French (Français) 🇫🇷</option>
            <option value="German">German (Deutsch) 🇩🇪</option>
            <option value="Japanese">Japanese (日本語) 🇯🇵</option>
            <option value="Spanish">Spanish (Español) 🇪🇸</option>
            <option value="Korean">Korean (한국어) 🇰🇷</option>
            <option value="Chinese">Chinese (中文) 🇨🇳</option>
            <option value="Arabic">Arabic (العربية) 🇸🇦</option>
            <option value="Portuguese">Portuguese (Português) 🇧🇷</option>
            <option value="Russian">Russian (Русский) 🇷🇺</option>
          </select>

          <button
            onClick={() => setIsSosActive(!isSosActive)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              isSosActive ? 'bg-[#D32F2F] text-white animate-bounce' : darkMode ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-red-50 text-[#D32F2F] border border-red-200'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            {isSosActive ? 'EMERGENCY MODE ACTIVE' : 'Emergency Mode'}
          </button>
        </div>
      </div>

      {/* Emergency Mode Banner */}
      {isSosActive && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
          darkMode ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-red-50 text-[#D32F2F] border border-red-200'
        }`}>
          <ShieldAlert className="w-5 h-5 shrink-0 animate-spin" />
          <span>EMERGENCY MODE ENGAGED: Gemini AI is providing high-priority first-aid, police guidance, and panic-calming protocols.</span>
        </div>
      )}

      {/* Suggested Quick Questions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium">
        <button
          onClick={() => handleSend('What is the first aid protocol for heatstroke?')}
          className={`px-3 py-1.5 rounded-full border whitespace-nowrap cursor-pointer ${
            darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500' : 'bg-white border-slate-200 text-slate-700 hover:border-[#0D47A1]'
          }`}
        >
          🩺 First Aid Protocol
        </button>
        <button
          onClick={() => handleSend('Where is the nearest police station?')}
          className={`px-3 py-1.5 rounded-full border whitespace-nowrap cursor-pointer ${
            darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500' : 'bg-white border-slate-200 text-slate-700 hover:border-[#0D47A1]'
          }`}
        >
          📍 Nearest Police Post
        </button>
        <button
          onClick={() => handleSend('Translate "I need help immediately" into Tamil')}
          className={`px-3 py-1.5 rounded-full border whitespace-nowrap cursor-pointer ${
            darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500' : 'bg-white border-slate-200 text-slate-700 hover:border-[#0D47A1]'
          }`}
        >
          🗣️ Translate Emergency Message
        </button>
      </div>

      {/* Chat Messages Box */}
      <div className={`${cardBg} rounded-3xl border shadow-xs h-[480px] flex flex-col overflow-hidden`}>
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${
                  m.sender === 'user' ? 'bg-[#0D47A1]' : 'bg-gradient-to-br from-amber-500 to-orange-600'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-1 max-w-md">
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#0D47A1] text-white rounded-tr-none'
                      : darkMode
                        ? 'bg-slate-700 text-slate-200 rounded-tl-none border border-slate-600 whitespace-pre-line'
                        : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/80 whitespace-pre-line'
                  }`}
                >
                  {m.text}
                </div>

                {m.apiErrorDetails && (
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-500 flex items-start gap-1.5">
                    <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span><strong>Gemini API Error Console:</strong> {m.apiErrorDetails}</span>
                  </div>
                )}

                {m.sender === 'ai' && (
                  <button
                    onClick={() => speakText(m.text, m.language)}
                    className={`text-[10px] font-bold flex items-center gap-1 px-1 cursor-pointer ${
                      darkMode ? 'text-slate-500 hover:text-blue-400' : 'text-slate-400 hover:text-[#0D47A1]'
                    }`}
                  >
                    <Volume2 className="w-3 h-3" /> Read Aloud
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className={`flex items-center gap-2 text-xs font-medium italic p-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              <Sparkles className="w-4 h-4 animate-spin text-amber-500" /> Gemini AI generating response in {selectedLanguage}...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className={`p-3 border-t flex items-center gap-2 ${
            darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
          }`}
        >
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer ${
              listening
                ? 'bg-[#D32F2F] text-white animate-pulse'
                : darkMode
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
            title={`Voice Input (${selectedLanguage})`}
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder={`Ask AI in ${selectedLanguage}... (Press Enter to send)`}
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
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-[#0D47A1] text-white hover:bg-blue-800 shadow-md transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiAssistant;
