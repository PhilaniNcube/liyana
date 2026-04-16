"use client";

import React, { useState } from "react";
import {
  FUNERAL_PACKAGES,
  type FuneralPackage,
  type FuneralPackageId,
} from "@/lib/data/funeral-rates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
  }).format(amount);

function CoverBreakdown({ pkg }: { pkg: FuneralPackage }) {
  const { cover } = pkg;
  const items: { label: string; amount: number }[] = [
    { label: "Principal Member", amount: cover.principalMember },
  ];
  if (cover.spouse != null) items.push({ label: "Spouse", amount: cover.spouse });
  if (cover.stillBorn != null) items.push({ label: "Still Born", amount: cover.stillBorn });
  if (cover.childrenUnder6 != null) items.push({ label: "Children under 6", amount: cover.childrenUnder6 });
  if (cover.children6to13 != null) items.push({ label: "Children 6–13", amount: cover.children6to13 });
  if (cover.children14to21 != null) items.push({ label: "Children 14–21", amount: cover.children14to21 });
  if (cover.studentChild21to25 != null) items.push({ label: "Student Child 21–25", amount: cover.studentChild21to25 });

  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li key={item.label} className="flex justify-between">
          <span>{item.label}</span>
          <span className="font-medium">{formatCurrency(item.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function FuneralPremiumCalculator() {
  const [selectedId, setSelectedId] = useState<FuneralPackageId | null>(null);

  const familyPackages = FUNERAL_PACKAGES.filter((p) => p.type === "family");
  const singlePackages = FUNERAL_PACKAGES.filter((p) => p.type === "single");

  return (
    <div className="space-y-8 w-full">
      {/* Family Plans */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Users className="h-5 w-5" />
          Family Funeral Plans
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {familyPackages.map((pkg) => (
            <Card
              key={pkg.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md relative",
                selectedId === pkg.id && "ring-2 ring-green-600 shadow-md"
              )}
              onClick={() => setSelectedId(pkg.id)}
            >
              {selectedId === pkg.id && (
                <div className="absolute top-3 right-3">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
              )}
              <CardHeader className="pb-2">
                <Badge variant="secondary" className="w-fit mb-1">Family</Badge>
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(pkg.monthlyPremium)}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>
              </CardHeader>
              <CardContent>
                <Separator className="mb-3" />
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Cover Breakdown
                </p>
                <CoverBreakdown pkg={pkg} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Single Member Plans */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <User className="h-5 w-5" />
          Single Member Funeral Plans
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {singlePackages.map((pkg) => (
            <Card
              key={pkg.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md relative",
                selectedId === pkg.id && "ring-2 ring-green-600 shadow-md"
              )}
              onClick={() => setSelectedId(pkg.id)}
            >
              {selectedId === pkg.id && (
                <div className="absolute top-3 right-3">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
              )}
              <CardHeader className="pb-2">
                <Badge variant="outline" className="w-fit mb-1">Single Member</Badge>
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(pkg.monthlyPremium)}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>
              </CardHeader>
              <CardContent>
                <Separator className="mb-3" />
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Cover
                </p>
                <p className="text-sm">
                  Principal Member: <span className="font-medium">{formatCurrency(pkg.cover.principalMember)}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
