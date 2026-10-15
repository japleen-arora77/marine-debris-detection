import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("ROBOFLOW_API_KEY")
model_id = os.getenv("ROBOFLOW_MODEL_ID")

print("API key loaded:", bool(api_key))
print("Model ID:", model_id)