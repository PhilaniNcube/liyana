# Funeral Policy Email Server Action

This document describes the server action that sends funeral cover policy details to the LINAR email address.

## Overview

The `sendFuneralPolicyDetailsEmail` function is a server action that fetches detailed information about a funeral policy and sends a comprehensive email to the address specified in the `LINAR_EMAIL_ADDRESS` environment variable.

## Features

- **Comprehensive Policy Details**: Includes all relevant policy information including coverage amount, premium, status, and dates
- **Policy Holder Information**: Personal details, contact information, and address (if available)
- **Employment Information**: Employment details including employer, job title, and monthly income
- **Banking Information**: Account details for premium payments
- **Beneficiaries Table**: Complete list of beneficiaries with their relationships and allocation percentages
- **Professional Email Template**: Well-formatted HTML email with Liyana Finance branding
- **Email Tracking**: Saves email records to the database for tracking purposes

## Environment Variables Required

```bash
# Required: Email address where funeral policy details will be sent
LINAR_EMAIL_ADDRESS="hello@liyanafinance.co.za"

# Required: Resend API key for sending emails
RESEND_API_KEY="your_resend_api_key"
```

## Function Signature

```typescript
export async function sendFuneralPolicyDetailsEmail(
  policyId: number,
  attachments?: Array<{
    filename: string;
    data: string; // Base64 encoded content
    content_type?: string;
  }>
): Promise<{
  error: boolean;
  message: string;
  emailId?: string;
  recipient?: string;
  details?: string;
}>
```

## Parameters

- `policyId` (number): The ID of the funeral policy to send details for
- `attachments` (array, optional): Array of document attachments to include with the email
  - `filename` (string): Name of the file including extension
  - `data` (string): Base64 encoded file content
  - `content_type` (string, optional): MIME type of the file (auto-detected if not provided)

## Return Value

The function returns an object with:
- `error` (boolean): Whether an error occurred
- `message` (string): Success or error message
- `emailId` (string, optional): Resend email ID if successful
- `recipient` (string, optional): Email address where the email was sent
- `details` (string, optional): Additional error details if an error occurred

## Usage Examples

### In a React Component

```typescript
import { sendFuneralPolicyDetailsEmail } from '@/lib/actions/funeral-policy';

// Send email without attachments
const handleSendPolicyEmail = async (policyId: number) => {
  const result = await sendFuneralPolicyDetailsEmail(policyId);
  
  if (result.error) {
    toast.error(`Failed to send email: ${result.message}`);
  } else {
    toast.success(`Policy details sent to ${result.recipient}`);
  }
};

// Send email with attachments (admin/editor only)
const handleSendPolicyEmailWithAttachments = async (policyId: number, files: File[]) => {
  // Convert files to base64
  const attachments = await Promise.all(
    files.map(async (file) => ({
      filename: file.name,
      data: await fileToBase64(file),
      content_type: file.type,
    }))
  );

  const result = await sendFuneralPolicyDetailsEmail(policyId, attachments);
  
  if (result.error) {
    toast.error(`Failed to send email: ${result.message}`);
  } else {
    toast.success(`Policy details sent to ${result.recipient} with ${attachments.length} attachment(s)`);
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64Content = base64.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = (error) => reject(error);
  });
};
```

### In an API Route

```typescript
import { sendFuneralPolicyDetailsEmail } from '@/lib/actions/funeral-policy';

export async function POST(request: NextRequest) {
  const { policyId, attachments } = await request.json();
  
  const result = await sendFuneralPolicyDetailsEmail(policyId, attachments);
  
  return NextResponse.json(result);
}
```

### Using the Test API Endpoint

```javascript
// Test without attachments
const testResponse = await fetch('/api/test-funeral-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ policyId: 1 })
});

// Test with attachments
const testWithAttachments = await fetch('/api/test-funeral-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    policyId: 1,
    attachments: [
      {
        filename: "policy-terms.pdf",
        data: "base64-encoded-content",
        content_type: "application/pdf"
      }
    ]
  })
});

const result = await testResponse.json();
console.log(result);
```

## Supported File Types

The system automatically detects content types for common file extensions:

- **PDF**: `.pdf` → `application/pdf`
- **Word Documents**: `.doc` → `application/msword`, `.docx` → `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Excel Files**: `.xls` → `application/vnd.ms-excel`, `.xlsx` → `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Images**: `.jpg/.jpeg` → `image/jpeg`, `.png` → `image/png`
- **Archives**: `.zip` → `application/zip`
- **Default**: `application/octet-stream` for unknown types

## Email Template Structure

The email includes the following sections:

1. **Header**: Policy ID and title
2. **Policy Summary**: Coverage amount, premium, status, frequency
3. **Policy Holder Information**: Name, date of birth, contact details
4. **Employment Information**: Employment type, employer, job title, income
5. **Banking Information**: Account details for premium payments
6. **Beneficiaries Table**: List of all beneficiaries with details
7. **Policy Dates**: Created, start, and end dates
8. **Footer**: Liyana Finance branding and timestamp

## Error Handling

The function handles various error scenarios:

- **Authentication**: User must be logged in
- **Policy Not Found**: Returns error if policy doesn't exist or isn't a funeral policy
- **Missing Configuration**: Returns error if LINAR_EMAIL_ADDRESS is not set
- **Email Sending Failure**: Returns error if Resend API fails
- **Database Errors**: Logs but doesn't fail the request for email record saving

## Database Integration

- Fetches policy data from the `policies` table
- Fetches policy holder data from the `parties` table via foreign key
- Fetches beneficiaries data from the `policy_beneficiaries` table
- Saves email record to the `resend_emails` table for tracking

## Security Considerations

- Requires user authentication
- Only fetches funeral policies (filtered by `product_type`)
- Sensitive data (like ID numbers) are handled securely
- Email content is sanitized and formatted safely

## Testing

Use the provided test files:
- `test-funeral-email.js`: Client-side test script
- `/api/test-funeral-email`: API endpoint for testing

## File Locations

- Server Action: `lib/actions/funeral-policy.ts`
- Test API: `app/api/test-funeral-email/route.ts`
- Test Script: `test-funeral-email.js`
- Documentation: `FUNERAL_POLICY_EMAIL_README.md`
