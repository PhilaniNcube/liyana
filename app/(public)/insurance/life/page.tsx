import Link from "next/link";
import React from "react";

export default function Page() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl">
          ⏳
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Life Insurance — Launching Soon
        </h1>
        <p className="mt-3 text-muted-foreground">
          We’re putting the finishing touches on our life insurance product.
          Check back soon for updates.
        </p>
        <div className="mt-6">
          <Link
            href="/contact"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
          >
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
