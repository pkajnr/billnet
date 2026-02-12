import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-light tracking-tight mb-4">
          Privacy Policy
        </h1>
        <p className="text-gray-400 font-light mb-12">
          Last updated: January 2024
        </p>

        <div className="space-y-12">
          {/* Section 1 */}
          <div className="border-t border-yellow-600/30 pt-12">
            <h2 className="text-2xl text-yellow-500 font-light tracking-widest uppercase mb-6">
              1. Information Collection
            </h2>
            <p className="text-gray-300 font-light leading-relaxed mb-4">
              We collect information you provide directly, such as when you create an account, complete your profile, or communicate with us. This includes name, email address, phone number, and investment preferences.
            </p>
            <p className="text-gray-300 font-light leading-relaxed">
              We also automatically collect certain information about your device and how you use our platform, including IP address, browser type, pages visited, and time spent on pages.
            </p>
          </div>

          {/* Section 2 */}
          <div className="border-t border-yellow-600/30 pt-12">
            <h2 className="text-2xl text-yellow-500 font-light tracking-widest uppercase mb-6">
              2. Use of Your Information
            </h2>
            <p className="text-gray-300 font-light leading-relaxed mb-6">
              We use the information we collect to:
            </p>
            <ul className="text-gray-300 font-light space-y-3 ml-6 mb-4">
              <li>• Provide and maintain our services</li>
              <li>• Process your transactions and send related information</li>
              <li>• Notify you of changes to our services</li>
              <li>• Provide customer support and respond to your inquiries</li>
              <li>• Improve and optimize our platform</li>
              <li>• Monitor usage and prevent fraud</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="border-t border-yellow-600/30 pt-12">
            <h2 className="text-2xl text-yellow-500 font-light tracking-widest uppercase mb-6">
              3. Data Security
            </h2>
            <p className="text-gray-300 font-light leading-relaxed mb-4">
              The security of your personal data is important to us. We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            <p className="text-gray-300 font-light leading-relaxed">
              However, please note that no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your data.
            </p>
          </div>

          {/* Section 4 */}
          <div className="border-t border-yellow-600/30 pt-12">
            <h2 className="text-2xl text-yellow-500 font-light tracking-widest uppercase mb-6">
              4. Sharing Your Information
            </h2>
            <p className="text-gray-300 font-light leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:
            </p>
            <ul className="text-gray-300 font-light space-y-3 ml-6">
              <li>• With your consent or at your direction</li>
              <li>• With service providers who assist us in operating our platform</li>
              <li>• To comply with legal obligations</li>
              <li>• To protect our rights and the rights of our users</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="border-t border-yellow-600/30 pt-12">
            <h2 className="text-2xl text-yellow-500 font-light tracking-widest uppercase mb-6">
              5. Your Rights
            </h2>
            <p className="text-gray-300 font-light leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="text-gray-300 font-light space-y-3 ml-6">
              <li>• Access your personal information</li>
              <li>• Correct inaccurate data</li>
              <li>• Request deletion of your data</li>
              <li>• Opt-out of marketing communications</li>
              <li>• Withdraw consent at any time</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="border-t border-yellow-600/30 pt-12 pb-12">
            <h2 className="text-2xl text-yellow-500 font-light tracking-widest uppercase mb-6">
              6. Contact Us
            </h2>
            <p className="text-gray-300 font-light leading-relaxed">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at privacy@billnet.com.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="border-t border-yellow-600/30 py-12 text-center">
          <p className="text-gray-400 font-light mb-8">
            Questions about your privacy?
          </p>
          <Link
            to="/signin"
            className="border border-yellow-600 text-yellow-500 hover:bg-yellow-600/10 px-8 py-3 font-light tracking-widest uppercase text-sm transition duration-300 inline-block"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
