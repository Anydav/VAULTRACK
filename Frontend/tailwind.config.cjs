module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        "accent-secondary": "var(--color-accent-secondary)",

        background: "var(--color-background)",
        surface: "var(--color-surface)",
        text: "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        border: "var(--color-border)",

        success: "var(--color-success)",
        danger: "var(--color-danger)",
        "danger-bg": "var(--color-danger-bg)",
        "highlight-bg": "var(--color-highlight-bg)",
        "success-bg": "var(--color-success-bg)",

        // Overrides Tailwind's static default gray scale with the
        // custom-property-backed one in index.css, so every existing
        // text-gray-*/border-gray-*/bg-gray-* class automatically
        // flips under .theme-dark instead of needing a per-class rewrite.
        gray: {
          50: "var(--gray-50)",
          100: "var(--gray-100)",
          200: "var(--gray-200)",
          300: "var(--gray-300)",
          400: "var(--gray-400)",
          500: "var(--gray-500)",
          600: "var(--gray-600)",
          700: "var(--gray-700)",
          800: "var(--gray-800)",
          900: "var(--gray-900)",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Sora"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        "toast-in": {
          "0%": { transform: "translateX(120%)", opacity: "0" },
          "60%": { transform: "translateX(-10%)", opacity: "1" },
          "80%": { transform: "translateX(4%)" },
          "100%": { transform: "translateX(0)" },
       },
        "toast-out": {
         "0%": { transform: "translateX(0)", opacity: "1" },
         "100%": { transform: "translateX(120%)", opacity: "0" },
        },
      },
      animation: {
        "toast-in": "toast-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "toast-out": "toast-out 0.3s ease-in forwards",
      },
    }
  },
  plugins: []
}