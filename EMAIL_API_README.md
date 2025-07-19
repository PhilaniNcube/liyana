# Application Email API Endpoint

This API endpoint allows admin and editor users to send custom emails to users based on their loan application ID.

## Endpoint

```
POST /api/emails/application
```

## Authentication

- Requires user to be logged in (Supabase Auth)
- User must have either `admin` or `editor` role in their profile

## Request Body

```json
{
  "applicationId": 123,
  "message": "Your custom message to the user",
  "subject": "Optional custom subject line"
}
```

### Parameters

- `applicationId` (required): Number - The ID of the loan application
- `message` (required): String - The message content to send to the user
- `subject` (optional): String - Custom subject line. If not provided, defaults to "Update on your loan application #[applicationId]"

## Response

### Success (200)

```json
{
  "success": true,
  "message": "Email sent successfully",
  "emailId": "resend-email-id",
  "recipient": "user@example.com",
  "applicationId": 123
}
```

### Error Responses

#### 400 - Bad Request
```json
{
  "error": "Invalid request data",
  "details": {
    "applicationId": ["Application ID must be a positive number"],
    "message": ["Message is required"]
  }
}
```

#### 401 - Unauthorized
```json
{
  "error": "Authentication required"
}
```

#### 403 - Forbidden
```json
{
  "error": "Access denied. Admin or editor privileges required."
}
```

#### 404 - Not Found
```json
{
  "error": "Application not found"
}
```

```json
{
  "error": "User email not found for this application"
}
```

#### 500 - Internal Server Error
```json
{
  "error": "Failed to send email",
  "details": "Resend API error message"
}
```

## How It Works

1. **Authentication Check**: Verifies the user is logged in via Supabase Auth
2. **Authorization Check**: Ensures the user has admin or editor role
3. **Application Lookup**: Finds the application by ID
4. **User Email Resolution**: Attempts to get user email from:
   - Supabase Auth user (primary source)
   - Profile table email field (fallback)
5. **Email Sending**: Uses Resend to send a professionally formatted email
6. **Response**: Returns success/error information

## Email Template

The API sends a professionally formatted HTML email that includes:

- Liyana Finance branding
- User's name (from profile)
- Application details (ID, amount, status)
- The custom message
- Call-to-action button to view application
- Professional footer

## Usage Examples

### Approval Notification
```javascript
const response = await fetch('/api/emails/application', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    applicationId: 123,
    message: "Great news! Your loan application has been approved. We'll be in touch with the next steps soon.",
    subject: "Loan Application Approved - Congratulations!"
  })
});
```

### Request for Additional Information
```javascript
const response = await fetch('/api/emails/application', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    applicationId: 456,
    message: "We need some additional information to process your application. Please upload your latest bank statement through your profile dashboard.",
    subject: "Additional Information Required"
  })
});
```

### Application Status Update
```javascript
const response = await fetch('/api/emails/application', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    applicationId: 789,
    message: "Your application is currently under review by our underwriting team. We expect to have an update within 2-3 business days."
  })
});
```

## Environment Variables Required

- `RESEND_API_KEY` - Your Resend API key
- `NEXT_PUBLIC_SITE_URL` (optional) - Used for the "View Application" button link

## Error Handling

The API includes comprehensive error handling for:
- Invalid input validation
- Authentication/authorization failures
- Database connection issues
- Email service failures
- Missing user data

All errors are logged to the console for debugging purposes while returning safe error messages to the client.

## Testing

Use the included `test-email-api.js` file to test the endpoint:

```javascript
import { testEmailAPI } from './test-email-api.js';

// Update the test data with valid application ID
testEmailAPI();
```
