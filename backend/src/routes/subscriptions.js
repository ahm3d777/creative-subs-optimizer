const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all subscriptions for current user
router.get('/', async (req, res) => {
  try {
    const subscriptions = await db.all(
      `SELECT * FROM subscriptions 
       WHERE user_id = ? 
       ORDER BY next_billing_date ASC`,
      [req.user.id]
    );

    res.json({ subscriptions });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Get single subscription
router.get('/:id', async (req, res) => {
  try {
    const subscription = await db.get(
      'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Create new subscription
router.post('/', async (req, res) => {
  try {
    const {
      name,
      cost,
      billing_cycle,
      category,
      next_billing_date,
      last_used,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !cost || !billing_cycle || !category || !next_billing_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate billing cycle
    const validCycles = ['monthly', 'yearly', 'weekly', 'quarterly'];
    if (!validCycles.includes(billing_cycle.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }

    const result = await db.run(
      `INSERT INTO subscriptions 
       (user_id, name, cost, billing_cycle, category, next_billing_date, last_used, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        name,
        parseFloat(cost),
        billing_cycle.toLowerCase(),
        category,
        next_billing_date,
        last_used || null,
        notes || null
      ]
    );

    const subscription = await db.get(
      'SELECT * FROM subscriptions WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      message: 'Subscription created successfully',
      subscription
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Update subscription
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      cost,
      billing_cycle,
      category,
      next_billing_date,
      last_used,
      notes,
      status
    } = req.body;

    // Check if subscription exists and belongs to user
    const existing = await db.get(
      'SELECT id FROM subscriptions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (cost !== undefined) {
      updates.push('cost = ?');
      values.push(parseFloat(cost));
    }
    if (billing_cycle !== undefined) {
      updates.push('billing_cycle = ?');
      values.push(billing_cycle.toLowerCase());
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (next_billing_date !== undefined) {
      updates.push('next_billing_date = ?');
      values.push(next_billing_date);
    }
    if (last_used !== undefined) {
      updates.push('last_used = ?');
      values.push(last_used);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    values.push(req.params.id, req.user.id);

    await db.run(
      `UPDATE subscriptions SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    const subscription = await db.get(
      'SELECT * FROM subscriptions WHERE id = ?',
      [req.params.id]
    );

    res.json({
      message: 'Subscription updated successfully',
      subscription
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Delete subscription
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.run(
      'DELETE FROM subscriptions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Delete subscription error:', error);
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

// Bulk import subscriptions from CSV data
router.post('/import', async (req, res) => {
  try {
    const { subscriptions } = req.body;

    if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
      return res.status(400).json({ error: 'Invalid import data' });
    }

    const imported = [];
    const errors = [];

    for (let i = 0; i < subscriptions.length; i++) {
      const sub = subscriptions[i];
      
      try {
        // Validate required fields
        if (!sub.name || !sub.cost || !sub.billing_cycle || !sub.category || !sub.next_billing_date) {
          errors.push({ row: i + 1, error: 'Missing required fields' });
          continue;
        }

        const result = await db.run(
          `INSERT INTO subscriptions 
           (user_id, name, cost, billing_cycle, category, next_billing_date, last_used, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.user.id,
            sub.name,
            parseFloat(sub.cost),
            sub.billing_cycle.toLowerCase(),
            sub.category,
            sub.next_billing_date,
            sub.last_used || null,
            sub.notes || null
          ]
        );

        imported.push(result.id);
      } catch (error) {
        errors.push({ row: i + 1, error: error.message });
      }
    }

    res.json({
      message: `Imported ${imported.length} subscriptions`,
      imported: imported.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import subscriptions' });
  }
});

// Export subscriptions to CSV format
router.get('/export/csv', async (req, res) => {
  try {
    const subscriptions = await db.all(
      'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY name',
      [req.user.id]
    );

    // Convert to CSV format
    const headers = 'name,cost,billing_cycle,category,next_billing_date,last_used,notes,status\n';
    const rows = subscriptions.map(sub => 
      `"${sub.name}",${sub.cost},${sub.billing_cycle},${sub.category},${sub.next_billing_date},${sub.last_used || ''},${sub.notes || ''},${sub.status}`
    ).join('\n');

    const csv = headers + rows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=subscriptions.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export subscriptions' });
  }
});

module.exports = router;
