import { decryptValue } from "@/lib/encryption";
import { createClient } from "@/lib/server";
import { Database } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format-currency";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  renderToStream,
} from "@react-pdf/renderer";
import { NextResponse } from "next/server";

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 15,
    marginBottom: 5,
    fontWeight: "bold",
    borderBottom: "1pt solid black",
    paddingBottom: 2,
  },
  section: {
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    fontSize: 10,
    width: "40%",
    fontWeight: "bold",
  },
  value: {
    fontSize: 10,
    width: "60%",
  },
  quoteTable: {
    border: "1pt solid black",
    marginTop: 10,
  },
  quoteHeader: {
    backgroundColor: "#EEEEEE",
    flexDirection: "row",
    borderBottom: "1pt solid black",
  },
  quoteRow: {
    flexDirection: "row",
    borderBottom: "1pt solid black",
  },
  quoteCellLabel: {
    fontSize: 9,
    padding: 5,
    width: "30%",
    fontWeight: "bold",
  },
  quoteCellValue: {
    fontSize: 9,
    padding: 5,
    width: "20%",
    borderLeft: "1pt solid black",
  },
  quoteCellTotal: {
    fontSize: 9,
    padding: 5,
    width: "50%",
    borderLeft: "1pt solid black",
    fontWeight: "bold",
  },
});

