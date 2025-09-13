"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface EmailRefetchContextType {
  refetchEmails: (policyId: number) => void;
}

const EmailRefetchContext = createContext<EmailRefetchContextType | undefined>(
  undefined
);

export function EmailRefetchProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const refetchEmails = (policyId: number) => {
    // Invalidate and refetch the emails query for the specific policy
    queryClient.invalidateQueries({
      queryKey: ["emails", "policy", policyId],
    });
  };

  return (
    <EmailRefetchContext.Provider value={{ refetchEmails }}>
      {children}
    </EmailRefetchContext.Provider>
  );
}

export function useEmailRefetch() {
  const context = useContext(EmailRefetchContext);
  if (context === undefined) {
    throw new Error(
      "useEmailRefetch must be used within an EmailRefetchProvider"
    );
  }
  return context;
}
