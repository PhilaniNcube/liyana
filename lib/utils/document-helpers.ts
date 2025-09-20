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
    console.log('Attempting to download document from path:', documentPath);
    const supabase = await createClient();
    
    // Download the file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('documents') // Adjust bucket name as needed
      .download(documentPath);

    if (error) {
      console.error('Supabase storage download error:', error);
      console.error('Error details:', {
        message: error.message
      });
      return null;
    }

    if (!data) {
      console.error('No data returned from Supabase storage download');
      return null;
    }

    console.log('Document downloaded successfully, size:', data.size, 'bytes', 'type:', data.type);

    // Convert to base64
    const buffer = await data.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    console.log('Base64 conversion completed, length:', base64.length);

    // Determine content type from file extension
    const extension = documentPath.split('.').pop()?.toLowerCase();
    const content_type = getContentTypeFromExtension(extension || '');

    // Extract filename from path
    const filename = documentPath.split('/').pop() || 'document';

    console.log('Processed document:', {
      filename,
      content_type,
      extension,
      base64Length: base64.length,
      originalSize: data.size
    });

    return {
      data: base64,
      content_type,
      filename
    };
  } catch (error) {
    console.error('Error processing document:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
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
 * Retrieves multiple documents for email attachment from both policy_documents and documents tables
 * @param policyDocumentIds Array of document IDs from the policy_documents table
 * @param applicationDocumentIds Array of document IDs from the documents table
 * @returns Array of base64 encoded documents ready for email attachment
 */
export async function getDocumentsForEmailV2(
  policyDocumentIds: number[] = [], 
  applicationDocumentIds: number[] = []
): Promise<Array<{
  filename: string;
  content: string;
  content_type: string;
}>> {
  console.log('Getting documents for email, Policy IDs:', policyDocumentIds, 'Application IDs:', applicationDocumentIds);
  const supabase = await createClient();
  const attachments = [];

  // Process policy documents
  if (policyDocumentIds.length > 0) {
    const { data: policyDocuments, error: policyError } = await supabase
      .from('policy_documents')
      .select('*')
      .in('id', policyDocumentIds);

    if (policyError) {
      console.error('Error fetching policy documents:', policyError);
    } else if (policyDocuments) {
      console.log('Found policy documents in database:', policyDocuments.length);
      
      for (const doc of policyDocuments) {
        console.log(`Processing policy document ${doc.id} with path: ${doc.path}`);
        const documentData = await getDocumentForEmail(doc.path);
        if (documentData) {
          attachments.push({
            filename: `policy_${doc.document_type}_${doc.id}.${documentData.filename.split('.').pop()}`,
            content: documentData.data,
            content_type: documentData.content_type,
          });
          console.log(`Successfully processed policy document ${doc.id}`);
        } else {
          console.log(`Failed to process policy document ${doc.id}`);
        }
      }
    }
  }

  // Process application documents
  if (applicationDocumentIds.length > 0) {
    const { data: applicationDocuments, error: applicationError } = await supabase
      .from('documents')
      .select('*')
      .in('id', applicationDocumentIds);

    if (applicationError) {
      console.error('Error fetching application documents:', applicationError);
    } else if (applicationDocuments) {
      console.log('Found application documents in database:', applicationDocuments.length);
      
      for (const doc of applicationDocuments) {
        console.log(`Processing application document ${doc.id} with path: ${doc.storage_path}`);
        const documentData = await getDocumentForEmail(doc.storage_path);
        if (documentData) {
          attachments.push({
            filename: `app_${doc.document_type}_${doc.id}.${documentData.filename.split('.').pop()}`,
            content: documentData.data,
            content_type: documentData.content_type,
          });
          console.log(`Successfully processed application document ${doc.id}`);
        } else {
          console.log(`Failed to process application document ${doc.id}`);
        }
      }
    }
  }

  console.log(`Returning ${attachments.length} total attachments`);
  return attachments;
}

/**
 * Retrieves multiple documents for email attachment
 * @param documentIds Array of document IDs from the policy_documents table
 * @returns Array of base64 encoded documents ready for email attachment
 */
export async function getDocumentsForEmail(documentIds: number[]): Promise<Array<{
  filename: string;
  content: string; // Changed from 'data' to 'content' for Resend compatibility
  content_type: string;
}>> {
  console.log('Getting documents for email, IDs:', documentIds);
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

  console.log('Found documents in database:', documents.length);
  documents.forEach(doc => {
    console.log('Document:', {
      id: doc.id,
      type: doc.document_type,
      path: doc.path
    });
  });

  // Process each document
  const attachments = [];
  for (const doc of documents) {
    console.log(`Processing document ${doc.id} with path: ${doc.path}`);
    const documentData = await getDocumentForEmail(doc.path);
    if (documentData) {
      attachments.push({
        filename: `${doc.document_type}_${doc.id}.${documentData.filename.split('.').pop()}`,
        content: documentData.data, // Using 'content' field for Resend
        content_type: documentData.content_type,
      });
      console.log(`Successfully processed document ${doc.id}`);
    } else {
      console.log(`Failed to process document ${doc.id}`);
    }
  }

  console.log(`Returning ${attachments.length} attachments`);
  return attachments;
}
