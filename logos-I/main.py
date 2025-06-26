from mcp.server.fastmcp import FastMCP
from starlette.applications import Starlette
from mcp.server.sse import SseServerTransport
from starlette.requests import Request
from starlette.routing import Mount, Route
from mcp.server import Server
import uvicorn
import argparse
from dotenv import load_dotenv
from tools import register_all_tools
import os
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.exceptions import HTTPException

load_dotenv()

mcp = FastMCP("MCP Server Gateway")

# Register all tools
register_all_tools(mcp)


class APIKeyAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        authorization = request.headers.get("Authorization")

        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Missing or malformed API key. 'Authorization: Bearer <KEY>' header required.",
            )

        token = authorization.split("Bearer ", 1)[-1]

        valid_keys_env = os.getenv("VALID_API_KEYS")
        if not valid_keys_env:
            # Log server-side for ops, return generic error to client
            print("CRITICAL: VALID_API_KEYS environment variable is not set.")
            raise HTTPException(
                status_code=503, detail="Service unavailable or misconfigured."
            )

        # Parse keys, strip whitespace, and remove empty strings
        valid_keys = [key.strip() for key in valid_keys_env.split(",") if key.strip()]

        if not valid_keys:
            print(
                "CRITICAL: VALID_API_KEYS environment variable is set but contains no valid keys after parsing."
            )
            raise HTTPException(
                status_code=503, detail="Service unavailable or misconfigured."
            )

        if token not in valid_keys:
            raise HTTPException(status_code=401, detail="Invalid API key.")

        response = await call_next(request)
        return response


def create_starlette_app(mcp_server: Server, *, debug: bool = False) -> Starlette:
    """Create a Starlette application that can server the provied mcp server with SSE."""
    sse = SseServerTransport("/messages/")

    async def handle_sse(request: Request) -> None:
        async with sse.connect_sse(request.scope, request.receive, request._send) as (
            read_stream,
            write_stream,
        ):
            await mcp_server.run(
                read_stream,
                write_stream,
                mcp_server.create_initialization_options(),
            )

    return Starlette(
        debug=debug,
        routes=[
            Route("/sse", endpoint=handle_sse),
            Mount("/messages/", app=sse.handle_post_message),
        ],
        middleware=[Middleware(APIKeyAuthMiddleware)],
    )


if __name__ == "__main__":
    mcp_server = mcp._mcp_server  # noqa: WPS437

    parser = argparse.ArgumentParser(description="Run MCP SSE-based server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8080, help="Port to listen on")
    args = parser.parse_args()

    # Bind SSE request handling to MCP server
    starlette_app = create_starlette_app(mcp_server, debug=True)

    uvicorn.run(starlette_app, host=args.host, port=args.port)
