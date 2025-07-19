# Email Application Component Enhancement

This document describes the enhancements made to the e2. **Document Sharing**: Easy credit report file sharing with applicantsail application component for sending emails to loan applicants.

## Overview

The enhanced `EmailApplication` component now provides:

1. **Subject Field**: Admin/editors can specify custom email subjects
2. **Credit Report Attachments**: Option to attach consumer credit reports from the api-checks table
3. **API Integration**: Full integration with the `/api/emails/application` endpoint
4. **Real-time Status**: Loading states, success messages, and error handling
5. **Credit Report Detection**: Automatically detects available credit reports for the application

## Features

### 1. Enhanced Form Fields

- **Subject**: Custom email subject line (with smart defaults)
- **Message**: Multi-line message content for the applicant
- **Attach Credit Report**: Checkbox to include credit reports as PDF attachments

### 2. Credit Report Integration

- Automatically fetches available credit report files from `api_checks` table
- Filters for completed fraud checks with `status = 'passed'` (fraud_check contains the actual report files)
- Shows credit report file availability status with count and dates
- Attaches ZIP files containing credit reports as email attachments when requested

### 3. API Integration

- Connects to `/api/emails/application` endpoint
- Handles authentication and authorization
- Processes credit report attachments server-side
- Professional email templates with application details

## Usage

### In Dashboard Application Detail Page

The component is already integrated into the application detail page at:
`/dashboard/applications/[id]` → "Emails" tab

```tsx
import { EmailApplication } from "@/components/email-application";

// Usage
<EmailApplication applicationId="123" />
```

### Component Props

```tsx
interface EmailApplicationProps {
  applicationId: string; // Required: The application ID to send email for
}
```

## API Endpoints

### Primary Email API
- **Endpoint**: `POST /api/emails/application`
- **Purpose**: Send emails to loan applicants with optional credit report attachments

### Supporting API
- **Endpoint**: `GET /api/applications/[id]/api-checks`
- **Purpose**: Fetch available API checks for credit report detection

## Email Template Features

The email template includes:

- **Professional branding** with Liyana Finance styling
- **Application details** (ID, amount, status)
- **Custom message** from admin/editor
- **Call-to-action** link to view application status
- **PDF attachments** (when credit report files are included)

## Technical Implementation

### Key Components Used

- React Hook Form with Zod validation
- Shadcn UI components (Form, Input, Textarea, Checkbox, etc.)
- Toast notifications for user feedback
- Loading states and error handling
- Real-time credit report availability detection

### Security Features

- **Authentication required**: Only authenticated users can send emails
- **Role-based access**: Only admin/editor roles can access the feature  
- **Input validation**: All form fields are validated
- **Graceful degradation**: If credit report files unavailable

## Benefits

1. **Streamlined Communication**: Admins can quickly send updates to applicants
2. **Professional Emails**: Consistent, branded email templates
3. **Document Sharing**: Easy credit report sharing with applicants
4. **Audit Trail**: All emails are logged and tracked
5. **User Experience**: Intuitive interface with real-time feedback

## Future Enhancements

Potential future improvements:
- Email history/logging
- Template customization
- Bulk email capabilities
- Email scheduling
- Attachment management for other document types

## Testing

To test the enhanced component:

1. Navigate to a loan application detail page
2. Click on the "Emails" tab
3. Fill in subject and message
4. Check "Attach Credit Report File" if available
5. Send email and verify delivery

The component will automatically detect and display available credit report files for the application.
