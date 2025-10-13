import { maxMoneyLoginResponseSchema } from "@/lib/schemas";
import { createClient } from "@/lib/server";

const MAX_MONEY_URL = process.env.MAX_MONEY_URL;
const MAX_MONEY_USERNAME = process.env.MAX_MONEY_API_USERNAME;
const MAX_MONEY_PASSWORD = process.env.MAX_MONEY_API_PASSWORD;

async function login() {
  const loginUrl = `${MAX_MONEY_URL}/MaxIntegrate/login`;
  console.log("Attempting to login to Max Money:", loginUrl);
  console.log("Using credentials:", {
    user_name: MAX_MONEY_USERNAME,
    password: MAX_MONEY_PASSWORD ? "[HIDDEN]" : "NOT_SET",
  });

  const loginPayload = {
    user_name: MAX_MONEY_USERNAME,
    password: MAX_MONEY_PASSWORD,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginPayload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Max Money login failed with status:", response.status);
      console.error("Error response:", errorText);
      throw new Error(`Max Money login failed: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text();
      console.error("Max Money login response is not JSON:", responseText);
      throw new Error("Max Money API returned non-JSON response for login");
    }

    const data = await response.json();
    console.log("Max Money login response data:", data);

    const validatedLogin = maxMoneyLoginResponseSchema.safeParse(data);

    if (!validatedLogin.success) {
      console.error("Max Money login validation error:", validatedLogin.error);
      console.error(
        "Raw response data that failed validation:",
        JSON.stringify(data, null, 2)
      );
      console.error(
        "Validation error details:",
        validatedLogin.error.flatten()
      );
      throw new Error("Failed to validate Max Money login response.");
    }

    if (validatedLogin.data.return_code !== 0) {
      console.error(
        "Max Money login failed:",
        validatedLogin.data.return_reason
      );
      throw new Error(
        `Max Money login failed: ${validatedLogin.data.return_reason}`
      );
    }

    console.log(
      "Max Money login successful for user_id:",
      validatedLogin.data.user_id
    );

    return validatedLogin.data;
  } catch (fetchError) {
    console.error("Network error during login:", fetchError);
    if (fetchError instanceof TypeError) {
      console.error(
        "This might be a network connectivity issue or invalid URL"
      );
    }
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      console.error("Login request timed out after 30 seconds");
    }
    throw fetchError;
  }
}

export async function POST(request: Request) {
  const { max_money_id } = await request.json();

  if (!max_money_id) {
    return new Response(JSON.stringify({ error: "max_money_id is required" }), {
      status: 400,
    });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("max_money_id", max_money_id)
    .single();

  if (error || !data) {
    return new Response(
      JSON.stringify({ error: error?.message || "Application not found" }),
      { status: 404 }
    );
  }

  const { id, user_id } = data;

  // fetch documents from the documents table
  const { data: documents, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("application_id", id);

  if (docError) {
    return new Response(
      JSON.stringify({ error: docError.message || "Documents not found" }),
      { status: 404 }
    );
  }

  if (!documents || documents.length === 0) {
    return new Response(JSON.stringify({ error: "No documents to upload" }), {
      status: 404,
    });
  }

  const loginData = await login();

  const uploadUrl = `${MAX_MONEY_URL}/MaxIntegrate/file_upload`;

  // Document type mapping function
  const mapDocumentType = (documentType: string): string => {
    const typeMap: { [key: string]: string } = {
      'id_document': '1',
      'payslip': '2',
      'bank_statement': '34',
      'other': '33'
    };
    
    // Convert to lowercase for case-insensitive matching
    const normalizedType = documentType.toLowerCase().replace(/\s+/g, '_');
    return typeMap[normalizedType] || '33'; // Default to "Other" if not found
  };

  // map through documents and upload each one
  const uploadResults = [];

  for (const doc of documents) {
    try {
      // get the document from supabase storage using doc.storage_path
      const { data: fileData, error: fileError } = await supabase.storage
        .from("documents")
        .download(doc.storage_path);

      if (fileError || !fileData) {
        console.error("Error downloading document:", fileError);
        uploadResults.push({
          document_id: doc.id,
          success: false,
          error: `Failed to download document: ${fileError?.message || 'Unknown error'}`,
        });
        continue;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('user_id', loginData.user_id.toString());
      formData.append('mle_id', loginData.mle_id.toString());
      formData.append('client_number', max_money_id.toString());
      formData.append('file_type', mapDocumentType(doc.document_type));
      formData.append('mbr_id', loginData.branch_id.toString());
      formData.append('login_token', loginData.login_token);
      
      // Add the file to FormData
      const fileName = doc.storage_path.split('/').pop() || 'document';
      formData.append('file_uploaded', fileData, fileName);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData, // Use FormData instead of JSON
        // Don't set Content-Type header - let the browser set it with boundary
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Document upload failed with status:", response.status);
        console.error("Error response:", errorText);
        uploadResults.push({
          document_id: doc.id,
          success: false,
          error: `Upload failed: ${response.statusText}`,
        });
        continue;
      }

      const data = await response.json();
      
      if (data.return_code === 0) {
        uploadResults.push({
          document_id: doc.id,
          success: true,
          message: data.return_reason || 'Success',
        });
      } else {
        uploadResults.push({
          document_id: doc.id,
          success: false,
          error: data.return_reason || 'Upload failed',
        });
      }

    } catch (error) {
      console.error("Error uploading document:", error);
      uploadResults.push({
        document_id: doc.id,
        success: false,
        error: `Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  return new Response(JSON.stringify({ 
    success: true, 
    results: uploadResults,
    total_documents: documents.length,
    successful_uploads: uploadResults.filter(r => r.success).length
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
