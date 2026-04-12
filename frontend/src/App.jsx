import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import './App.css';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [history, setHistory] = useState([]);
  
  const webcamRef = useRef(null);
  const [capturedImg, setCapturedImg] = useState(null);
  const [icData, setIcData] = useState({ name: '', ic: '' });

  // --- SPEECH ---
  const handleStart = async () => {
    setStatus('RECORDING... (Speak now)');
    setIsRecording(true);
    try {
      await fetch('http://127.0.0.1:5001/start', { method: 'POST' });
    } catch (err) { setStatus('Backend Offline'); }
  };

  const handleStop = async () => {
    setStatus('Processing...');
    setIsRecording(false);
    try {
      const response = await fetch('http://127.0.0.1:5001/stop', { method: 'POST' });
      const data = await response.json();
      if (data.text) {
        setHistory(prev => [data.text, ...prev]);
        setStatus('Ready.');
      }
    } catch (err) { setStatus('Network error'); }
  };

  // --- OCR ---
  const captureAndAnalyzeIC = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImg(imageSrc);
    setStatus('Analyzing MyKad...');

    try {
      const response = await fetch('http://127.0.0.1:5001/api/ocr-ic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc }),
      });
      const data = await response.json();
      setIcData({ name: data.name, ic: data.ic });
      setStatus('Scan Complete.');
    } catch (err) { setStatus('Scan Failed.'); }
  };

  return (
    <div className="background">
      <nav className="top-nav">
        <div className="logo">EMERGENCY ASSIST</div>
        <div className="nav-links">
          <span>Live Monitor</span>
          <span>Records</span>
          <div className="profile-icon"></div>
        </div>
      </nav>

      <div className="dashboard">
        <div className="card scanner-card">
          <h2>Patient IC Scanner</h2>
          <div className="camera-area">
            {!capturedImg ? (
              <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="webcam" />
            ) : (
              <img src={capturedImg} alt="IC" className="webcam" />
            )}
            {!capturedImg && <div className="overlay-guide"></div>}
          </div>
          <button onClick={captureAndAnalyzeIC} className="primary-btn">
            {capturedImg ? "Retake Photo" : "Scan MyKad"}
          </button>
          
          <div className="results">
            <input type="text" value={icData.name} placeholder="Patient Name" readOnly />
            <input type="text" value={icData.ic} placeholder="IC Number" readOnly />
          </div>
        </div>

        <div className="card recorder-card">
          <h2>Speech Interaction</h2>
          <div className="btn-group">
            <button onClick={handleStart} disabled={isRecording} className="rec-btn start">Start</button>
            <button onClick={handleStop} disabled={!isRecording} className="rec-btn stop">Stop</button>
          </div>
          <p className="status-label">Status: <span>{status}</span></p>
          
          <div className="transcript-box">
            <h3>Transcript History</h3>
            {history.map((t, i) => <div key={i} className="entry">{t}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;