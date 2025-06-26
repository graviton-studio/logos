import json
from typing import Dict, List, Any, Optional, Union
from pyairtable import Api
from pyairtable.formulas import match
from datetime import date, datetime


class AirtableClient:
    def __init__(self, access_token: str):
        """Initialize Airtable client with access token."""
        self.api = Api(access_token)

    def get_base_schema(self, base_id: str, validate: bool = False):
        """Get a base schema by ID.

        Args:
            base_id (str): The Airtable base ID
            validate (bool): If True, validates the base exists
        """
        base = self.api.base(base_id, validate=validate)
        return base.schema().model_dump()

    def get_table(self, base_id: str, table_name: str, validate: bool = False):
        """Get a table from a base.

        Args:
            base_id (str): The Airtable base ID
            table_name (str): Name or ID of the table
            validate (bool): If True, validates the table exists
        """
        return self.api.table(base_id, table_name, validate=validate)

    def list_bases(self, force: bool = False) -> List[Dict[str, Any]]:
        """List all accessible bases.

        Args:
            force (bool): If True, forces refresh of cached data
        """
        return self.api.bases(force=force)

    def get_records(
        self,
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
            base_id (str): The Airtable base ID
            table_name (str): Name or ID of the table
            formula (str, optional): Airtable formula for filtering
            max_records (int, optional): Maximum number of records to return
            page_size (int, optional): Number of records per page
            fields (List[str], optional): List of field names to return
            sort (List[Dict[str, str]], optional): Sort configuration
        """
        table = self.get_table(base_id, table_name)
        return table.all(
            # formula=formula,
            # max_records=max_records,
            # page_size=page_size,
            # fields=fields,
            # sort=sort,
        )

    def get_record(
        self, base_id: str, table_name: str, record_id: str
    ) -> Dict[str, Any]:
        """Get a single record by ID.

        Args:
            base_id (str): The Airtable base ID
            table_name (str): Name or ID of the table
            record_id (str): The record ID
        """
        table = self.get_table(base_id, table_name)
        return table.get(record_id)

    def create_record(
        self, base_id: str, table_name: str, fields: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new record.

        Args:
            base_id (str): The Airtable base ID
            table_name (str): Name or ID of the table
            fields (Dict[str, Any]): The record fields
        """
        table = self.get_table(base_id, table_name)
        return table.create(fields)

    def update_record(
        self, base_id: str, table_name: str, record_id: str, fields: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update an existing record.

        Args:
            base_id (str): The Airtable base ID
            table_name (str): Name or ID of the table
            record_id (str): The record ID
            fields (Dict[str, Any]): The fields to update
        """
        table = self.get_table(base_id, table_name)
        return table.update(record_id, fields)

    def delete_record(
        self, base_id: str, table_name: str, record_id: str
    ) -> Dict[str, Any]:
        """Delete a record.

        Args:
            base_id (str): The Airtable base ID
            table_name (str): Name or ID of the table
            record_id (str): The record ID
        """
        table = self.get_table(base_id, table_name)
        return table.delete(record_id)

    def batch_create_records(
        self, base_id: str, table_name: str, records: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Create multiple records in batch.

        Args:
            base_id (str): The Airtable base ID
            table_name (str): Name or ID of the table
            records (List[Dict[str, Any]]): List of record fields to create
        """
        table = self.get_table(base_id, table_name)
        return table.batch_create(records)

    def batch_update_records(
        self, base_id: str, table_name: str, records: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Update multiple records in batch.

        Args:
            base_id (str): The Airtable base ID
            table_name (str): Name or ID of the table
            records (List[Dict[str, Any]]): List of records with ID and fields to update
        """
        table = self.get_table(base_id, table_name)
        return table.batch_update(records)

    def batch_delete_records(
        self, base_id: str, table_name: str, record_ids: List[str]
    ) -> List[Dict[str, Any]]:
        """Delete multiple records in batch.

        Args:
            base_id (str): The Airtable base ID
            table_name (str): Name or ID of the table
            record_ids (List[str]): List of record IDs to delete
        """
        table = self.get_table(base_id, table_name)
        return table.batch_delete(record_ids)

    def get_user_info(self) -> Dict[str, Any]:
        """Get information about the authenticated user."""
        return self.api.whoami()
