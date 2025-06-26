from typing import Dict, List, Any, Optional
from mcp.server.fastmcp import FastMCP
from integrations.airtable import AirtableClient
from utils.auth import TokenService


def register_airtable_tools(mcp: FastMCP):
    @mcp.tool(
        name="airtable_list_bases",
        description="List all accessible Airtable bases",
    )
    async def list_bases(user_id: str, force: bool = False) -> List[Dict[str, Any]]:
        """List all accessible Airtable bases.

        Args:
            access_token (str): Airtable access token
            force (bool): If True, forces refresh of cached data
        """
        access_token = TokenService.refresh_token_if_needed(
            user_id, "airtable"
        ).access_token
        client = AirtableClient(access_token)
        return client.list_bases(force=force)

    @mcp.tool(
        name="airtable_get_base_schema",
        description="Get all tables in a base",
    )
    async def get_base(user_id: str, base_id: str) -> Dict[str, Any]:
        access_token = TokenService.refresh_token_if_needed(
            user_id, "airtable"
        ).access_token
        client = AirtableClient(access_token)
        return client.get_base_schema(base_id)

    @mcp.tool(
        name="airtable_get_table",
        description="Get a table from a base",
    )
    async def get_table(user_id: str, base_id: str, table_name: str) -> Dict[str, Any]:
        access_token = TokenService.refresh_token_if_needed(
            user_id, "airtable"
        ).access_token
        client = AirtableClient(access_token)
        return client.get_table(base_id, table_name)

    @mcp.tool(
        name="airtable_get_records",
        description="Get records from an Airtable table with optional filtering",
    )
    async def get_records(
        user_id: str,
        base_id: str,
        table_name: str,
        formula: Optional[str] = None,
        max_records: Optional[int] = None,
        page_size: Optional[int] = None,
        fields: Optional[List[str]] = None,
        sort: Optional[List[Dict[str, str]]] = None,
    ) -> List[Dict[str, Any]]:
        """Get records from a table with optional filtering.

        Args:
            access_token (str): Airtable access token
            base_id (str): The Airtable base ID
            table_name (str): Name or ID of the table
            formula (str, optional): Airtable formula for filtering
            max_records (int, optional): Maximum number of records to return
            page_size (int, optional): Number of records per page
            fields (List[str], optional): List of field names to return
            sort (List[Dict[str, str]], optional): Sort configuration
        """
        access_token = TokenService.refresh_token_if_needed(
            user_id, "airtable"
        ).access_token
        client = AirtableClient(access_token)
        return client.get_records(
            base_id=base_id,
            table_name=table_name,
            formula=formula,
            max_records=max_records,
            page_size=page_size,
            fields=fields,
            sort=sort,
        )

    @mcp.tool(
        name="airtable_get_record",
        description="Get a single record from an Airtable table by ID",
    )
    async def get_record(
        user_id: str, base_id: str, table_name: str, record_id: str
    ) -> Dict[str, Any]:
        """Get a single record by ID.

        Args:
            access_token (str): Airtable access token
            base_id (str): The Airtable base ID
            table_name (str): Name or ID of the table
            record_id (str): The record ID
        """
        access_token = TokenService.refresh_token_if_needed(
            user_id, "airtable"
        ).access_token
        client = AirtableClient(access_token)
        return client.get_record(base_id, table_name, record_id)

    @mcp.tool(
        name="airtable_create_record",
        description="Create a new record in an Airtable table",
    )
    async def create_record(
        user_id: str, base_id: str, table_name: str, fields: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new record.

        Args:
            access_token (str): Airtable access token
            base_id (str): The Airtable base ID
            table_name (str): Name or ID of the table
            fields (Dict[str, Any]): The record fields
        """
        access_token = TokenService.refresh_token_if_needed(
            user_id, "airtable"
        ).access_token
        client = AirtableClient(access_token)
        return client.create_record(base_id, table_name, fields)

    @mcp.tool(
        name="airtable_update_record",
        description="Update an existing record in an Airtable table",
    )
    async def update_record(
        user_id: str,
        base_id: str,
        table_name: str,
        record_id: str,
        fields: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Update an existing record.

        Args:
            access_token (str): Airtable access token
            base_id (str): The Airtable base ID
            table_name (str): Name or ID of the table
            record_id (str): The record ID
            fields (Dict[str, Any]): The fields to update
        """
        access_token = TokenService.refresh_token_if_needed(
            user_id, "airtable"
        ).access_token
        client = AirtableClient(access_token)
        return client.update_record(base_id, table_name, record_id, fields)

    @mcp.tool(
        name="airtable_delete_record",
        description="Delete a record from an Airtable table",
    )
    async def delete_record(
        user_id: str, base_id: str, table_name: str, record_id: str
    ) -> Dict[str, Any]:
        """Delete a record.

        Args:
            access_token (str): Airtable access token
            base_id (str): The Airtable base ID
            table_name (str): Name or ID of the table
            record_id (str): The record ID
        """
        access_token = TokenService.refresh_token_if_needed(
            user_id, "airtable"
        ).access_token
        client = AirtableClient(access_token)
        return client.delete_record(base_id, table_name, record_id)

    @mcp.tool(
        name="airtable_batch_create_records",
        description="Create multiple records in an Airtable table in batch",
    )
    async def batch_create_records(
        user_id: str, base_id: str, table_name: str, records: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Create multiple records in batch.

        Args:
            access_token (str): Airtable access token
            base_id (str): The Airtable base ID
            table_name (str): Name or ID of the table
            records (List[Dict[str, Any]]): List of record fields to create
        """
        access_token = TokenService.refresh_token_if_needed(
            user_id, "airtable"
        ).access_token
        client = AirtableClient(access_token)
        return client.batch_create_records(base_id, table_name, records)

    @mcp.tool(
        name="airtable_batch_update_records",
        description="Update multiple records in an Airtable table in batch",
    )
    async def batch_update_records(
        user_id: str, base_id: str, table_name: str, records: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Update multiple records in batch.

        Args:
            access_token (str): Airtable access token
            base_id (str): The Airtable base ID
            table_name (str): Name or ID of the table
            records (List[Dict[str, Any]]): List of records with ID and fields to update
        """
        access_token = TokenService.refresh_token_if_needed(
            user_id, "airtable"
        ).access_token
        client = AirtableClient(access_token)
        return client.batch_update_records(base_id, table_name, records)

    @mcp.tool(
        name="airtable_batch_delete_records",
        description="Delete multiple records from an Airtable table in batch",
    )
    async def batch_delete_records(
        user_id: str, base_id: str, table_name: str, record_ids: List[str]
    ) -> List[Dict[str, Any]]:
        """Delete multiple records in batch.

        Args:
            access_token (str): Airtable access token
            base_id (str): The Airtable base ID
            table_name (str): Name or ID of the table
            record_ids (List[str]): List of record IDs to delete
        """
        access_token = TokenService.refresh_token_if_needed(
            user_id, "airtable"
        ).access_token
        client = AirtableClient(access_token)
        return client.batch_delete_records(base_id, table_name, record_ids)
