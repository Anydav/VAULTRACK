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