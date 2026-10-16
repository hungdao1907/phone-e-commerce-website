import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, MoreVertical, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface Plan {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  status?: string;
}

export function PlanScheduleWidget() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = useAuthStore.getState().token;
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/plans`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Sort by date ascending (assuming date is in YYYY-MM-DD format)
          const sorted = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          // Show only top 3 upcoming plans
          setPlans(sorted.slice(0, 3));
        }
      })
      .catch(err => console.error('Failed to fetch plans:', err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="backdrop-blur-xl flex flex-col h-full overflow-hidden relative"
      style={{
        background: 'rgba(4, 22, 15, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '28px',
        boxShadow: '0 10px 40px -14px rgba(62, 224, 140, 0.25)'
      }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#3ee08c]/15 border border-[#3ee08c]/35 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-[#3ee08c]" />
          </div>
          <h3 className="text-[#eefaf3] font-semibold text-sm">Lịch kế hoạch</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="text-[#3ee08c] hover:bg-[#3ee08c]/15 border border-[#3ee08c]/40 p-1.5 rounded-xl transition-colors">
            <Plus className="w-4 h-4" />
          </button>
          <button className="text-[#eefaf3]/50 hover:text-[#eefaf3] p-1.5 rounded-xl transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Plan List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#3ee08c]/20 border-t-[#3ee08c] rounded-full animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#eefaf3]/50 text-xs">
            <Calendar className="w-8 h-8 mb-2 opacity-20 text-[#3ee08c]" />
            <p>Chưa có kế hoạch hôm nay.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {plans.map((plan, i) => {
              // Parse date to readable format if it's YYYY-MM-DD
              let displayDate = plan.date;
              try {
                const dateObj = new Date(plan.date);
                if (!isNaN(dateObj.getTime())) {
                  displayDate = new Intl.DateTimeFormat('vi-VN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit'
                  }).format(dateObj);
                }
              } catch (e) {}

              return (
                <motion.div
                  key={plan.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="flex flex-col p-3 rounded-2xl hover:bg-white/[0.05] border border-transparent hover:border-[#3ee08c]/25 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium text-[#eefaf3] group-hover:text-[#3ee08c] transition-colors">
                      {plan.title}
                    </p>
                    {plan.status && (
                      <span className={cn(
                        "text-[9px] px-2 py-0.5 rounded-full font-semibold ml-2 whitespace-nowrap",
                        plan.status === 'pending' ? "bg-[rgba(255,190,60,0.12)] text-[#ffc24d] border border-[rgba(255,190,60,0.45)]" :
                        plan.status === 'completed' ? "bg-[#3ee08c]/15 text-[#3ee08c] border border-[#3ee08c]/35" :
                        "bg-white/10 text-[#eefaf3]/60"
                      )}>
                        {plan.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1.5 text-[#eefaf3]/55 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-[#3ee08c]/80" />
                      <span>{displayDate}</span>
                    </div>
                    {plan.time && (
                      <div className="flex items-center gap-1.5 text-[#eefaf3]/55 text-xs">
                        <Clock className="w-3.5 h-3.5 text-[#3ee08c]/80" />
                        <span>{plan.time}</span>
                      </div>
                    )}
                    {plan.location && (
                      <div className="flex items-center gap-1.5 text-[#eefaf3]/55 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-[#3ee08c]/80" />
                        <span className="truncate max-w-[120px]">{plan.location}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
