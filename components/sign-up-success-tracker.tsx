"use client";

import { useEffect } from "react";
import { trackSignUpSuccess } from "@/lib/analytics";

export function SignUpSuccessTracker() {
  useEffect(() => {
    trackSignUpSuccess();
  }, []);

  return null;
}
