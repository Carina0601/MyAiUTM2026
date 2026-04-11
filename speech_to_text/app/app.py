import os
import numpy as np
from flask import Flask, render_template, jsonify
import sounddevice as sd
import speech_recognition as sr

# Path setup
base_dir = os.path.dirname(os.path.abspath(__file__)) 
parent_dir = os.path.dirname(base_dir)               

app = Flask(__name__, 
            template_folder=os.path.join(parent_dir, 'templates'),
            static_folder=os.path.join(parent_dir, 'static'))

r = sr.Recognizer()

# --- GLOBAL STATE FOR CONTINUOUS RECORDING ---
recording = False
audio_buffer = []

def audio_callback(indata, frames, time, status):
    """This function is called for every block of audio captured."""
    if recording:
        audio_buffer.append(indata.copy())

# Global stream variable
stream = None

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/start", methods=["POST"])
def start():
    global recording, audio_buffer, stream
    if not recording:
        recording = True
        audio_buffer = [] # Clear previous recording
        
        # Start the stream
        stream = sd.InputStream(samplerate=16000, channels=1, dtype='int16', callback=audio_callback)
        stream.start()
        print("Continuous recording started...")
        return jsonify({"status": "Recording..."})
    return jsonify({"status": "Already recording"})

@app.route("/stop", methods=["POST"])
def stop():
    global recording, audio_buffer, stream
    if recording:
        recording = False
        stream.stop()
        stream.close()
        
        print("Recording stopped. Processing audio...")

        if not audio_buffer:
            return jsonify({"text": "No audio captured"})

        # Flatten the buffer into a single numpy array
        full_audio = np.concatenate(audio_buffer, axis=0)
        audio_bytes = full_audio.tobytes()

        # Create AudioData (sample_width=2 for int16)
        audio = sr.AudioData(audio_bytes, 16000, 2)

        try:
            text = r.recognize_google(audio, language="en-US")
            
            # Append to log file
            output_path = os.path.join(parent_dir, "output.txt")
            with open(output_path, "a", encoding="utf-8") as f:
                f.write(text + "\n")

            return jsonify({"text": text})
        except sr.UnknownValueError:
            return jsonify({"text": "Could not understand audio"})
        except Exception as e:
            return jsonify({"text": f"Error: {str(e)}"})
            
    return jsonify({"text": "Not recording"})

if __name__ == "__main__":
    app.run(debug=True)