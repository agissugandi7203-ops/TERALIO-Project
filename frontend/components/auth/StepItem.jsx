import React from 'react';

/**
 * StepItem
 * Takes number, text, and an optional active boolean.
 * - If active: Apply `bg-white text-black border border-white`. The number circle is `bg-black text-white`.
 * - If inactive: Apply `bg-brand-gray text-white border-none`. The number circle is `bg-white/10 text-white/40`.
 */
export function StepItem({ number, text, active = false }) {
  return (
    <div
      data-testid={`step-item-${number}`}
      className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
        active
          ? 'bg-white text-black border border-white shadow-lg'
          : 'bg-brand-gray bg-[#1A1A1A] text-white border-none'
      }`}
    >
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
          active ? 'bg-black text-white' : 'bg-white/10 text-white/40'
        }`}
      >
        {number}
      </span>
      <span className="truncate">{text}</span>
    </div>
  );
}

export default StepItem;
