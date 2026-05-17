<?php

/**
 * حساب المدير المحلي — ثابت بعد كل seed أو factory:ensure-superadmin.
 * للتجاوز محلياً: FACTORY_SUPERADMIN_EMAIL و FACTORY_SUPERADMIN_PASSWORD في .env
 */
return [

    'superadmin' => [
        'email' => env('FACTORY_SUPERADMIN_EMAIL', 'admin@myfactory.local'),
        'password' => env('FACTORY_SUPERADMIN_PASSWORD', 'Admin@2026'),
        'name' => env('FACTORY_SUPERADMIN_NAME', 'System Administrator'),
        'role' => 'admin',
    ],

];
