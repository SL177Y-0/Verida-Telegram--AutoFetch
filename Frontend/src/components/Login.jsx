import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

function Login({ setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [manualDid, setManualDid] = useState('');
  const [manualMode, setManualMode] = useState(false);

  // Parse URL parameters after Verida authentication
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const did = searchParams.get('did');
    const authToken = searchParams.get('authToken');
    const tokenParam = searchParams.get('token');
    const errorParam = searchParams.get('error');
    const errorMessage = searchParams.get('message');
    
    // Check for error state
    if (errorParam) {
      console.error('Authentication error:', errorParam, errorMessage);
      setError(errorMessage || 'Failed to authenticate with Verida. Please try again.');
      return;
    }

    // First check for direct params from our backend
    if (did && authToken) {
      console.log('Authentication successful from URL params:', { did, authToken: authToken.substring(0, 10) + '...' });
      setUser({ did, authToken });
      navigate('/dashboard');
      return;
    }
    
    // Try to parse token if available (direct from Verida)
    if (tokenParam) {
      try {
        const tokenData = JSON.parse(tokenParam);
        console.log('Authentication successful from token data:', tokenData);
        
        // Extract DID and token based on Verida's structure
        let extractedDid, extractedToken;
        
        if (tokenData.token) {
          extractedDid = tokenData.token.did;
          extractedToken = tokenData.token._id || tokenData.token;
        } else if (tokenData.did) {
          extractedDid = tokenData.did;
          extractedToken = tokenData._id;
        }
        
        if (extractedDid && extractedToken) {
          setUser({ 
            did: extractedDid, 
            authToken: extractedToken,
            tokenData: tokenData
          });
          navigate('/dashboard');
          return;
        } else {
          setError('Incomplete authentication data received. Please try again.');
        }
      } catch (err) {
        console.error('Error parsing token data:', err);
        setError('Failed to process authentication data. Please try again.');
      }
    }
  }, [location, setUser, navigate]);

  const connectWithVerida = () => {
    // Set the redirect URL to our backend callback endpoint
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const callbackUrl = `${backendUrl}/auth/callback`;
    
    // Use the auth URL format from the sandbox example
    const authUrl = `https://app.verida.ai/auth?scopes=api%3Ads-query&scopes=api%3Asearch-universal&scopes=ds%3Asocial-email&scopes=api%3Asearch-ds&scopes=api%3Asearch-chat-threads&scopes=ds%3Ar%3Asocial-chat-group&scopes=ds%3Ar%3Asocial-chat-message&redirectUrl=${encodeURIComponent(callbackUrl)}&appDID=did%3Avda%3Amainnet%3A0x87AE6A302aBf187298FC1Fa02A48cFD9EAd2818D`;
    
    console.log('Redirecting to Verida auth:', authUrl);
    window.location.href = authUrl;
  };
  
  const toggleManualMode = () => {
    setManualMode(!manualMode);
  };
  
  const handleManualLogin = () => {
    if (manualDid) {
      setUser({ 
        did: manualDid,
        authToken: 'manual-auth-token-for-testing'  // A placeholder token
      });
      navigate('/dashboard');
    } else {
      setError('Please enter a valid DID');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="title">FomoScore</h1>
        <p className="subtitle">Score based on your Telegram activity</p>
        <button className="verida-button" onClick={connectWithVerida}>
          <img src="/Connect-Verida.png" alt="Connect with Verida" />
        </button>
        <p className="note">
          Note: You must sync your Telegram data in your Verida Vault before using this app.
        </p>
        {error && <p className="error">{error}</p>}
        
        {/* Developer mode toggle */}
        <div className="developer-toggle">
          <button 
            className="text-button" 
            onClick={toggleManualMode}
            style={{ 
              background: 'none', 
              border: 'none', 
              textDecoration: 'underline', 
              color: '#666',
              fontSize: '0.8rem',
              marginTop: '20px',
              cursor: 'pointer'
            }}
          >
            {manualMode ? 'Hide Developer Mode' : 'Developer Mode'}
          </button>
        </div>
        
        {/* Manual DID entry for developers */}
        {manualMode && (
          <div className="manual-token-section">
            <h3>Manual DID Entry</h3>
            <p>For testing purposes only:</p>
            <input
              type="text"
              value={manualDid}
              onChange={(e) => setManualDid(e.target.value)}
              placeholder="Enter your Verida DID"
              className="token-input"
            />
            <button 
              className="button"
              onClick={handleManualLogin}
              style={{ marginTop: '10px' }}
            >
              Continue with Manual DID
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

Login.propTypes = {
  setUser: PropTypes.func.isRequired,
};

export default Login;