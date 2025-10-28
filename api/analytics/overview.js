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

    // Calculate totals
    let monthlyTotal = 0;
    let yearlyTotal = 0;

    subscriptions.forEach(sub => {
      const cost = parseFloat(sub.cost);
      switch (sub.billing_cycle.toLowerCase()) {
        case 'monthly':
          monthlyTotal += cost;
          yearlyTotal += cost * 12;
          break;
        case 'yearly':
          monthlyTotal += cost / 12;
          yearlyTotal += cost;
          break;
        case 'weekly':
          monthlyTotal += cost * 4.33;
          yearlyTotal += cost * 52;
          break;
        case 'quarterly':
          monthlyTotal += cost / 3;
          yearlyTotal += cost * 4;
          break;
      }
    });

    // Get upcoming renewals (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingRenewals = subscriptions
      .filter(sub => {
        const nextDate = new Date(sub.next_billing_date);
        const now = new Date();
        return nextDate >= now && nextDate <= thirtyDaysFromNow;
      })
      .sort((a, b) => new Date(a.next_billing_date) - new Date(b.next_billing_date))
      .slice(0, 5);

    return res.json({
      totalSubscriptions: subscriptions.length,
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      yearlyTotal: Math.round(yearlyTotal * 100) / 100,
      upcomingRenewals
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}

export default authMiddleware(handler);
