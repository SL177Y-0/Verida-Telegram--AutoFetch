import React, { useState, useEffect } from 'react';
import { VaultAccount } from '@verida/account-web-vault';
import axios from 'axios';
import { VERIDA_NETWORK, VERIDA_APP_NAME } from '../config';

const TelegramConnect = ({ did }) => {
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.Telegram.Login.auth(
        {
          bot_id: 'FomoScoreBot',
          request_access: true,
          onAuth: async (user) => {
            await handleAuth(user.id);
          },
        },
        process.env.REACT_APP_TELEGRAM_API_ID
      );
    };

    return () => document.body.removeChild(script);
  }, []);

  const handleAuth = async (chatId) => {
    setConnecting(true);
    try {
      const vault = new VaultAccount({
        network: VERIDA_NETWORK,
        appName: VERIDA_APP_NAME,
      });
      await vault.connect();
      const userDid = did || vault.getDid();
      localStorage.setItem('userDID', userDid);

      await axios.post('http://localhost:5000/api/telegram/connect', {
        did: userDid,
        chatId,
      });
      alert('Telegram connected successfully. Refresh to update score.');
    } catch (error) {
      console.error('Error connecting Telegram:', error);
      alert('Failed to connect Telegram');
    }
    setConnecting(false);
  };

  return (
    <div>
      <div
        id="telegram-login"
        data-onauth="handleAuth"
        data-bot-id="FomoScoreBot"
        data-request-access="write"
        data-size="large"
        data-lang="en"
      ></div>
      {connecting && <p>Connecting...</p>}
    </div>
  );
};

export default TelegramConnect;