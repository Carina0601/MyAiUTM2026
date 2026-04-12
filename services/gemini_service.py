import google.generativeai as genai
from config import Config

genai.configure(api_key=Config.GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash-lite")

def generate_summary(prompt):
    response = model.generate_content(prompt)
    return response.text