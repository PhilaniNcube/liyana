"use client";

import React, { useState, useMemo } from "react";
import { FUNERAL_PACKAGES, type FuneralPackage } from "@/lib/data/funeral-rates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  User,
  Check,
  ArrowRight,
  Shield,
  HeartHandshake,
  Baby,
  GraduationCap,
  Heart,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(n);

interface CoverItem {
  label: string;
  amount: number;
  icon: React.ReactNode;
  note?: string;
}

function buildCoverItems(pkg: FuneralPackage): CoverItem[] {
  const { cover } = pkg;
  const items: CoverItem[] = [
    {
      label: "Principal Member",
      amount: cover.principalMember,
      icon: <User className="h-4 w-4" />,
      note:
        pkg.id === "ilanga"
          ? undefined
          : undefined,
    },
  ];

  if (cover.spouse != null)
    items.push({
      label: "Spouse / Partner",
      amount: cover.spouse,
      icon: <Heart className="h-4 w-4" />,
    });

  if (cover.stillBorn != null)
    items.push({
      label: "Still-Born Child",
      amount: cover.stillBorn,
      icon: <Baby className="h-4 w-4" />,
    });

  if (cover.childrenUnder6 != null)
    items.push({
      label: "Children under 6",
      amount: cover.childrenUnder6,
      icon: <Baby className="h-4 w-4" />,
    });

  if (cover.children6to13 != null)
    items.push({
      label: "Children 6 – 13",
      amount: cover.children6to13,
      icon: <Users className="h-4 w-4" />,
    });

  if (cover.children14to21 != null)
    items.push({
      label: "Children 14 – 21",
      amount: cover.children14to21,
      icon: <Users className="h-4 w-4" />,
    });

  if (cover.studentChild21to25 != null)
    items.push({
      label: "Student Child (21 – 25) Full-time student only",
      amount: cover.studentChild21to25,
      icon: <GraduationCap className="h-4 w-4" />,
      // note: "Full-time student only",
    });

  return items;
}

// ─── Plan card ───────────────────────────────────────────────────────────────

