import type { Metadata } from "next";
import FuneralCalculatorClient from "./_components/funeral-calculator-client";

export const metadata: Metadata = {
  title: "Funeral Cover Calculator | Liyana Finance",
  description:
    "Compare funeral cover plans and calculate your monthly premium. Choose from family or single-member plans with transparent pricing.",
};

export default function FuneralCalculatorPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero section */}
      <section className="relative overflow-hidden bg-black py-16 md:py-24">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80 ring-1 ring-white/20">
              ✦ Instant Quote
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
              Funeral Cover{" "}
              <span className="text-white/60">Plans</span>
            </h1>
            <p className="mt-4 text-lg text-white/60">
              Compare our plans, see exactly what you&apos;re covered for, and
              find the right policy for you and your family — all in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Calculator section */}
      <section className="container mx-auto -mt-8 px-4 py-20">
        <FuneralCalculatorClient />
      </section>
    </main>
  );
}
