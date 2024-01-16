from typing import Dict, Optional
import asyncio
from time import sleep
from selenium import webdriver
from selenium.webdriver.common.by import By
import asyncio
from selenium.common.exceptions import NoSuchElementException
import json
import csv


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


        semaphore = asyncio.Semaphore(15)

        async def limited_task(url):
            async with semaphore:
                print(url)
                await self.scraping_task(url)

        # Iterate over each URL and perform actions asynchronously with a limit of 5 concurrent tasks
        tasks = [limited_task(url) for url in self.urls]
        await asyncio.gather(*tasks)

    async def perform_actions(self, driver, url, page: int = 0):
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
                    elements = driver.find_elements(By.XPATH, action.xpath)
                    for element in elements:
                        element.click()
                        await asyncio.sleep(self.config.waitTime)

                except:
                    pass
            elif action.type == 'scrape':
                await self.scrape(driver, url, action.xpath, action.label)

    async def scraping_task(self, url: str):
        """
        Perform scraping actions for a specific URL.

        Parameters:
        - url (str): The URL to perform actions on.

        Returns:
        - None
        """
        options = webdriver.ChromeOptions()
        if self.config.headless:
            options.add_argument("--headless")
            options.add_argument("--disable-gpu")
        driver = webdriver.Chrome(options=options)
        driver.get(url)
        self.scraped_data.append({'url': url, 'title': driver.title})
        await asyncio.sleep(self.config.waitTime)

        try:
            if self.multiple_pages and self.next_page_button_xpath:
                page = 1
                await self.perform_actions(driver, url, page)
                next_page_button = driver.find_element(By.XPATH, self.next_page_button_xpath)
                while next_page_button:
                    try:
                        next_page_button = driver.find_element(By.XPATH, self.next_page_button_xpath)
                        next_page_button.click()
                        page += 1
                        await asyncio.sleep(self.config.waitTime)
                        await self.perform_actions(driver, url, page)
                    except Exception as e:
                        print(str(e))
                        next_page_button = None
            else:
                await self.perform_actions(driver, url)

        finally:
            with open(f'output.json', 'w', encoding='utf-8') as json_file:
                json.dump(self.scraped_data, json_file, indent=2, ensure_ascii=False)
            all_keys = set().union(*(d.keys() for d in self.scraped_data))

            # Writing to CSV
            with open('output.csv', 'w', newline='') as csvfile:
                # Create a CSV writer with the unique set of fieldnames
                writer = csv.DictWriter(csvfile, fieldnames=all_keys)

                # Write header
                writer.writeheader()

                # Write data
                writer.writerows(self.scraped_data)
            driver.quit()

    async def scrape(self, driver, url: str, xpath: str, label: str):
        """
        Perform scraping based on the provided XPath on the provided page.

        Parameters:
        - driver: The WebDriver instance.
        - url (str): The URL of the page being scraped.
        - xpath (str): The XPath to the element to scrape.
        - label (str): A label for the scraped payload.

        Returns:
        - None
        """
        elements = driver.find_elements(By.XPATH, xpath)
        data = {}
        row = {}
        i = 0
        for element in elements:
            i += 1
            try:
                href_value = element.get_attribute("href")
                if href_value:
                    data[label+'_href_'+str(i)] = href_value
                    #data.append({label+str(i): element.text, 'href': href_value})
                else:
                    data[label+'_'+str(i)] = element.get_attribute("innerText").strip()
                    #data.append({label+(str(i)): element.text})
            except:
                pass
        # Find the entry in self.scraped_data with the corresponding URL and update its 'data' field
        for entry in self.scraped_data:
            if entry['url'] == url and len(data)>0:
                entry.update(data)
                print(data)
                break

