import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getNicheByKey } from "@/lib/niches";
import { supabase } from "@/lib/supabase";
import { buildSystemPrompt } from "@/lib/prompt";

const DemoRequestSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  niche_key: z.string().min(1, "Niche is required"),
  phone_number: z.string().regex(/^\+1[2-9]\d{9}$/, "Invalid US phone number"),
  consent_given: z.literal(true, "Consent is required"),
});

const RATE_LIMIT_ERROR = "You've already tried a demo recently — reach out directly if you'd like another.";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = DemoRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Validation error";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const { business_name, niche_key, phone_number } = parsed.data;
  const ip = getClientIp(req);

  const template = getNicheByKey(niche_key);
  if (!template) {
    return NextResponse.json({ error: `Unknown niche: ${niche_key}` }, { status: 422 });
  }

  // ── Rate limiting ─────────────────────────────────────────────────────────────
  const now = Date.now();
  const phoneCutoff = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const ipCutoff    = new Date(now -      60 * 60 * 1000).toISOString();

  const [phoneCheck, ipCheck] = await Promise.all([
    supabase
      .from("demo_requests")
      .select("id", { count: "exact", head: true })
      .eq("phone_number", phone_number)
      .gte("created_at", phoneCutoff),
    supabase
      .from("demo_requests")
      .select("id", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", ipCutoff),
  ]);

  if ((phoneCheck.count ?? 0) > 0 || (ipCheck.count ?? 0) > 0) {
    console.log("[rate-limit]", { phone_number, ip, phoneCount: phoneCheck.count, ipCount: ipCheck.count });
    return NextResponse.json({ error: RATE_LIMIT_ERROR }, { status: 429 });
  }

  // ── Supabase: persist the demo request ──────────────────────────────────────
  const { data: record, error: dbError } = await supabase
    .from("demo_requests")
    .insert({ business_name, niche_key, phone_number, ip_address: ip, consent_given: true, call_status: "queued", transcript: null, booked_demo: false })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // ── Vapi: place the outbound call ────────────────────────────────────────────
  const firstMessage = template.first_message.replace("{business_name}", business_name);
  const systemPrompt = buildSystemPrompt(business_name, template);
  const vapiRes = await fetch("https://api.vapi.ai/call", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      customer: { number: phone_number },
      assistant: {
        firstMessage,
        server: {
          url: `${process.env.APP_URL}/api/webhook`,
        },
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM",
          stability: 0.35,
          similarityBoost: 0.75,
          style: 0.4,
          useSpeakerBoost: true,
          speed: 1.12,
        },
        model: {
          provider: "openai",
          model: "gpt-4o",
          messages: [{ role: "system", content: systemPrompt }],
          tools: [
            { type: "endCall" },
            // Cal.com booking tool config goes here (phase 5)
          ],
        },
        maxDurationSeconds: 300,
      },
      metadata: { demo_request_id: record.id },
    }),
  });

  if (!vapiRes.ok) {
    const err = await vapiRes.json().catch(() => ({}));
    console.error("[vapi error]", err);
    return NextResponse.json({ error: (err as { message?: string }).message ?? "Vapi error" }, { status: 502 });
  }

  const vapiCall = await vapiRes.json();
  console.log("[vapi] call placed:", { call_id: vapiCall.id, to: phone_number, ip, demo_request_id: record.id });

  return NextResponse.json({ id: record.id, status: "queued" }, { status: 202 });
}
