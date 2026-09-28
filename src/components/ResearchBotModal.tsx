'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ResearchPaper } from '@/types';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  FileText, 
  Download, 
  ExternalLink, 
  Loader2, 
  CheckCircle2, 
  GraduationCap,
  Lightbulb,
  FlaskConical,
  Mail
} from 'lucide-react';

interface ResearchBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: ResearchPaper | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export const ResearchBotModal: React.FC<ResearchBotModalProps> = ({ isOpen, onClose, paper }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paper && isOpen) {
      // Initialize greeting message for the paper
      setMessages([
        {
          id: 'welcome-msg',
          sender: 'bot',
          text: `👋 Hello! I am your **AI Research Assistant**.\n\nI have analyzed **"${paper.title}"** published in *${paper.venue}* (${paper.year}).\n\nHow can I help you understand this paper? You can click one of the quick questions below or ask me anything!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [paper, isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen || !paper) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/research/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          paperTitle: paper.title,
          paperAbstract: paper.abstract,
          paperVenue: paper.venue,
          authors: paper.authors.map((a) => a.name).join(', '),
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: 'Sorry, I had trouble connecting to the research server. Please try asking again!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    { label: '💡 Explain in simple terms', text: 'Explain this paper in simple terms for a student' },
    { label: '🔬 What is the methodology?', text: 'What is the main research methodology used in this paper?' },
    { label: '📊 Key findings & contributions', text: 'What are the main findings and scientific contributions?' },
    { label: '✉️ Mention in Cold Email to Prof', text: 'How can I mention this paper when emailing the professor?' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#7150E7] via-indigo-600 to-[#5E43D8] text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
              <Bot className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold leading-tight">Research AI Assistant</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-900 uppercase">Live Bot</span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5 truncate max-w-sm font-medium">
                Target: {paper.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Banner Snippet */}
        <div className="bg-[#F4F3FE] px-6 py-3 border-b border-[#DDD7FA] flex items-center justify-between gap-3 text-xs">
          <div className="min-w-0">
            <div className="font-bold text-[#101828] truncate">{paper.title}</div>
            <div className="text-[#64748B] text-[11px] truncate">
              {paper.venue} • {paper.year} • {paper.citationCount} Citations
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {paper.pdfUrl && (
              <a
                href={paper.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-[#7150E7] hover:bg-[#5e3cd4] text-white font-semibold text-[11px] flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <Download className="w-3 h-3" />
                <span>PDF</span>
              </a>
            )}
            <a
              href={paper.googleScholarUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px] flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Scholar</span>
            </a>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#7150E7] text-white rounded-tr-xs font-medium'
                    : 'bg-white text-[#101828] border border-slate-200 rounded-tl-xs shadow-2xs'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-[#7150E7] bg-white p-3 rounded-2xl border border-slate-200 w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-[#7150E7]" />
              <span className="font-semibold">AI Assistant is analyzing research paper...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-6 py-2.5 bg-white border-t border-slate-200 overflow-x-auto flex items-center gap-2 shrink-0 no-scrollbar">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.text)}
              disabled={isTyping}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#EDE9FC] text-[#7150E7] hover:bg-[#7150E7] hover:text-white transition-all cursor-pointer whitespace-nowrap shrink-0 border border-[#DDD7FA]"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything about this paper (e.g. methodology, abstract, cold email tips)..."
              className="flex-1 h-11 bg-slate-50 border border-slate-200 rounded-full px-4 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#7150E7] placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="w-11 h-11 rounded-full bg-[#7150E7] hover:bg-[#5e3cd4] text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-md shadow-purple-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
