import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-light tracking-tight mb-4">
          Terms of Service
        </h1>
        <p className="text-gray-400 font-light mb-12">
          Last updated: January 2024
        </p>

        <div className="space-y-12">
          {/* Section 1 */}
          <div className="border-t border-yellow-600/30 pt-12">
            <h2 className="text-2xl text-yellow-500 font-light tracking-widest uppercase mb-6">
              1. Agreement to Terms
            </h2>
            <p className="text-gray-300 font-light leading-relaxed mb-4">
              By accessing and using the BillNet platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </div>

          {/* Section 2 */}
          <div className="border-t border-yellow-600/30 pt-12">
            <h2 className="text-2xl text-yellow-500 font-light tracking-widest uppercase mb-6">
              2. Use License
            </h2>
            <p className="text-gray-300 font-light leading-relaxed mb-4">
              Permission is granted to temporarily download one copy of the materials (information or software) on BillNet's platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="text-gray-300 font-light space-y-3 ml-6">
              <li>• Modifying or copying the materials</li>
              <li>• Using the materials for any commercial purpose or for any public display</li>
              <li>• Attempting to decompile or reverse engineer any software contained on BillNet</li>
              <li>• Removing any copyright or other proprietary notations from the materials</li>
              <li>• Transferring the materials to another person or "mirroring" the materials on any other server</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="border-t border-yellow-600/30 pt-12">
            <h2 className="text-2xl text-yellow-500 font-light tracking-widest uppercase mb-6">
              3. Disclaimer
            </h2>
            <p className="text-gray-300 font-light leading-relaxed mb-4">
              The materials on BillNet's platform are provided on an 'as is' basis. BillNet makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </div>

          {/* Section 4 */}
          <div className="border-t border-yellow-600/30 pt-12">
            <h2 className="text-2xl text-yellow-500 font-light tracking-widest uppercase mb-6">
              4. Limitations
            </h2>
            <p className="text-gray-300 font-light leading-relaxed">
              In no event shall BillNet or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on BillNet's platform.
            </p>
          </div>

          {/* Section 5 */}
          <div className="border-t border-yellow-600/30 pt-12">
            <h2 className="text-2xl text-yellow-500 font-light tracking-widest uppercase mb-6">
              5. Accuracy of Materials
            </h2>
            <p className="text-gray-300 font-light leading-relaxed mb-4">
              The materials appearing on BillNet's platform could include technical, typographical, or photographic errors. BillNet does not warrant that any of the materials on its platform are accurate, complete, or current. BillNet may make changes to the materials contained on its platform at any time without notice.
            </p>
          </div>

          {/* Section 6 */}
          <div className="border-t border-yellow-600/30 pt-12">
            <h2 className="text-2xl text-yellow-500 font-light tracking-widest uppercase mb-6">
              6. Links
            </h2>
            <p className="text-gray-300 font-light leading-relaxed">
              BillNet has not reviewed all of the sites linked to its platform and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by BillNet of the site. Use of any such linked website is at the user's own risk.
            </p>
          </div>

          {/* Section 7 */}
          <div className="border-t border-yellow-600/30 pt-12 pb-12">
            <h2 className="text-2xl text-yellow-500 font-light tracking-widest uppercase mb-6">
              7. Modifications
            </h2>
            <p className="text-gray-300 font-light leading-relaxed">
              BillNet may revise these terms of service for its platform at any time without notice. By using this platform, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="border-t border-yellow-600/30 py-12 text-center">
          <p className="text-gray-400 font-light mb-8">
            Have questions about our terms?
          </p>
          <Link
            to="/signin"
            className="border border-yellow-600 text-yellow-500 hover:bg-yellow-600/10 px-8 py-3 font-light tracking-widest uppercase text-sm transition duration-300 inline-block"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
