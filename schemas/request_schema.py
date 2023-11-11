from typing import List, Optional, Literal
from pydantic import BaseModel, PositiveInt


class Config(BaseModel):
    headless: bool
    proxy: str
    waitTime: int
    browser: str


class Action(BaseModel):
    type: Literal['scrape', 'click', 'extractor', 'paginator']


class Job(Action):
    config: Optional[Config] = None
    type: Literal['paginator', 'extractor']
    urls: List
    next_page_button_xpath: Optional[str]
    actions: List[Action]
    nested: Optional[bool] = False


class NestedJob(Job):
    urls: str


class Scrape(Action):
    label: str
    xpath: str


List[Job]


class Click(Action):
    xpath: str


class Request(BaseModel):
    payload: Job


payload_data = {"payload": {
    "config": {
        "headless": True,
        "proxy": "filename",
        "waitTime": 5000,
        "browser": "your_browser_here"
    },
    "type": "paginator",
    "urls": ['https://www.google.com/'],
    "next_page_button_xpath": "xpath to it",
    "actions": [
        {
            "type": "scrape",
            "xpath": "xpath to it",
            "label": "page urls",

        },
        {
            "type": "extractor",
            "nested": "True",
            "urls": "label of scraped urls",
            "actions": [
                {
                    "type": "scrape",
                    "xpath": "xpath to it",
                    "label": "page urls"
                }

                ,
                {"type": "click",
                 "xpath": "xpath to it"
                 }
            ]
        }
    ]
}
}

request = Request(**payload_data)
