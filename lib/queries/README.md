# Queries Folder

This folder contains all database query functions organized by domain/feature for the Liyana Finance application.

## Structure

```
queries/
├── index.ts           # Re-exports all query modules
├── user.ts           # User profile queries
├── applications.ts   # Loan application queries
├── documents.ts      # Document management queries
├── api-checks.ts     # Third-party API verification queries
├── analytics.ts      # Dashboard and reporting queries
└── README.md        # This file
```

## Database Schema Overview

The application manages a loan/credit application system with the following main entities:

- **profiles**: User profiles with roles (customer, admin, editor)
- **applications**: Loan applications with status tracking
- **documents**: Required documents (ID, bank statements, payslips, proof of residence)
- **api_checks**: Third-party verification checks (credit bureau, Credit Checks, etc.)

## Usage

### Import specific queries:
```typescript
import { getUserProfile } from "@/lib/queries/user";
import { getApplicationsByUser } from "@/lib/queries/applications";
import { getDocumentsByApplication } from "@/lib/queries/documents";
```

### Import all queries:
```typescript
import { 
  getUserProfile, 
  getApplicationsByUser, 
  getDashboardStats 
} from "@/lib/queries";
```

## Query Categories

### User Queries (`user.ts`)
- User profile management
- Role-based user filtering
- Profile updates

### Application Queries (`applications.ts`)
- Application CRUD operations
- Status-based filtering
- Application statistics
- Applications with related data (documents, API checks)

### Document Queries (`documents.ts`)
- Document management by application
- Document type filtering
- Required document validation
- Document statistics

### API Check Queries (`api-checks.ts`)
- Third-party verification tracking
- Status monitoring (passed, failed, pending)
- Vendor-specific queries (Experian, WhoYou, ThisIsMe)
- Check type filtering (credit bureau, Credit Check, etc.)

### Analytics Queries (`analytics.ts`)
- Dashboard statistics
- Application trends and growth metrics
- Time-based reporting
- Approval rate calculations

## Conventions

1. **File naming**: Use kebab-case for file names (e.g., `api-checks.ts`)
2. **Function naming**: Use descriptive camelCase names (e.g., `getApplicationsByUser`)
3. **Schemas**: Export Zod schemas for validation when needed
4. **Error handling**: Always throw descriptive errors with context
5. **Types**: Use TypeScript types from `@/lib/types`
6. **Relationships**: Include related data using Supabase joins when appropriate

## Adding New Queries

1. Create a new file in this directory (e.g., `notifications.ts`)
2. Follow the existing pattern:
   - Import dependencies and types
   - Define Zod schemas if needed
   - Create query functions with proper error handling
   - Use TypeScript types from the Database schema
3. Export the new module in `index.ts`

## Best Practices

- Keep queries focused on data fetching only
- Use the `createClient()` from `@/lib/server` for database connections
- Include proper TypeScript types from the Database schema
- Add JSDoc comments for complex queries
- Use Zod schemas for input validation when appropriate
- Include related data using Supabase joins to minimize database calls
- Group related functionality in the same file
