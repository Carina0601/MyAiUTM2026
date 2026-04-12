import os
import base64
import numpy as np
import time
from datetime import datetime # Added for timestamps
from flask import Flask, jsonify, request
from flask_cors import CORS
import sounddevice as sd
import speech_recognition as sr
import scipy.io.wavfile as wav

app = Flask(__name__)
CORS(app)

# --- CONFIG ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMP_WAV = os.path.join(BASE_DIR, "temp_voice.wav")
LOG_FILE = os.path.join(BASE_DIR, "emergency_records.txt") # Your permanent file
r = sr.Recognizer()

# Helper function to write to the txt file
def log_data(category, content):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {category}: {content}\n")

# --- SPEECH TO TEXT LOGIC ---
recording = False
audio_buffer = []
stream = None

def audio_callback(indata, frames, time_status, status):
    if recording:
        audio_buffer.append(indata.copy())

@app.route("/start", methods=["POST"])
def start():
    global recording, audio_buffer, stream
    if not recording:
        print(">>> Recording Started...")
        recording = True
        audio_buffer = []
        stream = sd.InputStream(samplerate=16000, channels=1, dtype='int16', callback=audio_callback)
        stream.start()
        return jsonify({"status": "Recording..."})
    return jsonify({"status": "Already recording"})

@app.route("/stop", methods=["POST"])
def stop():
    global recording, audio_buffer, stream
    if recording:
        recording = False
        if stream:
            stream.stop()
            stream.close()
        
        if not audio_buffer:
            return jsonify({"text": "No audio captured"})

        full_audio = np.concatenate(audio_buffer, axis=0)
        wav.write(TEMP_WAV, 16000, full_audio)

        try:
            audio_data = sr.AudioData(full_audio.tobytes(), 16000, 2)
            text = r.recognize_google(audio_data, language="en-US")
            
            # SAVE SPEECH TO TXT FILE
            log_data("SPEECH_NOTE", text)
            
            return jsonify({"text": text})
        except:
            return jsonify({"text": "Recognition failed."})
    return jsonify({"text": "Not recording"})

# --- IC SCANNER (OCR) LOGIC ---
@app.route("/api/ocr-ic", methods=["POST"])
def ocr_ic():
    try:
        # Simulate thinking
        time.sleep(1)
        
        # Mock Data (since billing is disabled)
        patient_name = "CYNTHIA TEST"
        patient_ic = "030101-14-5566"

        # SAVE IC DATA TO TXT FILE
        log_data("PATIENT_IDENTIFIED", f"Name: {patient_name} | IC: {patient_ic}")

        return jsonify({
            "name": patient_name,
            "ic": patient_ic
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)