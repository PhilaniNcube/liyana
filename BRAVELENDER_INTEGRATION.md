# BraveLender API Integration

## Overview
This document explains how to configure and use the BraveLender API integration for submitting loan applications.

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```bash
# BraveLender API Configuration
BRAVELENDER_API_URL=https://api.bravelender.com
BRAVELENDER_API_KEY=your_api_key_here
BRAVELENDER_CLIENT_ID=your_client_id_here
```

## API Endpoint

### POST `/api/bravelender/submit`

Submits a loan application to BraveLender.

**Request Body:**
```json
{
  "applicationId": "uuid-of-application"
}
```

**Response:**
```json
{
  "success": true,
  "status": "submitted",
  "message": "Application submitted successfully to BraveLender",
  "bravelenderResponse": {
    "applicationId": "BL-12345",
    "status": "pending_review",
    "submittedAt": "2024-01-15T10:30:00Z"
  }
}
```

## Testing

Use the test page at `/test-bravelender` to manually test the integration:

1. Navigate to `http://localhost:3000/test-bravelender`
2. Enter a valid application ID
3. Click "Submit to BraveLender"
4. View the response

## Data Mapping

The integration maps our internal application data to BraveLender's expected format:

### Personal Information
- `full_name` → `firstName` + `lastName`
- `email` → `email`
- `phone_number` → `phoneNumber`
- `date_of_birth` → `dateOfBirth`
- `gender` → `gender`
- `marital_status` → `maritalStatus`

### Employment Information
- `employment_type` → `employmentStatus`
- `employer_name` → `employerName`
- `monthly_income` → `monthlyIncome`
- `work_experience` → `workExperience`

### Loan Information
- `application_amount` → `loanAmount`
- `loan_purpose` → `loanPurpose`
- `loan_term` → `loanTerm`

### Banking Information
- `bank_name` → `bankName`
- `bank_account_number` → `accountNumber` (encrypted)
- `bank_account_type` → `accountType`

### Address Information
- `residential_address` → `residentialAddress`
- `residential_duration` → `residentialDuration`

## Status Updates

After submission, the application status is updated to:
- `submitted_to_lender` - Successfully submitted
- `submission_failed` - Failed to submit

## Error Handling

The API handles various error scenarios:
- Missing application ID
- Application not found
- Missing profile data
- BraveLender API errors
- Network errors

All errors are logged and appropriate status updates are made to the application record.

## Security

- All sensitive data (bank account numbers) are encrypted before submission
- API keys are stored securely in environment variables
- Request/response data is logged for audit purposes
