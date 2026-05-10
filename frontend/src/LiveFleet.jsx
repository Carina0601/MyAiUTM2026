import React, { useState } from 'react';
import EmergencyMap from './EmergencyMap';

const LiveFleet = () => {
  const testPatient = { lat: 3.1478, lng: 101.6945 };
  const testHospital = { lat: 3.1701, lng: 101.7031 };

  const [missionData, setMissionData] = useState({
    status: "Waiting for Dispatch..",
    progress: 0,
    eta: 0,
    distance: 0
  });

  return (
    <div style={{ 
      padding: '100px 24px 24px 24px', 
      backgroundColor: '#fcfcfd', 
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif",
      boxSizing: 'border-box'
    }}>
      
      <div style={{ 
        maxWidth: '1600px', 
        margin: '0 auto',
        display: 'grid', 
        gridTemplateColumns: '1fr 400px', 
        gap: '24px', 
        height: 'calc(100vh - 120px)' 
      }}>
        
        <div style={{ 
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
          border: '1px solid #f1f5f9',
          background: '#fff'
        }}>
          <EmergencyMap 
            patientHome={testPatient} 
            hospitalBase={testHospital} 
            onStatusChange={(data) => setMissionData(data)} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={badgeStyle}>MISSION PROGRESS</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}>LIVE</span>
            </div>
            
            <div style={{ height: '6px', width: '100%', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ 
                    height: '100%', 
                    width: `${missionData.progress}%`, 
                    background: 'linear-gradient(90deg, #6366f1, #0ea5e9)',
                    transition: 'width 0.4s ease-out' 
                }}></div>
            </div>

            <h2 style={{ margin: '0', fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>Unit Amb-A101</h2>
            
            <div style={{ 
                marginTop: '15px', 
                padding: '12px', 
                borderRadius: '12px', 
                background: '#f5f3ff', 
                color: '#5b21b6',
                fontWeight: '700',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <div className="status-pulse"></div>
                {missionData.status}
            </div>
          </div>

          <div style={{ ...panelStyle, flex: 1 }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8', letterSpacing: '0.5px' }}>TELEMETRY VITAL SIGNS</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
               <StatBox label="EST. ARRIVAL" value={`${missionData.eta}s`} color="#6366f1" />
               <StatBox label="DISTANCE" value={`${missionData.distance} km`} color="#0ea5e9" />
               <StatBox label="O2 SAT" value="98%" color="#10b981" />
               <StatBox label="HR" value="72bpm" color="#f43f5e" />
            </div>

            <div style={{ marginTop: '30px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#94a3b8' }}>ROUTING DATA</h4>
                <div style={routeStepStyle}>
                    <div style={{...dotStyle, background: missionData.progress > 0 ? '#6366f1' : '#cbd5e1'}}></div>
                    <span style={{color: '#64748b'}}>Base:</span> <strong>KL General Hospital</strong>
                </div>
                <div style={{ height: '20px', borderLeft: '2px dashed #e2e8f0', marginLeft: '5px' }}></div>
                <div style={routeStepStyle}>
                    <div style={{...dotStyle, background: missionData.progress > 48 ? '#f43f5e' : '#cbd5e1'}}></div>
                    <span style={{color: '#64748b'}}>Target:</span> <strong>Patient Location</strong>
                </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .status-pulse {
          width: 8px; height: 8px; background: #5b21b6; border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(91, 33, 182, 0.4);
          animation: pulse-purple 2s infinite;
        }
        @keyframes pulse-purple {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(91, 33, 182, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(91, 33, 182, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(91, 33, 182, 0); }
        }
      `}</style>
    </div>
  );
};

const panelStyle = {
  background: '#ffffff',
  padding: '24px',
  borderRadius: '24px',
  border: '1px solid #f1f5f9',
};

const badgeStyle = { fontSize: '10px', fontWeight: '800', color: '#94a3b8', letterSpacing: '1px' };
const routeStepStyle = { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' };
const dotStyle = { width: '12px', height: '12px', borderRadius: '50%', background: '#6366f1' };

const StatBox = ({ label, value, color }) => (
    <div style={{ padding: '15px', borderRadius: '18px', background: '#fcfcfd', border: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '16px', fontWeight: '800', color: color }}>{value}</div>
    </div>
);

export default LiveFleet;