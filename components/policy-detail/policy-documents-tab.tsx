"use client";

import React from "react";
import PolicyDocumentUpload from "@/components/policy-document-upload";
import type { Database } from "@/lib/types";

type PolicyDocumentRow =
  Database["public"]["Tables"]["policy_documents"]["Row"];

interface PolicyDocumentsTabProps {
  policyId: number;
  documents: PolicyDocumentRow[];
  onDocumentUploaded: (document: PolicyDocumentRow) => void;
  onDocumentDeleted: (documentId: number) => void;
}

export default function PolicyDocumentsTab({
  policyId,
  documents,
  onDocumentUploaded,
  onDocumentDeleted,
}: PolicyDocumentsTabProps) {
  return (
    <PolicyDocumentUpload
      policyId={policyId}
      existingDocuments={documents}
      onDocumentUploaded={onDocumentUploaded}
      onDocumentDeleted={onDocumentDeleted}
    />
  );
}
