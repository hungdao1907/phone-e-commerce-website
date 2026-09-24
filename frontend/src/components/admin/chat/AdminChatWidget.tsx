import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, RotateCcw, Loader2, Sparkles, HelpCircle, User } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { MeshGradientSVG } from '../../ui/shader-svg';
import { cn } from '@/lib/utils';

const SESSION_KEY = 'webphone_admin_chat_session_id';
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  isError?: boolean;
  isLoading?: boolean;
  createdAt: number;
  timeString?: string;
}

interface QuickPrompt {
  label: string;
  query: string;
  icon: string;
}

const ADMIN_QUICK_PROMPTS: QuickPrompt[] = [
  {
    label: 'Xem doanh thu hôm nay',
    query: 'Báo cáo tổng quan doanh thu và số lượng đơn hàng hôm nay',
    icon: '📊'
  },
  {
    label: 'Xử lý đơn hàng mới',
    query: 'Hướng dẫn các bước duyệt và xử lý đơn hàng đang chờ',
    icon: '📦'
  },
  {
    label: 'Quản lý khách hàng tiềm năng',
    query: 'Làm thế nào để theo dõi và cập nhật trạng thái Leads?',
    icon: '👥'
  },
  {
    label: 'Tạo khuyến mãi mới',
    query: 'Cách thiết lập mã giảm giá và chiến dịch khuyến mãi',
    icon: '🏷️'
  }
];

