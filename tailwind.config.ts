import type { Config } from 'tailwindcss';

const hslVar = (name: string) => `hsl(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', '"Cascadia Code"', '"Fira Code"', 'monospace'],
      },
      screens: {
        '2xl': '1536px',
        '3xl': '1920px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'grid-pattern':
          'linear-gradient(to right, hsl(var(--border) / 0.3) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.3) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '40px 40px',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        soft: 'var(--shadow-soft)',
        md: 'var(--shadow-md)',
        panel: 'var(--shadow-panel)',
        elevated: 'var(--shadow-elevated)',
        glow: 'var(--shadow-glow)',
        'glow-success': 'var(--shadow-glow-success)',
      },
      opacity: {
        '15': '0.15',
        '35': '0.35',
        '45': '0.45',
        '55': '0.55',
        '78': '0.78',
        '85': '0.85',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      colors: {
        background: hslVar('--background'),
        foreground: hslVar('--foreground'),
        card: {
          DEFAULT: hslVar('--card'),
          foreground: hslVar('--card-foreground'),
        },
        popover: {
          DEFAULT: hslVar('--popover'),
          foreground: hslVar('--popover-foreground'),
        },
        primary: {
          DEFAULT: hslVar('--primary'),
          foreground: hslVar('--primary-foreground'),
        },
        secondary: {
          DEFAULT: hslVar('--secondary'),
          foreground: hslVar('--secondary-foreground'),
        },
        muted: {
          DEFAULT: hslVar('--muted'),
          foreground: hslVar('--muted-foreground'),
        },
        accent: {
          DEFAULT: hslVar('--accent'),
          foreground: hslVar('--accent-foreground'),
        },
        destructive: {
          DEFAULT: hslVar('--destructive'),
          foreground: hslVar('--destructive-foreground'),
        },
        border: hslVar('--border'),
        input: hslVar('--input'),
        ring: hslVar('--ring'),
        chart: {
          '1': hslVar('--chart-1'),
          '2': hslVar('--chart-2'),
          '3': hslVar('--chart-3'),
          '4': hslVar('--chart-4'),
          '5': hslVar('--chart-5'),
        },
        success: {
          DEFAULT: hslVar('--success'),
          foreground: hslVar('--success-foreground'),
        },
        warning: {
          DEFAULT: hslVar('--warning'),
          foreground: hslVar('--warning-foreground'),
        },
        surface: {
          DEFAULT: hslVar('--surface'),
          foreground: hslVar('--surface-foreground'),
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-up-in': {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { opacity: '0.5' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.5' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--primary) / 0.3)' },
          '50%': { boxShadow: '0 0 0 8px hsl(var(--primary) / 0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.3s ease-out both',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up-in': 'slide-up-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
