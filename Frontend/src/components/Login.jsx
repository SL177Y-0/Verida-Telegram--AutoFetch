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
    
    // If Verida authentication successful, set user and redirect to dashboard
    if (did && authToken) {
      setUser({ did, authToken });
      navigate('/dashboard');
    }
  }, [location, setUser, navigate]);

  const connectWithVerida = () => {
    // Use the exact URL from your project documentation with just the redirectUrl modified
    const redirectUrl = encodeURIComponent(window.location.origin);
    const authUrl = `https://app.verida.ai/auth?scopes=api%3Ads-query&scopes=api%3Allm-agent-prompt&scopes=api%3Asearch-universal&scopes=ds%3Asocial-email&scopes=api%3Asearch-chat-threads&scopes=api%3Asearch-ds&scopes=api%3Allm-profile-prompt&scopes=ds%3Ar%3Asocial-chat-message&scopes=ds%3Ar%3Asocial-chat-group&redirectUrl=https%3A%2F%2Fadmin.verida.ai%2Fsandbox%2Ftoken-generated&appDID=did%3Avda%3Amainnet%3A0x87AE6A302aBf187298FC1Fa02A48cFD9EAd2818D`;
    
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
