# Industrial Design System

## Design Philosophy

MyFactory should feel like a factory operating system, not a generic SaaS admin. The visual language is inspired by SCADA, MES, Siemens-style industrial controls, and cyber-industrial control rooms.

The UI must communicate:

- The factory is alive.
- Machine status is always visible.
- Critical alerts dominate visually.
- Production and material flow are more important than decorative cards.
- Arabic RTL is the primary reading direction.

## Design Tokens

Tokens live in:

- `frontend/tailwind.config.ts`
- `frontend/app/globals.css`

### Color System

Core industrial palette:

- `factory.void`: deepest background.
- `factory.steel`: structural surface.
- `factory.panel`: panel base.
- `factory.panelRaised`: elevated panel.
- `factory.rail`: borders, rails, dividers.
- `factory.cyan`: primary industrial signal.
- `factory.cyanSoft`: secondary glow.
- `factory.blue`: maintenance and technical signals.
- `factory.amber`: idle and waiting.
- `factory.green`: running and healthy.
- `factory.red`: alarm and critical failure.
- `factory.violet`: advanced analytics or AI.

### Machine Status Colors

- `running`: green, live pulse, operational glow.
- `idle`: amber, static ready state.
- `maintenance`: blue/cyan, slow pulse, technician state.
- `alarm`: red, blinking, critical glow.
- `offline`: slate/gray, no glow, muted.
- `down`: red, blinking or danger glow.

### Depth And Glow

Use shadows intentionally:

- `shadow-industrial`: elevated operational panels.
- `shadow-glowCyan`: active control surfaces.
- `shadow-glowGreen`: healthy machine state.
- `shadow-glowRed`: alarm and critical alert.
- `shadow-insetPanel`: embedded control surfaces.

### Radius System

- `rounded-control`: buttons, inputs, compact controls.
- `rounded-module`: cards and widgets.
- `rounded-command`: command center panels.

### Typography

Use two typographic modes:

- Industrial UI text: Arabic optimized system font through `--font-industrial`.
- Telemetry and counters: `telemetry-text` using monospace tabular numbers.

Hierarchy:

- Page title: large, bold, command-center only.
- Section title: compact but high contrast.
- Telemetry labels: uppercase/monospace, small tracking.
- Arabic body text: clear, medium weight, never overly decorative.

## Reusable Components

Reusable industrial widgets live in:

- `frontend/components/factory/design-system.tsx`
- `frontend/components/factory/machine-state.ts`
- `frontend/components/factory/status-beacon.tsx`
- `frontend/components/factory/machine-panel.tsx`

### Component Inventory

- `IndustrialPanel`: base SCADA/MES panel.
- `IndustrialKpiCard`: KPI display with telemetry typography.
- `IndustrialAlertCard`: warning and alarm cards.
- `IndustrialButton`: industrial action button.
- `SensorDisplay`: sensor bar for temperature, pressure, efficiency, cycle stability.
- `ControlPanel`: grouped operational controls.
- `RealtimeIndicator`: live/online indicator.
- `MachineStateBadge`: state badge using shared machine state visuals.
- `ProductionWidget`: compact production metric widget.
- `SignalStrip`: connection/source indicator.
- `MachinePanel`: realistic machine control panel.

## Machine Visualization System

Machine visual behavior is defined in `machine-state.ts`.

### Running

- Color: green with cyan support.
- Glow: green/cyan glow.
- Motion: subtle pulse.
- Meaning: machine is producing or operational.

### Idle

- Color: amber.
- Glow: minimal.
- Motion: static.
- Meaning: machine is ready but waiting.

### Maintenance

- Color: blue/cyan.
- Glow: technical cyan glow.
- Motion: slow pulse.
- Meaning: technician intervention or planned maintenance.

### Alarm

- Color: red.
- Glow: danger glow.
- Motion: blinking.
- Meaning: requires control-room attention.

### Offline

- Color: slate/gray.
- Glow: none.
- Motion: none.
- Meaning: no current signal or not connected.

## Layout Rules

### Control Room Layout

- Use a narrow console sidebar.
- Main content should dominate the screen.
- Header shows system heartbeat, shift, and data source.
- Critical alerts should be visually stronger than charts.

### Factory Map Layout

- Show material flow from raw materials to production zones to finished goods.
- Zones should be visual blocks, not tables.
- Use animated flow lines to express movement.
- Machine count and running count must be visible per zone.

### Machine Monitoring Layout

- Machine panels are primary.
- Each panel must show status, production counter, assigned mold, operator, technician, downtime, and at least three sensor-like values.
- Alerts appear inside the machine context.

### Analytics Layout

- Aggregated charts only.
- Do not animate high-frequency charts aggressively.
- Use telemetry typography for values.
- Keep explanatory labels visible for Arabic users.

### Alert Center Layout

- Critical alerts use red glow and blink only for the signal, not the entire card.
- Alerts need lifecycle states: raised, acknowledged, assigned, resolved.
- Alerts should reference machine/order/material context.

## Motion System

Motion must feel operational, not decorative.

- `pulse-live`: live signals, healthy status lights, connected beacons.
- `blink-alarm`: critical alarm indicators only.
- `material-flow`: material movement and production flow.
- `hover-lift`: subtle depth on interactive panels.

Rules:

- Never animate large blocks continuously.
- Do not blink non-critical information.
- Use motion to explain state or flow.
- Keep charts stable and readable.

## UI Guidelines

Use:

- Dark layered panels.
- Cyan as the primary operating signal.
- Green only for healthy running state.
- Amber only for waiting/idle.
- Red only for alarm/failure.
- Monospace for counters and telemetry.
- Arabic RTL labels by default.

Avoid:

- Generic SaaS cards.
- Flat white/gray admin layouts.
- Too many colors at once.
- Decorative animation without operational meaning.
- Business logic in React components.

## Implementation Guidance

New screens should compose from the design system first:

```tsx
<IndustrialPanel eyebrow="CONTROL ROOM" title="Machine Cluster">
  <IndustrialKpiCard label="OUTPUT" value="18,420" unit="pcs" />
  <SensorDisplay label="Pressure" value={142} max={160} unit="bar" />
  <IndustrialAlertCard title="Hydraulic Alarm" message="INJ-04 requires technician review." />
</IndustrialPanel>
```

Only create a new component when the existing industrial widgets cannot express the required manufacturing concept.
