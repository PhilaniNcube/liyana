"use client";

import React, { useState } from "react";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FuneralPremiumCalculator from "./funeral-premium-calculator";

export default function FuneralPremiumCalculatorDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full md:w-auto">
          <Calculator className="h-5 w-5 mr-2" />
          View Funeral Plans
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-sm px-2 max-w-6xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Funeral Cover Plans
          </DialogTitle>
          <DialogDescription className="w-full md:max-w-2xl text-muted-foreground">
            Choose from our affordable funeral cover packages. Family plans
            cover your whole family, or select a single member plan for
            individual cover.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 w-full px-2">
          <FuneralPremiumCalculator />
        </div>
      </DialogContent>
    </Dialog>
  );
}
