import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { TokenService } from "@/services/tokenService";
import { createServiceClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Check for the 'code' parameter which would indicate a callback from Google
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (code) {
      // This is a callback from Google with the auth code
      // Process the code and store the tokens
      const supabase = await createServiceClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.redirect(
          new URL("/error?message=User+not+found", request.url),
        );
      }

      return handleOAuthCallback(code, user.id, searchParams.get("state"));
    } else {
      // This is the initial request to start the OAuth flow
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
  const baseOAuthURL = "https://accounts.google.com/o/oauth2/auth";

  // Get your deployment URL from environment or request
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // The redirectURI should match exactly what you registered in Google Cloud Console
  const redirectURI = `${baseUrl}/api/integrations/gdrive`;

  const scopes = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
  ];

  // Generate a state value for security and store the referrer
  const state = crypto.randomUUID();
  const referrer = request.headers.get("referer") || "/home/integrations";

  // Store state and referrer in cookies to verify when the user returns
  const cookiesInstance = await cookies();
  cookiesInstance.set("oauth_state_gdrive", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });
  cookiesInstance.set("oauth_referrer_gdrive", referrer, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  // Build the consent screen URL
  const consentScreenURL = `${baseOAuthURL}?client_id=${
    process.env.GOOGLE_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(redirectURI)}&scope=${encodeURIComponent(
    scopes.join(" "),
  )}&response_type=code&state=${state}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(consentScreenURL);
}

async function handleOAuthCallback(
  code: string,
  userId: string,
  state: string | null,
) {
  const supabase = await createServiceClient();
  // Verify the state parameter matches what we sent
  const cookiesInstance = await cookies();
  const storedState = cookiesInstance.get("oauth_state_gdrive")?.value;

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
    cookiesInstance.get("oauth_referrer_gdrive")?.value || "/home/integrations";
  cookiesInstance.set("oauth_state_gdrive", "", { maxAge: 0, path: "/" });
  cookiesInstance.set("oauth_referrer_gdrive", "", { maxAge: 0, path: "/" });

  // Exchange the code for tokens
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const redirectURI = `${baseUrl}/api/integrations/gdrive`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectURI,
        grant_type: "authorization_code",
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
    // Here you would store the tokens in your database
    // This step depends on your application's structure and database
    await TokenService.storeTokens(userId, "gdrive", tokens, supabase);

    // Redirect back to where the user came from with success parameters
    const redirectUrl = new URL(storedReferrer, baseUrl);
    redirectUrl.searchParams.set("success", "true");
    redirectUrl.searchParams.set("provider", "gdrive");
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
