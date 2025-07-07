<<<<<<< HEAD
# 28degrees-website
=======
# 28 Degrees West Tourism Website

A modern, responsive tourism website for 28 Degrees West, showcasing tours and experiences in Jamaica's south coast.

## Features

- Tour listings and booking system
- Admin dashboard for tour management
- Responsive design for all devices
- Secure payment integration with Stripe
- Contact and about pages

## Deployment Instructions

1. Create a new GitHub repository:
   - Go to [GitHub](https://github.com/new)
   - Create a new repository named `28degrees-website`
   - Initialize with README
   - Copy the repository URL

2. Push your code to GitHub:
   ```bash
   git remote add origin <your-repository-url>
   git branch -M main
   git push -u origin main
   ```

3. Configure GitHub Pages:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Under "Source", select "main" branch and "/ (root)" folder
   - Save changes
   - Your site will be available at `https://your-username.github.io/28degrees-website/`

4. Connect Custom Domain (28degreeswest.com):
   - Go to your domain registrar (GoDaddy)
   - Add a CNAME record pointing to `your-username.github.io`
   - Add a TXT record for GitHub verification
   - Wait for DNS propagation (may take up to 48 hours)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
VITE_API_URL=your_api_endpoint
```

## Admin Login and Content Management

### Accessing Admin Panel

1. Go to your website's admin login page (usually at `/admin-login`)
2. Use these credentials to log in:
   - Username: `admin`
   - Password: `28degreeswest2025`

### Customizing Content

Once logged in, you can:

1. Add New Tours:
   - Click "Create New Tour" in the admin dashboard
   - Fill in tour details including:
     - Title
     - Description
     - Duration
     - Price
     - Features
     - Images
   - Click "Create Tour" to save

2. Manage Existing Tours:
   - View all tours in the dashboard
   - Edit tour details
   - Add/remove features
   - Update pricing
   - Upload new images

3. Configure Payment System:
   - Go to Settings > Payment Configuration
   - Enter your Stripe API keys
   - Set up payment currencies
   - Configure price tiers

### Security Note
- Keep your admin credentials secure
- Change the default password immediately after first login
- Never share your admin credentials
- Regularly backup your content

## Development

To run the development server:

```bash
npm install
npm run dev
```

## Technologies Used

- React with TypeScript
- Vite
- Material-UI
- React Router
- Stripe.js
- GitHub Actions
>>>>>>> dd797184 (Update website)
