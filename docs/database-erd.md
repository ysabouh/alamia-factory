# Database Architecture

## Identity

- `users`
- `roles`
- `permissions`
- `role_user`
- `permission_role`
- `employees`

## Machine And Production Core

- `machine_types`
- `machines`
- `molds`
- `products`
- `shifts`
- `work_orders`
- `machine_assignments`
- `production_entries`
- `waste_entries`
- `mold_machine_settings`

## Maintenance

- `maintenance_tickets`
- `maintenance_actions`
- `preventive_maintenance_plans`
- `preventive_maintenance_logs`

## Inventory

- `materials`
- `warehouses`
- `storage_locations`
- `material_lots`
- `stock_levels`
- `inventory_transactions`
- `work_order_material_consumption`

## Quality And Orders

- `customers`
- `customer_orders`
- `customer_order_items`
- `order_status_history`
- `quality_inspections`
- `quality_defects`

## Operations

- `alerts`
- `activity_logs`
- `attachments`

## Important Rules

- Stock is calculated and reconciled through `inventory_transactions`; `stock_levels` is an optimized current balance.
- Production and waste are separate records because waste affects cost, quality, and efficiency.
- Machine settings are historical by machine, mold, and effective date.
- Maintenance tickets are the source of planned and unplanned downtime.
- All operational tables include timestamps and should be audited for sensitive updates.
