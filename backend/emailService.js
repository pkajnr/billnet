// Email Service using Nodemailer
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Create test account if no real credentials
    this.transporter = null;
    this.initTransporter();
  }

  async initTransporter() {
    // For development: use ethereal email (fake SMTP)
    // For production: use real SMTP (Gmail, SendGrid, etc.)
    try {
      if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
        // Real SMTP configuration
        this.transporter = nodemailer.createTransporter({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT || 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        console.log('📧 Using configured SMTP server');
      } else {
        // Test account for development
        try {
          const testAccount = await nodemailer.createTestAccount();
          this.transporter = nodemailer.createTransporter({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
          });
          console.log('📧 Using Ethereal test email account');
        } catch (testError) {
          // Fallback to mock transporter if Ethereal is unavailable
          console.warn('⚠️  Could not connect to Ethereal email service. Using mock email mode.');
          console.warn('⚠️  Emails will be logged to console instead of being sent.');
          this.transporter = null; // Will use mock mode in sendEmail
        }
      }
    } catch (error) {
      console.error('Email service initialization error:', error);
      this.transporter = null; // Will use mock mode
    }
  }

  async sendEmail({ to, subject, html, text }) {
    // Try to initialize if not already done
    if (this.transporter === undefined || this.transporter === null) {
      await this.initTransporter();
    }

    // Mock mode - just log emails instead of sending
    if (!this.transporter) {
      console.log('\n📧 ========== MOCK EMAIL ==========');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text}`);
      console.log('================================\n');
      return { messageId: 'mock-' + Date.now() };
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"BillNet Capital" <noreply@billnet.com>',
        to,
        subject,
        text,
        html
      });

      console.log('📧 Email sent:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      return info;
    } catch (error) {
      console.error('Email sending error:', error);
      // In development, log the email instead of failing
      console.log('\n📧 ========== EMAIL (Failed to send, logging instead) ==========');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text}`);
      console.log('================================================================\n');
      // Return mock success so the app continues working
      return { messageId: 'mock-' + Date.now() };
    }
  }

  async sendBidNotification(entrepreneurEmail, entrepreneurName, bidAmount, ideaTitle) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Bid on Your Idea! 🎉</h2>
        <p>Hi ${entrepreneurName},</p>
        <p>Great news! An investor has placed a bid on your idea:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${ideaTitle}</h3>
          <p style="font-size: 24px; font-weight: bold; color: #2563eb; margin: 10px 0;">
            $${bidAmount.toFixed(2)}
          </p>
        </div>
        <p>Log in to BillNet Capital to review and respond to this bid.</p>
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/my-ideas" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 10px;">
          View My Ideas
        </a>
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
          Best regards,<br/>
          The BillNet Capital Team
        </p>
      </div>
    `;

    return this.sendEmail({
      to: entrepreneurEmail,
      subject: `New Bid: $${bidAmount.toFixed(2)} on "${ideaTitle}"`,
      html,
      text: `Hi ${entrepreneurName}, an investor has placed a $${bidAmount.toFixed(2)} bid on your idea: ${ideaTitle}. Log in to review!`
    });
  }

  async sendCommentNotification(ownerEmail, ownerName, commenterName, ideaTitle) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Comment on Your Idea 💬</h2>
        <p>Hi ${ownerName},</p>
        <p><strong>${commenterName}</strong> commented on your idea:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0;">${ideaTitle}</h3>
        </div>
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/explore" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
          View Comment
        </a>
      </div>
    `;

    return this.sendEmail({
      to: ownerEmail,
      subject: `${commenterName} commented on "${ideaTitle}"`,
      html,
      text: `Hi ${ownerName}, ${commenterName} commented on your idea: ${ideaTitle}`
    });
  }

  async sendFollowNotification(followedEmail, followedName, followerName) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Follower! 👥</h2>
        <p>Hi ${followedName},</p>
        <p><strong>${followerName}</strong> started following you on BillNet Capital!</p>
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/profile" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px;">
          View Profile
        </a>
      </div>
    `;

    return this.sendEmail({
      to: followedEmail,
      subject: `${followerName} is now following you`,
      html,
      text: `Hi ${followedName}, ${followerName} started following you on BillNet Capital!`
    });
  }

  async sendWelcomeEmail(userEmail, userName) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to BillNet Capital! 🎉</h1>
        <p>Hi ${userName},</p>
        <p>Thank you for joining BillNet Capital, the premier platform connecting entrepreneurs with investors.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Get Started:</h3>
          <ul style="line-height: 1.8;">
            <li>Complete your profile</li>
            <li>Explore innovative ideas</li>
            <li>Connect with like-minded professionals</li>
            <li>Start investing or pitch your idea</li>
          </ul>
        </div>
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/explore" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Start Exploring
        </a>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to BillNet Capital!',
      html,
      text: `Hi ${userName}, welcome to BillNet Capital! Start exploring innovative ideas and investment opportunities.`
    });
  }

  async sendPasswordResetEmail(userEmail, userName, resetToken) {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request 🔐</h2>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password for your BillNet Capital account.</p>
        <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
        <a href="${resetUrl}" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0;">
          Reset Password
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          For security reasons, this link will expire in 1 hour.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          ${resetUrl}
        </p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Password Reset Request - BillNet Capital',
      html,
      text: `Hi ${userName}, click this link to reset your password: ${resetUrl}. This link expires in 1 hour.`
    });
  }
}

module.exports = new EmailService();
