from flask import Flask, render_template, request, send_file
from routes.summarize import summarize_bp
from services.gemini_service import generate_summary
from prompt_builder import build_summary_prompt

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.units import inch

import io

app = Flask(__name__)

app.register_blueprint(summarize_bp)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/generate-pdf", methods=["GET", "POST"])
def generate_pdf():
    if request.method == "GET":
        return "Use the form to submit text"

    text = request.form.get("text")

    prompt = build_summary_prompt(text)
    result = generate_summary(prompt)

    buffer = io.BytesIO()

    styles = getSampleStyleSheet()
    style = ParagraphStyle(
        'Medical',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        spaceAfter=6
    )

    story = []

    story.append(Paragraph("<b>Emergency Patient Report</b>", styles['Heading1']))
    story.append(Spacer(1, 12))

    for line in result.split("\n"):
        line = line.strip()

        if not line:
            story.append(Spacer(1, 6))
            continue

        # Section headers
        if "Incident:" in line:
            story.append(Spacer(1, 10))
            story.append(Paragraph("<b>Incident</b>", styles['Heading2']))
            story.append(Spacer(1, 4))
            story.append(Paragraph(line.replace("Incident:", ""), style))

        elif "Injuries/Conditions:" in line:
            story.append(Spacer(1, 10))
            story.append(Paragraph("<b>Injuries / Conditions</b>", styles['Heading2']))
            story.append(Spacer(1, 4))
            story.append(Paragraph(line.replace("Injuries/Conditions:", ""), style))

        elif "Vital Signs:" in line:
            story.append(Spacer(1, 10))
            story.append(Paragraph("<b>Vital Signs</b>", styles['Heading2']))
            story.append(Spacer(1, 4))
            story.append(Paragraph(line.replace("Vital Signs:", ""), style))

        elif ":" in line:
            label, value = line.split(":", 1)
            story.append(
                Paragraph(f"<b>{label}:</b> {value}", style)
            )

        else:
            story.append(Paragraph(line, style))

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    doc.build(story)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="patient_report.pdf",
        mimetype="application/pdf"
    )


if __name__ == "__main__":
    app.run(debug=True)