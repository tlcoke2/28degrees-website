import nodemailer from 'nodemailer';
import pug from 'pug';
import { htmlToText } from 'html-to-text';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  // For development with Mailtrap or similar
  ...(process.env.NODE_ENV === 'development' && {
    secure: false,
    tls: {
      rejectUnauthorized: false,
    },
  }),
});

// Email template options
const emailTemplates = {
  welcome: {
    subject: 'Welcome to 28 Degrees West!',
    template: 'welcome.pug',
  },
  passwordReset: {
    subject: 'Your password reset token (valid for 10 minutes)',
    template: 'passwordReset.pug',
  },
  bookingConfirmation: {
    subject: 'Your Tour Booking Confirmation',
    template: 'bookingConfirmation.pug',
  },
};

// Function to send email
const sendEmail = async (options) => {
  try {
    // 1) Render HTML based on a pug template
    const templatePath = path.join(
      __dirname,
      '..',
      'views',
      'emails',
      options.template || 'base.pug'
    );

    const html = pug.renderFile(templatePath, {
      firstName: options.firstName,
      url: options.url,
      subject: options.subject,
      ...options.templateVars,
    });

    // 2) Define email options
    const mailOptions = {
      from: `"28 Degrees West" <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      html,
      text: htmlToText(html),
    };

    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('There was an error sending the email. Try again later!');
  }
};

export const sendWelcomeEmail = async (user) => {
  const url = `${process.env.FRONTEND_URL}/my-account`;
  
  await sendEmail({
    email: user.email,
    subject: emailTemplates.welcome.subject,
    template: emailTemplates.welcome.template,
    firstName: user.name.split(' ')[0],
    url,
  });
};

export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  await sendEmail({
    email: user.email,
    subject: emailTemplates.passwordReset.subject,
    template: emailTemplates.passwordReset.template,
    firstName: user.name.split(' ')[0],
    url: resetURL,
  });
};

export const sendBookingConfirmationEmail = async (user, booking) => {
  const bookingURL = `${process.env.FRONTEND_URL}/my-bookings/${booking._id}`;
  
  await sendEmail({
    email: user.email,
    subject: emailTemplates.bookingConfirmation.subject,
    template: emailTemplates.bookingConfirmation.template,
    firstName: user.name.split(' ')[0],
    url: bookingURL,
    templateVars: {
      tourName: booking.tour.name,
      bookingDate: new Date(booking.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      participants: booking.participants,
      price: booking.price,
    },
  });
};

export default sendEmail;
