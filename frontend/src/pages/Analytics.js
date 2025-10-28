import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import {
  getSpendingByCategory,
  getSpendingTrends,
  getDeadWeight,
  getRecommendations
} from '../utils/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [categoryData, setCategoryData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [deadWeight, setDeadWeight] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [category, trends, dead, recs] = await Promise.all([
        getSpendingByCategory(),
        getSpendingTrends(6),
        getDeadWeight(),
        getRecommendations()
      ]);
      
      setCategoryData(category);
      setTrendsData(trends);
      setDeadWeight(dead);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Prepare category pie chart data
  const categoryChartData = categoryData?.categories ? {
    labels: categoryData.categories.map(c => c.category),
    datasets: [{
      data: categoryData.categories.map(c => c.monthlyTotal),
      backgroundColor: [
        '#4F46E5',
        '#7C3AED',
        '#EC4899',
        '#F59E0B',
        '#10B981',
        '#3B82F6',
        '#8B5CF6',
        '#EF4444',
        '#6B7280'
      ]
    }]
  } : null;

  // Prepare trends line chart data
  const trendsChartData = trendsData?.trends ? {
    labels: trendsData.trends.map(t => t.month),
    datasets: [{
      label: 'Monthly Spending',
      data: trendsData.trends.map(t => t.total),
      borderColor: '#4F46E5',
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      tension: 0.4
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Analytics</h1>

      {/* Dead Weight Section */}
      {deadWeight && deadWeight.count > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">🧹 Dead Weight Detection</div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="stat-value" style={{ color: '#DC2626' }}>
              ${deadWeight.potentialSavings.monthly.toFixed(2)}/month
            </div>
            <div className="stat-label">
              Potential savings from {deadWeight.count} unused subscription{deadWeight.count !== 1 ? 's' : ''}
            </div>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Subscription</th>
                <th>Cost</th>
                <th>Cycle</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {deadWeight.subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td><strong>{sub.name}</strong></td>
                  <td>${sub.cost}</td>
                  <td style={{ textTransform: 'capitalize' }}>{sub.billing_cycle}</td>
                  <td style={{ color: '#DC2626', fontSize: '0.875rem' }}>{sub.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="alert alert-info" style={{ marginTop: '1rem' }}>
            <strong>💡 Tip:</strong> Subscriptions are flagged as unused if not marked as used in {deadWeight.thresholdDays} days.
            Update "Last Used" dates on the Subscriptions page to track usage.
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-2">
        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">📊 Spending by Category</div>
          {categoryChartData && categoryData.categories.length > 0 ? (
            <>
              <div style={{ height: '300px', marginBottom: '1.5rem' }}>
                <Pie data={categoryChartData} options={chartOptions} />
              </div>
              <div>
                {categoryData.categories.map((cat, index) => (
                  <div key={cat.category} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: index !== categoryData.categories.length - 1 ? '1px solid #E5E7EB' : 'none'
                  }}>
                    <span>
                      <strong>{cat.category}</strong>
                      <span style={{ color: '#6B7280', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                        ({cat.count} sub{cat.count !== 1 ? 's' : ''})
                      </span>
                    </span>
                    <span style={{ fontWeight: '600', color: '#4F46E5' }}>
                      ${cat.monthlyTotal.toFixed(2)}/mo
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: '#6B7280' }}>No category data available</p>
          )}
        </div>

        {/* Spending Trends */}
        <div className="card">
          <div className="card-header">📈 Spending Trends</div>
          {trendsChartData ? (
            <div style={{ height: '300px' }}>
              <Line data={trendsChartData} options={chartOptions} />
            </div>
          ) : (
            <p style={{ color: '#6B7280' }}>No trend data available</p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations && recommendations.recommendations.length > 0 && (
        <div className="card">
          <div className="card-header">
            💡 Optimization Recommendations
            <span className="badge badge-success">
              Save ${recommendations.totalPotentialSavings.toFixed(2)}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recommendations.recommendations.map((rec, index) => (
              <div key={index} style={{ 
                padding: '1rem',
                backgroundColor: '#F9FAFB',
                borderRadius: '0.375rem',
                borderLeft: `4px solid ${
                  rec.priority === 'high' ? '#DC2626' : 
                  rec.priority === 'medium' ? '#F59E0B' : 
                  '#10B981'
                }`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{rec.title}</strong>
                  <span className={`badge badge-${
                    rec.priority === 'high' ? 'danger' : 
                    rec.priority === 'medium' ? 'warning' : 
                    'info'
                  }`}>
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                <p style={{ color: '#374151', marginBottom: '0.5rem' }}>{rec.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                    Affected: {rec.subscriptions.map(s => s.name).join(', ')}
                  </div>
                  <div style={{ fontWeight: '600', color: '#059669' }}>
                    Potential: ${rec.potentialSavings.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
