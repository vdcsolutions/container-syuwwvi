from pathlib import Path
import sys
import unittest
from unittest.mock import MagicMock

# Ensure you are adding the correct parent directory to the sys.path
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir.parent))

from app.scraper.scraping_job import ScrapingJob
from schemas.request_schema import payload_data


class TestScrapingJob(unittest.TestCase):
    def setUp(self):
        # Set up any necessary data or mocks for testing
        self.payload_data = payload_data

    def test_init(self):
        # Test the initialization of ScrapingJob
        scraping_job = ScrapingJob(self.payload_data)
        self.assertIsInstance(scraping_job, ScrapingJob)
        # Add more assertions if needed

    def test_click(self):
        # Arrange
        scraping_job = ScrapingJob({})
        xpath = "some_xpath"

        # Act
        with unittest.mock.patch("app.scraper.scraping_job.click") as mock_click:
            scraping_job.click(xpath)

        # Assert
        mock_click.assert_called_once_with(xpath)

    def test_scrape(self):
        # Arrange
        scraping_job = ScrapingJob({})
        xpath = "some_xpath"
        label = "some_label"

        # Act
        with unittest.mock.patch("app.scraper.scraping_job.scrape") as mock_scrape:
            scraping_job.scrape(xpath, label)

        # Assert
        mock_scrape.assert_called_once_with(xpath, label)

if __name__ == "__main__":
    unittest.main()

