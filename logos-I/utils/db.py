from datetime import datetime, timedelta
import os
from supabase import create_client, Client

from utils.auth import OAuthTokenData

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)


def get_supabase_client() -> Client:
    return supabase


def upsert_oauth_credentials(user_id: str, provider: str, token_data: OAuthTokenData):
    return (
        supabase.table("oauth_credentials")
        .upsert(
            {
                "user_id": user_id,
                "provider": provider,
                "access_token": token_data.access_token,
                "refresh_token": token_data.refresh_token,
                "expires_at": token_data.expires_at,
                "scope": token_data.scope,
                "token_type": token_data.token_type,
                "id": token_data.id,
            }
        )
        .execute()
    )


def get_expiring_oauth_credentials():
    credentials = (
        supabase.table("oauth_credentials")
        .select("*")
        .lte("expires_at", datetime.now() + timedelta(days=1))
        .execute()
    )
    return [OAuthTokenData(**credential) for credential in credentials.data]


def get_oauth_credentials(user_id: str, provider: str):
    return (
        supabase.table("oauth_credentials")
        .select("*")
        .eq("user_id", user_id)
        .eq("provider", provider)
        .execute()
    )


def delete_oauth_credentials(user_id: str, provider: str):
    return (
        supabase.table("oauth_credentials")
        .delete()
        .eq("user_id", user_id)
        .eq("provider", provider)
        .execute()
    )
