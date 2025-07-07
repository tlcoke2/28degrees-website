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

## Development

To run the development server:

```bash
npm install
npm run dev
```

## Production Build

To create a production build:

```bash
npm run build
```

## Technologies Used

- React with TypeScript
- Vite
- Material-UI
- React Router
- Stripe.js
- GitHub Actions
>>>>>>> dd797184 (Update website)
