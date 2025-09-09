// Future implementation for document storage retrieval
// This file contains helper functions for retrieving documents from Supabase Storage
// and converting them to base64 for email attachments

import { createClient } from "@/lib/server";

/**
 * Retrieves a document from Supabase Storage and converts it to base64
 * @param documentPath The storage path of the document
 * @returns Base64 encoded document data and content type
 */
export async function getDocumentForEmail(documentPath: string): Promise<{
  data: string;
  content_type: string;
  filename: string;
} | null> {
  try {
    const supabase = await createClient();
    
    // Download the file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('documents') // Adjust bucket name as needed
      .download(documentPath);

    if (error || !data) {
      console.error('Error downloading document:', error);
      return null;
    }

    // Convert to base64
    const buffer = await data.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Determine content type from file extension
    const extension = documentPath.split('.').pop()?.toLowerCase();
    const content_type = getContentTypeFromExtension(extension || '');

    // Extract filename from path
    const filename = documentPath.split('/').pop() || 'document';

    return {
      data: base64,
      content_type,
      filename
    };
  } catch (error) {
    console.error('Error processing document:', error);
    return null;
  }
}

/**
 * Determines MIME type based on file extension
 */
function getContentTypeFromExtension(extension: string): string {
  const contentTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'zip': 'application/zip',
  };

  return contentTypes[extension] || 'application/octet-stream';
}

/**
 * Retrieves multiple documents for email attachment
 * @param documentIds Array of document IDs from the policy_documents table
 * @returns Array of base64 encoded documents ready for email attachment
 */
export async function getDocumentsForEmail(documentIds: number[]): Promise<Array<{
  filename: string;
  data: string;
  content_type: string;
}>> {
  const supabase = await createClient();
  
  // Get document records from database
  const { data: documents, error } = await supabase
    .from('policy_documents')
    .select('*')
    .in('id', documentIds);

  if (error || !documents) {
    console.error('Error fetching documents:', error);
    return [];
  }

  // Process each document
  const attachments = [];
  for (const doc of documents) {
    const documentData = await getDocumentForEmail(doc.path);
    if (documentData) {
      attachments.push({
        filename: `${doc.document_type}_${doc.id}.${documentData.filename.split('.').pop()}`,
        data: documentData.data,
        content_type: documentData.content_type,
      });
    }
  }

  return attachments;
}
