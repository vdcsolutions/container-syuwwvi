import pytest
from app.browser_instance.browser_instance import BrowserInstance
import random
\
async def test_browser_create() -> None:
    browser_instance = await BrowserInstance.create(
        headless=True,
        proxy='http://example.com:8080',
        user_agent='my-user-agent',
        wait_time={'min': 1, 'max': 2}
    )

    async with browser_instance.session():
        assert browser_instance is not None
        assert browser_instance.browser_instance is not None
        assert browser_instance.page is not None

        # Clean up after the test
        await browser_instance.browser_instance.close()



@pytest.mark.asyncio
async def test_wait_random() -> None:
    browser_instance = BrowserInstance(
        headless=True,
        proxy='http://example.com:8080',
        user_agent='my-user-agent',
        wait_time={'min': 1, 'max': 3}
    )
    async with browser_instance.session():
    # Setting a seed to make the test predictable
        random.seed(1)

        # Test valid wait_time dictionary
        await browser_instance.wait_random()

        # Test invalid wait_time dictionary
        browser_instance.wait_time = {'min': 1}
        with pytest.raises(ValueError):
            await browser_instance.wait_random()




@pytest.mark.asyncio
async def test_navigate_to() -> None:
    browser_instance = await BrowserInstance.create(
        headless=False,
        proxy=None,
        user_agent=None,
        wait_time={'min': 1, 'max': 3}
    )

    valid_url = "http://example.com"

    async with browser_instance.session():
        # Test navigating to a valid URL
        await browser_instance.navigate_to(valid_url)

        # Clean up after the test
        await browser_instance.close_browser()

@pytest.mark.asyncio
async def test_click_element() -> None:
    browser_instance = await BrowserInstance.create(
        headless=False,
        proxy=None,
        user_agent=None,
        wait_time={'min': 1, 'max': 3}
    )

    async with browser_instance.session():
        # Navigate to a test page with known content
        await browser_instance.navigate_to("https://www.example.com")

        # Try clicking an element that exists
        current_url = await browser_instance.page.evaluate("() => window.location.href")
        await browser_instance.click_element('//a')
        new_url = await browser_instance.page.evaluate("() => window.location.href")
        assert new_url != current_url

        # Close the browser instance after the test
        await browser_instance.close_browser()




@pytest.mark.asyncio
async def test_get_page_html() -> None:
    browser_instance = await BrowserInstance.create(
        headless=True,
        wait_time={'min': 1, 'max': 3}
    )
    async with browser_instance.session():
        # Navigate to a test page with known content
        await browser_instance.navigate_to("https://www.example.com")

        # Get the page HTML and check that it contains an expected string
        page_html = await browser_instance.get_page_html()
        assert "<html" in page_html

        # Close the browser instance after the test
        await browser_instance.close_browser()
