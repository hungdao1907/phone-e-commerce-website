import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, MoreVertical, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/plans`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Sort by date ascending (assuming date is in YYYY-MM-DD format)
          const sorted = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          // Show only top 4 upcoming plans
          setPlans(sorted.slice(0, 4));
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
      className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-white font-semibold text-sm">Lịch kế hoạch</h3>
        </div>
        <div className="flex items-center gap-1">
          <button className="text-white/30 hover:text-white/80 p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
          <button className="text-white/30 hover:text-white/80 p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Plan List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/40 text-xs">
            <Calendar className="w-8 h-8 mb-2 opacity-20" />
            <p>Không có sự kiện sắp tới</p>
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
                  className="flex flex-col p-3 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05] transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium text-white/90 group-hover:text-emerald-400 transition-colors">
                      {plan.title}
                    </p>
                    {plan.status && (
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-full font-semibold ml-2 whitespace-nowrap",
                        plan.status === 'pending' ? "bg-amber-400/10 text-amber-400 border border-amber-400/20" :
                        plan.status === 'completed' ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" :
                        "bg-white/10 text-white/60"
                      )}>
                        {plan.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1.5 text-white/40 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{displayDate}</span>
                    </div>
                    {plan.time && (
                      <div className="flex items-center gap-1.5 text-white/40 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{plan.time}</span>
                      </div>
                    )}
                    {plan.location && (
                      <div className="flex items-center gap-1.5 text-white/40 text-xs">
                        <MapPin className="w-3.5 h-3.5" />
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
