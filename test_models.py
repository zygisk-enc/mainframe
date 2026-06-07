import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

models_to_test = [
    'gemini-3.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-pro-latest',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
    'gemini-3.1-flash-lite'
]

print("--- Starting Empirical Model Test ---")
for model_name in models_to_test:
    print(f"Testing {model_name}...", end=" ", flush=True)
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Say 'Success'")
        if response.text.strip():
            print("✅ SUCCESS")
        else:
            print("❌ EMPTY RESPONSE")
    except Exception as e:
        msg = str(e)
        if "429" in msg:
            print("❌ QUOTA EXCEEDED (429)")
        elif "404" in msg:
            print("❌ NOT FOUND (404)")
        else:
            print(f"❌ ERROR: {msg[:50]}...")

print("--- Test Complete ---")
