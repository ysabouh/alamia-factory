# تشغيل MyFactory من PowerShell — استخدم:
#   cd C:\xampp\htdocs\myfactory
#   .\Start-MyFactory.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
& "$PSScriptRoot\Start-MyFactory.cmd"
