import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import logo from './assets/logo.png';
import user from './assets/user.png';

const Navbar = () => {

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

    useEffect(()  => {
        const timer = setInterval(() => {
          setCurrentTime(new Date());
        }, 1000);
    
        return () => clearInterval(timer);
      }, []);

    return (

        <div className='top-navigation-container'>
          <img style={{height: 'auto', width: '115px'}} src={logo} alt="Logo"></img>
          {/* <p style={{fontSize: '30px' ,fontWeight: '550', color: 'rgb(63,103,191)', }}>Ahma Ahgong Monitor</p> */}

          <div className='options-container'>
            <NavLink to="/" className={({isActive}) => (isActive ? 'options active' : 'options')}>
                Live Monitoring
            </NavLink>
            <NavLink to="/speech" className={({isActive}) => (isActive ? 'options active' : 'options')}>
                Speech to Text Function
            </NavLink>
            <NavLink to="/summary" className={({isActive}) => (isActive ? 'options active' : 'options')}>
                AI Summary
            </NavLink>
          </div>

          <div style={{display: 'flex', alignItems: 'center', gap: '10px', color: 'grey'}}>
                <div className="pulse-dot"></div>
                  <span>Live Connection -</span>
                  <p>{timeString}</p>
                  <p>{dateString}</p>
            </div>

          <img className='profile-pic' src={user} alt="User"></img>
        </div>
  );
};

export default Navbar;