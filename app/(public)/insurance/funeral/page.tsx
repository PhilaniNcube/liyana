import React from "react";
import FuneralPolicyForm from "./_components/funeral-policy-form";
import Link from "next/link";
import { Calculator, ArrowRight } from "lucide-react";

export default function Page() {

  return (
    <section className="py-8 space-y-8">
      {/* Calculator banner */}
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-black px-6 py-5 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold">Not sure which plan to choose?</p>
              <p className="text-sm text-emerald-100">
                Use our interactive calculator to compare plans and premiums.
              </p>
            </div>
          </div>
          <Link
            href="/insurance/funeral/calculator"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black shadow transition hover:bg-slate-100"
            id="view-calculator-link"
          >
            View Calculator
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Policy Application Form */}
      <div className="container mx-auto px-4">
        <FuneralPolicyForm />
      </div>
    </section>
  );
}
