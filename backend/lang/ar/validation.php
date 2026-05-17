<?php

return [
    'accepted' => 'يجب قبول حقل :attribute.',
    'active_url' => 'حقل :attribute ليس عنوان URL صالحاً.',
    'array' => 'يجب أن يكون حقل :attribute مصفوفة.',
    'boolean' => 'يجب أن يكون حقل :attribute صحيحاً أو خاطئاً.',
    'confirmed' => 'تأكيد حقل :attribute غير متطابق.',
    'date' => 'حقل :attribute ليس تاريخاً صالحاً.',
    'email' => 'يجب أن يكون حقل :attribute بريداً إلكترونياً صالحاً.',
    'exists' => 'القيمة المحددة في حقل :attribute غير صالحة.',
    'integer' => 'يجب أن يكون حقل :attribute رقماً صحيحاً.',
    'max' => [
        'array' => 'يجب ألا يحتوي حقل :attribute على أكثر من :max عنصر.',
        'numeric' => 'يجب ألا يكون حقل :attribute أكبر من :max.',
        'string' => 'يجب ألا يتجاوز حقل :attribute :max حرفاً.',
    ],
    'min' => [
        'array' => 'يجب أن يحتوي حقل :attribute على :min عنصر على الأقل.',
        'numeric' => 'يجب أن يكون حقل :attribute على الأقل :min.',
        'string' => 'يجب ألا يقل حقل :attribute عن :min حرفاً.',
    ],
    'nullable' => 'حقل :attribute اختياري.',
    'required' => 'حقل :attribute مطلوب.',
    'string' => 'يجب أن يكون حقل :attribute نصاً.',
    'unique' => 'قيمة حقل :attribute مستخدمة مسبقاً.',

    'attributes' => [
        'email' => 'البريد الإلكتروني',
        'password' => 'كلمة المرور',
        'name' => 'الاسم',
        'device_name' => 'اسم الجهاز',
        'employeeId' => 'الموظف',
        'employee_id' => 'الموظف',
        'roles' => 'الأدوار',
        'roles.*' => 'الدور',
        'isActive' => 'حالة التفعيل',
        'is_active' => 'حالة التفعيل',
    ],
];
