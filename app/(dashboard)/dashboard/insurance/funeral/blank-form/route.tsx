import { createClient } from "@/lib/server";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  renderToStream,
} from "@react-pdf/renderer";
import { NextResponse } from "next/server";

// Define professional PDF styling matching corporate insurance documents
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    color: "#334155", // slate-700
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: "#0f172a", // slate-900
    paddingBottom: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerLeft: {
    flexDirection: "column",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: 1,
  },
  logoSubtext: {
    fontSize: 8,
    color: "#64748b", // slate-500
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  formTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
    textTransform: "uppercase",
  },
  regDetails: {
    fontSize: 7,
    color: "#64748b",
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 9,
    fontWeight: "bold",
    backgroundColor: "#f1f5f9", // slate-100
    color: "#0f172a",
    padding: "4 8",
    marginTop: 10,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  col12: {
    width: "100%",
    marginBottom: 6,
  },
  col6: {
    width: "48%",
    marginBottom: 6,
  },
  col4: {
    width: "31%",
    marginBottom: 6,
  },
  col3: {
    width: "23%",
    marginBottom: 6,
  },
  col8: {
    width: "73%",
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 7.5,
    color: "#475569", // slate-600
    fontWeight: "bold",
    marginBottom: 3,
  },
  fieldBox: {
    height: 18,
    borderWidth: 1,
    borderColor: "#cbd5e1", // slate-300
    borderRadius: 2,
    backgroundColor: "#fafafa",
  },
  instructionText: {
    fontSize: 7,
    color: "#64748b",
    fontStyle: "italic",
    marginBottom: 4,
  },
  idGridContainer: {
    flexDirection: "row",
    marginTop: 2,
  },
  idBox: {
    width: 14,
    height: 18,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRightWidth: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  idBoxLast: {
    width: 14,
    height: 18,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    marginTop: 3,
  },
  checkbox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 1,
    marginRight: 4,
  },
  checkboxLabel: {
    fontSize: 7.5,
    color: "#334155",
  },
  planCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 3,
    padding: 6,
    width: "48%",
    marginBottom: 6,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 3,
    marginBottom: 3,
  },
  planName: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#0f172a",
  },
  planDetails: {
    fontSize: 7,
    color: "#475569",
    lineHeight: 1.2,
  },
  planPremium: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "right",
    marginTop: 2,
  },
  table: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 4,
    marginBottom: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    padding: "3 5",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    padding: "4 5",
  },
  tableRowLast: {
    flexDirection: "row",
    padding: "4 5",
  },
  thText: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#334155",
  },
  tdText: {
    fontSize: 7.5,
    color: "#334155",
  },
  legalText: {
    fontSize: 7,
    color: "#64748b",
    lineHeight: 1.3,
    textAlign: "justify",
    marginBottom: 6,
  },
  signatureContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  signatureBox: {
    width: "45%",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#475569",
    height: 30,
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 6.5,
    color: "#94a3b8",
  },
});

