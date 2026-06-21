import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { sendCtaClickEmail } from "@/lib/email";

const CtaClickSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CtaClickSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  }

  const { id } = parsed.data;

  const { data: existing } = await supabase
    .from("demo_requests")
    .select("business_name, niche_key")
    .eq("id", id)
    .single();

  // Mark booked_demo and fire email — both best-effort, don't block the redirect.
  await Promise.all([
    supabase.from("demo_requests").update({ booked_demo: true }).eq("id", id),
    existing
      ? sendCtaClickEmail({ id, businessName: existing.business_name, nicheKey: existing.niche_key })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ ok: true });
}
