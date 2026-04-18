import { useEffect, useState } from 'react';

const FLOAT_ICONS = [
  { icon: '$',  x: '18%', y: '22%', delay: 0,    dur: 1.8 },
  { icon: '₱',  x: '72%', y: '18%', delay: 0.3,  dur: 2.1 },
  { icon: '€',  x: '85%', y: '60%', delay: 0.1,  dur: 1.6 },
  { icon: '£',  x: '12%', y: '70%', delay: 0.5,  dur: 2.3 },
  { icon: '₩',  x: '55%', y: '80%', delay: 0.2,  dur: 1.9 },
  { icon: '%',  x: '40%', y: '15%', delay: 0.4,  dur: 2.0 },
];

export default function LandingTransition({ origin, onDone }) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 360);
    const t2 = setTimeout(() => onDone(), 950);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden landing-ripple-overlay pointer-events-none">
      {/* Expanding ripple circle */}
      <div
        className="absolute w-12 h-12 rounded-full landing-ripple-circle"
        style={{
          left:       origin?.x ?? '50%',
          top:        origin?.y ?? '50%',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6d28d9 100%)',
        }}
      />

      {/* Floating currency symbols */}
      {showContent && FLOAT_ICONS.map((f, i) => (
        <div
          key={i}
          className="absolute text-white/20 font-bold select-none"
          style={{
            left:            f.x,
            top:             f.y,
            fontSize:        `${1.4 + (i % 3) * 0.6}rem`,
            animation:       `rippleCoinFloat ${f.dur}s ease-in-out ${f.delay}s infinite alternate`,
            animationDelay:  `${f.delay}s`,
          }}
        >
          {f.icon}
        </div>
      ))}

      {/* Center content */}
      {showContent && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
          {/* Logo */}
          <div className="landing-ripple-logo relative">
            <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl border border-white/20">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-white/10 animate-ping" style={{ animationDuration: '1.2s' }} />
          </div>

          {/* Text */}
          <div className="landing-ripple-text text-center">
            <p className="text-white font-extrabold text-2xl tracking-tight">BudgetPlanner</p>
            <p className="text-indigo-200 text-sm font-medium mt-1 tracking-wide">Smart money, smarter life.</p>
          </div>

          {/* Progress dots */}
          <div className="landing-ripple-text flex gap-2 mt-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
