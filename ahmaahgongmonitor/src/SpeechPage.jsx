import React from 'react';
import './PatientMonitor.css'; 

export default function SpeechPage() {
  return (
    <div className='background'>
      <div className="dashboard-container">
        {/* Header Section */}
        <div className="page-title">
          <h1 style={{fontSize: '22px', fontWeight: '550', color: '#333'}}>
            Speech to Text Function
          </h1>
          <p style={{fontSize: '16px', color: 'grey'}}>
            Transcribing caregiver notes and patient interactions
          </p>
        </div>
        
        {/* Main Content Card */}
        <div className="empty-container" style={{
          marginTop: '20px', 
          textAlign: 'center', 
          padding: '100px', 
          backgroundColor: 'white', 
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}>
           <div style={{fontSize: '40px', marginBottom: '10px'}}>🎙️</div>
           <p style={{fontSize: '20px', fontWeight: '550', color: '#2e7d32'}}>
             Voice Recognition System
           </p>
           <p style={{color: 'grey'}}>
             Click the microphone icon to start transcribing...
           </p>
           
           {/* Placeholder for your future Mic button */}
           <button style={{
             marginTop: '20px',
             padding: '10px 25px',
             backgroundColor: '#2e7d32',
             color: 'white',
             border: 'none',
             borderRadius: '25px',
             cursor: 'pointer'
           }}>
             Start Listening
           </button>
        </div>
      </div>
    </div>
  );
}