import React from 'react';
import { Check, Utensils, Droplets, Trash2, Pill, Scale, Leaf } from 'lucide-react';
import { CombIcon } from './icons/CombIcon';
import { TaskProgress } from '../types';

interface StatusCardProps {
  type: 'food' | 'water' | 'litter' | 'grooming' | 'medication' | 'supplements' | 'weight';
  progress: TaskProgress;
  customLabel?: string; // Custom label from pet settings
}

export const StatusCard: React.FC<StatusCardProps> = ({ type, progress, customLabel }) => {
  const config = {
    food: {
      label: '更換飼料',
      icon: Utensils,
      color: 'bg-yellow-100',
      activeColor: 'bg-yellow-400',
      textColor: 'text-yellow-700',
      checkColor: 'bg-yellow-500',
    },
    water: {
      label: '更換飲水',
      icon: Droplets,
      color: 'bg-[#921AFF]/10',
      activeColor: 'bg-[#921AFF]',
      textColor: 'text-[#921AFF]',
      checkColor: 'bg-[#921AFF]',
    },
    litter: {
      label: '清理貓砂',
      icon: Trash2,
      color: 'bg-emerald-100',
      activeColor: 'bg-emerald-400',
      textColor: 'text-emerald-700',
      checkColor: 'bg-emerald-500',
    },
    grooming: {
      label: '梳毛',
      icon: CombIcon,
      color: 'bg-pink-100',
      activeColor: 'bg-pink-400',
      textColor: 'text-pink-700',
      checkColor: 'bg-pink-500',
    },
    medication: {
      label: '給藥',
      icon: Pill,
      color: 'bg-cyan-100',
      activeColor: 'bg-cyan-400',
      textColor: 'text-cyan-700',
      checkColor: 'bg-cyan-500',
    },
    supplements: {
      label: '保健食品',
      icon: Leaf,
      color: 'bg-indigo-50',
      activeColor: 'bg-indigo-400',
      textColor: 'text-indigo-700',
      checkColor: 'bg-indigo-500',
    },
    weight: {
      label: '紀錄體重',
      icon: Scale,
      color: 'bg-[#EA7500]/10',
      activeColor: 'bg-[#EA7500]',
      textColor: 'text-[#EA7500]',
      checkColor: 'bg-[#EA7500]',
    },
  };

  const { label, icon: Icon, color, activeColor, textColor, checkColor } = config[type];
  const isDone = progress.isComplete;

  const PeriodBadge = ({ active, label }: { active: boolean, label: string }) => (
    <div className={`
        flex flex-col items-center gap-1 transition-all duration-300
        ${active ? 'opacity-100 scale-110' : 'opacity-40 grayscale'}
    `}>
      <div className={`
            w-2 h-2 rounded-full 
            ${active ? checkColor : 'bg-stone-300'}
        `} />
      <span className="text-[10px] font-bold text-stone-500">{label}</span>
    </div>
  );

  return (
    <div className={`
      relative flex flex-col items-center justify-center p-3 py-4 rounded-2xl transition-all duration-500
      ${isDone ? 'bg-white shadow-sm ring-2 ring-stone-200 opacity-90' : 'bg-white shadow-md'}
    `}>
      <div className={`
        w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-colors duration-300
        ${isDone ? activeColor : color}
      `}>
        {isDone ? (
          <Check className="w-8 h-8 text-white animate-bounce" />
        ) : (
          <Icon className={`w-7 h-7 ${textColor}`} />
        )}
      </div>

      <span className={`font-bold text-sm mb-3 ${isDone ? 'text-stone-400' : 'text-stone-700'}`}>
        {customLabel || label}
      </span>

      {/* Progress Indicators */}
      {/* Progress Indicators */}
      <div className="flex items-center justify-center gap-3 w-full bg-stone-50 rounded-lg py-1.5 px-2">
        <PeriodBadge active={progress.morning} label="早" />
        <PeriodBadge active={progress.noon} label="中" />
        <PeriodBadge active={progress.evening} label="晚" />
        <PeriodBadge active={progress.bedtime} label="睡" />
      </div>
    </div>
  );
};