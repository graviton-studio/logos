import os
from typing import Dict, Any, Optional
from mcp.server.fastmcp import FastMCP
from integrations.exa_search import (
    ExaSearchClient,
    ExaSearchRequest,
    ExaSearchFullTextContentRequest,
    ExaSearchWithStructuredSchemaRequest,
    ExaFindSimilarRequest,
    ExaFindSimilarFullTextContentRequest,
)


def register_exa_tools(mcp: FastMCP):
    @mcp.tool(
        name="exa_search",
        description="Perform an Exa search given an input query and retrieve a list of relevant results as links.",
    )
    async def exa_search(query: str, num_results: int = 10):
        exa = ExaSearchClient(os.getenv("EXA_API_KEY"))
        request = ExaSearchRequest(query=query, num_results=num_results)
        result = await exa.search(request.query, request.num_results)
        return result

    @mcp.tool(
        name="exa_search_full_text_content",
        description="Perform an Exa search given an input query and retrieve a list of relevant results as links, optionally including the full text and/or highlights of the content.",
    )
    async def exa_search_full_text_content(
        query: str, num_results: int = 10, text: bool = True, highlights: bool = True
    ):
        exa = ExaSearchClient(os.getenv("EXA_API_KEY"))
        request = ExaSearchFullTextContentRequest(
            query=query, num_results=num_results, text=text, highlights=highlights
        )
        result = await exa.search_full_text_content(
            request.query,
            request.num_results,
            text=request.text,
            highlights=request.highlights,
        )
        return result

    @mcp.tool(
        name="exa_search_with_structured_schema",
        description="Perform an Exa search given an input query and a structured schema for the results, and retrieve a list of relevant results as links, optionally including the full text and/or highlights of the content.",
    )
    async def exa_search_with_structured_schema(
        query: str, num_results: int = 10, schema: Optional[Dict[str, Any]] = None
    ):
        exa = ExaSearchClient(os.getenv("EXA_API_KEY"))
        request = ExaSearchWithStructuredSchemaRequest(
            query=query, num_results=num_results, schema=schema
        )
        result = await exa.search_with_structured_schema(
            request.query, request.num_results, schema=request.schema
        )
        return result

    @mcp.tool(
        name="exa_find_similar",
        description="Perform an Exa search given an input query and retrieve a list of similar results as links.",
    )
    async def exa_find_similar(query: str, num_results: int = 10):
        exa = ExaSearchClient(os.getenv("EXA_API_KEY"))
        request = ExaFindSimilarRequest(query=query, num_results=num_results)
        result = await exa.find_similar(request.query, request.num_results)
        return result

    @mcp.tool(
        name="exa_find_similar_full_text_content",
        description="Perform an Exa search given an input query and retrieve a list of similar results as links, optionally including the full text and/or highlights of the content.",
    )
    async def exa_find_similar_full_text_content(
        query: str, num_results: int = 10, text: bool = True, highlights: bool = True
    ):
        exa = ExaSearchClient(os.getenv("EXA_API_KEY"))
        request = ExaFindSimilarFullTextContentRequest(
            query=query, num_results=num_results, text=text, highlights=highlights
        )
        result = await exa.find_similar_full_text_content(
            request.query,
            request.num_results,
            text=request.text,
            highlights=request.highlights,
        )
        return result
