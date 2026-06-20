import React from 'react';

export const Loader: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl'; text?: string }> = ({
  size = 'md',
  text,
}) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className={`animate-spin rounded-full border-t-brand-600 border-stone-200 ${sizes[size]}`}
      />
      {text && <p className="text-stone-500 font-medium text-sm animate-pulse">{text}</p>}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-stone-100 rounded-3xl overflow-hidden shadow-warm-xs p-4 flex flex-col gap-4 animate-pulse">
      <div className="aspect-square bg-stone-100 rounded-2xl w-full" />
      <div className="flex flex-col gap-2">
        <div className="h-6 bg-stone-100 rounded w-2/3" />
        <div className="h-4 bg-stone-100 rounded w-full" />
        <div className="h-4 bg-stone-100 rounded w-1/2" />
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-50">
        <div className="h-6 bg-stone-100 rounded w-1/4" />
        <div className="h-10 bg-stone-100 rounded-xl w-1/3" />
      </div>
    </div>
  );
};
