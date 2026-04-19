from datetime import datetime, timezone, timedelta
import os

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4

from services.gemini_service import generate_summary
from prompt_builder import build_summary_prompt
from services.firebase_upload import upload_pdf_to_firebase
from services.notify import save_notification


def parse_result(result):
    data = {
        "patient": {"name": "Unknown", "age": "Unknown", "gender": ""},
        "incident": "",
        "injuries": "",
        "vitals": "",
        "treatment": "",
        "background": {
            "allergies": "",
            "medications": "",
            "history": ""
        },
        "notes": "",
        "plan": {
            "doctors": [],
            "room": ""
        }
    }

    for line in result.split("\n"):
        line = line.strip()
        if not line:
            continue

        if line.startswith("Name:"):
            data["patient"]["name"] = line.split(":", 1)[1].strip()

        elif line.startswith("Age:"):
            data["patient"]["age"] = line.split(":", 1)[1].strip()

        elif line.startswith("Gender:"):
            data["patient"]["gender"] = line.split(":", 1)[1].strip()

        elif "Incident:" in line:
            data["incident"] = line.split(":", 1)[1].strip()

        elif "Injuries" in line:
            data["injuries"] = line.split(":", 1)[1].strip()

        elif "Vital Signs:" in line:
            data["vitals"] = line.split(":", 1)[1].strip()

        elif "Treatment" in line:
            data["treatment"] = line.split(":", 1)[1].strip()

        elif "Allergies:" in line:
            data["background"]["allergies"] = line.split(":", 1)[1].strip()

        elif "Regular Medications:" in line:
            data["background"]["medications"] = line.split(":", 1)[1].strip()

        elif "Medical History:" in line:
            data["background"]["history"] = line.split(":", 1)[1].strip()

        elif "Other Details:" in line:
            data["notes"] = line.split(":", 1)[1].strip()

        elif "Suggested Doctor:" in line:
            doctors_raw = line.split(":", 1)[1].strip()
            data["plan"]["doctors"] = [d.strip() for d in doctors_raw.split(",") if d.strip()]

        elif "Suggested Room:" in line:
            data["plan"]["room"] = line.split(":", 1)[1].strip()

    return data

def generate_pdf():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    file_path_txt = os.path.join(BASE_DIR, "patient_records.txt")

    with open(file_path_txt, "r") as file:
        text = file.read()

    prompt = build_summary_prompt(text)
    result = generate_summary(prompt)

    data = parse_result(result)

    MYT = timezone(timedelta(hours=8))
    now = datetime.now(MYT)
    timestamp = now.strftime("%Y%m%d%H%M%S")
    date_only = now.strftime("%Y-%m-%d")
    time_only = now.strftime("%H:%M:%S")

    os.makedirs("generated", exist_ok=True)

    filename_temp = f"temp_{timestamp}.pdf"
    file_path_pdf = os.path.join("generated", filename_temp)

    styles = getSampleStyleSheet()
    style = ParagraphStyle(
        'Medical',
        parent=styles['Normal'],
        fontSize=12,
        leading=14,
        spaceAfter=6
    )

    story = []

    logo_path = os.path.join(BASE_DIR, "static", "logo.png")

    hospital_details = """
    <b>Ahma Agong Monitor Emergency Department</b><br/>
    123, Jalan Medical, Kuala Lumpur<br/>
    Tel: +60 12-345 6789<br/>
    Email: help@ahmaahgongmonitor.com
    """

    try:
        logo = Image(logo_path, width=100, height=80)
    except:
        logo = Paragraph("LOGO", style)

    header_table = Table([
        [logo, Paragraph(hospital_details, styles['Normal'])]
    ], colWidths=[90, 400])

    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))

    story.append(header_table)
    story.append(Spacer(1, 15))

    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Heading1"],
        alignment=1,
        fontSize=18,
        spaceAfter=12
    )

    story.append(Paragraph("<b>EMERGENCY MEDICAL REPORT</b>", title_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph(f"<b>Date:</b> {date_only}", style))
    story.append(Paragraph(f"<b>Time:</b> {time_only}", style))
    story.append(Spacer(1, 12))

    def add_section(title, content):
        if not content:
            return
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"<b>{title}</b>", styles['Heading2']))
        story.append(Spacer(1, 4))
        story.append(Paragraph(content, style))

    story.append(Paragraph(f"<b>Name:</b> {data['patient']['name']}", style))
    story.append(Paragraph(f"<b>Age:</b> {data['patient']['age']}", style))
    story.append(Paragraph(f"<b>Gender:</b> {data['patient']['gender']}", style))

    add_section("Incident", data["incident"])
    add_section("Injuries / Conditions", data["injuries"])
    add_section("Vital Signs", data["vitals"])
    add_section("Treatment Given", data["treatment"])

    bg = data["background"]
    bg_text = f"""
        Allergies: {bg['allergies']}<br/>
        Medications: {bg['medications']}<br/>
        History: {bg['history']}
        """
    add_section("Medical Background", bg_text)

    add_section("Additional Notes", data["notes"])

    plan = data["plan"]
    plan_text = f"""
        Doctor: {", ".join(plan['doctors'])}<br/>
        Room: {plan['room']}
        """
    add_section("Suggestion", plan_text)

    doc = SimpleDocTemplate(
        file_path_pdf,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    doc.build(story)


    name = data["patient"]["name"].replace(" ", "_")
    age = data["patient"]["age"]

    doctor_types = plan["doctors"]

    filename = f"{name}_{age}_{timestamp}.pdf"
    pdf_url = upload_pdf_to_firebase(file_path_pdf, filename)

    for doctor in doctor_types:
        save_notification(doctor, name, age, pdf_url)

    if os.path.exists(file_path_pdf):
        os.remove(file_path_pdf)

    return pdf_url