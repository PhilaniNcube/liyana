# Unified Email System

The email system has been restructured to support different types of emails: applications, loans, and policies. All emails are saved to the `resend_emails` table for audit tracking.

## Components

### EmailApplicationComponent
The main email component that handles all types of emails.

**Props:**
- `id`: The ID of the item (application, loan, or policy)
- `creditReports`: Array of credit reports to attach
- `type`: "application" | "loan" | "policy"
- `recipientName?`: Optional recipient name
- `recipientEmail?`: Optional recipient email

### Specialized Components

#### EmailApplication
For loan applications
```tsx
<EmailApplication 
  id={applicationId} 
  creditReports={reports} 
  applicantName="John Doe"
  applicantEmail="john@example.com"
/>
```

#### EmailLoan  
For approved loans
```tsx
<EmailLoan 
  id={loanId} 
  borrowerName="John Doe"
  borrowerEmail="john@example.com"
/>
```

#### EmailPolicy
For insurance policies
```tsx
<EmailPolicy 
  id={policyId} 
  policyHolderName="John Doe" 
  policyHolderEmail="john@example.com"
/>
```

## API Routes

### POST /api/emails/send
Unified email sending endpoint that handles all types.

**Request Body:**
```json
{
  "itemId": 123,
  "itemType": "application|loan|policy",
  "subject": "Email subject",
  "message": "Email message",
  "attachments": [
    {
      "filename": "report.pdf",
      "data": "base64_encoded_data"
    }
  ],
  "recipientEmail": "user@example.com", // optional
  "recipientName": "John Doe" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "emailId": "resend_email_id",
  "recipient": "user@example.com",
  "itemId": 123,
  "itemType": "application"
}
```

### GET /api/emails/history
Fetch email history for a specific item.

**Query Parameters:**
- `applicationId`: For application emails
- `loanId`: For loan emails  
- `policyId`: For policy emails

**Response:**
```json
[
  {
    "id": 1,
    "resend_id": "resend_email_id",
    "profile_id": "user_profile_id",
    "application_id": 123,
    "loan_id": null,
    "policy_id": null,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

## Database Schema

### resend_emails Table
```sql
CREATE TABLE resend_emails (
  id SERIAL PRIMARY KEY,
  resend_id TEXT NOT NULL,
  profile_id UUID NOT NULL REFERENCES profiles(id),
  application_id INTEGER REFERENCES applications(id),
  loan_id INTEGER REFERENCES approved_loans(id),
  policy_id INTEGER REFERENCES policies(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Features

### Email Templates
Different templates for each type:
- **Application**: Blue theme with application details
- **Loan**: Green theme with loan details  
- **Policy**: Purple theme with policy details

### Email History
Each component includes an `EmailHistory` component that shows:
- List of all emails sent for the item
- Timestamps (relative, e.g., "2 hours ago")
- Resend email IDs for tracking

### File Attachments
- Credit reports from `api_checks` table
- Custom file uploads (PDF, images, etc.)
- Base64 encoding for email attachments

### Security
- Admin/editor role required
- Authentication via Supabase
- Input validation with Zod schemas

## Usage Examples

### Application Page
```tsx
// In /dashboard/applications/[id]/page.tsx
<EmailApplicationWrapper 
  id={application.id}
  creditReports={creditReports}
  applicantName={applicant.full_name}
  applicantEmail={applicant.email}
/>
```

### Loan Page  
```tsx
// In /dashboard/loans/[id]/page.tsx
<LoanEmailTab
  loanId={loan.id}
  borrowerEmail={borrower.email}
  borrowerName={borrower.full_name}
/>
```

### Policy Page
```tsx
// In /dashboard/insurance/[id]/page.tsx  
<PolicyEmailTab
  policyId={policy.id}
  policyHolderEmail={holder.email}
  policyHolderName={holder.full_name}
  documents={documents}
/>
```

## Migration Notes

The old `/api/emails/application` route is deprecated but maintained for backward compatibility. All new implementations should use the unified `/api/emails/send` endpoint.

## Environment Variables

Required environment variables:
- `RESEND_API_KEY`: Your Resend API key
- `NEXT_PUBLIC_SITE_URL`: Base URL for email links (defaults to https://apply.liyanafinance.co.za)
