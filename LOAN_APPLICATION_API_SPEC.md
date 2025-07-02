# Loan Application API Specification

This document describes the data structure and format for creating loan applications via REST API. The external system should implement an endpoint to receive this data and store it in the applications table.

## Endpoint Overview

**Method:** `POST`  
**Path:** `/api/loan-applications`  
**Content-Type:** `application/json`

## Request Body Schema

The loan application data is sent as a JSON object with the following structure:

### Required Fields

#### Personal Information
```json
{
  "firstName": "string",           // Applicant's first name (min 1 char)
  "lastName": "string",            // Applicant's last name (min 1 char)
  "identificationType": "id" | "passport",  // Type of identification
  "idNumber": "string",            // Required if identificationType = "id" (13 digits)
  "passportNumber": "string",      // Required if identificationType = "passport" (min 6 chars)
  "dateOfBirth": "YYYY-MM-DD",     // Date of birth in ISO format
  "phoneNumber": "string",         // Phone number (min 10 digits)
  "email": "string",               // Valid email address
  "gender": "male" | "female" | "rather not say" | "other",
  "genderOther": "string",         // Required only if gender = "other"
  "language": "string",            // Preferred language
  "dependants": "number",            // Number of dependants (0-20)
  "maritalStatus": "single" | "married" | "divorced" | "widowed" | "life_partner",
  "nationality": "string",         // Nationality
  "address": "string",             // Home address
  "city": "string",                // City
  "province": "string",            // Province
  "postalCode": "string"           // Postal code (min 4 chars)
}
```

#### Employment Information
```json
{
  "employmentStatus": "employed" | "self_employed" | "contract" | "unemployed" | "retired",
  "employer": "string",            // Employer name
  "jobTitle": "string",            // Job title
  "monthlyIncome": "string",       // Monthly income (numeric string)
  "workExperience": "string"       // Work experience description
}
```

#### Loan Information
```json
{
  "loanAmount": "string",          // Loan amount (500-5000, numeric string)
  "loanPurpose": "debt_consolidation" | "home_improvement" | "education" | "medical" | "other",
  "loanPurposeReason": "string",   // Required only if loanPurpose = "other"
  "repaymentPeriod": "string"      // Repayment period in days (5-61, numeric string)
}
```

#### Banking Information
```json
{
  "bankName": "string",            // Bank name
  "bankAccountHolder": "string",   // Account holder name
  "bankAccountType": "savings" | "transaction" | "current" | "business",
  "bankAccountNumber": "string",   // Bank account number (min 8 digits)
  "branchCode": "string"           // Branch code (exactly 6 digits)
}
```

### Optional Fields

#### Employment (Optional)
```json
{
  "employerAddress": "string",         // Employer address
  "employerContactNumber": "string",   // Employer contact number
  "employmentEndDate": "YYYY-MM-DD"    // Employment end date (for contracts)
}
```

#### Next of Kin (Optional)
```json
{
  "nextOfKinName": "string",       // Next of kin full name
  "nextOfKinPhone": "string",      // Next of kin phone number
  "nextOfKinEmail": "string"       // Next of kin email address
}
```

#### Affordability Assessment (Optional)
```json
{
  "affordability": {
    "income": [
      {
        "type": "string",          // Income type (e.g., "salary", "bonus")
        "amount": "number"           // Amount in currency
      }
    ],
    "deductions": [
      {
        "type": "string",          // Deduction type (e.g., "tax", "uif")
        "amount": "number"           // Amount in currency
      }
    ],
    "expenses": [
      {
        "type": "string",          // Expense type (e.g., "rent", "groceries")
        "amount": "number"           // Amount in currency
      }
    ]
  }
}
```

