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

    audio_data = sd.rec(int(5 * 16000), samplerate=16000, channels=1, dtype='int16')


def stop_recording():
    global recording, audio_data

    if recording:
        sd.stop()  
        sd.wait()   
        recording = False
        print("Recording stopped.")

        audio_bytes = audio_data.tobytes()

        audio = sr.AudioData(audio_bytes, 16000, 2)

        try:
            text = r.recognize_google(audio, language="en-US")
            print("Recognized:", text)

            with open("output.txt", "w") as f:
                f.write(text)

            print("Text saved into output.txt")

        except sr.UnknownValueError:
            print("Could not understand audio")

        except sr.RequestError as e:
            print("Error:", e)


root = tk.Tk()
root.title("Speech to Text")

start_btn = tk.Button(root, text="Start Recording", command=start_recording)
start_btn.pack(pady=10)

stop_btn = tk.Button(root, text="Stop Recording", command=stop_recording)
stop_btn.pack(pady=10)

root.mainloop()