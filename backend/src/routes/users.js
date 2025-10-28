const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get user settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await db.get(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );

    if (!settings) {
      // Create default settings if they don't exist
      await db.run(
        'INSERT INTO user_settings (user_id) VALUES (?)',
        [req.user.id]
      );
      
      const newSettings = await db.get(
        'SELECT * FROM user_settings WHERE user_id = ?',
        [req.user.id]
      );
      
      return res.json({ settings: newSettings });
    }

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update user settings
router.put('/settings', async (req, res) => {
  try {
    const {
      email_notifications,
      renewal_reminder_days,
      unused_threshold_days
    } = req.body;

    const updates = [];
    const values = [];

    if (email_notifications !== undefined) {
      updates.push('email_notifications = ?');
      values.push(email_notifications ? 1 : 0);
    }
    if (renewal_reminder_days !== undefined) {
      updates.push('renewal_reminder_days = ?');
      values.push(parseInt(renewal_reminder_days));
    }
    if (unused_threshold_days !== undefined) {
      updates.push('unused_threshold_days = ?');
      values.push(parseInt(unused_threshold_days));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No settings to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.id);

    await db.run(
      `UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );

    const settings = await db.get(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { name, email } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await db.get(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.user.id]
      );
      
      if (existingUser) {
        return res.status(409).json({ error: 'Email already in use' });
      }
      
      updates.push('email = ?');
      values.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No profile data to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.id);

    await db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const user = await db.get(
      'SELECT id, email, name, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const subscriptions = await db.all(
      'SELECT * FROM subscriptions WHERE user_id = ?',
      [req.user.id]
    );

    const activeCount = subscriptions.filter(s => s.status === 'active').length;
    const inactiveCount = subscriptions.filter(s => s.status !== 'active').length;

    // Calculate total spent (estimate based on subscription age)
    let totalSpent = 0;
    subscriptions.forEach(sub => {
      const months = Math.floor(
        (new Date() - new Date(sub.created_at)) / (1000 * 60 * 60 * 24 * 30)
      );
      
      const cost = parseFloat(sub.cost);
      switch (sub.billing_cycle.toLowerCase()) {
        case 'monthly':
          totalSpent += cost * months;
          break;
        case 'yearly':
          totalSpent += cost * Math.floor(months / 12);
          break;
        case 'weekly':
          totalSpent += cost * months * 4;
          break;
        case 'quarterly':
          totalSpent += cost * Math.floor(months / 3);
          break;
      }
    });

    const user = await db.get(
      'SELECT created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    const daysSinceJoin = Math.floor(
      (new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)
    );

    res.json({
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: activeCount,
      inactiveSubscriptions: inactiveCount,
      estimatedTotalSpent: Math.round(totalSpent * 100) / 100,
      daysSinceJoin,
      avgSubscriptionsPerMonth: subscriptions.length / Math.max(1, daysSinceJoin / 30)
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
