import React, { useState, useRef, useEffect, useCallback } from "react";
import "./SpeechPage.css";

function App() {
  const [idMode, setIdMode] = useState("manual");
  const [patientName, setPatientName] = useState("");
  const [patientIc, setPatientIc] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [image, setImage] = useState(null);
  const [scanStatus, setScanStatus] = useState("idle");
  const [camActive, setCamActive] = useState(false);
  const [camError, setCamError] = useState("");
  const [captured, setCaptured] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [speechText, setSpeechText] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-MY";
      recognition.onresult = (event) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + " ";
        }
        setSpeechText(currentTranscript.trim());
      };
      recognition.onerror = (event) => {
        if (event.error !== "no-speech") {
          setSpeechText((prev) =>
            prev ? prev + "\n[Error: " + event.error + "]" : "Error: " + event.error
          );
        }
        setRecording(false);
      };
      recognition.onend = () => setRecording(false);
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (recording) {
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recording]);

  const resetForm = () => {
    setPatientName(""); setPatientIc(""); setSpeechText(""); setImage(null);
    setScanStatus("idle"); setCaptured(false); setRecordSeconds(0); setRecording(false);
  };

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCamActive(false);
  }, []);

  const switchIdMode = (mode) => {
    stopStream(); setIdMode(mode); setImage(null);
    setScanStatus("idle"); setCaptured(false); setCamError("");
  };

  const startCamera = async () => {
    setCamError(""); setCaptured(false); setImage(null); setScanStatus("idle");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" },
      });
      streamRef.current = stream;
      setCamActive(true);
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      }, 50);
    } catch {
      setCamError("Camera access denied or unavailable. Please check browser permissions.");
    }
  };

  const captureFrame = () => {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    setImage(canvas.toDataURL("image/jpeg", 0.95));
    setCaptured(true); stopStream(); setScanStatus("idle");
  };

  const retakePhoto = () => { setImage(null); setCaptured(false); setScanStatus("idle"); startCamera(); };

  const handleExtract = async () => {
    if (!image) return;
    setScanStatus("scanning");
    try {
      const res = await fetch("http://localhost:5000/api/upload-ic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();
      if (data.name && data.name !== "Not Found") setPatientName(data.name);
      if (data.ic && data.ic !== "Not Found") setPatientIc(data.ic);
      setScanStatus("done");
    } catch (error) {
      console.error("Extraction error:", error);
      setScanStatus("error");
    }
  };

  const handleSaveRecord = async () => {
    if (!speechText.trim()) return;
    setSaveStatus("saving");
    try {
      const payload = {
        name: patientName?.trim() || "UNKNOWN",
        ic: patientIc?.trim() || "UNKNOWN",
        transcript: speechText?.trim() || "UNKNOWN",
      };
      const res = await fetch("http://localhost:5001/api/save-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.status === "saved") {
        setSaveStatus("saved");
        setTimeout(() => { setSaveStatus("idle"); resetForm(); }, 2000);
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      console.error("SAVE ERROR:", err);
      setSaveStatus("error");
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current) { setSpeechText("Speech recognition is not supported in this browser."); return; }
    setRecording(true); setSpeechText("");
    try { recognitionRef.current.start(); } catch (e) { console.error("Failed to start recording:", e); }
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;
    setRecording(false);
    try { recognitionRef.current.stop(); } catch (e) { console.error("Failed to stop recording:", e); }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const isFormReady =
    speechText.trim().length > 0 &&
    !speechText.toLowerCase().includes("failed") &&
    speechText !== "Processing...";

  const scanStatusLabel = {
    idle: null,
    scanning: { text: "Scanning document...", cls: "scanning" },
    done: { text: "Extraction complete — review and correct below if needed", cls: "done" },
    error: { text: "Scan failed — check backend connection", cls: "error" },
  }[scanStatus];

  const saveLabel = {
    idle: "Save Record to File",
    saving: "Saving...",
    saved: "✓ Record Saved",
    error: "Save Failed — Check Backend",
  }[saveStatus];

  return (
    <div className="dashboard-container">

      {/* ── Page Header — matches MonitorRun exactly ── */}
      <div className="page-title">
        <div style={{ alignItems: 'center' }} className="spaced-between">
          <h1 style={{ fontSize: '22px', fontWeight: '550' }}>Patient Voice Recording</h1>
        </div>
        <p style={{ fontSize: '16px', color: 'grey' }}>Record and transcribe verbal patient information</p>
      </div>

      <div style={{ color: 'grey', fontSize: '16px', fontWeight: '550', marginBottom: '15px' }}>
        PATIENT INFORMATION
      </div>

      <div className="panels">

        {/* ── Left: Identification ── */}
        <div className="patient-card" style={{ borderColor: '#e0e0e0', display: 'flex', flexDirection: 'column', gap: '14px', height: 'fit-content' }}>

          <div className="flex-row" style={{ gap: '14px', justifyContent: 'flex-start' }}>
            <span className="panel-icon ic-icon">ID</span>
            <div className="flex-column">
              <p style={{ fontSize: '16px', fontWeight: '600' }}>Patient Identification</p>
              <p style={{ fontSize: '12px', color: 'grey', marginTop: '2px' }}>Enter details manually or scan MyKad via OCR</p>
            </div>
          </div>

          <hr className="separator-h" />

          <div className="method-tabs">
            <button className={`method-tab ${idMode === "manual" ? "active" : ""}`} onClick={() => switchIdMode("manual")}>
              <span className="tab-icon">✎</span> Manual Entry
            </button>
            <button className={`method-tab ${idMode === "ocr" ? "active" : ""}`} onClick={() => switchIdMode("ocr")}>
              <span className="tab-icon">⬚</span> OCR Scanner
            </button>
          </div>

          {idMode === "manual" && (
            <div className="flex-column" style={{ gap: '12px' }}>
              <div className="flex-column" style={{ gap: '4px' }}>
                <p style={{ fontSize: '14px' }}>Full Name</p>
                <input
                  className="cleaner-text-input" type="text"
                  placeholder="e.g. AHMAD BIN IBRAHIM"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value.toUpperCase())}
                  autoComplete="off"
                  style={{ margin: 0 }}
                />
              </div>
              <div className="flex-column" style={{ gap: '4px' }}>
                <p style={{ fontSize: '14px' }}>IC Number</p>
                <input
                  className="cleaner-text-input" type="text"
                  placeholder="e.g. 901231-14-5678"
                  value={patientIc}
                  onChange={(e) => setPatientIc(e.target.value)}
                  autoComplete="off" maxLength={14}
                  style={{ margin: 0 }}
                />
              </div>
            </div>
          )}

          {idMode === "ocr" && (
            <div className="flex-column" style={{ gap: '12px' }}>
              <canvas ref={canvasRef} style={{ display: "none" }} />

              {!camActive && !image && (
                <div className="webcam-idle">
                  <div className="cam-icon">◉</div>
                  <div className="hint-text">Camera Scanner</div>
                  <div className="hint-sub">Click below to activate webcam for MyKad scan</div>
                  {camError && <div className="cam-error">{camError}</div>}
                  <button className="button" style={{ backgroundColor: '#007bff', marginTop: '8px', width: '100%' }} onClick={startCamera}>
                    Activate Camera
                  </button>
                </div>
              )}

              {camActive && (
                <div className="flex-column" style={{ gap: '10px' }}>
                  <div className="cam-badge"><span className="rec-dot"></span> LIVE</div>
                  <video ref={videoRef} className="webcam-video" autoPlay playsInline muted />
                  <p style={{ fontSize: '12px', color: 'grey' }}>Position the MyKad within the frame</p>
                  <div className="flex-row" style={{ gap: '10px' }}>
                    <button className="button" style={{ backgroundColor: '#007bff', flex: '1' }} onClick={captureFrame}>Capture Image</button>
                    <button className="button" style={{ backgroundColor: '#333', flex: '1' }} onClick={stopStream}>Cancel</button>
                  </div>
                </div>
              )}

              {captured && image && (
                <div className="image-preview-wrap">
                  <img src={image} alt="Captured MyKad" className="preview-img" />
                  <button className="clear-btn" onClick={retakePhoto}>↺ Retake</button>
                </div>
              )}

              {image && (
                <button className="button" style={{ backgroundColor: '#007bff', width: '100%' }} onClick={handleExtract} disabled={scanStatus === "scanning"}>
                  {scanStatus === "scanning" ? "Scanning..." : "Extract IC Information"}
                </button>
              )}

              {scanStatusLabel && (
                <div className={`status-row ${scanStatusLabel.cls}`}>
                  <span className="status-dot"></span>
                  {scanStatusLabel.text}
                </div>
              )}

              {scanStatus === "done" && (
                <div className="flex-column" style={{ gap: '12px', marginTop: '4px' }}>
                  <p style={{ fontSize: '13px', color: '#007bff', fontWeight: '550' }}>✎ Review &amp; correct if needed</p>
                  <div className="flex-column" style={{ gap: '4px' }}>
                    <p style={{ fontSize: '14px' }}>Full Name</p>
                    <input className="cleaner-text-input" type="text" value={patientName} onChange={(e) => setPatientName(e.target.value.toUpperCase())} autoComplete="off" style={{ margin: 0 }} />
                  </div>
                  <div className="flex-column" style={{ gap: '4px' }}>
                    <p style={{ fontSize: '14px' }}>IC Number</p>
                    <input className="cleaner-text-input mono" type="text" value={patientIc} onChange={(e) => setPatientIc(e.target.value)} autoComplete="off" maxLength={14} style={{ margin: 0 }} />
                  </div>
                </div>
              )}
            </div>
          )}

          <hr className="separator-h" />

          {/* Preview — mirrors content-container from PatientMonitor */}
          <div className="content-container" style={{ height: 'auto' }}>
            <p style={{ fontSize: '12px', color: '#a5a5a5' }}>FULL NAME</p>
            <p style={{ fontSize: '14px' }}>{patientName || <span style={{ color: '#bbb', fontStyle: 'italic' }}>—</span>}</p>
          </div>
          <div className="content-container" style={{ height: 'auto' }}>
            <p style={{ fontSize: '12px', color: '#a5a5a5' }}>IC NUMBER</p>
            <p style={{ fontSize: '14px', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{patientIc || <span style={{ color: '#bbb', fontStyle: 'italic' }}>—</span>}</p>
          </div>

          <button
            className="view-info-button"
            style={{
              backgroundColor: saveStatus === "saved" ? '#2e7d32' : saveStatus === "error" ? '#d32f2f' : '#007bff',
              color: 'white',
              border: 'none',
              opacity: (!isFormReady || saveStatus === "saving") ? 0.5 : 1,
              cursor: (!isFormReady || saveStatus === "saving") ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
            onClick={handleSaveRecord}
            disabled={!isFormReady || saveStatus === "saving"}
          >
            {saveStatus === "saving" && <span className="spinner"></span>}
            {saveLabel}
          </button>
        </div>

        {/* ── Right: Voice Recording ── */}
        <div className="patient-card" style={{ borderColor: '#e0e0e0', display: 'flex', flexDirection: 'column', gap: '14px', height: 'fit-content' }}>

          <div className="flex-row" style={{ gap: '14px', justifyContent: 'flex-start' }}>
            <span className="panel-icon speech-icon">MIC</span>
            <div className="flex-column">
              <p style={{ fontSize: '16px', fontWeight: '600' }}>Voice Transcription</p>
              <p style={{ fontSize: '12px', color: 'grey', marginTop: '2px' }}>Record verbal patient information</p>
            </div>
          </div>

          <hr className="separator-h" />

          {/* Mic recorder */}
          <div className={`recorder-ui ${recording ? "active" : ""}`}>
            <div className="recorder-center">
              {recording ? (
                <>
                  <div className="pulse-ring"></div>
                  <div className="pulse-ring delay1"></div>
                  <div className="mic-button recording"><span className="mic-glyph">⬤</span></div>
                </>
              ) : (
                <div className="mic-button idle"><span className="mic-glyph">🎙</span></div>
              )}
            </div>
            {recording && (
              <div className="recording-info">
                <div className="rec-label">REC</div>
                <div className="rec-timer">{formatTime(recordSeconds)}</div>
                <div className="waveform">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.08}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-row" style={{ gap: '10px' }}>
            <button
              className="view-info-button"
              style={{ backgroundColor: '#007bff', color: 'white', border: 'none', flex: '1', opacity: recording ? 0.5 : 1 }}
              onClick={startRecording} disabled={recording}
            >Start Recording</button>
            <button
              className="view-info-button"
              style={{ backgroundColor: '#d32f2f', color: 'white', border: 'none', flex: '1', opacity: !recording ? 0.5 : 1 }}
              onClick={stopRecording} disabled={!recording}
            >Stop &amp; Transcribe</button>
          </div>

          <div className="transcript-box">
            <p style={{ fontSize: '11px', color: '#a5a5a5', letterSpacing: '0.05em', marginBottom: '8px' }}>TRANSCRIPTION OUTPUT</p>
            <div className="transcript-text">
              {recording ? (
                <span style={{ color: '#bbb', fontStyle: 'italic' }}>Listening... (Text will appear after you stop)</span>
              ) : (
                speechText || <span style={{ color: '#bbb', fontStyle: 'italic' }}>Transcription will appear here...</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;