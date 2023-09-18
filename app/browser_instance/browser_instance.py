import asyncio
from pyppeteer import launch
import random
import logging
from contextlib import asynccontextmanager

logging.basicConfig(level=logging.ERROR)


class BrowserInstance:
    def __init__(self, headless: bool, proxy: str, user_agent: str, wait_time: dict) -> None:
        """
        Initialize a new browser instance with the specified configuration.
        """
        self.browser_instance = None
        self.headless = headless
        self.proxy = proxy
        self.wait_time = wait_time
        self.user_agent = user_agent

    @classmethod
    async def create(
            cls,
            headless: bool,
            wait_time: dict,
            proxy: str = None,
            user_agent: str = None
    ) -> 'BrowserInstance':
        self = cls(headless, proxy, user_agent, wait_time)

        args = [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]

        if proxy:
            args.append(f'--proxy-server={proxy}')
        if user_agent:
            args.append(f'--user-agent={user_agent}')

        self.browser_instance = await launch(
            headless=headless,
            args=args
        )
        # Initializing a new page as soon as the browser is launched
        self.page = await self.browser_instance.newPage()

        return self

    @asynccontextmanager
    async def session(self):
        try:
            yield
        finally:
            await self.close_browser()

    async def wait_random(self) -> None:
        """
        Pause the execution for a random duration within the specified range of
        self.wait_time which is expected to be a dictionary with 'min' and 'max' keys.
        """
        if not isinstance(self.wait_time, dict) or 'min' not in self.wait_time or 'max' not in self.wait_time:
            raise ValueError("self.wait_time must be a dictionary with 'min' and 'max' keys")

        wait_time = random.uniform(self.wait_time['min'], self.wait_time['max'])
        await asyncio.sleep(wait_time)

    async def navigate_to(self, url: str) -> None:
        """
        Navigate the browser to the specified URL.

        Args:
            url (str): The URL to navigate to.
        """
        if not hasattr(self, "page") or not self.page:
            self.page = await self.browser_instance.newPage()
        try:
            await self.page.goto(url)
        except:
            raise
        await self.wait_random()

    async def click_element(self, xpath: str) -> None:
        """
        Click an element identified by the specified XPath.

        Args:
            xpath (str): The XPath to identify the element to click.
        """

        try:
            element = await self.page.waitForXPath(xpath)
            await element.click()
            await self.wait_random()
        except:
            raise

    async def close_browser(self) -> None:
        """Close the browser instance."""
        if self.browser_instance:
            await self.browser_instance.close()

    async def get_html(self) -> str:
        """
        Get the HTML content of the current page.

        Returns:
            str: The HTML content of the current page as a string.
        """
        # Assuming self.page holds the current page object
        if hasattr(self, "page"):
            content = await self.page.content()
            return content
        else:
            raise AttributeError("No page is currently opened or attribute 'page' is not set.")
