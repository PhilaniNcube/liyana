import type { Database } from "@/lib/types";

type ApplicationDocumentRow = Database["public"]["Tables"]["documents"]["Row"];

/**
 * Fetch application documents by user ID
 */
export async function fetchApplicationDocuments(
  userId: string
): Promise<ApplicationDocumentRow[]> {
  const response = await fetch(`/api/application-documents?user_id=${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch application documents: ${response.statusText}`);
  }
  
  return response.json();
}