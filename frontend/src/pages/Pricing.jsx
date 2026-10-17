// src/pages/Pricing.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Free',
      description: 'Basic protection for individuals.',
      monthlyPrice: 0,
      annualPrice: 0,
      cta: 'Get Started',
      featured: false,
      features: [
        'Basic spam filtering',
        'Known threat detection',
        'Community support',
      ],
    },
    {
      name: 'Starter',
      description: 'Essential security for small teams.',
      monthlyPrice: 49,
      annualPrice: 470,
      cta: 'Start Free Trial',
      featured: false,
      features: [
        'Advanced spam filtering',
        'Attachment scanning',
        'Email support',
        'Up to 10 users',
      ],
    },
    {
      name: 'Professional',
      description: 'Comprehensive defense for growing businesses.',
      monthlyPrice: 99,
      annualPrice: 950,
      cta: 'Start Free Trial',
      featured: true,
      features: [
        'Real-time AI analysis',
        'URL rewriting & protection',
        'Priority support',
        'Up to 50 users',
        'Weekly reporting',
      ],
    },
    {
      name: 'Business',
      description: 'Advanced features for mid-market.',
      monthlyPrice: 199,
      annualPrice: 1910,
      cta: 'Start Free Trial',
      featured: false,
      features: [
        'Behavioral analysis ML',
        'API Access',
        '24/7 Phone support',
        'Up to 250 users',
        'Custom policies',
      ],
    },
    {
      name: 'Enterprise',
      description: 'Full-scale protection for large organizations.',
      monthlyPrice: null,
      annualPrice: null,
      customQuote: true,
      cta: 'Contact Sales',
      featured: false,
      features: [
        'Dedicated Account Manager',
        'On-premise deployment options',
        'SIEM Integration',
        'Unlimited users',
        'SLA Guarantee',
      ],
    },
  ];

  const [hoveredCard, setHoveredCard] = useState(null);

  const getPrice = (plan) => {
    if (plan.customQuote) return 'Custom';
    const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
    return `$${price}`;
  };

  const getPeriod = (plan) => {
    if (plan.customQuote) return 'Quote';
    return isAnnual ? '/year' : '/mo';
  };

  const handleCTA = (planName) => {
    toast.success(`Starting ${planName} plan!`);
  };

  return (
    <>
      {/* ==================== NAVIGATION ==================== */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/10 shadow-[0_0_20px_rgba(0,168,107,0.1)]">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <Link to="/" className="text-2xl font-bold tracking-tighter text-white uppercase font-space-grotesk">
            PhishGuard AI
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-slate-400 hover:text-white transition-colors hover:bg-white/5 duration-300 font-medium tracking-tight">
              Platform
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors hover:bg-white/5 duration-300 font-medium tracking-tight">
              Solutions
            </a>
            <Link to="/pricing" className="text-teal-400 border-b-2 border-teal-500 pb-1 hover:bg-white/5 duration-300 font-medium tracking-tight">
              Pricing
            </Link>
            <a href="#" className="text-slate-400 hover:text-white transition-colors hover:bg-white/5 duration-300 font-medium tracking-tight">
              Resources
            </a>
          </div>
        </div>
      </nav>

      <main className="min-h-screen pt-24 pb-12 relative z-10">
        {/* ==================== HERO SECTION ==================== */}
      <section className="text-center py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
          Choose the plan that defends your inbox
        </h1>
        <p className="text-lg text-slate-300 max-w-3xl mx-auto mb-12">
          </p>

            {/* ==================== BILLING TOGGLE ==================== */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className="text-sm text-slate-300 font-medium">Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-7 bg-slate-700 rounded-full relative p-1 transition-colors duration-300 focus:outline-none hover:bg-slate-600"
              aria-label="Toggle Billing"
            >
              <div
                className={`w-5 h-5 bg-green-500 rounded-full transform transition-transform duration-300 ${
                  isAnnual ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></div>
            </button>
            <span className="text-sm text-slate-300 font-medium flex items-center gap-2">
              Annually
              {isAnnual && <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded font-bold">Save 20%</span>}
            </span>
          </div>
        </section>

        {/* ==================== PRICING CARDS ==================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`pricing-card glass-card relative rounded-lg p-7 flex flex-col h-full transition-all duration-300 ${
                  plan.featured
                    ? 'bg-slate-800 border-2 border-green-500 transform scale-102 z-10'
                    : `bg-slate-900/50 border border-slate-700 ${
                        hoveredCard === idx ? 'glow-hover border-green-500' : 'hover:border-slate-600'
                      }`
                } ${hoveredCard === idx && !plan.featured ? 'hover-glow' : ''}`}
              >
                {/* Most Popular Badge */}
                {plan.featured && (
                  <div className="absolute top-0 right-0 bg-orange-600 text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg font-bold tracking-tight">
                    Most Popular
                  </div>
                )}

                <h3 className={`text-xl font-bold mb-2 tracking-tight ${plan.featured ? 'text-green-400' : 'text-white'}`}>
                  {plan.name}
                </h3>
                <p className="text-sm text-slate-400 mb-5 min-h-[40px] leading-snug">{plan.description}</p>

                {/* Pricing */}
                <div className="mb-6">
                  {plan.customQuote ? (
                    <>
                      <span className="text-3xl font-bold text-white">Custom</span>
                      <span className="text-sm text-slate-400 block">Quote</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-white">{getPrice(plan)}</span>
                      <span className="text-sm text-slate-400">{getPeriod(plan)}</span>
                    </>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleCTA(plan.name)}
                  className={`w-full py-2.5 rounded-lg mb-6 font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
                    plan.featured
                      ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-[0_0_20px_rgba(0,168,107,0.8)]'
                      : 'bg-transparent border border-green-600 text-green-400 hover:bg-green-600/10 hover:shadow-[0_0_15px_rgba(0,168,107,0.5)]'
                  }`}
                >
                  {plan.cta}
                </button>

                {/* Features List */}
                <ul className="space-y-3 flex-grow">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-start gap-2 text-slate-300">
                      <i className="fas fa-check-circle text-green-400 mt-0.5 flex-shrink-0 text-sm"></i>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="w-full border-t border-slate-800 py-8 bg-slate-950">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-4 opacity-75 hover:opacity-100 transition-opacity">
          <div className="text-lg font-bold text-white font-medium tracking-tight">
            PhishGuard AI
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="#" className="text-xs text-slate-500 hover:text-teal-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-slate-500 hover:text-teal-400 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-xs text-slate-500 hover:text-teal-400 transition-colors">
              Security Architecture
            </a>
            <a href="#" className="text-xs text-slate-500 hover:text-teal-400 transition-colors">
              Contact Support
            </a>
          </div>
          <div className="text-xs text-slate-500">
            © 2026 PhishGuard AI. Securing the African Digital Frontier.
          </div>
        </div>
      </footer>

      {/* ==================== GLASS CARD & GLOW STYLES ==================== */}
      <style>{`
        .glass-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glow-hover {
          box-shadow: 0 0 20px rgba(0, 168, 107, 0.5), inset 0 0 20px rgba(0, 168, 107, 0.1);
        }
        .hover-glow {
          box-shadow: 0 0 20px rgba(0, 168, 107, 0.5), inset 0 0 20px rgba(0, 168, 107, 0.1) !important;
        }
        .scale-102 {
          transform: scale(1.02);
        }
      `}</style>
    </>
  );
}