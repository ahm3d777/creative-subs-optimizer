import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">💰 Creative Subs Optimizer</div>
          
          <nav className="nav">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/subscriptions">Subscriptions</Link>
            <Link to="/analytics">Analytics</Link>
            <Link to="/settings">Settings</Link>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              borderLeft: '1px solid rgba(255,255,255,0.3)',
              paddingLeft: '1rem'
            }}>
              <span>{user?.email}</span>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
