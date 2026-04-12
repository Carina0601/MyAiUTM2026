// src/MonitorRun.jsx
import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { ref, onValue } from 'firebase/database';
import PatientMonitor from './PatientMonitor';
import './PatientMonitor.css'; 
import { seedDatabase } from './seed';

const MonitorRun = () => {
  const [patients, setPatients] = useState({});
  const [loading, setLoading] = useState(true);

  const critical = Object.entries(patients).filter(([, p]) => p.heartRate > 120 || p.heartRate < 60);
  const stable = Object.entries(patients).filter(([, p]) => p.heartRate <= 120 && p.heartRate >= 60);

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
    const patientsRef = ref(db, 'patients');
    const unsubscribe = onValue(patientsRef, (snapshot) => {
      setPatients(snapshot.val() || {});
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(()  => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (loading) return <div className="dashboard-container">Connecting...</div>;

  return (
    <div className='background'>

        <div className="dashboard-container">
          <div className ="page-title">
            <div style={{alignItems: 'center'}} className="spaced-between">
              <h1 style={{fontSize: '22px', fontWeight: '550'}}>Elderly Vital Signs Monitoring</h1>
              <button style={{backgroundColor: '#007bff'}} className="button"><span style={{fontSize: '20px'}}>+ </span> Add New Patient</button>
            </div>
              <p style={{fontSize: '16px', color: 'grey'}}>{Object.keys(patients).length} elderlies connected via Smart Ring</p>
          </div>

          <div className="empty-container">
            <p style={{fontSize: '20px', fontWeight: '550', color: '#2e7d32'}}>OVERVIEW</p>
                <div style={{width: '100%', gap: '20px', justifyContent: 'space-around'}} className='flex-row'>
                  <div style={{justifyContent: 'center', alignItems: 'center'}} className='flex-column'>
                    <p style={{fontSize: '11px', color: 'grey', letterSpacing: '0.05em'}}>TOTAL PATIENTS</p>
                    <p style={{fontSize: '20px', fontWeight: '600'}}>{Object.keys(patients).length}</p>
                  </div>
                  <div style={{justifyContent: 'center', alignItems: 'center', paddingRight: '50px'}} className='flex-column'>
                    <p style={{fontSize: '11px', color: 'grey', letterSpacing: '0.05em'}}>CRITICAL</p>
                    <p style={{fontSize: '20px', fontWeight: '600', color: critical.length > 0 ? '#d32f2f' : 'inherit'}}>{critical.length}</p>
                  </div>
                  <div style={{justifyContent: 'center', alignItems: 'center'}} className='flex-column'>
                    <p style={{fontSize: '11px', color: 'grey', letterSpacing: '0.05em'}}>STABLE</p>
                    <p style={{fontSize: '20px', fontWeight: '600', color: '#2e7d32'}}>{stable.length}</p>
                  </div>
                </div>
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

        <button style={{ marginTop: '20px', border: 'none', backgroundColor: 'black', color: 'white', fontWeight: '550', padding: '4px 15px', borderRadius: '10px'}} onClick={seedDatabase}>Test Data</button>
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