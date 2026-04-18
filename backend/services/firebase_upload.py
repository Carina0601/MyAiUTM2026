from firebase_config import bucket

def upload_pdf_to_firebase(file_path, filename):
    blob = bucket.blob(f"pdfs/{filename}")

    blob.upload_from_filename(file_path)

    blob.make_public()

    return blob.public_url