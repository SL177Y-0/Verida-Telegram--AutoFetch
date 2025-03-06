import React from 'react';

function Login() {
  const authUrl = "https://app.verida.ai/auth?scopes=api%3Ads-query&scopes=ds%3Asocial-email&scopes=ds%3Ar%3Asocial-chat-group&scopes=ds%3Ar%3Asocial-chat-message&redirectUrl=http%3A%2F%2Flocalhost%3A5173&appDID=did%3Avda%3Amainnet%3A0x252ED26AbF3CfC4C962E46d02D7F999497029276";

  return (
    <div className="container">
      <h1>FOMOscore</h1>
      <p>Connect with Verida to see your Telegram FOMO score!</p>
      <a href={authUrl} className="button-3d">
        <img src="/Connect-Verida.png" alt="Connect with Verida" style={{ width: '200px', height: 'auto' }} />
      </a>
      <p>After connecting, sync your Telegram data in the Verida Vault at <a href="https://vault.verida.io" target="_blank">vault.verida.io</a>.</p>
      <p>Note: Copy the token from the sandbox page and set it in your browser's localStorage (e.g., localStorage.setItem('veridaToken', 'your-token-here')) for local testing.</p>
    </div>
  );
}

export default Login;