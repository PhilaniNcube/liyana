import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/client";
import type { Database } from "@/lib/types";

type ProfileDocument = Database["public"]["Tables"]["profile_documents"]["Row"];
type AppDocument = Database["public"]["Tables"]["documents"]["Row"];
type DocumentType = Database["public"]["Enums"]["document_type"];

export type NormalizedDocument = {
  id: number;
  document_type: DocumentType;
  created_at: string; // display date
  path: string; // storage path in 'documents' bucket
  source: "profile" | "application";
};

// Query key factory
export const profileDocumentsKeys = {
  all: ["profile-documents"] as const,
  byProfile: (profileId: string) =>
    [...profileDocumentsKeys.all, "profile", profileId] as const,
};

const normalizeProfile = (docs: ProfileDocument[]): NormalizedDocument[] =>
  docs.map((d) => ({
    id: d.id,
    document_type: d.document_type,
    created_at: d.created_at,
    path: d.path,
    source: "profile" as const,
  }));

const normalizeApp = (docs: AppDocument[]): NormalizedDocument[] =>
  docs
    .map((d) => ({
      id: d.id,
      document_type: d.document_type as DocumentType,
      created_at: d.uploaded_at,
      path: d.storage_path, // field name in documents table
      source: "application" as const,
    }))
    .filter((d) => !!d.path);

const fetchProfileDocuments = async (profileId: string): Promise<NormalizedDocument[]> => {
  // Profile documents from API (auth + permission enforced)
  const resp = await fetch(`/api/profile-documents?profileId=${profileId}`);
  if (!resp.ok) throw new Error("Failed to fetch profile documents");
  const json = await resp.json();
  const profileDocs = normalizeProfile(
    (json.documents || []) as ProfileDocument[]
  );

  // Application documents for this user via Supabase client
  const supabase = createClient();
  const { data: appDocs, error: appErr } = await supabase
    .from("documents")
    .select("id, document_type, uploaded_at, storage_path, user_id")
    .eq("user_id", profileId)
    .order("uploaded_at", { ascending: false });
  if (appErr) throw new Error(appErr.message);
  const appNormalized = normalizeApp((appDocs || []) as AppDocument[]);

  return [...profileDocs, ...appNormalized];
};

// Hook to fetch profile documents
export function useProfileDocuments(
  profileId: string,
  initialData?: ProfileDocument[]
) {
  const hasValidInitialData = initialData && initialData.length > 0;
  
  return useQuery({
    queryKey: profileDocumentsKeys.byProfile(profileId),
    queryFn: () => fetchProfileDocuments(profileId),
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialData: hasValidInitialData ? normalizeProfile(initialData) : undefined,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (likely permission issues)
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        return failureCount < 2;
      }
      return failureCount < 3;
    },
  });
}

// Hook to invalidate profile documents query
export function useInvalidateProfileDocuments() {
  const queryClient = useQueryClient();

  return (profileId: string) => {
    queryClient.invalidateQueries({
      queryKey: profileDocumentsKeys.byProfile(profileId),
    });
  };
}

// Hook for optimistic updates when documents are added
export function useOptimisticProfileDocumentUpdate() {
  const queryClient = useQueryClient();

  return (profileId: string, newDocument: NormalizedDocument) => {
    const queryKey = profileDocumentsKeys.byProfile(profileId);

    queryClient.setQueryData(queryKey, (oldData: NormalizedDocument[] | undefined) => {
      if (!oldData) return [newDocument];
      return [...oldData, newDocument];
    });
  };
}