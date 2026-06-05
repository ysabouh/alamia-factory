# API Contracts

All endpoints are versioned under `/api/v1` and return JSON.

## Auth

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

## Dashboard

- `GET /dashboard/live`

Returns:

```json
{
  "kpis": {
    "producedPiecesToday": 18420,
    "producedWeightKgToday": 912.4,
    "wasteRate": 3.8,
    "machineUtilization": 82,
    "openMaintenanceTickets": 3,
    "lowStockItems": 5
  },
  "machines": [],
  "productionTrend": [],
  "alerts": []
}
```

Machine `status` values: `running`, `stopped`, `maintenance`, `breakdown`.

## Machines

### Registry

- `GET /machines` — paginated list (`search`, `type`, `status`, `isActive`, `sort`)
- `POST /machines` — create machine + type-specific `spec` payload
- `GET /machines/{machine}` — aggregate detail (spec, recent tickets)
- `PATCH /machines/{machine}` — update machine + spec
- `DELETE /machines/{machine}` — soft delete
- `PATCH /machines/{machine}/status` — floor status update (`running|stopped|maintenance|breakdown`)

### Types

- `GET /machines/types`
- `POST /machines/types`
- `PATCH /machines/types/{machineType}`

### Counters

- `GET /machines/{machine}/counters` — optional `from`, `to`
- `POST /machines/{machine}/counters` — upsert by `counterDate`

### Maintenance (machine-scoped)

- `GET /machines/{machine}/tickets` — `kind=breakdown|maintenance`, `status`, date range
- `POST /machines/{machine}/tickets`
- `PATCH /machines/{machine}/tickets/{ticket}`
- `GET /machines/{machine}/maintenance-actions`
- `POST /machines/{machine}/tickets/{ticket}/actions`
- `GET /machines/{machine}/preventive-logs`

Permissions: `machines.view`, `machines.manage`, `machines.update_status`, `machines.record_counters`, `machines.manage_maintenance`.

## Molds

### Registry

- `GET /products` — product picker for mold forms
- `GET /molds` — paginated list (`search`, `mold_type`, `status`, `isActive`, `sort`)
- `GET /molds/by-type/{type}` — list filtered by `injection|pet_blow|compression`
- `POST /molds` — create mold + type-specific `spec`
- `GET /molds/{mold}` — detail (spec, images, maintenance, installations)
- `PATCH|PUT /molds/{mold}` — update mold + spec
- `DELETE /molds/{mold}` — soft delete

### Images

- `POST /molds/{mold}/images` — multipart upload (`image`, `imageType`, `isPrimary`)
- `DELETE /mold-images/{moldImage}`
- `PATCH /mold-images/{moldImage}/primary`

### Maintenance

- `POST /molds/{mold}/maintenance` — log maintenance entry

Machine compatibility: injection ↔ injection machines, pet_blow ↔ blow machines, compression ↔ compression machines, polyethylene ↔ PE production / rotational / blow PE / extrusion lines.

- `GET /molds/stats` — aggregate counts by type, PE breakdown, maintenance, images

Permissions: `molds.view`, `molds.manage`, `molds.manage_maintenance`.

## Production

- `POST /production/assignments`
- `POST /production/entries`
- `POST /production/waste`
- `GET /production/reports/daily`

## Maintenance (legacy global)

- `POST /maintenance/tickets`
- `PATCH /maintenance/tickets/{ticket}`
- `POST /maintenance/tickets/{ticket}/actions`

## Inventory

- `GET /inventory/stock`
- `POST /inventory/transactions`

## Orders And Quality

- `POST /orders`
- `PATCH /orders/{order}/status`
- `POST /quality/inspections`

## Realtime Events

- `MachineStatusUpdated`
- `ProductionEntryCreated`
- `WasteEntryCreated`
- `MaintenanceTicketOpened`
- `InventoryStockChanged`
- `AlertRaised`
