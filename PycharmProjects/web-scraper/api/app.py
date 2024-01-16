import sys
from pathlib import Path
from schemas.request_schema import Request
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
# Get the current script's directory
current_dir = Path(__file__).resolve().parent

# Add the parent directory to the system path
parent_dir = current_dir.parent
sys.path.insert(0, str(parent_dir))

from app.scraper.scraping_job import ScrapingJob

app = FastAPI()

origins = ["http://localhost:8080"]  # Update with your frontend URL

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Update with the HTTP methods your app uses
    allow_headers=["*"],  # Update with the HTTP headers your app uses
)

@app.post("/scrape")
async def scrape(request_data: Request):
    try:
        # Perform scraping logic using request_data
        # You can access the data using request_data.payload, e.g., request_data.payload.config

        # Replace the following print statement with your actual scraping logic
        job_data = request_data.payload
        print(job_data)
        scraping_job_instance = ScrapingJob(job_data)
        await scraping_job_instance.gather_tasks()
        print(scraping_job_instance.scraped_data)
        return json.dumps(scraping_job_instance.scraped_data)


    except Exception as e:
        print(request_data)
        print(f"Error: {str(e)}")
        # Handle exceptions and return an appropriate HTTP response
        raise HTTPException(status_code=500, detail=str(e))
