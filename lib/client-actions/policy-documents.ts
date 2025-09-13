import type { Database } from "@/lib/types";

type PolicyDocumentRow = Database["public"]["Tables"]["policy_documents"]["Row"];

/**
 * Fetch policy documents by policy ID
 */
export async function fetchPolicyDocuments(
  policyId: number
): Promise<PolicyDocumentRow[]> {
  const response = await fetch(`/api/policy-documents?policy_id=${policyId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch policy documents: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch policy documents by policy ID with optional claim filter
 */
export async function fetchPolicyDocumentsByClaim(
  policyId: number,
  claimId?: number
): Promise<PolicyDocumentRow[]> {
  const documents = await fetchPolicyDocuments(policyId);
  
  if (claimId) {
    return documents.filter(doc => doc.claim_id === claimId);
  }
  
  return documents;
}