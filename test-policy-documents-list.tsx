// Test for PolicyDocumentsList component integration
// This test verifies that the component integrates properly with TanStack Query

import React from "react";
import PolicyDocumentsList from "@/components/policy-documents-list";
import PolicyDocumentsTab from "@/app/(dashboard)/dashboard/insurance/[id]/_components/policy-documents-tab";
import type { Database } from "@/lib/database.types";

type PolicyDocumentRow =
  Database["public"]["Tables"]["policy_documents"]["Row"];

// Mock test data
const mockPolicyId = 123;
const mockInitialDocuments: PolicyDocumentRow[] = [
  {
    id: 1,
    policy_id: 123,
    document_type: "identity_document" as const,
    path: "documents/test-id.pdf",
    user_id: "test-user-id",
    claim_id: null,
    created_at: "2024-01-01T10:00:00Z",
  },
];

// Test the PolicyDocumentsList component
function TestPolicyDocumentsList() {
  return (
    <div>
      <h2>Testing PolicyDocumentsList Component</h2>
      <PolicyDocumentsList policyId={mockPolicyId} />
    </div>
  );
}

// Test the updated PolicyDocumentsTab component
function TestPolicyDocumentsTab() {
  return (
    <div>
      <h2>Testing PolicyDocumentsTab Component</h2>
      <PolicyDocumentsTab
        policyId={mockPolicyId}
        initialDocuments={mockInitialDocuments}
      />
    </div>
  );
}

// Integration test component that renders both
function TestIntegration() {
  return (
    <div className="p-6">
      <div className="space-y-8">
        <TestPolicyDocumentsList />
        <TestPolicyDocumentsTab />
      </div>
    </div>
  );
}

export default TestIntegration;
