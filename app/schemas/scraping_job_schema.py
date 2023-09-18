from pydantic import BaseModel, AnyHttpUrl, constr, conint
from typing import List, Union


class ScrapeDetail(BaseModel):
    xpath: constr(min_length=1)
    label: constr(min_length=1)
    type: constr(min_length=1)


class Action(BaseModel):
    scrape: List[ScrapeDetail] = None
    click: dict = None


class ExtractorJob(BaseModel):
    type: str
    urls_list: constr(min_length=1)
    actions: List[Action]
    click: dict = None


class PaginatorJob(BaseModel):
    config: dict
    type: str
    url: AnyHttpUrl
    next_page_button: constr(min_length=1)
    actions: List[Union[Action, ExtractorJob]]


class Config(BaseModel):
    headless: bool
    proxy: str
    wait_time: dict
    user_agent: str

class ScraperJobDetails(BaseModel):
    config: Config
    type: str
    url: AnyHttpUrl = None
    next_page_button: str = None
    actions: List[Union[Action, ExtractorJob]]


def sample_job() -> ScraperJobDetails:
    return ScraperJobDetails(
        config={
            "headless": True,
            "proxy": "filename",
            "wait_time": {'min': 1, 'max': 3},
            "user_agent": 'user-agent'},
        type="extractor",
        url="https://www.google.com/",
        next_page_button="xpath to it",
        actions=[
            {
                "scrape": [
                    {
                        "xpath": "xpath to it",
                        "label": "page urls",
                        "type": "string"
                    }
                ]
            },
            {
                "job": {
                    "type": "extractor",
                    "urls_list": "page urls",
                    "actions": [
                        {
                            "scrape": [
                                {
                                    "xpath": "xpath to it",
                                    "label": "page urls",
                                    "type": "string"
                                }
                            ]
                        }
                    ],
                    "click": {
                        "xpath": "xpath to it"
                    }
                }
            }
        ]
    ).model_dump()
