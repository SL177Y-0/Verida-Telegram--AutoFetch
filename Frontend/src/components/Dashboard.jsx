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
        
        // Log authentication information for debugging
        console.log('User authentication data:', {
          did: user.did,
          authToken: user.authToken?.substring(0, 10) + '...',
          hasTokenData: !!user.tokenData
        });
        
        // We now rely on the auth token to get the DID if needed
        if (!user.authToken) {
          setError('Missing Verida authentication token. Please try reconnecting with Verida.');
          setLoading(false);
          return;
        }
        
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/score`,
          {
            did: user.did,
            authToken: user.authToken
          }
        );
        
        // Update the user DID if it was retrieved on the server side
        if (response.data.did && (!user.did || user.did === 'unknown')) {
          console.log(`Server retrieved DID: ${response.data.did}`);
        }
        
        console.log('Received FOMO score data:', response.data);
        setFomoData(response.data);
      } catch (err) {
        console.error('Error fetching FOMOscore:', err);
        
        // Handle specific error cases
        if (err.response?.data?.error === 'Invalid DID') {
          setError('Invalid Verida DID. Please try reconnecting with Verida.');
        } else {
          setError(err.response?.data?.message || 'Failed to calculate your FOMOscore. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user && user.did && user.authToken) {
      fetchFOMOscore();
    } else {
      setError('Missing authentication information. Please log in again.');
      setLoading(false);
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
    if (score < 3) return { category: 'Low FOMO', description: 'You\'re quite content with missing out. Kudos!' };
    if (score < 6) return { category: 'Moderate FOMO', description: 'You\'re occasionally worried about missing the action.' };
    if (score < 8) return { category: 'High FOMO', description: 'You\'re often concerned about missing important events.' };
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
    // Check if the error is related to DID
    const isDIDError = error.includes('DID') || error.includes('Verida');
    
    return (
      <div className="dashboard-container">
        <div className="dashboard-card error">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          
          {isDIDError ? (
            <>
              <p className="error-help">
                This error is likely because we couldn't retrieve your Verida identity. 
                Make sure you have a Verida account and have granted the necessary permissions.
              </p>
              <button className="button primary" onClick={handleLogout}>Reconnect with Verida</button>
            </>
          ) : (
            <button className="button" onClick={handleLogout}>Try Again</button>
          )}
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
        
        <div className="user-info">
          <p className="did-info">Verida DID: <span className="did-value">{user.did}</span></p>
        </div>
        
        {fomoData && (
          <div className="score-container">
            {/* Add warning if no Telegram data found */}
            {fomoData.data.groups === 0 && fomoData.data.messages === 0 && (
              <div className="no-data-warning">
                <p>No Telegram data found in your Verida vault.</p>
                <p>Please sync your Telegram with Verida first by installing the Verida Wallet app.</p>
                <a href="https://www.verida.io/wallet" target="_blank" rel="noopener noreferrer" className="button secondary">
                  Get Verida Wallet
                </a>
              </div>
            )}
            
            <div className="score-circle">
              <span className="score-value">{fomoData.score}</span>
              <span className="score-scale">/10</span>
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