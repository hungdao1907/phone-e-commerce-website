import React from 'react';
import { motion } from 'framer-motion';
import { ChatMessage } from './types';
import { ProductResultCard } from './ProductResultCard';
import { resolveBackendUrl } from '../../services/chatbot.api';
import { FileText, Download, User, Bot, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ChatMessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  
  const timeFormatted = message.timeString || new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(message.createdAt));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}
    >
      <div className={cn("flex max-w-[88%] sm:max-w-[82%] gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
        {/* Avatar */}
        <div className="flex-shrink-0 mt-auto mb-1">
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
        <div className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
          {/* Text Bubble */}
          {message.text && (
            <div className={cn(
              "px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed break-words shadow-xs",
              isUser 
                ? "bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white rounded-br-xs shadow-blue-500/15" 
                : "bg-white/95 backdrop-blur-md border border-neutral-200/90 text-neutral-800 rounded-bl-xs shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
            )}>
              {message.text}
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

          {/* Horizontal Product Search Results */}
          {message.products && message.products.length > 0 && (
            <div className="w-full mt-1">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-neutral-600">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Gợi ý sản phẩm phù hợp ({message.products.length}):</span>
              </div>
              <div
                data-lenis-prevent="true"
                className="flex overflow-x-auto pb-2 gap-3 snap-x overscroll-contain -mx-1 px-1 custom-scrollbar"
              >
                {message.products.map((product) => (
                  <div key={product.id || Math.random().toString()} className="snap-start">
                    <ProductResultCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quotation PDF Card */}
          {message.quotation?.responseType === 'file' && message.quotation.downloadUrl && (
            <div className="bg-gradient-to-b from-white to-neutral-50/80 border border-neutral-200 rounded-2xl p-4 min-w-[260px] max-w-[340px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] mt-1">
              <div className="flex items-start gap-3 mb-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-500/20">
                  <FileText className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold text-neutral-900 truncate">Báo giá chính thức</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  </div>
                  {message.quotation.quoteNumber && (
                    <div className="mt-0.5">
                      <span className="inline-block px-2 py-0.5 bg-neutral-100 rounded text-[11px] font-mono font-medium text-neutral-700">
                        {message.quotation.quoteNumber}
                      </span>
                    </div>
                  )}
                  {message.quotation.totalDisplay && (
                    <div className="mt-1.5 text-sm font-bold text-rose-600">
                      Tổng: {message.quotation.totalDisplay}
                    </div>
                  )}
                </div>
              </div>

              <a 
                href={resolveBackendUrl(message.quotation.downloadUrl)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
              >
                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform duration-200" />
                <span>Tải Báo Giá PDF</span>
              </a>
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
