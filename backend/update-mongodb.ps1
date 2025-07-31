# PowerShell script to update MongoDB connection string in .env file
$envFile = ".\.env"
$mongodbUri = "mongodb://mongo:VmAaZFvcjCmkndurOTQrlZQtVIVtekIL@centerbeam.proxy.rlwy.net:30897/28degrees?authSource=admin"

# Check if .env exists, if not create it
if (-not (Test-Path $envFile)) {
    New-Item -ItemType File -Path $envFile -Force | Out-Null
}

# Read current .env content
$envContent = if (Test-Path $envFile) { Get-Content $envFile -Raw } else { "" }

# Update or add MongoDB URI
if ($envContent -match "MONGODB_URI=") {
    $envContent = $envContent -replace "MONGODB_URI=.*", "MONGODB_URI=$mongodbUri"
} else {
    $envContent += "`nMONGODB_URI=$mongodbUri"
}

# Write back to .env file
$envContent.Trim() | Out-File -FilePath $envFile -Encoding utf8

Write-Host "Updated .env file with MongoDB connection string" -ForegroundColor Green
Write-Host ("Connection string: {0}" -f $mongodbUri) -ForegroundColor Cyan
