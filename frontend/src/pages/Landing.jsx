// src/pages/Landing.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginUser, submitSignupRequest } from '../services/api';

// ---- Helper: smooth scroll to section on same page ----
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    const offset = 80;
    const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

// ---- Custom hook for count-up animation ----
function useCountUp(targetValue, isComma = false) {
  const [display, setDisplay] = useState(isComma ? '0' : '0');
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const duration = 1400;
            const start = performance.now();
            const update = (now) => {
              const progress = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              const val = Math.round(targetValue * eased);
              setDisplay(isComma ? val.toLocaleString() : val.toString());
              if (progress < 1) requestAnimationFrame(update);
            };
            requestAnimationFrame(update);
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.55 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [targetValue, isComma]);

  return { display, ref };
}

function CountUp({ value, suffix = '', isComma = false }) {
  const { display, ref } = useCountUp(value, isComma);
  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

// ---- Live Threat Feed data ----
const threats = [
  'Phishing email blocked: "Urgent payment required" from fake@bank.com',
  'Suspicious link detected in email to admin@company.co.zm',
  'Malicious attachment (.exe) quarantined from marketing@scam.xyz',
  'BEC attempt: CEO impersonation targeting finance@org.africa',
  'Fake Microsoft login page detected and blocked',
  'Whale phishing attempt: invoice fraud from vendor@fake-supplier.com',
];

const previewTimelineEvents = [
  { time: '09:18', copy: 'CEO impersonation detected and quarantined.' },
  { time: '09:24', copy: 'Suspicious vendor invoice link neutralized.' },
  { time: '09:31', copy: 'High-risk mailbox alert routed to admin dashboard.' },
];

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const featureCards = [
  {
    icon: 'fa-envelope-open-text',
    color: 'text-blue-400',
    title: 'Email Analysis Engine',
    desc: 'Extract and analyze email headers, sender domains, URLs, and attachments.',
  },
  {
    icon: 'fa-brain',
    color: 'text-purple-400',
    title: 'AI/ML Classification',
    desc: 'Advanced models classify emails as Safe, Suspicious, or Phishing.',
  },
  {
    icon: 'fa-check-double',
    color: 'text-green-400',
    title: 'SPF/DKIM Validation',
    desc: 'Verify authenticity with SPF, DKIM, and DMARC checks.',
  },
  {
    icon: 'fa-chart-simple',
    color: 'text-yellow-400',
    title: 'Threat Intelligence Dashboard',
    desc: 'Real-time analytics: trends, targeted users, geographic origins.',
  },
  {
    icon: 'fa-bell',
    color: 'text-red-400',
    title: 'Real-time Alerts',
    desc: 'Instant notifications with auto-quarantine and admin alerts.',
  },
];

function FeatureIcon({ icon, color, title }) {
  if (title === 'Email Analysis Engine') {
    return (
      <div className={`feature-icon feature-icon-envelope ${color}`} aria-hidden="true">
        <i className={`fas ${icon} feature-icon-base`}></i>
        <span className="feature-envelope-letter"></span>
      </div>
    );
  }

  if (title === 'AI/ML Classification') {
    return (
      <div className={`feature-icon feature-icon-brain ${color}`} aria-hidden="true">
        <span className="feature-ripple ripple-one"></span>
        <span className="feature-ripple ripple-two"></span>
        <i className={`fas ${icon} feature-icon-base`}></i>
      </div>
    );
  }

  if (title === 'SPF/DKIM Validation') {
    return (
      <div className={`feature-icon feature-icon-check ${color}`} aria-hidden="true">
        <i className={`fas ${icon} feature-icon-base`}></i>
      </div>
    );
  }

  if (title === 'Threat Intelligence Dashboard') {
    return (
      <div className={`feature-icon feature-icon-dashboard ${color}`} aria-hidden="true">
        <span className="dashboard-bar"></span>
        <span className="dashboard-bar"></span>
        <span className="dashboard-bar"></span>
      </div>
    );
  }

  if (title === 'Real-time Alerts') {
    return (
      <div className={`feature-icon feature-icon-bell ${color}`} aria-hidden="true">
        <span className="bell-wave wave-one"></span>
        <span className="bell-wave wave-two"></span>
        <i className={`fas ${icon} feature-icon-base`}></i>
      </div>
    );
  }

  return (
    <div className={`feature-icon ${color}`} aria-hidden="true">
      <i className={`fas ${icon} feature-icon-base`}></i>
    </div>
  );
}

function RiskWaveform({ score, colorClass }) {
  const glowColor = score <= 30 ? 'rgba(74, 222, 128, 0.55)' : score <= 70 ? 'rgba(250, 204, 21, 0.55)' : 'rgba(248, 113, 113, 0.6)';

  return (
    <div
      className={`feature-icon risk-waveform ${colorClass}`}
      style={{ '--risk-wave-glow': glowColor }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 30" className="risk-waveform-svg" role="presentation" focusable="false">
        <path className="risk-waveform-grid" d="M6 22H94" />
        <path className="risk-waveform-grid" d="M6 15H94" />
        <path className="risk-waveform-grid" d="M6 8H94" />
        <path
          className="risk-waveform-path risk-waveform-glow"
          pathLength="100"
          d="M5 19 L18 19 L28 9 L40 22 L53 12 L66 18 L78 7 L95 14"
        />
        <path
          className="risk-waveform-path risk-waveform-core"
          pathLength="100"
          d="M5 19 L18 19 L28 9 L40 22 L53 12 L66 18 L78 7 L95 14"
        />
      </svg>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [isLight, setIsLight] = useState(() => localStorage.getItem('theme') === 'light');
  useEffect(() => {
    document.body.classList.toggle('light-mode', isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  }, [isLight]);

  // ---- Mobile menu ----
  const [mobileOpen, setMobileOpen] = useState(false);

  // ---- Modals ----
  const [demoOpen, setDemoOpen] = useState(false);
  const [trialOpen, setTrialOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const openDemo = () => setDemoOpen(true);
  const closeDemo = () => setDemoOpen(false);
  const openTrial = () => setTrialOpen(true);
  const closeTrial = () => setTrialOpen(false);
  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };
  const closeAuth = () => setAuthOpen(false);

  // ---- Auth form fields ----
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirm, setAuthConfirm] = useState('');
  const [authErrors, setAuthErrors] = useState({});
  const [signupName, setSignupName] = useState('');
  const [signupOrg, setSignupOrg] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const resetAuth = () => {
    setAuthEmail('');
    setAuthPassword('');
    setAuthConfirm('');
    setAuthErrors({});
    setSignupName('');
    setSignupOrg('');
  };

  const switchAuthMode = () => setAuthMode((prev) => (prev === 'login' ? 'signup' : 'login'));

  const validateAuth = () => {
    const errs = {};
    if (!authEmail.trim()) errs.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail)) errs.email = 'Enter a valid email.';
    if (!authPassword.trim()) errs.password = 'Enter your password.';
    if (authMode === 'signup') {
      if (!authConfirm.trim()) errs.confirm = 'Confirm your password.';
      else if (authPassword !== authConfirm) errs.confirm = 'Passwords must match.';
      if (authPassword.length < 8) errs.password = 'Use at least 8 characters.';
    }
    setAuthErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateAuth()) return;

    setLoginLoading(true);
    try {
      const response = await loginUser(authEmail.trim(), authPassword);
      localStorage.setItem('authToken', response.access_token);
      localStorage.setItem('userRole', response.role);
      localStorage.setItem('userEmail', authEmail.trim());
      toast.success(`Logged in as ${response.role === 'admin' ? 'Admin' : 'User'}`);
      closeAuth();
      navigate(response.role === 'admin' ? '/admin' : '/scanner');
    } catch (error) {
      setAuthErrors((prev) => ({ ...prev, general: error.message || 'Login failed' }));
      toast.error(error.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!validateAuth()) return;
    if (!signupName.trim()) {
      toast.error('Enter your full name.');
      return;
    }
    try {
      await submitSignupRequest(signupName.trim(), authEmail.trim(), authPassword, signupOrg.trim());
      toast.success('Your access request has been submitted. Please wait for admin approval.');
      closeAuth();
      resetAuth();
    } catch (error) {
      toast.error(error.message || 'Signup request failed');
    }
  };

  // ---- Demo / trial form handling ----
  const handleDemoSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    if (!data['Full Name'] || !data['Email Address'] || !data['Organization']) {
      toast.error('Please fill all fields.');
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Demo request submitted!');
    closeDemo();
    form.reset();
  };

  const handleTrialSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    if (!data['Full Name'] || !data['Email Address'] || !data['Organization']) {
      toast.error('Please fill all fields.');
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Trial started! Check your email.');
    closeTrial();
    form.reset();
  };

  // ==================== NEW: Live Threat Feed - Ticker Animation ====================
  const [tickerIndex, setTickerIndex] = useState(0);
  const [tickerAnimating, setTickerAnimating] = useState(false);
  const [previewBlockedToday, setPreviewBlockedToday] = useState(318);
  const [previewEscalatedCases, setPreviewEscalatedCases] = useState(14);
  const [activePreviewEventIndex, setActivePreviewEventIndex] = useState(0);
  const [previewBlockedBump, setPreviewBlockedBump] = useState(false);
  const [previewEscalatedBump, setPreviewEscalatedBump] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerAnimating(true);
      setTimeout(() => {
        setTickerIndex((prev) => (prev + 1) % threats.length);
        setTickerAnimating(false);
      }, 400); // match CSS transition duration
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentTickerMsg = threats[tickerIndex];
  const activePreviewEvent = previewTimelineEvents[activePreviewEventIndex];

  useEffect(() => {
    let blockedTimeoutId;
    let isCancelled = false;

    const scheduleBlockedUpdate = () => {
      blockedTimeoutId = window.setTimeout(() => {
        if (!document.hidden) {
          setPreviewBlockedToday((prev) => prev + 1);
        }
        if (!isCancelled) scheduleBlockedUpdate();
      }, getRandomDelay(5000, 7000));
    };

    scheduleBlockedUpdate();

    return () => {
      isCancelled = true;
      window.clearTimeout(blockedTimeoutId);
    };
  }, []);

  useEffect(() => {
    const escalatedInterval = window.setInterval(() => {
      if (!document.hidden) {
        setPreviewEscalatedCases((prev) => prev + 1);
      }
    }, 20000);

    return () => window.clearInterval(escalatedInterval);
  }, []);

  useEffect(() => {
    const previewTimelineInterval = window.setInterval(() => {
      if (!document.hidden) {
        setActivePreviewEventIndex((prev) => (prev + 1) % previewTimelineEvents.length);
      }
    }, 3000);

    return () => window.clearInterval(previewTimelineInterval);
  }, []);

  useEffect(() => {
    if (previewBlockedToday === 318) return;
    setPreviewBlockedBump(true);
    const timeoutId = window.setTimeout(() => setPreviewBlockedBump(false), 320);
    return () => window.clearTimeout(timeoutId);
  }, [previewBlockedToday]);

  useEffect(() => {
    if (previewEscalatedCases === 14) return;
    setPreviewEscalatedBump(true);
    const timeoutId = window.setTimeout(() => setPreviewEscalatedBump(false), 320);
    return () => window.clearTimeout(timeoutId);
  }, [previewEscalatedCases]);

  // ==================== NEW: Risk Scoring Auto‑demo ====================
  const [autoPlay, setAutoPlay] = useState(true);
  const [riskValue, setRiskValue] = useState(42);
  const rafId = useRef(null);
  const direction = useRef(1); // 1 = increasing, -1 = decreasing

  useEffect(() => {
    if (!autoPlay) {
      cancelAnimationFrame(rafId.current);
      return;
    }
    const step = () => {
      setRiskValue((prev) => {
        const next = prev + direction.current * 0.5; // speed
        if (next >= 100) {
          direction.current = -1;
          return 100;
        }
        if (next <= 0) {
          direction.current = 1;
          return 0;
        }
        return next;
      });
      rafId.current = requestAnimationFrame(step);
    };
    rafId.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId.current);
  }, [autoPlay]);

  // Stop auto‑play when user interacts with slider manually
  const handleSliderManual = (e) => {
    setAutoPlay(false);
    setRiskValue(Number(e.target.value));
  };

  const toggleAutoPlay = () => setAutoPlay(!autoPlay);

  const riskLabel = riskValue <= 30 ? 'Safe' : riskValue <= 70 ? 'Moderate Risk' : 'High Risk!';
  const riskColor =
    riskValue <= 30 ? 'text-green-400' : riskValue <= 70 ? 'text-yellow-400' : 'text-red-400';
  // =====================================================

  // ---- Active nav observer ----
  const [activeLink, setActiveLink] = useState('');
  useEffect(() => {
    const sections = ['features', 'how-it-works'];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveLink(visible.target.id);
      },
      { threshold: 0.45, rootMargin: '-20% 0px -45% 0px' }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  // ---- Scroll‑triggered fade‑up animations ----
  useEffect(() => {
    const elements = document.querySelectorAll('.fade-up');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ==================== NAVIGATION ==================== */}
      <nav className="sticky top-0 z-50 bg-[#0a0c10]/80 backdrop-blur-md border-b border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo + Theme */}
              <div className="flex items-center space-x-4">
                <div className="brand-lockup">
                  <img src="/favicon.png" alt="PhishGuard AI shield logo" className="brand-mark" />
                  <Link to="/" className="brand-name text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    PhishGuard AI
                  </Link>
                </div>
              <button
                onClick={() => setIsLight(!isLight)}
                className="p-2 rounded-full hover:bg-gray-800 transition"
                aria-label="Toggle dark mode"
              >
                {isLight ? (
                  <i className="fas fa-sun text-yellow-400"></i>
                ) : (
                  <i className="fas fa-moon text-yellow-400"></i>
                )}
              </button>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-3 text-sm font-medium">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => scrollToSection('features')}
                  className={`nav-link hover:text-blue-400 transition ${activeLink === 'features' ? 'is-active' : ''}`}
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className={`nav-link hover:text-blue-400 transition ${activeLink === 'how-it-works' ? 'is-active' : ''}`}
                >
                  How It Works
                </button>
                <Link
                  to="/pricing"
                  className={`nav-link hover:text-blue-400 transition ${activeLink === 'pricing' ? 'is-active' : ''}`}
                >
                  Pricing
                </Link>
                <a
                  href="#"
                  className="nav-link hover:text-blue-400 transition"
                  onClick={(e) => {
                    e.preventDefault();
                    toast('Resources hub coming soon.', { icon: 'ℹ️' });
                  }}
                >
                  Resources
                </a>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openAuth('login')}
                  className="nav-link btn-secondary hover:text-blue-400 transition"
                >
                  Log In
                </button>
                <button onClick={() => openAuth('signup')} className="nav-cta btn-primary">
                  Sign Up
                </button>
                <button onClick={() => scrollToSection('how-it-works')} className="nav-cta see-in-action">
                  See It In Action
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="text-gray-300 hover:text-white focus:outline-none"
                aria-label="Menu"
              >
                <i className="fas fa-bars text-2xl"></i>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-96' : 'max-h-0'}`}>
            <div className="mobile-menu-panel flex flex-col space-y-2 pb-4 pt-3 text-sm font-medium">
              <button
                onClick={() => { scrollToSection('features'); setMobileOpen(false); }}
                className="nav-link hover:text-blue-400 transition py-2 px-3 rounded-xl"
              >
                Features
              </button>
              <button
                onClick={() => { scrollToSection('how-it-works'); setMobileOpen(false); }}
                className="nav-link hover:text-blue-400 transition py-2 px-3 rounded-xl"
              >
                How It Works
              </button>
              <Link
                to="/pricing"
                className="nav-link hover:text-blue-400 transition py-2 px-3 rounded-xl"
                onClick={() => setMobileOpen(false)}
              >
                Pricing
              </Link>
              <a
                href="#"
                className="nav-link hover:text-blue-400 transition py-2 px-3 rounded-xl"
                onClick={(e) => { e.preventDefault(); toast('Resources hub coming soon.', { icon: 'ℹ️' }); setMobileOpen(false); }}
              >
                Resources
              </a>
              <button
                onClick={() => { openAuth('login'); setMobileOpen(false); }}
                className="nav-link hover:text-blue-400 transition py-2 px-3 rounded-xl"
              >
                Log In
              </button>
              <button
                onClick={() => { openAuth('signup'); setMobileOpen(false); }}
                className="nav-cta nav-cta-mobile"
              >
                Sign Up
              </button>
              <button
                onClick={() => { scrollToSection('how-it-works'); setMobileOpen(false); }}
                className="nav-cta nav-cta-mobile see-in-action"
              >
                See It In Action
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ==================== MAIN CONTENT ==================== */}
      <main id="top">
        {/* ----- Hero Section (size tweaked) ----- */}
        <section className="relative overflow-hidden hero-bg hero-section">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-transparent"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
            <div className="hero-shell">
              <div className="hero-primary-row grid lg:grid-cols-[1.08fr,0.92fr] gap-12 xl:gap-16 items-center">
                <div className="fade-up hero-copy-column">
                  <div className="hero-kicker">
                    <span className="hero-kicker-dot"></span>
                    Trusted Email Defense for Modern African Teams
                  </div>
                  <h1 className="mt-6 text-4xl md:text-6xl xl:text-7xl font-extrabold leading-[1.02]">
                    <span className="text-white">Stop phishing before it becomes</span>
                    <span className="hero-accent block">a business problem</span>
                  </h1>
                  <p className="text-xl md:text-2xl font-semibold mt-5 text-gray-100">
                    Fast detection, clear risk signals, and response workflows teams can act on immediately.
                  </p>
                  <p className="text-gray-300 max-w-2xl mt-6 text-lg leading-8">
                    PhishGuard AI scans inbound email in real time, flags suspicious behavior early, and helps
                    organizations respond with more confidence and less noise.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <button onClick={openDemo} className="hero-primary-btn px-6 py-3 rounded-xl font-semibold transition shadow-lg">
                      Get a Demo
                    </button>
                    <button onClick={() => scrollToSection('how-it-works')} className="hero-secondary-btn px-6 py-3 rounded-xl font-semibold transition">
                      See How It Works
                    </button>
                  </div>
                </div>

                <div className="fade-up hero-preview-column">
                  <div className="hero-preview-panel">
                    <div className="hero-preview-header">
                      <div>
                        <p className="hero-preview-label">Live Product Snapshot</p>
                        <h2 className="hero-preview-title">Threat command view</h2>
                      </div>
                      <div className="hero-preview-status">
                        <span className="status-dot"></span>
                        System Active
                      </div>
                    </div>
                    <div className="hero-preview-main">
                      <div className="preview-risk-card">
                        <p className="preview-label">Current risk climate</p>
                        <div className="preview-risk-score">74</div>
                        <p className="preview-subtext">Elevated threat activity detected across finance-focused inboxes.</p>
                      </div>
                      <div className="preview-metric-stack">
                        <div className="preview-mini-card">
                          <span className="preview-label">Blocked today</span>
                          <strong
                            aria-live="polite"
                            className={`preview-metric-value ${previewBlockedBump ? 'is-updating' : ''}`}
                          >
                            {previewBlockedToday}
                          </strong>
                        </div>
                        <div className="preview-mini-card">
                          <span className="preview-label">Escalated cases</span>
                          <strong
                            aria-live="polite"
                            className={`preview-metric-value ${previewEscalatedBump ? 'is-updating' : ''}`}
                          >
                            {previewEscalatedCases}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <div className="preview-timeline" aria-live="polite">
                      <div key={activePreviewEventIndex} className="timeline-row timeline-row-live">
                        <span className="timeline-time">{activePreviewEvent.time}</span>
                        <span className="timeline-copy">{activePreviewEvent.copy}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-support-band fade-up">
                <div className="hero-trust-row flex flex-wrap gap-4">
                  <span className="hero-pill px-3 py-1.5"><i className="fas fa-chart-line mr-2 text-blue-400"></i>99.7% Detection Rate</span>
                  <span className="hero-pill px-3 py-1.5"><i className="fas fa-bolt mr-2 text-purple-400"></i>Real-time Protection</span>
                  <span className="hero-pill px-3 py-1.5"><i className="fas fa-map-marker-alt mr-2 text-green-400"></i>Built for African Threats</span>
                </div>
                <div className="hero-stats-grid mt-8 grid sm:grid-cols-3 gap-4">
                  <div className="hero-stat-card p-4">
                    <div className="hero-stat-number text-2xl"><CountUp value={1284} isComma /></div>
                    <div className="hero-stat-label text-sm">Threats blocked this week</div>
                  </div>
                  <div className="hero-stat-card p-4">
                    <div className="hero-stat-number text-2xl"><CountUp value={6} /> sec</div>
                    <div className="hero-stat-label text-sm">Average triage response</div>
                  </div>
                  <div className="hero-stat-card p-4">
                    <div className="hero-stat-number text-2xl"><CountUp value={42} /></div>
                    <div className="hero-stat-label text-sm">Signals analyzed per email</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ----- Live Threat Feed – Animated Ticker ----- */}
        <section className="py-6 bg-[#0f1117] threat-feed-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#111827] rounded-xl p-3 border border-gray-800 threat-feed-shell hover:shadow-[0_0_18px_rgba(239,68,68,0.15)] transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-shield-alt text-red-500 animate-pulse"></i>
                  <span className="font-semibold text-sm">Live Threat Feed</span>
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Real-time</span>
                </div>
                <span className="text-xs text-gray-500">Updated every 3s</span>
              </div>
              <div className="relative mt-2 h-8 overflow-hidden">
                <div
                  className={`absolute inset-0 flex items-center text-xs text-gray-400 transition-all duration-500 ${
                    tickerAnimating ? '-translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
                  }`}
                >
                  <i className="fas fa-skull text-red-500 mr-1"></i>
                  {currentTickerMsg} <span className="text-[10px] text-gray-500 ml-2">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ----- Problem & Solution (compact) ----- */}
        <section className="py-16 bg-[#0f1117]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-10 fade-up">
              <div>
                <h2 className="text-2xl font-bold text-red-400">The Problem</h2>
                <p className="mt-2 text-gray-300 text-sm">Phishing continues to hit African organizations hard, and basic spam filtering is no longer enough against targeted modern attacks.</p>
                <div className="mt-6 grid gap-3">
                  <div className="bg-[#111827] p-4 rounded-xl border border-gray-800 flex items-center space-x-4">
                    <div className="text-2xl text-blue-400"><i className="fas fa-dollar-sign"></i></div>
                    <div><div className="text-xl font-bold">$4.2M</div><div className="text-gray-400 text-xs">Average cost of a phishing attack for African businesses</div></div>
                  </div>
                  <div className="bg-[#111827] p-4 rounded-xl border border-gray-800 flex items-center space-x-4">
                    <div className="text-2xl text-purple-400"><i className="fas fa-chart-line"></i></div>
                    <div><div className="text-xl font-bold">83%</div><div className="text-gray-400 text-xs">Of organizations experienced phishing attacks in 2025</div></div>
                  </div>
                  <div className="bg-[#111827] p-4 rounded-xl border border-gray-800 flex items-center space-x-4">
                    <div className="text-2xl text-red-400"><i className="fas fa-envelope"></i></div>
                    <div><div className="text-xl font-bold">BEC</div><div className="text-gray-400 text-xs">Business Email Compromise is the #1 threat</div></div>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-blue-400">The Solution</h2>
                <p className="mt-2 text-gray-300 text-sm">PhishGuard AI combines machine learning, language analysis, and practical security workflows to detect phishing faster and respond before damage spreads.</p>
                <div className="mt-5 space-y-3">
                  <div className="flex items-center space-x-2"><i className="fas fa-check-circle text-green-500"></i><span className="text-sm">AI-Powered Detection – ML models trained on millions of phishing samples</span></div>
                  <div className="flex items-center space-x-2"><i className="fas fa-check-circle text-green-500"></i><span className="text-sm">Real-time Threat Intelligence – Dashboard with attack statistics</span></div>
                  <div className="flex items-center space-x-2"><i className="fas fa-check-circle text-green-500"></i><span className="text-sm">Auto-Quarantine & Alerts – Instant response before damage</span></div>
                </div>
                <div className="mt-6">
                  <div className="inline-flex items-center bg-green-900/30 text-green-400 px-3 py-1.5 rounded-full text-sm border border-green-500/30 animate-pulse">
                    <i className="fas fa-shield-alt mr-1"></i> Threat Blocked <span className="ml-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></span> <span className="ml-1">Just now</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ----- Key Features (compact) ----- */}
        <section id="features" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center fade-up">
              <h2 className="text-3xl font-bold">Key Features</h2>
              <p className="text-gray-400 mt-1 text-sm">Protection built for clarity, speed, and confident action.</p>
            </div>
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featureCards.map((feat, i) => (
                <div key={i} className="feature-card bg-[#111827] p-5 rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-all fade-up">
                  <FeatureIcon icon={feat.icon} color={feat.color} title={feat.title} />
                  <h3 className="text-lg font-semibold">{feat.title}</h3>
                  <p className="text-gray-400 mt-1 text-xs">{feat.desc}</p>
                  <a href="#" className="learn-more-link inline-block mt-3 text-blue-400 hover:text-blue-300 text-xs" onClick={e => e.preventDefault()}>Learn more <i className="fas fa-arrow-right ml-1"></i></a>
                </div>
              ))}
              {/* Interactive Risk Scoring card with auto‑demo */}
              <div className="feature-card bg-[#111827] p-5 rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-all fade-up">
                <RiskWaveform score={Math.round(riskValue)} colorClass={riskColor} />
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Risk Scoring (0-100)</h3>
                  <button
                    onClick={toggleAutoPlay}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded-full transition"
                  >
                    {autoPlay ? 'Auto: On' : 'Auto: Off'}
                  </button>
                </div>
                <p className="text-gray-400 mt-1 text-xs">Every email gets a quantifiable risk score. Try it yourself:</p>
                <div className="mt-3 space-y-2">
                  {/* Real range input – manual control overrides auto */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(riskValue)}
                    onChange={handleSliderManual}
                    onMouseDown={() => setAutoPlay(false)}
                    onTouchStart={() => setAutoPlay(false)}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Safe (0-30)</span>
                    <span>Suspicious (31-70)</span>
                    <span>Danger (71-100)</span>
                  </div>
                  <div className={`text-center text-xl font-bold ${riskColor}`}>{Math.round(riskValue)}</div>
                  <div className="text-center text-xs text-gray-400">{riskLabel}</div>
                </div>
                <a href="#" className="learn-more-link inline-block mt-3 text-blue-400 hover:text-blue-300 text-xs" onClick={e => e.preventDefault()}>Learn more <i className="fas fa-arrow-right ml-1"></i></a>
              </div>
            </div>
            <div className="text-center mt-8">
              <a href="#" className="text-blue-400 hover:text-blue-300 font-medium text-sm" onClick={e => { e.preventDefault(); toast('Feature documentation coming soon!', { icon: 'ℹ️' }); }}>View All Features <i className="fas fa-arrow-right ml-1"></i></a>
            </div>
          </div>
        </section>

        {/* ----- How It Works + Architecture (compact) ----- */}
        <section id="how-it-works" className="py-16 bg-[#0f1117]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center fade-up">
              <h2 className="text-3xl font-bold">How It Works</h2>
              <p className="text-gray-400 mt-1 text-sm">From inbox event to protective action in seconds.</p>
            </div>
            <div className="mt-10 grid md:grid-cols-4 gap-6">
              {[
                { color: 'bg-blue-600', title: 'Email Ingestion', desc: 'Email flows through PhishGuard API in real-time.' },
                { color: 'bg-purple-600', title: 'AI Analysis', desc: 'NLP & ML models analyze headers, URLs, content.' },
                { color: 'bg-indigo-600', title: 'Risk Scoring', desc: 'Email receives a 0-100 risk score.' },
                { color: 'bg-green-600', title: 'Action & Alert', desc: 'Threats quarantined, dashboards updated, alerts sent.' },
              ].map((step, i) => (
                <div key={i} className="text-center step-card p-4 rounded-xl fade-up">
                  <div className={`step-circle mx-auto ${step.color} w-10 h-10 rounded-full flex items-center justify-center text-base font-bold`}>{i + 1}</div>
                  <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
                  <p className="text-gray-400 text-xs">{step.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-14 fade-up">
              <h3 className="text-xl font-semibold text-center mb-6">System Architecture</h3>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-2">
                {[
                  { icon: 'fa-user', color: 'text-blue-400', label: 'User', tooltip: 'End-user sends or receives email' },
                  { icon: 'fa-server', color: 'text-blue-400', label: 'Email Server', tooltip: "Your organization's email server" },
                  { icon: 'fa-cloud-upload-alt', color: 'text-blue-400', label: 'PhishGuard API', tooltip: 'Intercepts and inspects email' },
                  { icon: 'fa-microchip', color: 'text-purple-400', label: 'AI Model', tooltip: 'Trained ML models analyze content' },
                  { icon: 'fa-chart-line', color: 'text-green-400', label: 'Dashboard', tooltip: 'Admin dashboard shows real-time stats' },
                ].map((item, idx) => (
                  <div key={idx} className="arch-box relative group bg-[#111827] px-4 py-2 rounded-xl border border-gray-700 cursor-help text-sm" title={item.tooltip}>
                    <i className={`fas ${item.icon} mr-1 ${item.color}`}></i> {item.label}
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center sm:hidden mt-2 space-y-1">
                <i className="fas fa-arrow-down text-gray-500 text-xs"></i>
                <i className="fas fa-arrow-down text-gray-500 text-xs"></i>
                <i className="fas fa-arrow-down text-gray-500 text-xs"></i>
                <i className="fas fa-arrow-down text-gray-500 text-xs"></i>
              </div>
            </div>
          </div>
        </section>

        {/* ----- Get Started (unchanged) ----- */}
        <section id="get-started" className="py-16 bg-gradient-to-b from-[#0a0c10] to-[#05070c]">
          <div className="max-w-4xl mx-auto text-center px-4 fade-up">
            <h2 className="text-3xl font-bold">Get Started Today</h2>
            <p className="text-gray-300 mt-3 text-base">Join forward-thinking teams protecting their email infrastructure with faster visibility and smarter response.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <button onClick={openDemo} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition">Request a Demo</button>
              <button onClick={openTrial} className="px-6 py-3 border border-blue-500 text-blue-400 hover:bg-blue-500/10 rounded-lg font-semibold transition">Start Free Trial</button>
            </div>
            <p className="text-gray-500 text-sm mt-3">No credit card required – 14-day free trial – Cancel anytime</p>
          </div>
        </section>
      </main>

      {/* ==================== FOOTER (unchanged) ==================== */}
      <footer className="border-t border-gray-800 bg-[#0a0c10] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-white">Product</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-blue-400">Features</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-blue-400">How It Works</button></li>
                <li><Link to="/pricing" className="hover:text-blue-400">Pricing</Link></li>
                <li><button onClick={openDemo} className="hover:text-blue-400">Demo</button></li>
                <li><a href="#" className="hover:text-blue-400">API Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white">Company</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-blue-400">About Us</a></li>
                <li><a href="#" className="hover:text-blue-400">Careers</a></li>
                <li><a href="#" className="hover:text-blue-400">Partners</a></li>
                <li><a href="#" className="hover:text-blue-400">Blog</a></li>
                <li><a href="#" className="hover:text-blue-400">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white">Resources</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-blue-400">Resources</a></li>
                <li><a href="#" className="hover:text-blue-400">Case Studies</a></li>
                <li><a href="#" className="hover:text-blue-400">FAQ</a></li>
                <li><a href="#" className="hover:text-blue-400">Support</a></li>
                <li><a href="#" className="hover:text-blue-400">Security & Compliance</a></li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-sm text-gray-400">AI-Powered Phishing Detection & Email Threat Intelligence System for African Organizations.</p>
              <div className="mt-4 flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-blue-400"><i className="fab fa-twitter"></i></a>
                <a href="#" className="text-gray-400 hover:text-blue-400"><i className="fab fa-linkedin"></i></a>
                <a href="#" className="text-gray-400 hover:text-blue-400"><i className="fab fa-github"></i></a>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-800 text-sm text-gray-500 text-center">
            <p>&copy; 2026 PhishGuard AI. All rights reserved.</p>
            <div className="flex justify-center space-x-4 mt-2">
              <a href="#" className="hover:text-blue-400">Privacy Policy</a>
              <a href="#" className="hover:text-blue-400">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ==================== MODALS (unchanged) ==================== */}
      {demoOpen && (
        <div className="modal-overlay active fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeDemo}>
          <div className="bg-[#111827] p-6 rounded-2xl w-full max-w-md border border-gray-700 transform transition-all" onClick={e => e.stopPropagation()}>
            <button onClick={closeDemo} className="absolute right-4 top-4 text-gray-400 hover:text-gray-200"><i className="fas fa-times"></i></button>
            <h3 className="text-2xl font-bold">Request a Demo</h3>
            <form onSubmit={handleDemoSubmit} className="mt-4 space-y-4">
              <input type="text" name="Full Name" placeholder="Full Name" required className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white focus:ring-2 focus:ring-blue-500" />
              <input type="email" name="Email Address" placeholder="Email Address" required className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white focus:ring-2 focus:ring-blue-500" />
              <input type="text" name="Organization" placeholder="Organization" required className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white focus:ring-2 focus:ring-blue-500" />
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeDemo} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition">Cancel</button>
                <button type="submit" className="submit-btn px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {trialOpen && (
        <div className="modal-overlay active fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeTrial}>
          <div className="bg-[#111827] p-6 rounded-2xl w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
            <button onClick={closeTrial} className="absolute right-4 top-4 text-gray-400 hover:text-gray-200"><i className="fas fa-times"></i></button>
            <h3 className="text-2xl font-bold">Start Free Trial</h3>
            <form onSubmit={handleTrialSubmit} className="mt-4 space-y-4">
              <input type="text" name="Full Name" placeholder="Full Name" required className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white focus:ring-2 focus:ring-blue-500" />
              <input type="email" name="Email Address" placeholder="Email Address" required className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white focus:ring-2 focus:ring-blue-500" />
              <input type="text" name="Organization" placeholder="Organization" required className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white focus:ring-2 focus:ring-blue-500" />
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeTrial} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition">Cancel</button>
                <button type="submit" className="submit-btn px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition">Start Trial</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {authOpen && (
        <div className="modal-overlay active fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeAuth}>
          <div className="modal-panel relative w-full max-w-md rounded-[1.75rem] border border-gray-700 bg-[#111827] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={closeAuth} className="close-modal absolute right-4 top-4 text-gray-400 hover:text-gray-200"><i className="fas fa-times"></i></button>
            <h3 className="text-2xl font-bold text-white">
              {authMode === 'login' ? 'Log In' : 'Sign Up'}
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              {authMode === 'login'
                ? 'Sign in with your PhishGuard account to continue.'
                : 'Create an account to get started.'}
            </p>
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="mt-6 space-y-4" noValidate>
                  {authErrors.general && (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {authErrors.general}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email address</label>
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => {
                        setAuthEmail(e.target.value);
                        setAuthErrors((prev) => ({ ...prev, email: undefined, general: undefined }));
                      }}
                      className="w-full rounded-2xl border border-gray-700 bg-[#0f1117] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {authErrors.email && <p className="input-error mt-1 text-xs text-red-400">{authErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Password</label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => {
                        setAuthPassword(e.target.value);
                        setAuthErrors((prev) => ({ ...prev, password: undefined, general: undefined }));
                      }}
                      className="w-full rounded-2xl border border-gray-700 bg-[#0f1117] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {authErrors.password && <p className="input-error mt-1 text-xs text-red-400">{authErrors.password}</p>}
                  </div>
                  <div className="flex justify-between items-center">
                    <a href="#" className="text-sm text-blue-400 hover:text-blue-300">Forgot password?</a>
                  </div>
                  <div className="flex flex-col gap-3 pt-3">
                    <button type="submit" className="btn-primary w-full">
                      {loginLoading ? 'Connecting…' : 'Log In'}
                    </button>
                    <button type="button" onClick={closeAuth} className="btn-secondary w-full">Cancel</button>
                  </div>
                </form>
            ) : (
              <form onSubmit={handleSignupSubmit} className="mt-6 space-y-4" noValidate>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={signupName}
                    onChange={e => setSignupName(e.target.value)}
                    className="w-full rounded-2xl border border-gray-700 bg-[#0f1117] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Organization (optional)</label>
                  <input
                    type="text"
                    value={signupOrg}
                    onChange={e => setSignupOrg(e.target.value)}
                    className="w-full rounded-2xl border border-gray-700 bg-[#0f1117] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email address</label>
                  <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full rounded-2xl border border-gray-700 bg-[#0f1117] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {authErrors.email && <p className="input-error mt-1 text-xs text-red-400">{authErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Password</label>
                  <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full rounded-2xl border border-gray-700 bg-[#0f1117] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {authErrors.password && <p className="input-error mt-1 text-xs text-red-400">{authErrors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Confirm password</label>
                  <input type="password" value={authConfirm} onChange={e => setAuthConfirm(e.target.value)} className="w-full rounded-2xl border border-gray-700 bg-[#0f1117] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {authErrors.confirm && <p className="input-error mt-1 text-xs text-red-400">{authErrors.confirm}</p>}
                </div>
                <div className="flex flex-col gap-3 pt-3">
                  <button type="submit" className="btn-primary w-full">Create Account</button>
                  <button type="button" onClick={closeAuth} className="btn-secondary w-full">Cancel</button>
                </div>
              </form>
            )}
            <p className="mt-4 text-center text-sm text-gray-400">
              {authMode === 'login' ? 'Need an account?' : 'Already have an account?'}
              <button onClick={switchAuthMode} className="text-blue-400 hover:text-blue-300 font-semibold ml-1">{authMode === 'login' ? 'Sign up' : 'Log in'}</button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
