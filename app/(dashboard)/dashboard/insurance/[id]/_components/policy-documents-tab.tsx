"use client";

import React, { useState } from "react";
import PolicyDocumentUpload from "@/components/policy-document-upload";
import PolicyDocumentsList from "@/components/policy-documents-list";
import { useOptimisticPolicyDocumentUpdate } from "@/hooks/use-policy-documents";
import type { Database } from "@/lib/types";

type PolicyDocumentRow =
  Database["public"]["Tables"]["policy_documents"]["Row"];

interface PolicyDocumentsTabProps {
  policyId: number;
  initialDocuments: PolicyDocumentRow[];
}

const PolicyDocumentsTab = ({
  policyId,
  initialDocuments,
}: PolicyDocumentsTabProps) => {
  const { addDocument, removeDocument } = useOptimisticPolicyDocumentUpdate();

  const handleDocumentUploaded = (newDocument: PolicyDocumentRow) => {
    // Optimistically update the cache
    addDocument(policyId, newDocument);
  };

  const handleDocumentDeleted = (documentId: number) => {
    // Optimistically update the cache
    removeDocument(policyId, documentId);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <PolicyDocumentUpload
          policyId={policyId}
          existingDocuments={initialDocuments}
          onDocumentUploaded={handleDocumentUploaded}
          onDocumentDeleted={handleDocumentDeleted}
        />
      </div>
      <div>
        <PolicyDocumentsList policyId={policyId} />
      </div>
    </div>
  );
};

export default PolicyDocumentsTab;
