import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAnalyticsOverview, getDeadWeight } from '../utils/api';

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [deadWeight, setDeadWeight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overviewData, deadWeightData] = await Promise.all([
        getAnalyticsOverview(),
        getDeadWeight()
      ]);
      setOverview(overviewData);
      setDeadWeight(deadWeightData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="flex justify-between align-center mb-3">
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Dashboard</h1>
        <Link to="/subscriptions" className="btn btn-primary">
          + Add Subscription
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{overview?.totalSubscriptions || 0}</div>
          <div className="stat-label">Active Subscriptions</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">${overview?.monthlyTotal?.toFixed(2) || '0.00'}</div>
          <div className="stat-label">Monthly Spend</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">${overview?.yearlyTotal?.toFixed(2) || '0.00'}</div>
          <div className="stat-label">Yearly Spend</div>
        </div>
      </div>

      {/* Dead Weight Alert */}
      {deadWeight && deadWeight.count > 0 && (
        <div className="alert alert-info">
          <strong>💡 Potential Savings: ${deadWeight.potentialSavings.monthly.toFixed(2)}/month</strong>
          <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
            You have {deadWeight.count} unused subscription{deadWeight.count !== 1 ? 's' : ''} 
            {' '}that could save you ${deadWeight.potentialSavings.yearly.toFixed(2)}/year. 
            {' '}<Link to="/analytics" style={{ fontWeight: '600', color: '#1E40AF' }}>View details →</Link>
          </p>
        </div>
      )}

      {/* Upcoming Renewals */}
      <div className="card">
        <div className="card-header">
          Upcoming Renewals
          <Link to="/subscriptions" style={{ fontSize: '0.875rem', color: '#4F46E5' }}>
            View all
          </Link>
        </div>
        
        {overview?.upcomingRenewals && overview.upcomingRenewals.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Subscription</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Next Billing</th>
              </tr>
            </thead>
            <tbody>
              {overview.upcomingRenewals.map((sub) => {
                const daysUntil = Math.ceil(
                  (new Date(sub.next_billing_date) - new Date()) / (1000 * 60 * 60 * 24)
                );
                
                return (
                  <tr key={sub.id}>
                    <td><strong>{sub.name}</strong></td>
                    <td>
                      <span className="badge badge-info">{sub.category}</span>
                    </td>
                    <td>${sub.cost}</td>
                    <td>
                      {sub.next_billing_date}
                      <span style={{ 
                        marginLeft: '0.5rem', 
                        color: daysUntil <= 7 ? '#DC2626' : '#6B7280',
                        fontSize: '0.875rem'
                      }}>
                        ({daysUntil} day{daysUntil !== 1 ? 's' : ''})
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#6B7280' }}>No upcoming renewals in the next 30 days</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-3">
        <Link to="/subscriptions" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Manage Subscriptions</div>
          <div style={{ color: '#6B7280', fontSize: '0.875rem' }}>
            Add, edit, or remove subscriptions
          </div>
        </Link>
        
        <Link to="/analytics" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>View Analytics</div>
          <div style={{ color: '#6B7280', fontSize: '0.875rem' }}>
            See spending trends and insights
          </div>
        </Link>
        
        <Link to="/settings" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚙️</div>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Settings</div>
          <div style={{ color: '#6B7280', fontSize: '0.875rem' }}>
            Configure alerts and preferences
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
