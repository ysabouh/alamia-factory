import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        factory: {
          void: "#020617",
          steel: "#0f172a",
          panel: "#07111f",
          panelRaised: "#0b1628",
          rail: "#1e293b",
          cyan: "#22d3ee",
          cyanSoft: "#67e8f9",
          blue: "#38bdf8",
          amber: "#f59e0b",
          orange: "#f97316",
          green: "#22c55e",
          red: "#ef4444",
          violet: "#8b5cf6",
          running: "#22c55e",
          idle: "#f59e0b",
          maintenance: "#38bdf8",
          alarm: "#ef4444",
          offline: "#64748b",
          down: "#ef4444"
        }
      },
      boxShadow: {
        industrial: "0 18px 70px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        glowCyan: "0 0 0 1px rgba(34, 211, 238, 0.18), 0 0 34px rgba(34, 211, 238, 0.18)",
        glowRed: "0 0 0 1px rgba(239, 68, 68, 0.24), 0 0 34px rgba(239, 68, 68, 0.22)",
        glowGreen: "0 0 0 1px rgba(34, 197, 94, 0.22), 0 0 30px rgba(34, 197, 94, 0.16)",
        insetPanel: "inset 0 0 28px rgba(34, 211, 238, 0.05)"
      },
      fontFamily: {
        industrial: ["var(--font-industrial)", "ui-sans-serif", "system-ui"],
        telemetry: ["var(--font-telemetry)", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"]
      },
      spacing: {
        "control-xs": "0.375rem",
        "control-sm": "0.75rem",
        "control-md": "1rem",
        "control-lg": "1.5rem",
        "control-xl": "2rem"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        control: "1rem",
        module: "1.5rem",
        command: "2rem"
      }
    }
  },
  plugins: [animate]
};

export default config;
