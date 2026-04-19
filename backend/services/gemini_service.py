from google import genai
import os
from dotenv import load_dotenv

secret_env = "/secrets/env/.env.local"
local_env = os.path.join(os.path.dirname(__file__), "..", ".env.local")

if os.path.exists(secret_env):
    load_dotenv(secret_env)
else:
    load_dotenv(local_env)

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

def generate_summary(prompt):
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite", 
        contents=prompt
    )
    return response.text