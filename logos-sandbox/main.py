import asyncio
import uvicorn
import hmac
import hashlib
import os
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request, Header
from typing import Dict, Optional

from agent import run_agent_workflow
from dotenv import load_dotenv
from utils import get_agent

# Import our logging configuration
from logging_config import setup_logger

# Set up module logger
logger = setup_logger(__name__)

# Load .env file for environment variables
load_dotenv()

app = FastAPI(
    title="Agent Workflow API",
    description="API to trigger and manage agent workflows.",
    version="0.1.0",
)


def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verify HMAC signature for webhook security."""
    if not signature or not secret:
        return False

    # Extract signature from header (format: "sha256=<signature>")
    if signature.startswith("sha256="):
        signature = signature[7:]

    # Compute expected signature
    expected_signature = hmac.new(
        secret.encode("utf-8"), payload, hashlib.sha256
    ).hexdigest()

    # Secure comparison
    return hmac.compare_digest(signature, expected_signature)


@app.post("/trigger")
async def trigger_agent_workflow_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    x_webhook_signature: Optional[str] = Header(None, alias="X-Webhook-Signature"),
) -> Dict[str, str]:
    """
    Triggers an agent workflow asynchronously with webhook signature verification.
    """
    # Get raw payload for signature verification
    payload = await request.body()

    # Verify webhook signature if secret is configured
    webhook_secret = os.getenv("WEBHOOK_SECRET")
    if webhook_secret:
        if not x_webhook_signature:
            logger.error("Missing webhook signature header")
            raise HTTPException(status_code=401, detail="Missing webhook signature")

        if not verify_webhook_signature(payload, x_webhook_signature, webhook_secret):
            logger.error("Invalid webhook signature")
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

        logger.info("Webhook signature verified successfully")
    else:
        logger.warning("No WEBHOOK_SECRET configured - skipping signature verification")

    # Parse JSON data
    try:
        data = await request.json()
    except Exception as e:
        logger.error(f"Invalid JSON payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    logger.info(f"Received trigger request: {data}")
    agent_id = data.get("agent_id")
    user_id = data.get("user_id")  # Add user validation

    if not agent_id:
        raise HTTPException(status_code=400, detail="Missing agent_id")

    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")

    logger.info(f"Received trigger request for agent: {agent_id} by user: {user_id}")

    try:
        agent_data = get_agent(agent_id)

        # Verify user has permission to trigger this agent
        if agent_data.user_id != user_id:
            logger.error(f"User {user_id} not authorized for agent {agent_id}")
            raise HTTPException(
                status_code=403, detail="Not authorized to trigger this agent"
            )

        logger.info(
            f"Authorized trigger request for agent: {agent_data.name} (ID: {agent_data.id}) by user: {user_id}"
        )
        background_tasks.add_task(run_agent_workflow, agent_data)
        return {
            "message": "Agent workflow triggered successfully in the background.",
            "agent_id": agent_data.id,
            "agent_name": agent_data.name,
        }
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        error_msg = f"Error triggering agent workflow for agent {agent_id}: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=500, detail=f"Failed to trigger agent workflow: {str(e)}"
        )


if __name__ == "__main__":
    # This will run the FastAPI application using Uvicorn
    # Ensure SSE_SERVER_URL and ANTHROPIC_API_KEY are in your .env or environment
    logger.info("Starting Agent Workflow API server...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
