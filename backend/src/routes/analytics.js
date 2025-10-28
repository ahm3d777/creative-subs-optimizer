const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get spending overview
router.get('/overview', async (req, res) => {
  try {
    const subscriptions = await db.all(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = "active"',
      [req.user.id]
    );

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
          monthlyTotal += cost * 4.33; // Avg weeks per month
          yearlyTotal += cost * 52;
          break;
        case 'quarterly':
          monthlyTotal += cost / 3;
          yearlyTotal += cost * 4;
          break;
      }
    });

    // Get upcoming renewals (next 30 days)
    const upcomingRenewals = subscriptions
      .filter(sub => {
        const daysUntil = Math.ceil(
          (new Date(sub.next_billing_date) - new Date()) / (1000 * 60 * 60 * 24)
        );
        return daysUntil <= 30 && daysUntil >= 0;
      })
      .sort((a, b) => new Date(a.next_billing_date) - new Date(b.next_billing_date));

    res.json({
      totalSubscriptions: subscriptions.length,
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      yearlyTotal: Math.round(yearlyTotal * 100) / 100,
      upcomingRenewals: upcomingRenewals.slice(0, 5)
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get spending by category
router.get('/by-category', async (req, res) => {
  try {
    const subscriptions = await db.all(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = "active"',
      [req.user.id]
    );

    // Group by category and calculate monthly cost
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

    // Convert to array and round totals
    const categories = Object.values(categoryMap).map(cat => ({
      ...cat,
      monthlyTotal: Math.round(cat.monthlyTotal * 100) / 100
    }));

    // Sort by total spending
    categories.sort((a, b) => b.monthlyTotal - a.monthlyTotal);

    res.json({ categories });
  } catch (error) {
    console.error('Category analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch category analytics' });
  }
});

// Dead weight detection - identify unused subscriptions
router.get('/dead-weight', async (req, res) => {
  try {
    const settings = await db.get(
      'SELECT unused_threshold_days FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );

    const thresholdDays = settings?.unused_threshold_days || 90;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);
    const thresholdString = thresholdDate.toISOString().split('T')[0];

    const subscriptions = await db.all(
      `SELECT * FROM subscriptions 
       WHERE user_id = ? 
       AND status = "active"
       AND (last_used IS NULL OR last_used < ?)
       ORDER BY cost DESC`,
      [req.user.id, thresholdString]
    );

    // Calculate potential savings
    let monthlySavings = 0;
    let yearlySavings = 0;

    subscriptions.forEach(sub => {
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
    });

    const deadWeightSubs = subscriptions.map(sub => {
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

    res.json({
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
    res.status(500).json({ error: 'Failed to analyze dead weight' });
  }
});

// Get spending trends over time
router.get('/trends', async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    
    const subscriptions = await db.all(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = "active"',
      [req.user.id]
    );

    // Generate trend data for past N months
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = month.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      let monthlyTotal = 0;

      subscriptions.forEach(sub => {
        // Check if subscription was active in this month
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

    res.json({ trends });
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Get savings recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const subscriptions = await db.all(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = "active"',
      [req.user.id]
    );

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
          potentialSavings: Math.round(totalCost * 0.3 * 100) / 100, // Estimate 30% savings
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

    // Sort by priority and potential savings
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      return priorityDiff !== 0 ? priorityDiff : b.potentialSavings - a.potentialSavings;
    });

    res.json({ 
      recommendations: recommendations.slice(0, 10),
      totalPotentialSavings: Math.round(
        recommendations.reduce((sum, r) => sum + r.potentialSavings, 0) * 100
      ) / 100
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

module.exports = router;
