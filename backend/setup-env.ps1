# PowerShell script to create .env file
$envContent = @"
# Server Configuration
NODE_ENV=development
PORT=5000

# JWT Configuration
JWT_SECRET=28degrees_jwt_secret_key_should_be_long_and_secure_123!
JWT_EXPIRE=90d
JWT_COOKIE_EXPIRE=90

# Database
MONGODB_URI=mongodb+srv://28degrees:28degrees@cluster0.mongodb.net/28degrees?retryWrites=true&w=majority

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend
FRONTEND_URL=http://localhost:3000
"@

# Write to .env file
$envContent | Out-File -FilePath ".\.env" -Encoding utf8
Write-Host "✅ .env file created successfully" -ForegroundColor Green
