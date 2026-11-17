import { NextResponse } from "next/server";
import { getAuthenticatedServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedServerClient(request);

    if (!user) {
      return NextResponse.json({ replies: [] });
    }

    const { data, error } = await supabase
      .from("saved_replies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching replies:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ replies: data || [] });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
