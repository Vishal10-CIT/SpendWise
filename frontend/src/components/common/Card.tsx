import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  glass = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl border transition-all duration-200',
          glass
            ? 'glass-card shadow-sm'
            : 'bg-white border-slate-200/80 shadow-sm',
          hover && 'hover:shadow-md hover:border-slate-300',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
