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
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
