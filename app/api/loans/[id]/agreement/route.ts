import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createClient } from '@/lib/server';
import { createServiceClient } from '@/lib/service';
import { decryptValue } from '@/lib/encryption';
import { revalidatePath } from 'next/cache';

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
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 10;
  const titleFontSize = 14;
  const sectionFontSize = 12;

  let yPos = height - 40;

  const drawText = (text: string, x: number, size: number = fontSize, fontType = font, bold = false) => {
    page.drawText(text, {
      x,
      y: yPos,
      font: bold ? boldFont : fontType,
      size,
      color: rgb(0, 0, 0),
    });
    yPos -= (size + 4);
  };

  const drawLine = (text: string, value: string, x: number, size: number = fontSize) => {
    const combinedText = `${text}: ${value}`;
    page.drawText(combinedText, {
      x,
      y: yPos,
      font,
      size,
      color: rgb(0, 0, 0),
    });
    yPos -= (size + 4);
  };

  const addSpace = (space: number = 10) => {
    yPos -= space;
  };

  // Header
  drawText('PRE-AGREEMENT STATEMENT AND QUOTATION', 50, titleFontSize, boldFont, true);
  drawText('Issued in terms of Section 92 of the National Credit Act, 34 of 2005', 50, fontSize);
  addSpace(15);

  // 1. CREDIT PROVIDER DETAILS
  drawText('1. CREDIT PROVIDER DETAILS', 50, sectionFontSize, boldFont, true);
  addSpace(5);
  drawLine('Company Name', 'Liyana Financial Services (Pty) Ltd', 70);
  drawLine('Registration Number', '2023/790223/07', 70);
  drawLine('NCR Registration Number', 'NCRCP18217', 70);
  drawLine('Physical Address', '1 Hunter Street | Nelspruit | 1200 | Mpumalanga | South Africa', 70);
  drawLine('Contact Details', '012 004 0889', 70);
  addSpace(15);

  // 2. CONSUMER DETAILS
  drawText('2. CONSUMER DETAILS', 50, sectionFontSize, boldFont, true);
  addSpace(5);
  drawLine('Full Name', profile.full_name || '', 70);
  drawLine('ID/Passport Number', decryptValue(application.id_number), 70);
  const fullAddress = `${application.home_address}, ${application.city}, ${application.postal_code}`;
  drawLine('Physical Address', fullAddress, 70);
  drawLine('Contact Details', `${profile.phone_number} / ${profile.email}`, 70);
  addSpace(15);

  // 3. LOAN DETAILS
  drawText('3. LOAN DETAILS', 50, sectionFontSize, boldFont, true);
  addSpace(5);
  const loanAmount = approvedLoan.approved_loan_amount || 0;
  const totalRepayment = approvedLoan.total_repayment_amount || 0;
  const loanTermMonths = Math.ceil(approvedLoan.loan_term_days / 30);
  const totalCostOfCredit = totalRepayment - loanAmount;
  
  drawLine('Loan Amount', `R ${loanAmount.toFixed(2)}`, 70);
  drawLine('Loan Term', `${loanTermMonths} Months`, 70);
  drawLine('Interest Rate', `${approvedLoan.interest_rate}% per annum (as per the NCA regulations)`, 70);
  drawLine('Initiation Fee', `R ${approvedLoan.initiation_fee.toFixed(2)} (as per the NCA regulations)`, 70);
  drawLine('Service Fee', `R ${approvedLoan.service_fee.toFixed(2)} per month (as per the NCA regulations)`, 70);
  drawLine('Credit Life Insurance', 'R 0.00 per month', 70);
  drawLine('Total Cost of Credit', `R ${totalCostOfCredit.toFixed(2)}`, 70);
  drawLine('Total Repayment Amount', `R ${totalRepayment.toFixed(2)}`, 70);
  drawLine('Monthly Instalment', `R ${approvedLoan.monthly_payment.toFixed(2)}`, 70);
  const firstPaymentDate = approvedLoan.next_payment_date ? new Date(approvedLoan.next_payment_date).toLocaleDateString() : 'TBD';
  drawLine('First Payment Due Date', firstPaymentDate, 70);
  drawLine('Payment Frequency', 'Monthly', 70);
  drawLine('Payment Method', 'Debit Order', 70);
  addSpace(15);

  // Check if we need a new page
  if (yPos < 200) {
    const newPage = pdfDoc.addPage([595, 842]);
    yPos = height - 40;
    
    // 4. DISCLOSURE AND COSTS
    newPage.drawText('4. DISCLOSURE AND COSTS', {
      x: 50,
      y: yPos,
      font: boldFont,
      size: sectionFontSize,
      color: rgb(0, 0, 0),
    });
    yPos -= 20;
    
    const disclosurePoints = [
      '• The total cost of credit includes interest, service fees, initiation fees, and credit life insurance.',
      '• The consumer has the right to decline this quotation and seek alternative credit providers.',
      '• The consumer has the right to receive a detailed statement of account.',
      '• The credit provider confirms that this agreement complies with the affordability assessment',
      '  regulations as per the NCA.',
      '• In case of default, legal and collection costs may be incurred as per the Act.'
    ];
    
    disclosurePoints.forEach(point => {
      newPage.drawText(point, {
        x: 70,
        y: yPos,
        font,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      yPos -= 16;
    });
    
    yPos -= 20;
    
    // 5. CONSUMER CONSENT AND ACCEPTANCE
    newPage.drawText('5. CONSUMER CONSENT AND ACCEPTANCE', {
      x: 50,
      y: yPos,
      font: boldFont,
      size: sectionFontSize,
      color: rgb(0, 0, 0),
    });
    yPos -= 20;
    
    newPage.drawText('By signing below, the consumer confirms that they have read and understood the terms of', {
      x: 70,
      y: yPos,
      font,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    yPos -= 16;
    
    newPage.drawText('this quotation and pre-agreement, and that they accept the terms if they proceed with the credit agreement.', {
      x: 70,
      y: yPos,
      font,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    yPos -= 30;
    
    // Signature lines
    newPage.drawText('Consumer Signature: _______________________________', {
      x: 70,
      y: yPos,
      font,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    yPos -= 30;
    
    newPage.drawText('Date: _______________________________', {
      x: 70,
      y: yPos,
      font,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    yPos -= 40;
    
    newPage.drawText('Credit Provider Signature: _______________________________', {
      x: 70,
      y: yPos,
      font,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    yPos -= 30;
    
    newPage.drawText('Date: _______________________________', {
      x: 70,
      y: yPos,
      font,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    yPos -= 40;
    
    // Separator line
    newPage.drawText('________________________________________', {
      x: 50,
      y: yPos,
      font,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    yPos -= 20;
    
    // Notice to consumer
    newPage.drawText('NOTICE TO THE CONSUMER:', {
      x: 50,
      y: yPos,
      font: boldFont,
      size: sectionFontSize,
      color: rgb(0, 0, 0),
    });
    yPos -= 20;
    
    const noticePoints = [
      '• This document serves as a pre-agreement and quotation and does not constitute a',
      '  legally binding credit agreement until formally signed.',
      '• The consumer has the right to request a full copy of the final credit agreement before signing.',
      '• The consumer has the right to a cooling-off period as per the NCA.',
      '',
      'For any complaints or further clarifications, you may contact the National Credit',
      'Regulator (NCR) at www.ncr.org.za or 0860 627 627.'
    ];
    
    noticePoints.forEach(point => {
      newPage.drawText(point, {
        x: 70,
        y: yPos,
        font,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      yPos -= 16;
    });
  } else {
    // 4. DISCLOSURE AND COSTS (same page)
    drawText('4. DISCLOSURE AND COSTS', 50, sectionFontSize, boldFont, true);
    addSpace(5);
    
    const disclosurePoints = [
      '• The total cost of credit includes interest, service fees, initiation fees, and credit life insurance.',
      '• The consumer has the right to decline this quotation and seek alternative credit providers.',
      '• The consumer has the right to receive a detailed statement of account.',
      '• The credit provider confirms that this agreement complies with the affordability assessment',
      '  regulations as per the NCA.',
      '• In case of default, legal and collection costs may be incurred as per the Act.'
    ];
    
    disclosurePoints.forEach(point => {
      drawText(point, 70);
    });
    
    addSpace(15);
    
    // 5. CONSUMER CONSENT AND ACCEPTANCE
    drawText('5. CONSUMER CONSENT AND ACCEPTANCE', 50, sectionFontSize, boldFont, true);
    addSpace(5);
    drawText('By signing below, the consumer confirms that they have read and understood the terms of', 70);
    drawText('this quotation and pre-agreement, and that they accept the terms if they proceed with the credit agreement.', 70);
    addSpace(20);
    
    // Signature lines
    drawText('Consumer Signature: _______________________________', 70);
    addSpace(20);
    drawText('Date: _______________________________', 70);
    addSpace(30);
    drawText('Credit Provider Signature: _______________________________', 70);
    addSpace(20);
    drawText('Date: _______________________________', 70);
    addSpace(30);
    
    // Separator line
    drawText('________________________________________', 50);
    addSpace(10);
    
    // Notice to consumer
    drawText('NOTICE TO THE CONSUMER:', 50, sectionFontSize, boldFont, true);
    addSpace(10);
    
    const noticePoints = [
      '• This document serves as a pre-agreement and quotation and does not constitute a',
      '  legally binding credit agreement until formally signed.',
      '• The consumer has the right to request a full copy of the final credit agreement before signing.',
      '• The consumer has the right to a cooling-off period as per the NCA.',
      '',
      'For any complaints or further clarifications, you may contact the National Credit',
      'Regulator (NCR) at www.ncr.org.za or 0860 627 627.'
    ];
    
    noticePoints.forEach(point => {
      drawText(point, 70);
    });
  }

  const pdfBytes = await pdfDoc.save();

  // Best-effort async upload & DB record insertion (does not block response)
  (async () => {
    try {
      const service = await createServiceClient();
      const profileId: string = profile.id;
      const timestamp = Date.now();
      const storagePath = `profile-documents/${profileId}/contract-loan-pre-agreement-${loanId}-${timestamp}.pdf`;

      const { error: uploadError } = await service.storage
        .from('documents')
        .upload(storagePath, pdfBytes, {
          contentType: 'application/pdf',
          upsert: false,
        });
      if (uploadError) {
        console.error('[loan-agreement][upload] Failed to upload PDF:', uploadError);
        return;
      }

      const { error: insertError } = await service
        .from('profile_documents')
        .insert({
          profile_id: profileId,
          document_type: 'contract',
          path: storagePath,
        });
      if (insertError) {
        console.error('[loan-agreement][insert] Failed to insert profile_documents record:', insertError);
      }
    } catch (e) {
      console.error('[loan-agreement] Unexpected error during upload/record:', e);
    }
  })();

  revalidatePath(`/dashboard/loans/${loanId}`);

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="pre-agreement-loan-${loanId}.pdf"`,
      'X-Agreement-Uploaded': 'attempted',
    },
  });
}
