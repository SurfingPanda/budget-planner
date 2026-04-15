import { useEffect, useState } from 'react';

const STEPS = [
  'Verifying credentials...',
  'Loading your dashboard...',
  'Almost there...',
];

export default function LoginTransition({ userName, onDone }) {
  const [stepIdx, setStepIdx]   = useState(0);
  const [exiting, setExiting]   = useState(false);

  /* cycle through status messages */
  useEffect(() => {
    const t1 = setTimeout(() => setStepIdx(1), 600);
    const t2 = setTimeout(() => setStepIdx(2), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* start exit animation, then hand off */
  useEffect(() => {
    const exit = setTimeout(() => setExiting(true),  1700);
    const done = setTimeout(() => onDone(),           2150);
    return () => { clearTimeout(exit); clearTimeout(done); };
  }, [onDone]);

  const firstName = userName?.split(' ')[0] || 'there';

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center
        bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700
        ${exiting ? 'login-transition-exit' : 'login-transition-overlay'}`}
    >
      {/* background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '1.5s' }} />
        {/* floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-ping-slow"
            style={{
              left:  `${15 + i * 15}%`,
              top:   `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${2 + i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* card */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8">

        {/* logo */}
        <div className="welcome-logo relative">
          <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center shadow-2xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {/* outer ping ring */}
          <div className="absolute inset-0 rounded-3xl bg-white/20 animate-ping" style={{ animationDuration: '1.5s' }} />
        </div>

        {/* welcome text */}
        <div className="welcome-text text-center">
          <p className="text-white/80 text-sm font-medium tracking-widest uppercase mb-1">
            Welcome back
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {firstName}!
          </h1>
        </div>

        {/* status message */}
        <div className="welcome-text h-5">
          <p
            key={stepIdx}
            className="text-indigo-200 text-sm font-medium"
            style={{ animation: 'textRise 0.35s ease both' }}
          >
            {STEPS[stepIdx]}
          </p>
        </div>

        {/* progress bar */}
        <div className="w-64 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full progress-bar-fill" />
        </div>

        {/* dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
