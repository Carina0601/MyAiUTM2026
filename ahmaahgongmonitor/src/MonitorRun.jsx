// src/MonitorRun.jsx
import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { ref, onValue } from 'firebase/database';
import PatientMonitor from './PatientMonitor';
import './PatientMonitor.css'; 
import logo from './assets/logo.png';
import user from './assets/user.png';
import { seedDatabase } from './seed';

const MonitorRun = () => {
  const [patients, setPatients] = useState({});
  const [loading, setLoading] = useState(true);

  const critical = Object.entries(patients).filter(([, p]) => p.heartRate > 120 || p.heartRate < 60);
  const stable = Object.entries(patients).filter(([, p]) => p.heartRate <= 120 && p.heartRate >= 60);

  useEffect(() => {
    const patientsRef = ref(db, 'patients');
    const unsubscribe = onValue(patientsRef, (snapshot) => {
      setPatients(snapshot.val() || {});
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="dashboard-container">Connecting...</div>;

  return (
    <div className='background'>
        <div className='top-navigation-container'>
          <img style={{height: 'auto', width: '115px'}} src={logo} alt="Logo" />
          {/* <p style={{fontSize: '30px' ,fontWeight: '550', color: 'rgb(63,103,191)', }}>Ahma Ahgong Monitor</p> */}
          <img className='profile-pic' src={user} alt="User"></img>
        </div>
        <div className="dashboard-container">
          <div className ="page-title">
            <div className='spaced-between'>
              <h1 style={{fontSize: '22px', fontWeight: '550'}}>Elderly Vital Signs Monitoring</h1>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', color: 'grey'}}>
                <div className="pulse-dot"></div>
                  <span>Live Connection -</span>
                  <p>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p>({new Date().toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'})})</p>
              </div>
            </div>
            <p style={{fontSize: '16px', color: 'grey'}}>{Object.keys(patients).length} elderlies connected via Smart Ring</p>
          </div>

        {critical.length > 0 && (
          <>
            <div style={{color: '#d32f2f', fontSize: '16px', fontWeight: '550', marginBottom: '15px'}}>
              CRITICAL PATIENTS — {critical.length}
            </div>
            <div className="grid-layout" style={{marginBottom: '30px'}}>
              {critical.map(([id, p]) => (
                <PatientMonitor key={id} id={id} p={p} />  
              ))}
            </div>
          </>
        )}

        <div style={{color: 'grey', fontSize: '16px', fontWeight: '550', marginBottom: '15px'}}>
          STABLE PATIENTS
        </div>
        <div className="grid-layout">
          {stable.map(([id, p]) => (
            <PatientMonitor key={id} id={id} p={p} /> 
          ))}
        </div>

        <button onClick={seedDatabase}>Seed DB</button>
      </div>
    </div>

  );
};

          {/* <div style={{ color: 'grey', fontSize: '16px' ,fontWeight: '550', marginBottom: '15px' }}>STABLE PATIENTS</div>
          <div className="grid-layout">
                {Object.keys(patients).map((id) => (
                <PatientMonitor key={id} p={patients[id]} />
                ))}
          </div>
        </div>
    </div>
  );
}; */}

export default MonitorRun;