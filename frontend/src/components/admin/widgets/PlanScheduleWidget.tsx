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
      className="bg-white border border-slate-200/80 shadow-sm rounded-2xl flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-slate-900 font-semibold text-sm">Lịch kế hoạch</h3>
        </div>
        <div className="flex items-center gap-1">
          <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
          <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Plan List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
            <Calendar className="w-8 h-8 mb-2 text-slate-300" />
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
                  className="flex flex-col p-3 rounded-xl bg-slate-50/50 hover:bg-slate-100/60 border border-slate-200/60 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium text-slate-800 group-hover:text-emerald-700 transition-colors">
                      {plan.title}
                    </p>
                    {plan.status && (
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-full font-semibold ml-2 whitespace-nowrap",
                        plan.status === 'pending' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        plan.status === 'completed' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {plan.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{displayDate}</span>
                    </div>
                    {plan.time && (
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{plan.time}</span>
                      </div>
                    )}
                    {plan.location && (
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
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
