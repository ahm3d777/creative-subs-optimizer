import React, { useState, useEffect } from 'react';
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  importSubscriptions,
  exportSubscriptions
} from '../utils/api';

const CATEGORIES = [
  'Design Tools',
  'Development',
  'Productivity',
  'Stock Assets',
  'Cloud Storage',
  'Marketing',
  'Communication',
  'Entertainment',
  'Other'
];

const BILLING_CYCLES = ['monthly', 'yearly', 'weekly', 'quarterly'];

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    billing_cycle: 'monthly',
    category: 'Design Tools',
    next_billing_date: '',
    last_used: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const data = await getSubscriptions();
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cost: '',
      billing_cycle: 'monthly',
      category: 'Design Tools',
      next_billing_date: '',
      last_used: '',
      notes: ''
    });
    setEditingId(null);
    setError('');
  };

  const handleOpenModal = (subscription = null) => {
    if (subscription) {
      setFormData({
        name: subscription.name,
        cost: subscription.cost,
        billing_cycle: subscription.billing_cycle,
        category: subscription.category,
        next_billing_date: subscription.next_billing_date,
        last_used: subscription.last_used || '',
        notes: subscription.notes || ''
      });
      setEditingId(subscription.id);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await updateSubscription(editingId, formData);
        setSuccess('Subscription updated successfully');
      } else {
        await createSubscription(formData);
        setSuccess('Subscription added successfully');
      }
      handleCloseModal();
      loadSubscriptions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteSubscription(id);
        setSuccess('Subscription deleted successfully');
        loadSubscriptions();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to delete subscription');
      }
    }
  };

  const handleMarkUsed = async (subscription) => {
    try {
      await updateSubscription(subscription.id, {
        last_used: new Date().toISOString().split('T')[0]
      });
      setSuccess('Marked as used today');
      loadSubscriptions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update subscription');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const subscriptions = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const sub = {};
          headers.forEach((header, index) => {
            sub[header] = values[index] || '';
          });
          
          if (sub.name && sub.cost) {
            subscriptions.push(sub);
          }
        }

        if (subscriptions.length > 0) {
          const result = await importSubscriptions(subscriptions);
          setSuccess(`Imported ${result.imported} subscription(s)`);
          loadSubscriptions();
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError('No valid subscriptions found in CSV');
        }
      } catch (error) {
        setError('Failed to import CSV');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = async () => {
    try {
      const blob = await exportSubscriptions();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'subscriptions.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess('Subscriptions exported successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to export subscriptions');
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
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Subscriptions</h1>
        <div className="flex gap-2">
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            📥 Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={handleExport} className="btn btn-secondary">
            📤 Export CSV
          </button>
          <button onClick={() => handleOpenModal()} className="btn btn-primary">
            + Add Subscription
          </button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {subscriptions.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <h3 style={{ marginBottom: '0.5rem' }}>No subscriptions yet</h3>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
              Get started by adding your first subscription
            </p>
            <button onClick={() => handleOpenModal()} className="btn btn-primary">
              + Add Your First Subscription
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Cost</th>
                <th>Cycle</th>
                <th>Next Billing</th>
                <th>Last Used</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => {
                const daysUntil = Math.ceil(
                  (new Date(sub.next_billing_date) - new Date()) / (1000 * 60 * 60 * 24)
                );
                const daysSinceUsed = sub.last_used
                  ? Math.floor((new Date() - new Date(sub.last_used)) / (1000 * 60 * 60 * 24))
                  : null;
                
                return (
                  <tr key={sub.id}>
                    <td><strong>{sub.name}</strong></td>
                    <td>
                      <span className="badge badge-info">{sub.category}</span>
                    </td>
                    <td>${sub.cost}</td>
                    <td style={{ textTransform: 'capitalize' }}>{sub.billing_cycle}</td>
                    <td>
                      {sub.next_billing_date}
                      <span style={{ 
                        marginLeft: '0.5rem',
                        color: daysUntil <= 7 ? '#DC2626' : '#6B7280',
                        fontSize: '0.875rem'
                      }}>
                        ({daysUntil}d)
                      </span>
                    </td>
                    <td>
                      {sub.last_used ? (
                        <span style={{ fontSize: '0.875rem' }}>
                          {daysSinceUsed === 0 ? 'Today' : `${daysSinceUsed}d ago`}
                        </span>
                      ) : (
                        <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>Never</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarkUsed(sub)}
                          className="btn btn-success"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          ✓ Used
                        </button>
                        <button
                          onClick={() => handleOpenModal(sub)}
                          className="btn btn-secondary"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id, sub.name)}
                          className="btn btn-danger"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {editingId ? 'Edit Subscription' : 'Add Subscription'}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Adobe Creative Cloud"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cost *</label>
                <input
                  type="number"
                  name="cost"
                  className="form-input"
                  value={formData.cost}
                  onChange={handleInputChange}
                  placeholder="54.99"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Billing Cycle *</label>
                <select
                  name="billing_cycle"
                  className="form-select"
                  value={formData.billing_cycle}
                  onChange={handleInputChange}
                  required
                >
                  {BILLING_CYCLES.map(cycle => (
                    <option key={cycle} value={cycle}>
                      {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  name="category"
                  className="form-select"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Next Billing Date *</label>
                <input
                  type="date"
                  name="next_billing_date"
                  className="form-input"
                  value={formData.next_billing_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Used</label>
                <input
                  type="date"
                  name="last_used"
                  className="form-input"
                  value={formData.last_used}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  className="form-input"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Essential for client work"
                  rows="3"
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update' : 'Add'} Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
