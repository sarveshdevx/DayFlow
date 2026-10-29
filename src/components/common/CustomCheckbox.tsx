import React from 'react';
import { Check } from 'lucide-react';
import type { Priority } from '../../types';

interface CustomCheckboxProps {
  completed: boolean;
  priority: Priority;
  onToggle: () => void;
  size?: 'sm' | 'md';
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  completed,
  priority,
  onToggle,
  size = 'md',
}) => {
  // Border and fill colors mapped by priority
  const priorityColorClasses = {
    1: 'border-[#dc4c3e] hover:bg-[#dc4c3e]/20 text-[#dc4c3e]',
    2: 'border-[#e58e26] hover:bg-[#e58e26]/20 text-[#e58e26]',
    3: 'border-[#3867d6] hover:bg-[#3867d6]/20 text-[#3867d6]',
    4: 'border-neutral-500 hover:border-neutral-300 text-neutral-400',
  }[priority];

  const completedClasses = {
    1: 'bg-[#dc4c3e] border-[#dc4c3e] text-white',
    2: 'bg-[#e58e26] border-[#e58e26] text-white',
    3: 'bg-[#3867d6] border-[#3867d6] text-white',
    4: 'bg-neutral-500 border-neutral-500 text-white',
  }[priority];

  const dimClass = size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`relative rounded-full border-2 transition-all duration-150 flex items-center justify-center shrink-0 cursor-pointer group ${dimClass} ${
        completed ? completedClasses : priorityColorClasses
      }`}
      aria-label={completed ? 'Mark task incomplete' : 'Mark task complete'}
    >
      <Check
        className={`w-3 h-3 stroke-[3] transition-opacity duration-150 ${
          completed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      />
    </button>
  );
};
