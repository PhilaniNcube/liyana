import React from "react";
import FuneralPolicyForm from "./_components/funeral-policy-form";
import Link from "next/link";
import { Calculator, ArrowRight, ShieldCheck, LogIn, UserPlus } from "lucide-react";
import { getCurrentUser } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Page() {
  const user = await getCurrentUser();

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

      {/* Policy Application Form or Auth Gate */}
      <div className="container mx-auto px-4">
        {user ? (
          <FuneralPolicyForm />
        ) : (
          <div className="mx-auto max-w-lg">
            <Card className="border-slate-200">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <ShieldCheck className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle className="text-2xl">Apply for Funeral Cover</CardTitle>
                <CardDescription>
                  Sign up or log in to start your funeral cover application. It
                  only takes a few minutes, and your details stay secure.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild size="lg" className="w-full">
                  <Link href="/auth/sign-up?next=/insurance/funeral">
                    <UserPlus className="h-4 w-4" />
                    Sign up to apply
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full">
                  <Link href="/auth/login?next=/insurance/funeral">
                    <LogIn className="h-4 w-4" />
                    Log in
                  </Link>
                </Button>
                <p className="pt-2 text-center text-xs text-muted-foreground">
                  You can still use the{" "}
                  <Link
                    href="/insurance/funeral/calculator"
                    className="underline underline-offset-4"
                  >
                    calculator
                  </Link>{" "}
                  to compare plans before signing up.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}
