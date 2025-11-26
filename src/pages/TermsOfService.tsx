import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/dateUtils";

export default function TermsOfService() {
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
            <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
            <p className="text-slate-300">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Content */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                By accessing and using ParkFlow's smart parking management system, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. Description of Service</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                ParkFlow provides a comprehensive smart parking management platform that includes:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>Real-time parking space monitoring and analytics</li>
                <li>Role-based access control for contractors, attendants, and administrators</li>
                <li>Multi-location parking management capabilities</li>
                <li>Vehicle tracking and payment processing</li>
                <li>Reporting and dashboard functionalities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. User Accounts and Responsibilities</h2>
              <div className="space-y-4 text-slate-600">
                <p>
                  <strong>Account Creation:</strong> You must provide accurate and complete information when creating your account. You are responsible for maintaining the confidentiality of your account credentials.
                </p>
                <p>
                  <strong>Role-Based Access:</strong> Access to different features is determined by your assigned role (Contractor, Attendant, or Super Admin). You may only access features appropriate to your role.
                </p>
                <p>
                  <strong>Prohibited Activities:</strong> You agree not to:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Attempt to gain unauthorized access to other users' accounts or system areas</li>
                  <li>Use the service for any illegal or unauthorized purpose</li>
                  <li>Interfere with or disrupt the service or servers connected to the service</li>
                  <li>Share your account credentials with others</li>
                  <li>Manipulate or falsify parking data or reports</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. Data and Privacy</h2>
              <p className="text-slate-600 leading-relaxed">
                Your use of ParkFlow is also governed by our Privacy Policy. We collect and process data necessary for providing parking management services, including vehicle information, payment data, and usage analytics. We implement appropriate security measures to protect your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">5. Payment Terms</h2>
              <div className="space-y-4 text-slate-600">
                <p>
                  <strong>Service Fees:</strong> ParkFlow may charge fees for premium features or usage beyond certain limits. All fees are clearly displayed before purchase.
                </p>
                <p>
                  <strong>Payment Processing:</strong> We use secure third-party payment processors. You are responsible for all charges incurred under your account.
                </p>
                <p>
                  <strong>Refunds:</strong> Refund policies are determined on a case-by-case basis and must be requested within 30 days of the original transaction.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">6. Service Availability</h2>
              <p className="text-slate-600 leading-relaxed">
                While we strive to maintain high service availability, ParkFlow is provided "as is" and we do not guarantee uninterrupted access. We may perform maintenance, updates, or modifications that temporarily affect service availability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">7. Limitation of Liability</h2>
              <p className="text-slate-600 leading-relaxed">
                ParkFlow shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">8. Termination</h2>
              <p className="text-slate-600 leading-relaxed">
                We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">9. Changes to Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the service. Your continued use of the service after such modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">10. Contact Information</h2>
              <p className="text-slate-600 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-700">
                  <strong>Email:</strong> legal@parkflow.com<br />
                  <strong>Address:</strong> ParkFlow Legal Department<br />
                  123 Smart Parking Ave, Tech City, TC 12345
                </p>
              </div>
            </section>

            <div className="pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-500 text-center">
                These Terms of Service are effective as of {formatDate(new Date())} and will remain in effect except with respect to any changes in their provisions in the future.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
