import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="text-white hover:text-blue-300 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
            <p className="text-slate-300">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Content */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. Introduction</h2>
              <p className="text-slate-600 leading-relaxed">
                ParkFlow ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our smart parking management platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. Information We Collect</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-3">Personal Information</h3>
                  <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                    <li><strong>Account Information:</strong> Name, email address, phone number, role designation</li>
                    <li><strong>Vehicle Information:</strong> License plate numbers, vehicle type, entry/exit times</li>
                    <li><strong>Payment Information:</strong> Billing details, payment methods (processed securely through third-party providers)</li>
                    <li><strong>Location Data:</strong> Parking location coordinates, facility information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-3">Usage Information</h3>
                  <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                    <li>System access logs and timestamps</li>
                    <li>Feature usage patterns and preferences</li>
                    <li>Device information and browser type</li>
                    <li>IP addresses and geolocation data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-3">Parking Analytics Data</h3>
                  <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                    <li>Occupancy rates and parking duration statistics</li>
                    <li>Revenue and transaction data</li>
                    <li>System performance metrics</li>
                    <li>User behavior patterns (anonymized)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. How We Use Your Information</h2>
              <div className="space-y-4 text-slate-600">
                <p><strong>Service Provision:</strong> To provide and maintain our parking management services, process transactions, and manage user accounts.</p>
                <p><strong>Communication:</strong> To send service-related notifications, updates, and respond to your inquiries.</p>
                <p><strong>Analytics:</strong> To analyze usage patterns, improve our services, and generate parking management reports.</p>
                <p><strong>Security:</strong> To monitor for fraudulent activity, ensure system security, and prevent unauthorized access.</p>
                <p><strong>Compliance:</strong> To comply with legal obligations and regulatory requirements.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. Information Sharing and Disclosure</h2>
              <div className="space-y-4 text-slate-600">
                <p>We do not sell, trade, or rent your personal information to third parties. We may share information in the following circumstances:</p>
                
                <div className="ml-4 space-y-3">
                  <p><strong>Service Providers:</strong> With trusted third-party vendors who assist in operating our platform (payment processors, cloud hosting providers, analytics services).</p>
                  <p><strong>Business Partners:</strong> With parking facility owners and operators as necessary to provide services.</p>
                  <p><strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights and safety.</p>
                  <p><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</p>
                  <p><strong>Consent:</strong> When you have given explicit consent for specific sharing purposes.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">5. Data Security</h2>
              <div className="space-y-4 text-slate-600">
                <p>We implement comprehensive security measures to protect your information:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>End-to-end encryption for data transmission</li>
                  <li>Secure data storage with access controls</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Multi-factor authentication for administrative access</li>
                  <li>Employee training on data protection best practices</li>
                  <li>Incident response procedures for data breaches</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">6. Data Retention</h2>
              <p className="text-slate-600 leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. Parking transaction data is typically retained for 7 years for accounting and legal compliance purposes. Account information is retained until you request deletion or close your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">7. Your Rights and Choices</h2>
              <div className="space-y-4 text-slate-600">
                <p>Depending on your location, you may have the following rights regarding your personal information:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong>Access:</strong> Request access to your personal information we hold</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                  <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
                  <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                </ul>
                <p className="mt-4">To exercise these rights, please contact us at privacy@parkflow.com</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">8. Cookies and Tracking Technologies</h2>
              <p className="text-slate-600 leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and improve our services. You can control cookie preferences through your browser settings, though some features may not function properly if cookies are disabled.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">9. International Data Transfers</h2>
              <p className="text-slate-600 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">10. Children's Privacy</h2>
              <p className="text-slate-600 leading-relaxed">
                Our services are not intended for individuals under 16 years of age. We do not knowingly collect personal information from children under 16. If we become aware that we have collected such information, we will take steps to delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-slate-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our website and updating the "Last updated" date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">12. Contact Us</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-700">
                  <strong>Privacy Officer:</strong> privacy@parkflow.com<br />
                  <strong>General Inquiries:</strong> support@parkflow.com<br />
                  <strong>Address:</strong> ParkFlow Privacy Department<br />
                  123 Smart Parking Ave, Tech City, TC 12345<br />
                  <strong>Phone:</strong> +1 (555) 123-PARK
                </p>
              </div>
            </section>

            <div className="pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-500 text-center">
                This Privacy Policy is effective as of {new Date().toLocaleDateString()} and will remain in effect except with respect to any changes in its provisions in the future.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
