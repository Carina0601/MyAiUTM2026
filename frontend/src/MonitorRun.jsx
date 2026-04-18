// src/MonitorRun.jsx
import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { ref, onValue, push, set, update } from 'firebase/database';
import PatientMonitor from './PatientMonitor';
import './PatientMonitor.css'; 
import { seedDatabase } from './seed';
import check from './assets/check.png';
import ring from './assets/smart-ring.png';

const MonitorRun = () => {
  const [patients, setPatients] = useState({});
  const [loading, setLoading] = useState(true);

  const critical = Object.entries(patients).filter(([, p]) => p.heartRate > 120 || p.heartRate < 60);
  const stable = Object.entries(patients).filter(([, p]) => p.heartRate <= 120 && p.heartRate >= 60);

  const [currentTime, setCurrentTime] = useState(new Date());

  const [selectedId, setSelectedId] = useState(null);

  const [status, setModal] = useState(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
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
            <PatientMonitor key={id} id={id} p={p}
              onOpenProfile={(id, modalName) => {
                setSelectedId(id);
                setModal('update-device')
              }} /> 
          ))}
        </div>

        <button style={{ marginTop: '20px', border: 'none', backgroundColor: 'black', color: 'white', fontWeight: '550', padding: '4px 15px', borderRadius: '10px'}} onClick={seedDatabase}>Test Data</button>
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
            <p style={{fontSize: '14px'}}>Address:</p>
              <input className="cleaner-text-input" type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder='No 123 Jalan Keanu Reeves'></input>
            <p style={{fontSize: '14px'}}>Conditions:</p>
              <input className="cleaner-text-input" type="text" value={condition} onChange={e => setCondition(e.target.value)} placeholder='Mild Hypertension'></input>
            <p style={{fontSize: '14px'}}>Emergency Contact:</p>
              <input className="cleaner-text-input" type="text" value={emergency} onChange={e => setEmergency(e.target.value)} placeholder='Keanu Jr (Son): 012-3456789'></input>

            <div style={{gap: "10px"}} className='spaced-between'>
              <button style={{backgroundColor: 'black', flex: '1', fontSize: "14px"}} className='button' onClick={() => setModal('null')}>Cancel</button>
              <button style={{backgroundColor: '#007bff', flex: '1', fontSize: "14px"}} className='button'
                onClick={() => {
                  // const patientsRef = ref(db, 'patients');
                  // const newPatient = push(patientsRef);
                  const nextNumber = Object.keys(patients).length + 1;
                  const nextId = `p${String(nextNumber).padStart(3, '0')}`;

                  update(ref(db, `patients/${nextId}`), {
                    name: name,
                    age: age,
                    addr: address,
                    conditions: condition,
                    emergency: emergency, 
                    heartRate: 75,
                    spo2: 98,
                    resp: 16
                })
                .then(() => {
                  setName('');
                  setAge('');
                  setAddress('');
                  setCondition('');
                  setEmergency('');
                  setSelectedId(nextId);
                  setModal('add-device');
                })
                .catch((error) => {
                  console.error("Error adding patient: ", error);
                  });
                }}
              >
                
                Add New Patient</button>
            </div>
          </div>
        </div>
      )}

      {status === 'add-device' && (
        <div className="overlay-background">
          <div className= "add-ring-popup">
            <img style={{height: 'auto', width: '70px', marginBottom: '30px'}} src={ring} alt="ring"></img>
            <h3 style={{fontSize: '18px'}}>Please enter your Smart Ring ID</h3>
            <input className="cleaner-text-input" type="text" value={ringId} onChange={e => setRingId(e.target.value)} placeholder='e.g (SR0001)'></input>
            <button style={{backgroundColor: '#007bff', fontSize: '14px', width: '100%'}} className='button'
              onClick = {() => {
                update(ref(db,`patients/${selectedId}`), {
                  ringId: ringId,
                })
                .then(() => {
                  setRingId('');
                  setModal('add-success');

                  setTimeout(() => {
                    setIsClosing(true);

                    setTimeout(() => {
                      setModal(null);
                      setIsClosing(false);
                    }, 500);
                  }, 2000);
                })
              }}>

            Link Now</button>
          </div>
        </div>
      )}

      {status === 'update-device' && (
        <div className="overlay-background">
          <div className= "update-ring-popup">
            <img style={{height: 'auto', width: '70px', marginBottom: '30px'}} src={ring} alt="ring"></img>
            <h3 style={{fontSize: '18px'}}>Please enter your new Smart Ring ID</h3>
            <input className="cleaner-text-input" type="text" value={ringId} onChange={e => setRingId(e.target.value)} placeholder='e.g (SR0001)'></input>
            <button style={{backgroundColor: '#007bff', fontSize: '14px', width: '100%'}} className='button'
              onClick = {() => {
                update(ref(db,`patients/${selectedId}`), {
                  ringId: ringId,
                })
                .then(() => {
                  setRingId('');
                  setModal('update-success');

                  setTimeout(() => {
                    setIsClosing(true);

                    setTimeout(() => {
                      setModal(null);
                      setIsClosing(false);
                    }, 500);
                  }, 2000);
                })
              }}>

            Link Now</button>
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
                <h3 style={{ fontSize: '18px' }}>Smart Ring Updated Successfully!</h3>
                <p style={{ color: 'grey', fontSize: '14px' }}>Successfully updated the monitor system.</p>
          </div>
        </div>
      )}
    </div>

  );
};



export default MonitorRun;