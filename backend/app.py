import sounddevice as sd
import speech_recognition as sr
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
import queue
from datetime import datetime
import textwrap
from emergency_flow import generate_pdf

app = Flask(__name__)
CORS(app)

recognizer = sr.Recognizer()
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RECORDS_FILE = os.path.join(BASE_DIR, "patient_records.txt")


FS = 16000
audio_queue = queue.Queue()

recording = False
stream = None


def audio_callback(indata, frames, time, status):
    if status:
        print("AUDIO STATUS:", status)

    print("AUDIO RECEIVED:", indata.shape)
    audio_queue.put(indata.copy())

@app.route("/api/start", methods=["POST"])
def start():
    global recording, stream

    try:
        recording = True

        while not audio_queue.empty():
            audio_queue.get()

        stream = sd.InputStream(
            samplerate=FS,
            channels=1,
            dtype="int16",
            callback=audio_callback
        )

        stream.start()

        print("Recording started")
        return jsonify({"status": "recording"})

    except Exception as e:
        print("START ERROR:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/stop", methods=["POST"])
def stop():
    global recording, stream

    try:
        recording = False

        if stream:
            stream.stop()
            stream.close()
            stream = None

        chunks = []
        while not audio_queue.empty():
            chunks.append(audio_queue.get())

        print("Chunks received:", len(chunks))

        if len(chunks) == 0:
            return jsonify({"text": "No audio recorded"})

        audio_data = np.concatenate(chunks, axis=0)

        audio = sr.AudioData(audio_data.tobytes(), FS, 2)

        try:
            print("Transcribing...")
            text = recognizer.recognize_google(audio, language="en-MY")
        except Exception as e:
            print("Speech Error:", e)
            text = "Speech recognition failed"

        return jsonify({"text": text})

    except Exception as e:
        print("STOP ERROR:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/save-record", methods=["POST"])
def save_record():
    try:
        data = request.json

        name = data.get("name", "UNKNOWN").strip()
        ic = data.get("ic", "UNKNOWN").strip()
        transcript = data.get("transcript", "").strip()

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        wrapper = textwrap.TextWrapper(
            width=70,
            initial_indent="      ",
            subsequent_indent="      "
        )

        formatted_text = wrapper.fill(transcript) if transcript else "      (No clinical notes provided)"

        entry = (
            f" DATE/TIME : {timestamp}\n"
            f" NAME      : {name}\n"
            f" IC NUMBER : {ic}\n"
            f" ASSESSMENT:\n"
            f"{formatted_text}\n"
        )

        with open(RECORDS_FILE, "w", encoding="utf-8") as f:
            f.write(entry)

        print("Record saved:", name)
        pdf_url = generate_pdf()

        return jsonify({
            "status": "saved",
            "pdf_url": pdf_url
        })

    except Exception as e:
        print("SAVE ERROR:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/test", methods=["GET"])
def test():
    return jsonify({"status": "backend working"})


if __name__ == "__main__":
    print("Server running on http://127.0.0.1:5001")
    print("Saving records to:", RECORDS_FILE)

    app.run(debug=True, port=5001)