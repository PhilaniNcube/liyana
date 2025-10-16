import { Metadata } from "next";

export const metadata: Metadata = {
  title: "POPI Notice | Liyana Finance",
  description: "Information notice in terms of Section 18 of the Protection of Personal Information Act, 2013.",
};

export default function PopiNoticePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              POPI Act Information Notice
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              In terms of Section 18 of the Protection of Personal Information Act, 2013
            </p>
            <p className="text-lg text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-ZA', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            <section className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
              <h2 className="text-xl font-semibold text-blue-900 mb-3">Important Notice</h2>
              <p className="text-blue-800">
                This notice is provided to inform you about the processing of your personal information by Liyana Finance (Pty) Ltd 
                in compliance with the Protection of Personal Information Act, 2013 (POPI Act). Please read this notice carefully 
                as it affects your rights and obligations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Responsible Party Details</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Company Information</h3>
                    <p className="text-gray-700"><strong>Name:</strong> Liyana Finance (Pty) Ltd</p>
                    <p className="text-gray-700"><strong>Registration No:</strong> [Company Registration Number]</p>
                    <p className="text-gray-700"><strong>NCR Registration:</strong> [NCR Number]</p>
                    <p className="text-gray-700"><strong>FSP License:</strong> [FSP Number]</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Contact Details</h3>
                    <p className="text-gray-700"><strong>Physical Address:</strong><br />[Complete Physical Address]</p>
                    <p className="text-gray-700"><strong>Postal Address:</strong><br />[Complete Postal Address]</p>
                    <p className="text-gray-700"><strong>Email:</strong> info@liyanafinance.co.za</p>
                    <p className="text-gray-700"><strong>Phone:</strong> [Phone Number]</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information Officer Details</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700"><strong>Name:</strong> [Information Officer Name]</p>
                <p className="text-gray-700"><strong>Position:</strong> [Position/Title]</p>
                <p className="text-gray-700"><strong>Email:</strong> privacy@liyanafinance.co.za</p>
                <p className="text-gray-700"><strong>Phone:</strong> [Phone Number]</p>
                <p className="text-gray-700"><strong>Address:</strong> [Physical Address]</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Categories of Personal Information We Process</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">3.1 General Personal Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Identification Information</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Full name and surname</li>
                    <li>Identity number</li>
                    <li>Date of birth</li>
                    <li>Gender</li>
                    <li>Nationality</li>
                    <li>Marital status</li>
                    <li>Passport details (if applicable)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Residential address</li>
                    <li>Postal address</li>
                    <li>Email address</li>
                    <li>Telephone numbers (home, work, mobile)</li>
                    <li>Emergency contact details</li>
                  </ul>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Employment Information</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Employer name and address</li>
                    <li>Job title and description</li>
                    <li>Employment duration</li>
                    <li>Salary and income details</li>
                    <li>Employee number</li>
                    <li>Previous employment history</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Financial Information</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Bank account details</li>
                    <li>Credit history and score</li>
                    <li>Income and expense information</li>
                    <li>Asset and liability details</li>
                    <li>Payment history</li>
                    <li>Insurance information</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-8">3.2 Special Personal Information</h3>
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <p className="text-yellow-800 mb-2">
                  <strong>Note:</strong> We may process the following special personal information categories:
                </p>
                <ul className="list-disc pl-5 text-yellow-800 space-y-1">
                  <li>Financial information for credit assessment purposes</li>
                  <li>Criminal records checks (where legally required)</li>
                  <li>Biometric information for identity verification (fingerprints, voice recognition)</li>
                  <li>Health information (only if relevant to insurance products)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Sources of Personal Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect your personal information from the following sources:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Direct Sources</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Loan application forms</li>
                    <li>Online applications and website interactions</li>
                    <li>Telephone conversations</li>
                    <li>Email correspondence</li>
                    <li>Face-to-face meetings</li>
                    <li>Supporting documents you provide</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Third-Party Sources</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Credit bureaus (Experian, TransUnion, etc.)</li>
                    <li>Employers (for verification purposes)</li>
                    <li>Banks and financial institutions</li>
                    <li>Government databases and registries</li>
                    <li>Identity verification services</li>
                    <li>Fraud prevention services</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Purposes for Processing Personal Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We process your personal information for the following specific purposes:
              </p>
              
              <div className="space-y-6">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Primary Business Purposes</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Processing and evaluating loan applications</li>
                    <li>Conducting credit assessments and affordability checks</li>
                    <li>Providing financial products and services</li>
                    <li>Managing loan accounts and customer relationships</li>
                    <li>Processing payments and collections</li>
                    <li>Customer support and service delivery</li>
                  </ul>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Legal and Regulatory Compliance</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Compliance with the Financial Intelligence Centre Act (FICA)</li>
                    <li>National Credit Act (NCA) requirements</li>
                    <li>Financial Services Conduct Authority (FSCA) regulations</li>
                    <li>Tax administration and reporting</li>
                    <li>Anti-money laundering and fraud prevention</li>
                    <li>Know Your Customer (KYC) procedures</li>
                  </ul>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Business Operations</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Risk management and assessment</li>
                    <li>Product development and improvement</li>
                    <li>Statistical analysis and research</li>
                    <li>System administration and IT security</li>
                    <li>Record keeping and archiving</li>
                    <li>Audit and compliance monitoring</li>
                  </ul>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Marketing and Communication</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Direct marketing of financial products (with consent)</li>
                    <li>Customer satisfaction surveys</li>
                    <li>Newsletter and promotional communications</li>
                    <li>Market research and analysis</li>
                    <li>Website personalization and analytics</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Legal Basis for Processing</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Purpose</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Legal Basis</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Credit assessment and loan processing</td>
                      <td className="border border-gray-300 px-4 py-2">Contractual necessity</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">FICA and NCA compliance</td>
                      <td className="border border-gray-300 px-4 py-2">Legal obligation</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Direct marketing</td>
                      <td className="border border-gray-300 px-4 py-2">Consent</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">Fraud prevention</td>
                      <td className="border border-gray-300 px-4 py-2">Legitimate interest</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Emergency contact</td>
                      <td className="border border-gray-300 px-4 py-2">Vital interest</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Recipients of Personal Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may share your personal information with the following categories of recipients:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Regulatory and Legal</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Financial Intelligence Centre (FIC)</li>
                    <li>National Credit Regulator (NCR)</li>
                    <li>Financial Sector Conduct Authority (FSCA)</li>
                    <li>South African Revenue Service (SARS)</li>
                    <li>Credit bureaus (Experian, TransUnion, XDS)</li>
                    <li>Courts and law enforcement agencies</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Service Providers</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>IT service providers and cloud platforms</li>
                    <li>Payment processors and banks</li>
                    <li>Verification and authentication services</li>
                    <li>Debt collection agencies</li>
                    <li>Legal advisors and auditors</li>
                    <li>Marketing and communication providers</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mt-6">
                <p className="text-blue-800">
                  <strong>Note:</strong> All third parties are contractually bound to protect your personal information 
                  and may only use it for the specific purposes for which it was shared.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cross-Border Information Transfers</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may transfer your personal information outside South Africa to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Cloud service providers in jurisdictions with adequate data protection laws</li>
                <li>International verification and fraud prevention services</li>
                <li>Group companies or business partners in other countries</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                All international transfers are conducted in compliance with Chapter 9 of the POPI Act, 
                ensuring adequate protection through appropriate safeguards.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Your Rights as a Data Subject</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Under the POPI Act, you have the following rights regarding your personal information:
              </p>
              
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">🔍 Right of Access (Section 23)</h4>
                  <p className="text-gray-700">Request confirmation of whether we hold your personal information and access to that information.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">✏️ Right to Correction (Section 24)</h4>
                  <p className="text-gray-700">Request correction or deletion of inaccurate, irrelevant, excessive, or misleading information.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">🚫 Right to Object (Section 11(3))</h4>
                  <p className="text-gray-700">Object to the processing of your personal information for direct marketing purposes.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">🗑️ Right to Erasure</h4>
                  <p className="text-gray-700">Request deletion of your personal information where legally permissible.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">🔒 Right to Restrict Processing</h4>
                  <p className="text-gray-700">Request limitation on how we process your personal information.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">📱 Right to Data Portability</h4>
                  <p className="text-gray-700">Receive your personal information in a structured, commonly used format.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">❌ Right to Withdraw Consent</h4>
                  <p className="text-gray-700">Withdraw your consent for processing where consent is the legal basis.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">📝 Right to Complain</h4>
                  <p className="text-gray-700">Lodge a complaint with the Information Regulator regarding our processing of your information.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. How to Exercise Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To exercise any of your rights, please contact our Information Officer using the details provided in Section 2. 
                Your request should include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Sufficient information to identify you</li>
                <li>Clear description of the right you wish to exercise</li>
                <li>Supporting documentation (if required)</li>
                <li>Preferred method of response</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We will respond to your request within 30 days of receipt. Some requests may require payment of a prescribed fee.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Security Measures</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to secure your personal information, including:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Technical Measures</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Data encryption (in transit and at rest)</li>
                    <li>Secure communication protocols</li>
                    <li>Access controls and authentication</li>
                    <li>Regular security updates and patches</li>
                    <li>Backup and disaster recovery systems</li>
                    <li>Network security and firewalls</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Organizational Measures</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Staff training on data protection</li>
                    <li>Confidentiality agreements</li>
                    <li>Regular security assessments</li>
                    <li>Incident response procedures</li>
                    <li>Data protection impact assessments</li>
                    <li>Third-party security evaluations</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Information Regulator Contact Details</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you are not satisfied with how we handle your personal information, you may lodge a complaint with:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>The Information Regulator (South Africa)</strong></p>
                  <p><strong>Postal Address:</strong><br />
                    P.O. Box 31533<br />
                    Braamfontein<br />
                    Johannesburg, 2017
                  </p>
                  <p><strong>Email:</strong> inforeg@justice.gov.za</p>
                  <p><strong>Website:</strong> www.justice.gov.za/inforeg</p>
                  <p><strong>Complaints Portal:</strong> www.justice.gov.za/inforeg/complaints.html</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Updates to This Notice</h2>
              <p className="text-gray-700 leading-relaxed">
                This notice may be updated from time to time to reflect changes in our processing activities, 
                legal requirements, or business practices. We will notify you of material changes through our 
                website, email, or other appropriate communication channels. The latest version will always be 
                available on our website with the updated date clearly indicated.
              </p>
            </section>

            <section className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
              <h2 className="text-xl font-semibold text-green-900 mb-3">Your Consent</h2>
              <p className="text-green-800">
                By continuing to use our services or by providing us with your personal information, 
                you acknowledge that you have read and understood this POPI Notice and consent to the 
                processing of your personal information as described herein.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}