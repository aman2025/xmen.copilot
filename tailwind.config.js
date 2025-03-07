/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            table: {
              borderCollapse: 'collapse',
              width: '100%',
              marginTop: '1rem',
              marginBottom: '1rem'
            },
            th: {
              backgroundColor: 'var(--tw-prose-thead)',
              fontWeight: '600',
              textAlign: 'left',
              padding: '0.75rem',
              border: '1px solid var(--tw-prose-hr)'
            },
            td: {
              padding: '0.75rem',
              border: '1px solid var(--tw-prose-hr)'
            }
          }
        }
      },
      keyframes: {
        progressBar: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        checkmark: {
          '0%': {
            transform: 'scale(0.8)',
            opacity: '0'
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1'
          }
        }
      },
      animation: {
        progressBar: 'progressBar 1.5s ease-in-out infinite',
        checkmark: 'checkmark 0.3s ease-out forwards'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
