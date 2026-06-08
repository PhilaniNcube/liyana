import { Metadata } from "next";
import Link from "next/link";
import { FileText, ShieldAlert, Clock, HelpCircle, Phone, Globe, Mail, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Funeral Policy Terms & Conditions | Liyana Finance",
  description: "Official general terms and conditions for the Liyana Funeral Policy underwritten by Clientèle Life Assurance Company Limited.",
};

export default function FuneralTermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/insurance/funeral" className="hover:text-blue-600 transition-colors">Funeral Insurance</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 font-medium">Terms & Conditions</span>
        </nav>

        {/* Premium Page Header */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white rounded-2xl p-8 md:p-10 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <FileText className="h-3.5 w-3.5" /> Policy Document
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Funeral Policy General Terms &amp; Conditions
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
              Please read these terms and conditions carefully. They contain important information about your cover, benefits, waiting periods, and the claims process.
            </p>
            <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
              Underwritten in terms of the Long-Term Insurance Act 2017 by <strong className="text-white">Clientèle Life Assurance Company Limited</strong>, a licensed life insurer and an authorised Financial Services Provider, FSP NO. 15268.
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="space-y-8">
          
          {/* Section 1: Terms and Conditions */}
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-sm font-bold">1</span>
              General Terms &amp; Conditions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900">Voluntary Benefit</h4>
                  <p className="mt-1">This is a voluntary funeral benefit.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Maximum Cover Limit</h4>
                  <p className="mt-1">No insured life may have cover exceeding R30,000.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Premiums &amp; Waiting Period Start</h4>
                  <p className="mt-1">
                    Premiums are payable monthly in advance. The waiting period starts after the first premium is received. The policy entry date will be on the 1st of the month in which the first premium is received, provided it is received before the 10th of that specific month; otherwise, the entry date and waiting period will begin the following month.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Entry &amp; Cessation Age Limits</h4>
                  <p className="mt-1">
                    Minimum entry age for the Principal Insured is 18 years. Maximum entry age for the Principal Insured &amp; Spouse is 84 years. There is no cessation age.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Extended Family</h4>
                  <p className="mt-1 text-amber-700 bg-amber-50/50 border border-amber-100 rounded-lg p-2.5">
                    Extended family members do not enjoy cover under this policy.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900">Children / Dependant Limits</h4>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Maximum number of children is 5 (biological or legally adopted).</li>
                    <li>Maximum age of children included as dependants is under 21 years.</li>
                    <li>Maximum age of children is extended to under 25 years with proof of full-time study.</li>
                    <li>A stillborn child is included if the pregnancy is 26 weeks or more.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Territory of Cover</h4>
                  <p className="mt-1">Benefits will only be paid, or services delivered, within the borders of the Republic of South Africa (RSA).</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Nomination of Beneficiaries</h4>
                  <p className="mt-1">Beneficiaries will be specified on the Member Application form or Claim form.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Spouse Definition</h4>
                  <p className="mt-1">
                    Legal or common-law spouse or life partner of the Principal Insured, or a person residing with the Principal Insured for longer than 6 calendar months who is normally regarded by the community as the Principal Insured's husband/wife and nominated at the entry date or added in writing. Benefits will only be paid to the nominated beneficiary.
                  </p>
                  <p className="mt-2 text-amber-700 bg-amber-50/50 border border-amber-100 rounded-lg p-2.5">
                    <strong>Important:</strong> Single member cover does not include spouse cover. Spouse cover is only available on family plans.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 text-sm text-slate-600 space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900">Cancellation &amp; Reinstatement</h4>
                <p className="mt-1">
                  A policy will be cancelled after the non-payment of 1 consecutive premium, once notice of cancellation has been sent to the contact number provided by the Principal Insured. It is the member’s sole responsibility to ensure premiums are paid up to date; Lifewize will not be held liable for claims arising while premiums are unpaid. Reinstatement will require negotiating a new waiting period based on the elapsed time.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900">Termination Notification</h4>
                  <p className="mt-1">Requires 30 days written notification addressed to Lifewize, subject to authentication.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Premium Increase Notification</h4>
                  <p className="mt-1">Lifewize will provide 30 days written notification prior to any premium increase.</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Communication Consent</h4>
                <p className="mt-1">
                  All policy communications will be sent via SMS to the mobile number provided on the application form and will be deemed received upon dispatch. The client must ensure personal information is kept up to date.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-150">
                <div>
                  <h4 className="font-semibold text-slate-900">Missed Premium Limit</h4>
                  <p className="mt-0.5 text-xs">Only 1 missed premium payment is allowed during the lifetime of the policy.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Grace Period</h4>
                  <p className="mt-0.5 text-xs">A grace period of 15 days is allowed, commencing on the 1st day of the month in which the premium is due.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: General Exclusions */}
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <ShieldAlert className="h-5 w-5" />
              </span>
              General Exclusions
            </h2>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              No claim will be admitted in terms of this Scheme if the event giving rise to the claim is caused directly or indirectly by, or is in any way attributable to, any of the following:
            </p>
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                <strong>1. Willing Participation:</strong> The willing participation by the Principal Insured and such other insured persons in any of the following:
              </p>
              <ul className="list-disc pl-8 space-y-1 text-slate-600">
                <li>Any act of war (whether war is declared or not) or military action.</li>
                <li>Riot, insurrection, civil commotion, usurpation of power, or martial law.</li>
                <li>Terrorism or any usage of nuclear, chemical, and biological weapons, devices, or agents.</li>
                <li>Diseases, epidemics, or pandemics.</li>
                <li>Any act deliberately committed in violation of any law. This includes minor children where a parent or legal guardian knowingly allows such participation.</li>
              </ul>
              <p>
                <strong>2. Self-Inflicted Injury:</strong> Self-inflicted injury or self-inflicted illness (whether intended or not), or voluntary exposure to danger or obvious risk of injury.
              </p>
              <p>
                <strong>3. Substance Abuse:</strong> Taking or absorbing, accidentally or otherwise, any drug, medicine, sedative, or poison, except as prescribed by a licensed medical practitioner who is not the Insured.
              </p>
            </div>
          </section>

          {/* Section 3: Waiting Periods */}
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Clock className="h-5 w-5" />
              </span>
              Waiting Periods
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 text-center">
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Suicide</span>
                <span className="block text-xl font-bold text-slate-900 mt-2">12 Months</span>
                <span className="block text-[11px] text-slate-500 mt-1">From entry or reinstatement date</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 text-center">
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Natural / Unnatural</span>
                <span className="block text-xl font-bold text-slate-900 mt-2">6 Months</span>
                <span className="block text-[11px] text-slate-500 mt-1">From entry or reinstatement date</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center">
                <span className="block text-xs font-semibold text-emerald-700 uppercase tracking-wider">Accidental</span>
                <span className="block text-xl font-bold text-emerald-950 mt-2">No Waiting</span>
                <span className="block text-[11px] text-emerald-700 mt-1">Once first premium is received</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center">
                <span className="block text-xs font-semibold text-emerald-700 uppercase tracking-wider">Under 6 Years</span>
                <span className="block text-xl font-bold text-emerald-950 mt-2">No Waiting</span>
                <span className="block text-[11px] text-emerald-700 mt-1">Once first premium is received</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500 text-center">
              *Cover will start immediately after the applicable waiting period has expired, as specified in the Master Policy.
            </p>
          </section>

          {/* Section 4: Claims Process */}
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <HelpCircle className="h-5 w-5" />
              </span>
              Claims Submission Process
            </h2>
            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex gap-4 items-start bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Timeframe &amp; Submission</h4>
                  <p>
                    Claims must be submitted within <strong className="text-slate-950">6 months of the date of death</strong>. No claim will be processed without the relevant claim documentation. Claim documents will only be accepted from the nominated beneficiary.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Required Certified Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-150">
                    <span className="h-5 w-5 flex items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">1</span>
                    Certified Death Certificate
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-150">
                    <span className="h-5 w-5 flex items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">2</span>
                    Certified copy of deceased’s ID
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-150">
                    <span className="h-5 w-5 flex items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">3</span>
                    Police report (if unnatural/accidental death)
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-150">
                    <span className="h-5 w-5 flex items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">4</span>
                    Fully completed claim form
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-150">
                    <span className="h-5 w-5 flex items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">5</span>
                    Copy of Beneficiary ID
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-150">
                    <span className="h-5 w-5 flex items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">6</span>
                    Copy of Principal member's ID
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-150">
                    <span className="h-5 w-5 flex items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">7</span>
                    Any other document required by Lifewize
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p>
                  To submit a claim or for assistance, please email <a href="mailto:claims@lifewize.co.za" className="text-blue-600 underline font-medium hover:text-blue-800">claims@lifewize.co.za</a>.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Complaints & Ombudsman */}
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Phone className="h-5 w-5" />
              </span>
              Complaints &amp; Ombudsman
            </h2>
            <div className="space-y-6 text-sm text-slate-600">
              <p>
                If you have received inadequate information, unsatisfactory service, or have complaints, please first contact Lifewize Compliance Office at: <a href="mailto:admin@lifewize.co.za" className="text-blue-600 underline font-medium hover:text-blue-800">admin@lifewize.co.za</a>.
              </p>
              <p>
                Complaints which remain unresolved can be referred to the National Financial Ombud Scheme South Africa NPC (the NFO) or the Financial Sector Conduct Authority.
              </p>

              {/* Ombudsman Contact Details */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 p-4 border-b border-slate-200 font-semibold text-slate-900 flex items-center gap-2">
                  National Financial Ombud Scheme (NFO) Contact Particulars
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" /> Physical Address
                    </div>
                    <div className="md:col-span-2 text-slate-600 space-y-1">
                      <p><strong>Head Office:</strong> 110 Oxford Road, Houghton Estate, Illovo, Johannesburg, 2198</p>
                      <p><strong>Western Cape Office:</strong> Claremont Central Building, 6th Floor, 6 Vineyard Road, Claremont, 7708</p>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-slate-400" /> Website
                    </div>
                    <div className="md:col-span-2">
                      <a href="https://www.ombud.co.za" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                        www.ombud.co.za
                      </a>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" /> E-mail
                    </div>
                    <div className="md:col-span-2">
                      <a href="mailto:info@nfosa.co.za" className="text-blue-600 underline hover:text-blue-800">
                        info@nfosa.co.za
                      </a>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" /> Telephone
                    </div>
                    <div className="md:col-span-2 text-slate-900 font-semibold">
                      0860 800 900
                    </div>
                  </div>
                </div>
              </div>

              {/* Repudiation Representation Timeline */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 text-amber-950 space-y-2 text-xs">
                <p className="font-semibold text-slate-900 uppercase tracking-wider text-[10px]">Important Notice Regarding Repudiations</p>
                <p className="leading-relaxed">
                  In the event that the Insurer repudiates liability for any claim under this Policy, the claimant shall have <strong className="text-slate-900">90 (ninety) days</strong> from the date of notice of the repudiation within which to make representations to the Insurer disputing the repudiation.
                </p>
                <p className="leading-relaxed">
                  If the claimant concerned does not commence legal proceedings in a competent court and prosecute such proceedings to final judgement within <strong className="text-slate-900">3 (three) years</strong> after the expiry of the 90-day representation period, any liability of the Insurer shall be extinguished and no benefits shall be payable in respect of such claim.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Declaration */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">Declaration for Cover &amp; Benefits</h2>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed space-y-4">
              I herewith apply for cover under the Lifewize Policy, in accordance with the Terms and Conditions. I declare the information provided is true and correct. I understand that any false, incorrect information or misstatement in this application may invalidate any claim or benefit under the policy, and I undertake to abide by the Terms and Conditions of the policy.
            </p>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed mt-3">
              By accepting these terms &amp; conditions, I give Clientèle Life Assurance Company Limited permission to use my information to check whether it appears on any sanction/crime watch lists, as required by law, and to inform the relevant legal bodies if it does appear on any sanction/watch lists. I understand that, in terms of the law, Clientèle Life Assurance Company Limited has to cancel this policy or application for benefits immediately if I am on any sanction lists.
            </p>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed mt-3">
              I confirm that I was provided with the relevant information and disclosures regarding the products/services in arriving at my own decision on the benefits or services selected. I understand that the Representative may only provide me with information relating to the product benefits, restrictions, and limitations, and that none of the information furnished may be construed as advice. I understand that I have the right to request additional information or clarity regarding any of the information provided.
            </p>
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
