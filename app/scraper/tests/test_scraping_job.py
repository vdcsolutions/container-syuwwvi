import pytest
from unittest.mock import AsyncMock
from app.scraper.scraping_job import ScrapingJob
from pathlib import Path
from schemas.request_schema import payload_data

@pytest.mark.asyncio
class TestScrapingJobPerformActions:
    async def test_perform_actions(self):
        """
        Test the perform_actions method.

        Returns:
        - None
        """
        # Arrange
        scraping_job = ScrapingJob(payload_data)
        scraping_job.perform_actions_for_url = AsyncMock()

        # Act
        await scraping_job.perform_actions()

        # Assert
        scraping_job.perform_actions_for_url.assert_called_once_with("https://example.com")

if __name__ == "__main__":
    pytest.main()
