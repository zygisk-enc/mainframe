import { useApp } from '../store';

export function Navbar() {
  const { state, dispatch } = useApp();
  const nav = (screen: any) => dispatch({ type: 'SET_SCREEN', screen });

  return (
    <nav className="fixed top-0 left-0 w-full z-10 flex flex-row justify-between items-center px-5 sm:px-8 py-4 sm:py-5">
      {/* Logo */}
      <div 
        className="flex flex-row items-center gap-3 cursor-pointer"
        onClick={() => nav('hero')}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(19px, 2.5vw, 26px)',
            letterSpacing: '-0.02em',
            color: '#000',
          }}
        >
          Mainframe®
        </span>
        <span
          className="select-none text-black"
          style={{
            fontSize: 'clamp(23px, 2.8vw, 30px)',
            letterSpacing: '-0.02em',
          }}
        >
          ✳︎
        </span>
      </div>

      {/* Conditional Dashboard Link if logged in */}
      {state.user && (
        <button
          onClick={() => nav('dashboard')}
          className="text-[13px] uppercase tracking-widest text-black/40 hover:text-black transition-colors font-medium"
        >
          Dashboard →
        </button>
      )}
    </nav>
  );
}
