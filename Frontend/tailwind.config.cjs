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
    }
  },
  plugins: []
}