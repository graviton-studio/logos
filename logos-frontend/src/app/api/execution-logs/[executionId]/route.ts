import { getExecutionLogs } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{
    executionId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { executionId } = await params;

    // Verify user authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch execution logs
    const { logs, error } = await getExecutionLogs(executionId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch execution logs" },
        { status: 500 },
      );
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error in execution logs API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
