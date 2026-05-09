import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
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
        },
        /** Semantic Smart Factory chassis (dark HMI shells) */
        sf: {
          void: "#010409",
          deep: "#020617",
          chassis: "#0a1628",
          panel: "#0d1b2f",
          panel2: "#102240",
          rail: "#1b2f4d",
          /** Legacy grid reference; prefer `stroke` / `hairline` for UI chrome. */
          line: "#1e4976",
          /** Outer rims & control outlines — hue-shifted from panel fill for legibility */
          stroke: "#5f93c9",
          /** Interior rules between regions / table rows vs same-hue fills */
          hairline: "#31567d",
          accent: "#00d4aa",
          accentCool: "#22d3ee",
          accentSiemens: "#009999",
          signal: "#3b82f6",
          caution: "#fbbf24",
          alarm: "#ff3b30",
          ok: "#34c759",
          /** Foreground tiers on dark shells (panels #0d1b2f) — brighter than rims for separation */
          ink: "#f7fbff",
          /** Primary reading text */
          copy: "#e9f3fc",
          /** Captions / table headers / eyebrow rails */
          muted: "#c2d7e9",
          /** Placeholders and tertiary hints */
          dim: "#93abc2"
        },
        /**
         * Atlas — لوحة داخلية دافئة (ورق/حجر) + شريط جانبي بني عميق + كهرمان أساسي + يشم ثانوي.
         * مستقل تمامًا عن sf (HMI) وأي نسق أزرق إداري سابق.
         */
        atlas: {
          canvas: "#f4f0e8",
          paper: "#fffcf7",
          ink: "#1c1814",
          slate: "#5c5650",
          muted: "#8a8278",
          rule: "#e0d9ce",
          sidebar: "#241f1b",
          sidebarLine: "#3d3530",
          sidebarMuted: "#c4b8ab",
          brand: "#c25621",
          brandHover: "#a3471a",
          brandSoft: "#fde8dc",
          brandSoftHover: "#fcd5c4",
          accent: "#1b6b56",
          accentHover: "#155a48",
          tableHead: "#ede8df",
          success: "#2d7a3e",
          warning: "#b8860b",
          danger: "#b42318",
          info: "#2a6f97"
        }
      },
      fontSize: {
        /** KPI / marquee numerals */
        "sf-display": ["2.75rem", { lineHeight: "1.05", letterSpacing: "-0.035em", fontWeight: "600" }],
        "sf-hero": ["2rem", { lineHeight: "1.15", letterSpacing: "-0.025em", fontWeight: "600" }],
        "sf-title": ["1.125rem", { lineHeight: "1.35", letterSpacing: "-0.015em", fontWeight: "600" }],
        "sf-label": ["0.6875rem", { lineHeight: "1.3", letterSpacing: "0.22em", fontWeight: "600" }],
        "sf-body": ["0.875rem", { lineHeight: "1.55" }],
        "sf-data": ["0.9375rem", { lineHeight: "1.2" }]
      },
      boxShadow: {
        industrial: "0 18px 70px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        glowCyan: "0 0 0 1px rgba(34, 211, 238, 0.18), 0 0 34px rgba(34, 211, 238, 0.18)",
        glowRed: "0 0 0 1px rgba(239, 68, 68, 0.24), 0 0 34px rgba(239, 68, 68, 0.22)",
        glowGreen: "0 0 0 1px rgba(34, 197, 94, 0.22), 0 0 30px rgba(34, 197, 94, 0.16)",
        insetPanel: "inset 0 0 28px rgba(34, 211, 238, 0.05)",
        atlasCard: "0 2px 8px rgba(28, 24, 20, 0.06), 0 1px 0 rgba(255, 252, 247, 0.8) inset",
        atlasLift: "0 12px 40px rgba(28, 24, 20, 0.12)",
        atlasBar: "0 1px 0 rgba(28, 24, 20, 0.06)"
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
