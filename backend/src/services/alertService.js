const nodemailer = require('nodemailer');
const db = require('../config/database');

class AlertService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Only initialize if SMTP settings are provided
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      console.log('📧 Email service initialized');
    } else {
      console.log('⚠️  Email service not configured (SMTP settings missing)');
    }
  }

  async checkAndSendAlerts() {
    try {
      console.log('Checking for alerts...');

      // Get all users with email notifications enabled
      const users = await db.all(`
        SELECT u.id, u.email, u.name, us.renewal_reminder_days, us.unused_threshold_days
        FROM users u
        JOIN user_settings us ON u.id = us.user_id
        WHERE us.email_notifications = 1
      `);

      for (const user of users) {
        await this.checkUserAlerts(user);
      }

      console.log(`✅ Alert check complete for ${users.length} users`);
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  async checkUserAlerts(user) {
    const alerts = [];

    // Check for upcoming renewals
    const renewalAlerts = await this.checkRenewalAlerts(user);
    alerts.push(...renewalAlerts);

    // Check for unused subscriptions
    const unusedAlerts = await this.checkUnusedSubscriptions(user);
    alerts.push(...unusedAlerts);

    // Send alerts if any
    if (alerts.length > 0) {
      await this.sendAlertEmail(user, alerts);
    }
  }

  async checkRenewalAlerts(user) {
    const reminderDays = user.renewal_reminder_days || 7;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + reminderDays);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const subscriptions = await db.all(`
      SELECT * FROM subscriptions
      WHERE user_id = ?
      AND status = 'active'
      AND next_billing_date <= ?
      AND next_billing_date >= date('now')
    `, [user.id, targetDateStr]);

    const alerts = [];

    for (const sub of subscriptions) {
      const daysUntil = Math.ceil(
        (new Date(sub.next_billing_date) - new Date()) / (1000 * 60 * 60 * 24)
      );

      // Check if we've already sent this alert recently
      const existingAlert = await db.get(`
        SELECT * FROM alerts
        WHERE user_id = ?
        AND subscription_id = ?
        AND type = 'renewal'
        AND date(created_at) = date('now')
      `, [user.id, sub.id]);

      if (!existingAlert && daysUntil <= reminderDays) {
        alerts.push({
          type: 'renewal',
          subscription: sub,
          daysUntil,
          message: `Your ${sub.name} subscription renews in ${daysUntil} day${daysUntil !== 1 ? 's' : ''} on ${sub.next_billing_date}. Cost: $${sub.cost}`
        });

        // Record the alert
        await db.run(`
          INSERT INTO alerts (user_id, subscription_id, type, message, status)
          VALUES (?, ?, 'renewal', ?, 'pending')
        `, [user.id, sub.id, `Renewal reminder for ${sub.name}`]);
      }
    }

    return alerts;
  }

  async checkUnusedSubscriptions(user) {
    const thresholdDays = user.unused_threshold_days || 90;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);
    const thresholdStr = thresholdDate.toISOString().split('T')[0];

    const subscriptions = await db.all(`
      SELECT * FROM subscriptions
      WHERE user_id = ?
      AND status = 'active'
      AND (last_used IS NULL OR last_used < ?)
    `, [user.id, thresholdStr]);

    const alerts = [];

    for (const sub of subscriptions) {
      // Check if we've sent this alert in the past week
      const recentAlert = await db.get(`
        SELECT * FROM alerts
        WHERE user_id = ?
        AND subscription_id = ?
        AND type = 'unused'
        AND created_at >= datetime('now', '-7 days')
      `, [user.id, sub.id]);

      if (!recentAlert) {
        const daysSince = sub.last_used
          ? Math.floor((new Date() - new Date(sub.last_used)) / (1000 * 60 * 60 * 24))
          : null;

        alerts.push({
          type: 'unused',
          subscription: sub,
          daysSince,
          message: sub.last_used
            ? `${sub.name} hasn't been used in ${daysSince} days. Consider canceling to save $${sub.cost}/${sub.billing_cycle}`
            : `${sub.name} has never been marked as used. Consider if you still need it ($${sub.cost}/${sub.billing_cycle})`
        });

        // Record the alert
        await db.run(`
          INSERT INTO alerts (user_id, subscription_id, type, message, status)
          VALUES (?, ?, 'unused', ?, 'pending')
        `, [user.id, sub.id, `Unused subscription: ${sub.name}`]);
      }
    }

    return alerts;
  }

  async sendAlertEmail(user, alerts) {
    if (!this.transporter) {
      console.log(`⚠️  Cannot send email to ${user.email} - email service not configured`);
      return;
    }

    try {
      const renewalAlerts = alerts.filter(a => a.type === 'renewal');
      const unusedAlerts = alerts.filter(a => a.type === 'unused');

      let emailBody = `Hi ${user.name || 'there'},\n\n`;
      emailBody += `Here are your subscription alerts:\n\n`;

      if (renewalAlerts.length > 0) {
        emailBody += `📅 UPCOMING RENEWALS:\n`;
        renewalAlerts.forEach(alert => {
          emailBody += `  • ${alert.message}\n`;
        });
        emailBody += `\n`;
      }

      if (unusedAlerts.length > 0) {
        emailBody += `🧹 UNUSED SUBSCRIPTIONS:\n`;
        unusedAlerts.forEach(alert => {
          emailBody += `  • ${alert.message}\n`;
        });
        emailBody += `\n`;
      }

      emailBody += `Log in to your Creative Subs Optimizer dashboard to manage your subscriptions.\n\n`;
      emailBody += `Best regards,\nCreative Subs Optimizer`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@subsoptimizer.local',
        to: user.email,
        subject: `📊 Subscription Alerts - ${renewalAlerts.length + unusedAlerts.length} item${(renewalAlerts.length + unusedAlerts.length) !== 1 ? 's' : ''}`,
        text: emailBody
      };

      await this.transporter.sendMail(mailOptions);
      
      // Mark alerts as sent
      for (const alert of alerts) {
        await db.run(`
          UPDATE alerts
          SET status = 'sent', sent_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND subscription_id = ? AND type = ?
          AND status = 'pending'
        `, [user.id, alert.subscription.id, alert.type]);
      }

      console.log(`✉️  Sent ${alerts.length} alerts to ${user.email}`);
    } catch (error) {
      console.error(`Error sending email to ${user.email}:`, error);
    }
  }
}

const alertService = new AlertService();
module.exports = alertService;
