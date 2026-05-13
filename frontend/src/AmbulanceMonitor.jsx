import React, { useState, useEffect } from 'react';
import './PatientMonitor.css';
import { db } from './firebase';
import { onValue, ref, update } from 'firebase/database';
import check from './assets/check.png';
import EmergencyMap from './EmergencyMap';

const AmbulanceMonitor = () => {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState({});
  const [hospitals, setHospitals] = useState({});
  const [status, setModal] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [currentNotes, setCurrentNotes] = useState("");
 
  const [activeMapData, setActiveMapData] = useState({ patient: null, hospital: null });

  // const [missionData, setMissionData] = useState({
  //     status: "Waiting for Dispatch..",
  //     progress: 0,
  //     eta: 0,
  //     distance: 0
  // });

  const [missionDataMap, setMissionDataMap] = useState({});
  const activeMission = missionDataMap[activeMapData?.id] || { status: '', progress: 0, eta: 0, distance: 0 };

  useEffect(() => {
    const patientsRef = ref(db, 'patients');
    const unsubscribePatients = onValue(patientsRef, (snapshot) => {
      setPatients(snapshot.val() || {});
      setLoading(false);
    });

    const hospitalRef = ref(db, 'medicalCenters');
    const unsubscribeHospitals = onValue(hospitalRef, (snapshot) => {
      setHospitals(snapshot.val() || {});
    })

    return () => {
      unsubscribePatients();
      unsubscribeHospitals();
    };
  }, []);

  const dispatchedList = Object.entries(patients).filter(([id, p]) => p.dispatchedAt);

  const fcfsQueue = [...dispatchedList].sort((a, b) => new Date(a[1].dispatchedAt) - new Date(b[1].dispatchedAt));

  const handleStartNavigation = (id, patientData) => {
    const targetHospital = {
      name: patientData.targetHospital || "General Hospital",
      lat: patientData.targetHospitalLat,
      lng: patientData.targetHospitalLng
    };

    if (!targetHospital.lat || !targetHospital.lng) {
      alert("Error: No hospital coordinates saved for this patient.");
      return;
    }
    
    setActiveMapData({ id, patient: patientData, hospital: targetHospital });
    setModal('navigate-map');
  };

  const completeMission = (id) => {
    update(ref(db, `patients/${id}`), {
      status: 'stable',
      dispatchedAt: null,
      crewNotes: null,
      heartRate: 75,
      spo2: 98,
      resp: 16
    }).then(() => {
      setModal('clear-success');
      setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          setModal(null);
          setIsClosing(false);
        }, 500);
      }, 2000);
    });
  };

  const handleStartDrive = (id) => {
    update(ref(db, `patients/${id}`), {
      status: 'dispatched',
      dispatchedAt: new Date().toISOString(),
      crewNotes: currentNotes || "none"
    });
    setCurrentNotes("");
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
                  <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                    PRIORITY {fcfsQueue.findIndex(([qId]) => qId === id) + 1}
                  </span>
                </div>
                
                <hr className="separator-h" />
                
                <div className="content-container">
                  <p style={{ fontSize: '12px', color: 'grey' }}>LOCATION</p>
                  <p style={{ fontSize: '15px', fontWeight: '550' }}>{p.addr}</p>
                </div>

                {p.crewNotes && (
                  <div className="content-container" style={{ marginTop: '10px' }}>
                    <p style={{ fontSize: '12px', color: 'grey' }}>CREW NOTES</p>
                    <p style={{ fontSize: '14px', fontStyle: 'italic' }}>{p.crewNotes}</p>
                  </div>
                )}

                <div className="spaced-between" style={{ marginTop: '15px' }}>
                  <div className="flex-column">
                    <p style={{ fontSize: '11px', color: 'grey' }}>STATUS</p>
                    <p style={{ fontWeight: 'bold', color: '#2e7d32' }}>EN ROUTE</p>
                  </div>
                </div>

                <div style={{ display: 'flex', marginTop: '15px', gap: '20px' }}>
                  <button 
                    onClick={() => handleStartNavigation(id, p)} 
                    className="button"
                    style={{ flex: '1', backgroundColor: '#007bff', color: 'white', border: 'none' }}
                  >
                    Open Live Map
                  </button>

                  <button 
                    onClick={() => completeMission(id)} 
                    className="button" 
                    style={{ flex: '1', backgroundColor: '#2e7d32', color: 'white', border: 'none' }}
                  >
                    Clear Mission
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '50px' }}>
              <p style={{ color: 'grey', fontSize: '18px' }}>No active dispatches. All quiet.</p>
            </div>
          )}
        </div>
      </div>

      {status === 'clear-success' && (
        <div className={`overlay-background ${isClosing ? 'hide' : ''}`}>
          <div className="add-success-popup">
              <img style={{height: 'auto', width: '115px'}} src={check} alt="Check"></img>
                <h3 style={{ fontSize: '18px' }}>Mission Cleared</h3>
                <p style={{ color: 'grey', fontSize: '14px' }}>Ambulance successfully arrived and patient stabilized.</p>
          </div>
        </div>
      )}

      {status === 'navigate-map' && (
        <div className={`overlay-background ${isClosing ? 'hide' : ''}`}>
          <div className="navigate-map-popup" style={{ position: 'relative'}}>
              <button className="close-cross" onClick={() => setModal(null)}>&times;</button>
              <div style={{ 
                borderRadius: '28px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
                border: '1px solid #f1f5f9',
                background: '#fff',
                paddingTop: '20px'
              }}>
                <EmergencyMap 
                  patientHome={{ 
                    lat: patients[activeMapData.id]?.lat || activeMapData.patient.lat, 
                    lng: patients[activeMapData.id]?.lng || activeMapData.patient.lng 
                  }}
                  hospitalBase={activeMapData.hospital} 
                  dispatchedAt={patients[activeMapData.id]?.dispatchedAt}
                  onStatusChange={(data) => setMissionDataMap(prev => ({ ...prev, [activeMapData.id]: data }))}
                />
              </div>
              <div style={{ display: 'flex', paddingTop: '15px', gap: '20px'}}>
                <div style={{ display: 'flex', paddingTop: '15px', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <p style={{ fontWeight: 550, color: '#007bff' }}>Destination</p>
                    <p>{activeMission.progress < 50 ? activeMapData.patient?.addr : activeMapData.hospital?.name}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <p style={{ fontWeight: 550, color: '#007bff' }}>Estimated Arrival</p>
                    <p>{activeMission.eta || '—'}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <p style={{ fontWeight: 550, color: '#007bff' }}>Distance Remaining</p>
                    <p>{activeMission.distance || '—'} km</p>
                  </div>
                </div>
              </div>       
          </div>
        </div>
      )}
    </div>
  );
};

export default AmbulanceMonitor;