# Roles And Permissions

## Roles

- `admin`
- `plant_manager`
- `production_manager`
- `supervisor`
- `technician`
- `warehouse_staff`
- `accountant`

## Permission Strategy

Roles provide default access, while permissions enforce exact actions in controllers and policies. The frontend may hide unavailable actions, but the backend remains the source of truth.

## Permission Matrix

| Permission | Admin | Plant Manager | Production Manager | Supervisor | Technician | Warehouse | Accountant |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `machines.view` | yes | yes | yes | yes | yes | yes | no |
| `machines.update_status` | yes | yes | yes | yes | yes | no | no |
| `production.record` | yes | yes | yes | yes | no | no | no |
| `production.approve` | yes | yes | yes | no | no | no | no |
| `production.reports` | yes | yes | yes | yes | no | no | yes |
| `maintenance.open_ticket` | yes | yes | yes | yes | yes | no | no |
| `maintenance.close_ticket` | yes | yes | no | no | yes | no | no |
| `inventory.view` | yes | yes | yes | yes | no | yes | yes |
| `inventory.adjust` | yes | yes | no | no | no | yes | no |
| `inventory.issue_material` | yes | yes | yes | no | no | yes | no |
| `orders.create` | yes | yes | no | no | no | no | yes |
| `orders.update_status` | yes | yes | yes | no | no | no | yes |
| `analytics.view` | yes | yes | yes | no | no | no | yes |
| `users.manage` | yes | no | no | no | no | no | no |