function PlanCard({
  pkg,
  selected,
  onSelect,
}: {
  pkg: FuneralPackage;
  selected: boolean;
  onSelect: () => void;
}) {
  const isFamily = pkg.type === "family";
  const coverItems = useMemo(() => buildCoverItems(pkg), [pkg]);
  const totalCover = coverItems.reduce((s, i) => s + i.amount, 0);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative w-full rounded-2xl border-2 bg-white p-0 text-left shadow-sm transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black",
        selected
          ? "border-black shadow-black/10 shadow-lg"
          : "border-slate-200 hover:border-slate-400"
      )}
      id={`plan-card-${pkg.id}`}
      aria-pressed={selected}
    >
      {/* Selected checkmark */}
      {selected && (
        <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-black text-white shadow">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}

      <div className="p-5 pb-3">
        <Badge
          variant={isFamily ? "secondary" : "outline"}
          className={cn(
            "mb-3 text-xs font-semibold",
            isFamily
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "border-slate-300 text-slate-600"
          )}
        >
          {isFamily ? (
            <Users className="mr-1.5 h-3 w-3" />
          ) : (
            <User className="mr-1.5 h-3 w-3" />
          )}
          {isFamily ? "Family Plan" : "Single Member"}
        </Badge>

        <h3 className="text-base font-bold text-slate-900 leading-snug">
          {pkg.name}
        </h3>

        <div className="mt-3 flex items-end gap-1">
          <span
            className={cn(
              "text-3xl font-extrabold",
              selected ? "text-black" : "text-slate-800"
            )}
          >
            {fmt(pkg.monthlyPremium)}
          </span>
          <span className="mb-1 text-sm text-slate-500">/month</span>
        </div>
      </div>

      <Separator />

      <div className="p-5 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Cover Breakdown
        </p>
        <ul className="space-y-2">
          {coverItems.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2 text-slate-600">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full",
                    selected
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
                {item.note && (
                  <span className="text-[10px] text-slate-400">
                    ({item.note})
                  </span>
                )}
              </span>
              <span className="font-semibold text-slate-800">
                {fmt(item.amount)}
              </span>
            </li>
          ))}
        </ul>
        {pkg.valueAddedProducts && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 leading-relaxed border border-slate-100">
            <span className="font-semibold text-slate-900 block mb-1">Value Added Products included:</span>
            {pkg.valueAddedProducts}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Summary panel ────────────────────────────────────────────────────────────

function SummaryPanel({ pkg }: { pkg: FuneralPackage }) {
  const coverItems = useMemo(() => buildCoverItems(pkg), [pkg]);

  // Annual figures
  const annualPremium = pkg.monthlyPremium * 12;

  // Cost-per-cover ratio (monthly premium vs principal cover)
  const costPerThousand = (pkg.monthlyPremium / pkg.cover.principalMember) * 1000;

  return (
    <div
      className="rounded-2xl bg-black p-6 text-white shadow-xl"
      id="calculator-summary"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Your Selected Plan
          </p>
          <h2 className="text-lg font-bold leading-tight">{pkg.name}</h2>
        </div>
      </div>

      <Separator className="mb-5 bg-white/10" />

      {/* Premium */}
      <div className="mb-4 rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
        <p className="text-xs text-white/50">Monthly Premium</p>
        <p className="mt-0.5 text-4xl font-extrabold tracking-tight">
          {fmt(pkg.monthlyPremium)}
        </p>
        <p className="mt-1 text-xs text-white/50">
          Annual cost:{" "}
          <span className="font-semibold text-white">{fmt(annualPremium)}</span>
        </p>
      </div>

      {/* Key stats */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/10">
          <p className="text-[10px] uppercase tracking-wider text-white/50">
            Principal Cover
          </p>
          <p className="mt-0.5 text-xl font-bold">
            {fmt(pkg.cover.principalMember)}
          </p>
        </div>
        <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/10">
          <p className="text-[10px] uppercase tracking-wider text-white/50">
            Plan Type
          </p>
          <p className="mt-0.5 text-xl font-bold capitalize">{pkg.type}</p>
        </div>
      </div>

      {/* Cost efficiency */}
      <div className="mb-5 rounded-xl bg-white/10 p-3 ring-1 ring-white/10">
        <p className="text-[10px] uppercase tracking-wider text-white/50">
          Cost per R1 000 of cover
        </p>
        <p className="mt-0.5 text-xl font-bold">
          {fmt(costPerThousand)}
          <span className="text-sm font-normal text-white/50">/mo</span>
        </p>
      </div>

      {/* Cover list */}
      <div className="mb-6 space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-white/40">
          Included Benefits
        </p>
        {coverItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-1.5 text-white/80">
              <Check className="h-3.5 w-3.5 shrink-0 text-white/50" />
              {item.label}
            </span>
            <span className="font-semibold">{fmt(item.amount)}</span>
          </div>
        ))}
        {pkg.valueAddedProducts && (
          <div className="mt-4 rounded-xl bg-white/5 p-3 text-xs text-white/80 leading-relaxed border border-white/10">
            <span className="font-semibold text-white block mb-1">Value Added Products included:</span>
            {pkg.valueAddedProducts}
          </div>
        )}
      </div>

      {/* CTA */}
      <Button
        asChild
        className="w-full rounded-xl bg-white py-3 text-sm font-bold text-black shadow hover:bg-slate-100"
        size="lg"
      >
        <Link
          href={`/insurance/funeral?coverAmount=${pkg.cover.principalMember}`}
          id="apply-now-btn"
        >
          Apply Now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>

      <p className="mt-3 text-center text-[10px] text-white/40">
        No hidden fees · Cancel anytime · Underwritten by a registered insurer
      </p>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <HeartHandshake className="h-8 w-8 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800">
        Select a plan to see details
      </h3>
      <p className="mt-2 max-w-xs text-sm text-slate-500">
        Click any plan card on the left to instantly see your monthly premium,
        cover breakdown, and a personalised quote summary.
      </p>
    </div>
  );
}

