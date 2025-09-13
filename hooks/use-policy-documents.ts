import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPolicyDocuments, fetchPolicyDocumentsByClaim } from "@/lib/client-actions/policy-documents";
import type { Database } from "@/lib/types";

type PolicyDocumentRow = Database["public"]["Tables"]["policy_documents"]["Row"];

// Query key factory
export const policyDocumentsKeys = {
  all: ["policy-documents"] as const,
  byPolicy: (policyId: number) =>
    [...policyDocumentsKeys.all, "policy", policyId] as const,
  byClaim: (policyId: number, claimId: number) =>
    [...policyDocumentsKeys.all, "policy", policyId, "claim", claimId] as const,
};

// Hook to fetch all policy documents by policy ID
export function usePolicyDocuments(policyId: number | null) {
  return useQuery({
    queryKey: policyDocumentsKeys.byPolicy(policyId || 0),
    queryFn: async () => {
      if (!policyId) return [];
      return await fetchPolicyDocuments(policyId);
    },
    enabled: !!policyId && !isNaN(policyId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

// Hook to fetch policy documents filtered by claim ID
export function usePolicyDocumentsByClaim(policyId: number | null, claimId: number | null) {
  return useQuery({
    queryKey: policyDocumentsKeys.byClaim(policyId || 0, claimId || 0),
    queryFn: async () => {
      if (!policyId) return [];
      return await fetchPolicyDocumentsByClaim(policyId, claimId || undefined);
    },
    enabled: !!policyId && !isNaN(policyId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

// Hook to invalidate policy documents queries
export function useInvalidatePolicyDocuments() {
  const queryClient = useQueryClient();

  return {
    invalidateByPolicy: (policyId: number) => {
      queryClient.invalidateQueries({
        queryKey: policyDocumentsKeys.byPolicy(policyId),
      });
    },
    invalidateByClaim: (policyId: number, claimId: number) => {
      queryClient.invalidateQueries({
        queryKey: policyDocumentsKeys.byClaim(policyId, claimId),
      });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({
        queryKey: policyDocumentsKeys.all,
      });
    },
  };
}

// Hook to optimistically update policy documents after operations
export function useOptimisticPolicyDocumentUpdate() {
  const queryClient = useQueryClient();

  return {
    addDocument: (policyId: number, newDocument: PolicyDocumentRow) => {
      const queryKey = policyDocumentsKeys.byPolicy(policyId);

      queryClient.setQueryData(
        queryKey,
        (oldData: PolicyDocumentRow[] | undefined) => {
          if (!oldData) return [newDocument];
          return [newDocument, ...oldData];
        }
      );
    },
    
    removeDocument: (policyId: number, documentId: number) => {
      const queryKey = policyDocumentsKeys.byPolicy(policyId);

      queryClient.setQueryData(
        queryKey,
        (oldData: PolicyDocumentRow[] | undefined) => {
          if (!oldData) return [];
          return oldData.filter(doc => doc.id !== documentId);
        }
      );
    },
  };
}