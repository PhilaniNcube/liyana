import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createClient } from '@/lib/server';
import { decryptValue } from '@/lib/encryption';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const loanId = (await params).id;
  const supabase = await createClient();

  // Get the approved loan by its ID
  const { data: approvedLoan, error: approvedLoanError } = await supabase
    .from('approved_loans')
    .select('*')
    .eq('id', Number(loanId))
    .single();

  if (approvedLoanError || !approvedLoan) {
    return new NextResponse('Approved loan not found', { status: 404 });
  }

  // Get the application details using the application_id from the approved loan
  const { data: application, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', approvedLoan.application_id)
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
  
  // PAGE 1
  const page1 = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page1.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 10;
  const titleFontSize = 14;
  const sectionFontSize = 12;

  let yPos = height - 40;

  const drawTextPage1 = (text: string, x: number, size: number = fontSize, fontType = font, bold = false) => {
    page1.drawText(text, {
      x,
      y: yPos,
      font: bold ? boldFont : fontType,
      size,
      color: rgb(0, 0, 0),
    });
    yPos -= (size + 4);
  };

  const drawLinePage1 = (text: string, value: string, x: number, size: number = fontSize) => {
    const combinedText = `${text}: ${value}`;
    page1.drawText(combinedText, {
      x,
      y: yPos,
      font,
      size,
      color: rgb(0, 0, 0),
    });
    yPos -= (size + 4);
  };

  const addSpacePage1 = (space: number = 10) => {
    yPos -= space;
  };

  // Header
  drawTextPage1('SHORT-TERM CREDIT AGREEMENT', 50, titleFontSize, boldFont, true);
  drawTextPage1('Issued in terms of the National Credit Act, 34 of 2005', 50, fontSize);
  addSpacePage1(15);

  // 1. PARTIES TO THE AGREEMENT
  drawTextPage1('1. PARTIES TO THE AGREEMENT', 50, sectionFontSize, boldFont, true);
  addSpacePage1(5);
  drawTextPage1('This Short-Term Credit Agreement is made and entered into between:', 70);
  addSpacePage1(10);
  
  drawTextPage1('Credit Provider:', 70, fontSize, boldFont, true);
  drawLinePage1('Credit Provider', 'Liyana Financial Services (Pty) Ltd', 70);
  drawLinePage1('Registration Number', '[TO BE FILLED]', 70);
  drawLinePage1('NCR Registration Number', '[TO BE FILLED]', 70);
  drawLinePage1('Physical Address', '[TO BE FILLED]', 70);
  drawLinePage1('Contact Details', '[TO BE FILLED]', 70);
  addSpacePage1(10);
  
  drawTextPage1('And', 70);
  addSpacePage1(5);
  drawTextPage1('Consumer:', 70, fontSize, boldFont, true);
  drawLinePage1('Consumer', profile.full_name || '', 70);
  drawLinePage1('ID/Passport Number', decryptValue(application.id_number), 70);
  const fullAddress = `${application.home_address}, ${application.city}, ${application.postal_code}`;
  drawLinePage1('Physical Address', fullAddress, 70);
  drawLinePage1('Contact Details', `${profile.phone_number} / ${profile.email}`, 70);
  addSpacePage1(15);

  // 2. LOAN TERMS
  drawTextPage1('2. LOAN TERMS', 50, sectionFontSize, boldFont, true);
  addSpacePage1(5);
  const loanAmount = approvedLoan.approved_loan_amount || 0;
  const totalRepayment = approvedLoan.total_repayment_amount || 0;
  const loanTermMonths = Math.ceil(approvedLoan.loan_term_days / 30);
  
  drawLinePage1('Loan Amount', `R ${loanAmount.toFixed(2)}`, 70);
  drawLinePage1('Loan Term', `${loanTermMonths} Months/${approvedLoan.loan_term_days} Days`, 70);
  drawLinePage1('Interest Rate', `${approvedLoan.interest_rate}% per annum (as per NCA regulations)`, 70);
  drawLinePage1('Initiation Fee', `R ${approvedLoan.initiation_fee.toFixed(2)} (as per NCA regulations)`, 70);
  drawLinePage1('Service Fee', `R ${approvedLoan.service_fee.toFixed(2)} per month (as per NCA regulations)`, 70);
  drawLinePage1('Credit Life Insurance', 'R 0.00 per month', 70);
  drawLinePage1('Total Repayment Amount', `R ${totalRepayment.toFixed(2)}`, 70);
  drawLinePage1('Monthly Instalment', `R ${approvedLoan.monthly_payment.toFixed(2)}`, 70);
  const firstPaymentDate = approvedLoan.next_payment_date ? new Date(approvedLoan.next_payment_date).toLocaleDateString() : 'TBD';
  drawLinePage1('First Payment Due Date', firstPaymentDate, 70);
  drawLinePage1('Payment Frequency', 'Monthly', 70);
  drawLinePage1('Payment Method', 'Debit Order', 70);
  addSpacePage1(15);

  // 3. CONSUMER OBLIGATIONS (Page 1)
  drawTextPage1('3. CONSUMER OBLIGATIONS', 50, sectionFontSize, boldFont, true);
  addSpacePage1(5);
  
  const obligations = [
    '• The consumer agrees to repay the total loan amount, including interest, fees,',
    '  and any other charges as set out in this agreement.',
    '• Payments must be made on or before the due date.',
    '• The consumer must inform the credit provider of any change in personal or',
    '  financial circumstances that may affect repayment.'
  ];
  
  obligations.forEach(obligation => {
    drawTextPage1(obligation, 70);
  });

  // PAGE 2
  const page2 = pdfDoc.addPage([595, 842]);
  let yPos2 = height - 40;

  const drawTextPage2 = (text: string, x: number, size: number = fontSize, fontType = font, bold = false) => {
    page2.drawText(text, {
      x,
      y: yPos2,
      font: bold ? boldFont : fontType,
      size,
      color: rgb(0, 0, 0),
    });
    yPos2 -= (size + 4);
  };

  const addSpacePage2 = (space: number = 10) => {
    yPos2 -= space;
  };

  // 4. DEFAULT AND CONSEQUENCES
  drawTextPage2('4. DEFAULT AND CONSEQUENCES', 50, sectionFontSize, boldFont, true);
  addSpacePage2(5);
  
  const defaultConsequences = [
    '• If the consumer fails to make payments as agreed, the credit provider may',
    '  charge penalty fees as per the NCA.',
    '• The credit provider reserves the right to take legal action to recover',
    '  outstanding amounts.',
    '• In case of default, the consumer may be listed with credit bureaus,',
    '  affecting their credit score.'
  ];
  
  defaultConsequences.forEach(consequence => {
    drawTextPage2(consequence, 70);
  });
  
  addSpacePage2(15);
  
  // 5. EARLY SETTLEMENT
  drawTextPage2('5. EARLY SETTLEMENT', 50, sectionFontSize, boldFont, true);
  addSpacePage2(5);
  drawTextPage2('The consumer has the right to settle the credit agreement early, with reduced', 70);
  drawTextPage2('interest and fees as per the NCA.', 70);
  addSpacePage2(15);
  
  // 6. DISCLOSURE AND RIGHTS
  drawTextPage2('6. DISCLOSURE AND RIGHTS', 50, sectionFontSize, boldFont, true);
  addSpacePage2(5);
  
  const disclosureRights = [
    '• The total cost of credit includes interest, service fees, initiation fees,',
    '  and credit life insurance.',
    '• The consumer has the right to a detailed statement of account.',
    '• The consumer has the right to a cooling-off period as per the NCA.',
    '• The credit provider confirms that this agreement complies with the',
    '  affordability assessment regulations.'
  ];
  
  disclosureRights.forEach(right => {
    drawTextPage2(right, 70);
  });
  
  addSpacePage2(15);
  
  // 7. CONSUMER CONSENT AND ACCEPTANCE
  drawTextPage2('7. CONSUMER CONSENT AND ACCEPTANCE', 50, sectionFontSize, boldFont, true);
  addSpacePage2(5);
  drawTextPage2('By signing below, the consumer confirms that they have read and understood', 70);
  drawTextPage2('the terms of this agreement and agree to the loan terms provided.', 70);
  addSpacePage2(25);
  
  // Signature lines
  drawTextPage2('Consumer Signature: _______________________________', 70);
  addSpacePage2(25);
  drawTextPage2('Date: _______________________________', 70);
  addSpacePage2(35);
  drawTextPage2('Credit Provider Signature: _______________________________', 70);
  addSpacePage2(25);
  drawTextPage2('Date: _______________________________', 70);
  addSpacePage2(35);
  
  // Separator line
  drawTextPage2('________________________________________', 50);
  addSpacePage2(15);
  
  // Contact information
  drawTextPage2('For any complaints or further clarifications, you may contact the', 70);
  drawTextPage2('National Credit Regulator (NCR) at www.ncr.org.za or 0860 627 627.', 70);

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="credit-agreement-loan-${loanId}.pdf"`,
    },
  });
}
