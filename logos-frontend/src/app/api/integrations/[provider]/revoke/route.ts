import { createServiceClient } from "@/utils/supabase/server";
import { TokenService } from "@/services/tokenService";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const supabase = await createServiceClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider } = await params;
    await TokenService.revokeTokens(user.id, provider, supabase);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking tokens:", error);
    return NextResponse.json(
      { error: "Failed to revoke integration" },
      { status: 500 },
    );
  }
}
