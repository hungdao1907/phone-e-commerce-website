import { create } from 'zustand';

export interface Milestone {
  id: string; // Updated to string for UUID
  amount: number;
  label: string;
  type: string;
  isActive: boolean;
  discount?: number;
}

interface RewardsState {
  milestones: Milestone[];
  setMilestones: (milestones: Milestone[]) => void;
  fetchMilestones: () => Promise<void>;
}

export const useRewardsStore = create<RewardsState>()(
  (set) => ({
    milestones: [],
    setMilestones: (milestones) => set({ milestones }),
    fetchMilestones: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/rewards`);
        if (response.ok) {
          const data = await response.json();
          set({ milestones: data });
        }
      } catch (error) {
        console.error('Failed to fetch rewards:', error);
      }
    }
  })
);
