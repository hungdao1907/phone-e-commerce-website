import React from 'react';
import { motion } from 'framer-motion';
import { ChatMessage } from './types';
import { ProductCarousel } from './ProductCarousel';
import { ChatMarkdown } from './ChatMarkdown';
import { FileText, User, Bot, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import './chatbot.css';

export function ChatMessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const user = useAuthStore(state => state.user);
  const quotationHref = user?.role === 'customer' ? '/profile' : '/login';
  const quotationAction = user?.role === 'customer' ? 'Mở khu vực báo giá' : 'Đăng nhập để tiếp tục';

  const timeFormatted = message.timeString || new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(message.createdAt));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn("flex w-full max-w-full min-w-0 mb-4", isUser ? "justify-end" : "justify-start")}
    >
      <div className={cn("flex gap-2.5 min-w-0", isUser ? "max-w-[85%] sm:max-w-[80%] flex-row-reverse" : "w-full max-w-full flex-row")}>
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 text-white flex items-center justify-center shadow-xs">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-[0_2px_10px_rgba(79,70,229,0.35)] ring-2 ring-white">
              <Bot className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Content Body */}
        <div className={cn("flex flex-col gap-1.5 min-w-0 max-w-full flex-1", isUser ? "items-end" : "items-start")}>
          {/* Text Bubble */}
          {message.text && (
            <div className={cn(
              "px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed break-words [overflow-wrap:anywhere] shadow-xs max-w-full",
              isUser
                ? "bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white rounded-br-xs shadow-blue-500/15"
                : "bg-white/95 backdrop-blur-md border border-neutral-200/90 text-neutral-800 rounded-bl-xs shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
            )}>
              {isUser ? <span className="whitespace-pre-wrap">{message.text}</span> : <ChatMarkdown content={message.text} />}
            </div>
          )}

          {/* Typing Indicator */}
          {message.isLoading && (
            <div className="bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-2.5 shadow-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" />
              </div>
              <span className="text-xs text-neutral-500 font-medium">Trợ lý đang phản hồi...</span>
            </div>
          )}

          {/* Error Message */}
          {message.isError && !message.text && (
            <div className="bg-rose-50 text-rose-700 border border-rose-200/80 rounded-2xl rounded-bl-xs px-4 py-3 text-xs leading-relaxed shadow-xs">
              Hiện tại không thể kết nối tới trợ lý thông minh. Vui lòng kiểm tra lại kết nối hoặc thử lại sau.
            </div>
          )}

          {/* Horizontal Product Search Results using ProductCarousel */}
          {message.products && message.products.length > 0 && (
            <ProductCarousel products={message.products} />
          )}

          {/* Chatbot output can never stand in for an authenticated Backend quotation. */}
          {message.quotation?.quoteStatus === 'NOT_ACTIVATED' && (
            <div className="mt-1 flex max-w-[360px] gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-bold">
                  <AlertCircle className="h-4 w-4" />
                  <span>Chưa có báo giá chính thức</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-amber-900">
                  Báo giá và PDF chỉ được phát hành từ Backend sau khi Quotation API được kích hoạt.
                </p>
                <Link to={quotationHref} className="mt-2 inline-flex text-xs font-semibold text-blue-700 underline underline-offset-2">
                  {quotationAction}
                </Link>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <span className="text-[10px] text-neutral-400 font-medium px-1 select-none">
            {timeFormatted}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
