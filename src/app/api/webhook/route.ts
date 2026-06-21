import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendCallEndedEmail } from "@/lib/email";

const COMPLETED_REASONS = new Set([
  "customer-ended-call",
  "assistant-ended-call",
  "time-limit-exceeded",
  "exceeded-max-duration",
  "hangup",
]);

interface VapiEndOfCallMessage {
  type: "end-of-call-report";
  endedReason?: string;
  transcript?: string;
  artifact?: { transcript?: string };
  call?: {
    id?: string;
    metadata?: Record<string, string>;
  };
}

interface VapiWebhookPayload {
  message?: VapiEndOfCallMessage & { type: string };
}

export async function POST(req: NextRequest) {
  let payload: VapiWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message } = payload;

  if (message?.type !== "end-of-call-report") {
    return NextResponse.json({ received: true });
  }

  const demoRequestId = message.call?.metadata?.demo_request_id;
  if (!demoRequestId) {
    console.error("[webhook] end-of-call-report missing demo_request_id in metadata", message.call);
    return NextResponse.json({ error: "Missing demo_request_id" }, { status: 422 });
  }

  const callStatus = COMPLETED_REASONS.has(message.endedReason ?? "") ? "completed" : "failed";
  const transcript = message.transcript ?? message.artifact?.transcript ?? null;

  // Fetch the row for business_name + niche_key before updating (needed for email).
  const { data: existing } = await supabase
    .from("demo_requests")
    .select("business_name, niche_key, phone_number")
    .eq("id", demoRequestId)
    .single();

  const { error: dbError } = await supabase
    .from("demo_requests")
    .update({ call_status: callStatus, transcript })
    .eq("id", demoRequestId);

  if (dbError) {
    console.error("[webhook] supabase update failed:", dbError.message);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  if (existing) {
    await sendCallEndedEmail({
      businessName: existing.business_name,
      nicheKey: existing.niche_key,
      phoneNumber: existing.phone_number,
      callStatus,
      transcript,
    });
  }

  console.log("[webhook] updated demo_requests row:", { demoRequestId, callStatus, endedReason: message.endedReason });
  return NextResponse.json({ received: true });
}
