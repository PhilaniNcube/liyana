import { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Eye, Lock, FileText, Phone, Mail, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Funeral Policy Privacy Policy | Liyana Finance",
  description: "Learn how we handle, process, and protect your personal information for funeral policy applications in compliance with the POPI Act.",
};

export default function FuneralPrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/insurance/funeral" className="hover:text-blue-600 transition-colors">Funeral Insurance</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 font-medium">Privacy Policy</span>
        </nav>

        {/* Premium Page Header */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white rounded-2xl p-8 md:p-10 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="h-3.5 w-3.5" /> Privacy Protection
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Funeral Policy Privacy Policy
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
              We are committed to protecting your personal information and respecting your privacy in strict compliance with the Protection of Personal Information Act (POPI Act).
            </p>
            <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
              Covers applications processed by <strong className="text-white">Liyana Finance (Pty) Ltd</strong> and underwritten by <strong className="text-white">Clientèle Life Assurance Company Limited</strong>.
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="space-y-8">
          {/* Section 1: Introduction */}
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              1. Information Collection and Consent
            </h2>
            <div className="text-slate-600 text-sm space-y-4 leading-relaxed">
              <p>
                When you apply for a Lifewize Funeral Policy via Liyana Finance, we collect and process personal information necessary to assess your application, establish your cover, collect premiums, and process future claims.
              </p>
              <p>
                By completing the application form, signing the mandate, and accepting these terms, you provide consent for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>
                  <strong>Clientèle Life Assurance Company Limited</strong> (the underwriter) to verify your identity and check your details against sanction or crime watch lists, as required by South African law.
                </li>
                <li>
                  Liyana Finance and the underwriter to share relevant personal and banking details with processing banks to enable premium collection via monthly debit order.
                </li>
                <li>
                  The processing of beneficiary and dependant information exclusively for policy administration and claims purposes.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2: Sharing with Third Parties */}
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-600" />
              2. Data Protection and Security
            </h2>
            <div className="text-slate-600 text-sm space-y-4 leading-relaxed">
              <p>
                We employ industry-standard electronic, physical, and administrative security measures to protect your personal and banking information.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Encryption:</strong> All digital signature data, banking details, and uploaded South African ID copies are transmitted securely and stored encrypted.</li>
                <li><strong>Access Control:</strong> Only authorized staff involved in underwriting, client service, and compliance have access to your personal details.</li>
                <li><strong>Underwriter Audits:</strong> Clientèle Life implements rigorous compliance and auditing standards to guarantee that your data is safe and handled in terms of the law.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Legal Disclosures */}
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-700" />
              3. Regulatory Compliance &amp; Sanctions
            </h2>
            <div className="text-slate-600 text-sm space-y-3 leading-relaxed">
              <p>
                In terms of anti-money laundering and financial intelligence laws, we and Clientèle Life are legally obligated to check client details against local and international sanction lists.
              </p>
              <p className="bg-red-50 text-red-950 border border-red-100 rounded-xl p-4 text-xs">
                <strong>Important Warning:</strong> If your name appears on any sanction or crime watch list, Clientèle Life is required by law to cancel your application or policy immediately and report the occurrence to the appropriate regulatory and legal bodies.
              </p>
            </div>
          </section>

          {/* Section 4: Contact & Information Officer */}
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Phone className="h-5 w-5 text-indigo-600" />
              4. Contact Information
            </h2>
            <div className="text-slate-600 text-sm space-y-4">
              <p>
                If you have questions about how your data is handled or wish to exercise your rights to access or update your information under the POPI Act, please contact our Compliance Officer:
              </p>
              
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900">Liyana Finance Compliance</h4>
                  <p className="text-xs flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> hello@liyanafinance.co.za</p>
                  <p className="text-xs flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" /> 012 004 0889</p>
                  <p className="text-xs flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /> 9 Athlone Street, Port Elizabeth</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900">Lifewize Compliance</h4>
                  <p className="text-xs flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> admin@lifewize.co.za</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Liyana Finance (Pty) Ltd. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
