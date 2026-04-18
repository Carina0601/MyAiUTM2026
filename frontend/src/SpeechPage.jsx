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

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
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
    setPatientName("");
    setPatientIc("");
    setSpeechText("");
    setImage(null);
    setScanStatus("idle");
    setCaptured(false);
    setRecordSeconds(0);
    setRecording(false);
  };

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCamActive(false);
  }, []);

  const switchIdMode = (mode) => {
    stopStream();
    setIdMode(mode);
    setImage(null);
    setScanStatus("idle");
    setCaptured(false);
    setCamError("");
  };

  const startCamera = async () => {
    setCamError("");
    setCaptured(false);
    setImage(null);
    setScanStatus("idle");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" },
      });
      streamRef.current = stream;
      setCamActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 50);
    } catch {
      setCamError("Camera access denied or unavailable. Please check browser permissions.");
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    setImage(dataUrl);
    setCaptured(true);
    stopStream();
    setScanStatus("idle");
  };

  const retakePhoto = () => {
    setImage(null);
    setCaptured(false);
    setScanStatus("idle");
    startCamera();
  };

  const handleExtract = async () => {
    if (!image) return;
    setScanStatus("scanning");
    try {
      const res = await fetch("http://127.0.0.1:5001/api/upload-ic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();
      setPatientName(data.name !== "Not Found" ? data.name : "");
      setPatientIc(data.ic !== "Not Found" ? data.ic : "");
      setScanStatus("done");
    } catch {
      setScanStatus("error");
    }
  };

  const handleSaveRecord = async () => {
  if (!speechText.trim()) return;

  setSaveStatus("saving");

  try {
    const res = await fetch("http://127.0.0.1:5001/api/save-record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: patientName.trim() || "UNKNOWN",
        ic: patientIc.trim() || "UNKNOWN",
        transcript: speechText.trim(),
      }),
    });

    const data = await res.json();

    if (res.ok && data.status === "saved") {
      setSaveStatus("saved");

      setTimeout(() => {
        setSaveStatus("idle");
        resetForm();
      }, 2000);
    } else {
      console.log("SAVE FAILED:", data);
      setSaveStatus("error");
    }
  } catch (err) {
    console.log(err);
    setSaveStatus("error");
  }
};

  const startRecording = async () => {
    setRecording(true);
    setSpeechText("");
    try {
      await fetch("http://127.0.0.1:5001/api/start", { method: "POST" });
    } catch {
      setSpeechText("Backend connection error.");
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    setRecording(false);
    setSpeechText("Processing...");
    try {
      const res = await fetch("http://127.0.0.1:5001/api/stop", { method: "POST" });
      const data = await res.json();
      setSpeechText(data.text);
    } catch {
      setSpeechText("Failed to retrieve transcription.");
    }
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

  const dateStr = now.toLocaleDateString("en-MY", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-MY", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  return (
    <div className="layout" style={{ marginTop: "70px" }}>
      
      <main className="main">
        <div className="section-label">Patient Identification</div>
        <div className="panels">

          <div className="panel">
            <div className="panel-header">
              <span className="panel-icon ic-icon">ID</span>
              <div>
                <div className="panel-title">Patient Identification</div>
                <div className="panel-sub">Enter details manually or scan MyKad via OCR</div>
              </div>
            </div>

            <div className="method-tabs">
              <button
                className={`method-tab ${idMode === "manual" ? "active" : ""}`}
                onClick={() => switchIdMode("manual")}
              >
                <span className="tab-icon">✎</span> Manual Entry
              </button>
              <button
                className={`method-tab ${idMode === "ocr" ? "active" : ""}`}
                onClick={() => switchIdMode("ocr")}
              >
                <span className="tab-icon">⬚</span> OCR Scanner
              </button>
            </div>

            {idMode === "manual" && (
              <div className="manual-form">
                <div className="form-group">
                  <label className="field-label" htmlFor="patient-name">Full Name</label>
                  <input
                    id="patient-name"
                    className="text-input"
                    type="text"
                    placeholder="e.g. AHMAD BIN IBRAHIM"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value.toUpperCase())}
                    autoComplete="off"
                  />
                </div>
                <div className="form-group">
                  <label className="field-label" htmlFor="patient-ic">IC Number</label>
                  <input
                    id="patient-ic"
                    className="text-input mono"
                    type="text"
                    placeholder="e.g. 901231-14-5678"
                    value={patientIc}
                    onChange={(e) => setPatientIc(e.target.value)}
                    autoComplete="off"
                    maxLength={14}
                  />
                </div>
              </div>
            )}

            {idMode === "ocr" && (
              <div className="webcam-area">
                <canvas ref={canvasRef} style={{ display: "none" }} />

                {!camActive && !image && (
                  <div className="webcam-idle">
                    <div className="cam-icon">◉</div>
                    <div className="hint-text">Camera Scanner</div>
                    <div className="hint-sub">Click below to activate webcam for MyKad scan</div>
                    {camError && <div className="cam-error">{camError}</div>}
                    <button className="btn btn-primary cam-activate-btn" onClick={startCamera}>
                      Activate Camera
                    </button>
                  </div>
                )}

                {camActive && (
                  <div className="webcam-live">
                    <div className="cam-badge"><span className="rec-dot"></span> LIVE</div>
                    <video ref={videoRef} className="webcam-video" autoPlay playsInline muted />
                    <div className="cam-overlay-hint">Position the MyKad within the frame</div>
                    <div className="cam-actions">
                      <button className="btn btn-primary" onClick={captureFrame}>Capture Image</button>
                      <button className="btn btn-outline" onClick={stopStream}>Cancel</button>
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
                  <button className="btn btn-primary" style={{marginTop: "1rem"}} onClick={handleExtract} disabled={scanStatus === "scanning"}>
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
                  <div className="manual-form correction-form">
                    <div className="correction-label">✎ Review &amp; correct if needed</div>
                    <div className="form-group">
                      <label className="field-label" htmlFor="ocr-name">Full Name</label>
                      <input
                        id="ocr-name"
                        className="text-input"
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value.toUpperCase())}
                        autoComplete="off"
                      />
                    </div>
                    <div className="form-group">
                      <label className="field-label" htmlFor="ocr-ic">IC Number</label>
                      <input
                        id="ocr-ic"
                        className="text-input mono"
                        type="text"
                        value={patientIc}
                        onChange={(e) => setPatientIc(e.target.value)}
                        autoComplete="off"
                        maxLength={14}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="fields">
              <div className="field-group">
                <label className="field-label">Full Name</label>
                <div className="field-value">{patientName || <span className="placeholder">—</span>}</div>
              </div>
              <div className="field-group">
                <label className="field-label">IC Number</label>
                <div className="field-value mono">{patientIc || <span className="placeholder">—</span>}</div>
              </div>
            </div>

            <button
              className={`btn ${saveStatus === "saved" ? "btn-success" : saveStatus === "error" ? "btn-danger" : "btn-primary"}`}
              onClick={handleSaveRecord}
              disabled={!isFormReady || saveStatus === "saving"}
            >
              {saveStatus === "saving" && <span className="spinner"></span>}
              {saveLabel}
            </button>
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-icon speech-icon">MIC</span>
              <div>
                <div className="panel-title">Voice Transcription</div>
                <div className="panel-sub">Record verbal patient information</div>
              </div>
            </div>

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

            <div className="btn-row">
              <button className="btn btn-primary" onClick={startRecording} disabled={recording}>Start Recording</button>
              <button className="btn btn-danger" onClick={stopRecording} disabled={!recording}>Stop &amp; Transcribe</button>
            </div>

            <div className="transcript-box">
              <div className="transcript-label">Transcription Output</div>
              <div className="transcript-text">
                {speechText || <span className="placeholder">Transcription will appear here...</span>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;