from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timezone, timedelta
import textwrap
from emergency_flow import generate_pdf

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)



import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RECORDS_FILE = os.path.join(BASE_DIR, "patient_records.txt")



@app.route("/api/save-record", methods=["POST"])
def save_record():
    try:
        data = request.json

        name = data.get("name", "UNKNOWN").strip()
        ic = data.get("ic", "UNKNOWN").strip()
        transcript = data.get("transcript", "").strip()

        MYT = timezone(timedelta(hours=8))
        timestamp = datetime.now(MYT).strftime("%Y-%m-%d %H:%M:%S")

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

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return app.send_static_file(path)
    else:
        return app.send_static_file('index.html')


if __name__ == "__main__":
    print("Server running on http://127.0.0.1:5001")
    print("Saving records to:", RECORDS_FILE)

    app.run(debug=True, port=5001)