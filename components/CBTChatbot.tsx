
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { chatWithTherapist } from '../services/geminiService';
import { ChatMessage, LoadingState } from '../types';

const SUGGESTIONS = [
  "What are the 3Cs?",
  "How do I stop catastrophic thinking?",
  "Explain 'Mental Filtering'",
  "I feel overwhelmed right now",
];

const CBTChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm MindCalm AI. I can explain CBT concepts, help you identify thinking traps, or just listen. How can I support you today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStatus(LoadingState.LOADING);

    try {
      // Prepare history for API (exclude IDs/timestamps)
      const historyForApi = messages.map(m => ({ role: m.role, content: m.content }));
      
      const responseText = await chatWithTherapist(text, historyForApi);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);
      setStatus(LoadingState.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(LoadingState.ERROR);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
        <div className="p-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full">
          <Bot size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white">MindCalm Assistant</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Gemini AI • Educational Support Only</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/20">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' 
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-none'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-tl-none shadow-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {status === LoadingState.LOADING && (
          <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Bot size={16} />
             </div>
             <div className="bg-white dark:bg-slate-700 p-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-600 shadow-sm">
                <div className="flex gap-1">
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
        {/* Chips */}
        {messages.length < 3 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                {SUGGESTIONS.map(s => (
                    <button
                        key={s}
                        onClick={() => handleSend(s)}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-full whitespace-nowrap transition-colors flex items-center gap-1"
                    >
                        <Sparkles size={12} /> {s}
                    </button>
                ))}
            </div>
        )}

        <div className="flex gap-2">
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                placeholder="Ask about GAD, CBT techniques..."
                className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm dark:text-white"
                disabled={status === LoadingState.LOADING}
            />
            <button 
                onClick={() => handleSend(input)}
                disabled={!input.trim() || status === LoadingState.LOADING}
                className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl disabled:opacity-50 transition-colors"
            >
                <Send size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default CBTChatbot;
