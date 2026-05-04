"use client";

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Terms of Use</h1>
          <p className="text-slate-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Document Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mt-0">Document Information</h2>
            <ul className="text-slate-600 space-y-2 mb-0">
              <li><strong>Product:</strong> Hoscover</li>
              <li><strong>Company:</strong> Jurya Technologies Limited</li>
              <li><strong>Contact:</strong> info@juryatechnologies.com</li>
              <li><strong>Jurisdiction:</strong> Uganda</li>
              <li><strong>Governing Law:</strong> Uganda Data Protection and Privacy Act, 2019</li>
            </ul>
          </div>

          {/* Section 1: Introduction */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduction</h2>
            <p className="text-slate-700 mb-4">
              {`Hoscover is a B2B SaaS platform owned and operated by Jurya Technologies Limited, a company incorporated in Uganda ("Jurya," "we," "us," or "our").`}
            </p>
            <p className="text-slate-700 mb-4">
              {`By creating an account, accessing the Platform, or using any of our Services, your business ("Customer," "you," or "your") agrees to be bound by these Terms of Use ("Terms"). If you are accepting on behalf of a business, you confirm that you are duly authorized to do so and that your business will be bound by these Terms.`}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-900 font-semibold mb-0">
                These Terms constitute a legally binding agreement. If you do not agree to these Terms in their entirety, you must not access or use the Platform.
              </p>
            </div>
          </section>

          {/* Section 2: Definitions */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Definitions</h2>
            <dl className="space-y-4">
              <div>
                <dt className="font-semibold text-slate-900">Platform</dt>
                <dd className="text-slate-700">The Hoscover software platform, including all associated dashboards, APIs, tools, and interfaces made available by Jurya Technologies Limited.</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Customer</dt>
                <dd className="text-slate-700">The hotel business, owner, or manager that has registered for and uses the Platform under a paid or trial subscription.</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">End User / Guest</dt>
                <dd className="text-slate-700">Any hotel guest or third party whose data is collected, processed, or communicated with via the Platform by the Customer.</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Services</dt>
                <dd className="text-slate-700">All features, functions, automations, and capabilities made available through the Platform, as updated from time to time.</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Third-Party Services</dt>
                <dd className="text-slate-700">External platforms integrated into or relied upon by the Platform, including WhatsApp (operated by Meta Platforms, Inc.), cloud hosting infrastructure, payment processors, and AI service providers.</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Subscription</dt>
                <dd className="text-slate-700">A paid plan granting the Customer access to the Services for a defined billing period.</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Content</dt>
                <dd className="text-slate-700">All data, messages, files, information, and materials uploaded to or transmitted through the Platform by the Customer or its End Users.</dd>
              </div>
            </dl>
          </section>

          {/* Section 3: Eligibility & Registration */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Eligibility & Account Registration</h2>
            <p className="text-slate-700 mb-4">
              The Platform is designed exclusively for business use. Specifically, it is available to hotels, guesthouses, lodges, and similar hospitality businesses. Individual consumers may not register for or use the Platform.
            </p>
            <p className="text-slate-700 mb-4">
              To register, you must: (a) be a legally constituted business or be acting as an authorized representative of one; (b) provide accurate, complete, and current business information during registration; (c) be of legal age and have the legal authority to enter into binding contracts on behalf of your business.
            </p>
            <p className="text-slate-700 mb-4">
              You are solely responsible for maintaining the confidentiality of your account credentials. You must immediately notify us at info@juryatechnologies.com if you suspect unauthorized access to your account. Jurya is not liable for any loss or damage arising from unauthorized use of your account where you have failed to maintain adequate security.
            </p>
            <p className="text-slate-700 mb-4">
              We reserve the right to refuse registration or terminate accounts at our discretion, including where we reasonably suspect that information provided is false, misleading, or in violation of these Terms.
            </p>
          </section>

          {/* Section 4: Description of Services */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Description of Services</h2>
            <p className="text-slate-700 mb-4">
              Hoscover provides hotels with a WhatsApp-based guest communication and automation platform.
            </p>
            <p className="text-slate-700 mb-4">
              The scope and features of the Services may vary by subscription tier. We may modify, add to, or remove features from the Platform at any time. Where a change materially reduces functionality, we will provide reasonable notice.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">Key Features:</h3>
            <ul className="space-y-3 text-slate-700">
              <li><strong>Guest Messaging:</strong> Automated and manual WhatsApp messaging between the hotel and its guests, including pre-arrival, in-stay, and post-stay communication.</li>
              <li><strong>Automation Tools:</strong> Configurable workflows and message sequences that trigger based on booking events, guest actions, or hotel-defined schedules.</li>
              <li><strong>Revenue Support Tools:</strong> Upsell prompts, promotional messaging, and service-request handling designed to increase hotel revenue.</li>
              <li><strong>Dashboard & Reporting:</strong> A management interface providing visibility into guest conversations, automation performance, and usage analytics.</li>
            </ul>
          </section>

          {/* Section 5: Subscription, Pricing & Payment Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Subscription, Pricing & Payment Terms</h2>
            <p className="text-slate-700 mb-4">
              Access to the Platform requires a paid monthly Subscription. Pricing varies by hotel size and selected tier. We reserve the right to update pricing with at least 30 days&apos; written notice before any change takes effect.
            </p>
            <p className="text-slate-700 mb-4">
              All payments are due in advance at the start of each billing period. We accept payment by credit card or debit card. By providing your payment details, you authorize Jurya to charge the applicable fees on a recurring basis.
            </p>
            <p className="text-slate-700 mb-4">
              Subscriptions renew automatically at the end of each billing period unless cancelled by you prior to the renewal date.
            </p>
            <p className="text-slate-700 mb-4">
              If a payment fails, we will attempt to retry the charge. If payment remains outstanding for more than 3 days after the initial failure, we reserve the right to suspend your access to the Platform without further notice until the outstanding balance is settled.
            </p>
            <p className="text-slate-700 mb-4">
              All fees are exclusive of applicable taxes. You are solely responsible for any taxes, levies, or duties applicable to your Subscription. You are also responsible for all costs imposed by Third-Party Services, including WhatsApp Business API messaging fees and any AI service charges.
            </p>
          </section>

          {/* Section 6: Free Trial */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Free Trial</h2>
            <p className="text-slate-700 mb-4">
              We may offer a 7-day free trial to new Customers. The trial provides access to a defined set of Platform features and is subject to these Terms in full.
            </p>
            <p className="text-slate-700 mb-4">
              The trial begins on the date your account is activated and ends automatically after 7 days unless you have provided payment details and converted to a paid Subscription.
            </p>
            <p className="text-slate-700 mb-4">
              Jurya may terminate or modify any free trial at any time and for any reason, with or without notice.
            </p>
            <p className="text-slate-700 mb-4">
              Upon expiry of the trial, access to the Platform will be suspended unless you have subscribed to a paid plan.
            </p>
            <p className="text-slate-700 mb-4">
              Jurya is not liable to you for any losses arising from trial termination or modification.
            </p>
          </section>

          {/* Section 7: Refund Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Refund Policy</h2>
            <p className="text-slate-700 mb-4">
              A refund may be requested within 7 days of your first payment only. This window applies once per Customer.
            </p>
            <p className="text-slate-700 mb-4">
              Refunds cover only the unused portion of the first billing period, calculated on a pro-rata basis.
            </p>
            <p className="text-slate-700 mb-4">
              No refund will be issued if you have actively used the Platform during the billing period, regardless of volume. Active use includes any messaging sent, automation triggered, or dashboard accessed.
            </p>
            <p className="text-slate-700 mb-4">
              All payments made after the first billing period are final and non-refundable.
            </p>
            <p className="text-slate-700 mb-4">
              To request a refund, contact us at info@juryatechnologies.com within the eligible window. Approved refunds will be processed within 10 business days to your original payment method.
            </p>
          </section>

          {/* Section 8: Third-Party Services */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Third-Party Services</h2>
            <p className="text-slate-700 mb-4">
              The Platform operates in conjunction with Third-Party Services, including WhatsApp (Meta Platforms, Inc.), cloud hosting infrastructure, payment processors, and AI service providers. Your use of the Platform is contingent on the continued availability and terms of these Third-Party Services.
            </p>
            <p className="text-slate-700 mb-4">
              Jurya does not own, operate, or control any Third-Party Services.
            </p>
            <p className="text-slate-700 mb-4">
              By using the Platform, you agree to comply with all applicable Third-Party Service terms, including the WhatsApp Business Policy and Meta&apos; Acceptable Use Policy.
            </p>
            <p className="text-slate-700 mb-4">
              All fees charged by Third-Party Services are your sole responsibility. Jurya may provide estimates of such costs but does not guarantee them.
            </p>
            <p className="text-slate-700 mb-4">
              Jurya is not liable for: outage, degradation, restriction, or discontinuation of a Third-Party Service; changes to Third-Party Service terms, policies, or pricing; suspension or ban of WhatsApp Business Account by Meta or any platform; message delivery failures caused by Third-Party Services; or failure of AI services to produce accurate, appropriate, or timely outputs.
            </p>
          </section>

          {/* Section 9: Data Protection & Roles */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Data Protection & Roles</h2>
            <p className="text-slate-700 mb-4">
              Under the Uganda Data Protection and Privacy Act, 2019, the following data roles apply:
            </p>
            <ul className="space-y-3 text-slate-700 mb-4">
              <li><strong>Customer:</strong> Data Controller for all guest and End User personal data collected, processed, or transmitted through the Platform</li>
              <li><strong>Jurya Technologies Limited:</strong> Data Processor for guest and End User personal data, processing solely on Customer&apos; documented instructions to deliver the Services</li>
              <li><strong>Jurya Technologies Limited:</strong> Independent Data Controller for account data, billing information, and platform analytics collected for operating the Platform and the business relationship</li>
            </ul>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">Your Responsibilities:</h3>
            <ul className="space-y-2 text-slate-700">
              <li>Obtain all necessary and valid consents from guests before collecting or processing personal data through the Platform</li>
              <li>Ensure all messaging — including marketing — is lawful under the Uganda Data Protection and Privacy Act, 2019</li>
              <li>Ensure personal data of minors is handled in compliance with applicable law, including parental/guardian consent where required</li>
              <li>Provide adequate privacy notices to guests</li>
            </ul>
            <p className="text-slate-700 mt-4">
              Jurya does not verify the lawfulness of data collected or the validity of consents obtained by the Customer. Liability for unlawful data collection or processing rests entirely with the Customer as Data Controller.
            </p>
          </section>

          {/* Section 10: Acceptable Use Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Acceptable Use Policy</h2>
            <p className="text-slate-700 mb-4">
              You may use the Platform only for lawful, legitimate hotel business purposes.
            </p>
            <p className="text-slate-700 mb-4">
              We reserve the right to monitor use of the Platform to the extent permitted by law and to suspend or terminate accounts that violate this Acceptable Use Policy, without prior notice where necessary to prevent harm or risk.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">Prohibited Actions:</h3>
            <ul className="space-y-2 text-slate-700">
              <li>Send unsolicited bulk messages, spam, or messages to recipients who have not consented</li>
              <li>Transmit illegal, defamatory, harassing, threatening, or fraudulent content</li>
              <li>Engage in any activity that violates applicable law or Third-Party Service terms</li>
              <li>Harvest, scrape, or misuse guest or third-party data beyond legitimate hotel operations</li>
              <li>Impersonate any person, business, or entity</li>
              <li>Attempt to gain unauthorized access to any part of the Platform or other Customers&apos; accounts</li>
              <li>Place excessive or disproportionate load on the infrastructure</li>
              <li>Resell, sublicense, or provide access to the Platform to third parties without written consent</li>
            </ul>
          </section>

          {/* Section 11: Service Availability & Support */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Service Availability & Support</h2>
            <p className="text-slate-700 mb-4">
              We aim to maintain high Platform availability but do not guarantee uninterrupted, error-free service.
            </p>
            <p className="text-slate-700 mb-4">
              We may take the Platform offline for maintenance at any time. Where possible, we will provide advance notice of planned maintenance.
            </p>
            <p className="text-slate-700 mb-4">
              We target a response time of 24 business hours. Response times are targets only and are not guaranteed service levels.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">Support Channels:</h3>
            <ul className="space-y-2 text-slate-700">
              <li><strong>Email:</strong> info@juryatechnologies.com</li>
              <li><strong>WhatsApp:</strong> Available on website</li>
              <li><strong>Phone:</strong> Available on website</li>
            </ul>
          </section>

          {/* Section 12: Suspension & Termination */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Suspension & Termination</h2>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">Suspension Triggers:</h3>
            <ul className="space-y-2 text-slate-700 mb-4">
              <li>Payment outstanding for more than 3 days following a failed charge</li>
              <li>Breach of Acceptable Use Policy or any material term of these Terms</li>
              <li>Use of Platform creates legal, reputational, or operational risk to Jurya or any Third-Party Service</li>
              <li>Required by law, court order, or regulatory direction</li>
            </ul>
            <p className="text-slate-700 mb-4">
              Jurya may terminate your account with 30 days&#39; notice, or immediately if there is a material breach or risk of harm. You may terminate your Subscription at any time via your account dashboard or email, with termination effective at the end of your current billing period. No refund will be issued upon cancellation.
            </p>
            <p className="text-slate-700 mb-4">
              Access ceases immediately upon termination date. Your data is handled per Sections 13 and 14.
            </p>
          </section>

          {/* Section 13: Data Retention & Deletion */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">13. Data Retention & Deletion</h2>
            <p className="text-slate-700 mb-4">
              Your data — including guest conversation records, automation logs, and account information — is retained throughout your active Subscription and any period during which your account is suspended.
            </p>
            <p className="text-slate-700 mb-4">
              If your account remains suspended or terminated without reinstatement for a continuous period of 6 months, Jurya will permanently delete your data from its systems, unless retention is required by applicable law.
            </p>
            <p className="text-slate-700 mb-4">
              We are not responsible for any loss of data that results from deletion in accordance with this policy.
            </p>
          </section>

          {/* Section 14: Data Export */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">14. Data Export</h2>
            <p className="text-slate-700 mb-4">
              Upon termination of your Subscription, you may request an export of your data in CSV format.
            </p>
            <p className="text-slate-700 mb-4">
              Export requests must be submitted within 14 days of the termination date by contacting us at info@juryatechnologies.com.
            </p>
            <p className="text-slate-700 mb-4">
              Jurya will use reasonable efforts to process your export request within 14 days of receipt. A processing fee may apply for large or complex data exports.
            </p>
            <p className="text-slate-700 mb-4">
              Export requests received after the 14-day window cannot be guaranteed, and Jurya is not obligated to fulfill late requests.
            </p>
          </section>

          {/* Section 15: Intellectual Property */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">15. Intellectual Property</h2>
            <p className="text-slate-700 mb-4">
              The Platform, including all software, code, interfaces, designs, trademarks, documentation, and underlying technology, is the exclusive intellectual property of Jurya Technologies Limited. All rights are reserved.
            </p>
            <p className="text-slate-700 mb-4">
              Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Platform solely for your internal hotel business operations during your active Subscription.
            </p>
            <p className="text-slate-700 mb-4">
              You retain ownership of all Content you upload or transmit through the Platform. By using the Platform, you grant Jurya a limited, royalty-free license to process your Content solely as necessary to deliver the Services.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">Prohibited Actions:</h3>
            <ul className="space-y-2 text-slate-700">
              <li>Copy, reproduce, distribute, or create derivative works from the Platform</li>
              <li>Reverse engineer, decompile, or extract source code</li>
              <li>Resell, sublicense, or commercialize access to the Platform</li>
              <li>Remove or alter proprietary notices or branding</li>
            </ul>
          </section>

          {/* Section 16: Limitation of Liability */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">16. Limitation of Liability</h2>
            <p className="text-slate-700 mb-4">
              To the fullest extent permitted by applicable law, Jurya shall not be liable for any indirect, incidental, consequential, special, or punitive damages, including loss of profits, revenue, data, business, or goodwill.
            </p>
            <p className="text-slate-700 mb-4">
              Jurya&apos; total aggregate liability shall not exceed the total fees paid in the 3 months immediately preceding the event giving rise to the claim.
            </p>
            <p className="text-slate-700 mb-4">
              Nothing in these Terms limits liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law.
            </p>
            <p className="text-slate-700 mb-4">
              Jurya is not liable for: failure or delay in message delivery through WhatsApp or any Third-Party Service; outages, bans, policy changes, or restrictions imposed by Meta or any third party; accuracy, completeness, or appropriateness of AI service outputs; loss arising from Customer&apos;s failure to comply with applicable law; or loss from unauthorized account access where Customer failed to maintain adequate security.
            </p>
          </section>

          {/* Section 17: Marketing & Brand Use */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">17. Marketing & Brand Use</h2>
            <p className="text-slate-700 mb-4">
              By entering into a Subscription, you grant Jurya Technologies Limited a non-exclusive, royalty-free license to display your hotel&apos;s name and logo on our website, marketing materials, and investor presentations as a customer reference.
            </p>
            <p className="text-slate-700 mb-4">
              We will use your branding in a manner that does not misrepresent your business or its relationship with Hoscover.
            </p>
            <p className="text-slate-700 mb-4">
              If you wish to opt out, notify us in writing at info@juryatechnologies.com and we will honor the request within 14 days.
            </p>
          </section>

          {/* Section 18: Governing Law & Jurisdiction */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">18. Governing Law & Jurisdiction</h2>
            <p className="text-slate-700 mb-4">
              These Terms are governed by and construed in accordance with the laws of the Republic of Uganda.
            </p>
            <p className="text-slate-700 mb-4">
              Any dispute, controversy, or claim arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Kampala, Uganda.
            </p>
            <p className="text-slate-700 mb-4">
              Both parties agree to attempt to resolve any dispute in good faith through direct negotiation before commencing formal legal proceedings.
            </p>
          </section>

          {/* Section 19: Miscellaneous */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">19. Miscellaneous</h2>

            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">Entire Agreement</h3>
            <p className="text-slate-700 mb-4">
              These Terms, together with any order confirmation, pricing agreement, or data processing addendum, constitute the entire agreement between you and Jurya with respect to the Platform and supersede all prior representations, discussions, and agreements.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">Severability</h3>
            <p className="text-slate-700 mb-4">
              If any provision of these Terms is found to be invalid, unlawful, or unenforceable, that provision shall be modified to the minimum extent necessary to make it enforceable, or severed if modification is not possible. The remaining provisions shall continue in full force and effect.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">Updates to Terms</h3>
            <p className="text-slate-700 mb-4">
              We may update these Terms from time to time. Material changes will be notified via email or in-platform notice at least 14 days before taking effect. Continued use after the effective date constitutes acceptance of revised Terms.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">Electronic Acceptance</h3>
            <p className="text-slate-700 mb-4">
              Clicking &apos;I agree,&apos; ticking a checkbox, or proceeding through registration constitutes a valid, binding, and enforceable acceptance of these Terms, equivalent to a written signature under applicable law.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">No Waiver</h3>
            <p className="text-slate-700 mb-4">
              Our failure to enforce any provision of these Terms shall not be construed as a waiver of our right to do so in the future.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3">Contact Information</h3>
            <p className="text-slate-700 mb-0">
              <strong>Jurya Technologies Limited</strong><br />
              Kampala, Uganda<br />
              Email: info@juryatechnologies.com
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
