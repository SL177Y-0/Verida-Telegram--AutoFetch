import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('veridaToken');
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    if (!token) navigate('/');
    fetchScore();
  }, [navigate, token]);

  const fetchScore = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/score`, { token });
      setScoreData(res.data);
    } catch (error) {
      console.error(error);
      setScoreData({ error: 'Failed to load score. Ensure Telegram data is synced.' });
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('veridaToken');
    navigate('/');
  };

  return (
    <div className="container">
      <h1>Your FOMOscore</h1>
      {loading ? (
        <p>Loading...</p>
      ) : scoreData?.score ? (
        <>
          <p className="score">{scoreData.score.toFixed(1)}</p>
          <p>Groups: {scoreData.groups} | Messages: {scoreData.messages}</p>
          <button className="button-3d" onClick={fetchScore}>Refresh</button>
          <button className="button-3d" onClick={logout}>Logout</button>
        </>
      ) : (
        <p>{scoreData?.error || 'No data available'}</p>
      )}
    </div>
  );
}

export default Dashboard;