import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, RotateCcw, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

const SESSION_KEY = 'webphone_admin_chat_session_id';
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isError?: boolean;
};

export function AdminChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { token } = useAuthStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const getNewSessionId = () => {
    return crypto.randomUUID 
      ? crypto.randomUUID() 
      : `admin-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  const initWelcomeMessage = () => {
    setMessages([
      {
        id: 'welcome-1',
        role: 'assistant',
        text: 'Xin chào! Tôi có thể hướng dẫn bạn sử dụng WebPhone Admin.\nBạn cần hỗ trợ chức năng nào?'
      }
    ]);
  };

  useEffect(() => {
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = getNewSessionId();
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    initWelcomeMessage();
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending]);

  const handleResetChat = () => {
    const newSession = getNewSessionId();
    sessionStorage.setItem(SESSION_KEY, newSession);
    initWelcomeMessage();
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    if (text.length > 2000) {
      alert('Tin nhắn quá dài (tối đa 2000 ký tự).');
      return;
    }

    if (!token) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Lỗi xác thực: Vui lòng đăng nhập lại.',
        isError: true
      }]);
      return;
    }

    const sessionId = sessionStorage.getItem(SESSION_KEY) || getNewSessionId();

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.response || 'Không thể kết nối với Trợ lý WebPhone lúc này. Vui lòng thử lại sau.');
      }

      if (data.sessionId && data.sessionId !== sessionId) {
        sessionStorage.setItem(SESSION_KEY, data.sessionId);
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: data.response || 'Đã nhận được phản hồi.'
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      const assistantError: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: error.message || 'Không thể kết nối với Trợ lý WebPhone lúc này. Vui lòng thử lại sau.',
        isError: true
      };
      setMessages(prev => [...prev, assistantError]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePanelWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 bg-black/60 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-black/80 hover:border-white/40 transition-all duration-300 group"
              title="Trợ lý WebPhone"
            >
              <Bot className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* Main Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onWheel={handlePanelWheel}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] max-h-[calc(100vh-2rem)] bg-black/70 backdrop-blur-xl rounded-[24px] shadow-2xl flex flex-col overflow-hidden border border-white/10 origin-bottom-right"
          >
            {/* Header */}
            <div className="bg-black/40 px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm tracking-tight">WebPhone Admin Assistant</h3>
                  <p className="text-[11px] text-white/50 font-medium mt-0.5">Hướng dẫn sử dụng trang quản trị</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetChat}
                  className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Làm mới hội thoại"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Đóng cửa sổ"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-emerald-500/20 text-emerald-50 border border-emerald-500/30 rounded-br-sm'
                        : msg.isError
                        ? 'bg-red-500/20 text-red-100 border border-red-500/30 rounded-bl-sm'
                        : 'bg-white/10 text-neutral-100 border border-white/10 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {isSending && (
                <div className="flex w-full justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span className="text-[12px] text-white/50">Đang trả lời...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-black/40 p-4 shrink-0 border-t border-white/10">
              <div className="relative flex items-end gap-2 bg-white/5 rounded-xl p-2 border border-white/10 focus-within:border-emerald-500/50 focus-within:bg-white/10 transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi cách sử dụng WebPhone Admin..."
                  className="w-full max-h-24 bg-transparent resize-none outline-none py-1.5 px-2 text-[13px] text-white placeholder:text-white/40 leading-relaxed custom-scrollbar"
                  rows={1}
                  disabled={isSending}
                  style={{ minHeight: '34px' }}
                />

                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isSending}
                  className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center transition-all mb-0.5 ${
                    input.trim() && !isSending
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 active:scale-95'
                      : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="mt-2 text-[10px] text-white/30 text-center">
                Nhấn <strong>Enter</strong> để gửi, Shift + Enter để xuống dòng
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
