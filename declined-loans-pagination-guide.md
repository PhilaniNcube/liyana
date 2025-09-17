# Declined Loans Pagination Integration Guide

## Overview

I've created a new pagination component `DeclinedLoansPagination` that uses shadcn/ui Pagination components and integrates with nuqs for query state management. Here's how to use it.

## Component Created

**File:** `components/declined-loans-pagination.tsx`

This component:
- Uses shadcn/ui Pagination components
- Integrates with nuqs for URL query state management  
- Supports ellipsis for large page counts
- Auto-hides when there's only one page
- Handles click events to update the page URL parameter

## Usage Options

### Option 1: With the Enhanced Paginated Function (Recommended)

For a complete pagination solution, use the `getDeclinedUsersAndApplicationsPaginated` function (like in `page-new.tsx`):

```tsx
// In your page component
import { DeclinedLoansPagination } from "@/components/declined-loans-pagination";
import { getDeclinedUsersAndApplicationsPaginated } from "@/lib/queries/user";

export default async function DeclinedLoansPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { page } = searchParamsCache.parse(searchParams);
  
  const pageSize = 50; // or your preferred page size
  const {
    data: declinedUsersAndApplications,
    totalPages,
  } = await getDeclinedUsersAndApplicationsPaginated(page, pageSize);

  return (
    <div className="space-y-6">
      {/* Your table content here */}
      <Table>
        {/* Table content */}
      </Table>
      
      {/* Add pagination below the table */}
      <DeclinedLoansPagination 
        currentPage={page} 
        totalPages={totalPages} 
      />
    </div>
  );
}
```

### Option 2: With Current Function (Limited)

If you need to keep using `getDeclinedApplications`, you'll need to modify it to return total count information or implement a workaround:

```tsx
// This would require modifying getDeclinedApplications to return total count
// Currently it only does client-side pagination without total count info

// Example of what you'd need:
interface DeclinedApplicationsResult {
  data: any[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}
```

## Integration with Current Page

To add pagination to the current declined loans page, add this after the table:

```tsx
{/* Add this after your Table component */}
{totalPages > 1 && (
  <DeclinedLoansPagination 
    currentPage={page} 
    totalPages={totalPages} 
  />
)}
```

## Query State Configuration

The pagination component uses this query configuration (must match your server-side parsing):

```tsx
const paginationQueryConfig = {
  page: parseAsInteger.withDefault(1),
};
```

Make sure your page's searchParamsCache includes the page parameter:

```tsx
const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  per_page: parseAsInteger.withDefault(50),
  start_date: parseAsIsoDate,
  end_date: parseAsIsoDate,
});
```

## Styling

The component includes responsive design and proper spacing. You can customize the className prop:

```tsx
<DeclinedLoansPagination 
  currentPage={page} 
  totalPages={totalPages}
  className="my-8" // Custom spacing
/>
```

## Next Steps

1. **Recommended:** Switch to `getDeclinedUsersAndApplicationsPaginated` for full pagination support
2. **Alternative:** Modify `getDeclinedApplications` to return total count information
3. Add the pagination component below your declined loans table
4. Test the pagination functionality with query parameters

The pagination component will automatically update the URL with the selected page number and trigger a server-side refetch thanks to nuqs integration.