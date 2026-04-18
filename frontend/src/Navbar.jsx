import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';
import user from './assets/user.png';
import ambulanceIcon from './assets/ambulance.png';

const Navbar = () => {

  const navigate = useNavigate();
  const [isAmbulanceMode, setIsAmbulanceMode] = useState(false);

  const toggleMode = () => {
    setIsAmbulanceMode(prev => !prev);

    if (isAmbulanceMode) {
      navigate('/');
    } else {
      navigate('/ambulance');
    }
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  const timeString = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const dateString = currentTime.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className='top-navigation-container'
      style={{
        borderBottom: `3px solid ${isAmbulanceMode ? '#d32f2f' : '#3f67bf'}`
      }}
    >

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <img style={{ width: '100px' }} src={logo} alt="Logo" />
      </div>

      <div className='options-container'>

        {!isAmbulanceMode && (
          <>
            <NavLink to="/" className="options">
              Hospital Dashboard
            </NavLink>

            <NavLink to="/summary" className="options">
              AI Summary
            </NavLink>

            <NavLink to="/notification" className="options">
              Notification
            </NavLink>
          </>
        )}

        {isAmbulanceMode && (
          <>
            <NavLink to="/ambulance" className="options">
              Dispatch Queue
            </NavLink>

            <NavLink to="/speech" className="options">
              Speech Input
            </NavLink>

            <NavLink to="/summary" className="options">
              AI Summary
            </NavLink>

            <NavLink to="/notification" className="options">
              Notification
            </NavLink>
          </>
        )}

      </div>

      <div
        style={{
          width: '25%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'grey'
        }}
      >
        <div className="pulse-dot"></div>
        <span style={{ fontSize: '14px' }}>Live Connection -</span>
        <p style={{ fontSize: '14px' }}>{timeString}</p>
        <p style={{ fontSize: '14px' }}>{dateString}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '10px', margin: 0, color: 'grey' }}>
            CURRENT MODE
          </p>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              margin: 0,
              color: isAmbulanceMode ? '#d32f2f' : '#3f67bf'
            }}
          >
            {isAmbulanceMode ? 'EMERGENCY RESPONSE' : 'HOSPITAL SYSTEM'}
          </p>
        </div>

        <img
          onClick={toggleMode}
          className='mode-toggle-button'
          src={isAmbulanceMode ? ambulanceIcon : user}
          alt="Mode Toggle"
          style={{
            width: '70px',
            border: `2px solid ${isAmbulanceMode ? '#d32f2f' : '#3f67bf'}`,
            borderRadius: '50%',
            padding: '4px',
            cursor: 'pointer'
          }}
        />
      </div>

    </div>
  );
};

export default Navbar;