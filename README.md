# MyFactory ERP

Industrial ERP scaffold for a plastic factory using a modular monolith architecture.

## Stack

- Frontend: Next.js, TypeScript, TailwindCSS, shadcn/ui-style primitives, Recharts.
- Backend: Laravel API, Sanctum, Reverb-compatible broadcasting, MySQL.
- Architecture: Clean Architecture-inspired modules with Domain, Application, Infrastructure, and Interfaces layers.

## First Milestone

- Arabic RTL dark industrial dashboard.
- Machine management and live status.
- Mold-to-machine assignments.
- Supervisor production and waste entry.
- Maintenance ticket opening.
- Daily production report endpoint.
- WebSocket events for live dashboard refresh.

## Local Setup

Backend:

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

The current machine does not expose `npm` in the shell PATH, so frontend dependency installation may require fixing Node/npm installation first.
