"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { LoanApplicationForm } from "@/components/loan-application-form";
import type { Database } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"] & {
  decrypted_id_number?: string | null;
};

interface CreateApplicationDialogProps {
  profile: ProfileRow;
  previousApplication?: ApplicationRow | null;
  applicationsCount: number;
}

// Admin dialog to create a new loan application for a customer, reusing client-facing wizard.
export function CreateApplicationDialog({
  profile,
  previousApplication,
  applicationsCount,
}: CreateApplicationDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const userFullName = profile.full_name || "";
  const userEmail = profile.email || "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> New Application
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-5xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" /> Create Application
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 -mt-2 pb-4 text-sm text-muted-foreground space-y-2">
          <p>
            Capturing a new loan application for{" "}
            <span className="font-medium">{userFullName}</span>. Credit check
            step is skipped for admin-created applications.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline">
              Existing Applications: {applicationsCount}
            </Badge>
            {previousApplication && (
              <Badge variant="secondary">Prefilled from last application</Badge>
            )}
          </div>
        </div>
        <Separator />
        <div className="p-6 pt-4">
          <LoanApplicationForm
            previousApplicationData={previousApplication || undefined}
            hasPreviousApplication={!!previousApplication}
            userEmail={userEmail}
            userFullName={userFullName}
            skipCreditCheck
            prefillIdNumber={(profile as any).decrypted_id_number || null}
            onCreated={() => {
              router.refresh();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
