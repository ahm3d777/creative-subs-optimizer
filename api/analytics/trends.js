import { sql, ensureDatabase } from '../lib/db.js';
import { authMiddleware } from '../lib/auth.js';

async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await ensureDatabase();

    const months = parseInt(req.query.months) || 6;

    const result = await sql`
      SELECT * FROM subscriptions 
      WHERE user_id = ${req.user.id} AND status = 'active'
    `;

    const subscriptions = result.rows;

    // Generate trend data
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = month.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      let monthlyTotal = 0;

      subscriptions.forEach(sub => {
        const createdDate = new Date(sub.created_at);
        if (createdDate <= month) {
          const cost = parseFloat(sub.cost);
          switch (sub.billing_cycle.toLowerCase()) {
            case 'monthly':
              monthlyTotal += cost;
              break;
            case 'yearly':
              monthlyTotal += cost / 12;
              break;
            case 'weekly':
              monthlyTotal += cost * 4.33;
              break;
            case 'quarterly':
              monthlyTotal += cost / 3;
              break;
          }
        }
      });

      trends.push({
        month: monthStr,
        total: Math.round(monthlyTotal * 100) / 100
      });
    }

    return res.json({ trends });
  } catch (error) {
    console.error('Trends error:', error);
    return res.status(500).json({ error: 'Failed to fetch trends' });
  }
}

export default authMiddleware(handler);
