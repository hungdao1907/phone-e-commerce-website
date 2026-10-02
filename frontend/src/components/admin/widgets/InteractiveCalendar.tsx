import React, { useState } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { Columns3, Grid, X, MapPin, Clock, Users, CalendarDays, MoreHorizontal } from 'lucide-react';
import MotionButton from '@/components/ui/MotionButton';
import { LottieIcon } from '@/components/ui/LottieIcon';

export type DayType = {
  day: string;
  classNames: string;
  badgeIndex?: number;
  meetingInfo?: {
    id: string;
    date: string;
    time: string;
    title: string;
    participants: string[];
    location: string;
  }[];
};

interface DayProps {
  classNames: string;
  day: DayType;
  onHover: (day: string | null) => void;
}

const NotificationBadge = ({ meetingInfo, isHovered, badgeIndex }: { meetingInfo: any[], isHovered: boolean, badgeIndex: number }) => {
  const [isPulsing, setIsPulsing] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  React.useEffect(() => {
    const delay = 100 + badgeIndex * 150;
    const t1 = setTimeout(() => {
      setHasMounted(true);
      setIsPulsing(true);
    }, delay);
    const t2 = setTimeout(() => {
      setIsPulsing(false);
    }, delay + 500);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [badgeIndex]);

  if (!hasMounted) return null;

  const active = isHovered || isPulsing;

  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={
        active
          ? "absolute inset-0 m-auto flex size-10 items-center justify-center bg-emerald-600 text-white text-sm font-bold z-10 shadow-md"
          : "absolute bottom-1 right-1 flex size-5 items-center justify-center bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-300"
      }
      style={{ borderRadius: 999 }}
      transition={{
        layout: { type: "spring", stiffness: 350, damping: 25 },
        scale: { type: "spring", stiffness: 500, damping: 20 },
        opacity: { duration: 0.2 }
      }}
    >
      {meetingInfo.length}
    </motion.div>
  );
};

const Day: React.FC<DayProps> = ({ classNames, day, onHover }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <>
      <motion.div
        className={`relative flex items-center justify-center py-1 ${classNames}`}
        style={{ height: '4rem', borderRadius: 16 }}
        onMouseEnter={() => { setIsHovered(true); onHover(day.day); }}
        onMouseLeave={() => { setIsHovered(false); onHover(null); }}
        id={`day-${day.day}`}
      >
        <motion.div className="flex flex-col items-center justify-center">
          {!(day.day[0] === '+' || day.day[0] === '-') && (
            <span className="text-sm font-medium text-slate-800">{day.day}</span>
          )}
        </motion.div>

        {day.meetingInfo && day.meetingInfo.length > 0 && (
          <NotificationBadge
            key={day.meetingInfo.map(m => m.id).join('-')}
            meetingInfo={day.meetingInfo}
            isHovered={isHovered}
            badgeIndex={day.badgeIndex!}
          />
        )}
      </motion.div>
    </>
  );
};

