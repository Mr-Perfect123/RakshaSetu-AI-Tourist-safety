import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, AlertTriangle, ShieldCheck, MapPin, RefreshCw } from 'lucide-react';
import api from '../services/api';

const AiChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Greetings! I am your RakshaSetu Gemini AI Safety Assistant. I can assist with spatio-temporal crime advisories, safe route planning, emergency translation, or panic response guidance.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: currentInput });
      const aiResponse = res.data?.response || res.data?.data?.response || 'I am actively monitoring your safety. If in immediate danger, trigger the Red SOS button.';
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: aiResponse,
          source: res.data?.source || res.data?.data?.source || 'Gemini AI',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: '⚠️ Operating in Emergency Guidance Mode. Stay in well-lit areas. For immediate police dispatch, click the Emergency SOS Queue.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'What is the safest route to Connaught Place at night?',
    'Translate "I need emergency medical assistance" into Hindi',
    'What is the crime risk score for Old Delhi area?'
  ];

  return (
    <div className="space-y-6 pb-8 h-[calc(100vh-100px)] flex flex-col">
      {/* Header Bar — Royal Ocean Gradient Banner */}
      <div className="bg-gradient-to-r from-[#0a2540] via-[#0D47A1] to-[#1e3a8a] text-white p-5 rounded-3xl shadow-xl border border-blue-900/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center shadow-md backdrop-blur-md">
            <Bot className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-base font-black text-white flex items-center gap-2 m-0">
              Gemini AI Emergency Safety Chatbot
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wide border border-white/20">
                Gemini Flash REST
              </span>
            </h1>
            <p className="text-xs text-blue-100 font-semibold m-0 mt-0.5">Real-time emergency translation, route risk evaluation, and panic advice</p>
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="px-3.5 py-1.5 rounded-xl bg-white text-blue-900 font-black text-xs hover:bg-blue-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Main Chat Body */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
        {/* Messages List Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-[#0D47A1] text-white font-bold text-xs'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-[#0D47A1] text-white font-medium rounded-tr-none'
                    : 'bg-white text-slate-900 font-normal border border-slate-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div
                  className={`text-[10px] mt-1.5 font-medium flex items-center justify-between ${
                    m.sender === 'user' ? 'text-blue-200' : 'text-slate-500'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {m.source && <span className="ml-2 font-mono text-[9px] uppercase font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{m.source}</span>}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="bg-white border border-slate-200 text-slate-800 text-xs px-4 py-3 rounded-2xl rounded-tl-none font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>Evaluating safety query via Gemini REST API...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sample Prompt Chips */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Quick Queries:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setInput(p)}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-[#0D47A1] text-slate-800 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer border border-slate-200"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your emergency query, route question, or phrase to translate..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-slate-50 placeholder-slate-500 text-xs font-semibold focus:ring-2 focus:ring-[#0D47A1] focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-5 py-3 rounded-xl bg-[#0D47A1] text-white font-extrabold text-xs hover:bg-blue-800 active:bg-blue-900 transition-all shadow-md shadow-blue-900/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiChat;
