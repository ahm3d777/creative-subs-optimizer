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
    const recommendations = [];

    // Find duplicate categories
    const categoryCount = {};
    subscriptions.forEach(sub => {
      categoryCount[sub.category] = (categoryCount[sub.category] || 0) + 1;
    });

    Object.entries(categoryCount).forEach(([category, count]) => {
      if (count > 1) {
        const categorySubs = subscriptions.filter(s => s.category === category);
        const totalCost = categorySubs.reduce((sum, s) => sum + parseFloat(s.cost), 0);
        
        recommendations.push({
          type: 'duplicate_category',
          title: `Multiple ${category} subscriptions`,
          description: `You have ${count} subscriptions in ${category}. Consider consolidating to save money.`,
          potentialSavings: Math.round(totalCost * 0.3 * 100) / 100,
          priority: 'medium',
          subscriptions: categorySubs.map(s => ({ id: s.id, name: s.name, cost: s.cost }))
        });
      }
    });

    // Find expensive subscriptions
    const expensiveSubs = subscriptions.filter(sub => {
      const monthlyCost = sub.billing_cycle === 'yearly' 
        ? parseFloat(sub.cost) / 12 
        : parseFloat(sub.cost);
      return monthlyCost > 50;
    });

    expensiveSubs.forEach(sub => {
      recommendations.push({
        type: 'expensive',
        title: `Review ${sub.name}`,
        description: `${sub.name} costs $${sub.cost} per ${sub.billing_cycle}. Look for alternatives or discounts.`,
        potentialSavings: Math.round(parseFloat(sub.cost) * 0.2 * 100) / 100,
        priority: 'low',
        subscriptions: [{ id: sub.id, name: sub.name, cost: sub.cost }]
      });
    });

    // Sort by priority and savings
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      return priorityDiff !== 0 ? priorityDiff : b.potentialSavings - a.potentialSavings;
    });

    return res.json({ 
      recommendations: recommendations.slice(0, 10),
      totalPotentialSavings: Math.round(
        recommendations.reduce((sum, r) => sum + r.potentialSavings, 0) * 100
      ) / 100
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
}

export default authMiddleware(handler);
