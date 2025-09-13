# WhoYou API Service Provider Error - Troubleshooting Guide

## Error Description
**Error Code**: 10084  
**Message**: "Service providers have not been setup. Please contact support"  
**Status**: 400 Bad Request

## Root Cause
This error occurs when the WhoYou API service has not been properly configured on their end for your account. The error indicates that even though your API credentials are valid and authentication is successful, the service providers (data sources) have not been activated for your account.

## Resolution Steps

### 1. Contact WhoYou Support
This is primarily a configuration issue on WhoYou's side that requires their support team to resolve:

- **Contact**: WhoYou API Support
- **Issue**: Request activation of deceased status service providers for your account
- **Provide**: Your WHO_YOU_ID and WHO_YOU_USERNAME for reference

### 2. Verify Environment Variables
Ensure all required WhoYou environment variables are properly set:

```bash
WHO_YOU_URL=https://api.whoyou.co.za  # or appropriate URL
WHO_YOU_ID=your_account_id
WHO_YOU_USERNAME=your_username
WHO_YOU_PASSWORD=your_password
```

### 3. Test API Access
You can test if your credentials work for other services using the existing API endpoints:
- `/api/kyc/id-verification` (demographic data)
- `/api/kyc/email-verification` (email verification)
- `/api/kyc/employment` (employment verification)

### 4. Implementation Status
The following improvements have been made to handle this error gracefully:

#### ✅ Enhanced Error Handling
- **useDeceasedStatusCheck Hook**: Now detects error code 10084 and shows user-friendly message
- **API Route**: Improved error parsing and user-friendly error responses
- **UI Component**: Better error display with contextual messaging

#### ✅ User Experience Improvements
- Clear error messages explaining the service is temporarily unavailable
- Guidance to contact support rather than retry for service configuration issues
- Distinguishes between retryable errors and service configuration errors

## Testing the Implementation

### 1. Trigger the Error
The error can be reproduced by:
1. Going to any policy page in the dashboard
2. Navigating to the "Beneficiaries" tab
3. Clicking "Check Deceased Status" for any beneficiary

### 2. Expected Behavior After Fix
When the error occurs, users should now see:
- ❌ Instead of: "whoYou deceased status API error: {"code":10084,"message":"Service providers have not been setup. Please contact support"}"
- ✅ Now shows: "Deceased status verification service is currently unavailable. Please contact support for assistance."

## Code Changes Made

### 1. Hook Enhancement (`hooks/use-deceased-status-check.ts`)
```typescript
// Enhanced error handling for specific WhoYou error codes
if (details.code === 10084) {
  throw new Error("Deceased status check service is temporarily unavailable. Please contact support for assistance.");
}
```

### 2. API Route Enhancement (`app/api/kyc/deceased-status/route.ts`)
```typescript
// Specific handling for service provider errors
if (errorData.code === 10084) {
  return NextResponse.json({
    error: "Deceased status verification service is currently unavailable",
    details: errorData,
    userMessage: "The deceased status verification service is temporarily unavailable. Please contact support for assistance."
  }, { status: 400 });
}
```

### 3. UI Enhancement (`policy-beneficiaries-tab.tsx`)
```typescript
// Better error display with contextual messaging
{beneficiary.deceasedCheckError.includes("temporarily unavailable") ||
beneficiary.deceasedCheckError.includes("service") ? (
  <p className="text-xs text-red-500 mt-2">
    Please try again later or contact support if the issue persists.
  </p>
) : (
  <Button variant="outline" size="sm" onClick={() => handleCheckDeceasedStatus(index)}>
    Retry Check
  </Button>
)}
```

## Next Steps

1. **Immediate**: Contact WhoYou support to activate deceased status service providers
2. **Monitor**: Check if other WhoYou services are working (ID verification, email verification, etc.)
3. **Fallback**: Consider implementing a manual deceased status verification process for critical cases
4. **Documentation**: Update your runbook with WhoYou contact information for future issues

## Related Services
The same error could potentially affect other WhoYou services. Monitor these endpoints:
- `/api/kyc/policy/employment`
- `/api/kyc/policy/account-verification`
- `/api/kyc/policy/cellphone-verification`

## Support Information
If this error persists after contacting WhoYou, check:
1. Account billing status with WhoYou
2. Service agreement coverage (which services are included)
3. API rate limits or usage quotas
4. Regional service availability