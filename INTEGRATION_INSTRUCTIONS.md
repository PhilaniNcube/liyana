/**
 * Instructions for integrating the Enhanced Affordability View
 * into the Application Detail Client
 */

// STEP 1: Add import to the client.tsx file
// Add this import at the top of your client.tsx file:
// import { EnhancedAffordabilityView } from '@/components/enhanced-affordability-view';

// STEP 2: Add a new tab for affordability (optional)
// In your TabsList, add:
// <TabsTrigger value="affordability">Affordability</TabsTrigger>

// STEP 3: Add the TabsContent for affordability
// Add this new TabsContent in your Tabs component:

/*
<TabsContent value="affordability">
  <EnhancedAffordabilityView
    monthlyIncome={application.monthly_income || 0}
    affordabilityData={application.affordability}
    showBreakdown={true}
  />
</TabsContent>
*/

// ALTERNATIVE: Add it to the existing loan-banking-info tab
// You can add it to the existing "loan-banking-info" tab by inserting this
// after the LoanBankingInfoCard:

/*
<TabsContent value="loan-banking-info">
  <LoanBankingInfoCard application={application} />
  <AdditionalInfoCard application={application} />
  
  <!-- Add this new section -->
  <div className="mt-6">
    <h3 className="text-lg font-semibold mb-4">Enhanced Affordability Analysis</h3>
    <EnhancedAffordabilityView
      monthlyIncome={application.monthly_income || 0}
      affordabilityData={application.affordability}
      showBreakdown={true}
    />
  </div>
</TabsContent>
*/

// STEP 4: For use in the Max Money LMS integration
// You can also use the calculation utility in your LMS submission logic:

/*
import { calculateAffordability } from '@/lib/utils/affordability-calculator';

// In your handleSendToLms function, calculate the net salary:
const affordabilityCalc = calculateAffordability(
  application.monthly_income || 0,
  application.affordability
);

const clientData = {
  // ... other fields
  gross_salary: application.monthly_income || 0,
  net_salary: affordabilityCalc.netIncome, // Use calculated net income
  // ... rest of fields
};
*/

export {}; // Make this a module
