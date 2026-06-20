"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Phase = "waiting" | "completed" | "failed";

const EXPECT_ITEMS = [
  "Ava will introduce herself as your receptionist",
  "Ask about services, pricing, or scheduling — she'll handle it",
  "She can book you into a sandbox calendar slot as a demo",
  "The call ends automatically after ~5 minutes",
];

function StarRow({
  rating,
  hovered,
  onRate,
  onHover,
}: {
  rating: number;
  hovered: number;
  onRate: (n: number) => void;
  onHover: (n: number) => void;
}) {
  return (
    <div className="flex gap-1" onMouseLeave={() => onHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => onHover(star)}
          onClick={() => onRate(star)}
          className="transition-transform hover:scale-110 focus:outline-none"
          aria-label={`${star} star`}
        >
          <svg viewBox="0 0 20 20" className="h-8 w-8" aria-hidden>
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              fill={star <= (hovered || rating) ? "#f59e0b" : "none"}
              stroke={star <= (hovered || rating) ? "#f59e0b" : "#cbd5e1"}
              strokeWidth={1}
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

function CTACard() {
  return (
    <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-6">
      <p className="text-base font-bold text-slate-900">Want this for your business?</p>
      <p className="mt-1 text-sm text-slate-500">
        Book a free 20-minute call. Sign up and get{" "}
        <span className="inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
          3 months free
        </span>.
      </p>
      <a
        href={process.env.NEXT_PUBLIC_BOOKING_URL ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
      >
        Book a 20 min call →
      </a>
    </div>
  );
}

export default function FeedbackFlow({ id }: { id: string }) {
  const [phase, setPhase] = useState<Phase>("waiting");
  const [hovered, setHovered] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (phase !== "waiting" || !id) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/demo/${id}`);
        if (!res.ok) return;
        const data: { call_status: string } = await res.json();
        if (data.call_status === "completed") setPhase("completed");
        else if (data.call_status === "failed") setPhase("failed");
      } catch {
        // ignore transient errors, keep polling
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id, phase]);

  async function handleSubmit() {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, rating, comment: comment.trim() || null }),
    }).catch(() => {});
    setSubmitted(true);
    setSubmitting(false);
  }

  if (phase === "waiting") {
    return (
      <>
        <div className="mt-8 rounded-2xl bg-white border border-slate-200 p-6 text-left space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">What to expect</p>
          {EXPECT_ITEMS.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                {i + 1}
              </span>
              <p className="text-sm text-slate-600">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-400" />
          Waiting for your call to finish…
        </div>
      </>
    );
  }

  if (phase === "failed") {
    return (
      <div className="mt-8 space-y-4">
        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600 text-center">
          The call ended unexpectedly. No worries — book a 20 min call below.
        </div>
        <CTACard />
        <Link href="/" className="inline-block text-sm text-slate-400 hover:text-slate-600 transition-colors">
          ← Try a different niche
        </Link>
      </div>
    );
  }

  // completed — feedback and CTA shown together
  return (
    <div className="mt-8 space-y-4">
      {/* Feedback widget */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 text-left">
        {submitted ? (
          <p className="text-sm text-slate-500">Thanks for the feedback!</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-800">How did Ava sound?</p>
            <p className="mt-1 text-xs text-slate-400">Optional — takes 5 seconds.</p>
            <StarRow rating={rating} hovered={hovered} onRate={setRating} onHover={setHovered} />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Any thoughts? (optional)"
              rows={2}
              className="mt-4 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="mt-3 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Saving…" : "Submit feedback"}
            </button>
          </>
        )}
      </div>

      {/* CTA — always visible */}
      <CTACard />

      <Link href="/" className="inline-block text-sm text-slate-400 hover:text-slate-600 transition-colors">
        ← Try a different niche
      </Link>
    </div>
  );
}
