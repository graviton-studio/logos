import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { TokenService } from "@/services/tokenService";
import { createServiceClient } from "@/utils/supabase/server";

// Type declaration for global state storage (development only)
declare global {
  // eslint-disable-next-line no-var
  var slackOAuthStates:
    | Map<string, { timestamp: number; userId: string }>
    | undefined;
}

// Slack OAuth v2 configuration
const SLACK_OAUTH_CONFIG = {
  authorizeUrl: "https://slack.com/oauth/v2/authorize",
  accessUrl: "https://slack.com/api/oauth.v2.access",
  scopes: {
    user: [
      "channels:read",
      "channels:history",
      "chat:write",
      "users:read",
      "groups:read",
      "im:read",
      "mpim:read",
    ],
  },
} as const;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Handle OAuth errors from Slack
    if (error) {
      console.error("Slack OAuth error:", error);
      return NextResponse.redirect(
        new URL(
          `/error?message=Slack+OAuth+error:+${encodeURIComponent(error)}`,
          getBaseUrl(request),
        ),
      );
    }

    if (code) {
      // OAuth callback - exchange code for tokens
      return handleOAuthCallback(request, code, searchParams.get("state"));
    } else {
      // Initial OAuth flow - redirect to Slack
      return initiateOAuthFlow(request);
    }
  } catch (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(
      new URL("/error?message=Authentication+failed", getBaseUrl(request)),
    );
  }
}

async function initiateOAuthFlow(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createServiceClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.redirect(
        new URL("/auth/login?message=Please+log+in+first", getBaseUrl(request)),
      );
    }

    const baseUrl = getBaseUrl(request);
    const redirectUri = `${baseUrl}/api/integrations/slack`;

    // Generate secure state parameter
    const state = crypto.randomBytes(32).toString("hex");

    // Store state in memory as backup (for development only)
    if (process.env.NODE_ENV === "development") {
      global.slackOAuthStates = global.slackOAuthStates || new Map();
      global.slackOAuthStates.set(state, {
        timestamp: Date.now(),
        userId: user.id,
      });

      // Clean up old states (older than 10 minutes)
      for (const [key, value] of global.slackOAuthStates.entries()) {
        if (Date.now() - value.timestamp > 600000) {
          global.slackOAuthStates.delete(key);
        }
      }
    }

    // Store state in multiple ways for reliability
    const cookiesInstance = await cookies();

    // Try different cookie configurations for development
    const cookieOptions = {
      httpOnly: false, // Allow client-side access for debugging
      secure: false, // Try without secure for ngrok
      sameSite: "lax" as const, // More permissive
      maxAge: 600, // 10 minutes
      path: "/",
    };

    cookiesInstance.set("slack_oauth_state", state, cookieOptions);

    // Also try a backup cookie with different settings
    cookiesInstance.set("slack_state_backup", state, {
      httpOnly: false,
      secure: false,
      sameSite: "none" as const,
      maxAge: 600,
      path: "/",
    });

    // Debug: Log state storage
    console.log("Storing OAuth state:", {
      state,
      nodeEnv: process.env.NODE_ENV,
      cookieOptions,
    });

    // Build OAuth URL with proper scopes
    const scopes = [...SLACK_OAUTH_CONFIG.scopes.user].join(",");

    const oauthUrl = new URL(SLACK_OAUTH_CONFIG.authorizeUrl);
    oauthUrl.searchParams.set("client_id", process.env.SLACK_CLIENT_ID || "");
    oauthUrl.searchParams.set("scope", scopes);
    oauthUrl.searchParams.set("state", state);
    oauthUrl.searchParams.set("redirect_uri", redirectUri);
    oauthUrl.searchParams.set(
      "user_scope",
      SLACK_OAUTH_CONFIG.scopes.user.join(","),
    );

    return NextResponse.redirect(oauthUrl.toString());
  } catch (error) {
    console.error("Error initiating OAuth flow:", error);
    return NextResponse.redirect(
      new URL(
        "/error?message=Failed+to+start+authentication",
        getBaseUrl(request),
      ),
    );
  }
}

