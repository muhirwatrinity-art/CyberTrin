import React from 'react';

interface UgandaFlagProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const UgandaFlag: React.FC<UgandaFlagProps> = ({
  className = 'w-6 h-4',
  width,
  height,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 900 600"
      className={`rounded-sm shadow-xs inline-block align-middle shrink-0 ${className}`}
      style={{ width: width, height: height }}
      role="img"
      aria-label="Flag of the Republic of Uganda"
    >
      {/* 6 Equal Horizontal Stripes: Black, Yellow, Red, Black, Yellow, Red */}
      <rect width="900" height="100" y="0" fill="#000000" />
      <rect width="900" height="100" y="100" fill="#FFCD00" />
      <rect width="900" height="100" y="200" fill="#D90000" />
      <rect width="900" height="100" y="300" fill="#000000" />
      <rect width="900" height="100" y="400" fill="#FFCD00" />
      <rect width="900" height="100" y="500" fill="#D90000" />

      {/* Central White Disc */}
      <circle cx="450" cy="300" r="140" fill="#FFFFFF" />

      {/* Grey Crowned Crane (National Bird Silhouette & Crest Detail) */}
      <g transform="translate(450, 300) scale(0.95)">
        {/* Legs */}
        <path
          d="M -5 50 L -10 115 M -10 115 L -25 120 M -10 115 L -5 122 M -10 115 L 5 120"
          stroke="#000000"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 12 50 L 15 115 M 15 115 L 2 120 M 15 115 L 20 122 M 15 115 L 28 120"
          stroke="#000000"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Body plumage */}
        <ellipse cx="2" cy="25" rx="36" ry="24" fill="#3A3A3C" />
        {/* White wing patch */}
        <path
          d="M -15 12 Q 10 5 28 22 Q 12 38 -15 28 Z"
          fill="#FFFFFF"
        />
        {/* Red wing feather accent */}
        <path
          d="M 14 16 Q 24 24 28 32 Q 20 34 10 26 Z"
          fill="#D90000"
        />

        {/* Tail feathers */}
        <path
          d="M 30 18 Q 48 30 52 48 Q 36 40 24 32 Z"
          fill="#FFCD00"
        />

        {/* Neck curving upwards and facing hoist (left) */}
        <path
          d="M -16 20 C -25 5 -28 -20 -22 -45 C -20 -55 -18 -65 -24 -75"
          fill="none"
          stroke="#3A3A3C"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Head */}
        <circle cx="-25" cy="-80" r="11" fill="#000000" />
        
        {/* White & red cheek patches */}
        <circle cx="-27" cy="-80" r="5" fill="#FFFFFF" />
        <circle cx="-25" cy="-76" r="3" fill="#D90000" />

        {/* Beak facing left */}
        <polygon points="-36,-80 -48,-78 -35,-75" fill="#1C1C1E" />

        {/* Golden bristly Crown / Crest of Crane */}
        <path
          d="M -26 -90 L -38 -108 M -24 -91 L -32 -114 M -22 -91 L -22 -118 M -19 -91 L -12 -114 M -17 -90 L -2 -108 M -16 -89 L 8 -102"
          stroke="#FFCD00"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Red accent at base of crown */}
        <circle cx="-22" cy="-90" r="4" fill="#D90000" />
      </g>
    </svg>
  );
};
