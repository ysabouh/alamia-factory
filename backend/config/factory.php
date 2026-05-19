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

  /** أوقات افتراضية للحضور اليومي — قابلة للتوسعة لاحقاً من شاشة الإعدادات */
    'attendance' => [
        'default_check_in' => env('FACTORY_ATTENDANCE_CHECK_IN', '08:00'),
        'default_check_out' => env('FACTORY_ATTENDANCE_CHECK_OUT', '19:00'),
        'default_overtime_from' => env('FACTORY_ATTENDANCE_OVERTIME_FROM', '19:00'),
        'default_overtime_to' => env('FACTORY_ATTENDANCE_OVERTIME_TO', '24:00'),
        /** دقائق دوام يوم كامل (إجازة مدفوعة). إن تُركت فارغة تُحسب من default_check_in → default_check_out */
        'default_daily_work_minutes' => env('FACTORY_ATTENDANCE_DAILY_WORK_MINUTES'),
    ],

    /**
     * احتساب ثمن الساعة في معاينة الرواتب:
     * الراتب الشهري ÷ work_days_per_week ÷ ساعات_اليوم
     * ساعات_اليوم = FACTORY_ATTENDANCE_CHECK_OUT − FACTORY_ATTENDANCE_CHECK_IN
     * (أو FACTORY_ATTENDANCE_DAILY_WORK_MINUTES إن وُجد)
     */
    'payroll' => [
        'work_days_per_week' => (int) env('FACTORY_PAYROLL_WORK_DAYS_PER_WEEK', 6),
    ],

    /** معاملات احتساب ساعات الإضافي في طلبات العمل الإضافي */
    /** العملة المرجعية — جميع المعادلات نسبةً إلى 1 USD */
    'currency' => [
        'base_code' => env('FACTORY_BASE_CURRENCY_CODE', 'USD'),
    ],

    'overtime' => [
        /** أيام الأسبوع العادية: ضعف ونصف */
        'weekday_multiplier' => (float) env('FACTORY_OVERTIME_WEEKDAY_MULTIPLIER', 1.5),
        /** يوم الجمعة: ضعف */
        'friday_multiplier' => (float) env('FACTORY_OVERTIME_FRIDAY_MULTIPLIER', 2.0),
    ],

];
