from typing import List, Optional, Union, Literal
from pydantic import BaseModel
import json



class Config(BaseModel):
    # Configuration model for job parameters
    headless: bool
    proxy: str
    waitTime: int
    browser: str

class NestedJob(BaseModel):
    # Model representing a neted job action
    type: Literal['job']
    multiple_pages: Optional[bool] = False
    next_page_button_xpath: Optional[str] = None
    urls: List[str]
    nested: bool = True



class Scrape(BaseModel):
    # Model representing a scrape action
    type: Literal['scrape']
    label: str
    xpath: str


class Click(BaseModel):
    # Model representing a click action
    type: Literal['click']
    xpath: str
    page: Optional[int]



class Job(BaseModel):
    type: Literal['job']
    config: Config
    multiple_pages: Optional[bool] = False
    next_page_button_xpath: Optional[str] = None
    urls: Union[List[str], str]
    nested: bool = False
    actions: List[Union[Scrape,Click,NestedJob]]


class Request(BaseModel):
    # Model representing the overall request payload
    payload: Job

with open('schemas/request.json', 'r') as file:
    payload_data = json.load(file)

request = Request(**payload_data)
print(request)
