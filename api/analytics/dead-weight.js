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

    // Get user settings
    const settingsResult = await sql`
      SELECT unused_threshold_days FROM user_settings 
      WHERE user_id = ${req.user.id}
    `;

    const thresholdDays = settingsResult.rows[0]?.unused_threshold_days || 90;

    // Calculate threshold date
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);
    const thresholdString = thresholdDate.toISOString().split('T')[0];

    // Get unused subscriptions
    const result = await sql`
      SELECT * FROM subscriptions 
      WHERE user_id = ${req.user.id} 
      AND status = 'active'
      AND (last_used IS NULL OR last_used < ${thresholdString})
      ORDER BY cost DESC
    `;

    const subscriptions = result.rows;

    // Calculate potential savings
    let monthlySavings = 0;
    let yearlySavings = 0;

    const deadWeightSubs = subscriptions.map(sub => {
      const cost = parseFloat(sub.cost);
      
      switch (sub.billing_cycle.toLowerCase()) {
        case 'monthly':
          monthlySavings += cost;
          yearlySavings += cost * 12;
          break;
        case 'yearly':
          monthlySavings += cost / 12;
          yearlySavings += cost;
          break;
        case 'weekly':
          monthlySavings += cost * 4.33;
          yearlySavings += cost * 52;
          break;
        case 'quarterly':
          monthlySavings += cost / 3;
          yearlySavings += cost * 4;
          break;
      }

      const daysSinceUsed = sub.last_used 
        ? Math.floor((new Date() - new Date(sub.last_used)) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...sub,
        daysSinceUsed,
        reason: !sub.last_used 
          ? 'Never marked as used'
          : `Not used in ${daysSinceUsed} days`
      };
    });

    return res.json({
      subscriptions: deadWeightSubs,
      count: deadWeightSubs.length,
      potentialSavings: {
        monthly: Math.round(monthlySavings * 100) / 100,
        yearly: Math.round(yearlySavings * 100) / 100
      },
      thresholdDays
    });
  } catch (error) {
    console.error('Dead weight analysis error:', error);
    return res.status(500).json({ error: 'Failed to analyze dead weight' });
  }
}

export default authMiddleware(handler);
