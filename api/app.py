import sys
from pathlib import Path
from schemas.request_schema import Request, payload_data
from fastapi import FastAPI, HTTPException
import json

# Get the current script's directory
current_dir = Path(__file__).resolve().parent

# Add the parent directory to the system path
parent_dir = current_dir.parent
sys.path.insert(0, str(parent_dir))

from app.scraper.scraping_job import ScrapingJob

app = FastAPI()


@app.post("/scrape")
async def scrape(request_data: Request):
    try:
        # Perform scraping logic using request_data
        # You can access the data using request_data.payload, e.g., request_data.payload.config

        # Replace the following print statement with your actual scraping logic
        job_data = request_data.payload
        #print(job_data)
        scraping_job_instance = ScrapingJob(job_data)
        await scraping_job_instance.gather_tasks()
        from datetime import datetime
        current_timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        with open(f'output_data/{current_timestamp}.json', 'w', encoding='utf-8') as json_file:
                json.dump(scraping_job_instance.scraped_data, json_file, indent=2)
        return scraping_job_instance.scraped_data
        #await scraping_job_instance.gather_tasks()

        #return {"message": "Scraping completed successfully"}

        #return {"message": "Scraping completed successfully"}
    except Exception as e:
        print(f"Error: {str(e)}")
        # Handle exceptions and return an appropriate HTTP response
        raise HTTPException(status_code=500, detail=str(e))
