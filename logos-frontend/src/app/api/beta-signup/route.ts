import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Insert the email into beta_submissions table
    const { error } = await supabase
      .from("beta_submissions")
      .insert([{ email }])
      .select();

    if (error) {
      // Check if it's a duplicate email error
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Email already submitted" },
          { status: 409 },
        );
      }

      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to submit email" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Successfully submitted for beta access" },
      { status: 200 },
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
