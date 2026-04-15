/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-slow':   'bounce 3s infinite',
        'fade-in':       'fadeIn 0.5s ease forwards',
        'fade-up':       'fadeUp 0.5s ease forwards',
        'fade-down':     'fadeDown 0.4s ease forwards',
        'scale-in':      'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'slide-right':   'slideRight 0.5s ease forwards',
        'progress-fill': 'progressFill 1.2s ease forwards',
        'spin-slow':     'spin 2s linear infinite',
        'ping-slow':     'ping 2s cubic-bezier(0,0,0.2,1) infinite',
        'float':         'float 3s ease-in-out infinite',
        'shimmer':       'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeDown: {
          '0%':   { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.7)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        progressFill: {
          '0%':   { width: '0%' },
          '100%': { width: '100%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
