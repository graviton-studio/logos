from datetime import datetime, timezone
import os
from typing import List, Dict, Any
import asyncio
import uuid

from supabase import create_client, Client
from dotenv import load_dotenv

from logging_config import setup_logger
from models import Agent, AgentExecution, AgentExecutionLog

load_dotenv()

logger = setup_logger(__name__)


def serialize_for_database(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recursively serialize data for database insertion, converting datetime objects to ISO strings.
    """
    serialized = {}
    for key, value in data.items():
        if isinstance(value, datetime):
            serialized[key] = value.isoformat()
        elif isinstance(value, dict):
            serialized[key] = serialize_for_database(value)
        elif isinstance(value, list):
            serialized[key] = [
                (
                    item.isoformat()
                    if isinstance(item, datetime)
                    else (
                        serialize_for_database(item) if isinstance(item, dict) else item
                    )
                )
                for item in value
            ]
        else:
            serialized[key] = value
    return serialized


def create_supabase_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    if not supabase_url or not supabase_key:
        raise EnvironmentError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env")
    supabase = create_client(supabase_url, supabase_key)
    return supabase


class SupabaseDBLogClient:
    """
    An asynchronous adapter for the synchronous Supabase client to handle
    agent execution logging.
    """

    def __init__(self, supabase_client: Client):
        self.client = supabase_client

    async def insert_agent_execution(self, execution_data: AgentExecution) -> str:
        """
        Inserts an AgentExecution record into the 'agent_executions' table.
        Returns the ID of the inserted record.
        """
        data_to_insert = serialize_for_database(execution_data.model_dump())
        try:
            response = await asyncio.to_thread(
                self.client.table("agent_executions").insert(data_to_insert).execute
            )
            if response.data:
                inserted_id = response.data[0].get("id", execution_data.id)
                return inserted_id
            else:
                raise Exception(
                    f"Failed to insert AgentExecution, no data returned. Supabase error: {response.error}"
                )
        except Exception as e:
            raise

    async def update_agent_execution(
        self, execution_id: str, update_data: Dict[str, Any]
    ):
        """
        Updates an AgentExecution record in the 'agent_executions' table.
        """
        try:
            serialized_data = serialize_for_database(update_data)
            await asyncio.to_thread(
                self.client.table("agent_executions")
                .update(serialized_data)
                .eq("id", execution_id)
                .execute
            )
        except Exception as e:
            raise

    async def insert_agent_execution_log(self, log_data: AgentExecutionLog):
        """
        Inserts an AgentExecutionLog record into the 'agent_execution_logs' table.
        """
        data_to_insert = serialize_for_database(log_data.model_dump())
        try:
            await asyncio.to_thread(
                self.client.table("agent_execution_logs").insert(data_to_insert).execute
            )
        except Exception as e:
            logger.error(f"Error inserting AgentExecutionLog: {e}")
            raise

    async def upsert_agent_execution_log(self, log_data: AgentExecutionLog):
        """
        Upserts an AgentExecutionLog record into the 'agent_execution_logs' table.
        If a record with the same ID exists, it will be updated; otherwise, it will be inserted.
        """
        data_to_upsert = serialize_for_database(log_data.model_dump())
        try:
            await asyncio.to_thread(
                self.client.table("agent_execution_logs").upsert(data_to_upsert).execute
            )
        except Exception as e:
            logger.error(f"Error upserting AgentExecutionLog: {e}")
            raise

    async def insert_agent(self, agent_data: Agent) -> Agent:
        """
        Inserts an Agent record into the 'agents' table.
        Returns the agent data, including the ID used for insertion.
        """

        data_to_insert = agent_data.model_dump(mode="json")
        # Ensure complex fields like 'graph' and 'structured_instructions' are properly serialized if they exist
        # model_dump(mode='json') should handle Pydantic sub-models correctly.

        try:
            response = await asyncio.to_thread(
                self.client.table("agents").insert(data_to_insert).execute
            )
            if response.data:
                # Supabase insert returns the inserted record(s) in response.data
                # We assume agent_data.id was used or confirmed by the DB.
                logger.info(
                    f"Successfully inserted Agent: {response.data[0].get('id', agent_data.id)}"
                )
                # Return the original agent_data as it contains the full model structure.
                # The response.data[0] might only be a subset of fields depending on DB return config.
                # We trust that the ID in agent_data is the one now in the DB.
                return agent_data
            else:
                error_detail = (
                    response.error.message
                    if response.error
                    else "No data returned from Supabase on agent insert."
                )
                logger.error(
                    f"Failed to insert Agent {agent_data.id}. Error: {error_detail}"
                )
                raise Exception(
                    f"Failed to insert Agent {agent_data.id}. Supabase error: {error_detail}"
                )
        except Exception as e:
            logger.error(f"Error inserting Agent {agent_data.id}: {e}", exc_info=True)
            raise

    async def delete_agent(self, agent_id: str) -> None:
        """
        Deletes an Agent record from the 'agents' table by its ID.
        """
        if not agent_id:
            logger.warning("delete_agent called with no agent_id.")
            return
        try:
            response = await asyncio.to_thread(
                self.client.table("agents").delete().eq("id", agent_id).execute
            )
            # Check response.data or response.error for confirmation if needed.
            # Supabase delete often returns the deleted records in response.data.
            if response.error:
                logger.error(
                    f"Error deleting Agent {agent_id} from Supabase: {response.error.message}"
                )
                raise Exception(
                    f"Error deleting Agent {agent_id}: {response.error.message}"
                )
            elif not response.data:
                logger.warning(
                    f"Attempted to delete Agent {agent_id}, but it was not found or not returned by Supabase."
                )
            else:
                logger.info(f"Successfully deleted Agent: {agent_id}")
        except Exception as e:
            logger.error(f"Error deleting Agent {agent_id}: {e}", exc_info=True)
            raise


def get_agents() -> List[Agent]:
    supabase = create_supabase_client()
    response = supabase.table("agents").select("*").execute()
    return [Agent(**agent) for agent in response.data]


def get_agent(agent_id: str = None) -> Agent:
    supabase = create_supabase_client()
    if agent_id:
        response = supabase.table("agents").select("*").eq("id", agent_id).execute()
    else:
        response = supabase.table("agents").select("*").limit(1).execute()

    if not response.data:
        raise ValueError(
            f"Agent with ID '{agent_id if agent_id else 'any (limit 1)'}' not found."
        )

    agent_data = response.data[0]

    # Parse created_at and updated_at from ISO string to datetime object, then to timestamp
    created_at_str = agent_data.get("created_at")
    updated_at_str = agent_data.get("updated_at")

    agent_data["created_at"] = datetime.fromisoformat(
        created_at_str.replace("Z", "+00:00")
    ).timestamp()
    agent_data["updated_at"] = datetime.fromisoformat(
        updated_at_str.replace("Z", "+00:00")
    ).timestamp()

    return Agent(**agent_data)


def insert_agent(agent_data: Agent) -> Agent:
    supabase = create_supabase_client()
    response = (
        supabase.table("agents").insert(agent_data.model_dump(mode="json")).execute()
    )
    return response.data[0]


def delete_agent(agent_id: str) -> None:
    supabase = create_supabase_client()
    supabase.table("agents").delete().eq("id", agent_id).execute()


def insert_agent_execution(execution_data: AgentExecution) -> str:
    supabase = create_supabase_client()
    response = (
        supabase.table("agent_executions")
        .insert(execution_data.model_dump(mode="json"))
        .execute()
    )
    return response.data[0].get("id", execution_data.id)


def delete_agent_execution(execution_id: str) -> None:
    supabase = create_supabase_client()
    supabase.table("agent_executions").delete().eq("id", execution_id).execute()
