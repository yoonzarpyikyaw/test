import React, { useState } from 'react';

interface FamilyVersionLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FamilyVersionLogo: React.FC<FamilyVersionLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const [hasImgError, setHasImgError] = useState(false);

  const iconSizes = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl',
  };

  const subSizes = {
    sm: 'text-[10px]',
    md: 'text-[11px] sm:text-xs',
    lg: 'text-sm',
  };

  return (
    <div className={`flex items-center gap-2.5 group shrink-0 ${className}`}>
      {/* App Icon matching the Family Version squircle design */}
      <div
        className={`relative ${iconSizes[size]} overflow-hidden shadow-lg shadow-red-600/30 border border-white/15 group-hover:scale-105 transition-transform shrink-0 bg-[#09090b] flex items-center justify-center`}
      >
        {!hasImgError ? (
          <img
            src="/family_version_icon.jpg"
            alt="Family Version"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setHasImgError(true)}
          />
        ) : (
          /* Built-in SVG Vector: Retro TV Antenna with Play Button */
          <svg
            viewBox="0 0 40 40"
            className="w-full h-full p-1"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* TV Antennas */}
            <line x1="15" y1="12" x2="8" y2="5" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="7.5" cy="4.5" r="2.2" fill="#EF4444" />
            <line x1="25" y1="12" x2="32" y2="5" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="32.5" cy="4.5" r="2.2" fill="#EF4444" />

            {/* TV Frame Top Arc */}
            <path d="M12 12C12 10.5 14 9.5 20 9.5C26 9.5 28 10.5 28 12H12Z" fill="#EF4444" />

            {/* TV Body */}
            <rect x="6" y="12" width="28" height="20" rx="5" fill="#18181B" stroke="#EF4444" strokeWidth="1.8" />

            {/* Screen Area */}
            <rect x="9" y="14.5" width="22" height="15" rx="3.5" fill="#09090B" />

            {/* Red Play Button */}
            <polygon points="18,18 24,22 18,26" fill="#EF4444" />

            {/* TV Stand Base */}
            <rect x="13" y="33" width="14" height="2.2" rx="1.1" fill="#EF4444" />
          </svg>
        )}
      </div>

      {/* Styled Brand Typography */}
      <div className="flex flex-col justify-center leading-none select-none">
        <div className="flex items-center gap-1.5">
          <span className={`${titleSizes[size]} font-black tracking-tight text-white font-sans`}>
            Family
          </span>
          <span className={`${titleSizes[size]} font-black tracking-tight text-red-500 font-sans`}>
            Version
          </span>
        </div>
        <span
          className={`${subSizes[size]} font-semibold tracking-widest text-zinc-400 uppercase font-sans mt-0.5 flex items-center gap-1`}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          Cinema Hub
        </span>
      </div>
    </div>
  );
};
