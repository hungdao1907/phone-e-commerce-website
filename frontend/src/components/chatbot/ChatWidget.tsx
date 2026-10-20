import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, RotateCcw, Sparkles, HelpCircle, Loader2 } from 'lucide-react';
import { ChatMessage, QuickPrompt } from './types';
import { ChatMessageItem } from './ChatMessageItem';
import { bootstrapChatSession, ChatbotMessageError, extractSuggestedProductIds, fetchChatbotCatalogProducts, readVerifiedChatbotProducts, resolveChatbotProductResponse, sendChatMessage } from '../../services/chatbot.api';
import { resolveQuotationIntent } from './quotation-intent';
import { MeshGradientSVG } from '../ui/shader-svg';
import { CustomerQuotationPanel } from './CustomerQuotationPanel';
import { currentChatSession, readChatInputDraft, readPendingChatTurn, storeChatInputDraft, storeChatSession, storePendingChatTurn } from './chat-session';
import type { PendingChatTurn } from './chat-session';

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
  const [input, setInput] = useState(readChatInputDraft);
  const [isSending, setIsSending] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(() => Boolean(currentChatSession().sessionToken));
  const [unsentMessage, setUnsentMessage] = useState(() => readPendingChatTurn()?.text || '');
  const [sendNotice, setSendNotice] = useState('');
  const [invalidSession, setInvalidSession] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingRequestRef = useRef<PendingChatTurn | null>(readPendingChatTurn());
  const sendingRef = useRef(false);
  const mountedRef = useRef(false);

  const resizeInput = () => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 112 ? 'auto' : 'hidden';
  };

  // Prevent background Lenis scroll when mouse is hovering anywhere over the chatbot
  const handlePanelWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (messagesContainerRef.current && !messagesContainerRef.current.contains(e.target as Node)) {
      messagesContainerRef.current.scrollTop += e.deltaY;
    }
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
    mountedRef.current = true;
    const session = currentChatSession();
    const pending = readPendingChatTurn();
    pendingRequestRef.current = pending;
    setUnsentMessage(pending?.text || '');
    initWelcomeMessage();

    let cancelled = false;
    if (session.sessionToken) {
      setIsRestoringSession(true);
      void bootstrapChatSession(session.sessionId, session.sessionToken).then(restored => {
        if (!restored || cancelled || !mountedRef.current || currentChatSession().sessionId !== session.sessionId) return;
        storeChatSession({ sessionId: restored.sessionId, sessionToken: restored.sessionToken });
        const restoredMessages: ChatMessage[] = restored.history.map(entry => ({
          id: `${entry.role}-${entry.requestId}`,
          role: entry.role,
          text: entry.content,
          createdAt: Date.parse(entry.createdAt),
        }));
        setMessages(previous => [...previous.filter(message => message.id === 'welcome-1'), ...restoredMessages]);

        const savedPending = readPendingChatTurn();
        const pendingTurnCompleted = savedPending?.sessionId === session.sessionId
          && restored.history.some(entry => entry.role === 'assistant' && entry.requestId === savedPending.requestId);
        if (pendingTurnCompleted) {
          pendingRequestRef.current = null;
          storePendingChatTurn(null);
          setUnsentMessage('');
        } else if (restored.pendingTurn && (!savedPending || savedPending.sessionId !== session.sessionId)) {
          const recoveredPending: PendingChatTurn = { ...restored.pendingTurn, sessionId: session.sessionId, dispatched: true };
          pendingRequestRef.current = recoveredPending;
          storePendingChatTurn(recoveredPending);
          setUnsentMessage(recoveredPending.text);
        }
        if (restored.historyTruncated) setSendNotice('Đang hiển thị các lượt chat gần đây; lịch sử cũ vẫn được lưu.');
      }).catch(error => {
        if (cancelled || !mountedRef.current || currentChatSession().sessionId !== session.sessionId) return;
        if (error instanceof ChatbotMessageError && error.code === 'CHAT_SESSION_INVALID') {
          setInvalidSession(true);
          setSendNotice('Phiên chat đã hết hạn. Lịch sử cũ vẫn được giữ nguyên; bạn có thể bắt đầu cuộc trò chuyện mới.');
        } else {
          setSendNotice('Chưa tải được lịch sử chat. Phiên hội thoại vẫn được giữ; hãy thử tải lại trang nếu cần xem lịch sử.');
        }
      }).finally(() => {
        if (!cancelled && mountedRef.current) setIsRestoringSession(false);
      });
    } else {
      setIsRestoringSession(false);
    }

    // Show tooltip after 2.5 seconds if not open
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 2500);

    return () => {
      cancelled = true;
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => { storeChatInputDraft(input); }, [input]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending]);

  // Reset conversation handler
  const handleResetChat = () => {
    if (sendingRef.current || isRestoringSession) return;
    const sessionId = crypto.randomUUID();
    storeChatSession({ sessionId });
    // Start a new turn only after the customer explicitly sends the retained draft. Never
    // transfer a dispatched requestId to another conversation or silently replay it.
    const pending = pendingRequestRef.current;
    pendingRequestRef.current = null;
    storePendingChatTurn(null);
    setUnsentMessage('');
    if (pending?.text) {
      setInput(pending.text);
      storeChatInputDraft(pending.text);
    }
    setSendNotice('Đã bắt đầu cuộc trò chuyện mới. Lịch sử cũ vẫn được giữ nguyên.');
    setInvalidSession(false);
    initWelcomeMessage();
  };

  const handleSend = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text || sendingRef.current || isRestoringSession || invalidSession) return;
    const pending = pendingRequestRef.current;
    if (pending && pending.text !== text) {
      setSendNotice('Hãy hoàn tất tin nhắn đang chờ trước. Nội dung bạn đang soạn vẫn được giữ lại.');
      return;
    }

    if (text.length > 2000) {
      alert('Tin nhắn quá dài (tối đa 2000 ký tự).');
      return;
    }

    let session = currentChatSession();
    if (pending && pending.sessionId !== session.sessionId && pending.dispatched) {
      setSendNotice('Tin nhắn đang chờ thuộc phiên khác. Hãy bắt đầu cuộc trò chuyện mới để gửi lại.');
      setInvalidSession(true);
      return;
    }
    const requestId = pending?.requestId || crypto.randomUUID();
    const previouslyDispatched = pending?.dispatched === true;
    pendingRequestRef.current = { text, sessionId: session.sessionId, requestId, dispatched: pending?.dispatched ?? false };
    storePendingChatTurn(pendingRequestRef.current);
    sendingRef.current = true; // Covers two click/Enter events before React commits isSending.
    setUnsentMessage('');
    setSendNotice('');

    const userMessage: ChatMessage = {
      id: `user-${requestId}`,
      role: 'user',
      text,
      createdAt: Date.now()
    };

    const loadingId = `loading-${requestId}`;
    const loadingMessage: ChatMessage = {
      id: loadingId,
      role: 'assistant',
      isLoading: true,
      createdAt: Date.now()
    };

    setMessages(prev => [...prev.filter(m => m.id !== userMessage.id && m.id !== loadingId), userMessage, loadingMessage]);
    if (!customText || input.trim() === text) setInput('');
    requestAnimationFrame(resizeInput);
    setIsSending(true);

    try {
      if (!session.sessionToken) {
        const secured = await bootstrapChatSession(session.sessionId);
        if (!mountedRef.current || currentChatSession().sessionId !== session.sessionId || readPendingChatTurn()?.requestId !== requestId) return;
        if (secured) {
          if (pendingRequestRef.current?.dispatched) throw new ChatbotMessageError(409, 'CHAT_SESSION_LEGACY_RECOVERY_REQUIRED');
          session = secured;
          storeChatSession(session);
          if (secured.previousSessionPreserved) setSendNotice('Phiên chat cũ vẫn được giữ, nhưng không thể khôi phục lịch sử nếu thiếu mã xác thực phiên.');
          pendingRequestRef.current = { text, sessionId: session.sessionId, requestId, dispatched: false };
          storePendingChatTurn(pendingRequestRef.current);
        }
      }
      // The session and requestId have been persisted before any user turn can be accepted.
      pendingRequestRef.current = { text, sessionId: session.sessionId, requestId, dispatched: true };
      storePendingChatTurn(pendingRequestRef.current);
      const response = await sendChatMessage(text, session.sessionId, session.sessionToken, requestId);
      // A late response from an unmounted widget must not replace an explicitly reset session.
      if (currentChatSession().sessionId !== session.sessionId || readPendingChatTurn()?.requestId !== requestId) return;
      const returnedId = typeof response.sessionId === 'string' && response.sessionId.length > 0 && response.sessionId.length <= 100
        ? response.sessionId : session.sessionId;
      const returnedToken = typeof response.sessionToken === 'string' && response.sessionToken.length <= 512
        ? response.sessionToken : returnedId === session.sessionId ? session.sessionToken : undefined;
      storeChatSession({ sessionId: returnedId, sessionToken: returnedToken });
      pendingRequestRef.current = { text, sessionId: returnedId, requestId, dispatched: true };
      storePendingChatTurn(pendingRequestRef.current);
      if (!mountedRef.current) return;

      // Build assistant message from response
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        createdAt: Date.now(),
      };

      const previousProducts = [...messages].reverse().find(message => message.products?.length)?.products || [];
      const verifiedProducts = readVerifiedChatbotProducts(response);
      const quotationResult = await resolveQuotationIntent(text, response, previousProducts, verifiedProducts
        ? { byIds: async ids => verifiedProducts.filter(p => ids.includes(p.id!)) } : {});
      assistantMessage.resultType = response.result_type;

      if (quotationResult) {
        assistantMessage.text = quotationResult.text;
        assistantMessage.products = quotationResult.products;
        assistantMessage.isError = quotationResult.isError;
      } else if (['product_search', 'product_detail', 'product_compare', 'recommendation'].includes(response.result_type)
        || extractSuggestedProductIds(response).length > 0) {
        const result = await resolveChatbotProductResponse(response);
        assistantMessage.text = result.text;
        assistantMessage.products = result.products;
        assistantMessage.isError = result.isError;
      } else if (response.result_type === 'quotation') {
        const suggestedIds = extractSuggestedProductIds(response);
        assistantMessage.text = suggestedIds.length
          ? 'Đã xác minh sản phẩm từ danh mục Backend. Hãy chọn phiên bản và số lượng trên thẻ để tiếp tục yêu cầu báo giá.'
          : 'Bạn muốn báo giá mẫu máy nào? Hãy cho biết tên hoặc dòng máy để tìm trong danh mục WebPhone.';
        try {
          assistantMessage.products = await fetchChatbotCatalogProducts(suggestedIds);
          if (suggestedIds.length > 0 && assistantMessage.products.length === 0) {
            assistantMessage.text = 'Không xác minh được sản phẩm trong danh mục hiện tại. Hãy tìm lại sản phẩm để tiếp tục yêu cầu báo giá.';
          }
        } catch {
          assistantMessage.text = 'Danh mục Backend hiện chưa thể xác minh; chưa có báo giá hoặc PDF nào được tạo.';
        }
      } else if (response.result_type === 'error') {
        assistantMessage.isError = true;
        assistantMessage.text = response.response;
      } else {
        // Fallback for no_result, faq, or unknown
        assistantMessage.text = response.response || 'Đã nhận được phản hồi từ hệ thống.';
      }

      if (!mountedRef.current || currentChatSession().sessionId !== returnedId || readPendingChatTurn()?.requestId !== requestId) return;
      setMessages(prev => prev.map(m => m.id === loadingId ? assistantMessage : m));
      pendingRequestRef.current = null;
      storePendingChatTurn(null);
      setUnsentMessage('');
    } catch (error) {
      if (readPendingChatTurn()?.requestId !== requestId) return;
      if (!previouslyDispatched && error instanceof ChatbotMessageError && ['CHAT_SESSION_BUSY', 'CHAT_SESSION_UPGRADE_REQUIRED', 'CHAT_SERVICE_UNAVAILABLE'].includes(error.code || '') && pendingRequestRef.current) {
        pendingRequestRef.current.dispatched = false; // These responses precede user-turn creation.
        storePendingChatTurn(pendingRequestRef.current);
      }
      if (!mountedRef.current) return;
      // Keep a single persisted pending turn. No quotation fallback or automatic resend on a
      // transport error: the server may already have committed this exact requestId.
      setMessages(prev => prev.filter(m => m.id !== loadingId && m.id !== userMessage.id));
      setUnsentMessage(text);
      setSendNotice(error instanceof ChatbotMessageError ? error.message : 'Chưa nhận được phản hồi. Tin nhắn đang chờ vẫn được giữ để thử lại.');
      setInvalidSession(error instanceof ChatbotMessageError &&
        (error.code === 'CHAT_SESSION_INVALID' || error.code === 'CHAT_REQUEST_ID_CONFLICT' || error.code === 'CHAT_SESSION_LEGACY_RECOVERY_REQUIRED'));
    } finally {
      sendingRef.current = false;
      if (mountedRef.current) setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }

    if (e.key === 'Enter' && e.shiftKey) {
      requestAnimationFrame(resizeInput);
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
              <div className="w-12 h-[60px] sm:w-[50px] sm:h-[63px] drop-shadow-[0_6px_16px_rgba(79,70,229,0.38)] group-hover:drop-shadow-[0_10px_22px_rgba(79,70,229,0.55)] transition-all duration-300">
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
                  disabled={isSending}
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
              className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 overscroll-contain space-y-2.5 w-full max-w-full min-w-0"
            >
              {messages.map((msg) => (
                <ChatMessageItem key={msg.id} message={msg} />
              ))}
              <CustomerQuotationPanel />

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
                        disabled={isSending || isRestoringSession || Boolean(unsentMessage) || invalidSession}
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
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    resizeInput();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi về sản phẩm, giá, cấu hình..."
                  className="w-full max-h-28 overflow-y-hidden bg-transparent resize-none outline-none py-2 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 font-normal leading-relaxed"
                  rows={1}
                  style={{
                    minHeight: '38px',
                    height: '38px',
                  }}
                />

                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isSending || isRestoringSession || Boolean(unsentMessage) || invalidSession}
                  className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all duration-200 mb-0.5 mr-0.5 ${
                    input.trim() && !isSending && !isRestoringSession && !unsentMessage && !invalidSession
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

              {isSending && (
                <p role="status" className="mt-2 px-1 text-xs text-neutral-500">Đang xử lý. Bạn có thể soạn tin tiếp theo.</p>
              )}
              {isRestoringSession && !isSending && (
                <p role="status" className="mt-2 px-1 text-xs text-neutral-500">Đang khôi phục phiên chat…</p>
              )}
              {(unsentMessage || sendNotice) && !isSending && (
                <div role="status" className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <p>{sendNotice || 'Có tin nhắn đang chờ hoàn tất. Bạn có thể thử lại khi sẵn sàng.'}</p>
                  {unsentMessage && <p className="mt-1 break-words whitespace-pre-wrap">{unsentMessage}</p>}
                  {unsentMessage && !invalidSession && (
                    <button type="button" className="mt-1 font-semibold underline" onClick={() => handleSend(unsentMessage)}>Thử lại tin nhắn</button>
                  )}
                  {invalidSession && (
                    <button type="button" className="mt-1 font-semibold underline" onClick={handleResetChat}>Bắt đầu cuộc trò chuyện mới</button>
                  )}
                </div>
              )}

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
