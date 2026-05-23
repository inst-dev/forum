import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const APP_NAME = process.env.APP_NAME || 'NullForum';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@nullforum.com';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
}

function baseTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: #fff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #1a73e8; margin: 0; font-size: 24px; }
        .btn { display: inline-block; background: #1a73e8; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 13px; }
        p { color: #333; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header"><h1>${APP_NAME}</h1></div>
          ${content}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          <p>If you did not request this email, please ignore it.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendVerificationEmail(to: string, username: string, token: string): Promise<boolean> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
  const html = baseTemplate(`
    <p>Hello <strong>${username}</strong>,</p>
    <p>Thank you for registering on ${APP_NAME}. Please verify your email address by clicking the button below:</p>
    <p style="text-align:center"><a href="${verifyUrl}" class="btn">Verify Email</a></p>
    <p>Or copy this link: <a href="${verifyUrl}">${verifyUrl}</a></p>
    <p>This link expires in 24 hours.</p>
  `);
  return sendEmail({ to, subject: `Verify your email - ${APP_NAME}`, html });
}

export async function sendPasswordResetEmail(to: string, username: string, token: string): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const html = baseTemplate(`
    <p>Hello <strong>${username}</strong>,</p>
    <p>We received a request to reset your password. Click the button below to set a new password:</p>
    <p style="text-align:center"><a href="${resetUrl}" class="btn">Reset Password</a></p>
    <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
    <p>This link expires in 1 hour. If you did not request this, no action is needed.</p>
  `);
  return sendEmail({ to, subject: `Password Reset - ${APP_NAME}`, html });
}

export async function sendLoginAlertEmail(to: string, username: string, ip: string, device: string): Promise<boolean> {
  const html = baseTemplate(`
    <p>Hello <strong>${username}</strong>,</p>
    <p>A new login was detected on your account:</p>
    <ul>
      <li><strong>IP:</strong> ${ip}</li>
      <li><strong>Device:</strong> ${device}</li>
      <li><strong>Time:</strong> ${new Date().toISOString()}</li>
    </ul>
    <p>If this was not you, please secure your account immediately.</p>
  `);
  return sendEmail({ to, subject: `New Login Alert - ${APP_NAME}`, html });
}

export async function sendMentionEmail(to: string, username: string, mentionedBy: string, threadTitle: string, threadUrl: string): Promise<boolean> {
  const html = baseTemplate(`
    <p>Hello <strong>${username}</strong>,</p>
    <p><strong>@${mentionedBy}</strong> mentioned you in: <a href="${APP_URL}${threadUrl}">${threadTitle}</a></p>
    <p style="text-align:center"><a href="${APP_URL}${threadUrl}" class="btn">View Thread</a></p>
  `);
  return sendEmail({ to, subject: `${mentionedBy} mentioned you - ${APP_NAME}`, html });
}

export async function sendReplyNotificationEmail(to: string, username: string, repliedBy: string, threadTitle: string, threadUrl: string): Promise<boolean> {
  const html = baseTemplate(`
    <p>Hello <strong>${username}</strong>,</p>
    <p><strong>${repliedBy}</strong> replied to a thread you are watching: <a href="${APP_URL}${threadUrl}">${threadTitle}</a></p>
    <p style="text-align:center"><a href="${APP_URL}${threadUrl}" class="btn">View Reply</a></p>
  `);
  return sendEmail({ to, subject: `New reply in "${threadTitle}" - ${APP_NAME}`, html });
}

export async function sendWarningEmail(to: string, username: string, reason: string): Promise<boolean> {
  const html = baseTemplate(`
    <p>Hello <strong>${username}</strong>,</p>
    <p>You have received a warning from the moderation team.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Please review our community guidelines to avoid further actions on your account.</p>
  `);
  return sendEmail({ to, subject: `Account Warning - ${APP_NAME}`, html });
}

export async function sendWelcomeEmail(to: string, username: string): Promise<boolean> {
  const html = baseTemplate(`
    <p>Welcome to <strong>${APP_NAME}</strong>, <strong>${username}</strong>!</p>
    <p>Your account has been created successfully. Start exploring the community:</p>
    <p style="text-align:center"><a href="${APP_URL}" class="btn">Get Started</a></p>
    <p>Here are some tips:</p>
    <ul>
      <li>Complete your profile to earn your first badge</li>
      <li>Introduce yourself in the Welcome forum</li>
      <li>Follow topics that interest you</li>
    </ul>
  `);
  return sendEmail({ to, subject: `Welcome to ${APP_NAME}!`, html });
}
