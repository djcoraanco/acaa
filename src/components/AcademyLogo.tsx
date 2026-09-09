import React from 'react';

interface AcademyLogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'stacked';
  size?: 'sm' | 'md' | 'lg';
}

export const AcademyLogo: React.FC<AcademyLogoProps> = ({
  className = '',
  variant = 'full',
  size = 'md',
}) => {
  // Brand Colors from logo:
  // Carmine / Ruby Red: #c52227
  // Dark Charcoal: #252525

  const heightClass =
    size === 'sm' ? 'h-9' : size === 'lg' ? 'h-14' : 'h-11';

  return (
    <div
      className={`inline-flex items-center gap-3 bg-white select-none ${className}`}
      style={{ backgroundColor: '#ffffff' }}
    >
      <svg
        viewBox="0 0 460 100"
        className={`${heightClass} w-auto`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Academia de Cuerdas Antonio Aquino"
      >
        {/* === ICON / EMBLEM === */}
        <g id="emblem-arch">
          {/* 4 Charcoal outer arch lines */}
          {/* Line 1 (Outer) */}
          <path
            d="M 12 90 V 42 C 12 20, 28 8, 52 8 C 76 8, 92 20, 92 42 V 90"
            stroke="#252525"
            strokeWidth="3.5"
            strokeLinecap="square"
          />
          {/* Line 2 */}
          <path
            d="M 18 90 V 43 C 18 24, 32 14, 52 14 C 72 14, 86 24, 86 43 V 90"
            stroke="#252525"
            strokeWidth="3.5"
            strokeLinecap="square"
          />
          {/* Line 3 */}
          <path
            d="M 24 90 V 44 C 24 28, 35 20, 52 20 C 69 20, 80 28, 80 44 V 90"
            stroke="#252525"
            strokeWidth="3.5"
            strokeLinecap="square"
          />
          {/* Line 4 (Inner) */}
          <path
            d="M 30 90 V 45 C 30 32, 39 26, 52 26 C 65 26, 74 32, 74 45 V 90"
            stroke="#252525"
            strokeWidth="3.5"
            strokeLinecap="square"
          />

          {/* Horizontal cross strings / frets (A-crossbar) */}
          <line x1="30" y1="52" x2="74" y2="52" stroke="#252525" strokeWidth="3" />
          <line x1="30" y1="62" x2="74" y2="62" stroke="#252525" strokeWidth="3" />
          <line x1="30" y1="72" x2="74" y2="72" stroke="#252525" strokeWidth="3" />
        </g>

        {/* Red Note intersecting the A */}
        <g id="red-musical-note">
          {/* Note Stem */}
          <line
            x1="52"
            y1="8"
            x2="52"
            y2="66"
            stroke="#c52227"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* 3 Flags / beams on top curving right */}
          <path
            d="M 52 11 C 60 11, 70 14, 76 22"
            stroke="#c52227"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 52 20 C 60 20, 70 23, 76 30"
            stroke="#c52227"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 52 29 C 60 29, 69 31, 74 38"
            stroke="#c52227"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Notehead (slanted oval) */}
          <ellipse
            cx="44"
            cy="66"
            rx="11"
            ry="7.5"
            transform="rotate(-25 44 66)"
            fill="#c52227"
          />
        </g>

        {/* === LOGO TYPOGRAPHY === */}
        {variant !== 'icon' && (
          <g id="logo-text">
            {/* "ACADEMIA DE CUERDAS" styled with triple inline aesthetic */}
            <text
              x="112"
              y="54"
              fill="#c52227"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="34"
              fontWeight="800"
              letterSpacing="3.5"
              style={{
                fontVariantCaps: 'all-petite-caps',
                textTransform: 'uppercase',
              }}
            >
              ACADEMIA DE CUERDAS
            </text>

            {/* Subtitle: "ANTONIO AQUINO" in dark charcoal matching the branding */}
            <text
              x="114"
              y="80"
              fill="#252525"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="14"
              fontWeight="700"
              letterSpacing="7"
              style={{ textTransform: 'uppercase' }}
            >
              ANTONIO AQUINO
            </text>

            {/* Subtle red divider rule under subtitle */}
            <line
              x1="114"
              y1="90"
              x2="445"
              y2="90"
              stroke="#c52227"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.3"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
