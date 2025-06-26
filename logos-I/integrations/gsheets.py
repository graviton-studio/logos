import base64
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2.credentials import Credentials
from integrations import GoogleClient
from utils.auth import TokenService
from utils.decorators import async_threadpool


class GSheetsClient(GoogleClient):
    def __init__(self, creds):
        super().__init__(creds, service_name="sheets", version="v4")

    def _build_service(self):
        return build("sheets", "v4", credentials=self.creds)

    def create_spreadsheet(self, title: str):
        """Creates a new spreadsheet with the specified title.

        Args:
            title: The title of the new spreadsheet.

        Returns:
            The ID of the new spreadsheet.
        """
        try:
            service = self._build_service()
            spreadsheet = {"properties": {"title": title}}
            spreadsheet = (
                service.spreadsheets()
                .create(body=spreadsheet, fields="spreadsheetId")
                .execute()
            )

            return {"spreadsheetId": spreadsheet.get("spreadsheetId"), "success": True}
        except HttpError as error:
            return {"error": f"An error occurred: {error}", "success": False}

    @async_threadpool
    async def create_spreadsheet_async(self, title: str):
        """Async version of create_spreadsheet."""
        return self.create_spreadsheet(title)

    def get_spreadsheet(self, spreadsheet_id: str):
        """Gets the specified spreadsheet.

        Args:
            spreadsheet_id: The ID of the spreadsheet to retrieve.

        Returns:
            The spreadsheet object.
        """
        try:
            service = self._build_service()
            spreadsheet = (
                service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
            )

            return {"spreadsheet": spreadsheet, "success": True}
        except HttpError as error:
            return {"error": f"An error occurred: {error}", "success": False}

    @async_threadpool
    async def get_spreadsheet_async(self, spreadsheet_id: str):
        """Async version of get_spreadsheet."""
        return self.get_spreadsheet(spreadsheet_id)

    def get_values(self, spreadsheet_id: str, range_name: str):
        """Gets values from a spreadsheet.

        Args:
            spreadsheet_id: The ID of the spreadsheet to retrieve data from.
            range_name: The A1 notation of the range to retrieve values from.

        Returns:
            The retrieved values.
        """
        try:
            service = self._build_service()
            result = (
                service.spreadsheets()
                .values()
                .get(spreadsheetId=spreadsheet_id, range=range_name)
                .execute()
            )

            return {"values": result.get("values", []), "success": True}
        except HttpError as error:
            return {"error": f"An error occurred: {error}", "success": False}

    @async_threadpool
    async def get_values_async(self, spreadsheet_id: str, range_name: str):
        """Async version of get_values."""
        return self.get_values(spreadsheet_id, range_name)

    def update_values(
        self, spreadsheet_id: str, range_name: str, values: List[List[Any]]
    ):
        """Updates values in a spreadsheet.

        Args:
            spreadsheet_id: The ID of the spreadsheet to update.
            range_name: The A1 notation of the range to update.
            values: The values to update.

        Returns:
            The update response.
        """
        try:
            service = self._build_service()
            body = {"values": values}
            result = (
                service.spreadsheets()
                .values()
                .update(
                    spreadsheetId=spreadsheet_id,
                    range=range_name,
                    valueInputOption="RAW",
                    body=body,
                )
                .execute()
            )

            return {"updatedCells": result.get("updatedCells"), "success": True}
        except HttpError as error:
            return {"error": f"An error occurred: {error}", "success": False}

    @async_threadpool
    async def update_values_async(
        self, spreadsheet_id: str, range_name: str, values: List[List[Any]]
    ):
        """Async version of update_values."""
        return self.update_values(spreadsheet_id, range_name, values)

    def append_values(
        self, spreadsheet_id: str, range_name: str, values: List[List[Any]]
    ):
        """Appends values to a spreadsheet.

        Args:
            spreadsheet_id: The ID of the spreadsheet to append data to.
            range_name: The A1 notation of the range to append values to.
            values: The values to append.

        Returns:
            The append response.
        """
        try:
            service = self._build_service()
            body = {"values": values}
            result = (
                service.spreadsheets()
                .values()
                .append(
                    spreadsheetId=spreadsheet_id,
                    range=range_name,
                    valueInputOption="RAW",
                    insertDataOption="INSERT_ROWS",
                    body=body,
                )
                .execute()
            )

            return {"updates": result.get("updates"), "success": True}
        except HttpError as error:
            return {"error": f"An error occurred: {error}", "success": False}

    @async_threadpool
    async def append_values_async(
        self, spreadsheet_id: str, range_name: str, values: List[List[Any]]
    ):
        """Async version of append_values."""
        return self.append_values(spreadsheet_id, range_name, values)


class CreateSpreadsheetRequest(BaseModel):
    user_id: str
    title: str


class GetSpreadsheetRequest(BaseModel):
    user_id: str
    spreadsheet_id: str


class GetValuesRequest(BaseModel):
    user_id: str
    spreadsheet_id: str
    range_name: str


class UpdateValuesRequest(BaseModel):
    user_id: str
    spreadsheet_id: str
    range_name: str
    values: List[List[Any]]


class AppendValuesRequest(BaseModel):
    user_id: str
    spreadsheet_id: str
    range_name: str
    values: List[List[Any]]
