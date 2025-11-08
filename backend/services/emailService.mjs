import nodemailer from 'nodemailer';
import AdminSettings from '../models/AdminSettings.mjs';

/**
 * Email Service
 *
 * @module services/emailService
 * @description Email notification service using Nodemailer
 *
 * Features:
 * - Support for multiple SMTP providers (Gmail, Mailtrap, etc.)
 * - Template-based emails
 * - Configurable from admin settings
 */

/**
 * Create email transporter based on environment variables
 */
const createTransporter = () => {
  const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';

  if (emailProvider === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
      },
    });
  }

  if (emailProvider === 'mailtrap') {
    return nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.MAILTRAP_PORT || '2525', 10),
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });
  }

  // Generic SMTP
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * Get email configuration from admin settings
 */
const getEmailConfig = async () => {
  try {
    const settings = await AdminSettings.findOne();
    return (
      settings?.emailConfig || {
        fromEmail: 'noreply@gnbtransfer.com',
        fromName: 'GNB Transfer',
      }
    );
  } catch (error) {
    console.error('Failed to get email config:', error);
    return {
      fromEmail: 'noreply@gnbtransfer.com',
      fromName: 'GNB Transfer',
    };
  }
};

/**
 * Send email with retry logic
 *
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} options.text - Plain text body (optional)
 * @returns {Promise<Object>} - Email send result
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Check if email service is configured
    if (!process.env.EMAIL_USER && !process.env.SMTP_USER && !process.env.MAILTRAP_USER) {
      console.warn('Email service not configured. Skipping email send.');
      return { success: false, error: 'Email service not configured' };
    }

    const config = await getEmailConfig();
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      html,
      // Only include text if explicitly provided
      // Auto-generated plain text can have security issues
      ...(text && { text }),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking confirmation email
 */
export const sendBookingConfirmation = async (booking, user) => {
  const html = `
    <h2>Booking Confirmation</h2>
    <p>Dear ${user.name},</p>
    <p>Your booking has been confirmed!</p>
    <h3>Booking Details:</h3>
    <ul>
      <li><strong>Booking ID:</strong> ${booking._id}</li>
      <li><strong>Tour:</strong> ${booking.tour?.name || 'N/A'}</li>
      <li><strong>Date:</strong> ${booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'N/A'}</li>
      <li><strong>Status:</strong> ${booking.status}</li>
    </ul>
    <p>Thank you for choosing GNB Transfer!</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Booking Confirmation - GNB Transfer',
    html,
  });
};

/**
 * Send payment confirmation email
 */
export const sendPaymentConfirmation = async (booking, user, amount) => {
  const html = `
    <h2>Payment Received</h2>
    <p>Dear ${user.name},</p>
    <p>We have received your payment.</p>
    <h3>Payment Details:</h3>
    <ul>
      <li><strong>Booking ID:</strong> ${booking._id}</li>
      <li><strong>Amount:</strong> $${amount}</li>
      <li><strong>Status:</strong> Paid</li>
    </ul>
    <p>Thank you for your payment!</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Payment Confirmation - GNB Transfer',
    html,
  });
};

/**
 * Send campaign notification email
 */
export const sendCampaignNotification = async (user, campaign) => {
  const html = `
    <h2>Special Offer!</h2>
    <p>Dear ${user.name},</p>
    <p>We have a special campaign for you!</p>
    <h3>Campaign Details:</h3>
    <ul>
      <li><strong>Name:</strong> ${campaign.name}</li>
      <li><strong>Discount:</strong> ${campaign.discountRate}%</li>
      <li><strong>Valid Until:</strong> ${new Date(campaign.endDate).toLocaleDateString()}</li>
    </ul>
    <p>Don't miss this opportunity!</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Special Offer - GNB Transfer',
    html,
  });
};

/**
 * Check notification settings before sending
 */
export const shouldSendNotification = async (notificationType) => {
  try {
    const settings = await AdminSettings.findOne();
    return settings?.notificationSettings?.[notificationType] !== false;
  } catch (error) {
    console.error('Failed to check notification settings:', error);
    return true; // Default to sending
  }
};

export default {
  sendEmail,
  sendBookingConfirmation,
  sendPaymentConfirmation,
  sendCampaignNotification,
  shouldSendNotification,
};
