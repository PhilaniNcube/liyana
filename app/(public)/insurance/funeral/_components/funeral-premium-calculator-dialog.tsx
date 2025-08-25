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
          Calculate Premium
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Funeral Cover Premium Calculator
          </DialogTitle>
          <DialogDescription>
            Calculate your monthly funeral insurance premium based on your
            family composition and cover amount. This tool helps you estimate
            costs before applying for coverage.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <FuneralPremiumCalculator />
        </div>
      </DialogContent>
    </Dialog>
  );
}
