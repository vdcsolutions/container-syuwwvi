from typing import Dict, Optional
import asyncio
from time import sleep
from selenium import webdriver
from selenium.webdriver.common.by import By
import asyncio
from selenium.common.exceptions import NoSuchElementException
import json



class ScrapingJob:
    def __init__(self, data: Dict, config: Optional[Dict] = None):
        if 'payload' in data:
            self.data = data.payload
        else:
            self.data = data
        self.urls = self.data.urls
        self.scraped_data = []
        self.multiple_pages = self.data.multiple_pages
        self.nested = self.data.nested
        self.actions = self.data.actions

        if self.multiple_pages:
            self.next_page_button_xpath = self.data.next_page_button_xpath

        if self.nested:
            self.config = config
        else:
            self.config = self.data.config

    async def gather_tasks(self):
        """
        Perform scraping actions based on the configuration for each URL.

        Returns:
        - None
        """


        # Iterate over each URL and perform actions asynchronously
        tasks = [self.scraping_task(url) for url in self.urls]
        await asyncio.gather(*tasks)

    async def perform_actions(self, driver, page: int = 0):
        """
        Perform scraping actions based on the specified WebDriver instance and page number.

        Parameters:
        - driver: The WebDriver instance.
        - page (int, optional): The current page number.

        Returns:
        - None
        """
        for action in self.actions:
            if action.type == 'job':
                nested_job = ScrapingJob(action, config=self.config)
                await nested_job.gather_tasks()
            elif action.type == 'click':
                try:
                    element = driver.find_element(By.XPATH, action.xpath)
                    element.click()
                except:
                    pass
            elif action.type == 'scrape':
                await self.scrape(driver, action.xpath, action.label)

    async def scraping_task(self, url: str):
        """
        Perform scraping actions for a specific URL.

        Parameters:
        - url (str): The URL to perform actions on.

        Returns:
        - None
        """
        options = webdriver.ChromeOptions()
        print(self.config.headless)
        if self.config.headless:
            options.add_argument("--headless")
            options.add_argument("--disable-gpu")
        driver = webdriver.Chrome(options=options)
        driver.get(url)
        await asyncio.sleep(self.config.waitTime)

        try:
            if self.multiple_pages and self.next_page_button_xpath:
                page = 1
                await self.perform_actions(driver, page)
                next_page_button = driver.find_element(By.XPATH, self.next_page_button_xpath)
                while next_page_button:
                    try:
                        next_page_button = driver.find_element(By.XPATH, self.next_page_button_xpath)
                        next_page_button.click()
                        page += 1
                        await asyncio.sleep(self.config.waitTime)
                        await self.perform_actions(driver, page)
                    except Exception as e:
                        print(str(e))
                        next_page_button = None
            else:
                await self.perform_actions(driver)


        finally:
            with open('output.json', 'w') as json_file:
                json.dump(self.scraped_data, json_file, indent=2)
            driver.quit()

    async def scrape(self, driver, xpath: str, label: str):
        """
        Perform scraping based on the provided XPath on the provided page.

        Parameters:
        - page (page.Page): The Puppeteer page to perform the scrape action on.
        - xpath (str): The XPath to the element to scrape.
        - label (str): A label for the scraped payload.

        Returns:
        - None
        """
        elements = driver.find_elements(By.XPATH, xpath)
        data = []
        for element in elements:
            print(element.text)
            try:
                href_value = element.get_attribute("href")
                data.append({label: element.text, 'href': href_value})
            except:
                data.append({label: element.text})
                pass
        print(data)
        # Write results to self.scraped_data with label as the key
        self.scraped_data.extend(data)

