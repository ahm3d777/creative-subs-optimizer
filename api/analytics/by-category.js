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

    const result = await sql`
      SELECT * FROM subscriptions 
      WHERE user_id = ${req.user.id} AND status = 'active'
    `;

    const subscriptions = result.rows;

    // Group by category
    const categoryMap = {};

    subscriptions.forEach(sub => {
      const cost = parseFloat(sub.cost);
      let monthlyCost = cost;

      switch (sub.billing_cycle.toLowerCase()) {
        case 'yearly':
          monthlyCost = cost / 12;
          break;
        case 'weekly':
          monthlyCost = cost * 4.33;
          break;
        case 'quarterly':
          monthlyCost = cost / 3;
          break;
      }

      if (!categoryMap[sub.category]) {
        categoryMap[sub.category] = {
          category: sub.category,
          count: 0,
          monthlyTotal: 0,
          subscriptions: []
        };
      }

      categoryMap[sub.category].count++;
      categoryMap[sub.category].monthlyTotal += monthlyCost;
      categoryMap[sub.category].subscriptions.push({
        id: sub.id,
        name: sub.name,
        cost: sub.cost,
        billing_cycle: sub.billing_cycle
      });
    });

    const categories = Object.values(categoryMap).map(cat => ({
      ...cat,
      monthlyTotal: Math.round(cat.monthlyTotal * 100) / 100
    }));

    categories.sort((a, b) => b.monthlyTotal - a.monthlyTotal);

    return res.json({ categories });
  } catch (error) {
    console.error('Category analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch category analytics' });
  }
}

export default authMiddleware(handler);
