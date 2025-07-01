import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDocumentsByApplication } from "@/lib/client-actions/documents";
import type { Database } from "@/lib/types";

// Query key factory
export const documentsKeys = {
  all: ["documents"] as const,
  byApplication: (applicationId: string) =>
    [...documentsKeys.all, "application", applicationId] as const,
};

// Hook to fetch documents by application ID
export function useDocuments(applicationId: string | null) {
  return useQuery({
    queryKey: documentsKeys.byApplication(applicationId || ""),
    queryFn: async () => {
      if (!applicationId) return [];
      return await fetchDocumentsByApplication(applicationId);
    },
    enabled: !!applicationId && !isNaN(parseInt(applicationId, 10)),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to invalidate documents query after upload
export function useInvalidateDocuments() {
  const queryClient = useQueryClient();

  return (applicationId: string) => {
    queryClient.invalidateQueries({
      queryKey: documentsKeys.byApplication(applicationId),
    });
  };
}

// Hook to optimistically update documents after upload
export function useOptimisticDocumentUpdate() {
  const queryClient = useQueryClient();

  return (
    applicationId: string,
    newDocument: Database["public"]["Tables"]["documents"]["Row"]
  ) => {
    const queryKey = documentsKeys.byApplication(applicationId);

    queryClient.setQueryData(
      queryKey,
      (
        oldData: Database["public"]["Tables"]["documents"]["Row"][] | undefined
      ) => {
        if (!oldData) return [newDocument];
        return [...oldData, newDocument];
      }
    );
  };
}
