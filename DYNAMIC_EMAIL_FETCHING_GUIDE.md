# Dynamic Email Content Fetching

## Overview

This enhancement adds the ability to fetch email content from the Resend API on-demand within the EmailHistory component, improving performance and user experience.

## Two Approaches Available

### 1. Dynamic Loading (New) 🆕
Fetch email details only when needed (when user expands an email).

**Benefits:**
- ⚡ Faster initial page load
- 📊 Reduced API calls on page load
- 📱 Better mobile experience
- 💾 Intelligent caching

**Usage:**
```tsx
import { EmailHistory } from "@/components/email-history-new";
import { getEmailsForApplication } from "@/lib/queries/emails";

// Fetch only basic email records
const emails = await getEmailsForApplication(applicationId);

// Component will fetch details on-demand
<EmailHistory emails={emails} />
```

### 2. Pre-loaded Details (Traditional)
Fetch all email details upfront during page load.

**Benefits:**
- ⚡ Instant content display when expanded
- 🔄 No loading delays during interaction

**Usage:**
```tsx
import { EmailHistory } from "@/components/email-history";
import { getEmailsForApplicationWithDetails } from "@/lib/queries/emails";

// Fetch emails with details pre-loaded
const emails = await getEmailsForApplicationWithDetails(applicationId);

// Component displays details immediately
<EmailHistory emails={emails} />
```

## API Endpoints

### New: Individual Email Details
```
GET /api/emails/details/[resendId]
```

Fetches details for a specific email by resend ID.

**Authentication:** Requires admin/editor role
**Response:**
```json
{
  "id": "resend_email_id",
  "to": ["user@example.com"],
  "from": "noreply@liyanafinance.co.za",
  "subject": "Your loan application update",
  "html": "<html>...</html>",
  "text": "Plain text version",
  "created_at": "2024-01-01T00:00:00Z",
  "last_event": "delivered"
}
```

### Enhanced: Email History
```
GET /api/emails/history?applicationId=123
GET /api/emails/history?loanId=456  
GET /api/emails/history?policyId=789
```

Can return either basic records or records with details pre-fetched.

## Component Features

### EmailHistory (Enhanced)

**Props:**
```tsx
interface EmailHistoryProps {
  emails: EmailWithDetails[] | EmailRecord[];
}
```

**Features:**
- 🔄 Dynamic content loading
- ⏳ Loading states with spinners
- 💾 Automatic caching
- 🔄 Retry functionality on failure
- 📱 Responsive design
- 🎨 Consistent UI across all entity types

**User Experience:**
1. Component loads instantly with basic email info
2. User clicks to expand an email
3. If details not cached, shows loading spinner
4. Fetches details from Resend API
5. Caches results for future expansions
6. Shows retry button if fetch fails

## Performance Comparison

| Approach | Initial Load | Expand Email | API Calls | Best For |
|----------|-------------|--------------|-----------|----------|
| Dynamic | ⚡ Fast | 🐌 Slight delay | 📉 Fewer | Large lists, Mobile |
| Pre-loaded | 🐌 Slower | ⚡ Instant | 📈 More | Small lists, Desktop |

## Implementation Status

### ✅ Completed
- [x] Dynamic email detail fetching API endpoint
- [x] Enhanced EmailHistory component
- [x] Loading states and error handling
- [x] Caching mechanism
- [x] Retry functionality
- [x] Type safety for both approaches
- [x] Backward compatibility

### 🎯 Pages Updated
- [x] **Applications**: Uses dynamic loading
- [x] **Loans**: Uses dynamic loading  
- [x] **Policies**: Uses pre-loaded details (existing)

## Migration Guide

### For New Implementations
Use the dynamic approach for better performance:

```tsx
// ✅ Recommended (Dynamic)
import { EmailHistory } from "@/components/email-history-new";
import { getEmailsForApplication } from "@/lib/queries/emails";

const emails = await getEmailsForApplication(id);
<EmailHistory emails={emails} />
```

### For Existing Code
Continue using pre-loaded approach or migrate gradually:

```tsx
// ⚡ Existing (Pre-loaded) - Still works
import { EmailHistory } from "@/components/email-history";
import { getEmailsForApplicationWithDetails } from "@/lib/queries/emails";

const emails = await getEmailsForApplicationWithDetails(id);
<EmailHistory emails={emails} />
```

## Testing

### Manual Testing
1. Navigate to any application/loan page
2. Go to the "Emails" tab
3. Expand an email - should show loading spinner then content
4. Expand the same email again - should show content immediately (cached)
5. Try expanding different emails to test individual fetching

### Automated Testing
```bash
# In browser console or Node.js
import { testDynamicEmailFetch, testWithRealData } from './test-dynamic-email-fetch.js';

// Test the API endpoint directly
testDynamicEmailFetch();

// Test with real data
testWithRealData('application', 1);
testWithRealData('loan', 1);
testWithRealData('policy', 1);
```

## Environment Requirements

- **RESEND_API_KEY**: Required for fetching email content
- **Authentication**: User must have admin/editor role
- **Database**: Must have valid resend_id values in resend_emails table

## Error Handling

The component gracefully handles various error scenarios:

1. **Network errors**: Shows retry button
2. **Authentication failures**: Redirects or shows error message
3. **Missing email**: Shows "not found" message
4. **Resend API failures**: Falls back to basic email info
5. **Invalid resend_id**: Shows error with retry option

## Security

- All API calls require authentication
- Only admin/editor roles can fetch email details
- Resend ID must exist in database before fetching from Resend API
- No sensitive data exposed in error messages

## Future Enhancements

- [ ] Email content search within history
- [ ] Bulk detail fetching for better performance
- [ ] Real-time email status updates
- [ ] Email preview without full expansion
- [ ] Export email history functionality
