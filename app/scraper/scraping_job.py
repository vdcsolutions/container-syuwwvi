from typing import Dict, Optional
import asyncio
from pyppeteer import launch, page
class ScrapingJob:
    def __init__(self, data: Dict, config: Optional[Dict] = None):
        if 'payload' in data:
            self.data = data.get('payload')
        else:
            self.data = data
        self.scraped_data = []
        self.multiple_pages = self.data.get('multiple_pages', False)
        self.nested = self.data.get('nested', False)
        self.urls = self.data.get('urls')
        self.actions = self.data.get('actions')

        if self.multiple_pages:
            self.next_page_button_xpath = self.data.get('next_page_button_xpath', None)

        if self.nested:
            self.config = config
        else:
            self.config = self.data.get('config')

    async def initialize_browser(self):
        """
        Initialize a Puppeteer browser based on the provided configuration.

        Returns:
        - None
        """
        browser_options = {"headless": self.config.get("headless", True)}
        browser = await launch(options=browser_options)
        return browser

    async def perform_actions(self):
        """
        Perform scraping actions based on the configuration for each URL.

        Returns:
        - None
        """

        # Iterate over each URL and perform actions asynchronously
        tasks = [self.perform_actions_for_url(url) for url in self.urls]
        await asyncio.gather(*tasks)

    async def perform_actions_for_url(self, url: str):
        """
        Perform scraping actions for a specific URL.

        Parameters:
        - url (str): The URL to perform actions on.

        Returns:
        - None
        """
        # Your logic to set up the page for the given URL
        browser = await self.initialize_browser()
        page = await browser.newPage()
        await page.goto(url)

        # Perform actions for the given URL
        for action in self.actions:
            if action['type'] == 'job':
                nested_job = ScrapingJob(action, config=self.config)
                await nested_job.perform_actions()
            elif action['type'] == 'click':
                await page.click(action['xpath'])
            elif action['type'] == 'scrape':
                await self.scrape(page, action['xpath'], action['label'])

        # Close the page after performing actions
        await page.close()

    async def scrape(self, page: page.Page, xpath: str, label: str):
        """
        Perform scraping based on the provided XPath on the provided page.

        Parameters:
        - page (page.Page): The Puppeteer page to perform the scrape action on.
        - xpath (str): The XPath to the element to scrape.
        - label (str): A label for the scraped payload.

        Returns:
        - None
        """
        # Find all elements matching the XPath
        elements = await page.xpath(xpath)

        # Get content from all occurrences
        scraped_data = []
        for element in elements:
            content = await element.evaluate('(node) => node.textContent')
            scraped_data.append(content)

        # Write results to self.scraped_data with label as the key
        self.scraped_data = scraped_data

