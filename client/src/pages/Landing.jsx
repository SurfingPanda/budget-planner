import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

/* ── scroll-reveal hook — re-triggers on scroll up too ── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

/* direction → initial transform */
const DIR = {
  up:    'translateY(48px)',
  down:  'translateY(-48px)',
  left:  'translateX(-48px)',
  right: 'translateX(48px)',
  fade:  'scale(0.94)',
};

function Reveal({ children, direction = 'up', delay = 0, className = '' }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'none' : DIR[direction],
        transition: `opacity 0.65s cubic-bezier(.4,0,.2,1) ${delay}ms,
                     transform 0.65s cubic-bezier(.4,0,.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ── tiny reusable icons ── */
const Icon = ({ d, className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const PATHS = {
  dollar:   'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  chart:    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  shield:   'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  bell:     'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  trending: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  list:     'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  pie:      'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z',
  check:    'M5 13l4 4L19 7',
  arrow:    'M17 8l4 4m0 0l-4 4m4-4H3',
  menu:     'M4 6h16M4 12h16M4 18h16',
  close:    'M6 18L18 6M6 6l12 12',
  star:     'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
};

/* ── animated counter ── */
function Counter({ end, prefix = '', suffix = '', duration = 1800 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ── mock dashboard preview ── */
function DashboardPreview() {
  const bars = [
    { month: 'Nov', income: 65, expense: 45 },
    { month: 'Dec', income: 80, expense: 60 },
    { month: 'Jan', income: 55, expense: 70 },
    { month: 'Feb', income: 90, expense: 50 },
    { month: 'Mar', income: 75, expense: 55 },
    { month: 'Apr', income: 95, expense: 40 },
  ];
  const categories = [
    { name: 'Housing',   pct: 72, color: '#f43f5e' },
    { name: 'Food',      pct: 48, color: '#f97316' },
    { name: 'Transport', pct: 31, color: '#eab308' },
    { name: 'Health',    pct: 20, color: '#ec4899' },
  ];

  return (
    <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-full max-w-lg">
      <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
            <Icon d={PATHS.dollar} className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white text-sm font-semibold">Budget Planner</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
      </div>

      <div className="p-5 space-y-4 bg-gray-50">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Balance', val: '$4,250', color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Income',  val: '$6,800', color: 'text-green-600',  bg: 'bg-green-50'  },
            { label: 'Expense', val: '$2,550', color: 'text-red-500',    bg: 'bg-red-50'    },
          ].map((c) => (
            <div key={c.label} className={`${c.bg} rounded-xl p-3`}>
              <p className="text-[10px] text-gray-500 font-medium">{c.label}</p>
              <p className={`text-sm font-bold ${c.color}`}>{c.val}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] font-semibold text-gray-600 mb-3">Income vs Expenses</p>
          <div className="flex items-end gap-2 h-20">
            {bars.map((b) => (
              <div key={b.month} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex items-end gap-0.5">
                  <div className="flex-1 bg-green-400 rounded-t" style={{ height: `${b.income * 0.7}px` }} />
                  <div className="flex-1 bg-red-400 rounded-t"   style={{ height: `${b.expense * 0.7}px` }} />
                </div>
                <span className="text-[8px] text-gray-400">{b.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] font-semibold text-gray-600 mb-3">Budget Progress</p>
          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                  <span>{c.name}</span><span>{c.pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── feature card ── */
function FeatureCard({ icon, title, desc, gradient }) {
  return (
    <div className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-indigo-100 hover:shadow-lg transition-all duration-300">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${gradient}`}>
        <Icon d={icon} className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── step card ── */
