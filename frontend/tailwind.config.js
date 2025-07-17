/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Blue Gradient System
        'primary-blue': '#007bff',
        'secondary-blue': '#0600a6',
        'accent-blue': '#b4a1f4',

        // Emerald/Green System
        'emerald': {
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },

        // Background Gradients
        'light-bg-start': '#daf0fa',
        'light-bg-mid': '#bceaff',
        'dark-bg-start': '#020b23',
        'dark-bg-mid': '#001233',
        'dark-bg-end': '#0a1128',

        // Text Colors
        'light-text': '#1f2937',
        'dark-text': '#f9fafb',
      },
      backgroundImage: {
        'header-gradient': 'linear-gradient(90deg, #007bff 0%, #0600a6 50%, #b4a1f4 100%)',
        'button-gradient': 'linear-gradient(to right, #059669, #047857)',
        'light-mode-bg': 'linear-gradient(to bottom right, #daf0fa, #bceaff, #bceaff)',
        'dark-mode-bg': 'linear-gradient(to bottom right, #020b23, #001233, #0a1128)'
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '12px',
        md: '16px',
        lg: '24px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'button': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      },
      borderRadius: {
        'glass': '1.5rem',
        'button': '0.75rem'
      },
      borderWidth: {
        'glass': '1px'
      },
      keyframes: {
        fall: {
          '0%': { transform: 'translateY(-100px) rotate(0deg)', opacity: '1' },
          '70%': { opacity: '0.9' },
          '100%': { transform: 'translateY(1000px) rotate(360deg)', opacity: '0' }
        },
        scrollUp: {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(-50%)' }
        },
        scrollDown: {
          '0%': { transform: 'translateY(-50%)' },
          '100%': { transform: 'translateY(0%)' }
        }
      },
      animation: {
        fall: 'fall 5s linear infinite',
        'scroll-up': 'scrollUp 7s linear infinite',
        'scroll-down': 'scrollDown 7s linear infinite',
      }
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.glass-panel': {
          '@apply bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-glass': {},
        },
        '.glass-button': {
          '@apply bg-white/5 dark:bg-gray-700/5 border border-white/10 dark:border-gray-700/10': {},
        },
        '.text-gradient': {
          '@apply bg-clip-text text-transparent bg-gradient-to-r from-primary-blue to accent-blue': {},
        }
      })
    }
  ]
}