export function AdminChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { token } = useAuthStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const getNewSessionId = () => {
    return crypto.randomUUID 
      ? crypto.randomUUID() 
      : `admin-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  const initWelcomeMessage = () => {
    const hours = new Date().getHours();
    const greeting = hours < 12 ? 'Chào buổi sáng!' : hours < 18 ? 'Chào buổi chiều!' : 'Chào buổi tối!';

    setMessages([
      {
        id: 'welcome-1',
        role: 'assistant',
        text: `${greeting} 👋 Tôi là Trợ lý AI Quản trị WebPhone (Copilot). Tôi có thể hỗ trợ bạn theo dõi doanh thu, tra cứu quy trình xử lý đơn hàng, hướng dẫn quản lý khách hàng tiềm năng và cấu hình hệ thống.`,
        createdAt: Date.now()
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

    // Show tooltip after 2.5 seconds if not open
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 2500);

    return () => clearTimeout(timer);
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

  const handleSend = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text || isSending) return;

    if (text.length > 2000) {
      alert('Tin nhắn quá dài (tối đa 2000 ký tự).');
      return;
    }

    if (!token) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Lỗi xác thực: Vui lòng đăng nhập lại tài khoản quản trị để sử dụng trợ lý.',
        isError: true,
        createdAt: Date.now()
      }]);
      return;
    }

    const sessionId = sessionStorage.getItem(SESSION_KEY) || getNewSessionId();

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      createdAt: Date.now()
    };

    const loadingId = crypto.randomUUID();
    const loadingMessage: ChatMessage = {
      id: loadingId,
      role: 'assistant',
      isLoading: true,
      createdAt: Date.now()
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
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
        text: data.response || 'Đã nhận được phản hồi.',
        createdAt: Date.now()
      };

      setMessages(prev => prev.filter(m => m.id !== loadingId).concat(assistantMessage));

    } catch (error: any) {
      const assistantError: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: error.message || 'Không thể kết nối với Trợ lý WebPhone lúc này. Vui lòng thử lại sau.',
        isError: true,
        createdAt: Date.now()
      };
      setMessages(prev => prev.filter(m => m.id !== loadingId).concat(assistantError));
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
    if (messagesContainerRef.current && !messagesContainerRef.current.contains(e.target as Node)) {
      messagesContainerRef.current.scrollTop += e.deltaY;
    }
  };

  const isOnlyWelcomeMessage = messages.length === 1 && messages[0].id === 'welcome-1';

  return (
    <>
      {/* Floating Trigger Button with Mascot and Tooltip */}
      <AnimatePresence>
        {!isOpen && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
            {/* Tooltip bubble */}
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.9 }}
                  className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-neutral-200/80 text-xs text-neutral-800 font-medium cursor-pointer select-none"
                  onClick={() => setIsOpen(true)}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Cần hỗ trợ quản trị? Nhắn Copilot nhé!</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTooltip(false);
                    }}
                    className="ml-1 text-neutral-400 hover:text-neutral-600 p-0.5"
                    aria-label="Đóng gợi ý"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Floating Action Mascot Button */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsOpen(true);
                setShowTooltip(false);
              }}
              className="relative cursor-pointer focus:outline-none select-none group"
              aria-label="Mở trợ lý ảo quản trị"
            >
              <div className="w-16 h-20 sm:w-[68px] sm:h-[85px] drop-shadow-[0_10px_25px_rgba(16,185,129,0.45)] group-hover:drop-shadow-[0_16px_32px_rgba(16,185,129,0.65)] transition-all duration-300">
                <MeshGradientSVG 
                  className="w-full h-full" 
                  colors={[
                    "#A7F3D0", // Emerald light
                    "#34D399", // Emerald
                    "#059669", // Emerald dark
                    "#047857", // Deep teal
                    "#064E3B", // Forest
                  ]}
                  speed={1.2} 
                />
              </div>
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* Main Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            data-lenis-prevent="true"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onWheel={handlePanelWheel}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[640px] max-h-[calc(100vh-2rem)] bg-[#f8f8fa] rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.22)] flex flex-col overflow-hidden border border-neutral-200/90 origin-bottom-right"
          >
            {/* Header with Glassmorphism */}
            <div className="bg-white/85 backdrop-blur-xl px-5 py-3.5 border-b border-neutral-200/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {/* AI Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 ring-2 ring-white">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-neutral-900 text-sm tracking-tight">Admin Assistant</h3>
                    <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
                      COPILOT
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-neutral-500 font-medium">Trực tuyến • Hướng dẫn & Điều hành</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100/80 rounded-full transition-colors"
                  title="Làm mới hội thoại"
                  aria-label="Làm mới hội thoại"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100/80 rounded-full transition-colors"
                  title="Đóng cửa sổ"
                  aria-label="Đóng chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div
              ref={messagesContainerRef}
              data-lenis-prevent="true"
              className="flex-1 overflow-y-auto p-4 sm:p-5 overscroll-contain space-y-3 custom-scrollbar"
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const timeFormatted = msg.timeString || new Intl.DateTimeFormat('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(msg.createdAt));

                return (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className={cn("flex w-full mb-3", isUser ? "justify-end" : "justify-start")}
                  >
                    <div className={cn("flex max-w-[88%] sm:max-w-[82%] gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
                      {/* Avatar */}
                      <div className="flex-shrink-0 mt-auto mb-1">
                        {isUser ? (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 text-white flex items-center justify-center shadow-xs">
                            <User className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 text-white flex items-center justify-center shadow-[0_2px_10px_rgba(16,185,129,0.35)] ring-2 ring-white">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Message Content Body */}
                      <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
                        {/* Text Bubble */}
                        {msg.text && (
                          <div className={cn(
                            "px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed break-words whitespace-pre-wrap shadow-xs",
                            isUser 
                              ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white rounded-br-xs shadow-emerald-500/15" 
                              : msg.isError
                              ? "bg-rose-50 text-rose-700 border border-rose-200/80 rounded-bl-xs"
                              : "bg-white/95 backdrop-blur-md border border-neutral-200/90 text-neutral-800 rounded-bl-xs shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                          )}>
                            {msg.text}
                          </div>
                        )}

                        {/* Typing Indicator */}
                        {msg.isLoading && (
                          <div className="bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-2.5 shadow-xs">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" />
                            </div>
                            <span className="text-xs text-neutral-500 font-medium">Trợ lý đang phản hồi...</span>
                          </div>
                        )}

                        {/* Timestamp */}
                        {!msg.isLoading && (
                          <span className="text-[10px] text-neutral-400 px-1 mt-0.5">
                            {timeFormatted}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Quick Prompts Hub (shown when starting a conversation) */}
              {isOnlyWelcomeMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="pt-2 pb-3"
                >
                  <div className="flex items-center gap-1.5 mb-2.5 px-1 text-xs font-semibold text-neutral-500">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Gợi ý tác vụ phổ biến:</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {ADMIN_QUICK_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(prompt.query)}
                        className="group flex items-center justify-between p-2.5 bg-white/90 hover:bg-white border border-neutral-200/80 hover:border-emerald-300 rounded-xl text-left shadow-xs hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{prompt.icon}</span>
                          <span className="text-xs font-medium text-neutral-700 group-hover:text-emerald-600 transition-colors truncate">
                            {prompt.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-400 group-hover:text-emerald-500 transition-colors ml-2 shrink-0">
                          Gửi ↵
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Dock Area */}
            <div className="bg-white/90 backdrop-blur-xl p-3 sm:p-4 shrink-0 border-t border-neutral-200/70">
              <div className="relative flex items-end gap-2 bg-neutral-100/90 rounded-2xl p-1.5 pl-3.5 border border-neutral-200/60 focus-within:border-emerald-500/80 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/15 transition-all shadow-xs">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi về quản trị đơn hàng, doanh thu, cài đặt..."
                  className="w-full max-h-28 bg-transparent resize-none outline-none py-2 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 font-normal leading-relaxed"
                  rows={1}
                  disabled={isSending}
                  style={{
                    minHeight: '38px',
                    height: 'auto',
                  }}
                />

                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isSending}
                  className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all duration-200 mb-0.5 mr-0.5 ${
                    input.trim() && !isSending
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/25 active:scale-95'
                      : 'bg-neutral-200/70 text-neutral-400 cursor-not-allowed'
                  }`}
                  aria-label="Gửi tin nhắn"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                  ) : (
                    <Send className="w-4 h-4 ml-0.5" />
                  )}
                </button>
              </div>

              {/* Micro-hint */}
              <div className="mt-2 px-1 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Nhấn <strong>Enter</strong> để gửi</span>
                <span className="hidden sm:inline">Shift + Enter để xuống dòng</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
