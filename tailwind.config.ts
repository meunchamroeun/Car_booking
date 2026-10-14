import type { Config } from 'tailwindcss';

const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Kantumruy Pro', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        background: token('background'),
        foreground: token('foreground'),
        primary: { DEFAULT: token('primary'), foreground: token('primary-foreground'), soft: token('primary-soft') },
        secondary: { DEFAULT: token('secondary'), foreground: token('secondary-foreground') },
        muted: { DEFAULT: token('muted'), foreground: token('muted-foreground') },
        accent: { DEFAULT: token('accent'), foreground: token('accent-foreground') },
        card: { DEFAULT: token('card'), foreground: token('card-foreground') },
        popover: { DEFAULT: token('card'), foreground: token('card-foreground') },
        navy: { DEFAULT: token('navy'), foreground: token('navy-foreground') },
        success: { DEFAULT: token('success'), soft: token('success-soft') },
        warning: { DEFAULT: token('warning'), soft: token('warning-soft') },
        destructive: { DEFAULT: token('danger'), foreground: '0 0% 100%', soft: token('danger-soft') },
        info: { DEFAULT: token('info'), soft: token('info-soft') },
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 6px)',
      },
      boxShadow: {
        card: '0 1px 2px hsl(var(--shadow) / 0.04), 0 4px 16px -6px hsl(var(--shadow) / 0.10)',
        float: '0 12px 32px -12px hsl(var(--shadow) / 0.35)',
      },
      keyframes: {
        'toast-in': { from: { opacity: '0', transform: 'translateY(-8px) scale(0.98)' }, to: { opacity: '1', transform: 'none' } },
        pulse_ring: { '0%': { boxShadow: '0 0 0 0 hsl(var(--success) / 0.5)' }, '100%': { boxShadow: '0 0 0 8px hsl(var(--success) / 0)' } },
        scan: { '0%,100%': { top: '6%' }, '50%': { top: '90%' } },
      },
      animation: {
        'toast-in': 'toast-in 0.22s ease-out',
        pulse_ring: 'pulse_ring 1.6s ease-out infinite',
        scan: 'scan 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
