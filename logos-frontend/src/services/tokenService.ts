// services/tokenService.ts
import { encrypt, decrypt } from "@/utils/encryption";
import { Database } from "@/types/supabase"; // assume you generated types!
import { SupabaseClient } from "@supabase/supabase-js";

export class TokenService {
  static async storeTokens(
    userId: string,
    provider: string,
    tokens: {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
      scope?: string;
    },
    supabase: SupabaseClient<Database>,
  ): Promise<string> {
    let expiresAt = null;
    if (tokens.expires_in) {
      expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    }

    const { data: existing, error: findError } = await supabase
      .from("oauth_credentials")
      .select("id")
      .eq("user_id", userId)
      .eq("provider", provider)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      const { error: updateError } = await supabase
        .from("oauth_credentials")
        .update({
          access_token: encrypt(tokens.access_token),
          refresh_token: tokens.refresh_token
            ? encrypt(tokens.refresh_token)
            : null,
          expires_at: expiresAt,
          token_type: tokens.token_type || "Bearer",
          scope: tokens.scope || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) throw updateError;

      return existing.id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("oauth_credentials")
        .insert({
          user_id: userId,
          provider,
          access_token: encrypt(tokens.access_token),
          refresh_token: tokens.refresh_token
            ? encrypt(tokens.refresh_token)
            : null,
          expires_at: expiresAt,
          token_type: tokens.token_type || "Bearer",
          scope: tokens.scope || "",
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      return inserted.id;
    }
  }

  static async getAccessToken(
    userId: string,
    provider: string,
    supabase: SupabaseClient<Database>,
  ): Promise<{
    accessToken: string;
    tokenType: string;
    isExpired: boolean;
  } | null> {
    const { data: credential, error } = await supabase
      .from("oauth_credentials")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", provider)
      .maybeSingle();

    if (error) throw error;
    if (!credential) return null;

    const isExpired = credential.expires_at
      ? new Date() > new Date(credential.expires_at)
      : false;

    if (isExpired && credential.refresh_token) {
      try {
        const newCredential = await this.refreshToken(credential, supabase);
        return {
          accessToken: decrypt(newCredential.access_token),
          tokenType: newCredential.token_type,
          isExpired: false,
        };
      } catch (error) {
        console.error("Failed to refresh token:", error);
      }
    }

    return {
      accessToken: decrypt(credential.access_token),
      tokenType: credential.token_type,
      isExpired,
    };
  }

  private static async refreshToken(
    credential: Database["public"]["Tables"]["oauth_credentials"]["Row"],
    supabase: SupabaseClient<Database>,
  ): Promise<Database["public"]["Tables"]["oauth_credentials"]["Row"]> {
    if (!credential.refresh_token) {
      throw new Error("No refresh token available");
    }

    const refreshToken = decrypt(credential.refresh_token);
    const provider = credential.provider;

    const refreshEndpoints: Record<string, string> = {
      gmail: "https://oauth2.googleapis.com/token",
      gcal: "https://oauth2.googleapis.com/token",
      gdrive: "https://oauth2.googleapis.com/token",
      // Add more providers if needed
    };

    if (!refreshEndpoints[provider]) {
      throw new Error(`Refresh not implemented for provider: ${provider}`);
    }

    const response = await fetch(refreshEndpoints[provider], {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env[`${provider.toUpperCase()}_CLIENT_ID`],
        client_secret: process.env[`${provider.toUpperCase()}_CLIENT_SECRET`],
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token refresh failed: ${JSON.stringify(errorData)}`);
    }

    const tokens = await response.json();
    let expiresAt = null;
    if (tokens.expires_in) {
      expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    }

    const { data: updated, error } = await supabase
      .from("oauth_credentials")
      .update({
        access_token: encrypt(tokens.access_token),
        ...(tokens.refresh_token
          ? { refresh_token: encrypt(tokens.refresh_token) }
          : {}),
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", credential.id)
      .select("*")
      .single();

    if (error) throw error;

    return updated;
  }

  static async revokeTokens(
    userId: string,
    provider: string,
    supabase: SupabaseClient<Database>,
  ): Promise<boolean> {
    const { data: credential, error } = await supabase
      .from("oauth_credentials")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", provider)
      .maybeSingle();

    if (error) throw error;
    if (!credential) return false;

    const { error: deleteError } = await supabase
      .from("oauth_credentials")
      .delete()
      .eq("id", credential.id);

    if (deleteError) throw deleteError;

    if (["gmail", "gcal", "gdrive"].includes(provider)) {
      const accessToken = decrypt(credential.access_token);

      try {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          },
        );
      } catch (error) {
        console.error("Error revoking token with provider:", error);
      }
    }

    return true;
  }
}
