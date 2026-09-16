import React from 'react';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-neutral-200/60 shadow-sm px-4">
      <div className="w-16 h-16 bg-neutral-50 flex items-center justify-center rounded-full mb-4">
        <Icon className="w-8 h-8 text-neutral-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-neutral-900 mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-sm font-medium rounded-full transition-colors active:scale-95 shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
