from flask import Blueprint, request, jsonify
from services.gemini_service import generate_summary
from prompt_builder import build_summary_prompt

summarize_bp = Blueprint("summarize", __name__)

@summarize_bp.route("/summarize", methods=["POST"])
def summarize():
    data = request.json
    text = data.get("text")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    try:
        prompt = build_summary_prompt(text)
        result = generate_summary(prompt)

        return jsonify({
            "summary": result
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500