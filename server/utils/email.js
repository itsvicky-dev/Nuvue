import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  if (process.env.SENDGRID_API_KEY) {
    // Use SendGrid
    return nodemailer.createTransporter({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else {
    // Use Gmail or other SMTP (for development)
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
};

// Send email function
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@instagram-clone.com',
      to,
      subject,
      html,
      text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Email templates
export const emailTemplates = {
  welcome: (username) => ({
    subject: 'Welcome to Instagram Clone!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Instagram Clone, ${username}!</h2>
        <p>Thank you for joining our community. You're all set to start sharing your moments!</p>
        <p>Get started by:</p>
        <ul>
          <li>Uploading your first post</li>
          <li>Following friends and interesting accounts</li>
          <li>Sharing your stories</li>
        </ul>
        <p>Happy sharing!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This email was sent from Instagram Clone. If you didn't create an account, please ignore this email.
        </p>
      </div>
    `
  }),

  passwordReset: (resetUrl) => ({
    subject: 'Reset Your Password - Instagram Clone',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #0095f6; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 10 minutes for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Instagram Clone Security Team
        </p>
      </div>
    `
  }),

  emailVerification: (verificationUrl) => ({
    subject: 'Verify Your Email - Instagram Clone',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email Address</h2>
        <p>Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #0095f6; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Instagram Clone Team
        </p>
      </div>
    `
  })
};