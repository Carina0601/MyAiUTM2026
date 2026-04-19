from firebase_admin import db
from datetime import datetime, timezone, timedelta

MYT = timezone(timedelta(hours=8))

def save_notification(doctor_type, name, age, pdf_url):
    patient_name = name.replace("_", " ")

    reference = db.reference("notifications")

    data = {
        "doctor_type": doctor_type,
        "patient_name": patient_name,
        "age": age,
        "message": f"{doctor_type} required in ER immediately for {patient_name}",
        "pdf_url": pdf_url,
        "timestamp": datetime.now(MYT).isoformat()
    }

    reference.push(data)