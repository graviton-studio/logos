from fastapi import HTTPException, status
from typing import Optional
from datetime import datetime
import httpx
from utils.auth import TokenService
from fastapi.concurrency import run_in_threadpool
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from integrations import GoogleClient
from utils.decorators import async_threadpool


class GCalClient(GoogleClient):
    def __init__(self, creds):
        super().__init__(creds, service_name="calendar", version="v3")

    def _build_service(self):
        return build("calendar", "v3", credentials=self.creds)

    def get_events(self, start=None, end=None, max_results=100):
        """Gets events from the user's primary calendar.

        Args:
            start: The start time for the events.
            end: The end time for the events.
            max_results: The maximum number of events to return.

        Returns:
            A list of events.
        """
        try:
            # Default to current time if start not provided
            if not start:
                start = datetime.utcnow().isoformat() + "Z"

            # Build query parameters
            params = {
                "maxResults": max_results,
                "singleEvents": "true",
                "orderBy": "startTime",
                "timeMin": start,
            }

            if end:
                params["timeMax"] = end

            service = self._build_service()

            events_result = (
                service.events().list(calendarId="primary", **params).execute()
            )

            return {"events": events_result.get("items", []), "success": True}
        except HttpError as error:
            return {"error": f"An error occurred: {error}", "success": False}

    @async_threadpool
    async def get_events_async(self, start=None, end=None, max_results=100):
        """Async version of get_events."""
        return self.get_events(start, end, max_results)

    def get_calendars(self):
        """Gets the user's calendars.

        Returns:
            A list of calendars.
        """
        try:
            service = self._build_service()

            calendars_result = service.calendarList().list().execute()

            return {"calendars": calendars_result.get("items", []), "success": True}
        except HttpError as error:
            return {"error": f"An error occurred: {error}", "success": False}

    @async_threadpool
    async def get_calendars_async(self):
        """Async version of get_calendars."""
        return self.get_calendars()


async def get_events(
    user_id: str,
    start: Optional[str] = None,
    end: Optional[str] = None,
    max_results: int = 100,
):
    # Check if user is connected and refresh token if needed
    credential = TokenService.refresh_token_if_needed(user_id, "gcal")
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not connected to Google Calendar",
        )

    from google.oauth2.credentials import Credentials

    credentials = Credentials(
        token=credential.access_token, refresh_token=credential.refresh_token
    )
    client = GCalClient(credentials)
    result = await client.get_events_async(start, end, max_results)

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get(
                "error", "Failed to fetch events from Google Calendar API"
            ),
        )

    return result


async def get_calendars(user_id: str):
    # Check if user is connected and refresh token if needed
    credential = TokenService.refresh_token_if_needed(user_id, "gcal")
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not connected to Google Calendar",
        )

    from google.oauth2.credentials import Credentials

    credentials = Credentials(
        token=credential.access_token, refresh_token=credential.refresh_token
    )
    client = GCalClient(credentials)
    result = await client.get_calendars_async()

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get(
                "error", "Failed to fetch calendars from Google Calendar API"
            ),
        )

    return result
