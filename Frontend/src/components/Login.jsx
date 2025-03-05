import React, { useState } from 'react';
import { VaultAccount } from '@verida/account-web-vault';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/userSlice';
import { VERIDA_NETWORK, VERIDA_APP_NAME } from '../config';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleVeridaLogin = async () => {
    setLoading(true);
    try {
      const account = new VaultAccount({
        network: VERIDA_NETWORK,
        appName: VERIDA_APP_NAME,
        request: { logoUrl: 'https://your-app-logo.png' },
      });
      const did = await account.connect();
      dispatch(setUser({ did, type: 'verida' }));
      localStorage.setItem('userDID', did);
    } catch (error) {
      console.error('Verida login error:', error);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Login with Verida Wallet</h2>
      <button onClick={handleVeridaLogin} disabled={loading}>
        {loading ? 'Connecting...' : 'Connect Verida Wallet'}
      </button>
    </div>
  );
};

export default Login;