# Product Assembly & Multi-Level BOM

## Schema

| Table | Purpose |
|-------|---------|
| `products.assembly_type` | single / component / subassembly / assembly |
| `products.standard_cost` | Unit cost for rollup |
| `product_bom` | Parent → child lines with component_type, waste, sequence |
| `assembly_work_orders` | Planned assembly production |
| `assembly_operations` | Actual assembly runs |
| `assembly_components_consumption` | Component usage per operation |

## BOM rules

- Recursive tree via nested `product_bom` rows
- Circular reference blocked in `ProductBomService::assertValidLink`
- Self-reference blocked
- Product delete blocked if used as BOM child
- BOM explosion merges nested subassemblies into leaf components

## APIs

```
GET  /products/:id/bom
GET  /products/:id/bom-tree
GET  /products/:id/bom-explode?quantity=1
POST /products/:id/bom
PATCH /product-bom/:id
DELETE /product-bom/:id

GET  /assembly/dashboard
GET  /assembly/work-orders
POST /assembly/work-orders
GET  /assembly/work-orders/:id/availability
POST /assembly/operations
```

Permissions: `assembly.view`, `assembly.manage`

## Frontend

- `/ar/products/[id]/bom` — BOM tree editor + cost preview
- `/ar/assembly/dashboard` — KPIs
- `/ar/assembly/work-orders` — create orders, record production

## Inventory

On assembly operation complete:
- Deduct leaf components (`assembly_issue`)
- Receive finished product (`assembly_receipt`)

## Example

```
JAR-ASM (assembly)
 ├── JAR-BODY (component) × 1
 └── JAR-LID (component) × 1
```

Run: `php artisan migrate` and `php artisan factory:ensure-superadmin`
