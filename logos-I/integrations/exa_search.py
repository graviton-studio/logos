import os
from typing import Dict, Any, Optional
from exa_py import Exa
from dotenv import load_dotenv
from pydantic import BaseModel

from utils.decorators import async_threadpool

load_dotenv()


class ExaSearchClient:
    def __init__(self, api_key: str):
        self.client = Exa(api_key)

    @async_threadpool
    def search(self, query: str, num_results: int = 10) -> Dict[str, Any]:
        return self.client.search(query, num_results=num_results)

    @async_threadpool
    def search_full_text_content(
        self,
        query: str,
        num_results: int = 10,
        text: bool = True,
        highlights: bool = True,
    ) -> Dict[str, Any]:
        return self.client.search_and_contents(
            query, text=text, highlights=highlights, num_results=num_results
        )

    @async_threadpool
    def search_with_structured_schema(
        self, query: str, num_results: int = 10, schema: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        return self.client.search_and_structured(
            query, schema=schema, num_results=num_results
        )

    @async_threadpool
    def find_similar(self, query: str, num_results: int = 10) -> Dict[str, Any]:
        return self.client.find_similar(query, num_results=num_results)

    @async_threadpool
    def find_similar_full_text_content(
        self,
        query: str,
        num_results: int = 10,
        text: bool = True,
        highlights: bool = True,
    ) -> Dict[str, Any]:
        return self.client.find_similar_and_contents(
            query, text=text, highlights=highlights, num_results=num_results
        )


class ExaSearchRequest(BaseModel):
    query: str
    num_results: Optional[int] = 10


class ExaSearchFullTextContentRequest(BaseModel):
    query: str
    num_results: Optional[int] = 10
    text: Optional[bool] = True
    highlights: Optional[bool] = True


class ExaSearchWithStructuredSchemaRequest(BaseModel):
    query: str
    num_results: Optional[int] = 10
    schema: Optional[Dict[str, Any]] = None


class ExaFindSimilarRequest(BaseModel):
    query: str
    num_results: Optional[int] = 10


class ExaFindSimilarFullTextContentRequest(BaseModel):
    query: str
    num_results: Optional[int] = 10
    text: Optional[bool] = True
    highlights: Optional[bool] = True
