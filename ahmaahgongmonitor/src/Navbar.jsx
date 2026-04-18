import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import logo from './assets/logo.png';
import user from './assets/user.png';
import ambulanceIcon from './assets/ambulance.png'

const Navbar = () => {

    const navigate = useNavigate();
    const location = useLocation();

    const isAmbulanceMode = location.pathname !== '/';

    const [currentTime, setCurrentTime] = useState(new Date());
    
    const toggleMode = () => {
      if (isAmbulanceMode){
        navigate('/');
      } else {
        navigate('/ambulance');
      }
    };
    
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

//     return (

//         <div className='top-navigation-container'>
//           <img style={{height: 'auto', width: '115px'}} src={logo} alt="Logo"></img>
//           {/* <p style={{fontSize: '30px' ,fontWeight: '550', color: 'rgb(63,103,191)', }}>Ahma Ahgong Monitor</p> */}

//           <div className='options-container'>
//             <NavLink to="/" className={({isActive}) => (isActive ? 'options active' : 'options')}>
//                 Hospital Live Monitoring
//             </NavLink>
//             <NavLink to="/speech" className={({isActive}) => (isActive ? 'options active' : 'options')}>
//                 Ambulance Queue
//             </NavLink>
//             {/* <NavLink to="/summary" className={({isActive}) => (isActive ? 'options active' : 'options')}>
//                 AI Summary
//             </NavLink> */}
//           </div>

//           <div style={{display: 'flex', alignItems: 'center', gap: '10px', color: 'grey'}}>
//                 <div className="pulse-dot"></div>
//                   <span>Live Connection -</span>
//                   <p>{timeString}</p>
//                   <p>{dateString}</p>
//             </div>

//           {/* <img className='profile-pic' src={user} alt="User"></img> */}
//           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//             <div style={{ textAlign: 'right' }}>
//               <p style={{ fontSize: '10px', color: 'grey', margin: 0, lineHeight: '1' }}>MODE</p>
//               <p style={{ 
//                 fontSize: '12px', 
//                 fontWeight: 'bold', 
//                 margin: 0, 
//                 color: isAmbulanceContext ? '#d32f2f' : '#2e7d32' 
//               }}>
//                 {isAmbulanceContext ? 'AMBULANCE' : 'HOSPITAL'}
//               </p>
//             </div>
//             <img 
//               className='profile-pic' 
//               src={isAmbulanceContext ? ambulance : user} 
//               alt="Context Indicator" 
//               style={{
//                 border: `2px solid ${isAmbulanceContext ? '#d32f2f' : '#2e7d32'}`,
//                 padding: '2px',
//                 borderRadius: '50%',
//                 transition: 'all 0.3s ease'
//               }}
//             />
//           </div>
//         </div>
//         // </div>
//   );
// };

// export default Navbar;

return (
    <div className='top-navigation-container' style={{ borderBottom: `3px solid ${isAmbulanceMode ? '#d32f2f' : '#3f67bf'}` }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <img style={{ height: 'auto', width: '100px' }} src={logo} alt="Logo" />
      </div>

      <div className='options-container'>
        {!isAmbulanceMode ? (
          <>
            <NavLink to="/" className={({isActive}) => (isActive ? 'options active' : 'options')} style={{justifyContent: 'flexStart'}}>
               Hospital Dashboard
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/ambulance" className={({isActive}) => (isActive ? 'options active' : 'options')}>
               Dispatch Queue
            </NavLink>
            <NavLink to="/speech/current" className="options">Speech Input</NavLink>
            <NavLink to="/summary/current" className="options">AI Summary</NavLink>
          </>
        )}
      </div>

      <div style={{width: '25%', display: 'flex', alignItems: 'center', gap: '10px', color: 'grey'}}>
        <div className="pulse-dot"></div>
          <span style={{fontSize: '14px'}}>Live Connection -</span>
          <p style={{fontSize: '14px'}}>{timeString}</p>
          <p style={{fontSize: '14px'}}>{dateString}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
         <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '10px', margin: 0, color: 'grey' }}>CURRENT DEPT</p>
            <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0, color: isAmbulanceMode ? '#d32f2f' : '#3f67bf' }}>
               {isAmbulanceMode ? 'EMERGENCY RESPONSE' : 'HOSPITAL MONITORING'}
            </p>
         </div>
         <img onClick={toggleMode}
            className='mode-toggle-button' 
            src={isAmbulanceMode ? ambulanceIcon : user} 
            alt="User" 
            style={{width: '70px', borderColor: isAmbulanceMode ? '#d32f2f' : '#3f67bf' }}
         />
      </div>
    </div>
  );
};

export default Navbar;