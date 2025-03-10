import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

function Dashboard({ user }) {
  const [fomoData, setFomoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const navigate = useNavigate();

  // Check if we're in manual testing mode
  useEffect(() => {
    if (user.authToken === 'manual-auth-token-for-testing') {
      setIsManualMode(true);
    }
  }, [user]);

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
        
        // If we're in manual testing mode, generate mock data
        if (isManualMode) {
          console.log('Using manual mode with mock data');
          setTimeout(() => {
            setFomoData({
              score: 7.5,
              did: user.did,
              data: {
                groups: 12,
                messages: 257,
                keywordMatches: {
                  totalCount: 15,
                  keywords: {
                    'cluster': 5,
                    'protocol': 8,
                    'ai': 2
                  }
                }
              }
            });
            setLoading(false);
          }, 1500); // Add a slight delay to simulate API call
          return;
        }
        
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

    if (user && user.did) {
      fetchFOMOscore();
    } else {
      setError('Missing authentication information. Please log in again.');
      setLoading(false);
    }
  }, [user, isManualMode]);

  // Log out user
  const handleLogout = () => {
    // Clear user data and redirect to login
    navigate('/');
    window.location.reload();
  };

  // Get score category based on FOMOscore value
  const getScoreCategory = (score) => {
    if (score < 3) return { category: 'Noob', description: 'You\'re quite content with missing out. Kudos!' };
    if (score < 6) return { category: 'Intern', description: 'You\'re occasionally worried about missing the action.' };
    if (score < 8) return { category: 'Associate', description: 'You\'re often concerned about missing important events.' };
    return { category: 'Pro', description: 'You can\'t stand the thought of missing anything!' };
  };

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card loading">
          <h2>Calculating your FOMOscore...</h2>
          <div className="spinner"></div>
          {isManualMode && (
            <p className="note">Developer Mode: Generating mock data</p>
          )}
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
  const hasKeywordMatches = fomoData?.data?.keywordMatches?.totalCount > 0;

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h1 className="title">Your FOMOscore</h1>
        
        <div className="user-info">
          <p className="did-info">Verida DID: <span className="did-value">{user.did}</span></p>
          {isManualMode && (
            <p className="dev-mode-indicator" style={{color: '#ff6b6b', marginTop: '8px', fontSize: '0.8rem'}}>
              Developer Mode: Using mock data
            </p>
          )}
        </div>
        
        {fomoData && (
          <div className="score-container">
            {/* Add warning if no Telegram data found */}
            {fomoData.data.groups === 0 && fomoData.data.messages === 0 && !isManualMode && (
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
            
            {/* Add Engage Bonus section */}
            <div className="engage-bonus">
              <h3 className="engage-title">Engage Bonus</h3>
              <p className="engage-description">
                How much you gossip about trending topics
              </p>
              
              <div className="keyword-count">
                <span className="keyword-total">{fomoData.data.keywordMatches?.totalCount || 0}</span>
                <span className="keyword-label">Total Matches</span>
              </div>
              
              {hasKeywordMatches && (
                <div className="keyword-breakdown">
                  {Object.entries(fomoData.data.keywordMatches.keywords).map(([keyword, count]) => (
                    <div key={keyword} className="keyword-item">
                      <span className="keyword-name">{keyword}</span>
                      <span className="keyword-badge">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
        
            <button className="button" onClick={handleLogout}>Log Out</button>
          </div>
        )}
      </div>
    </div>
  );
}

Dashboard.propTypes = {
  user: PropTypes.shape({
    did: PropTypes.string.isRequired,
    authToken: PropTypes.string.isRequired,
    tokenData: PropTypes.object
  }).isRequired
};

export default Dashboard;