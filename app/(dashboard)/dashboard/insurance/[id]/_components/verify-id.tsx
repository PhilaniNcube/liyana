"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IdCard } from "lucide-react";
import React, { useTransition } from "react";

const VerifyIdDialog = ({ idNumber }: { idNumber: string }) => {
  const [isPending, startTransition] = useTransition();

  const handleIdVerification = async () => {
    const request = await fetch("/api/insurance/id-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id_number: idNumber }),
    });

    const response = await request.json();
    console.log("ID Verification Response:", response);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-white text-black hover:bg-gray-100">
          <IdCard className="mr-2" />
          Verify ID
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify ID</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <DialogDescription>
            Click the button below to submit the ID number for verification.
          </DialogDescription>
          <Button
            onClick={() => startTransition(handleIdVerification)}
            className="mt-4"
          >
            {isPending ? "Verifying..." : "Submit for Verification"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerifyIdDialog;
