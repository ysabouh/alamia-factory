# MyFactory Design System

## Colors
- Core tokens are defined in `app/globals.css` (`--background`, `--foreground`, `--card`, `--primary`, `--border`, `--muted`).
- Status tokens:
  - `--status-success`
  - `--status-warning`
  - `--status-critical`
  - `--status-info`

## Typography
- Base families:
  - UI: `--font-industrial`
  - Telemetry: `--font-telemetry`
- Semantic utility classes:
  - `.ds-section-title`
  - `.ds-body`

## Spacing
- Global spacing tokens in `globals.css`:
  - `--space-1` .. `--space-8`
- Layout utilities:
  - `.ds-page`
  - `.ds-form-grid`

## Buttons
- Component: `components/ui/button.tsx`
- Variants:
  - `default`
  - `secondary`
  - `destructive`
  - `outline`
  - `ghost`
  - `industrial`
- Sizes:
  - `sm`, `default`, `lg`, `icon`

## Cards
- Component: `components/ui/card.tsx`
- Slots:
  - `Card`
  - `CardHeader`
  - `CardTitle`
  - `CardContent`
  - `CardFooter`

## Tables
- Component: `components/ui/table.tsx`
- Slots:
  - `Table`
  - `TableHeader`
  - `TableBody`
  - `TableRow`
  - `TableHead`
  - `TableCell`
  - `TableCaption`

## Forms
- Inputs:
  - `components/ui/input.tsx`
  - `components/ui/textarea.tsx`
- Form composition:
  - `components/ui/form.tsx` (`FormField`, `FormSection`)

## Status Badges
- Generic badge variants in `components/ui/badge.tsx`
- Semantic wrapper in `components/ui/status-badge.tsx`:
  - `success`, `warning`, `critical`, `info`, `neutral`