## Complete Example Request

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "identificationType": "id",
  "idNumber": "8001015009087",
  "dateOfBirth": "1980-01-01",
  "phoneNumber": "0123456789",
  "email": "john.doe@example.com",
  "gender": "male",
  "language": "English",
  "dependants": 2,
  "maritalStatus": "married",
  "nationality": "South African",
  "address": "123 Main Street, Suburb",
  "city": "Cape Town",
  "province": "Western Cape",
  "postalCode": "8001",
  
  "employmentStatus": "employed",
  "employer": "ABC Company",
  "employerAddress": "456 Business Avenue",
  "employerContactNumber": "0219876543",
  "jobTitle": "Software Developer",
  "monthlyIncome": "25000",
  "workExperience": "5 years in software development",
  
  "loanAmount": "3000",
  "loanPurpose": "debt_consolidation",
  "repaymentPeriod": "30",
  
  "nextOfKinName": "Jane Doe",
  "nextOfKinPhone": "0123456788",
  "nextOfKinEmail": "jane.doe@example.com",
  
  "bankName": "First National Bank",
  "bankAccountHolder": "John Doe",
  "bankAccountType": "savings",
  "bankAccountNumber": "12345678901",
  "branchCode": "250655",
  
  "affordability": {
    "income": [
      {
        "type": "salary",
        "amount": 25000
      },
      {
        "type": "bonus",
        "amount": 2000
      }
    ],
    "deductions": [
      {
        "type": "tax",
        "amount": 5000
      },
      {
        "type": "uif",
        "amount": 250
      }
    ],
    "expenses": [
      {
        "type": "rent",
        "amount": 8000
      },
      {
        "type": "groceries",
        "amount": 3000
      }
    ]
  }
}
```

## Validation Rules

### Business Logic Validations

1. **Identification Validation:**
   - If `identificationType` is "id", `idNumber` must be exactly 13 digits
   - If `identificationType` is "passport", `passportNumber` must be at least 6 characters

2. **Conditional Required Fields:**
   - `genderOther` is required when `gender` is "other"
   - `loanPurposeReason` is required when `loanPurpose` is "other"

3. **Numeric Validations:**
   - `loanAmount`: Between 500 and 5000
   - `repaymentPeriod`: Between 5 and 61 days
   - `dependants`: Between 0 and 20
   - `phoneNumber`: Minimum 10 digits
   - `bankAccountNumber`: Minimum 8 digits
   - `branchCode`: Exactly 6 digits
   - `postalCode`: Minimum 4 characters

### Field Format Requirements

- **Email:** Must be valid email format
- **Dates:** Must be in YYYY-MM-DD format
- **Numeric Strings:** Fields like `loanAmount`, `monthlyIncome`, `repaymentPeriod` are sent as strings but contain numeric values

## Database Mapping

When storing in the applications table, the following transformations occur:

### Field Mapping
- `firstName`, `lastName`, `email`, `phoneNumber`, `postalCode`, `province`, `identificationType` → Not stored in current database schema
- `idNumber`/`passportNumber` → `id_number` (encrypted)
- `dateOfBirth` → `date_of_birth`
- `address` → `home_address`
- `loanAmount` → `application_amount` (converted to float)
- `repaymentPeriod` → `term` (converted to integer)
- `monthlyIncome` → `monthly_income` (converted to float)
- `employmentStatus` → `employment_type`
- `employer` → `employer_name`
- `employerAddress` → `employer_address`
- `employerContactNumber` → `employer_contact_number`
- `employmentEndDate` → `employment_end_date`
- `nextOfKinName` → `next_of_kin_name`
- `nextOfKinPhone` → `next_of_kin_phone_number`
- `nextOfKinEmail` → `next_of_kin_email`
- `bankAccountHolder` → `bank_account_holder`
- `bankAccountType` → `bank_account_type`
- `bankAccountNumber` → `bank_account_number`
- `branchCode` → `branch_code`
- `affordability` → `affordability` (stored as JSONB)

### Additional Fields Set by System
- `user_id`: Set from authenticated user
- `status`: Always set to "pre_qualifier"
- `created_at`: Set to current timestamp

## Response Format

### Success Response (201 Created)
```json
{
  "success": true,
  "applicationId": "123"
}
```

### Error Response (400 Bad Request)
```json
{
  "errors": {
    "fieldName": ["Error message 1", "Error message 2"],
    "_form": ["General error message"]
  }
}
```

## Security Considerations

1. **Data Encryption:** The identification number (`id_number`) is encrypted before storage
2. **Authentication:** User must be authenticated to submit applications
3. **Data Validation:** All fields are validated according to the schema rules
4. **Sensitive Data:** Personal information should be handled according to data protection regulations

## Notes for Implementation

1. The affordability section is stored as JSONB in the database, allowing flexible structure
2. Some form fields (firstName, lastName, email, etc.) are collected but not currently stored in the database
3. All monetary amounts should be handled as numbers in the database but are sent as strings in the API
4. Date fields should be validated to ensure proper ISO format
5. The system sets a default status of "pre_qualifier" for all new applications
