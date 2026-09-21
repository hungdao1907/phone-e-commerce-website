import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, RotateCcw, Sparkles, HelpCircle, Loader2 } from 'lucide-react';
import { ChatMessage, QuickPrompt } from './types';
import { ChatMessageItem } from './ChatMessageItem';
import { sendChatMessage } from '../../services/chatbot.api';
import { MeshGradientSVG } from '../ui/shader-svg';

const SESSION_KEY = 'webphone_chat_session_id';

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    label: 'iPhone 16 Pro Max',
    query: 'iPhone 16 Pro Max giá bao nhiêu và có những màu gì?',
    icon: '📱'
  },
  {
    label: 'Báo giá iPhone 15 Pro',
    query: 'Tạo báo giá iPhone 15 Pro 256GB',
    icon: '📄'
  },
  {
    label: 'Tư vấn dưới 15 triệu',
    query: 'Tư vấn điện thoại tốt nhất tầm giá dưới 15 triệu',
    icon: '⚡'
  },
  {
    label: 'Chính sách bảo hành',
    query: 'Chính sách bảo hành và đổi trả sản phẩm như thế nào?',
    icon: '🛡️'
  }
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Prevent background Lenis scroll when mouse is hovering anywhere over the chatbot
  const handlePanelWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (messagesContainerRef.current && !messagesContainerRef.current.contains(e.target as Node)) {
      messagesContainerRef.current.scrollTop += e.deltaY;
    }
  };

  const getNewSessionId = () => {
    return crypto.randomUUID 
      ? crypto.randomUUID() 
      : `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  const initWelcomeMessage = () => {
    const hours = new Date().getHours();
    const greeting = hours < 12 ? 'Chào buổi sáng!' : hours < 18 ? 'Chào buổi chiều!' : 'Chào buổi tối!';

    setMessages([
      {
        id: 'welcome-1',
        role: 'assistant',
        text: `${greeting} 👋 Tôi là trợ lý AI của WebPhone. Tôi có thể hỗ trợ bạn tìm kiếm điện thoại, so sánh thông số, tư vấn theo ngân sách và tạo báo giá chính thức kèm PDF.`,
        createdAt: Date.now()
      }
    ]);
  };

  // Initialize session and welcome message
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

  // Reset conversation handler
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
      const response = await sendChatMessage(text, sessionId);
      
      // Update session if backend sent a new one
      if (response.sessionId && response.sessionId !== sessionId) {
        sessionStorage.setItem(SESSION_KEY, response.sessionId);
      }

      // Build assistant message from response
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        createdAt: Date.now(),
      };

      if (response.result_type === 'product_search') {
        assistantMessage.text = response.response;
        assistantMessage.products = response.products;
      } else if (response.result_type === 'quotation') {
        assistantMessage.text = response.response || response.message;
        if (response.response_type === 'file') {
          assistantMessage.quotation = {
            responseType: 'file',
            success: response.success,
            quoteStatus: response.quote_status,
            quoteNumber: response.quote_number,
            fileName: response.file_name,
            mimeType: response.mime_type,
            downloadUrl: response.download_url,
            totalDisplay: response.total_display
          };
        }
      } else if (response.result_type === 'error') {
        assistantMessage.isError = true;
        assistantMessage.text = response.response;
      } else {
        // Fallback for no_result, faq, or unknown
        assistantMessage.text = response.response || 'Đã nhận được phản hồi từ hệ thống.';
      }

      setMessages(prev => prev.map(m => m.id === loadingId ? assistantMessage : m));
    } catch (error) {
      setMessages(prev => prev.map(m => m.id === loadingId ? {
        id: crypto.randomUUID(),
        role: 'assistant',
        createdAt: Date.now(),
        isError: true
      } : m));
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

  const isOnlyWelcomeMessage = messages.length === 1 && messages[0].id === 'welcome-1';

  return (
    <>
      {/* Floating Trigger Button with Pulsing Ring and Tooltip */}
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
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>Cần tư vấn mua sắm? Nhắn trợ lý nhé!</span>
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
              aria-label="Mở trợ lý ảo AI"
            >
              {/* Dynamic MeshGradient Mascot Icon */}
              <div className="w-16 h-20 sm:w-[68px] sm:h-[85px] drop-shadow-[0_10px_25px_rgba(79,70,229,0.45)] group-hover:drop-shadow-[0_16px_32px_rgba(79,70,229,0.65)] transition-all duration-300">
                <MeshGradientSVG className="w-full h-full" speed={1.2} />
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
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 ring-2 ring-white">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-neutral-900 text-sm tracking-tight">WebPhone Assistant</h3>
                    <span className="px-1.5 py-0.2 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
                      AI
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-neutral-500 font-medium">Trực tuyến 24/7 • Tư vấn & Báo giá</span>
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
              className="flex-1 overflow-y-auto p-4 sm:p-5 overscroll-contain space-y-2"
            >
              {messages.map((msg) => (
                <ChatMessageItem key={msg.id} message={msg} />
              ))}

              {/* Quick Prompts Hub (shown when starting a conversation) */}
              {isOnlyWelcomeMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="pt-2 pb-3"
                >
                  <div className="flex items-center gap-1.5 mb-2.5 px-1 text-xs font-semibold text-neutral-500">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>Gợi ý câu hỏi phổ biến:</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {QUICK_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(prompt.query)}
                        className="group flex items-center justify-between p-2.5 bg-white/90 hover:bg-white border border-neutral-200/80 hover:border-blue-300 rounded-xl text-left shadow-xs hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{prompt.icon}</span>
                          <span className="text-xs font-medium text-neutral-700 group-hover:text-blue-600 transition-colors truncate">
                            {prompt.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-400 group-hover:text-blue-500 transition-colors ml-2 shrink-0">
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
              <div className="relative flex items-end gap-2 bg-neutral-100/90 rounded-2xl p-1.5 pl-3.5 border border-neutral-200/60 focus-within:border-blue-500/80 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/15 transition-all shadow-xs">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi về sản phẩm, giá, cấu hình..."
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
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25 active:scale-95'
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
