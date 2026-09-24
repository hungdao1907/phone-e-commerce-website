import React, { useEffect } from 'react';
import { Truck, Ticket, Gift, Sparkles } from 'lucide-react';
import { useRewardsStore } from '../../store/useRewardsStore';

interface CartRewardProgressProps {
  subtotal: number;
}

export function CartRewardProgress({ subtotal }: CartRewardProgressProps) {
  const allMilestones = useRewardsStore(state => state.milestones);
  const fetchMilestones = useRewardsStore(state => state.fetchMilestones);
  
  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const activeMilestones = allMilestones.filter(m => m.isActive).sort((a, b) => a.amount - b.amount);
  
  if (activeMilestones.length === 0) return null;

  const nextMilestone = activeMilestones.find(m => m.amount > subtotal);
  const maxAmount = activeMilestones[activeMilestones.length - 1].amount;
  const progressPercentage = Math.min(100, (subtotal / maxAmount) * 100);

  const renderIcon = (iconName: string, isUnlocked: boolean) => {
    const className = `w-4 h-4 ${isUnlocked ? 'text-black' : 'text-neutral-400'}`;
    switch(iconName) {
      case 'shipping': return <Truck className={className} />;
      case 'voucher': return <Ticket className={className} />;
      case 'gift': return <Gift className={className} />;
      default: return <Gift className={className} />;
    }
  };

  return (
    <div className="bg-neutral-50 p-4 border-b border-neutral-200/60">
      <div className="flex items-center gap-2 mb-3">
        {nextMilestone ? (
          <>
            <span className="text-sm font-semibold text-neutral-900">
              Còn {(nextMilestone.amount - subtotal).toLocaleString('vi-VN')}đ để nhận 
              <span className="text-black font-bold"> {nextMilestone.label}</span>
            </span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-bold text-black">
              🎉 Bạn đã mở khóa tất cả ưu đãi!
            </span>
          </>
        )}
      </div>

      <div className="relative h-2.5 w-full bg-neutral-200 rounded-full overflow-hidden mb-6">
        <div 
          className="absolute top-0 left-0 h-full bg-black transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progressPercentage}%` }}
        />
        
        {/* Render lines inside the progress bar track */}
        {activeMilestones.map((milestone) => {
          const leftPercent = (milestone.amount / maxAmount) * 100;
          const isUnlocked = subtotal >= milestone.amount;
          
          // Don't show a line exactly at 100% because it looks weird at the very edge, 
          // or we can just let it be. Let's let it be for now.
          return (
             <div 
               key={`line-${milestone.id}`}
               className={`absolute top-0 w-0.5 h-full transform -translate-x-1/2 transition-colors ${
                 isUnlocked ? 'bg-white/80' : 'bg-white'
               }`}
               style={{ left: `${leftPercent}%` }}
             />
          );
        })}
      </div>

      <div className="flex justify-between items-start px-2 relative -mt-4">
        {activeMilestones.map((milestone, idx) => {
          const isUnlocked = subtotal >= milestone.amount;
          const leftPercent = (milestone.amount / maxAmount) * 100;
          return (
            <div 
              key={milestone.id} 
              className="flex flex-col items-center absolute transform -translate-x-1/2"
              style={{ left: `${leftPercent}%` }}
            >
              <div className="bg-white p-1 rounded-full shadow-sm border border-neutral-100 mb-1 z-10">
                {renderIcon(milestone.type, isUnlocked)}
              </div>
              <span className={`text-[10px] text-center max-w-[56px] leading-tight font-medium ${isUnlocked ? 'text-black' : 'text-neutral-400'} ${leftPercent >= 99 ? '-translate-x-2' : leftPercent <= 1 ? 'translate-x-2' : ''} inline-block`}>
                {milestone.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-12" /> {/* Spacer for absolute milestones */}
    </div>
  );
}
