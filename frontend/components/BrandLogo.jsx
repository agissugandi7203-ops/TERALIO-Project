import React from 'react';

const ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

export function BrandLogo({ className }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <g fill="var(--sun-logo)">
        <circle cx="20" cy="20" r="0" />
        {ANGLES.map((deg) => (
          <path
            key={deg}
            d="M18.3 3.5h3.4l.9 8.4h-5.2Z"
            transform={deg === 0 ? undefined : `rotate(${deg} 20 20)`}
          />
        ))}
      </g>
    </svg>
  );
}

export default BrandLogo;
