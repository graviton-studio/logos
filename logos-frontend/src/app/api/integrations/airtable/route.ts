import { TokenService } from "@/services/tokenService";
import { generateCodeChallenge } from "@/utils/encryption";
import { generateCodeVerifier } from "@/utils/encryption";
import crypto from "crypto";
import { createServiceClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (code) {
      const supabase = await createServiceClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.redirect(
          new URL("/error?message=User+not+found", request.url),
        );
      }

      return handleOAuthCallback(
        request,
        user.id,
        code,
        searchParams.get("state"),
      );
    } else {
      return initiateOAuthFlow(request);
    }
  } catch (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(
      new URL("/error?message=Authentication+failed", request.url),
    );
  }
}

async function initiateOAuthFlow(request: NextRequest) {
  const baseOAuthURL = "https://airtable.com/oauth2/v1/authorize";

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const redirectURI = `${baseUrl}/api/integrations/airtable`;

  const scopes = [
    "data.records:read",
    "data.records:write",
    "data.recordComments:read",
    "data.recordComments:write",
    "schema.bases:read",
    "schema.bases:write",
    "webhook:manage",
  ];

  const state = crypto.randomUUID();
  const referrer = request.headers.get("referer") || "/home/integrations";

  const cookiesInstance = await cookies();
  cookiesInstance.set("oauth_state_airtable", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });
  cookiesInstance.set("oauth_referrer_airtable", referrer, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  cookiesInstance.set("code_verifier_airtable", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  const consentScreenURL = `${baseOAuthURL}?client_id=${process.env.AIRTABLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectURI)}&scope=${encodeURIComponent(scopes.join(" "))}&response_type=code&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  return NextResponse.redirect(consentScreenURL);
}

async function handleOAuthCallback(
  request: NextRequest,
  userId: string,
  code: string,
  state: string | null,
) {
  // Verify the state parameter matches what we sent
  const cookiesInstance = await cookies();
  const storedState = cookiesInstance.get("oauth_state_airtable")?.value;

  if (!state || state !== storedState) {
    return NextResponse.redirect(
      new URL(
        "/error?message=Invalid+state",
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      ),
    );
  }

  // Get the stored referrer and clear cookies
  const storedReferrer =
    cookiesInstance.get("oauth_referrer_airtable")?.value ||
    "/home/integrations";
  cookiesInstance.set("oauth_state_airtable", "", { maxAge: 0, path: "/" });
  cookiesInstance.set("oauth_referrer_airtable", "", { maxAge: 0, path: "/" });
  const codeVerifier = cookiesInstance.get("code_verifier_airtable")?.value;

  if (!codeVerifier) {
    return NextResponse.redirect(
      new URL("/error?message=Code+verifier+not+found", request.url),
    );
  }

  // Exchange the code for tokens
  try {
    const supabase = await createServiceClient();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const redirectURI = `${baseUrl}/api/integrations/airtable`;

    const tokenResponse = await fetch("https://airtable.com/oauth2/v1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.AIRTABLE_CLIENT_ID || "",
        redirect_uri: redirectURI,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange error:", errorData);
      return NextResponse.redirect(
        new URL("/error?message=Token+exchange+failed", baseUrl),
      );
    }

    const tokens = await tokenResponse.json();

    // Store the tokens in your database for this user
    await TokenService.storeTokens(userId, "airtable", tokens, supabase);

    // Redirect back to where the user came from with success parameters
    const redirectUrl = new URL(storedReferrer, baseUrl);
    redirectUrl.searchParams.set("success", "true");
    redirectUrl.searchParams.set("provider", "airtable");
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Token exchange error:", error);
    return NextResponse.redirect(
      new URL(
        "/error?message=Token+exchange+failed",
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      ),
    );
  }
}
