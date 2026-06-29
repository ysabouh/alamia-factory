<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$email = config('factory.superadmin.email');
$password = config('factory.superadmin.password');
$user = App\Domain\Factory\Models\User::where('email', $email)->first();

if (! $user) {
    echo "NO_USER\n";
    exit(1);
}

// Create token for API test
$token = $user->createToken('designer-test')->plainTextToken;
echo "token=" . substr($token, 0, 20) . "...\n";

$ch = curl_init('http://127.0.0.1:8000/api/v1/workflow/templates/2');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'Authorization: Bearer ' . $token,
    ],
]);
$body = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "GET template HTTP={$code}\n";
if ($code === 200) {
    $data = json_decode($body, true);
    echo 'name=' . ($data['name'] ?? '?') . "\n";
    $draft = collect($data['versions'] ?? [])->firstWhere('status', 'draft');
    echo 'draft_id=' . ($draft['id'] ?? 'none') . ' nodes=' . count($draft['definitionJson']['nodes'] ?? []) . "\n";
} else {
    echo substr($body, 0, 300) . "\n";
}

$ch2 = curl_init('http://127.0.0.1:8000/api/v1/workflow/versions/11');
curl_setopt_array($ch2, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'Authorization: Bearer ' . $token,
    ],
]);
$body2 = curl_exec($ch2);
$code2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);

echo "GET version HTTP={$code2}\n";
if ($code2 === 200) {
    $v = json_decode($body2, true);
    echo 'version nodes=' . count($v['definitionJson']['nodes'] ?? []) . "\n";
} else {
    echo substr($body2, 0, 300) . "\n";
}

// Test via Next proxy
$ch3 = curl_init('http://127.0.0.1:3010/myfactory/api/v1/workflow/versions/11');
curl_setopt_array($ch3, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'Authorization: Bearer ' . $token,
    ],
]);
$body3 = curl_exec($ch3);
$code3 = curl_getinfo($ch3, CURLINFO_HTTP_CODE);
curl_close($ch3);

echo "GET via Next proxy HTTP={$code3}\n";
if ($code3 === 200) {
    $v3 = json_decode($body3, true);
    echo 'proxy nodes=' . count($v3['definitionJson']['nodes'] ?? []) . "\n";
} else {
    echo substr($body3, 0, 300) . "\n";
}

$user->tokens()->where('name', 'designer-test')->delete();
