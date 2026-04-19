import sounddevice as sd
import speech_recognition as sr
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
import queue
import textwrap
from datetime import datetime

# =========================
# INIT
# =========================
app = Flask(__name__)
CORS(app)

recognizer = sr.Recognizer()
RECORDS_FILE = "patient_records.txt"

# =========================
# SPEECH GLOBALS
# =========================
recording = False
audio_queue = queue.Queue() # 存放音频块的队列
FS = 16000 

def audio_callback(indata, frames, time, status):
    """sounddevice 回调：将录音片段存入队列"""
    if status:
        print(f"Error: {status}")
    audio_queue.put(indata.copy())

# =========================
# SPEECH START
# =========================
@app.route("/start", methods=["POST"])
def start():
    global recording
    if recording:
        return jsonify({"status": "already recording"})

    # 清空队列
    while not audio_queue.empty():
        audio_queue.get()

    recording = True
    # 开启持续录音流
    sd.rec_stream = sd.InputStream(samplerate=FS, channels=1, dtype='int16', callback=audio_callback)
    sd.rec_stream.start()
    
    print("🎙️ Recording started...")
    return jsonify({"status": "recording"})

# =========================
# SPEECH STOP & TRANSCRIBE
# =========================
@app.route("/stop", methods=["POST"])
def stop():
    global recording
    if recording:
        recording = False
        
        # 停止录音流
        if hasattr(sd, 'rec_stream'):
            sd.rec_stream.stop()
            sd.rec_stream.close()
        
        print("🛑 Recording stopped.")

        # 合并所有音频片段
        audio_chunks = []
        while not audio_queue.empty():
            audio_chunks.append(audio_queue.get())
        
        if not audio_chunks:
            return jsonify({"text": "No audio recorded"})

        full_audio = np.concatenate(audio_chunks, axis=0)

        # 转换为 SpeechRecognition 格式 (2 bytes for int16)
        audio = sr.AudioData(full_audio.tobytes(), FS, 2)

        try:
            print("☁️ Transcribing...")
            # 使用 en-MY 识别马来西亚口音
            text = recognizer.recognize_google(audio, language='en-MY')
            return jsonify({"text": text})
        except sr.UnknownValueError:
            return jsonify({"text": "(Could not understand audio)"})
        except Exception as e:
            print(f"Transcription Error: {e}")
            return jsonify({"text": "Transcription error"})

    return jsonify({"text": "Not recording"})

# =========================
# SAVE RECORD API (排版优化版)
# =========================
@app.route("/api/save-record", methods=["POST"])
def save_record():
    try:
        data = request.json
        name = data.get("name", "UNKNOWN").strip()
        ic = data.get("ic", "UNKNOWN").strip()
        transcript = data.get("transcript", "").strip()

        # 1. 格式化时间
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 2. 自动换行处理 (每行70字符，首行和后续行都缩进)
        # 这样文本块会整齐地排列在 ASSESSMENT 标签下方
        wrapper = textwrap.TextWrapper(
            width=70, 
            initial_indent='      ', 
            subsequent_indent='      '
        )
        
        if transcript:
            formatted_text = wrapper.fill(transcript)
        else:
            formatted_text = "      (No clinical notes provided)"

        # 3. 构建精美的文本文档格式
        entry = (
            f"{'='*70}\n"
            f" [PATIENT ADMISSION RECORD]\n"
            f"{'-'*70}\n"
            f" DATE/TIME : {timestamp}\n"
            f" NAME      : {name}\n"
            f" IC NUMBER : {ic}\n"
            f" ASSESSMENT:\n"
            f"{formatted_text}\n"
            f"{'='*70}\n\n"
        )

        # 4. 写入文件
        with open(RECORDS_FILE, "a", encoding="utf-8") as f:
            f.write(entry)
            
        print(f"✅ Record saved for {name}")
        return jsonify({"status": "saved"})
        
    except Exception as e:
        print(f"❌ Save error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # 打印启动信息
    print(f"🚀 Server running on http://127.0.0.1:5001")
    print(f"📂 Records will be saved to: {RECORDS_FILE}")
    app.run(debug=True, port=5001)