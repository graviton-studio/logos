import logging
from fastapi import logger
from utils.db import (
    get_expiring_oauth_credentials,
    delete_oauth_credentials,
)
from utils.auth import OAuthTokenData, TokenService

logger = logging.getLogger(__name__)


def refresh_oauth_credential(oauth_data: OAuthTokenData):
    try:
        token_service = TokenService()
        token_service.refresh_token_if_needed(oauth_data.user_id, oauth_data.provider)
    except Exception as e:
        logger.error(
            f"Error refreshing token for {oauth_data.user_id} {oauth_data.provider}: {e}"
        )
        delete_oauth_credentials(oauth_data.user_id, oauth_data.provider)


def refresh_all_oauth_credentials():
    credentials = get_expiring_oauth_credentials()
    for credential in credentials:
        refresh_oauth_credential(credential)


if __name__ == "__main__":
    refresh_all_oauth_credentials()
