// src/PatientMonitor.jsx
import React, { useState, useEffect } from 'react';
import './PatientMonitor.css'; 
import user from './assets/user.png';
import { db } from './firebase';
import { ref, update } from 'firebase/database';

const stablePath = `M0,36 C15,36 25,36 38,36 C44,36 46,32 49,32 C51,32 52,36 53,36 C55,36 57,34 60,22 C62,14 63,8 65,5 C66,3 67,4 68,9 C70,18 72,42 74,46 C75,48 77,44 79,40 C82,37 86,36 95,36 C108,36 118,39 132,39 C146,39 156,37 168,36 C220,36 270,36 320,36`;

const critPath = `M0,36 C10,36 20,36 30,36 C35,36 37,30 39,30 C41,30 42,36 43,36 C45,36 47,28 49,10 C50,3 51,1 52,1 C53,0 54,3 55,10 C56,20 58,48 60,52 C61,54 63,48 65,40 C67,36 70,36 80,36 C95,36 108,40 124,40 C138,40 150,38 162,36 C220,36 270,36 320,36`;

const PatientMonitor = ({ id, p }) => {
  const isCritical = p.heartRate > 120 || p.heartRate < 60;
  const path = isCritical ? critPath : stablePath;
  const ecgColor = isCritical ? '#ff4d4d' : '#4CAF50';
  const speed = (60 / Math.max(p.heartRate, 30) * 2.8).toFixed(1);
  // const respiratoryRate = Math.floor(p.heartRate / 4) + (Math.random() > 0.5 ? 1 : -1);
  // const spo2 = p.heartRate > 120 ? Math.floor(Math.random() * (96 - 92 + 1) + 92) : Math.floor(Math.random() * (100 - 97 + 1) + 97);

const [spo2, setSpo2] = useState(p.spo2);
const [resp, setResp] = useState(p.resp);

useEffect(() => {
  const calculatedSpo2 = p.heartRate > 120
    ? Math.floor(Math.random() * (96 - 92 + 1) + 92)
    : Math.floor(Math.random() * (100 - 97 + 1) + 97);
  const calculatedResp = Math.floor(p.heartRate / 4) + (Math.random() > 0.5 ? 1 : -1);

  setSpo2(calculatedSpo2);
  setResp(calculatedResp);

  update(ref(db, `patients/${id}`), {
    spo2: calculatedSpo2,
    resp: calculatedResp,
  });
}, [p.heartRate]);

  const [status, setModal] = useState(null);
  const [notes, setNotes] = useState('');

  return (
    <div className="patient-card" style={{ backgroundColor: isCritical ? '#fff5f5' : '#fff', borderColor: isCritical ? '#ff4d4d' : '#4CAF50'}}>
      <div className = "spaced-between">
        <h2 style={{ margin: 0, fontSize: '18px' }}>{p.name}</h2>
        <p className = "status" style={{ fontSize: '12px', backgroundColor: isCritical ?  '#d32f2f' : '#2e7d32'}}>
          {isCritical ?  'CRITICAL ALERT' : 'STABLE'}
        </p>
      </div>

      <p style={{ marginTop: '5px', fontSize: '12px', color: 'grey', marginBottom: '15px'}}>{p.addr}</p>
      
      <div className= 'spaced-between'>
        <div className='flex-column'>
          <div className="bpm-text" style={{ color: isCritical ? '#d32f2f' : '#2e7d32' }}>
            {p.heartRate} <span className = "flex-centered"  style={{ fontSize: '18px' }}>BPM</span>
          </div>

          <p style={{ fontSize: '14px', color: isCritical ?  '#d32f2f' : '#2e7d32'}}> 
            {isCritical ? 'High Tachycardia Warning' : 'Normal Sinus Rhythm'}
          </p>
        </div> 

        <div style={{ paddingLeft: '15px', width: '60%' }}>
          <div className="ecg-box" style={{border:isCritical ? '1px solid #d32f2f' : '1px solid #2e7d32'}}>
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
      

      <hr className= "separator-h"></hr>

      <div className= "spaced-between">
        <div style={{display: 'flex', flexDirection: 'column', flex: '1', gap: '15px'}}>
          <p className= "flex-column" style={{color: 'grey', fontSize: '12px'}}>BLOOD OXYGEN</p>
          <p style={{fontSize: '16px', fontWeight: '550'}}>{p.spo2}%</p>
        </div>
        <hr className= "separator-v"></hr>
        <div style={{display: 'flex', flexDirection: 'column', flex: '1', gap: '15px'}}>
           <p className= "flex-column" style={{color: 'grey', fontSize: '12px', marginRight: 'auto'}}>RESPIRATORY RATE</p>
           <p style={{fontSize: '16px', fontWeight: '550'}}>{p.resp}</p>
        </div>
      </div>

      <hr className= "separator-h"></hr>

      <button onClick={()=> setModal(isCritical ? 'dispatch' : 'details')} className='view-info-button' style={{ color: isCritical ? 'white' : 'obsidian', border: isCritical ? 'none' : '1px solid rgb(220, 220, 220)', backgroundColor: isCritical ? '#d32f2f' : '#fff', color: isCritical ? 'white' : 'black'}} >
        {isCritical ? 'Dispatch Ambulance' : 'View Details'}
      </button>

      {status === 'details' && (
        <div className="overlay-background">
          <div className='view-details-popup'>
            <h3 style={{fontSize: '16px'}}>Patient Details</h3>
            <hr className= "separator-h"></hr>

            <div style = {{gap: '20px', marginBottom: '20px'}} className='flex-row'>
              <img className='profile-pic' src={user} alt="User"></img>
              <div className='flex-column'>
                <p style={{ fontSize: '16px', fontWeight: '550'}}>{p.name}</p>
                <div className='flex-row'>
                  <p style={{ fontSize: '14px', color: 'grey'}}>{p.age} years old</p>
                  <hr style={{height: '15px'}} className= "separator-v"></hr>
                  <p style={{ fontSize: '14px', color: 'grey'}}>{p.conditions}</p>
                </div>
              </div>
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

            <button className= 'close-button' onClick={()=> setModal(null)}>Close</button>
          </div>
        </div>
      )}

      {status === 'dispatch' && (
        <div className="overlay-background">
          <div className='dispatch-ambulance-popup'>
            <h3 style={{fontSize: '16px'}}>Dispatch Ambulance</h3>
            <hr className= "separator-h"></hr>

            <div style={{height: '150px'}} className='content-container'>
              <p style={{fontSize: '12px', color: '#a5a5a5'}}>QUICK SUMMARY</p>
              <p style={{color: '#d32f2f', fontSize: '14px', fontWeight: '550'}}>Patient: {p.name}</p>
              <p style={{fontSize: '14px'}}>Address: {p.addr}</p>
              <p style={{fontSize: '14px'}}>Emergency Contact: {p.emergency}</p>
              <div className='spaced-between'>
                <p style={{fontSize: '14px'}}>Heart rate: <span style={{fontWeight: '550', color: '#d32f2f'}}>{p.heartRate} BPM</span></p>
                <hr style={{height: '15px'}} className= "separator-v"></hr>
                <p style={{fontSize: '14px'}}>SPO2: <span style={{fontWeight: '550', color: '#d32f2f'}}>{p.spo2}%</span></p>
                <hr style={{height: '15px'}} className= "separator-v"></hr>
                <p style={{fontSize: '14px'}}>Resp: <span style={{fontWeight: '550', color: '#d32f2f'}}>{p.resp}</span></p>
              </div>
            </div>

            <div style={{gap: '10px'}} className='flex-row'>
              <button className= 'close-button' onClick={()=> setModal(null)}>Close</button>
              <button className= 'dispatch-button' onClick={()=> setModal('notes')}>DISPATCH NOW</button>
            </div>
          </div>
        </div>
      )}

      {status === 'notes' && (
        <div className="overlay-background">
          <div className="add-notes-popup">
            <h3 style={{fontSize: '16px'}}>Notes for Crew (Optional)</h3>
            <hr className= "separator-h"></hr>
            <p style={{ fontSize: '14px', color: 'grey' }}>Ambulance dispatched. Add notes for the crew below.</p>
            <textarea className='cleaner-textarea' value = {notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Patient unresponsive, history of hypertension..." rows="4" />

            <div style={{gap: '10px'}} className='flex-row'>
              <button className= 'close-button' onClick={()=> setModal(null)}>Close</button>
            <button className= 'send-button' onClick={() => {
              update(ref(db, `patients/${id}`), {
                crewNotes: notes,
                dispatchedAt: new Date().toISOString(),
              });
              setNotes('');
              setModal(null)
              }}>Send</button>
            </div>
          </div>
        </div>
      )}

      {/* <p style={{ fontWeight: 'bold', color: '#777' }}>
        Status: {isCritical ? '⚠️ CRITICAL' : '✅ STABLE'}
      </p> */}

      {/* {isCritical && <button className="alert-button">ALERT MEDICAL TEAM</button>} */}
    </div>
  );
};

export default PatientMonitor;