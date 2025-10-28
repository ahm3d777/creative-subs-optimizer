import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserSettings, updateUserSettings, updateUserProfile } from '../utils/api';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    email_notifications: true,
    renewal_reminder_days: 7,
    unused_threshold_days: 90
  });
  const [profile, setProfile] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const data = await getUserSettings();
      setSettings({
        email_notifications: data.settings.email_notifications === 1,
        renewal_reminder_days: data.settings.renewal_reminder_days,
        unused_threshold_days: data.settings.unused_threshold_days
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseInt(value)
    }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateUserSettings(settings);
      setSuccess('Settings updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update settings');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateUserProfile(profile);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile');
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
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Settings</h1>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Profile Settings */}
      <div className="card">
        <div className="card-header">👤 Profile</div>
        <form onSubmit={handleProfileSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={profile.name}
              onChange={handleProfileChange}
              placeholder="Your Name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={profile.email}
              onChange={handleProfileChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Update Profile
          </button>
        </form>
      </div>

      {/* Notification Settings */}
      <div className="card">
        <div className="card-header">🔔 Notifications</div>
        <form onSubmit={handleSettingsSubmit}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="email_notifications"
                checked={settings.email_notifications}
                onChange={handleSettingsChange}
                style={{ width: 'auto' }}
              />
              <span className="form-label" style={{ marginBottom: 0 }}>
                Enable email notifications
              </span>
            </label>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Receive alerts for renewals and unused subscriptions
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Renewal Reminder (days before)
            </label>
            <input
              type="number"
              name="renewal_reminder_days"
              className="form-input"
              value={settings.renewal_reminder_days}
              onChange={handleSettingsChange}
              min="1"
              max="30"
            />
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Get notified this many days before a subscription renews
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Unused Threshold (days)
            </label>
            <input
              type="number"
              name="unused_threshold_days"
              className="form-input"
              value={settings.unused_threshold_days}
              onChange={handleSettingsChange}
              min="30"
              max="365"
            />
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Mark subscriptions as unused if not used for this many days
            </p>
          </div>

          <button type="submit" className="btn btn-primary">
            Save Settings
          </button>
        </form>
      </div>

      {/* App Information */}
      <div className="card">
        <div className="card-header">ℹ️ About</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <strong>Version:</strong> 1.0.0
          </div>
          <div>
            <strong>Database:</strong> SQLite (Local)
          </div>
          <div>
            <strong>Privacy:</strong> All data stored locally on your server
          </div>
          <div style={{ 
            padding: '1rem',
            backgroundColor: '#EFF6FF',
            borderRadius: '0.375rem',
            color: '#1E40AF'
          }}>
            <strong>🔒 Self-Hosted & Private</strong>
            <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
              Your subscription data is stored locally and never shared with third parties.
              This app runs entirely on your infrastructure.
            </p>
          </div>
        </div>
      </div>

      {/* Email Configuration Info */}
      <div className="card">
        <div className="card-header">📧 Email Configuration</div>
        <div style={{ color: '#374151' }}>
          <p style={{ marginBottom: '1rem' }}>
            Email notifications require SMTP configuration in the backend .env file:
          </p>
          <div style={{ 
            backgroundColor: '#F3F4F6',
            padding: '1rem',
            borderRadius: '0.375rem',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            SMTP_HOST=smtp.gmail.com<br />
            SMTP_PORT=587<br />
            SMTP_USER=your-email@gmail.com<br />
            SMTP_PASS=your-app-password<br />
            EMAIL_FROM=noreply@subsoptimizer.local
          </div>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
            For Gmail, use an App Password instead of your regular password. 
            Visit your Google Account settings to create one.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
