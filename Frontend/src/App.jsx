import React from 'react';
import { useSelector } from 'react-redux';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const App = () => {
  const { did } = useSelector((state) => state.user);

  return (
    <div>
      <h1>Telegram-Verida FOMOscore App</h1>
      {did ? <Dashboard /> : <Login />}
    </div>
  );
};

export default App;