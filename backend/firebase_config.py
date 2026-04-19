import os
from firebase_admin import credentials, storage
import firebase_admin

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

secret_path = "/secrets/firebase/firebase-key.json"
local_path = os.path.join(BASE_DIR, "firebase-key.json")

cred_path = secret_path if os.path.exists(secret_path) else local_path

try:
    cred = credentials.Certificate(cred_path)
except Exception as e:
    print(f"Warning: Could not load Firebase credentials from {cred_path}: {e}")
    cred = None

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        "storageBucket": "test-d93c5.firebasestorage.app",
        "databaseURL": "https://test-d93c5-default-rtdb.asia-southeast1.firebasedatabase.app/"

    })

bucket = storage.bucket()