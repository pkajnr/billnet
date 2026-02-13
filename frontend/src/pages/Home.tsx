import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={{backgroundColor: 'var(--color-secondary)'}} className="text-white">
      {/* Hero */}
      <section id="top" className="relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0" style={{background: 'linear-gradient(to bottom right, var(--color-secondary), var(--color-secondary-light), var(--color-secondary)'}}></div>
        <div className="absolute -left-32 top-20 w-96 h-96 blur-3xl rounded-full animate-pulse" style={{backgroundColor: 'rgba(255, 153, 0, 0.1)'}} aria-hidden></div>
        <div className="absolute -right-32 bottom-10 w-[30rem] h-[30rem] blur-3xl rounded-full animate-pulse" style={{backgroundColor: 'rgba(0, 113, 133, 0.1)'}} aria-hidden></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] blur-3xl rounded-full" style={{backgroundColor: 'rgba(255, 153, 0, 0.05)'}} aria-hidden></div>

        <div className="relative z-10 w-full container py-20 lg:py-28 grid lg:grid-cols-2 gap-14">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 card px-5 py-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{backgroundColor: 'var(--color-success)'}}></span>
                <span className="relative inline-flex rounded-full h-3 w-3" style={{backgroundColor: 'var(--color-success)'}}></span>
              </span>
              <p className="text-xs tracking-[0.30em] text-green-500 font-semibold">INVEST • BUILD • SCALE</p>
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6" style={{background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
                Where Investors and Founders Build the Future Together
              </h1>
              <p className="text-lg text-white/70 leading-relaxed max-w-xl">
                Discover verified ventures, place confident bids, and grow alongside exceptional teams. Experience seamless investment in one powerful platform.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/signup"
                className="btn btn-primary group"
              >
                Join the Marketplace
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                to="/about"
                className="btn btn-secondary"
              >
                How It Works
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{backgroundColor: 'var(--color-success)'}}></span>
                <span>24/7 Verified Due Diligence</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-400 pulse-glow"></span>
                <span>Secure Instant Transactions</span>
              </div>
            </div>
          </div>

          <div className="relative float">
            <div className="absolute inset-0 blur-3xl rounded-3xl" style={{background: 'linear-gradient(to bottom right, rgba(255, 153, 0, 0.1), rgba(0, 113, 133, 0.1))'}}></div>
            <div
              className="relative card p-8"
              style={{ backgroundColor: 'rgba(35, 47, 62, 0.92)', borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-sm text-white/60 mb-1">Live Mandates</p>
                  <p className="text-4xl font-bold" style={{background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>$2.47B</p>
                </div>
                <span className="badge badge-success">Open</span>
              </div>

              <div className="space-y-4">
                {[{
                  name: 'Series A • Clean Energy',
                  growth: '+28.4% YoY',
                  tag: 'Preferred',
                  color: 'from-emerald-500 to-green-600'
                }, {
                  name: 'Seed • AI Supply Chain',
                  growth: '+18.6% QoQ',
                  tag: 'Allocation Left',
                  color: 'from-cyan-500 to-blue-600'
                }, {
                  name: 'Series B • HealthTech',
                  growth: '+33.1% YoY',
                  tag: 'Lead Secured',
                  color: 'from-amber-500 to-orange-600'
                }].map((item) => (
                  <div
                    key={item.name}
                    className="card p-4 hover:scale-[1.02] transition-transform"
                    style={{ backgroundColor: 'rgba(35, 47, 62, 0.82)', borderColor: 'rgba(255,255,255,0.12)' }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold">{item.name}</p>
                        <p className="text-sm text-white/60 mt-1">{item.tag}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-400">{item.growth}</span>
                    </div>
                    <div className={`h-2 rounded-full bg-gradient-to-r ${item.color} shadow-lg`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Grid */}
      <section id="value" className="py-20 px-6 border-t" style={{backgroundColor: 'var(--color-secondary-light)', borderColor: 'rgba(255,255,255,0.1)'}}>
        <div className="container space-y-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-xs tracking-[0.30em] text-white/50 mb-3 font-semibold">WHY CHOOSE US</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white max-w-2xl leading-tight">
                Everything you need to invest with confidence
              </h2>
            </div>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-sm font-semibold transition group"
              style={{color: 'var(--color-accent)'}}
            >
              Explore Live Deals
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[{
              title: 'Tightly Curated',
              body: 'Every opportunity screened by sector specialists with transparent risk assessments and clear timelines.',
              accent: 'from-emerald-500 to-green-600',
              icon: '✅'
            }, {
              title: 'Bid-Ready Data',
              body: 'Comprehensive financials, metrics, and founder insights delivered in one intuitive profile.',
              accent: 'from-cyan-500 to-blue-600',
              icon: '📊'
            }, {
              title: 'Aligned Incentives',
              body: 'Invest alongside experienced leads. Transparent fees, clear terms, no hidden conditions.',
              accent: 'from-amber-500 to-orange-600',
              icon: '🤝'
            }].map((card) => (
              <div
                key={card.title}
                className="card p-6 space-y-4 group"
                style={{ backgroundColor: 'rgba(35, 47, 62, 0.82)', borderColor: 'rgba(255,255,255,0.12)' }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.accent} flex items-center justify-center text-2xl shadow-lg`}>
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition">{card.title}</h3>
                <p className="text-white/70 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-6 bg-[#0f1115]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <p className="text-xs tracking-[0.30em] text-white/50 font-semibold">THE PROCESS</p>
            <h2 className="text-3xl sm:text-4xl font-bold gradient-text leading-tight">From Discovery to Allocation in Three Steps</h2>
            <p className="text-white/70 leading-relaxed text-lg">Built for speed without compromising rigor. Save your filters, run due diligence, and commit funds in minutes.</p>
            <div className="flex gap-3 pt-4">
              <Link to="/signup" className="btn-primary">Open an Account</Link>
              <Link to="/about" className="btn-secondary">View Diligence Stack</Link>
            </div>
          </div>

          <div className="space-y-4">
            {[{
              title: '1. Discover',
              copy: 'Track live raises with advanced filters for stage, sector, region, and lead investor alignment.',
              badge: 'Curated Feed',
              color: 'from-emerald-500 to-green-600'
            }, {
              title: '2. Validate',
              copy: 'Access comprehensive data rooms, call notes, and on-chain proof of funds before placing your bid.',
              badge: 'Transparent Data',
              color: 'from-cyan-500 to-blue-600'
            }, {
              title: '3. Allocate',
              copy: 'Fund directly from your wallet. We handle settlement, cap table updates, and comprehensive reporting.',
              badge: 'Frictionless Bids',
              color: 'from-amber-500 to-orange-600'
            }].map((item, idx) => (
              <div key={item.title} className="glass-card p-5 card-hover group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-bold text-white group-hover:text-indigo-300 transition">{item.title}</span>
                  <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                    {idx + 1}
                  </span>
                </div>
                <p className="text-white/70 leading-relaxed mb-3">{item.copy}</p>
                <span className="badge badge-primary">{item.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio slices */}
      <section id="portfolio" className="py-20 px-6 bg-[#0c0e12] border-t border-white/5">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.30em] text-white/50 font-semibold">TRACK RECORD</p>
              <h2 className="text-3xl font-bold text-white">Signals from Recent Allocations</h2>
            </div>
            <Link to="/analytics" className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition group">
              View Dashboard
              <span className="inline-block transition-transform group-hover:translate-x-1 ml-1">→</span>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[{
              name: 'Aurora Grid',
              metric: '+31% net IRR',
              detail: 'Utility-scale storage rollout across MENA.',
              color: 'from-emerald-500 to-green-600'
            }, {
              name: 'Marlin Freight AI',
              metric: '+19% QoQ revenue',
              detail: 'Predictive routing for cold-chain logistics.',
              color: 'from-cyan-500 to-blue-600'
            }, {
              name: 'Northwind Care',
              metric: '+24% ARR growth',
              detail: 'Clinical data rails with payer integrations.',
              color: 'from-amber-500 to-orange-600'
            }].map((item) => (
              <div key={item.name} className="glass-card p-6 space-y-3 card-hover group">
                <p className="text-white font-bold text-lg group-hover:text-indigo-300 transition">{item.name}</p>
                <p className={`text-2xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>{item.metric}</p>
                <p className="text-white/60 text-sm leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section id="cta" className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-amber-600/20"></div>
        <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <p className="text-xs tracking-[0.30em] text-white/50 font-semibold">READY TO START</p>
          <h2 className="text-4xl sm:text-5xl font-bold gradient-text leading-tight">Join the Future of Investment</h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg leading-relaxed">
            Create your account, fund your wallet, and start backing exceptional founders today. One platform, infinite possibilities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/signup" className="btn-primary text-lg px-8 py-4">Create Your Profile</Link>
            <Link to="/signin" className="btn-secondary text-lg px-8 py-4">Sign In</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
