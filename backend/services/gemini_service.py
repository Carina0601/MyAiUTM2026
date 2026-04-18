from google import genai
import os
from dotenv import load_dotenv

load_dotenv("../.env.local")

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

def generate_summary(prompt):
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite", 
        contents=prompt
    )
    return response.text