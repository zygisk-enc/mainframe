import { useEffect, useState } from 'react';
import { useTypewriter } from '../hooks/useTypewriter';
import { useApp } from '../store';

const TYPEWRITER_TEXT =
  'Step into the future of career readiness. Precision evaluation meets real-time feedback. Now, what role are we mastering?';

const whitePills = [
  'Explore Roles',
  'AI Evaluation',
  'Real-time Feedback',
  'Practice History',
];

export function Hero() {
  const { state, dispatch } = useApp();
  const { displayed, done } = useTypewriter({ text: TYPEWRITER_TEXT });
  const [pillsVisible, setPillsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPillsVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  const handleStartInterview = () => {
    if (state.user) {
      dispatch({ type: 'SET_SCREEN', screen: 'dashboard' });
    } else {
      dispatch({ type: 'SET_SCREEN', screen: 'login' });
    }
  };

  return (
    <section className="relative z-[1] h-screen flex flex-col justify-end md:justify-center pb-20 md:pb-0 px-5 sm:px-8 md:px-10 overflow-hidden">
      <div className="max-w-xl relative z-10">
        {/* Typewriter text */}
        <p
          className="text-black mb-5 sm:mb-6"
          style={{
            fontSize: 'clamp(18px, 4vw, 26px)',
            lineHeight: 1.35,
            fontWeight: 400,
            minHeight: '54px',
          }}
        >
          {displayed}
          {!done && (
            <span
              className="cursor-blink inline-block w-[2px] bg-black align-middle ml-[2px]"
              style={{ height: '1.1em' }}
            />
          )}
        </p>

        {/* Pill buttons */}
        <div
          className="flex flex-wrap gap-2"
          style={{
            opacity: pillsVisible ? 1 : 0,
            transform: pillsVisible ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          {whitePills.map((label) => (
            <button
              key={label}
              onClick={handleStartInterview}
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[12px] sm:text-[15px] px-3 sm:px-5 py-2 hover:bg-black hover:text-white transition-colors duration-200 whitespace-nowrap"
            >
              {label}
            </button>
          ))}

          {/* START INTERVIEW — navigates into the app */}
          <button
            onClick={handleStartInterview}
            className="inline-flex items-center justify-center bg-black text-white rounded-full text-[12px] sm:text-[15px] px-4 sm:px-6 py-2 gap-2 hover:bg-white hover:text-black border border-black transition-colors duration-200 whitespace-nowrap"
          >
            Start Interview →
          </button>
        </div>
      </div>

      {/* Footer links */}
      <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-4 md:right-5 flex flex-col items-end gap-1 z-10">
        <a 
          href="https://github.com/zygisk-enc" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[11px] uppercase tracking-widest text-black/30 hover:text-black transition-colors"
        >
          Source Code
        </a>
        <a 
          href="https://motionsites.ai/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[11px] uppercase tracking-widest text-black/30 hover:text-black transition-colors"
        >
          Credit: Motion Sites
        </a>
      </div>
    </section>
  );
}
