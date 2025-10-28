import { sql, ensureDatabase } from '../lib/db.js';
import { authMiddleware } from '../lib/auth.js';

async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await ensureDatabase();

  // GET - List all subscriptions
  if (req.method === 'GET') {
    try {
      const result = await sql`
        SELECT * FROM subscriptions
        WHERE user_id = ${req.user.id}
        ORDER BY next_billing_date ASC
      `;

      return res.json({ subscriptions: result.rows });
    } catch (error) {
      console.error('Get subscriptions error:', error);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  }

  // POST - Create new subscription
  if (req.method === 'POST') {
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

      const result = await sql`
        INSERT INTO subscriptions 
        (user_id, name, cost, billing_cycle, category, next_billing_date, last_used, notes)
        VALUES (
          ${req.user.id},
          ${name},
          ${parseFloat(cost)},
          ${billing_cycle.toLowerCase()},
          ${category},
          ${next_billing_date},
          ${last_used || null},
          ${notes || null}
        )
        RETURNING *
      `;

      return res.status(201).json({
        message: 'Subscription created successfully',
        subscription: result.rows[0]
      });
    } catch (error) {
      console.error('Create subscription error:', error);
      return res.status(500).json({ error: 'Failed to create subscription' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default authMiddleware(handler);
