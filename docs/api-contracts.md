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

## Machines

- `GET /machines`
- `POST /machines`
- `PATCH /machines/{machine}/status`
- `GET /machines/{machine}/timeline`

## Production

- `POST /production/assignments`
- `POST /production/entries`
- `POST /production/waste`
- `GET /production/reports/daily`

## Maintenance

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
