import requests, os
from api.config import AI_API_KEY, AI_MODEL

payload = {
    "model": AI_MODEL,
    "messages": [
        {"role": "system", "content": "You are a precise astronomical seeing forecaster. Always respond with valid JSON only. CRITICAL: All string values in your JSON response must be written in the ISO language code: 'pt'."},
        {"role": "user", "content": "Rate the seeing."}
    ],
    "temperature": 0.1
}

res = requests.post(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    json=payload,
    headers={"Authorization": f"Bearer {AI_API_KEY}", "Content-Type": "application/json"}
)
print(res.status_code, res.text)
