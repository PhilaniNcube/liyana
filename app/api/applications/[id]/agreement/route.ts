import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createClient } from '@/lib/server';
import { decryptValue } from '@/lib/encryption';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const applicationId = (await params).id;
  const supabase = await createClient();

  // First check if there's an approved loan for this application
  const { data: approvedLoan, error: approvedLoanError } = await supabase
    .from('approved_loans')
    .select('*')
    .eq('application_id', Number(applicationId))
    .single();

  if (approvedLoanError || !approvedLoan) {
    return new NextResponse('Approved loan not found for this application', { status: 404 });
  }

  // Get the application details
  const { data: application, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', Number(applicationId))
    .single();

  if (error || !application) {
    return new NextResponse('Application not found', { status: 404 });
  }

  // get the profile details
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', application.user_id)
    .single();

  if (profileError || !profile) {
    return new NextResponse('Profile not found', { status: 404 });
  } 

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;

  let yPos = height - 40;

  const drawText = (text: string, x: number) => {
    page.drawText(text, {
      x,
      y: yPos,
      font,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    yPos -= 20;
  };

  drawText('PayDay Loan - Pre-Agreement Statement And Quotation', 50);
  yPos -= 20; // Add extra space

  drawText(`Application ID: ${application.id}`, 50);
  drawText(`Date: ${new Date().toLocaleDateString()}`, 50);
  yPos -= 20;

  drawText('Personal Information', 50);
  drawText(`Name: ${profile.full_name}`, 70);
  drawText(`Phone Number: ${profile.phone_number}`, 70);
  drawText(`Email: ${profile.email}`, 70);
  drawText(`ID Number: ${decryptValue(application.id_number)}`, 70);
  drawText(`Address: ${application.home_address}`, 70);
  drawText(`City: ${application.city}`, 70);
  drawText(`Postal Code: ${application.postal_code}`, 70);
  yPos -= 20;

  drawText('Loan Details', 50);
  drawText(`Loan Amount: R${approvedLoan.approved_loan_amount || 0}`, 70);
  drawText(`Repayment Period: ${approvedLoan.loan_term_days} days`, 70);
  drawText(`Interest Rate: ${approvedLoan.interest_rate}%`, 70);
  const loanAmount = approvedLoan.approved_loan_amount || 0;
  const totalRepayment = approvedLoan.total_repayment_amount;
  drawText(`Total Repayment: R${totalRepayment}`, 70);
  drawText(`Monthly Payment: R${approvedLoan.monthly_payment}`, 70);
  if (approvedLoan.next_payment_date) {
    drawText(`Next Payment Date: ${new Date(approvedLoan.next_payment_date).toLocaleDateString()}`, 70);
  }
  drawText(`Total Repayment: R${totalRepayment}`, 70);
  yPos -= 20;

  drawText('Terms and Conditions', 50);
  drawText('1. The borrower agrees to repay the loan in full within the specified term.', 70);
  drawText('2. A late payment fee will be applied to any overdue payments.', 70);
  drawText('3. The borrower has the right to settle the loan early at any time.', 70);


  const pdfBytes = await pdfDoc.save();

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="pre-agreement-${applicationId}.pdf"`,
    },
  });
}
