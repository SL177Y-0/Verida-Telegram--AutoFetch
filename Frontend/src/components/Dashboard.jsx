import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

function Dashboard({ user }) {
  const [fomoData, setFomoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch FOMOscore on component mount
  useEffect(() => {
    const fetchFOMOscore = async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/score`,
          {
            did: user.did,
            authToken: user.authToken
          }
        );
        
        setFomoData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching FOMOscore:', err);
        setError('Failed to fetch your FOMOscore. Please try again.');
        setLoading(false);
      }
    };

    if (user) {
      fetchFOMOscore();
    }
  }, [user]);

  // Log out user
  const handleLogout = () => {
    // Clear user data and redirect to login
    navigate('/');
    window.location.reload();
  };

  // Get score category based on FOMOscore value
  const getScoreCategory = (score) => {
    if (score < 10) return { category: 'Low FOMO', description: 'You\'re quite content with missing out. Kudos!' };
    if (score < 50) return { category: 'Moderate FOMO', description: 'You\'re occasionally worried about missing the action.' };
    if (score < 100) return { category: 'High FOMO', description: 'You\'re often concerned about missing important events.' };
    return { category: 'Extreme FOMO', description: 'You can\'t stand the thought of missing anything!' };
  };

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card loading">
          <h2>Calculating your FOMOscore...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card error">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button className="button" onClick={handleLogout}>Try Again</button>
        </div>
      </div>
    );
  }

  // Success state
  const scoreInfo = fomoData ? getScoreCategory(fomoData.score) : null;

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h1 className="title">Your FOMOscore</h1>
        
        {fomoData && (
          <div className="score-container">
            <div className="score-circle">
              <span className="score-value">{fomoData.score}</span>
            </div>
            <h2 className="score-category">{scoreInfo.category}</h2>
            <p className="score-description">{scoreInfo.description}</p>
            
            <div className="stats-container">
              <div className="stat-item">
                <span className="stat-label">Telegram Groups</span>
                <span className="stat-value">{fomoData.data.groups}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Telegram Messages</span>
                <span className="stat-value">{fomoData.data.messages}</span>
              </div>
            </div>
          </div>
        )}
        
        <button className="button" onClick={handleLogout}>Log Out</button>
      </div>
    </div>
  );
}
Dashboard.propTypes = {
  user: PropTypes.shape({
    did: PropTypes.string.isRequired,
    authToken: PropTypes.string.isRequired
  }).isRequired
};

export default Dashboard;