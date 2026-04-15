import sounddevice as sd
import speech_recognition as sr
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS

# =========================
# INIT
# =========================
app = Flask(__name__)
CORS(app)

recognizer = sr.Recognizer()
RECORDS_FILE = "patient_records.txt"

# =========================
# SPEECH VARIABLES
# =========================
recording = False
audio_data = None
# Set a reasonable maximum duration for recording (e.g., 30 seconds)
FS = 16000 
MAX_DURATION = 30 

# =========================
# SAVE RECORD API
# =========================
@app.route("/api/save-record", methods=["POST"])
def save_record():
    try:
        data = request.json
        name = data.get("name", "").strip()
        ic = data.get("ic", "").strip()
        transcript = data.get("transcript", "").strip()

        if not name or not ic:
            return jsonify({"error": "Name and IC are required"}), 400

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Formatting the single record block
        entry = (
            f"{'='*60}\n"
            f"TIMESTAMP   : {timestamp}\n"
            f"FULL NAME   : {name}\n"
            f"IC NUMBER   : {ic}\n"
            f"TRANSCRIPT  : {transcript if transcript else 'No transcript recorded'}\n"
            f"{'='*60}\n\n"
        )

        # Write the final consolidated record to the file
        with open(RECORDS_FILE, "a", encoding="utf-8") as f:
            f.write(entry)

        print(f"[SAVED] {name} | {ic}")
        return jsonify({"status": "saved"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# SPEECH START
# =========================
@app.route("/start", methods=["POST"])
def start():
    global recording, audio_data
    recording = True
    
    # Record up to MAX_DURATION. We use non-blocking recording.
    audio_data = sd.rec(int(MAX_DURATION * FS), samplerate=FS, channels=1, dtype='int16')
    return jsonify({"status": "recording"})


# =========================
# SPEECH STOP (Returns Final Text)
# =========================
@app.route("/stop", methods=["POST"])
def stop():
    global recording, audio_data

    if recording:
        # Stop the sounddevice recording immediately
        sd.stop()
        recording = False

        # Convert the recorded buffer to AudioData
        # Note: We trim the audio_data to only include what was actually recorded if needed,
        # but sr.AudioData works fine with the buffer.
        audio = sr.AudioData(audio_data.tobytes(), FS, 2)

        try:
            # Get the final transcription from Google
            text = recognizer.recognize_google(audio)
            return jsonify({"text": text})
        except sr.UnknownValueError:
            return jsonify({"text": ""}) # Return empty if nothing understood
        except Exception as e:
            print(f"Error: {e}")
            return jsonify({"text": "Error during transcription"})

    return jsonify({"text": "Not recording"})


# =========================
# RUN
# =========================
if __name__ == "__main__":
    print("🚑 Emergency System Backend Online...")
    app.run(debug=True, port=5001)