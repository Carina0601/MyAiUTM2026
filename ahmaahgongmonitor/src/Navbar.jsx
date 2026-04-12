import React from 'react';
import { Link } from 'react-router-dom';
import logo from './assets/logo.png';
import user from './assets/user.png';

const Navbar = () => {
  return (

        <div className='top-navigation-container'>
          <img style={{height: 'auto', width: '115px'}} src={logo} alt="Logo"></img>
          {/* <p style={{fontSize: '30px' ,fontWeight: '550', color: 'rgb(63,103,191)', }}>Ahma Ahgong Monitor</p> */}

          <div className='options-container'>
            <Link to="/" className='options'>Live Monitoring</Link>
            <Link to="/speech" className='options'>Speech to Text Function</Link>
            <Link to="/summary" className='options'>AI Summary</Link>
          </div>

          <img className='profile-pic' src={user} alt="User"></img>
        </div>
  );
};

export default Navbar;