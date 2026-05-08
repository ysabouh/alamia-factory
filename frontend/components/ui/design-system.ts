export const dsColors = {
  primary: "hsl(var(--primary))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  card: "hsl(var(--card))",
  border: "hsl(var(--border))",
  muted: "hsl(var(--muted))",
  status: {
    success: "rgb(16 185 129)",
    warning: "rgb(245 158 11)",
    critical: "rgb(239 68 68)",
    info: "rgb(14 165 233)"
  }
} as const;

export const dsTypography = {
  display: "text-3xl md:text-4xl font-semibold tracking-tight",
  heading: "text-xl md:text-2xl font-semibold",
  title: "text-base md:text-lg font-semibold",
  body: "text-sm md:text-base text-foreground",
  caption: "text-xs text-muted-foreground"
} as const;

export const dsSpacing = {
  section: "space-y-6",
  cardPadding: "p-5 md:p-6",
  grid: "gap-4 md:gap-6"
} as const;
