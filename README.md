# Ahma Agong Monitor System

A Smart Triage and Medical Documentation System designed to reduce administrative workload in emergency rooms. This application uses OCR or manual input for rapid patient identification (MyKad) and AI-powered voice transcription to automatically generate structured medical reports and notify doctors.

## Google Cloud Deployment Link
https://myaiutm-service-899341642986.asia-southeast1.run.app/

## 🚀 Tech Stack

**Frontend:**
- React (v19)
- React Router DOM
- Vite
- Firebase (Client SDK)

**Backend:**
- Python 3.x
- Flask
- Google GenAI (Gemini)
- Firebase Admin SDK
- ReportLab (PDF Generation)

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Python](https://www.python.org/downloads/) (v3.9 or higher)
- A Google Cloud Project with the Gemini API enabled
- A Firebase Project with Storage and Firestore/Realtime DB enabled

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Carina0601/MyAiUTM2026
cd MyAiUTM2026
```

### 2. Backend Setup
The backend handles AI processing, PDF generation, and Firebase admin tasks.
```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment (Windows)
python -m venv venv
venv\Scripts\activate

# Create a virtual environment (Mac/Linux)
# python3 -m venv venv
# source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```
**Backend Environment Variables & Credentials:**
1. Download your Firebase Admin Service Account key and save it as firebase-key.json inside the backend folder.
2. Create a .env file in the backend folder and add your Gemini API key:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 3. Frontend Setup
The frontend is built with React and Vite.
```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install Node modules
npm install
```

**Frontend Environment Variables:** 
Create a .env.local file inside the frontend folder and add your Firebase client configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🏃‍♂️ Running the Application locally
**Option 1: Running Frontend and Backend together (Recommended)**
From the root of the frontend directory, you can start both the React server and the Flask server simultaneously:
```bash
cd frontend
npm run dev
```

**Option 2: Running them separately**
Start the Backend:
```bash
cd backend
venv\Scripts\activate  # Windows
python app.py
# Server will run on http://127.0.0.1:5001
```

Start the Frontend:
```bash
cd frontend
npm run frontend
# Vite will provide a local URL (e.g., http://localhost:5173)
```

--- 
## 🔑 Key Features
- OCR MyKad Scanning: Quickly extracts patient Name and IC Number using computer vision.
- Voice Transcription: Records clinical notes hands-free using browser speech recognition.
- AI Summarization: Uses Google Gemini to format messy voice notes into a structured medical assessment.
- Automated PDF Reports: Generates professional PDF records with hospital branding via ReportLab.
- Instant Notifications: Pushes real-time notifications and PDFs directly to the suggested specialist doctor.

---
## References
- Speech to Text using Python : https://www.youtube.com/watch?v=LEDpgye3bf4
- OCR : https://github.com/tesseract-ocr/tesseract