const FuneralBlankFormPDF = () => (
  <Document>
    {/* PAGE 1: Personal, Plan, Beneficiary & Dependants details */}
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoText}>LIYANA FINANCE</Text>
          <Text style={styles.logoSubtext}>Simple & Accessible Financial Products</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.formTitle}>Funeral Cover Application Form</Text>
          <Text style={styles.regDetails}>Reg No: 2023/790223/07 | NCR Reg: NCRCP18217</Text>
        </View>
      </View>

      {/* SECTION A: Plan Selection */}
      <Text style={styles.sectionHeader}>Section A: Funeral Cover Plan Selection</Text>
      <Text style={styles.instructionText}>Please select one plan package by checking the box [x]:</Text>
      
      <View style={styles.grid}>
        {/* Plan 1 */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={styles.checkbox} />
              <Text style={styles.planName}>Elula Air Family Plan</Text>
            </View>
            <Text style={{ fontSize: 7, color: "#64748b" }}>Family Plan</Text>
          </View>
          <Text style={styles.planDetails}>Principal Cover: R12,350 | Spouse Cover: R10,000</Text>
          <Text style={styles.planDetails}>Children: Covered under 21 (up to 25 if student)</Text>
          <Text style={styles.planPremium}>R132.90 / month</Text>
        </View>

        {/* Plan 2 */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={styles.checkbox} />
              <Text style={styles.planName}>Ilifa Family Plan</Text>
            </View>
            <Text style={{ fontSize: 7, color: "#64748b" }}>Family Plan</Text>
          </View>
          <Text style={styles.planDetails}>Principal Cover: R18,500 | Spouse Cover: R10,000</Text>
          <Text style={styles.planDetails}>Includes: Trauma Assist, Repatriation & Nurse Call</Text>
          <Text style={styles.planPremium}>R203.60 / month</Text>
        </View>

        {/* Plan 3 */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={styles.checkbox} />
              <Text style={styles.planName}>Ukuthula Single Plan</Text>
            </View>
            <Text style={{ fontSize: 7, color: "#64748b" }}>Single Cover</Text>
          </View>
          <Text style={styles.planDetails}>Principal Cover: R6,000</Text>
          <Text style={styles.planDetails}>Individual member cover only (no dependents)</Text>
          <Text style={styles.planPremium}>R67.00 / month</Text>
        </View>

        {/* Plan 4 */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={styles.checkbox} />
              <Text style={styles.planName}>Ilanga Single Plan</Text>
            </View>
            <Text style={{ fontSize: 7, color: "#64748b" }}>Single Cover</Text>
          </View>
          <Text style={styles.planDetails}>Principal Cover: R10,000</Text>
          <Text style={styles.planDetails}>Includes: Trauma, Repatriation, Nurse & RAF Expert</Text>
          <Text style={styles.planPremium}>R139.00 / month</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.col6}>
          <Text style={styles.fieldLabel}>Desired Cover Start Date</Text>
          <Text style={{ ...styles.instructionText, marginBottom: 2 }}>Format: YYYY-MM-DD</Text>
          <View style={styles.fieldBox} />
        </View>
      </View>

      {/* SECTION B: Principal Insured details */}
      <Text style={styles.sectionHeader}>Section B: Principal Insured (Policyholder) Details</Text>
      
      <View style={styles.grid}>
        <View style={styles.col6}>
          <Text style={styles.fieldLabel}>First Name(s)</Text>
          <View style={styles.fieldBox} />
        </View>
        <View style={styles.col6}>
          <Text style={styles.fieldLabel}>Last Name (Surname)</Text>
          <View style={styles.fieldBox} />
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.col6}>
          <Text style={styles.fieldLabel}>South African Identity Number (13 Digits)</Text>
          <View style={styles.idGridContainer}>
            {Array.from({ length: 12 }).map((_, i) => (
              <View key={i} style={styles.idBox} />
            ))}
            <View style={styles.idBoxLast} />
          </View>
        </View>
        <View style={styles.col3}>
          <Text style={styles.fieldLabel}>Date of Birth</Text>
          <Text style={{ ...styles.instructionText, marginBottom: 2 }}>YYYY-MM-DD</Text>
          <View style={styles.fieldBox} />
        </View>
        <View style={styles.col3}>
          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={{ flexDirection: "row", marginTop: 4 }}>
            <View style={styles.checkboxContainer}>
              <View style={styles.checkbox} />
              <Text style={styles.checkboxLabel}>M</Text>
            </View>
            <View style={styles.checkboxContainer}>
              <View style={styles.checkbox} />
              <Text style={styles.checkboxLabel}>F</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.col6}>
          <Text style={styles.fieldLabel}>Cellphone Number</Text>
          <View style={styles.fieldBox} />
        </View>
        <View style={styles.col6}>
          <Text style={styles.fieldLabel}>Email Address</Text>
          <View style={styles.fieldBox} />
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.col8}>
          <Text style={styles.fieldLabel}>Residential Address (Street, Suburb)</Text>
          <View style={styles.fieldBox} />
        </View>
        <View style={styles.col4}>
          <Text style={styles.fieldLabel}>City</Text>
          <View style={styles.fieldBox} />
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.col3}>
          <Text style={styles.fieldLabel}>Postal Code</Text>
          <View style={styles.fieldBox} />
        </View>
        <View style={{ width: "73%", marginBottom: 6 }}>
          <Text style={styles.fieldLabel}>Employment Status</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 2 }}>
            <View style={styles.checkboxContainer}>
              <View style={styles.checkbox} />
              <Text style={styles.checkboxLabel}>Employed</Text>
            </View>
            <View style={styles.checkboxContainer}>
              <View style={styles.checkbox} />
              <Text style={styles.checkboxLabel}>Self-Employed</Text>
            </View>
            <View style={styles.checkboxContainer}>
              <View style={styles.checkbox} />
              <Text style={styles.checkboxLabel}>Contract</Text>
            </View>
            <View style={styles.checkboxContainer}>
              <View style={styles.checkbox} />
              <Text style={styles.checkboxLabel}>Retired</Text>
            </View>
            <View style={styles.checkboxContainer}>
              <View style={styles.checkbox} />
              <Text style={styles.checkboxLabel}>SASSA Grant</Text>
            </View>
          </View>
        </View>
      </View>

      {/* SECTION C: Policy Beneficiary details */}
      <Text style={styles.sectionHeader}>Section C: Primary Beneficiary Details</Text>
      <Text style={styles.instructionText}>Nominated beneficiary who will receive payout in the event of Principal Insured's death (Must be 18+):</Text>
      
      <View style={styles.grid}>
        <View style={styles.col6}>
          <Text style={styles.fieldLabel}>Beneficiary Full Name & Surname</Text>
          <View style={styles.fieldBox} />
        </View>
        <View style={styles.col6}>
          <Text style={styles.fieldLabel}>Identity Number / DOB</Text>
          <View style={styles.fieldBox} />
        </View>
      </View>
      <View style={styles.grid}>
        <View style={styles.col6}>
          <Text style={styles.fieldLabel}>Relationship to Principal</Text>
          <View style={styles.fieldBox} />
        </View>
        <View style={styles.col6}>
          <Text style={styles.fieldLabel}>Cellphone Number</Text>
          <View style={styles.fieldBox} />
        </View>
      </View>

      <Text style={{ fontSize: 7, color: "#94a3b8", textAlign: "right", marginTop: 10 }}>Page 1 of 2</Text>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Liyana Finance (Pty) Ltd is an Authorised Financial Services Provider.</Text>
        <Text style={styles.footerText}>Version 1.0 (Printable)</Text>
      </View>
    </Page>

    {/* PAGE 2: Dependants table, Banking, declarations & signatures */}
    <Page size="A4" style={styles.page}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoText}>LIYANA FINANCE</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.formTitle}>Funeral Cover Application Form</Text>
        </View>
      </View>

      {/* SECTION D: Dependants Details */}
      <Text style={styles.sectionHeader}>Section D: Family Dependants Details (For Family Plans Only)</Text>
      <Text style={styles.instructionText}>List spouse and children to be covered under the family policy:</Text>
      
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={{ width: "30%" }}><Text style={styles.thText}>First Name(s)</Text></View>
          <View style={{ width: "30%" }}><Text style={styles.thText}>Last Name (Surname)</Text></View>
          <View style={{ width: "25%" }}><Text style={styles.thText}>SA ID Number / DOB</Text></View>
          <View style={{ width: "15%" }}><Text style={styles.thText}>Relationship</Text></View>
        </View>

        {Array.from({ length: 5 }).map((_, idx) => (
          <View key={idx} style={idx === 4 ? styles.tableRowLast : styles.tableRow}>
            <View style={{ width: "30%" }}><Text style={styles.tdText}></Text></View>
            <View style={{ width: "30%" }}><Text style={styles.tdText}></Text></View>
            <View style={{ width: "25%" }}><Text style={styles.tdText}></Text></View>
            <View style={{ width: "15%" }}><Text style={styles.tdText}></Text></View>
          </View>
        ))}
      </View>

      {/* SECTION E: Bank Details */}
      <Text style={styles.sectionHeader}>Section E: Bank Details (Debit Order Instruction)</Text>
      
      <View style={styles.grid}>
        <View style={styles.col6}>
          <Text style={styles.fieldLabel}>Account Holder Name</Text>
          <View style={styles.fieldBox} />
        </View>
        <View style={styles.col6}>
          <Text style={styles.fieldLabel}>Bank Name</Text>
          <View style={styles.fieldBox} />
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.col6}>
          <Text style={styles.fieldLabel}>Account Number</Text>
          <View style={styles.fieldBox} />
        </View>
        <View style={styles.col6}>
          <Text style={styles.fieldLabel}>Branch Code (6 Digits)</Text>
          <View style={styles.fieldBox} />
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.col6}>
          <Text style={styles.fieldLabel}>Account Type</Text>
          <View style={{ flexDirection: "row", marginTop: 4 }}>
            <View style={styles.checkboxContainer}>
              <View style={styles.checkbox} />
              <Text style={styles.checkboxLabel}>Savings</Text>
            </View>
            <View style={styles.checkboxContainer}>
              <View style={styles.checkbox} />
              <Text style={styles.checkboxLabel}>Cheque/Current</Text>
            </View>
            <View style={styles.checkboxContainer}>
              <View style={styles.checkbox} />
              <Text style={styles.checkboxLabel}>Transmission</Text>
            </View>
          </View>
        </View>
        <View style={styles.col6}>
          <Text style={styles.fieldLabel}>Preferred Debit Day of Month</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
            <View style={styles.checkboxContainer}>
              <View style={styles.checkbox} />
              <Text style={styles.checkboxLabel}>1st</Text>
            </View>
            <View style={styles.checkboxContainer}>
              <View style={styles.checkbox} />
              <Text style={styles.checkboxLabel}>15th</Text>
            </View>
            <View style={styles.checkboxContainer}>
              <View style={styles.checkbox} />
              <Text style={styles.checkboxLabel}>25th</Text>
            </View>
            <View style={styles.checkboxContainer}>
              <View style={styles.checkbox} />
              <Text style={styles.checkboxLabel}>Last Day</Text>
            </View>
            <Text style={{ fontSize: 7, color: "#64748b", marginTop: 4 }}>Other Day (1-31): ___</Text>
          </View>
        </View>
      </View>

      {/* SECTION F: Authority and Mandate */}
      <Text style={styles.sectionHeader}>Section F: Declarations and Authorizations</Text>
      
      <Text style={styles.fieldLabel}>Authority and Mandate for Payment Instructions</Text>
      <Text style={styles.legalText}>
        I, the undersigned, hereby authorize Liyana Finance (Pty) Ltd to draw against my bank account indicated above, the monthly premiums due under this policy. I understand that the premium will be drawn on the selected preferred debit day of each month. This authority will remain in force until cancelled by me in writing with a notice period of at least 30 days. I agree that Liyana Finance will not be held liable for any bank charges resulting from insufficient funds in my account.
      </Text>

      <View style={{ flexDirection: "row", marginBottom: 6 }}>
        <View style={styles.checkbox} />
        <Text style={{ ...styles.checkboxLabel, width: "95%" }}>
          I hereby accept the Terms and Conditions of the Funeral Policy, and warrant that all information provided in this form is true, correct, and complete.
        </Text>
      </View>
      <View style={{ flexDirection: "row", marginBottom: 6 }}>
        <View style={styles.checkbox} />
        <Text style={{ ...styles.checkboxLabel, width: "95%" }}>
          I consent to Liyana Finance processing my personal data and the data of my dependents for the purposes of administering this policy, in accordance with the Protection of Personal Information Act (POPIA).
        </Text>
      </View>

      {/* SECTION G: Signatures */}
      <Text style={styles.sectionHeader}>Section G: Signatures & Sign-off</Text>
      
      <View style={styles.signatureContainer}>
        <View style={styles.signatureBox}>
          <Text style={styles.fieldLabel}>Applicant Signature</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.fieldLabel}>Print Name: ____________________________</Text>
          <Text style={styles.fieldLabel}>Date (YYYY-MM-DD): ___________________</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.fieldLabel}>Liyana Consultant Signature</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.fieldLabel}>Print Name: ____________________________</Text>
          <Text style={styles.fieldLabel}>Date (YYYY-MM-DD): ___________________</Text>
        </View>
      </View>

      <Text style={{ fontSize: 7, color: "#94a3b8", textAlign: "right", marginTop: 15 }}>Page 2 of 2</Text>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Liyana Finance (Pty) Ltd is an Authorised Financial Services Provider.</Text>
        <Text style={styles.footerText}>Version 1.0 (Printable)</Text>
      </View>
    </Page>
  </Document>
);

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response("Unauthorized: Authentication required", { status: 401 });
    }

    // Check if user has admin or editor role
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile) {
      return new Response("Forbidden: User profile not found", { status: 404 });
    }

    if (userProfile.role !== "admin" && userProfile.role !== "editor") {
      return new Response("Forbidden: Admin or editor privileges required", { status: 403 });
    }

    // Render PDF to stream
    const pdfStream = await renderToStream(<FuneralBlankFormPDF />);

    // Return PDF stream with headers to view inline in browser
    return new NextResponse(pdfStream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=\"funeral-policy-blank-form.pdf\"",
      },
    });
  } catch (error: any) {
    console.error("Error generating blank funeral form PDF:", error);
    return new Response(`Error generating PDF: ${error.message || error}`, {
      status: 500,
    });
  }
}
