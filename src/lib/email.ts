import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM    = "onboarding@resend.dev";
const REPLY_TO = "contact@esmian.com";
const TO      = "dani.maier07@gmail.com";

// Convert raw Vapi transcript ("AI: …\nUser: …") to readable HTML lines.
function formatTranscript(raw: string | null): string {
  if (!raw) return "<p style='color:#64748b'>No transcript available.</p>";
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const styled = line
        .replace(/^AI:/,   "<strong style='color:#4f46e5'>Ava:</strong>")
        .replace(/^User:/, "<strong style='color:#0f172a'>Caller:</strong>");
      return `<p style='margin:4px 0'>${styled}</p>`;
    })
    .join("");
}

function row(label: string, value: string) {
  return `<tr>
    <td style='padding:4px 12px 4px 0;color:#64748b;white-space:nowrap;vertical-align:top'>${label}</td>
    <td style='padding:4px 0;color:#0f172a'>${value}</td>
  </tr>`;
}

export async function sendCallEndedEmail(opts: {
  businessName: string;
  nicheKey: string;
  phoneNumber: string;
  callStatus: string;
  transcript: string | null;
}) {
  const { businessName, nicheKey, phoneNumber, callStatus, transcript } = opts;
  const statusColor = callStatus === "completed" ? "#16a34a" : "#dc2626";

  await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: TO,
    subject: `[Voice Agent] Call ${callStatus} — ${businessName}`,
    html: `
      <div style='font-family:sans-serif;max-width:600px;margin:0 auto'>
        <h2 style='margin-bottom:4px'>Call ended</h2>
        <table style='border-collapse:collapse;margin-bottom:24px'>
          ${row("Business", businessName)}
          ${row("Niche", nicheKey)}
          ${row("Phone", phoneNumber)}
          ${row("Status", `<span style='color:${statusColor};font-weight:600'>${callStatus}</span>`)}
        </table>
        <h3 style='margin-bottom:8px;border-top:1px solid #e2e8f0;padding-top:16px'>Transcript</h3>
        <div style='background:#f8fafc;border-radius:8px;padding:16px;line-height:1.6;font-size:14px'>
          ${formatTranscript(transcript)}
        </div>
      </div>`,
  }).catch((err) => console.error("[email] call-ended send failed:", err));
}

export async function sendFeedbackEmail(opts: {
  id: string;
  businessName: string;
  nicheKey: string;
  rating: number | null;
  comment: string | null;
}) {
  const { id, businessName, nicheKey, rating, comment } = opts;
  const stars = rating ? "★".repeat(rating) + "☆".repeat(5 - rating) : "—";

  await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: TO,
    subject: `[Voice Agent] Feedback ${stars} — ${businessName}`,
    html: `
      <div style='font-family:sans-serif;max-width:600px;margin:0 auto'>
        <h2 style='margin-bottom:4px'>Feedback received</h2>
        <table style='border-collapse:collapse;margin-bottom:24px'>
          ${row("Business", businessName)}
          ${row("Niche", nicheKey)}
          ${row("Rating", `<span style='font-size:18px;color:#f59e0b'>${stars}</span>`)}
          ${row("Comment", comment ?? "<em style='color:#94a3b8'>none</em>")}
          ${row("Request ID", id)}
        </table>
      </div>`,
  }).catch((err) => console.error("[email] feedback send failed:", err));
}

export async function sendCtaClickEmail(opts: {
  id: string;
  businessName: string;
  nicheKey: string;
}) {
  const { id, businessName, nicheKey } = opts;

  await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: TO,
    subject: `[Voice Agent] 🔥 Demo booking clicked — ${businessName}`,
    html: `
      <div style='font-family:sans-serif;max-width:600px;margin:0 auto'>
        <h2 style='margin-bottom:4px'>Someone clicked "Book a 20 min call"</h2>
        <table style='border-collapse:collapse;margin-bottom:24px'>
          ${row("Business", businessName)}
          ${row("Niche", nicheKey)}
          ${row("Request ID", id)}
        </table>
      </div>`,
  }).catch((err) => console.error("[email] cta-click send failed:", err));
}
