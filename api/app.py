import sys
from pathlib import Path
from schemas.request_schema import Request, payload_data
from fastapi import FastAPI

# Get the current script's directory
current_dir = Path(__file__).resolve().parent

# Add the parent directory to the system path
parent_dir = current_dir.parent
sys.path.insert(0, str(parent_dir))


app = FastAPI()
@app.get("/")
def read_form():
    return {"message": "HTTPX Payload Generator"}

@app.post("/submit/")
def submit_form(payload_data: Request):
    # Do something with the payload
    return {"status": "success"}
