import sys
from pathlib import Path
from schemas.request_schema import Request, payload_data
from fastapi import FastAPI, HTTPException

# Get the current script's directory
current_dir = Path(__file__).resolve().parent

# Add the parent directory to the system path
parent_dir = current_dir.parent
sys.path.insert(0, str(parent_dir))

app = FastAPI()

# Define the /scrape endpoint
@app.post("/scrape")
async def scrape(request_data: Request):
    try:
        # Perform scraping logic using request_data
        # You can access the data using request_data.payload, e.g., request_data.payload.config

        # Replace the following print statement with your actual scraping logic
        print("Scraping logic here:", request_data)

        return {"message": "Scraping completed successfully"}
    except Exception as e:
        # Handle exceptions and return an appropriate HTTP response
        raise HTTPException(status_code=500, detail=str(e))
