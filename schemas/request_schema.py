from typing import List, Optional, Literal
from pydantic import BaseModel, PositiveInt


class Config(BaseModel):
    headless: bool
    proxy: str
    waitTime: int
    browser: str


class Action(BaseModel):
    type: Literal['scrape', 'click']
    xpath: str


class Job(BaseModel):
    config: Config
    type: Literal['paginator', 'extractor']
    urls: List
    next_page_button_xpath: Optional[str]
    actions: List[Action]
    nested: Optional[bool]


class Scrape(Action):
    label: str


class Click(Action):
    pass


class Request(BaseModel):
    data: List[Job]
