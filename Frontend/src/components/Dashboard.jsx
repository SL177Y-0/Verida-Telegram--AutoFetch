import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearUser } from '../redux/userSlice';
import TelegramConnect from './TelegramConnect'; // Assume this exists in components

const Dashboard = () => {
  const { did } = useSelector((state) => state.user);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchScore = async () => {
      if (did) {
        setLoading(true);
        try {
          const response = await fetch(`/api/telegram/score/${did}`, {
            headers: { 'Content-Type': 'application/json' },
          });
          const data = await response.json();
          setScore(data);
        } catch (error) {
          console.error('Error fetching score:', error);
        }
        setLoading(false);
      }
    };
    fetchScore();
  }, [did]);

  const handleLogout = () => {
    dispatch(clearUser());
    localStorage.removeItem('userDID');
  };

  return (
    <div>
      <h2>Dashboard</h2>
      {!did && <p>Please log in with Verida Wallet.</p>}
      {did && (
        <div>
          {loading && <p>Loading score...</p>}
          {score && (
            <div>
              <p>FOMO Score: {score.score}</p>
              <p>Title: {score.title}</p>
            </div>
          )}
          <button onClick={handleLogout}>Logout</button>
          <TelegramConnect />
        </div>
      )}
    </div>
  );
};

export default Dashboard;