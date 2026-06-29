<?php

return [
    'max_attachment_bytes' => (int) env('DIRECT_TASK_MAX_ATTACHMENT_BYTES', 10 * 1024 * 1024),
    'allowed_mime_types' => [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'video/mp4',
        'video/webm',
    ],
    'storage_disk' => env('DIRECT_TASK_STORAGE_DISK', 'public'),
    'storage_path' => 'direct-tasks',
];
