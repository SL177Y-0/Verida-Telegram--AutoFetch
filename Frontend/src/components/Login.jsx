import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

function Login({ setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Parse URL parameters after Verida authentication
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const did = searchParams.get('did');
    const authToken = searchParams.get('authToken');
    const tokenParam = searchParams.get('token');
    
    // Try to parse token if available
    if (tokenParam) {
      try {
        const tokenData = JSON.parse(tokenParam);
        console.log('Authentication successful from token data:', tokenData);
        setUser({ 
          did: tokenData.token.did, 
          authToken: tokenData.token._id,
          tokenData: tokenData.token
        });
        navigate('/dashboard');
        return;
      } catch (err) {
        console.error('Error parsing token data:', err);
      }
    }
    
    // If Verida authentication successful from URL params
    if (did && authToken) {
      console.log('Authentication successful from URL params:', { did, authToken });
      setUser({ did, authToken });
      navigate('/dashboard');
    }
  }, [location, setUser, navigate]);

  const connectWithVerida = () => {
    // Set the redirect URL to our backend callback endpoint
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const callbackUrl = `${backendUrl}/auth/callback`;
    
    // Use the comprehensive Verida authentication URL with all required scopes and our callback
    const authUrl = `https://app.verida.ai/auth?scopes=api%3Ads-query&scopes=api%3Asearch-universal&scopes=ds%3Asocial-email&scopes=api%3Asearch-ds&scopes=api%3Asearch-chat-threads&scopes=ds%3Ar%3Asocial-chat-group&scopes=ds%3Ar%3Asocial-chat-message&redirectUrl=${encodeURIComponent(callbackUrl)}&appDID=did%3Avda%3Amainnet%3A0x87AE6A302aBf187298FC1Fa02A48cFD9EAd2818D`;
    
    console.log('Redirecting to Verida auth:', authUrl);
    window.location.href = authUrl;
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
      </div>
    </div>
  );
}

Login.propTypes = {
  setUser: PropTypes.func.isRequired,
};

export default Login;
