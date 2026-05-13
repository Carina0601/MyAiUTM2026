import React, { useState, useEffect } from 'react';
import './PatientMonitor.css'; 
import user from './assets/user.png';
import { db } from './firebase';
import { ref, update, onValue } from 'firebase/database';
import ambulance from './assets/ambulance.png';
import EmergencyMap from './EmergencyMap';

const stablePath = `M0,36 C15,36 25,36 38,36 C44,36 46,32 49,32 C51,32 52,36 53,36 C55,36 57,34 60,22 C62,14 63,8 65,5 C66,3 67,4 68,9 C70,18 72,42 74,46 C75,48 77,44 79,40 C82,37 86,36 95,36 C108,36 118,39 132,39 C146,39 156,37 168,36 C220,36 270,36 320,36`;
const critPath = `M0,36 C10,36 20,36 30,36 C35,36 37,30 39,30 C41,30 42,36 43,36 C45,36 47,28 49,10 C50,3 51,1 52,1 C53,0 54,3 55,10 C56,20 58,48 60,52 C61,54 63,48 65,40 C67,36 70,36 80,36 C95,36 108,40 124,40 C138,40 150,38 162,36 C220,36 270,36 320,36`;

const PatientMonitor = ({ id, p, onOpenProfile }) => {
  const currentStatus = p.status ? p.status.toLowerCase() : 'stable';
  const isDispatched = currentStatus === 'dispatched';
  const isCritical = (p.heartRate > 120 || p.heartRate < 60) && !isDispatched;
  
  const cardBorderColor = isDispatched ? '#ff9800' : (isCritical ? '#ff4d4d' : '#4CAF50');
  const cardBgColor = isDispatched ? '#fff9f0' : (isCritical ? '#fff5f5' : '#fff');
  const accentColor = isDispatched ? '#ff9800' : (isCritical ? '#d32f2f' : '#2e7d32');
  
  const path = isCritical ? critPath : stablePath;
  const ecgColor = isDispatched ? '#ff9800' : (isCritical ? '#ff4d4d' : '#4CAF50');
  const speed = (60 / Math.max(p.heartRate, 30) * 2.8).toFixed(1);

  const [status, setModal] = useState(null);
  const [notes, setNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const [activeMission, setActiveMission] = useState({ eta: 'Calculating..', distance: '0.0', progress: 0});

  const prefix = p.gender === 'male' ? 'Mr.' : 'Ms.';
  const firstName = p.name.split(' ')[0];
  const displayName = `${prefix} ${firstName}`;
  const [hospitals, setHospitals] = useState([]);

  const [missionDataMap, setMissionDataMap] = useState({});

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // radius of the earth
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const hospRef = ref(db, 'medicalCenters'); 
    const unsubscribe = onValue(hospRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const hospitalList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setHospitals(hospitalList);
      }
    });

    return () => unsubscribe(); 
  }, []);

  const determineEmergencyLevel = () => {
    const needsSurgery = p.heartRate > 140 || p.heartRate < 45 || p.spo2 < 90;

    if (!hospitals || hospitals.length === 0) return null;

    const bestOptions = hospitals
      .filter(h => !needsSurgery || h.canPerformSurgery)
      .map(h => ({
        ...h,
        distance: getDistance(p.lat, p.lng, h.lat, h.lng)
      }))
      .sort((a, b) => a.distance - b.distance);

    if (bestOptions.length > 0) {
      const chosen = bestOptions[0];
      return {
        needsSurgery,
        hospitalName: chosen.name,
        hospitalCoords: { lat: chosen.lat, lng: chosen.lng }
      };
    }

    return null;
  };

  const handleFinalDispatch = (finalNotes) => {
    const emergencyInfo = determineEmergencyLevel();

    if (!emergencyInfo) {
      alert("No suitable hospital found matching surgery requirements.");
      return;
    }

    const cleanNotes = (finalNotes && finalNotes.trim() !== "") ? finalNotes : 'none';
    const now = new Date().toISOString();

    update(ref(db, `patients/${id}`), {
      status: 'dispatched',
      dispatchedAt: now, 
      crewNotes: cleanNotes,
      requiresSurgery: emergencyInfo.needsSurgery,
      targetHospital: emergencyInfo.hospitalName,
      targetHospitalLat: emergencyInfo.hospitalCoords.lat,
      targetHospitalLng: emergencyInfo.hospitalCoords.lng,
      liveStatus: 'En Route'
    });

    setModal('success');
  };

  useEffect(() => {
    const calculatedSpo2 = p.heartRate > 120
      ? Math.floor(Math.random() * (96 - 92 + 1) + 92)
      : Math.floor(Math.random() * (100 - 97 + 1) + 97);
    const calculatedResp = Math.floor(p.heartRate / 4) + (Math.random() > 0.5 ? 1 : -1);

    update(ref(db, `patients/${id}`), {
      spo2: calculatedSpo2,
      resp: calculatedResp,
    });
  }, [id, p.heartRate]);

  return (
    <div className="patient-card" style={{ backgroundColor: cardBgColor, borderColor: cardBorderColor }}>
      <div className="spaced-between">
        <h2 style={{ margin: 0, fontSize: '18px', width: '60%', overflow: 'hidden'}}>{displayName}</h2>
        <p className="status" style={{ fontSize: '12px', backgroundColor: accentColor }}>
          {isDispatched ? 'AMBULANCE EN ROUTE' : (isCritical ? 'CRITICAL ALERT' : 'STABLE')}
        </p>
      </div>

      <p style={{ marginTop: '5px', fontSize: '12px', color: 'grey', marginBottom: '15px' }}>{p.addr}</p>
      
      <div className='spaced-between'>
        <div className='flex-column'>
          <div className="bpm-text" style={{ color: accentColor }}>
            {p.heartRate} <span style={{ fontSize: '18px' }}>BPM</span>
          </div>
          <p style={{ fontSize: '14px', color: accentColor }}> 
            {isDispatched ? 'Ambulance Dispatched' : (isCritical ? 'High Tachycardia Warning' : 'Normal Sinus Rhythm')}
          </p>
        </div> 

        <div style={{ paddingLeft: '15px', width: '60%' }}>
          <div className="ecg-box" style={{ border: `1px solid ${accentColor}` }}>
            <div className="ecg-track" style={{ animationDuration: `${speed}s` }}>
              {[0, 1, 2, 3].map(i => (
                <svg key={i} width="320" height="64" viewBox="0 0 320 64" fill="none" style={{ flexShrink: 0 }}>
                  <path d={path} stroke={ecgColor} strokeWidth="1.8" strokeLinecap="round" fill="none" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>

      <hr className="separator-h" />

      <div className="spaced-between">
        <div className='flex-column' style={{ flex: '1' }}>
          <p style={{ color: 'grey', fontSize: '11px' }}>BLOOD OXYGEN</p>
          <p style={{ fontSize: '16px', fontWeight: '600' }}>{p.spo2}%</p>
        </div>
        <hr className="separator-v" />
        <div className='flex-column' style={{ flex: '1' }}>
           <p style={{ color: 'grey', fontSize: '11px' }}>RESPIRATORY</p>
           <p style={{ fontSize: '16px', fontWeight: '600' }}>{p.resp}</p>
        </div>
      </div>

      <hr className="separator-h" />

      <button 
        onClick={() => setModal(isDispatched ? 'navigate-map' : (isCritical ? 'dispatch' : 'details'))} 
        className='view-info-button' 
        style={{ 
          backgroundColor: (isCritical || isDispatched) ? accentColor : '#fff', 
          color: (isCritical || isDispatched) ? 'white' : 'black',
          border: (isCritical || isDispatched) ? 'none' : '1px solid #ddd'
        }} 
      >
        {isDispatched ? 'Track Live Mission' : (isCritical ? 'Dispatch Ambulance' : 'View Details')}
      </button>

      {status === 'details' && (
        <div className="overlay-background">
          <div className='view-details-popup'>
            <h3 style={{fontSize: '16px'}}>Patient Details</h3>
            <hr className= "separator-h" />

            <div style={{ gap: '20px', marginBottom: '20px' }} className='flex-row'>
              <img className='profile-pic' src={user} alt="User" />
              <div className='flex-column'>
                <p style={{ fontSize: '16px', fontWeight: '550' }}>{p.name}</p>
                <div className='flex-row' style={{ alignItems: 'center', gap: '8px' }}>
                  <p style={{ fontSize: '14px', color: 'grey' }}>{p.age} years old</p>
                  <hr style={{ height: '15px' }} className="separator-v" />
                  <p style={{ fontSize: '12px', color: '#007bff', fontWeight: '600', backgroundColor: '#e7f3ff', padding: '2px 8px', borderRadius: '4px' }}>
                    Device ID: {p.ringId || 'Unlinked'}
                  </p>
                </div>
              </div>
            </div>

            <div className='content-container'>
              <p style={{fontSize: '12px', color: '#a5a5a5'}}>GENDER</p>
              <p style={{fontSize: '14px', textTransform: 'capitalize'}}>{p.gender || 'Not specified'}</p>
            </div>

            <div className='content-container'>
              <p style={{fontSize: '12px', color: '#a5a5a5'}}>HOME ADDRESS</p>
              <p style={{fontSize: '14px'}}>{p.addr}</p>
            </div>

            <div className='content-container'>
              <p style={{fontSize: '12px', color: '#a5a5a5'}}>EMERGENCY CONTACT</p>
              <p style={{fontSize: '14px'}}>{p.emergency}</p>
            </div>

            <div style={{gap: '10px'}} className='flex-row'>
              <div className='content-container'>
                <p style={{fontSize: '12px', color: '#a5a5a5'}}>BLOOD OXYGEN</p>
                <p style={{fontSize: '14px'}}>{p.spo2}%</p>
              </div>
              <div className='content-container'>
                <p style={{fontSize: '12px', color: '#a5a5a5'}}>RESPIRATORY RATE</p>
                <p style={{fontSize: '14px'}}>{p.resp}</p>
              </div>
            </div>

            <div className='content-container'>
              <p style={{fontSize: '12px', color: '#a5a5a5'}}>MEDICAL CONDITION</p>
              <p style={{fontSize: '14px'}}>{p.conditions}</p>
            </div>

            <div style={{gap: '10px'}} className='flex-row'>
              <button style={{flex: '1'}} className='close-button' onClick={()=> setModal(null)}>Close</button>
              <button style={{flex: '1', backgroundColor: "#007bff"}} className='button' onClick={()=> {setModal(null); onOpenProfile(id);}}>Update Ring</button>
            </div>
          </div>
        </div>
      )}

      {status === 'dispatch' && (
        <div className="overlay-background">
          <div className='dispatch-ambulance-popup'>
            <h3 style={{fontSize: '16px'}}>Dispatch Ambulance</h3>
            <hr className= "separator-h" />
            <div style={{height: '150px'}} className='content-container'>
              <p style={{fontSize: '12px', color: '#a5a5a5'}}>QUICK SUMMARY</p>
              <p style={{color: '#d32f2f', fontSize: '14px', fontWeight: '550'}}>Patient: {displayName} <span style={{textTransform: 'capitalize'}}>({p.gender || 'Not specified'})</span></p>
              <p style={{fontSize: '14px'}}>Address: {p.addr}</p>
              <p style={{fontSize: '14px'}}>Emergency Contact: {p.emergency}</p>
              <div className='spaced-between'>
                <p style={{fontSize: '14px'}}>Heart rate: <span style={{fontWeight: '550', color: '#d32f2f'}}>{p.heartRate} BPM</span></p>
                <hr style={{height: '15px'}} className= "separator-v" />
                <p style={{fontSize: '14px'}}>SPO2: <span style={{fontWeight: '550', color: '#d32f2f'}}>{p.spo2}%</span></p>
                <hr style={{height: '15px'}} className= "separator-v" />
                <p style={{fontSize: '14px'}}>Resp: <span style={{fontWeight: '550', color: '#d32f2f'}}>{p.resp}</span></p>
              </div>
            </div>
            <div style={{gap: '10px'}} className='flex-row'>
              <button className='close-button' onClick={()=> setModal(null)}>Close</button>
              <button className='dispatch-button' onClick={()=> setModal('notes')}
              >DISPATCH NOW</button>
            </div>
          </div>
        </div>
      )}

      {status === 'notes' && (
        <div className="overlay-background">
          <div className="add-notes-popup">
            <h3 style={{fontSize: '16px'}}>Notes for Crew (Optional)</h3>
            <hr className="separator-h" />
            <p style={{ fontSize: '14px', color: 'grey' }}>Ambulance dispatched. Add notes for the crew below.</p>
            
            <textarea 
              className='cleaner-textarea' 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="e.g. Patient unresponsive..." 
              rows="4" 
            />

            <div style={{gap: '10px'}} className='flex-row'>
              <button className='close-button' onClick={()=> {
                setModal('success');

                setTimeout(() => {
                  setIsClosing(true);
                  setTimeout(() => {
                    handleFinalDispatch('');
                    setModal(null);
                    setIsClosing(false);
                    setNotes('');
                  }, 500);
                }, 2500);
              }}>Skip and Close</button>

              <button className='send-button' onClick={() => {
                setModal('success');

                setTimeout(() => {
                  setIsClosing(true);
                  setTimeout(() => {
                    handleFinalDispatch(notes);
                    setModal(null);
                    setIsClosing(false);
                    setNotes('');
                  }, 500);
                }, 2500);
              }}>Send</button>
            </div>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="overlay-background">
          <div className={`ambulance-dispatched-popup ${isClosing ? 'hide' : ''}`}>
            <h3 style={{fontSize: '16px'}}>Ambulance Dispatched!</h3>
            <img style={{height: 'auto', width: '115px'}} src={ambulance} alt="Ambulance" />
          </div>
        </div>
      )}

      {status === 'navigate-map' && (
        <div className="overlay-background" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="navigate-map-popup" style={{ 
            position: 'relative', 
            maxWidth: '850px', 
            width: '95%', 
            backgroundColor: '#f1f5f9', 
            padding: '24px', 
            borderRadius: '28px', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            minHeight: '700px'
          }}>

            <button 
              className="close-cross" 
              style={{cursor: 'pointer', fontSize: '24px', position:'absolute', top:'15px', right:'20px', border:'none', background:'none', color: '#64748b'}} 
              onClick={() => setModal(null)}
            >
              &times;
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: '#ef4444', 
                borderRadius: '50%', 
                boxShadow: '0 0 10px #ef4444',
                animation: 'pulse 1.5s infinite ease-in-out'
              }}></div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#0f172a' }}>
                Live Mission Tracker: {p.targetHospital || "Mission Route"}
              </h2>
            </div>

            <div style={{ borderRadius: '20px', overflow: 'hidden', height: '350px', background: '#fff', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <EmergencyMap 
                patientHome={{ lat: p.lat, lng: p.lng }}
                hospitalBase={{ lat: p.targetHospitalLat, lng: p.targetHospitalLng }} 
                dispatchedAt={p.dispatchedAt}
                onStatusChange={(data) => {
                  setActiveMission({ 
                    eta: data.eta || 'Calculating..', 
                    progress: data.progress || 0, 
                    distance: data.distance || '0.0' 
                  });
                  if (data.status === 'Arrived' && p.liveStatus !== 'Arrived') {
                    update(ref(db, `patients/${id}`), { liveStatus: 'Arrived' });
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <div style={{ background: '#fff', padding: '14px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
                <p style={{fontSize: '10px', fontWeight: '800', color: '#94a3b8', margin: '0 0 4px 0'}}>EST. ARRIVAL</p>
                <p style={{fontSize: '14px', fontWeight: '700', color: '#2563eb', margin: 0}}>{activeMission.eta || '--:--'}</p>
              </div>

              <div style={{ background: '#fff', padding: '14px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
                <p style={{fontSize: '10px', fontWeight: '800', color: '#94a3b8', margin: '0 0 4px 0'}}>DISTANCE</p>
                <p style={{fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: 0}}>{activeMission.distance || '0'} km</p>
              </div>

              <div style={{ background: '#fff', padding: '14px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
                <p style={{fontSize: '10px', fontWeight: '800', color: '#94a3b8', margin: '0 0 4px 0'}}>SURGERY REQ.</p>
                <p style={{fontSize: '14px', fontWeight: '700', color: p.requiresSurgery ? '#ef4444' : '#1e293b', margin: 0}}>
                  {p.requiresSurgery ? 'YES' : 'NO'}
                </p>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
              <p style={{fontSize: '10px', fontWeight: '800', color: '#94a3b8', margin: '0 0 6px 0'}}>ROUTE OVERVIEW</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap' }}>
                {activeMission.progress < 50 ? (
                  <>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{p.targetHospital || "Hospital"}</span>
                    <span style={{ color: '#2563eb', fontWeight: '900', fontSize: '18px' }}>→</span> 
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>{p.addr} (Patient)</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>{p.addr}</span> 
                    <span style={{ color: '#2563eb', fontWeight: '900', fontSize: '18px' }}>→</span> 
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{p.targetHospital || "Hospital"}</span>
                  </>
                )}
              </div>
              
              <p style={{ fontSize: '10px', marginTop: '4px', color: '#2563eb', fontWeight: '600' }}>
                {activeMission.progress < 50 ? "PHASE: EN ROUTE TO PATIENT" : "PHASE: TRANSPORTING PATIENT TO MEDICAL CENTER"}
              </p>
            </div>

          </div>
        </div>
      )}

      <div style={{ display: 'none', visibility: 'hidden', height: 0, width: 0, overflow: 'hidden' }}>
        {isDispatched && p.targetHospitalLat && p.targetHospitalLng && (
          <EmergencyMap 
            patientHome={{lat: p.lat, lng: p.lng}} 
            hospitalBase={{lat: p.targetHospitalLat, lng: p.targetHospitalLng}}
            dispatchedAt={p.dispatchedAt}
            onStatusChange={(data) => {
               setActiveMission(prev => ({
                 ...prev,
                 eta: data.eta || 'Calculating..',
                 progress: data.progress || 0,
                 distance: data.distance || '0.0'
               }));

               setMissionDataMap(prev => ({ ...prev, [id]: data }));

               if (data.status === 'Arrived' && p.liveStatus !== 'Arrived') {
                 update(ref(db, `patients/${id}`), { liveStatus: 'Arrived' });
               }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PatientMonitor;