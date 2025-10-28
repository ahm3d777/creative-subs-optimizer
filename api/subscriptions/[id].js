import { sql, ensureDatabase } from '../lib/db.js';
import { authMiddleware } from '../lib/auth.js';

async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await ensureDatabase();

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Subscription ID required' });
  }

  // GET - Get single subscription
  if (req.method === 'GET') {
    try {
      const result = await sql`
        SELECT * FROM subscriptions 
        WHERE id = ${id} AND user_id = ${req.user.id}
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      return res.json({ subscription: result.rows[0] });
    } catch (error) {
      console.error('Get subscription error:', error);
      return res.status(500).json({ error: 'Failed to fetch subscription' });
    }
  }

  // PUT - Update subscription
  if (req.method === 'PUT') {
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

      // Check if subscription exists
      const existing = await sql`
        SELECT id FROM subscriptions 
        WHERE id = ${id} AND user_id = ${req.user.id}
      `;

      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Build update query
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) updates.push(`name = $${paramCount++}`), values.push(name);
      if (cost !== undefined) updates.push(`cost = $${paramCount++}`), values.push(parseFloat(cost));
      if (billing_cycle !== undefined) updates.push(`billing_cycle = $${paramCount++}`), values.push(billing_cycle.toLowerCase());
      if (category !== undefined) updates.push(`category = $${paramCount++}`), values.push(category);
      if (next_billing_date !== undefined) updates.push(`next_billing_date = $${paramCount++}`), values.push(next_billing_date);
      if (last_used !== undefined) updates.push(`last_used = $${paramCount++}`), values.push(last_used);
      if (notes !== undefined) updates.push(`notes = $${paramCount++}`), values.push(notes);
      if (status !== undefined) updates.push(`status = $${paramCount++}`), values.push(status);

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id, req.user.id);

      const query = `
        UPDATE subscriptions 
        SET ${updates.join(', ')} 
        WHERE id = $${paramCount++} AND user_id = $${paramCount++}
        RETURNING *
      `;

      const result = await sql.query(query, values);

      return res.json({
        message: 'Subscription updated successfully',
        subscription: result.rows[0]
      });
    } catch (error) {
      console.error('Update subscription error:', error);
      return res.status(500).json({ error: 'Failed to update subscription' });
    }
  }

  // DELETE - Delete subscription
  if (req.method === 'DELETE') {
    try {
      const result = await sql`
        DELETE FROM subscriptions 
        WHERE id = ${id} AND user_id = ${req.user.id}
        RETURNING id
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      return res.json({ message: 'Subscription deleted successfully' });
    } catch (error) {
      console.error('Delete subscription error:', error);
      return res.status(500).json({ error: 'Failed to delete subscription' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default authMiddleware(handler);
