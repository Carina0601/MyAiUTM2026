import React, {useState, useEffect} from 'react';
import './PatientMonitor.css';
import {db} from './firebase';
import {DataSnapshot, onValue, ref, update} from 'firebase/database';

const AmbulanceMonitor = () => {
    const [loading, setLoading] = useState(true);

    const [patients, setPatients] = useState({});

    useEffect(() => {
        const patientsRef = ref(db, 'patients');
        const unsubscribe = onValue(patientsRef, (snapshot) => {
            setPatients(snapshot.val() || {});
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const dispatchedList = Object.entries(patients).filter(([id, p]) => p.dispatchedAt);

    const completeMission = (id) =>{
        update(ref(db, `patients/${id}`), {
            dispatchedAt: null,
            crewNotes: null
        });
    };

    if (loading) return <div className='background'>Connecting to the Server...</div>

    return (
    <div className='background'>
      <div className="dashboard-container">
        <div className="page-title">
          <h1 style={{ fontSize: '22px', fontWeight: '550' }}>Active Dispatches</h1>
          <p style={{ fontSize: '16px', color: 'grey' }}>
            {dispatchedList.length} Ambulances currently en route
          </p>
        </div>

        <div className="grid-layout">
          {dispatchedList.length > 0 ? (
            dispatchedList.map(([id, p]) => (
              <div key={id} className="patient-card" style={{ borderColor: '#d32f2f' }}>
                <div className="spaced-between">
                  <h2 style={{ fontSize: '18px', margin: 0 }}>{p.name}</h2>
                  <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>PRIORITY 1</span>
                </div>
                
                <hr className="separator-h" />
                
                <div className="content-container">
                  <p style={{ fontSize: '12px', color: 'grey' }}>LOCATION</p>
                  <p style={{ fontSize: '15px', fontWeight: '550' }}>{p.addr}</p>
                </div>

                <div className="content-container" style={{ backgroundColor: '#fff5f5', padding: '10px', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#d32f2f', fontWeight: 'bold' }}>CREW NOTES</p>
                  <p style={{ fontSize: '14px', fontStyle: 'italic' }}>"{p.crewNotes || 'No notes provided'}"</p>
                </div>

                <div className="spaced-between" style={{ marginTop: '15px' }}>
                  <div className="flex-column">
                    <p style={{ fontSize: '11px', color: 'grey' }}>HEART RATE</p>
                    <p style={{ fontWeight: 'bold', color: '#d32f2f' }}>{p.heartRate} BPM</p>
                  </div>
                  <div className="flex-column">
                    <p style={{ fontSize: '11px', color: 'grey' }}>DISPATCHED AT</p>
                    <p style={{ fontWeight: 'bold' }}>{new Date(p.dispatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                <button 
                  onClick={() => completeMission(id)}
                  className="button" 
                  style={{ width: '100%', marginTop: '15px', backgroundColor: '#2e7d32' }}
                >
                  Confirm Arrival / Clear
                </button>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '50px' }}>
              <p style={{ color: 'grey', fontSize: '18px' }}>No active dispatches. All quiet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AmbulanceMonitor;
