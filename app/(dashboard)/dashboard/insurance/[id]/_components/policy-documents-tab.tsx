"use client";

import React, { useState } from "react";
import PolicyDocumentUpload from "@/components/policy-document-upload";
import type { Database } from "@/lib/database.types";

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
  const [documents, setDocuments] =
    useState<PolicyDocumentRow[]>(initialDocuments);

  const handleDocumentUploaded = (newDocument: PolicyDocumentRow) => {
    setDocuments((prev) => [newDocument, ...prev]);
  };

  const handleDocumentDeleted = (documentId: number) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
  };

  return (
    <PolicyDocumentUpload
      policyId={policyId}
      existingDocuments={documents}
      onDocumentUploaded={handleDocumentUploaded}
      onDocumentDeleted={handleDocumentDeleted}
    />
  );
};

export default PolicyDocumentsTab;
