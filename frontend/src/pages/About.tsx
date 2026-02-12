import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 py-24">
        <h1 className="text-6xl md:text-7xl font-light tracking-tight mb-8">
          About BillNet
        </h1>
        <p className="text-xl text-gray-300 font-light leading-relaxed max-w-2xl">
          Where ideas meet capital. Where visionaries and investors converge to build the next generation of wealth.
        </p>
      </div>

      {/* Mission Section */}
      <div className="border-t border-yellow-600/30 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl text-yellow-500 font-light tracking-widest uppercase mb-8">
            Our Mission
          </h2>
          <p className="text-gray-300 font-light leading-relaxed text-lg mb-6">
            BillNet exists to revolutionize how capital flows to innovation. We believe that the greatest ideas deserve funding, and the most promising investors deserve access to transformative opportunities.
          </p>
          <p className="text-gray-400 font-light leading-relaxed text-lg">
            By connecting visionary entrepreneurs with sophisticated investors, we're building a platform that transcends traditional boundaries and democratizes access to wealth-building opportunities.
          </p>
        </div>
      </div>

      {/* Values Section */}
      <div className="border-t border-yellow-600/30 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl text-yellow-500 font-light tracking-widest uppercase mb-12">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-yellow-500 font-light tracking-widest uppercase text-sm mb-4">
                Excellence
              </h3>
              <p className="text-gray-300 font-light leading-relaxed">
                We maintain the highest standards in everything we do. From vetting opportunities to supporting our members, excellence is non-negotiable.
              </p>
            </div>
            <div>
              <h3 className="text-yellow-500 font-light tracking-widest uppercase text-sm mb-4">
                Integrity
              </h3>
              <p className="text-gray-300 font-light leading-relaxed">
                Trust is the foundation of wealth building. We operate with complete transparency and unwavering ethical standards.
              </p>
            </div>
            <div>
              <h3 className="text-yellow-500 font-light tracking-widest uppercase text-sm mb-4">
                Innovation
              </h3>
              <p className="text-gray-300 font-light leading-relaxed">
                We embrace cutting-edge technology and forward-thinking approaches to stay ahead of market changes and opportunities.
              </p>
            </div>
            <div>
              <h3 className="text-yellow-500 font-light tracking-widest uppercase text-sm mb-4">
                Impact
              </h3>
              <p className="text-gray-300 font-light leading-relaxed">
                Beyond returns, we measure success by the lasting impact we create—building businesses, empowering entrepreneurs, and generating wealth.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-t border-yellow-600/30 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl text-yellow-500 font-light tracking-widest uppercase mb-12">
            By the Numbers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="text-4xl font-light text-yellow-500 mb-2">$2.4B</p>
              <p className="text-gray-300 font-light text-sm">Capital Deployed</p>
            </div>
            <div>
              <p className="text-4xl font-light text-yellow-500 mb-2">500+</p>
              <p className="text-gray-300 font-light text-sm">Active Investors</p>
            </div>
            <div>
              <p className="text-4xl font-light text-yellow-500 mb-2">250+</p>
              <p className="text-gray-300 font-light text-sm">Portfolio Companies</p>
            </div>
            <div>
              <p className="text-4xl font-light text-yellow-500 mb-2">28.5%</p>
              <p className="text-gray-300 font-light text-sm">Avg. Annual Returns</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-yellow-600/30 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-light tracking-tight mb-6">
            Ready to Build Wealth?
          </h2>
          <p className="text-gray-300 font-light mb-8 text-lg">
            Join the elite circle of entrepreneurs and investors shaping the future.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/signup"
              className="border border-yellow-600 text-yellow-500 hover:bg-yellow-600/10 px-8 py-3 font-light tracking-widest uppercase text-sm transition duration-300"
            >
              Get Started
            </Link>
            <Link
              to="/signin"
              className="border border-yellow-600/30 text-gray-300 hover:text-yellow-500 px-8 py-3 font-light tracking-widest uppercase text-sm transition duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