async function handleOAuthCallback(
  request: NextRequest,
  code: string,
  state: string | null,
) {
  try {
    // Verify state parameter - try multiple sources
    const cookiesInstance = await cookies();
    const storedState = cookiesInstance.get("slack_oauth_state")?.value;
    const backupState = cookiesInstance.get("slack_state_backup")?.value;

    // Check memory-based state for development and get user ID
    let memoryState = null;
    let storedUserId = null;
    if (process.env.NODE_ENV === "development" && global.slackOAuthStates) {
      const stateData = global.slackOAuthStates.get(state || "");
      if (stateData && Date.now() - stateData.timestamp < 600000) {
        memoryState = state;
        storedUserId = stateData.userId;
      }
    }

    // Debug: Log all state sources
    console.log("OAuth callback state verification:", {
      received: state,
      stored: storedState,
      backup: backupState,
      memory: memoryState,
      storedUserId,
      allCookies: Object.fromEntries(
        Array.from(cookiesInstance.getAll()).map((cookie) => [
          cookie.name,
          cookie.value,
        ]),
      ),
    });

    // Try primary state first, then backup, then memory
    const validState = storedState || backupState || memoryState;

    if (!state || !validState || state !== validState) {
      console.error("State mismatch:", {
        received: state,
        stored: storedState,
        backup: backupState,
        valid: validState,
      });
      return NextResponse.redirect(
        new URL("/error?message=Invalid+state+parameter", getBaseUrl(request)),
      );
    }

    // Clear state cookies and memory
    cookiesInstance.delete("slack_oauth_state");
    cookiesInstance.delete("slack_state_backup");

    // Clear from memory if in development
    if (
      process.env.NODE_ENV === "development" &&
      global.slackOAuthStates &&
      state
    ) {
      global.slackOAuthStates.delete(state);
    }

    // Get user - try from session first, then from stored state
    const supabase = await createServiceClient();
    let userId = null;

    // Try to get user from current session
    const {
      data: { user: sessionUser },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("User authentication check:", {
      hasSessionUser: !!sessionUser,
      userError: userError?.message,
      storedUserId,
      sessionUserId: sessionUser?.id,
    });

    if (sessionUser && !userError) {
      userId = sessionUser.id;
      console.log("Using session user ID:", userId);
    } else if (storedUserId) {
      // Fallback: use stored user ID from state (development only)
      userId = storedUserId;
      console.log("Using stored user ID from state:", userId);
    } else {
      console.error("No user session and no stored user ID:", {
        userError,
        storedUserId,
      });
      return NextResponse.redirect(
        new URL("/auth/login?message=Session+expired", getBaseUrl(request)),
      );
    }

    // Exchange code for tokens
    const baseUrl = getBaseUrl(request);
    const redirectUri = `${baseUrl}/api/integrations/slack`;

    const tokenResponse = await fetch(SLACK_OAUTH_CONFIG.accessUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.SLACK_CLIENT_ID || "",
        client_secret: process.env.SLACK_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange HTTP error:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: errorText,
      });
      return NextResponse.redirect(
        new URL("/error?message=Token+exchange+failed", baseUrl),
      );
    }

    const tokenData = await tokenResponse.json();

    // Check Slack API response
    if (!tokenData.ok) {
      console.error("Slack API error:", tokenData);
      const errorMessage = getSlackErrorMessage(tokenData.error);
      return NextResponse.redirect(
        new URL(`/error?message=${encodeURIComponent(errorMessage)}`, baseUrl),
      );
    }

    // Validate required fields
    if (!tokenData.access_token || !tokenData.team?.id) {
      console.error("Missing required token data:", tokenData);
      return NextResponse.redirect(
        new URL("/error?message=Invalid+token+response", baseUrl),
      );
    }

    // Structure token data according to Slack OAuth v2 response
    const integrationData = {
      // Bot token (primary)
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || "bot",
      scope: tokenData.scope,

      // Team information
      team_id: tokenData.team.id,
      team_name: tokenData.team.name,

      // Bot information
      bot_user_id: tokenData.bot_user_id,
      app_id: tokenData.app_id,

      // Enterprise information (if applicable)
      enterprise_id: tokenData.enterprise?.id,
      enterprise_name: tokenData.enterprise?.name,

      // User token (if user scopes were granted)
      user_id: tokenData.authed_user?.id,
      user_access_token: tokenData.authed_user?.access_token,
      user_token_type: tokenData.authed_user?.token_type,
      user_scope: tokenData.authed_user?.scope,

      // Metadata
      installed_at: new Date().toISOString(),
      expires_at: null, // Slack tokens don't expire unless revoked
    };

    // Store tokens in database
    await TokenService.storeTokens(userId, "slack", integrationData, supabase);

    // Redirect to success page
    return NextResponse.redirect(
      new URL("/home/integrations?success=true&provider=slack", baseUrl),
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/error?message=Authentication+failed", getBaseUrl(request)),
    );
  }
}

function getBaseUrl(request: NextRequest): string {
  // For development, use the ngrok tunnel URL
  if (process.env.NODE_ENV === "development") {
    return (
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://content-minnow-formerly.ngrok-free.app"
    );
  }

  // For production, use the configured base URL or derive from request
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`
  );
}

function getSlackErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    bad_redirect_uri: "Invalid redirect URL configuration",
    invalid_scope: "Invalid or conflicting scopes requested",
    invalid_team_for_non_distributed_app:
      "App not available for this workspace",
    scope_not_allowed_on_enterprise:
      "Requested scopes not allowed on Enterprise Grid",
    unapproved_scope: "Requested scopes not approved for this app",
    access_denied: "User denied access to the application",
    invalid_code: "Authorization code is invalid or expired",
    code_already_used: "Authorization code has already been used",
  };

  return errorMessages[error] || `Slack authentication error: ${error}`;
}
