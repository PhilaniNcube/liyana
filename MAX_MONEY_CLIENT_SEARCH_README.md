# MaxMoney Client Search Utility

This utility provides functions to search for existing clients in the MaxMoney system using either their ID number or client number.

## Files Created/Modified

1. **`lib/schemas.ts`** - Added new schemas for MaxMoney client search
2. **`lib/utils/max-money.ts`** - New utility file with search functions
3. **`lib/utils/index.ts`** - Updated to export MaxMoney utilities
4. **`app/api/max_money/search_client/route.ts`** - New API endpoint for client search
5. **`test-max-money-client-search.js`** - Test file demonstrating usage

## Usage

### 1. Using the Utility Functions Directly

```typescript
import { searchMaxMoneyClientByIdNumber, searchMaxMoneyClientByClientNumber } from "@/lib/utils/max-money";

// Search by ID number
const searchResult = await searchMaxMoneyClientByIdNumber("9001010001088");

// Search by client number  
const searchResult = await searchMaxMoneyClientByClientNumber("12345");

// Generic search (can use either parameter)
import { searchMaxMoneyClient } from "@/lib/utils/max-money";
const searchResult = await searchMaxMoneyClient({ id_number: "9001010001088" });
```

### 2. Using the API Endpoint

**POST** `/api/max_money/search_client`

Request body:
```json
{
  "id_number": "9001010001088"
}
```

Response:
```json
{
  "message": "Client search completed successfully",
  "return_reason": "Success.",
  "return_code": 0,
  "client_no": "1",
  "client_name": "Sarie",
  "client_surname": "Kakemas",
  "client_budget_id": "",
  "client_id": "123456",
  "cli_status": "Good",
  "employer_name": "Coke",
  "employment_type": "Permanent",
  "home_branch": "Head Office",
  "payment_frequency": "4",
  "use_client_budget": true,
  "budget_available_amount": "46216.91",
  "budget_date": "2024-05-28",
  "valid_budget_period": false,
  "status_warnings": []
}
```

## API Reference

### MaxMoney Client Search Request

The MaxMoney API endpoint `/MaxIntegrate/client_search` accepts the following fields:

```typescript
{
  "mle_id": number,        // Required - from login response
  "mbr_id": number,        // Required - from login response  
  "user_id": number,       // Required - from login response
  "client_number": string, // Conditional - either this or id_number
  "id_number": string,     // Conditional - either this or client_number
  "login_token": string    // Required - from login response
}
```

### MaxMoney Client Search Response

```typescript
{
  "return_reason": string,
  "return_code": number,
  "client_no": string,           // Client number
  "client_name": string,         // Client first name
  "client_surname": string,      // Client surname
  "client_budget_id": string,    // Budget ID (can be empty)
  "client_id": string,          // Client ID number
  "cli_status": string,         // Client status (e.g., "Good")
  "employer_name": string,      // Employer name
  "employment_type": string,    // Employment type (e.g., "Permanent")
  "home_branch": string,        // Home branch (e.g., "Head Office")
  "payment_frequency": string,  // Payment frequency code
  "use_client_budget": boolean, // Whether client budget is used
  "budget_available_amount": string, // Available budget amount
  "budget_date": string,        // Budget date (YYYY-MM-DD)
  "valid_budget_period": boolean,   // Budget validity status
  "status_warnings": string[]   // Array of warning messages
}
```

## Functions

### `searchMaxMoneyClient(params)`

Generic search function that accepts either `id_number` or `client_number`.

**Parameters:**
- `params.id_number?: string` - SA ID number to search for
- `params.client_number?: string` - MaxMoney client number to search for

**Returns:** `Promise<MaxMoneyClientSearchResponse>`

### `searchMaxMoneyClientByIdNumber(idNumber)`

Search specifically by ID number.

**Parameters:**
- `idNumber: string` - SA ID number to search for

**Returns:** `Promise<MaxMoneyClientSearchResponse>`

### `searchMaxMoneyClientByClientNumber(clientNumber)`

Search specifically by client number.

**Parameters:**
- `clientNumber: string` - MaxMoney client number to search for

**Returns:** `Promise<MaxMoneyClientSearchResponse>`

## Error Handling

All functions include comprehensive error handling:
- Validates input parameters
- Handles MaxMoney API authentication
- Validates API responses
- Provides detailed error messages and logging

Common errors:
- `"Missing Max Money environment variables"` - Configuration issue
- `"Either id_number or client_number must be provided"` - Invalid parameters
- `"Max Money login failed"` - Authentication issue
- `"Max Money client search failed"` - API error

## Environment Variables Required

```env
MAX_MONEY_URL=https://your-maxmoney-api-url
MAX_MONEY_API_USERNAME=your-username
MAX_MONEY_API_PASSWORD=your-password
```

## Testing

Run the test file to verify the functionality:

```bash
node test-max-money-client-search.js
```

The test will:
1. Test search by ID number
2. Test search by client number
3. Test validation error handling

## Integration Example

Here's how you might integrate this into an existing application flow:

```typescript
// In your application logic
import { searchMaxMoneyClientByIdNumber } from "@/lib/utils/max-money";

export async function checkExistingClient(idNumber: string) {
  try {
    const searchResult = await searchMaxMoneyClientByIdNumber(idNumber);
    
    if (searchResult.return_code === 0 && searchResult.client_no) {
      // Client exists in MaxMoney
      return {
        exists: true,
        client: {
          client_no: searchResult.client_no,
          client_name: searchResult.client_name,
          client_surname: searchResult.client_surname,
          client_id: searchResult.client_id,
          cli_status: searchResult.cli_status,
          employer_name: searchResult.employer_name,
          budget_available_amount: searchResult.budget_available_amount,
        }
      };
    } else {
      // Client doesn't exist
      return {
        exists: false,
        client: null
      };
    }
  } catch (error) {
    console.error("Error checking existing client:", error);
    // Decide whether to fail or continue based on your business logic
    throw error;
  }
}