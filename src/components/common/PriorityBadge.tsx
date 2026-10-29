import React from 'react';
import { Flag } from 'lucide-react';
import type { Priority } from '../../types';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  if (priority === 4) return null; // P4 typically doesn't show a flag tag in Todoist list view

  const config = {
    1: { color: 'text-[#dc4c3e]', label: 'P1' },
    2: { color: 'text-[#e58e26]', label: 'P2' },
    3: { color: 'text-[#3867d6]', label: 'P3' },
  }[priority as 1 | 2 | 3];

  const iconDim = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <span className={`inline-flex items-center gap-1 font-medium text-xs ${config.color}`} title={`Priority ${config.label}`}>
      <Flag className={`${iconDim} fill-current`} />
      <span>{config.label}</span>
    </span>
  );
};
