# 28 Degrees West Tourism Website

A modern, responsive tourism website for 28 Degrees West, showcasing tours and experiences on Jamaica's south coast.

## Features
- Tour listings and booking system
- Admin dashboard for tour management
- Responsive design for all devices
- Secure payment integration with Stripe
- Contact and about pages

## Deployment Instructions
1. Create a new GitHub repository and copy the repository URL.
2. Push your code:
   ```bash
   git remote add origin <your-repository-url>
   git branch -M main
   git push -u origin main
   ```
3. Configure GitHub Pages in repository settings so the site is served from the `main` branch.
4. Connect the custom domain `28degreeswest.com` via your registrar (GoDaddy) using a CNAME record pointing to `your-username.github.io` and a TXT record for verification.

## Environment Variables
Create a `.env` file in the root directory with the following variables:
```
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
VITE_API_URL=your_api_endpoint
```

## Admin Login and Content Management
### Accessing Admin Panel
1. Go to `/admin-login` on your deployed site.
2. Use these credentials:
   - Username: `admin`
   - Password: `28degreeswest2025`

### Customizing Content
1. **Add New Tours**
   - Click "Create New Tour" in the admin dashboard.
   - Fill in tour details including title, description, duration, price, features and images.
   - Click "Create Tour" to save.
2. **Manage Existing Tours**
   - View all tours in the dashboard and edit details or update pricing.
3. **Configure Payment System**
   - Enter your Stripe API keys under Settings > Payment Configuration and adjust currencies or pricing tiers.

### Security Note
- Keep your admin credentials secure and change the default password after the first login.
- Never share your admin credentials and back up your content regularly.

## Development
Useful npm scripts are provided:
```bash
npm run start-dev       # install dependencies and start the dev server
npm run check-backend   # verify the local API is reachable
npm run deploy          # build and publish to GitHub Pages
```

## Technologies Used
- React with TypeScript
- Vite
- Material-UI
- React Router
- Stripe.js
- GitHub Actions
