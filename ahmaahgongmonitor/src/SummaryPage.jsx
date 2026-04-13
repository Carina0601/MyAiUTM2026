import React from 'react';
import './PatientMonitor.css'; 

export default function SummaryPage() {
  return (
    <div style={{marginTop: '5px'}}  className='background'>
      <div className="dashboard-container">
        <div className="page-title">
          <h1 style={{fontSize: '22px', fontWeight: '550'}}>AI Medical Summary</h1>
          <p style={{fontSize: '16px', color: 'grey'}}>Generative AI analysis of patient vitals</p>
        </div>
        
        <div className="empty-container" style={{marginTop: '20px', textAlign: 'center', padding: '100px'}}>
           <p style={{fontSize: '20px', fontWeight: '550', color: '#2e7d32'}}>
             AI Summary Engine Offline
           </p>
           <h1 style={{fontSize: '22px', fontWeight: '550', backgroundColor: 'yellow', color: 'black'}}>
  AI Medical Summary
</h1>
           <p style={{color: 'grey'}}>System integration in progress...</p>
        </div>
      </div>
    </div>
  );
}