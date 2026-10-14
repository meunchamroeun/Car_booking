import { CarType } from '@/types';
import { cn } from '@/lib/utils';

const BODY: Record<CarType, { body: string; windows: string[] }> = {
  Sedan: {
    body: 'M18 70 Q16 56 30 52 L70 46 Q92 28 120 27 L150 27 Q170 28 190 46 L214 50 Q226 53 226 64 L226 72 Q226 76 220 76 L20 76 Q18 76 18 70 Z',
    windows: ['M82 46 Q99 34 120 32 L131 32 L131 46 Z', 'M137 32 L150 32 Q166 33 180 46 L137 46 Z'],
  },
  SUV: {
    body: 'M16 70 L16 54 Q16 48 24 47 L56 44 L76 22 Q80 18 88 18 L176 18 Q186 18 192 26 L208 44 L218 46 Q226 48 226 58 L226 72 Q226 76 220 76 L20 76 Q16 76 16 70 Z',
    windows: ['M68 44 L83 25 L124 25 L124 44 Z', 'M130 25 L172 25 Q180 25 184 31 L195 44 L130 44 Z'],
  },
  Van: {
    body: 'M14 72 L14 30 Q14 16 30 14 L178 12 Q194 12 204 26 L222 50 Q226 54 226 62 L226 72 Q226 76 220 76 L18 76 Q14 76 14 72 Z',
    windows: ['M26 22 L74 21 L74 42 L26 42 Z', 'M82 21 L140 20 L140 42 L82 42 Z', 'M148 20 L176 19 Q186 19 192 28 L202 42 L148 42 Z'],
  },
  Pickup: {
    body: 'M14 72 L14 48 L112 48 L126 22 Q130 18 138 18 L178 18 Q188 18 194 26 L208 44 L218 46 Q226 48 226 58 L226 72 Q226 76 220 76 L18 76 Q14 76 14 72 Z',
    windows: ['M124 44 L135 24 L168 24 L168 44 Z', 'M174 24 Q184 24 188 30 L197 44 L174 44 Z'],
  },
};

/** Flat side-view vehicle illustration, tinted with the car's paint colour. */
export function CarArt({ type, color = '#875A7B', className }: { type: CarType; color?: string; className?: string }) {
  const shape = BODY[type];
  return (
    <svg viewBox="0 0 240 100" className={cn('h-auto w-full', className)} aria-hidden>
      <ellipse cx="120" cy="90" rx="104" ry="5" fill="currentColor" opacity="0.10" />
      <path d={shape.body} fill={color} stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
      <path d={shape.body} fill="url(#shine)" opacity="0.5" />
      {shape.windows.map((w, i) => (
        <path key={i} d={w} fill="#1E2535" opacity="0.88" />
      ))}
      {type === 'Pickup' && <path d="M16 52 L110 52" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />}
      <rect x="214" y="56" width="10" height="5" rx="2" fill="#FFF4C8" />
      <rect x="15" y="56" width="6" height="6" rx="2" fill="#E2546A" />
      {[58, 182].map(cx => (
        <g key={cx}>
          <circle cx={cx} cy="76" r="17" fill="#1C2130" />
          <circle cx={cx} cy="76" r="8" fill="#C9CDD6" />
          <circle cx={cx} cy="76" r="3" fill="#5B657E" />
        </g>
      ))}
      <defs>
        <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
