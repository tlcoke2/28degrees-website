# 28 Degrees West - Backend API

This is the backend API for the 28 Degrees West tourism website, built with Node.js, Express, and MongoDB.

## Features

- User authentication and authorization (JWT)
- Tour management (CRUD operations)
- Booking system with Stripe integration
- Review system
- User profile management
- File uploads
- Email notifications

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or cloud)
- Stripe account (for payments)
- Email service (e.g., SendGrid, Mailtrap for development)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/28degrees-website.git
   cd 28degrees-website/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the variables with your configuration

4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root directory and add the following:

```
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/28degrees

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Email
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USERNAME=your_email_username
EMAIL_PASSWORD=your_email_password
EMAIL_FROM='28 Degrees West <noreply@28degreeswest.com>'

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Frontend
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/forgotPassword` - Forgot password
- `PATCH /api/v1/auth/resetPassword/:token` - Reset password
- `PATCH /api/v1/auth/updateMyPassword` - Update password (authenticated)

### Users
- `GET /api/v1/users` - Get all users (admin only)
- `GET /api/v1/users/me` - Get current user
- `PATCH /api/v1/users/updateMe` - Update current user
- `DELETE /api/v1/users/deleteMe` - Delete current user
- `POST /api/v1/users/uploadPhoto` - Upload user photo

### Tours
- `GET /api/v1/tours` - Get all tours
- `GET /api/v1/tours/top-5-cheap` - Get top 5 cheapest tours
- `GET /api/v1/tours/tour-stats` - Get tour statistics
- `GET /api/v1/tours/monthly-plan/:year` - Get monthly plan (admin/guides)
- `GET /api/v1/tours/tours-within/:distance/center/:latlng/unit/:unit` - Get tours within radius
- `GET /api/v1/tours/distances/:latlng/unit/:unit` - Get distances to tours from point
- `GET /api/v1/tours/:id` - Get single tour
- `POST /api/v1/tours` - Create new tour (admin/lead-guide)
- `PATCH /api/v1/tours/:id` - Update tour (admin/lead-guide)
- `DELETE /api/v1/tours/:id` - Delete tour (admin/lead-guide)

### Reviews
- `GET /api/v1/reviews` - Get all reviews
- `GET /api/v1/reviews/:id` - Get single review
- `POST /api/v1/reviews` - Create new review (authenticated users)
- `PATCH /api/v1/reviews/:id` - Update review (review owner/admin)
- `DELETE /api/v1/reviews/:id` - Delete review (review owner/admin)

### Bookings
- `GET /api/v1/bookings` - Get all bookings (admin)
- `GET /api/v1/bookings/my-bookings` - Get current user's bookings
- `GET /api/v1/bookings/:id` - Get single booking
- `POST /api/v1/bookings` - Create new booking (admin)
- `POST /api/v1/bookings/checkout-session/:tourId` - Create checkout session
- `PATCH /api/v1/bookings/:id` - Update booking (admin)
- `PATCH /api/v1/bookings/:id/cancel` - Cancel booking
- `DELETE /api/v1/bookings/:id` - Delete booking (admin)

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run lint` - Lint code with ESLint
- `npm run format` - Format code with Prettier

### Database

For development, you can use a local MongoDB instance or a cloud service like MongoDB Atlas.

## Deployment

### Prerequisites

- Node.js installed on the server
- PM2 (for process management)
- Nginx (as a reverse proxy)
- SSL certificate (for HTTPS)

### Steps

1. Clone the repository on your server
2. Install dependencies: `npm install --production`
3. Set up environment variables in `.env`
4. Build the frontend and copy files to `client/build`
5. Start the server with PM2: `pm2 start server.js --name "28degrees-backend"`
6. Set up Nginx as a reverse proxy
7. Set up SSL with Let's Encrypt

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
