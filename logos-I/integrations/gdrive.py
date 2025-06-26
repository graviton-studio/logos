import base64
import io
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
from google.oauth2.credentials import Credentials
from integrations import GoogleClient
from utils.auth import TokenService
from utils.decorators import async_threadpool


class GDriveClient(GoogleClient):
    def __init__(self, creds):
        super().__init__(creds, service_name="drive", version="v3")

    def _build_service(self):
        return build("drive", "v3", credentials=self.creds)

    def list_files(self, page_size: int = 10, query: str = None, order_by: str = None):
        """Lists files in Google Drive.

        Args:
            page_size: Maximum number of files to return.
            query: Query string to filter files (e.g., "name contains 'test'").
            order_by: How to order the results (e.g., "name", "modifiedTime desc").

        Returns:
            List of files with metadata.
        """
        try:
            service = self._build_service()

            # Build the request parameters
            params = {
                "pageSize": page_size,
                "fields": "nextPageToken, files(id, name, mimeType, size, modifiedTime, createdTime, parents, webViewLink, webContentLink)",
            }

            if query:
                params["q"] = query
            if order_by:
                params["orderBy"] = order_by

            result = service.files().list(**params).execute()
            files = result.get("files", [])

            return {"files": files, "success": True}
        except HttpError as error:
            return {"error": f"An error occurred: {error}", "success": False}

    @async_threadpool
    async def list_files_async(
        self, page_size: int = 10, query: str = None, order_by: str = None
    ):
        """Async version of list_files."""
        return self.list_files(page_size, query, order_by)

    def get_file(self, file_id: str):
        """Gets metadata for a specific file.

        Args:
            file_id: The ID of the file to retrieve.

        Returns:
            File metadata.
        """
        try:
            service = self._build_service()
            file = (
                service.files()
                .get(
                    fileId=file_id,
                    fields="id, name, mimeType, size, modifiedTime, createdTime, parents, webViewLink, webContentLink, description",
                )
                .execute()
            )

            return {"file": file, "success": True}
        except HttpError as error:
            return {"error": f"An error occurred: {error}", "success": False}

    @async_threadpool
    async def get_file_async(self, file_id: str):
        """Async version of get_file."""
        return self.get_file(file_id)

    def create_file(
        self,
        name: str,
        mime_type: str = None,
        parent_folder_id: str = None,
        description: str = None,
    ):
        """Creates a new file (metadata only).

        Args:
            name: Name of the file.
            mime_type: MIME type of the file.
            parent_folder_id: ID of the parent folder.
            description: Description of the file.

        Returns:
            Created file metadata.
        """
        try:
            service = self._build_service()

            file_metadata = {"name": name}

            if mime_type:
                file_metadata["mimeType"] = mime_type
            if parent_folder_id:
                file_metadata["parents"] = [parent_folder_id]
            if description:
                file_metadata["description"] = description

            file = (
                service.files()
                .create(body=file_metadata, fields="id, name, mimeType, webViewLink")
                .execute()
            )

            return {"file": file, "success": True}
        except HttpError as error:
            return {"error": f"An error occurred: {error}", "success": False}

    @async_threadpool
    async def create_file_async(
        self,
        name: str,
        mime_type: str = None,
        parent_folder_id: str = None,
        description: str = None,
    ):
        """Async version of create_file."""
        return self.create_file(name, mime_type, parent_folder_id, description)

    def upload_file(
        self,
        file_path: str,
        name: str = None,
        mime_type: str = None,
        parent_folder_id: str = None,
        description: str = None,
    ):
        """Uploads a file to Google Drive.

        Args:
            file_path: Path to the local file to upload.
            name: Name for the file in Drive (defaults to filename).
            mime_type: MIME type of the file.
            parent_folder_id: ID of the parent folder.
            description: Description of the file.

        Returns:
            Uploaded file metadata.
        """
        try:
            service = self._build_service()

            # Use filename if name not provided
            if not name:
                import os

                name = os.path.basename(file_path)

            file_metadata = {"name": name}

            if parent_folder_id:
                file_metadata["parents"] = [parent_folder_id]
            if description:
                file_metadata["description"] = description

            media = MediaFileUpload(file_path, mimetype=mime_type, resumable=True)

            file = (
                service.files()
                .create(
                    body=file_metadata,
                    media_body=media,
                    fields="id, name, mimeType, size, webViewLink",
                )
                .execute()
            )

            return {"file": file, "success": True}
        except HttpError as error:
            return {"error": f"An error occurred: {error}", "success": False}

    @async_threadpool
    async def upload_file_async(
        self,
        file_path: str,
        name: str = None,
        mime_type: str = None,
        parent_folder_id: str = None,
        description: str = None,
    ):
        """Async version of upload_file."""
        return self.upload_file(
            file_path, name, mime_type, parent_folder_id, description
        )

    def download_file(self, file_id: str, file_path: str = None):
        """Downloads a file from Google Drive.

        Args:
            file_id: ID of the file to download.
            file_path: Local path to save the file (optional).

        Returns:
            File content or success status.
        """
        try:
            service = self._build_service()

            # Get file metadata first
            file_metadata = service.files().get(fileId=file_id).execute()

            # Download the file content
            request = service.files().get_media(fileId=file_id)

            if file_path:
                # Save to file
                with open(file_path, "wb") as fh:
                    downloader = MediaIoBaseDownload(fh, request)
                    done = False
                    while done is False:
                        status, done = downloader.next_chunk()

                return {
                    "file_path": file_path,
                    "file_name": file_metadata.get("name"),
                    "success": True,
                }
            else:
                # Return content as bytes
                fh = io.BytesIO()
                downloader = MediaIoBaseDownload(fh, request)
                done = False
                while done is False:
                    status, done = downloader.next_chunk()

                content = fh.getvalue()
                return {
                    "content": base64.b64encode(content).decode("utf-8"),
                    "file_name": file_metadata.get("name"),
                    "success": True,
                }

        except HttpError as error:
            return {"error": f"An error occurred: {error}", "success": False}

    @async_threadpool
    async def download_file_async(self, file_id: str, file_path: str = None):
        """Async version of download_file."""
        return self.download_file(file_id, file_path)

    def delete_file(self, file_id: str):
        """Deletes a file from Google Drive.

        Args:
            file_id: ID of the file to delete.

        Returns:
            Success status.
        """
        try:
            service = self._build_service()
            service.files().delete(fileId=file_id).execute()

            return {"message": f"File {file_id} deleted successfully", "success": True}
        except HttpError as error:
            return {"error": f"An error occurred: {error}", "success": False}

    @async_threadpool
    async def delete_file_async(self, file_id: str):
        """Async version of delete_file."""
        return self.delete_file(file_id)

    def create_folder(self, name: str, parent_folder_id: str = None):
        """Creates a new folder in Google Drive.

        Args:
            name: Name of the folder.
            parent_folder_id: ID of the parent folder.

        Returns:
            Created folder metadata.
        """
        try:
            service = self._build_service()

            file_metadata = {
                "name": name,
                "mimeType": "application/vnd.google-apps.folder",
            }

            if parent_folder_id:
                file_metadata["parents"] = [parent_folder_id]

            folder = (
                service.files()
                .create(body=file_metadata, fields="id, name, webViewLink")
                .execute()
            )

            return {"folder": folder, "success": True}
        except HttpError as error:
            return {"error": f"An error occurred: {error}", "success": False}

    @async_threadpool
    async def create_folder_async(self, name: str, parent_folder_id: str = None):
        """Async version of create_folder."""
        return self.create_folder(name, parent_folder_id)

    def search_files(self, query: str, page_size: int = 10):
        """Searches for files in Google Drive.

        Args:
            query: Search query (e.g., "name contains 'test'" or "mimeType='image/jpeg'").
            page_size: Maximum number of results to return.

        Returns:
            List of matching files.
        """
        try:
            service = self._build_service()

            result = (
                service.files()
                .list(
                    q=query,
                    pageSize=page_size,
                    fields="nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink)",
                )
                .execute()
            )

            files = result.get("files", [])

            return {"files": files, "query": query, "success": True}
        except HttpError as error:
            return {"error": f"An error occurred: {error}", "success": False}

    @async_threadpool
    async def search_files_async(self, query: str, page_size: int = 10):
        """Async version of search_files."""
        return self.search_files(query, page_size)

    def copy_file(self, file_id: str, name: str, parent_folder_id: str = None):
        """Creates a copy of a file.

        Args:
            file_id: ID of the file to copy.
            name: Name for the copied file.
            parent_folder_id: ID of the parent folder for the copy.

        Returns:
            Copied file metadata.
        """
        try:
            service = self._build_service()

            file_metadata = {"name": name}

            if parent_folder_id:
                file_metadata["parents"] = [parent_folder_id]

            copied_file = (
                service.files()
                .copy(
                    fileId=file_id,
                    body=file_metadata,
                    fields="id, name, mimeType, webViewLink",
                )
                .execute()
            )

            return {"file": copied_file, "success": True}
        except HttpError as error:
            return {"error": f"An error occurred: {error}", "success": False}

    @async_threadpool
    async def copy_file_async(
        self, file_id: str, name: str, parent_folder_id: str = None
    ):
        """Async version of copy_file."""
        return self.copy_file(file_id, name, parent_folder_id)


# Pydantic models for request validation
class ListFilesRequest(BaseModel):
    user_id: str
    page_size: int = 10
    query: Optional[str] = None
    order_by: Optional[str] = None


class GetFileRequest(BaseModel):
    user_id: str
    file_id: str


class CreateFileRequest(BaseModel):
    user_id: str
    name: str
    mime_type: Optional[str] = None
    parent_folder_id: Optional[str] = None
    description: Optional[str] = None


class UploadFileRequest(BaseModel):
    user_id: str
    file_path: str
    name: Optional[str] = None
    mime_type: Optional[str] = None
    parent_folder_id: Optional[str] = None
    description: Optional[str] = None


class DownloadFileRequest(BaseModel):
    user_id: str
    file_id: str
    file_path: Optional[str] = None


class DeleteFileRequest(BaseModel):
    user_id: str
    file_id: str


class CreateFolderRequest(BaseModel):
    user_id: str
    name: str
    parent_folder_id: Optional[str] = None


class SearchFilesRequest(BaseModel):
    user_id: str
    query: str
    page_size: int = 10


class CopyFileRequest(BaseModel):
    user_id: str
    file_id: str
    name: str
    parent_folder_id: Optional[str] = None
