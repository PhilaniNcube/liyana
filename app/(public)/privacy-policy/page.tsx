import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Liyana Finance",
  description: "Our commitment to protecting your personal information in accordance with the Protection of Personal Information Act (POPI).",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-ZA', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Liyana Finance (Pty) Ltd ("we", "us", "our", or "Liyana Finance") is committed to protecting and respecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you visit our 
                website, use our services, or interact with us in any capacity.
              </p>
              <p className="text-gray-700 leading-relaxed">
                This policy is designed to comply with the Protection of Personal Information Act, 2013 (Act No. 4 of 2013) ("POPI Act") 
                and other applicable South African privacy laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may collect the following types of personal information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Identity information: Full name, ID number, date of birth, nationality</li>
                <li>Contact information: Physical address, postal address, email address, telephone numbers</li>
                <li>Financial information: Bank account details, income information, credit history, employment details</li>
                <li>Loan application data: Purpose of loan, collateral information, financial statements</li>
                <li>Technical information: IP address, browser type, device information, cookies</li>
                <li>Usage data: How you interact with our website and services</li>
                <li>Marketing preferences and communication history</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">2.2 Special Personal Information</h3>
              <p className="text-gray-700 leading-relaxed">
                We may process special personal information as defined in the POPI Act, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Financial information for credit assessment purposes</li>
                <li>Criminal records checks where required by law</li>
                <li>Biometric data for identity verification (if applicable)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Collect Information</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Directly from you when you apply for our services</li>
                <li>Through our website, mobile applications, and online forms</li>
                <li>From third-party credit bureaus and verification services</li>
                <li>From your bank or financial institution (with your consent)</li>
                <li>Through cookies and similar tracking technologies</li>
                <li>From public records and databases</li>
                <li>From our business partners and affiliates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Purpose of Processing</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We process your personal information for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Processing loan applications and providing financial services</li>
                <li>Conducting credit assessments and risk analysis</li>
                <li>Verifying your identity and preventing fraud</li>
                <li>Complying with legal and regulatory requirements</li>
                <li>Communicating with you about our services</li>
                <li>Marketing our products and services (with your consent)</li>
                <li>Improving our website and services</li>
                <li>Maintaining accurate records and accounts</li>
                <li>Collecting outstanding debts</li>
                <li>Protecting our legitimate business interests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Legal Basis for Processing</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We process your personal information based on:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Consent:</strong> Where you have given explicit consent</li>
                <li><strong>Contractual necessity:</strong> To perform our obligations under loan agreements</li>
                <li><strong>Legal compliance:</strong> To comply with regulatory requirements (FICA, NCA, etc.)</li>
                <li><strong>Legitimate interests:</strong> For fraud prevention and business operations</li>
                <li><strong>Vital interests:</strong> To protect life or physical safety</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may share your personal information with:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Credit bureaus for credit assessment and reporting</li>
                <li>Regulatory authorities as required by law</li>
                <li>Service providers and business partners who assist us</li>
                <li>Legal advisors and auditors</li>
                <li>Debt collection agencies (if necessary)</li>
                <li>Law enforcement agencies when legally required</li>
                <li>Other financial institutions for verification purposes</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We ensure all third parties are contractually bound to protect your information and comply with applicable privacy laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication systems</li>
                <li>Staff training on data protection</li>
                <li>Secure data centers and backup systems</li>
                <li>Incident response procedures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes for which it was collected, 
                comply with legal obligations, resolve disputes, and enforce our agreements. Specific retention periods include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
                <li>Loan records: 5 years after final payment or account closure</li>
                <li>Credit assessment data: As required by credit bureau regulations</li>
                <li>FICA records: 5 years after termination of business relationship</li>
                <li>Marketing data: Until you withdraw consent</li>
                <li>Website usage data: 2 years from collection</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Under the POPI Act, you have the following rights:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Right to access:</strong> Request copies of your personal information</li>
                <li><strong>Right to rectification:</strong> Request correction of inaccurate information</li>
                <li><strong>Right to erasure:</strong> Request deletion of your personal information</li>
                <li><strong>Right to object:</strong> Object to processing for direct marketing</li>
                <li><strong>Right to restrict processing:</strong> Limit how we use your information</li>
                <li><strong>Right to data portability:</strong> Receive your data in a portable format</li>
                <li><strong>Right to withdraw consent:</strong> Withdraw consent at any time</li>
                <li><strong>Right to complain:</strong> Lodge a complaint with the Information Regulator</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 leading-relaxed">
                We use cookies and similar technologies to improve your experience on our website. For detailed information 
                about our use of cookies, please see our separate Cookie Policy and use our Cookie Preference Center to 
                manage your preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. International Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                We may transfer your personal information outside of South Africa for processing by our service providers. 
                When we do so, we ensure appropriate safeguards are in place to protect your information in accordance with 
                the POPI Act.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal 
                information from children under 18. If you believe we have collected information from a child under 18, 
                please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Updates to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting 
                the new policy on our website and updating the "Last updated" date. Your continued use of our services after 
                any changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Information Officer:</strong> Philani Ncube</p>
                  <p><strong>Company:</strong> Liyana Finance (Pty) Ltd</p>
                  <p><strong>Email:</strong> hello@liyanafinance.co.za</p>
                  <p><strong>Phone:</strong> 012 004 0889</p>
                  <p><strong>Address:</strong> 9 Athlone Street, Port Elizabeth</p>
                </div>
                <p className="text-gray-700 leading-relaxed mt-4">
                  You may also contact the Information Regulator of South Africa:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Website:</strong> www.justice.gov.za/inforeg</p>
                  <p><strong>Email:</strong> inforeg@justice.gov.za</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}