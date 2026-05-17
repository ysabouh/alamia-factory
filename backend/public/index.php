<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

/** تشغيل تحت XAMPP من /myfactory — إزالة بادئة المجلد من REQUEST_URI */
$subdirectoryBase = '/myfactory';
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$query = '';
if (($qPos = strpos($requestUri, '?')) !== false) {
    $query = substr($requestUri, $qPos);
    $requestUri = substr($requestUri, 0, $qPos);
}
if (str_starts_with($requestUri, $subdirectoryBase)) {
    $requestUri = substr($requestUri, strlen($subdirectoryBase)) ?: '/';
    $_SERVER['REQUEST_URI'] = $requestUri.$query;
}

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
