/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
<<<<<<< HEAD
        display: ['Outfit', 'sans-serif'],
        body: ['Lexend', 'sans-serif']
      },
      colors: {
        sand: '#f8f9fa',
        ink: '#000000',
        coral: '#29AAE2',
        ocean: '#0056b3',
        moss: '#28a745',
        night: '#000000',
        brand: {
          blue: '#29AAE2',
          black: '#000000',
          yellow: '#ffcd00',
          light: '#f8f9fa'
        }
=======
        display: ['Fraunces', 'serif'],
        body: ['Space Grotesk', 'sans-serif']
      },
      colors: {
        sand: '#f5f7fb',
        ink: '#0b1b3a',
        coral: '#f6a542',
        ocean: '#2457c5',
        moss: '#3aa67a',
        night: '#0b1333'
>>>>>>> 5ba2eb2c538f7bb373cc2fcea42d65cc791058de
      },
      boxShadow: {
        glow: '0 20px 60px -30px rgba(20,19,24,0.45)'
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        rise: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        rise: 'rise 0.6s ease-out both'
      }
    }
  },
  plugins: []
};
