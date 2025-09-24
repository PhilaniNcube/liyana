# MaxMoney API Documentation

## 👤 Creating a New Client

To create a new client, you'll use the `client_create` endpoint with a POST request. This is the first step in the loan application process and is required for future actions like applying for a loan or performing a credit check.

### Endpoint and Request Type

**Endpoint:** `{base_url}/MaxMoney/MaxIntegrate/client_create`

**Request Type:** `POST`

### Key Input Fields

You'll need to provide data for several mandatory and conditional fields in the request body:

- **`mle_id`**: Your Merchant Legal Entity Id.
- **`mbr_id`**: Your Merchant Legal Entity Branch Id.
- **`user_id`**: Your User Id.
- **`login_token`**: Your valid login token.
- **`first_name`**: The client's first name.
- **`surname`**: The client's surname.
- **`gender`**: The client's gender, using the values from the Gender data table (e.g., 1 for Male, 2 for Female).
- **`id_type`**: The client's ID type, using the values from the ID Type data table (e.g., 1 for RSA ID, 2 for Passport).
- **`id_number`**: The client's ID number, which must be unique.
- **`date_of_birth`**: The client's date of birth in DD/MM/CCYY format.
- **`payback_type_id`**: The client's payback type ID, obtained from the payback_type_list.
- **`gross_salary`**: The client's gross income.
- **`net_salary`**: The client's net income.

### Important Notes

- If a client with the same ID number already exists, the API will return a message indicating this along with the existing client number.
- The `avr_enquiry` field, if set to true, will perform a real-time account verification check on the client's bank details. This requires valid bank account details to be provided.
- Bank names are automatically populated based on the branch code to ensure accuracy.

## 💳 Adding a Loan Application

After a client is successfully created, you can apply for a loan using the `create_loan_application` endpoint. This process creates a new application loan that is linked to the client.

### Endpoint and Request Type

**Endpoint:** `{base_url}/MaxMoney/MaxIntegrate/create_loan_application`

**Request Type:** `POST`

### Key Input Fields

You'll need to include the following mandatory fields in your request body:

- **`mle_id, mbr_id, user_id, login_token`**: Your identifying information, similar to the client creation call.
- **`client_number`**: The client number of the person for whom you are creating the loan application.
- **`loan_product_id`**: The ID of the loan product, retrieved from the loan_product_list.
- **`cashbox_id`**: The ID of the cashbox you're logged into.
- **`loan_purpose_id`**: The ID of the loan's purpose, retrieved from the loan_purpose_list. This is used for NCR and SACRRA reporting.
- **`no_of_instalment`**: The number of loan installments.
- **`loan_amount`**: The total amount of the loan.

### Output Information

A successful response will include the `loan_id` and `loan_no` of the new loan, as well as a `summary_data` object containing details such as the loan amount, interest, total repayable, and fees.

## 🚀 API Implementation

This documentation corresponds to the following API endpoints in the application:

### Creating a Client
- **Endpoint:** `POST /api/max_money/create_client`
- **Implementation:** `app/api/max_money/create_client/route.ts`

### Creating a Loan Application  
- **Endpoint:** `POST /api/max_money/create_loan_application`
- **Implementation:** `app/api/max_money/create_loan_application/route.ts`

### Usage Flow

1. **Create Client First:** Always create a client using the `create_client` endpoint before applying for a loan
2. **Get Client Number:** The client creation response will include a `client_number` 
3. **Apply for Loan:** Use the `client_number` in the loan application request
4. **Required Dependencies:** You'll need:
   - `loan_product_id` from the loan_product_list
   - `cashbox_id` for your logged-in session
   - `loan_purpose_id` from loan_purpose_list (for reporting)

### Example Request Flow

```javascript
// 1. Create client first
const clientResponse = await fetch('/api/max_money/create_client', {
  method: 'POST',
  body: JSON.stringify(clientData)
});
const { client_number } = await clientResponse.json();

// 2. Then create loan application
const loanResponse = await fetch('/api/max_money/create_loan_application', {
  method: 'POST', 
  body: JSON.stringify({
    application_id: 12345,
    client_number,
    loan_product_id: 1,
    cashbox_id: 1,
    loan_purpose_id: 1,
    no_of_instalment: 12,
    loan_amount: 5000
  })
});
```

## 📝 Notes

- All monetary amounts should be in South African Rand (ZAR)
- Client must exist before creating a loan application
- The API handles authentication automatically via environment variables
- Response includes detailed loan summary with interest calculations