const MeetingActions = ({ mIndex, day, meeting, fetchPlans, onEdit }: { mIndex: number; day: string; meeting: any; fetchPlans: () => void; onEdit: (meeting: any, layoutId: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHoveringEdit, setIsHoveringEdit] = useState(false);
  const [isHoveringDelete, setIsHoveringDelete] = useState(false);
  const layoutId = `action-morph-${day}-${mIndex}`;

  return (
    <div className="absolute bottom-3 right-4 z-20">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            layoutId={layoutId}
            onClick={() => setIsOpen(true)}
            className="w-7 h-7 flex items-center justify-center cursor-pointer text-slate-400 hover:text-slate-700 bg-white border border-slate-200 shadow-sm will-change-transform"
            style={{ borderRadius: 999 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring' as const, stiffness: 400, damping: 28 }}
          >
            <MoreHorizontal size={14} />
          </motion.div>
        ) : (
          <motion.div
            layoutId={layoutId}
            className="flex items-center overflow-hidden bg-white border border-slate-200 will-change-transform shadow-lg"
            style={{ borderRadius: 999 }}
            transition={{ type: 'spring' as const, stiffness: 400, damping: 28 }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.15, duration: 0.2 }}
              className="flex items-center"
            >
              <button
                onClick={() => { setIsOpen(false); onEdit(meeting, layoutId); }}
                className="flex gap-1.5 items-center justify-center h-8 px-3 text-slate-700 hover:bg-slate-50 transition-colors border-r border-slate-200"
                onMouseEnter={() => setIsHoveringEdit(true)}
                onMouseLeave={() => setIsHoveringEdit(false)}
              >
                <div className="w-3.5 h-3.5 opacity-80"><LottieIcon path="/lottie/edit.json" playing={isHoveringEdit} /></div>
                <span className="text-xs font-medium">Sửa</span>
              </button>
              <button
                onClick={async () => {
                  try {
                    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/plans/${meeting.id}`, { method: 'DELETE' });
                    fetchPlans();
                  } catch (e) { console.error(e); }
                }}
                className="flex gap-1.5 items-center justify-center h-8 px-3 text-red-600 hover:bg-red-50 transition-colors border-r border-slate-200"
                onMouseEnter={() => setIsHoveringDelete(true)}
                onMouseLeave={() => setIsHoveringDelete(false)}
              >
                <div className="w-3.5 h-3.5 opacity-80 text-red-600"><LottieIcon path="/lottie/delete.json" playing={isHoveringDelete} /></div>
                <span className="text-xs font-medium">Xoá</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CalendarGrid: React.FC<{ days: DayType[], onHover: (day: string | null) => void }> = ({ days, onHover }) => (
  <div className="grid grid-cols-7 gap-2">
    {days.map((day, index) => (
      <Day key={`${day.day}-${index}`} classNames={day.classNames} day={day} onHover={onHover} />
    ))}
  </div>
);

const generateDays = (date: Date): DayType[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday
  const daysInMonth = lastDay.getDate();

  const days: DayType[] = [];

  // Previous month trailing days
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push({ day: `-${startingDayOfWeek - i}`, classNames: 'bg-slate-100/50 text-slate-300' });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const isWeekend = new Date(year, month, i).getDay() === 0 || new Date(year, month, i).getDay() === 6;
    days.push({
      day: i < 10 ? `0${i}` : `${i}`,
      classNames: isWeekend ? 'bg-slate-100/70 border border-slate-200/60' : 'bg-white border border-slate-200/80 shadow-xs'
    });
  }

  // Next month leading days (fill up to 35 or 42)
  const totalDays = days.length;
  const rows = Math.ceil(totalDays / 7);
  const totalSlots = rows * 7;
  for (let i = 1; i <= totalSlots - totalDays; i++) {
    days.push({ day: `+${i}`, classNames: 'bg-slate-100/50 text-slate-300' });
  }

  return days;
};

type InteractiveCalendarProps = HTMLMotionProps<"div">;

const InteractiveCalendar = React.forwardRef((
  { className, ...props }: InteractiveCalendarProps, ref: React.Ref<HTMLDivElement>
) => {
  const [moreView, setMoreView] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [isPlansLoading, setIsPlansLoading] = useState(false);

  // Edit states
  const [editingLayoutId, setEditingLayoutId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false);
  const [fetchedPlans, setFetchedPlans] = useState<any[]>([]);
  const [formData, setFormData] = useState({ title: '', date: '', time: '', location: '', participants: '' });

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/plans`);
      const data = await res.json();
      setFetchedPlans(data);
    } catch (err) { console.error(err); }
  };

  React.useEffect(() => {
    fetchPlans();
  }, []);

  const currentDays = React.useMemo(() => generateDays(currentDate), [currentDate]);

  const mergedDays = React.useMemo(() => {
    const newDays = JSON.parse(JSON.stringify(currentDays)) as DayType[];
    fetchedPlans.forEach(plan => {
      const planDate = new Date(plan.date);
      if (planDate.getFullYear() === currentDate.getFullYear() && planDate.getMonth() === currentDate.getMonth()) {
        const dayStr = planDate.getDate() < 10 ? `0${planDate.getDate()}` : `${planDate.getDate()}`;
        const dayObj = newDays.find(d => d.day === dayStr);
        if (dayObj) {
          if (!dayObj.meetingInfo) dayObj.meetingInfo = [];
          dayObj.classNames += ' cursor-pointer shadow-md bg-emerald-50/80 border border-emerald-300'; // highlight days with plans slightly
          dayObj.meetingInfo.push({
            id: plan.id,
            date: plan.date,
            time: plan.time,
            title: plan.title,
            participants: plan.participants,
            location: plan.location
          });
        }
      }
    });

    let currentIndex = 0;
    newDays.forEach(day => {
      if (day.meetingInfo && day.meetingInfo.length > 0) {
        day.badgeIndex = currentIndex++;
      }
    });

    return newDays;
  }, [fetchedPlans, currentDays, currentDate]);

  const sortedDays = React.useMemo(() => {
    if (!hoveredDay) return mergedDays;
    return [...mergedDays].sort((a, b) => {
      if (a.day === hoveredDay) return -1;
      if (b.day === hoveredDay) return 1;
      return 0;
    });
  }, [hoveredDay, mergedDays]);

  const handleSubmitPlan = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          participants: formData.participants.split(',').map(p => p.trim())
        })
      });
      setFormData({ title: '', date: '', time: '', location: '', participants: '' });
      setIsAddingPlan(false);
      fetchPlans();
      setTimeout(() => {
        setMoreView(true);
        setIsPlansLoading(true);
        setTimeout(() => setIsPlansLoading(false), 800);
      }, 350);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (meeting: any, layoutId: string) => {
    setFormData({
      title: meeting.title,
      date: meeting.date,
      time: meeting.time,
      location: meeting.location,
      participants: meeting.participants.join(', ')
    });
    setEditingPlanId(meeting.id);
    setEditingLayoutId(layoutId);
  };

  const handleUpdatePlan = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/plans/${editingPlanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          participants: formData.participants.split(',').map(p => p.trim())
        })
      });
      setFormData({ title: '', date: '', time: '', location: '', participants: '' });
      setEditingLayoutId(null);
      setEditingPlanId(null);
      fetchPlans();
      setTimeout(() => {
        setMoreView(true);
        setIsPlansLoading(true);
        setTimeout(() => setIsPlansLoading(false), 800);
      }, 350);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={ref}
        className="relative mx-auto flex w-full flex-col items-start justify-start gap-8 lg:flex-row"
        {...(props as any)}
      >
        {/* Calendar Panel */}
        <motion.div layout className="w-full max-w-lg shrink-0">
          <motion.div key="calendar-view" className="flex w-full flex-col gap-4">
            <div className="flex w-full items-center justify-between">
              <motion.h2 className="mb-2 text-4xl font-bold tracking-wider text-slate-900">
                Tháng {currentDate.getMonth() + 1} <span className="text-slate-400">{currentDate.getFullYear()}</span>
              </motion.h2>
              <div
                className="relative flex items-center rounded-full bg-slate-100 p-1 border border-slate-200 shadow-xs"
              >
                <button
                  className="relative z-[2] flex items-center justify-center w-9 h-8 rounded-full cursor-pointer"
                  onClick={() => {
                    if (isAddingPlan || editingLayoutId) {
                      setIsAddingPlan(false);
                      setEditingLayoutId(null);
                      setEditingPlanId(null);
                      setFormData({ title: '', date: '', time: '', location: '', participants: '' });
                    }
                    setMoreView(false);
                  }}
                >
                  {!moreView && (
                    <motion.div
                      layoutId="glass-toggle-indicator"
                      className="absolute inset-0 rounded-full bg-white border border-slate-200 shadow-sm"
                      transition={{ type: 'spring' as const, stiffness: 400, damping: 28 }}
                    />
                  )}
                  <Columns3 className={`relative z-10 transition-colors duration-200 ${!moreView ? 'text-slate-900' : 'text-slate-400'}`} size={16} />
                </button>
                <button
                  className="relative z-[2] flex items-center justify-center w-9 h-8 rounded-full cursor-pointer"
                  onClick={() => {
                    if (isAddingPlan || editingLayoutId) {
                      setIsAddingPlan(false);
                      setEditingLayoutId(null);
                      setEditingPlanId(null);
                      setFormData({ title: '', date: '', time: '', location: '', participants: '' });
                      setTimeout(() => setMoreView(true), 350);
                    } else {
                      setMoreView(true);
                    }

                    if (!hasLoadedInitially) {
                      setIsPlansLoading(true);
                      setTimeout(() => {
                        setIsPlansLoading(false);
                        setHasLoadedInitially(true);
                      }, 800);
                    }
                  }}
                >
                  {moreView && (
                    <motion.div
                      layoutId="glass-toggle-indicator"
                      className="absolute inset-0 rounded-full bg-white border border-slate-200 shadow-sm"
                      transition={{ type: 'spring' as const, stiffness: 400, damping: 28 }}
                    />
                  )}
                  <Grid className={`relative z-10 transition-colors duration-200 ${moreView ? 'text-slate-900' : 'text-slate-400'}`} size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                <div key={d} className="rounded-xl bg-slate-100 py-1 text-center text-xs font-semibold text-slate-500 border border-slate-200/50">
                  {d}
                </div>
              ))}
            </div>
            <CalendarGrid days={mergedDays} onHover={setHoveredDay} />

            <motion.div layout className="mt-4 relative flex w-full items-center justify-between">
              <MotionButton
                label="Tháng trước"
                direction="left"
                classes="bg-white border-slate-200 text-slate-800 shadow-sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              />
              <motion.div layout className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                {!isAddingPlan && (
                  <motion.div
                    layoutId="add-plan-morph"
                    onClick={() => {
                      setIsAddingPlan(true);
                      setEditingLayoutId(null);
                      setEditingPlanId(null);
                      setFormData({ title: '', date: '', time: '', location: '', participants: '' });
                    }}
                    className="w-12 h-12 cursor-pointer relative flex items-center justify-center text-slate-800 text-3xl font-light will-change-transform bg-white border border-slate-200 shadow-md"
                    style={{ borderRadius: 999 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring' as const, stiffness: 400, damping: 28 }}
                  >
                    <span className="relative z-10 pointer-events-none">+</span>
                  </motion.div>
                )}
              </motion.div>
              <MotionButton
                label="Tháng sau"
                direction="right"
                classes="bg-white border-slate-200 text-slate-800 shadow-sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Add / Edit Plan Form — Morphed from + button or action pill */}
        {(isAddingPlan || editingLayoutId) && (
          <motion.div
            layoutId={editingLayoutId || "add-plan-morph"}
            className="w-full max-w-lg relative overflow-hidden border border-slate-200 bg-white shadow-xl will-change-transform rounded-3xl"
            transition={{ type: 'spring' as const, stiffness: 400, damping: 28 }}
          >
            {/* Form Content — fades in after morph completes */}
            <motion.div
              className="relative z-10 p-6 flex flex-col gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-2xl font-bold text-slate-900">{editingLayoutId ? "Sửa kế hoạch" : "Thêm kế hoạch"}</h2>
                <button
                  onClick={() => {
                    if (editingLayoutId) {
                      setEditingLayoutId(null);
                      setEditingPlanId(null);
                      setFormData({ title: '', date: '', time: '', location: '', participants: '' });
                      setTimeout(() => setMoreView(true), 350);
                    } else {
                      setIsAddingPlan(false);
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Tên kế hoạch</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ví dụ: Họp team Marketing"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarDays size={12} className="text-slate-400" /> Ngày
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={12} className="text-slate-400" /> Thời gian
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={12} className="text-slate-400" /> Địa điểm
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ví dụ: Phòng họp A, Zoom Meeting..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={12} className="text-slate-400" /> Người tham gia
                  </label>
                  <input
                    type="text"
                    value={formData.participants}
                    onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                    placeholder="Ví dụ: Nguyễn Văn A, Trần Thị B..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors text-sm"
                  />
                </div>

                <button
                  onClick={editingLayoutId ? handleUpdatePlan : handleSubmitPlan}
                  className="w-full mt-2 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  {editingLayoutId ? "Cập nhật kế hoạch" : "Lưu kế hoạch"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Bookings Panel */}
        {moreView && !isAddingPlan && !editingLayoutId && (
          <motion.div
            className="w-full max-w-lg"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div key="more-view" className="flex w-full flex-col gap-4">
              <div className="flex flex-col">
                <h2 className="mb-1 text-4xl font-bold tracking-wider text-slate-900">Kế hoạch</h2>
                <p className="text-sm font-medium text-slate-500">
                  Xem các sự kiện, kế hoạch sắp tới và đã hoàn thành của bạn.
                </p>
              </div>
              <motion.div
                className="flex h-[520px] flex-col items-start justify-start overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm"
                layout
              >
                <AnimatePresence mode="wait">
                  {isPlansLoading ? (
                    <motion.div
                      key="skeleton"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full flex flex-col"
                    >
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="border-b border-slate-100 p-4 last:border-b-0">
                          <div className="mb-2 flex items-center justify-between pr-8">
                            <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
                            <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
                          </div>
                          <div className="mb-3 h-5 w-2/3 rounded bg-slate-100 animate-pulse" />
                          <div className="mb-3 h-4 w-full rounded bg-slate-50 animate-pulse" />
                          <div className="flex items-center gap-2 pr-8">
                            <div className="h-3.5 w-3.5 rounded-full bg-blue-100 animate-pulse" />
                            <div className="h-3 w-32 rounded bg-blue-100 animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div key="content" className="w-full" layout>
                      {sortedDays.filter((d) => d.meetingInfo).map((day) => (
                        <motion.div key={day.day} className="w-full border-b border-slate-100 last:border-b-0" layout>
                          {day.meetingInfo?.map((meeting, mIndex) => (
                            <motion.div
                              key={mIndex}
                              className="relative border-b border-slate-100 p-4 last:border-b-0 hover:bg-slate-50 transition-colors"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2, delay: mIndex * 0.05 }}
                            >
                              <div className="mb-1 flex items-center justify-between pr-8">
                                <span className="text-xs text-slate-400 font-medium">{meeting.date}</span>
                                <span className="text-xs text-slate-400 font-medium">{meeting.time}</span>
                              </div>
                              <h3 className="mb-1 pr-8 text-base font-semibold text-slate-900">{meeting.title}</h3>
                              <p className="mb-2 pr-8 text-sm text-slate-500">{meeting.participants.join(', ')}</p>
                              <div className="flex items-center text-blue-600 gap-1 pr-8">
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className="text-xs">{meeting.location}</span>
                              </div>

                              {/* Action Morphing Button */}
                              <MeetingActions
                                mIndex={mIndex}
                                day={day.day}
                                meeting={meeting}
                                fetchPlans={fetchPlans}
                                onEdit={handleEditClick}
                              />
                            </motion.div>
                          ))}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
);

InteractiveCalendar.displayName = 'InteractiveCalendar';
export default InteractiveCalendar;
