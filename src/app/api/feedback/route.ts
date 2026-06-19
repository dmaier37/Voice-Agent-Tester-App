import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

const FeedbackSchema = z.object({
  id: z.string().uuid(),
  rating: z.number().int().min(1).max(5).nullable(),
  comment: z.string().max(2000).nullable(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation error" }, { status: 422 });
  }

  const { id, rating, comment } = parsed.data;

  const { error } = await supabase
    .from("demo_requests")
    .update({ feedback_rating: rating, feedback_comment: comment })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
