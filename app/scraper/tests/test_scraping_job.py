import pytest
from app.scraper.scraping_job import ScrapingJob
from app.schemas.scraping_job_schema import sample_job

@pytest.fixture
def parent_config():
    return {'config': sample_job().config}

@pytest.fixture
def scraper_job_details():
    return sample_job()

@pytest.mark.asyncio
async def test_init_scraping_job(scraper_job_details):
    instance = ScrapingJob(scraper_job_details=scraper_job_details)
    assert instance.scraper_job_details == scraper_job_details

