import tkinter as tk
import sounddevice as sd
import numpy as np
import speech_recognition as sr

r = sr.Recognizer()
recording = False
audio_data = None

def start_recording():
    global recording, audio_data
    recording = True
    print("Recording started...")
    audio_data = sd.rec(int(60 * 16000), samplerate=16000, channels=1, dtype='int16')

def stop_recording():
    global recording, audio_data
    if recording:
        sd.stop()
        recording = False
        print("Recording stopped.")
        audio_bytes = audio_data.tobytes()
        audio = sr.AudioData(audio_bytes, 16000, 2)
        try:
            text = r.recognize_google(audio, language="en-US")
            print("Recognized:", text)
            f = open("output.txt", "a")
            f.write(text + "\n")
            f.close()
            print("Wrote text into output.txt")
        except sr.UnknownValueError:
            print("Could not understand audio")
        except sr.RequestError as e:
            print("Error with Google API:", e)

root = tk.Tk()
root.title("Speech to Text")

start_btn = tk.Button(root, text="Start Recording", command=start_recording)
start_btn.pack(pady=10)

stop_btn = tk.Button(root, text="Stop Recording", command=stop_recording)
stop_btn.pack(pady=10)

root.mainloop()

def output_text(text):
    f = open("output.txt", "a")
    f.write(text)
    f.write("\n")
    f.close()
    return

while (1):
    text = record_text()
    output_text(text)
    print("Wrote text")

text = record_text()
output_text(text)
print("Wrote text:", text)