const LoanAgreementPDF = ({
  loan,
  application,
  profile,
}: {
  loan: Database["public"]["Tables"]["approved_loans"]["Row"];
  application: Database["public"]["Tables"]["applications"]["Row"];
  profile: Database["public"]["Tables"]["profiles"]["Row"];
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>
        PRE-AGREEMENT STATEMENT & QUOTATION FOR SMALL CREDIT AGREEMENTS
      </Text>
      <Text style={{ ...styles.title, fontSize: 10, marginBottom: 20 }}>
        IN TERMS OF SECTION 92 OF THE NATIONAL CREDIT ACT 34 OF 2005
      </Text>

      {/* Credit Provider Details */}
      <Text style={styles.subtitle}>DETAIL OF CREDIT PROVIDER</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Registered Name:</Text>
          <Text style={styles.value}>Liyana Finance (PTY) Ltd</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Company Reg. No:</Text>
          <Text style={styles.value}>2023/790223/07</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Physical Address:</Text>
          <Text style={styles.value}>1.Hunter Street, None</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>NCR Reg. No:</Text>
          <Text style={styles.value}>NCRCP18217</Text>
        </View>
      </View>

      {/* Borrower Details */}
      <Text style={styles.subtitle}>DETAIL OF BORROWER</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Full Names:</Text>
          <Text style={styles.value}>{profile.full_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Identity Number:</Text>
          <Text style={styles.value}>
            {decryptValue(profile.id_number!)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Name of Employer:</Text>
          <Text style={styles.value}>
            {application.employer_name}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Residential Address:</Text>
          <Text style={styles.value}>
            {application.employer_address}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Contact Number (SMS):</Text>
          <Text style={styles.value}>{application.phone_number}</Text>
        </View>
      </View>

      {/* Financial Quote (Transaction Detail and Cost Elements) */}
      <Text style={styles.subtitle}>
        QUOTE - TRANSACTION DETAIL AND COST ELEMENTS
      </Text>
      <View style={styles.quoteTable}>
        {/* Loan Details Column */}
        <View style={styles.quoteRow}>
          <Text style={styles.quoteCellLabel}>
            a) Loan Amount (Paid out to client):
          </Text>
          <Text style={styles.quoteCellValue}>
            {formatCurrency(loan.approved_loan_amount!)}
          </Text>
          <Text style={styles.quoteCellTotal}>
            g) MONTHLY INTEREST RATE: {loan.interest_rate}%
          </Text>
        </View>

        <View style={styles.quoteRow}>
          <Text style={styles.quoteCellLabel}>
            c) Total Loan Amount ((a)+(b)):
          </Text>
          <Text style={styles.quoteCellValue}>
            {formatCurrency(loan.approved_loan_amount!)}
          </Text>
          <Text style={styles.quoteCellTotal}>
            h) PAYMENT SCHEDULE DETAILS:
          </Text>
        </View>

        <View style={styles.quoteRow}>
          <Text style={styles.quoteCellLabel}>
            d) Total Cost of Credit (TCC (e.1-e.5)):
          </Text>
          <Text style={styles.quoteCellValue}>R148.60</Text>
          <View style={{ ...styles.quoteCellTotal, flexDirection: "column" }}>
            <Text style={{ fontSize: 9 }}>
              Date 1st payment: {loan.next_payment_date}
            </Text>
            <Text style={{ fontSize: 9 }}>
              Final Payback Date: {loan.next_payment_date}
            </Text>
          </View>
        </View>

        {/* Cost of Credit Details */}
        <View style={styles.quoteHeader}>
          <Text style={styles.quoteCellLabel}>e) CHARGES OF CREDIT:</Text>
          <Text style={styles.quoteCellValue}></Text>
          <Text style={{ ...styles.quoteCellTotal, borderLeft: "1pt solid black" }}>
            Number of Instalments: 1
          </Text>
        </View>

        <View style={styles.quoteRow}>
          <Text style={styles.quoteCellLabel}>e.2) Initiation Fee:</Text>
          <Text style={styles.quoteCellValue}>
            {formatCurrency(loan.initiation_fee!)}
          </Text>
          <Text style={styles.quoteCellTotal}>
            Instalment Amount: {formatCurrency(loan.total_repayment_amount)}
          </Text>
        </View>
        <View style={styles.quoteRow}>
          <Text style={styles.quoteCellLabel}>
            e.3) Total Monthly Service Fees:
          </Text>
          <Text style={styles.quoteCellValue}>
            {formatCurrency(loan.service_fee)}
          </Text>
          <Text style={styles.quoteCellTotal}>
            i) NCR Total Cost of Credit:{" "}
            {formatCurrency(loan.total_repayment_amount)}
          </Text>
        </View>
        <View style={styles.quoteRow}>
          <Text style={styles.quoteCellLabel}>e.4) Interest Charges:</Text>
          <Text style={styles.quoteCellValue}>
            {formatCurrency(loan.interest_rate * loan.approved_loan_amount! / 100)}
          </Text>
          <Text style={styles.quoteCellTotal}></Text>
        </View>
        <View style={{ ...styles.quoteRow, borderBottom: 0 }}>
          <Text style={{ ...styles.quoteCellLabel, fontWeight: "normal" }}>
            TOTAL AMOUNT REPAYABLE ((c)+(d)):
          </Text>
          <Text style={{ ...styles.quoteCellValue, fontWeight: "bold" }}>
            {formatCurrency(loan.total_repayment_amount)}
          </Text>
          <Text style={styles.quoteCellTotal}></Text>
        </View>
      </View>

      {/* Acceptance and Signatures */}
      <Text style={styles.subtitle}>ACCEPTANCE AND AGREEMENT</Text>
      <View style={styles.section}>
        <Text style={styles.value}>
          I, the BORROWER, hereby accept the above quote on the
          conditions and terms of the loan agreement.
        </Text>
        <Text style={{ ...styles.value, marginTop: 10 }}>
          Signed at None on this {new Date().getDate()}th day of {new Date().toLocaleDateString('en-US', { month: 'long' })} {new Date().getFullYear()}
        </Text>
        <View style={{ ...styles.row, marginTop: 15 }}>
          <Text style={styles.label}>BORROWER'S SIGNATURE:</Text>
          <Text style={styles.value}>Signed by: {profile.full_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>CREDIT PROVIDER'S SIGNATURE:</Text>
          <Text style={styles.value}>
            (Signed by/on behalf of CREDIT PROVIDER: LIYANA FINANCE)
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 8, marginTop: 30, textAlign: "center" }} fixed>
        Page 1 of 1
      </Text>
    </Page>
  </Document>
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("approved_loans")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !data) {
    return new Response(`Error fetching loan: ${error.message}`, {
      status: 500,
    });
  }

  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", Number(data.application_id))
    .single();

  if (applicationError || !application) {
    return new Response(
      `Error fetching application: ${applicationError.message}`,
      {
        status: 500,
      }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", application.user_id)
    .single();

    if (profileError || !profile) {
    return new Response(
      `Error fetching profile: ${profileError.message}`,
      {
        status: 500,
      }
    );
  }


    const pdfStream = await renderToStream(<LoanAgreementPDF loan={data} application={application} profile={profile} />);

  return new NextResponse(pdfStream as unknown as ReadableStream);
}
