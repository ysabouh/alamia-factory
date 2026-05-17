# MyFactory عبر XAMPP — يشغّل الواجهة ويفتح المتصفح
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$xamppPhpFromHtdocs = Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) "php"
if (Test-Path (Join-Path $xamppPhpFromHtdocs "php.exe")) { $env:Path = "$xamppPhpFromHtdocs;$env:Path" }
if (Test-Path "C:\xampp\php\php.exe") { $env:Path = "C:\xampp\php;$env:Path" }

$appUrl = "http://localhost/myfactory/ar/login"
Write-Host ""
Write-Host "  MyFactory عبر XAMPP" -ForegroundColor Green
Write-Host "  1) شغّل Apache + MySQL من XAMPP" -ForegroundColor DarkGray
Write-Host "  2) أول مرة: xampp\setup-httpd-myfactory.bat" -ForegroundColor DarkGray
Write-Host "  الرابط: $appUrl" -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path "frontend/node_modules")) {
  Push-Location frontend
  try { npm install } finally { Pop-Location }
}

try {
  Invoke-WebRequest -Uri "http://127.0.0.1/myfactory/up" -UseBasicParsing -TimeoutSec 3 | Out-Null
} catch {
  Write-Host "  [تحذير] API عبر Apache غير متاح — تحقق من XAMPP و setup-httpd" -ForegroundColor Yellow
}

$portOpen = $false
try {
  $t = New-Object Net.Sockets.TcpClient
  $t.Connect("127.0.0.1", 3010)
  if ($t.Connected) { $t.Close(); $portOpen = $true }
} catch { }

if (-not $portOpen) {
  Start-Process -WindowStyle Minimized -FilePath "cmd.exe" -ArgumentList "/c", "cd /d `"$PSScriptRoot\frontend`" && npm run dev"
  Write-Host "  انتظر المنفذ 3010..." -ForegroundColor Cyan
  $deadline = (Get-Date).AddMinutes(2)
  while ((Get-Date) -lt $deadline) {
    try {
      $t = New-Object Net.Sockets.TcpClient
      $t.Connect("127.0.0.1", 3010)
      if ($t.Connected) { $t.Close(); $portOpen = $true; break }
    } catch { }
    Start-Sleep -Milliseconds 500
  }
  if (-not $portOpen) { throw "الواجهة لم تبدأ على 3010" }
}

Start-Process $appUrl
Write-Host "  تم فتح المتصفح." -ForegroundColor Green