function StepCard({ num, title, desc }) {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-200">
          {num}
        </div>
      </div>
      <div className="pt-1.5">
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ── testimonial ── */
function Testimonial({ name, role, quote, avatar }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Icon key={i} d={PATHS.star} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        ))}
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mb-4">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ background: avatar }}>
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-400">{role}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200">
                <Icon d={PATHS.dollar} className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">Budget<span className="text-indigo-600">Planner</span></span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <a href="#features"     className="text-gray-500 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-500 hover:text-gray-900 transition-colors">How It Works</a>
              <a href="#testimonials" className="text-gray-500 hover:text-gray-900 transition-colors">Reviews</a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Sign In
              </Link>
              <Link to="/register"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
                Get Started Free
              </Link>
            </div>

            <button className="md:hidden text-gray-500" onClick={() => setMobileOpen(!mobileOpen)}>
              <Icon d={mobileOpen ? PATHS.close : PATHS.menu} className="w-6 h-6" />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
            {['#features', '#how-it-works', '#testimonials'].map((href) => (
              <a key={href} href={href}
                className="block text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors py-1"
                onClick={() => setMobileOpen(false)}>
                {href.replace('#', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </a>
            ))}
            <Link to="/register"
              className="block w-full text-center bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg mt-2"
              onClick={() => setMobileOpen(false)}>
              Get Started Free
            </Link>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute top-60 -left-40 w-[400px] h-[400px] bg-violet-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-emerald-100 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">

            {/* left copy */}
            <Reveal direction="left" className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-indigo-100">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                Free & Open Source
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
                Take Control of
                <span className="block mt-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Your Finances
                </span>
              </h1>

              <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Track income and expenses, set smart budgets, and visualize your spending habits — all in one clean, simple dashboard.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link to="/register"
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 duration-200">
                  Start Tracking Free
                  <Icon d={PATHS.arrow} className="w-4 h-4" />
                </Link>
                <a href="#features"
                  className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200">
                  See Features
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4 justify-center lg:justify-start text-xs text-gray-400 font-medium">
                {['No credit card required', 'Setup in 2 minutes', 'Open source'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <Icon d={PATHS.check} className="w-4 h-4 text-green-500" />
                    {t}
                  </div>
                ))}
              </div>
            </Reveal>

            {/* right: mock UI */}
            <Reveal direction="right" delay={150} className="flex-1 flex justify-center lg:justify-end w-full">
              <div className="relative w-full max-w-lg">
                <div className="absolute -top-6 -left-6 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 z-10 border border-gray-100 animate-bounce-slow">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Icon d={PATHS.trending} className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">This month</p>
                    <p className="text-sm font-bold text-green-600">+$1,240 saved</p>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-4 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 z-10 border border-gray-100">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Icon d={PATHS.bell} className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Budget alert</p>
                    <p className="text-sm font-bold text-gray-800">Food 80% used</p>
                  </div>
                </div>
                <DashboardPreview />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-indigo-600 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { label: 'Transactions Tracked', end: 12400, suffix: '+' },
              { label: 'Categories Available', end: 14,    suffix: '' },
              { label: 'Average Savings',       end: 23,   suffix: '%' },
              { label: 'Happy Users',           end: 890,  suffix: '+' },
            ].map(({ label, end, prefix, suffix }, i) => (
              <Reveal key={label} direction="up" delay={i * 80}>
                <p className="text-3xl sm:text-4xl font-extrabold">
                  <Counter end={end} prefix={prefix} suffix={suffix} />
                </p>
                <p className="text-indigo-200 text-sm mt-1 font-medium">{label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal direction="up" className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Features</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">
              Everything you need to manage money
            </h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto text-base">
              A full-featured budget tracker with charts, budgets, categories, and real-time insights — all in one place.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: PATHS.list,     title: 'Transaction Tracking',      gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700',  desc: 'Log every income and expense in seconds. Filter by date, category, or type to see exactly where your money goes.' },
              { icon: PATHS.chart,    title: 'Smart Budget Limits',        gradient: 'bg-gradient-to-br from-violet-500 to-purple-700',  desc: 'Set monthly spending caps per category with visual progress bars. Get instant over-budget alerts.' },
              { icon: PATHS.pie,      title: 'Visual Charts',              gradient: 'bg-gradient-to-br from-emerald-500 to-teal-700',   desc: 'Understand your finances at a glance with bar and pie charts. See 6-month trends and category breakdowns.' },
              { icon: PATHS.trending, title: 'Income & Expense Summary',   gradient: 'bg-gradient-to-br from-orange-400 to-rose-500',    desc: 'Instant dashboard totals for the current month: total income, total expenses, and net balance.' },
              { icon: PATHS.bell,     title: 'Budget Alerts',              gradient: 'bg-gradient-to-br from-pink-500 to-rose-600',      desc: 'Visual warnings highlight categories where you\'ve exceeded your monthly limit so you can course-correct fast.' },
              { icon: PATHS.shield,   title: 'Local & Secure',             gradient: 'bg-gradient-to-br from-blue-500 to-cyan-600',      desc: 'Your data stays on your own server. No third-party cloud, no subscriptions — full privacy, full control.' },
            ].map((f, i) => (
              <Reveal key={f.title} direction="up" delay={i * 80}>
                <FeatureCard {...f} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">

            {/* steps */}
            <div className="flex-1 space-y-10">
              <Reveal direction="left">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">How It Works</span>
                <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">
                  Up and running in minutes
                </h2>
                <p className="mt-3 text-gray-500 text-base">No complicated setup. Start tracking your budget in three easy steps.</p>
              </Reveal>

              <div className="space-y-8">
                {[
                  { num: '1', title: 'Create a Free Account',           desc: 'Sign up in seconds — no credit card required. Add your accounts like cash, bank, e-wallets, and credit cards to get a full picture of your finances.' },
                  { num: '2', title: 'Log Your Transactions',           desc: 'Record income and expenses with a title, amount, category, and account. Edit or delete any entry anytime with one click.' },
                  { num: '3', title: 'Set Budgets & Watch Your Progress', desc: 'Define monthly spending limits per category. Progress bars fill up in real time as you log expenses — get alerted before you go over budget.' },
                ].map((s, i) => (
                  <Reveal key={s.num} direction="left" delay={i * 120}>
                    <StepCard {...s} />
                  </Reveal>
                ))}
              </div>

              <Reveal direction="left" delay={400}>
                <Link to="/register"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 hover:-translate-y-0.5 duration-200">
                  Open the App
                  <Icon d={PATHS.arrow} className="w-4 h-4" />
                </Link>
              </Reveal>
            </div>

            {/* decorative cards */}
            <div className="flex-1 grid grid-cols-2 gap-4 w-full max-w-md">
              {[
                { label: 'Monthly Balance', value: '$4,250', change: '+12%', color: 'indigo',   icon: PATHS.dollar   },
                { label: 'Total Expenses',  value: '$2,550', change: '-8%',  color: 'rose',     icon: PATHS.trending },
                { label: 'Food Budget',     pct: 72,                          color: 'orange',   icon: PATHS.chart    },
                { label: 'Total Income',    value: '$6,800', change: '+5%',  color: 'emerald',  icon: PATHS.trending },
              ].map((c, i) => (
                <Reveal key={i} direction="right" delay={i * 100}>
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-${c.color}-50`}>
                      <Icon d={c.icon} className={`w-5 h-5 text-${c.color}-600`} />
                    </div>
                    <p className="text-xs text-gray-400 font-medium mb-1">{c.label}</p>
                    {c.value && <p className="text-xl font-bold text-gray-900">{c.value}</p>}
                    {c.pct !== undefined && (
                      <>
                        <p className="text-xl font-bold text-gray-900">{c.pct}%</p>
                        <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
                          <div className="h-full rounded-full bg-orange-400" style={{ width: `${c.pct}%` }} />
                        </div>
                      </>
                    )}
                    {c.change && (
                      <p className={`text-xs font-semibold mt-1 ${c.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                        {c.change} vs last month
                      </p>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal direction="up" className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Reviews</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">
              Loved by people who care about money
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Maria Santos', role: 'Freelance Designer',    avatar: 'linear-gradient(135deg,#667eea,#764ba2)', quote: "I finally know where my money goes every month. The budget progress bars keep me accountable — it's the simplest tracker I've ever used." },
              { name: 'James Rivera', role: 'Software Developer',    avatar: 'linear-gradient(135deg,#f093fb,#f5576c)', quote: "Self-hosted, open source, and actually good-looking. I set it up on my local server in 10 minutes. The charts are incredibly useful." },
              { name: 'Clara Nguyen', role: 'Small Business Owner',  avatar: 'linear-gradient(135deg,#4facfe,#00f2fe)', quote: "The category budgets and over-budget alerts are a game changer. I cut my dining expenses by 30% in the first month!" },
            ].map((t, i) => (
              <Reveal key={t.name} direction="up" delay={i * 100}>
                <Testimonial {...t} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        </div>
        <Reveal direction="up" className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Ready to take control of your budget?
          </h2>
          <p className="mt-4 text-indigo-200 text-lg">
            No sign-ups. No subscriptions. Just open the app and start tracking.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register"
              className="flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold px-7 py-3.5 rounded-xl hover:bg-indigo-50 transition-all shadow-xl hover:-translate-y-0.5 duration-200">
              Open Budget Planner
              <Icon d={PATHS.arrow} className="w-4 h-4" />
            </Link>
            <a href="#features"
              className="flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-all duration-200">
              Learn More
            </a>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal direction="up">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Icon d={PATHS.dollar} className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold text-lg">Budget<span className="text-indigo-400">Planner</span></span>
              </div>
              <p className="text-sm text-center">
                Simple. Smart. Free. Start budgeting today.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <a href="#features"     className="hover:text-white transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
                <Link to="/register"    className="hover:text-white transition-colors">Open App</Link>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
              <span>© {new Date().getFullYear()} Budget Planner. All rights reserved.</span>
              <span className="text-gray-500">
                Developed by{' '}
                <span className="text-indigo-400 font-semibold">A.B.L</span>
              </span>
            </div>
          </Reveal>
        </div>
      </footer>
    </div>
  );
}
