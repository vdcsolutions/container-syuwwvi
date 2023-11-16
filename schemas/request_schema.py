from typing import List, Optional, Union, Literal
from pydantic import BaseModel, PositiveInt


class Config(BaseModel):
    # Configuration model for job parameters
    headless: bool
    proxy: str
    waitTime: int
    browser: str


class Action(BaseModel):
    # Base action model with a union of possible action types
    type: Union[Literal['scrape'], Literal['click'], Literal['job']]


class Job(Action):
    # Model representing a job action
    config: Config
    multiple_pages: Optional[bool] = False
    next_page_button_xpath: Optional[str] = None
    urls: List[str]
    actions: List[Action]
    nested: bool = False

class NestedJob(Job):
    # Model representing a nested job action
    nested: bool = True

class Scrape(Action):
    # Model representing a scrape action
    type: Literal['scrape']
    label: str
    xpath: str


class Click(Action):
    # Model representing a click action
    type: Literal['click']
    xpath: str


class Request(BaseModel):
    # Model representing the overall request payload
    payload: Job


payload_data = {"payload": {
    "config": {
        "headless": True,
        "proxy": "filename",
        "waitTime": 5000,
        "browser": "your_browser_here"
    },
    "type": 'job',
    "urls": ['https://www.google.com/'],
    "multiple_pages": True,
    "next_page_button_xpath": "xpath to it",
    "actions": [
        {
            "type": "scrape",
            "xpath": "xpath to it",
            "label": "page urls",
        },
        {
            "type": "job",
            "nested": True,
            "urls": "xpath to urls",
            "actions": [
                {
                    "type": "scrape",
                    "xpath": "xpath to it",
                    "label": "page urls"
                },
                {
                    "type": "click",
                    "xpath": "xpath to it"
                }
            ]
        }
    ]
}
}

request = Request(**payload_data)
