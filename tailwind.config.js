/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '375px',      // iPhone SE, small phones
        'sm': '640px',      // Default small
        'md': '768px',      // iPad Mini, tablets
        'lg': '1024px',     // iPad Pro, desktop
        'xl': '1280px',     // Large desktop
        '2xl': '1536px',    // Extra large desktop
        // Custom breakpoints for specific devices
        'iphone-se': '375px',
        'iphone-xr': '414px',
        'iphone-12-pro': '390px',
        'iphone-14-pro-max': '430px',
        'pixel-7': '412px',
        'galaxy-s8': '360px',
        'galaxy-s20': '412px',
        'ipad-mini': '768px',
        'ipad-air': '820px',
        'ipad-pro': '1024px',
        'surface-pro': '912px',
        'surface-duo': '540px',
        'galaxy-fold': '280px',
        'zenbook-fold': '1024px',
        'galaxy-a51': '412px',
        'nest-hub': '1024px',
        'nest-hub-max': '1280px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      maxWidth: {
        'screen-xs': '375px',
        'screen-sm': '640px',
        'screen-md': '768px',
        'screen-lg': '1024px',
        'screen-xl': '1280px',
        'screen-2xl': '1536px',
      },
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.safe-area-pb': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.safe-area-pt': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.safe-area-pl': {
          'padding-left': 'env(safe-area-inset-left)',
        },
        '.safe-area-pr': {
          'padding-right': 'env(safe-area-inset-right)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
};
