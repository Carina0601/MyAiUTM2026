import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { ref, onValue, update, get } from 'firebase/database';
import PatientMonitor from './PatientMonitor';
import './PatientMonitor.css'; 
import { seedDatabase } from './seed';
import check from './assets/check.png';
import ring from './assets/smart-ring.png';
import axios from 'axios';

const MonitorRun = () => {
  const [patients, setPatients] = useState({});
  const [loading, setLoading] = useState(true);
  const [simInterval, setSimInterval] = useState(null);

  const critical = Object.entries(patients).filter(([, p]) => 
    (p.heartRate > 125 || p.heartRate < 55) && p.status !== 'dispatched'
  );

  const dispatched = Object.entries(patients).filter(([, p]) => 
    p.status === 'dispatched'
  );

  const stable = Object.entries(patients).filter(([, p]) => 
    (p.heartRate <= 125 && p.heartRate >= 55) && p.status !== 'dispatched'
  );

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedId, setSelectedId] = useState(null);
  const [status, setModal] = useState(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [condition, setCondition] = useState('');
  const [emergency, setEmergency] = useState('');
  const [ringId, setRingId] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const patientsRef = ref(db, 'patients');
    const unsubscribe = onValue(patientsRef, (snapshot) => {
      setPatients(snapshot.val() || {});
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSimulation = async () => {
    if (simInterval) {
      clearInterval(simInterval);
      setSimInterval(null);
      return;
    }

    const interval = setInterval(async () => {
      const snapshot = await get(ref(db, 'patients'));
      if (!snapshot.exists()) return;

      const currentData = snapshot.val();
      const updates = {};
      const CRITICAL_ID = "p1778608256107";
      const INCONSISTENT_ID = "p008";

      Object.keys(currentData).forEach((id) => {
        const patient = currentData[id];
        let newRate;

        if (id === CRITICAL_ID) {
          newRate = Math.floor(Math.random() * (170 - 145 + 1)) + 145;
        } else if (id === INCONSISTENT_ID) {
          newRate = Math.random() > 0.5
            ? Math.floor(Math.random() * (180 - 140 + 1)) + 140
            : Math.floor(Math.random() * (50 - 30 + 1)) + 30;
        } else {
          newRate = Math.floor(Math.random() * (80 - 65 + 1)) + 65;
        }

        updates[`patients/${id}/heartRate`] = newRate;

        const isDispatched = patient.status === 'dispatched' || patient.dispatchedAt;

        if (!isDispatched) {
          updates[`patients/${id}/status`] = (newRate > 100 || newRate < 55) ? 'critical' : 'stable';
        }
      });

      update(ref(db), updates);
    }, 3000);

    setSimInterval(interval);
  };

  const isFormValid = () => {
    if(!name.trim()) return { validity: false, message: "Please enter a name." };
    if(!age || isNaN(age) || age < 0 || age > 130) return { validity: false, message: "Please enter a valid age (0 - 130)." };
    if(!gender) return { validity: false, message: "Please select a gender." };
    if(!address.trim()) return { validity: false, message: "Address is required."};
    if(!condition.trim()) return { validity: false, message: "Please specify any conditions or enter 'None'."};
    if(!emergency.trim()) return { validity: false, message: "Emergency contact is required."}

    return { validity: true };
  };

  const getCoords = async (address) => {
    const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImY3NDkxM2FjZGQ1ODQ0MGFiNzU4NWQyMjBhNTdkMWE4IiwiaCI6Im11cm11cjY0In0=';

    try{
      const response = await axios.get(
        `https://api.openrouteservice.org/geocode/search?api_key=${API_KEY}&text=${encodeURIComponent(address)}&size=1`
      );

      const [lng, lat] = response.data.features[0].geometry.coordinates;
      return { lat, lng };
    }
    catch (error){
      console.error("Geocoding failed: ", error);
      return null;
    }
  };

  if (loading) return <div className="dashboard-container">Connecting...</div>;

  return (
    <div className='background'>
      <div className="dashboard-container">
        <div className="page-title">
          <div style={{alignItems: 'center'}} className="spaced-between">
            <h1 style={{fontSize: '22px', fontWeight: '550'}}>Elderly Vital Signs Monitoring</h1>
            <button onClick={() => setModal('add-patient')} style={{backgroundColor: '#007bff'}} className="button"><span style={{fontSize: '20px'}}>+ </span> Add New Patient</button>
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
                <PatientMonitor key={id} id={id} p={p} onOpenProfile={(id) => { setSelectedId(id); setModal('update-device'); }}/>  
              ))}
            </div>
          </>
        )}

        {dispatched.length > 0 && (
          <>
            <div style={{ color: '#ff9800', fontSize: '16px', fontWeight: '550', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulse-dot-orange"></span> AMBULANCE EN ROUTE — {dispatched.length}
            </div>
            <div className="grid-layout" style={{ marginBottom: '30px' }}>
              {dispatched.map(([id, p]) => (
                <PatientMonitor key={id} id={id} p={p} onOpenProfile={(id) => { setSelectedId(id); setModal('update-device'); }}/>
              ))}
            </div>
          </>
        )}

        <div style={{color: 'grey', fontSize: '16px', fontWeight: '550', marginBottom: '15px'}}>
          STABLE PATIENTS
        </div>
        <div className="grid-layout">
          {stable.map(([id, p]) => (
            <PatientMonitor 
              key={id} 
              id={id} 
              p={p}
              onOpenProfile={(id) => {
                setSelectedId(id);
                setModal('update-device');
              }} 
            /> 
          ))}
        </div>

        <div style={{display: 'flex', gap: '10px'}}>
          <button style={{ marginTop: '20px', border: 'none', backgroundColor: 'black', color: 'white', fontWeight: '550', padding: '4px 15px', borderRadius: '10px', cursor: 'pointer'}} onClick={seedDatabase}>Test Data</button>
          <button 
            onClick={toggleSimulation} 
            style={{ 
              marginTop: '20px', 
              backgroundColor: simInterval ? '#d32f2f' : '#2e7d32', 
              color: 'white', 
              fontWeight: '550', 
              padding: '4px 15px', 
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {simInterval ? "Stop Live Simulation" : "Start Live Simulation"}
          </button>
        </div>
      </div>

      {status === 'add-patient' && (
        <div className="overlay-background">
          <div className="add-patient-popup">
            <h3 style={{fontSize: '16px', marginBottom: '10px'}}>Add a Patient</h3>
            <hr className='separator-h'></hr>
            <p style={{fontSize: '14px'}}>Patient Name:</p>
            <input className="cleaner-text-input" type='text' value={name} onChange={e => setName(e.target.value)} placeholder='Keanu Reeves'></input>
            <p style={{fontSize: '14px'}}>Age:</p>
              <input className="cleaner-text-input" type="text" value={age} onChange={e => setAge(e.target.value)} placeholder='67'></input>
            <p style={{fontSize: '14px'}}>Gender:</p>
            <select className='cleaner-text-input' value={gender} onChange={e => setGender(e.target.value)}>
              <option value="" disabled>Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <p style={{fontSize: '14px'}}>Address:</p>
            <input className="cleaner-text-input" type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder='No 123 Jalan Keanu Reeves'></input>
            <p style={{fontSize: '14px'}}>Conditions:</p>
            <input className="cleaner-text-input" type="text" value={condition} onChange={e => setCondition(e.target.value)} placeholder='Mild Hypertension'></input>
            <p style={{fontSize: '14px'}}>Emergency Contact:</p>
            <input className="cleaner-text-input" type="text" value={emergency} onChange={e => setEmergency(e.target.value)} placeholder='Keanu Jr (Son): 012-3456789'></input>

            <div style={{gap: "10px"}} className='spaced-between'>
              <button style={{backgroundColor: 'black', flex: '1', fontSize: "14px"}} className='button' onClick={() => setModal(null)}>Cancel</button>
              <button style={{backgroundColor: '#007bff', flex: '1', fontSize: "14px", opacity: name && age && gender && address && condition && emergency ? 1 : 0.5}} className='button'
                onClick={async () => {
                  const validation = isFormValid();

                  if(!validation.validity){
                    alert(validation.message);
                    return;
                  }

                  const coordinates = await getCoords(address);

                  if(!coordinates){
                    alert("We couldn't find that address on the map. Please check the spelling!");
                    return;
                  }

                  const nextId = `p${Date.now()}`;
                  update(ref(db, `patients/${nextId}`), {
                    name, age, gender, addr: address, lat: coordinates.lat, lng: coordinates.lng, conditions: condition, emergency,
                    heartRate: 75, spo2: 98, resp: 16, status: 'stable', ringId: 'Pending'
                  })
                  .then(() => {
                    setName(''); setAge(''); setGender(''); setAddress(''); setCondition(''); setEmergency('');
                    setSelectedId(nextId);
                    setModal('add-device');
                  });
                }}
              >Add New Patient</button>
            </div>
          </div>
        </div>
      )}

      {(status === 'add-device' || status === 'update-device') && (
        <div className="overlay-background">
          <div className= "add-ring-popup">
            <button className="close-cross" onClick={() => setModal(null)}>&times;</button>
            <img style={{height: 'auto', width: '70px', marginBottom: '30px', paddingTop: '25px'}} src={ring} alt="ring"></img>
            <h3 style={{fontSize: '18px'}}>Please enter your Smart Ring ID</h3>
            <input className="cleaner-text-input" type="text" value={ringId} onChange={e => setRingId(e.target.value)} placeholder='e.g (SR0001)'></input>
            <button style={{backgroundColor: '#007bff', fontSize: '14px', width: '100%'}} className='button'
              onClick={() => {
                const trimmedRingId = ringId.trim().toUpperCase();

                if(!trimmedRingId){
                  alert("Ring ID cannot be empty.");
                  return;
                }

                const ringRegex = /^SR\d{4}$/i;

                if(!ringRegex.test(trimmedRingId)){
                  alert("Invalid Ring ID format. Must start with 'SR' followed by 4 digits (e.g. SR0001).");
                  return;
                }

                const isDuplicate = Object.values(patients).some(p => 
                  p.ringId?.toUpperCase() === trimmedRingId && 
                  p.id !== selectedId
                );

                if(isDuplicate){
                  alert("This Ring ID is already linked to another patient. Please check and try again.");
                  return;
                }

                update(ref(db,`patients/${selectedId}`), { ringId: trimmedRingId })
                .then(() => {
                  const nextModal = status === 'add-device' ? 'add-success' : 'update-success';
                  setRingId('');
                  setModal(nextModal);
                  setTimeout(() => {
                    setIsClosing(true);
                    setTimeout(() => {
                      setModal(null);
                      setIsClosing(false);
                    }, 500);
                  }, 2000);
                });
              }}>Link Now</button>
              <p style={{ color: '#005bff', fontSize: '12px', marginTop: '10px', fontWeight: '500'}}>
                {status === 'update-device' && patients[selectedId] ? `Current Ring ID: ${patients[selectedId]?.ringId || 'Not linked'}` : ''}</p>
          </div>
        </div>
      )}

      {status === 'add-success' && (
        <div className={`overlay-background ${isClosing ? 'hide' : ''}`}>
          <div className="add-success-popup">
              <img style={{height: 'auto', width: '115px'}} src={check} alt="Check"></img>
              <h3 style={{ fontSize: '18px' }}>Patient Registered</h3>
              <p style={{ color: 'grey', fontSize: '14px' }}>Successfully added to the monitor system.</p>
          </div>
        </div>
      )}

      {status === 'update-success' && (
        <div className={`overlay-background ${isClosing ? 'hide' : ''}`}>
          <div className="update-success-popup">
              <img style={{height: 'auto', width: '115px'}} src={check} alt="Check"></img>
              <h3 style={{ fontSize: '18px' }}>Smart Ring Updated!</h3>
              <p style={{ color: 'grey', fontSize: '14px' }}>Successfully updated the monitor system.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitorRun;