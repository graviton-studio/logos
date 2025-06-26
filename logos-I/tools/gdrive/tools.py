from mcp.server.fastmcp import FastMCP
from google.oauth2.credentials import Credentials
from utils.auth import TokenService
from integrations.gdrive import (
    GDriveClient,
    ListFilesRequest,
    GetFileRequest,
    CreateFileRequest,
    UploadFileRequest,
    DownloadFileRequest,
    DeleteFileRequest,
    CreateFolderRequest,
    SearchFilesRequest,
    CopyFileRequest,
)


def register_gdrive_tools(mcp: FastMCP):
    @mcp.tool(name="list_files", description="List files in Google Drive")
    async def list_files(request: ListFilesRequest):
        credentials = TokenService.refresh_token_if_needed(request.user_id, "gdrive")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GDriveClient(credentials)
        result = await client.list_files_async(
            request.page_size, request.query, request.order_by
        )
        return result

    @mcp.tool(name="get_file", description="Get metadata for a specific file")
    async def get_file(request: GetFileRequest):
        credentials = TokenService.refresh_token_if_needed(request.user_id, "gdrive")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GDriveClient(credentials)
        result = await client.get_file_async(request.file_id)
        return result

    @mcp.tool(
        name="create_file",
        description="Create a new file (metadata only) in Google Drive",
    )
    async def create_file(request: CreateFileRequest):
        credentials = TokenService.refresh_token_if_needed(request.user_id, "gdrive")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GDriveClient(credentials)
        result = await client.create_file_async(
            request.name,
            request.mime_type,
            request.parent_folder_id,
            request.description,
        )
        return result

    @mcp.tool(name="upload_file", description="Upload a file to Google Drive")
    async def upload_file(request: UploadFileRequest):
        credentials = TokenService.refresh_token_if_needed(request.user_id, "gdrive")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GDriveClient(credentials)
        result = await client.upload_file_async(
            request.file_path,
            request.name,
            request.mime_type,
            request.parent_folder_id,
            request.description,
        )
        return result

    @mcp.tool(name="download_file", description="Download a file from Google Drive")
    async def download_file(request: DownloadFileRequest):
        credentials = TokenService.refresh_token_if_needed(request.user_id, "gdrive")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GDriveClient(credentials)
        result = await client.download_file_async(request.file_id, request.file_path)
        return result

    @mcp.tool(name="delete_file", description="Delete a file from Google Drive")
    async def delete_file(request: DeleteFileRequest):
        credentials = TokenService.refresh_token_if_needed(request.user_id, "gdrive")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GDriveClient(credentials)
        result = await client.delete_file_async(request.file_id)
        return result

    @mcp.tool(name="create_folder", description="Create a new folder in Google Drive")
    async def create_folder(request: CreateFolderRequest):
        credentials = TokenService.refresh_token_if_needed(request.user_id, "gdrive")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GDriveClient(credentials)
        result = await client.create_folder_async(
            request.name, request.parent_folder_id
        )
        return result

    @mcp.tool(name="search_files", description="Search for files in Google Drive")
    async def search_files(request: SearchFilesRequest):
        credentials = TokenService.refresh_token_if_needed(request.user_id, "gdrive")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GDriveClient(credentials)
        result = await client.search_files_async(request.query, request.page_size)
        return result

    @mcp.tool(name="copy_file", description="Create a copy of a file in Google Drive")
    async def copy_file(request: CopyFileRequest):
        credentials = TokenService.refresh_token_if_needed(request.user_id, "gdrive")
        credentials = Credentials(
            token=credentials.access_token, refresh_token=credentials.refresh_token
        )
        client = GDriveClient(credentials)
        result = await client.copy_file_async(
            request.file_id, request.name, request.parent_folder_id
        )
        return result
