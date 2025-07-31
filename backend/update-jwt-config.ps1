# PowerShell script to update JWT configuration in .env file
$envFile = ".\.env"
$jwtSecret = "28degrees_jwt_secret_key_should_be_long_and_secure_123!"
$jwtExpiresIn = "90d"

# Check if .env exists, if not create it
if (-not (Test-Path $envFile)) {
    New-Item -ItemType File -Path $envFile -Force | Out-Null
}

# Read current .env content
$envContent = if (Test-Path $envFile) { Get-Content $envFile -Raw } else { "" }

# Update or add JWT variables
$variables = @{
    "JWT_SECRET" = $jwtSecret
    "JWT_EXPIRES_IN" = $jwtExpiresIn
    "JWT_COOKIE_EXPIRES_IN" = "90"
}

foreach ($key in $variables.Keys) {
    if ($envContent -match "$key=") {
        $envContent = $envContent -replace "$key=.*", "$key=$($variables[$key])"
    } else {
        $envContent += "`n$key=$($variables[$key])"
    }
}

# Write back to .env file
$envContent.Trim() | Out-File -FilePath $envFile -Encoding utf8

Write-Host "✅ Updated .env file with JWT configuration" -ForegroundColor Green
