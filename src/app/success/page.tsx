import FeedbackFlow from "./FeedbackFlow";

interface Props {
  searchParams: Promise<{ business?: string; id?: string }>;
}

export default async function SuccessPage({ searchParams }: Props) {
  const { business, id } = await searchParams;
  const businessName = business ? decodeURIComponent(business) : "your business";

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        {/* Animated ring */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 animate-pulse">
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">Your call is on the way!</h1>
        <p className="mt-3 text-slate-500">
          Ava is calling you now as a receptionist for{" "}
          <span className="font-medium text-slate-700">{businessName}</span>. Pick up and see what your
          customers would experience.
        </p>

        <FeedbackFlow id={id ?? ""} />
      </div>
    </main>
  );
}
