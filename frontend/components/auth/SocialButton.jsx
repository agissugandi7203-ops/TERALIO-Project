import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * SocialButton
 * Takes icon and label. Button has `bg-black border border-white/10 rounded-xl hover:bg-white/5`.
 * Renders an inline spinning loader when loading=true with native feel.
 */
export function SocialButton({
  icon,
  label,
  onClick,
  disabled = false,
  loading = false,
  isNight = true,
}) {
  const themeClasses = isNight
    ? 'bg-black border border-white/10 text-white hover:bg-white/5 hover:border-white/20'
    : 'bg-white border border-[#14202f]/14 text-[#14202f] hover:bg-[#f7f8f4] hover:border-[#14202f]/28 shadow-sm';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      data-testid={`social-btn-${label.toLowerCase()}`}
      className={`relative h-11 w-full flex items-center justify-center gap-2.5 rounded-xl text-sm font-medium active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden ${themeClasses}`}
    >
      <span className="flex items-center justify-center shrink-0">
        {loading ? (
          <Loader2 className={`w-4 h-4 animate-spin ${isNight ? 'text-white' : 'text-[#14202f]'}`} />
        ) : (
          <span className="transition-transform duration-200 group-hover:scale-105">{icon}</span>
        )}
      </span>
      <span>{loading ? 'Connecting...' : label}</span>
    </button>
  );
}

export default SocialButton;