// ─── Comparison table ─────────────────────────────────────────────────────────

function ComparisonTable({
  onSelect,
  selectedId,
}: {
  onSelect: (pkg: FuneralPackage) => void;
  selectedId: string | null;
}) {
  const rows = [
    {
      label: "Monthly Premium",
      values: FUNERAL_PACKAGES.map((p) => fmt(p.monthlyPremium)),
      highlight: true,
    },
    {
      label: "Annual Cost",
      values: FUNERAL_PACKAGES.map((p) => fmt(p.monthlyPremium * 12)),
    },
    {
      label: "Principal Cover",
      values: FUNERAL_PACKAGES.map((p) => fmt(p.cover.principalMember)),
    },
    {
      label: "Spouse / Partner",
      values: FUNERAL_PACKAGES.map((p) =>
        p.cover.spouse != null ? fmt(p.cover.spouse) : "—"
      ),
    },
    {
      label: "Children (under 6)",
      values: FUNERAL_PACKAGES.map((p) =>
        p.cover.childrenUnder6 != null ? fmt(p.cover.childrenUnder6) : "—"
      ),
    },
    {
      label: "Children (6–13)",
      values: FUNERAL_PACKAGES.map((p) =>
        p.cover.children6to13 != null ? fmt(p.cover.children6to13) : "—"
      ),
    },
    {
      label: "Children (14–21)",
      values: FUNERAL_PACKAGES.map((p) =>
        p.cover.children14to21 != null ? fmt(p.cover.children14to21) : "—"
      ),
    },
    {
      label: "Student Child (21–25) Full-time student only",
      values: FUNERAL_PACKAGES.map((p) =>
        p.cover.studentChild21to25 != null
          ? fmt(p.cover.studentChild21to25)
          : "—"
      ),
      note: "Full-time student only",
    },
    {
      label: "Still-Born Child",
      values: FUNERAL_PACKAGES.map((p) =>
        p.cover.stillBorn != null ? fmt(p.cover.stillBorn) : "—"
      ),
    },
    {
      label: "Value Added Products",
      values: FUNERAL_PACKAGES.map((p) => p.valueAddedProducts ? p.valueAddedProducts : "—"),
    },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[600px] text-sm" id="plan-comparison-table">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-900">
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white/60">
              Benefit
            </th>
            {FUNERAL_PACKAGES.map((pkg) => (
              <th
                key={pkg.id}
                className={cn(
                  "px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider",
                  selectedId === pkg.id
                    ? "bg-black text-white"
                    : "text-white/60"
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(pkg)}
                  className="hover:text-white transition-colors"
                >
                  {pkg.name.split(" Funeral")[0]}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.label}
              className={cn(
                "border-b border-slate-50",
                i % 2 === 0 ? "bg-white" : "bg-slate-50/50",
                row.highlight && "font-semibold"
              )}
            >
              <td className="px-5 py-3 text-slate-600">{row.label}</td>
              {row.values.map((val, j) => (
                <td
                  key={j}
                  className={cn(
                    "px-5 py-3 text-center",
                    selectedId === FUNERAL_PACKAGES[j].id
                      ? "bg-slate-900/5 font-semibold text-black"
                      : val === "—"
                        ? "text-slate-300"
                        : "text-slate-700",
                    row.highlight && "text-base"
                  )}
                >
                  {val}
                </td>
              ))}
            </tr>
          ))}
          {/* Select row */}
          <tr className="bg-white">
            <td className="px-5 py-4 text-xs text-slate-400">Select Plan</td>
            {FUNERAL_PACKAGES.map((pkg) => (
              <td key={pkg.id} className="px-5 py-4 text-center">
                <button
                  type="button"
                  onClick={() => onSelect(pkg)}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
                    selectedId === pkg.id
                      ? "bg-black text-white shadow"
                      : "border border-slate-200 text-slate-600 hover:border-black hover:text-black"
                  )}
                  id={`select-plan-${pkg.id}`}
                >
                  {selectedId === pkg.id ? (
                    <>
                      <Check className="h-3 w-3" />
                      Selected
                    </>
                  ) : (
                    "Select"
                  )}
                </button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FuneralCalculatorClient() {
  const [selectedPkg, setSelectedPkg] = useState<FuneralPackage | null>(null);

  const familyPlans = FUNERAL_PACKAGES.filter((p) => p.type === "family");
  const singlePlans = FUNERAL_PACKAGES.filter((p) => p.type === "single");

  return (
    <div className="space-y-10 pt-4">
      {/* Top: plan cards + summary sticky */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Plan cards — takes 2 cols */}
        <div className="space-y-8 lg:col-span-2">
          {/* Family plans */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
              <Users className="h-5 w-5 text-slate-700" />
              Family Funeral Plans
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {familyPlans.map((pkg) => (
                <PlanCard
                  key={pkg.id}
                  pkg={pkg}
                  selected={selectedPkg?.id === pkg.id}
                  onSelect={() => setSelectedPkg(pkg)}
                />
              ))}
            </div>
          </div>

          {/* Single member plans */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
              <User className="h-5 w-5 text-slate-700" />
              Single Member Funeral Plans
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {singlePlans.map((pkg) => (
                <PlanCard
                  key={pkg.id}
                  pkg={pkg}
                  selected={selectedPkg?.id === pkg.id}
                  onSelect={() => setSelectedPkg(pkg)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Summary panel — sticky */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            {selectedPkg ? (
              <SummaryPanel pkg={selectedPkg} />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
          <Shield className="h-5 w-5 text-slate-700" />
          Side-by-Side Comparison
        </h2>
        <ComparisonTable
          selectedId={selectedPkg?.id ?? null}
          onSelect={setSelectedPkg}
        />
      </div>

      {/* Trust badges */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-center">
          {[
            {
              icon: <Shield className="h-6 w-6 text-slate-700" />,
              title: "Regulated & Compliant",
              desc: "Underwritten by a FSCA-registered insurer",
            },
            {
              icon: <HeartHandshake className="h-6 w-6 text-slate-700" />,
              title: "Compassionate Claims",
              desc: "Claims handled quickly and with dignity",
            },
            {
              icon: <Check className="h-6 w-6 text-slate-700" />,
              title: "No Medical Exam",
              desc: "Simple application, no health questionnaire required",
            },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                {item.icon}
              </div>
              <p className="font-semibold text-slate-800">{item.title}</p>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 mb-4 flex flex-col items-center text-center">
        <p className="max-w-4xl text-[10px] leading-relaxed text-slate-500">
          Funeral insurance products are underwritten by Clientèle Life Assurance Company Limited, a licensed life insurer
          and authorised Financial Services Provider (FSP No. 15268). Liyana Finance (Pty) Ltd is a juristic
          representative of Swift Underwriting Managers (Pty) Ltd, an authorised Financial Services Provider (FSP No.
          49285). Liyana Finance markets and distributes funeral insurance products on behalf of the authorised entities.
          No advice is provided. Terms and conditions apply.
        </p>
        <div className="mt-4">
          <Image
            src="/images/clientele_life.webp"
            alt="Clientèle Logo"
            width={128}
            height={48}
            className="h-12 w-auto object-contain"
          />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="rounded-2xl bg-black p-8 text-center text-white shadow-xl">
        <h2 className="text-2xl font-bold">
          Ready to protect your family?
        </h2>
        <p className="mt-2 text-white/60">
          Apply online in minutes. Coverage starts from as little as{" "}
          <strong className="text-white">
            {fmt(Math.min(...FUNERAL_PACKAGES.map((p) => p.monthlyPremium)))}
          </strong>{" "}
          per month.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="rounded-xl bg-white font-bold text-black shadow hover:bg-slate-100"
          >
            <Link href="/insurance/funeral" id="cta-apply-btn">
              Apply Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-xl border-white/20 bg-white/10 font-semibold text-white hover:bg-white/20"
          >
            <Link href="/contact" id="cta-contact-btn">
              Contact Us
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
