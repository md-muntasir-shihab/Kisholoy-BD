import React from 'react';

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline';
};

export const Badge = ({ className = '', variant = 'default', ...props }: BadgeProps) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors whitespace-nowrap';
  
  const variants = {
    default: 'bg-stone-100 text-stone-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
    outline: 'text-stone-800 border border-stone-300',
  };

  return <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />;
};
