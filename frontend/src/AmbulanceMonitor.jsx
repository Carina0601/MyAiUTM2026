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
      liveStatus: null,
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
                    <p style={{ 
                      fontWeight: 'bold', 
                      color: p.liveStatus?.includes('Arrived') ? '#2e7d32' : '#d32f2f',
                      textTransform: 'uppercase' 
                    }}>
                      {p.liveStatus || 'EN ROUTE'}
                    </p>
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
        <div className="overlay-background">
          <div className="navigate-map-popup" style={{ 
            position: 'relative', 
            maxWidth: '850px', 
            width: '95%', 
            backgroundColor: '#f1f5f9', 
            padding: '24px', 
            borderRadius: '28px', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            maxHeight: '620px'
          }}>

            <button className="close-cross" style={{cursor: 'pointer', fontSize: '24px', position:'absolute', top:'15px', right:'20px', border:'none', background:'none'}} onClick={() => setModal(null)}>&times;</button>
            

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: '#ef4444', 
                borderRadius: '50%', 
                boxShadow: '0 0 10px #ef4444',
                animation: 'pulse 1.5s infinite ease-in-out' 
              }}></div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#0f172a' }}>Live Mission Tracker: {patients[activeMapData.id]?.name || activeMapData.patient?.name || "Patient"}</h2>
            </div>

            <div style={{ borderRadius: '20px', overflow: 'hidden', height: '380px', background: '#fff', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <EmergencyMap 
                patientHome={{ 
                  lat: patients[activeMapData.id]?.lat || activeMapData.patient.lat, 
                  lng: patients[activeMapData.id]?.lng || activeMapData.patient.lng 
                }}
                hospitalBase={activeMapData.hospital} 
                dispatchedAt={patients[activeMapData.id]?.dispatchedAt}
                onStatusChange={(data) => {
                  setMissionDataMap(prev => ({ ...prev, [activeMapData.id]: data }));
                  if (data.status && data.status !== patients[activeMapData.id]?.liveStatus) {
                    update(ref(db, `patients/${activeMapData.id}`), { liveStatus: data.status });
                  }
                }}
              />
            </div>

            <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '20px', border: '1px solid #cbd5e1', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>MISSION PROGRESS</span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#2563eb' }}>{Number(activeMission.progress).toFixed(2)}%</span>
              </div>
              <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${activeMission.progress}%`, 
                  height: '100%', 
                  backgroundColor: '#2563eb',
                  transition: 'width 1s ease-in-out'
                }}></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ background: '#fff', padding: '14px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
                <p style={{fontSize: '10px', fontWeight: '800', color: '#94a3b8', margin: '0 0 4px 0'}}>DESTINATION</p>
                <p style={{fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: 0}}>
                  {activeMission.progress < 50 ? 'Patient Location' : 'Hospital'}
                </p>
              </div>
              <div style={{ background: '#fff', padding: '14px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
                <p style={{fontSize: '10px', fontWeight: '800', color: '#94a3b8', margin: '0 0 4px 0'}}>EST. ARRIVAL</p>
                <p style={{fontSize: '14px', fontWeight: '700', color: '#2563eb', margin: 0}}>{activeMission.eta || '--:--'}</p>
              </div>
              <div style={{ background: '#fff', padding: '14px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
                <p style={{fontSize: '10px', fontWeight: '800', color: '#94a3b8', margin: '0 0 4px 0'}}>DISTANCE</p>
                <p style={{fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: 0}}>{activeMission.distance || '0'} km</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'none', visibility: 'hidden', height: 0, width: 0, overflow: 'hidden' }}>
        {dispatchedList.map(([id, p]) => (
          <EmergencyMap 
            key={`tracker-${id}`}
            patientHome={{ lat: p.lat, lng: p.lng }}
            hospitalBase={{ lat: p.targetHospitalLat, lng: p.targetHospitalLng }} 
            dispatchedAt={p.dispatchedAt}
            onStatusChange={(data) => {
              setMissionDataMap(prev => ({ ...prev, [id]: data }));

              if (data.status && data.status !== p.liveStatus) {
                update(ref(db, `patients/${id}`), { liveStatus: data.status });
              }
            } }
          />
        ))}
      </div>
    </div>
  );
};

export default AmbulanceMonitor;