import type { ReactNode } from 'react';

type StepBadgeProps = {
  children: ReactNode;
};

export function StepBadge({ children }: StepBadgeProps) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white shadow-sm ring-1 ring-teal-700/20">
      {children}
    </span>
  );
}
