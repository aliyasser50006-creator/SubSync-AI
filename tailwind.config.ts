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
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        panel: 'var(--shadow-panel)',
        glow: 'var(--shadow-glow)',
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
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.35s ease-out both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
