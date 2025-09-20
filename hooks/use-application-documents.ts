import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApplicationDocuments } from "@/lib/client-actions/application-documents";
import type { Database } from "@/lib/types";

type ApplicationDocumentRow = Database["public"]["Tables"]["documents"]["Row"];

// Query key factory
export const applicationDocumentsKeys = {
  all: ["application-documents"] as const,
  byUser: (userId: string) =>
    [...applicationDocumentsKeys.all, "user", userId] as const,
};

// Hook to fetch application documents by user ID
export function useApplicationDocuments(userId: string | null) {
  return useQuery({
    queryKey: applicationDocumentsKeys.byUser(userId || ""),
    queryFn: async () => {
      if (!userId) return [];
      return await fetchApplicationDocuments(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

// Hook to invalidate application documents queries
export function useInvalidateApplicationDocuments() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.invalidateQueries({
      queryKey: applicationDocumentsKeys.byUser(userId),
    });
  };
}