import pytest
from app.scraper.scraping_job import ScrapingJob, PaginatorJob, ExtractorJob
from pyppeteer.page import Page

@pytest.fixture
def mock_page(mocker):
    return mocker.MagicMock(spec=Page)

@pytest.fixture
def sample_job():
    return {"job" : {
  "config": {
    "headless": true,
    "proxy": "filename",
    "waitTime": 5000,
    "browser": "your_browser_here"
  },
  "type": "paginate",
  "url": "https://www.google.com/",
  "next_page_button": "xpath to it",
  "actions": [
    {
      "scrape": [
        {
          "xpath": "xpath to it",
          "label": "page urls",
          "type": "string"
        }
      ]
    },
    {
      "job":{
        "type": "extractor",
        "urls_list": "page urls",
        "actions": [
          {
            "scrape": [
              {
                "xpath": "xpath to it",
                "label": "page urls",
                "type": "string"
              }
            ]
          }
        ],
        "click": {
          "xpath": "xpath to it"
        }
      }
    }
  ]
}}

@pytest.fixture
def sample_config():
    return dict(headless=true, proxy="filename", waitTime=5000, browser="your_browser_here")

def test_scraper_initialization(sample_job, sample_config):
    scraper = Scraper(job=sample_job, parent_config=sample_config)
    assert scraper.job == sample_job
    assert scraper.config == sample_job.get("config", sample_config)

def test_paginatorjob_validation_with_paginate_action():
    job_config = {'actions': [{'type': 'paginate'}]}
    PaginatorJob(**job_config)

def test_paginatorjob_validation_without_paginate_action():
    job_config = {'actions': [{'type': 'click'}]}
    with pytest.raises(ValueError, match='PaginatorJob must contain a "paginate" action'):
        PaginatorJob(**job_config)

def test_extractorjob_initialization():
    job_config = {'key': 'value'}
    extractor_job = ExtractorJob(**job_config)
    assert extractor_job.config == job_config


if __name__ == "__main__":
    pytest.main([__file__])
