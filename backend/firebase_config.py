import os
from firebase_admin import credentials, storage
import firebase_admin

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

cred_path = os.path.join(BASE_DIR, "firebase-key.json")

cred = credentials.Certificate(cred_path)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        "storageBucket": "test-d93c5.firebasestorage.app",
        "databaseURL": "https://test-d93c5-default-rtdb.asia-southeast1.firebasedatabase.app/"

    })

bucket = storage.bucket()