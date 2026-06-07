/**
 * ui.tsx — Reusable Mainframe-styled UI components.
 * Black/white, Helvetica, minimal, editorial.
 */

import { type ReactNode, useState } from 'react';

// ── LAYOUT ─────────────────────────────────────────────────────────────────

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`fixed inset-0 z-20 bg-white flex flex-col overflow-y-auto ${className}`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  return (
    <div className="px-6 sm:px-10 pt-8 pb-6 border-b border-black/8">
      {onBack && (
        <button
          onClick={onBack}
          className="text-[13px] text-black/50 hover:text-black mb-4 flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>
      )}
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(28px, 5vw, 52px)',
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          color: '#000',
        }}
      >
        {title}
      </div>
      {subtitle && (
        <p className="mt-2 text-[14px] text-black/50 leading-snug">{subtitle}</p>
      )}
    </div>
  );
}

export function NavBar({
  username,
  onNavigate,
  onLogout,
}: {
  username: string;
  onNavigate: (s: any) => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'Dashboard', screen: 'dashboard' },
    { label: 'Interview', screen: 'interview_setup' },
    { label: 'History', screen: 'history' },
    { label: 'Analytics', screen: 'analytics' },
    { label: 'Learn', screen: 'recommendations' },
    { label: 'Profile', screen: 'profile' },
  ];

  return (
    <nav
      className="sticky top-0 z-30 bg-white border-b border-black/8 flex items-center justify-between px-6 sm:px-10 py-4"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Logo */}
      <span
        style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', letterSpacing: '-0.02em' }}
        className="text-black cursor-pointer"
        onClick={() => onNavigate('dashboard')}
      >
        Mainframe®
      </span>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-6">
        {links.map((l) => (
          <button
            key={l.screen}
            onClick={() => onNavigate(l.screen)}
            className="text-[14px] text-black/60 hover:text-black transition-colors"
          >
            {l.label}
          </button>
        ))}
        <span className="text-[13px] text-black/30 ml-2">{username}</span>
        <button
          onClick={onLogout}
          className="text-[13px] text-black/50 hover:text-black underline underline-offset-2 transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Mobile hamburger */}
      <button className="md:hidden flex flex-col gap-[5px]" onClick={() => setOpen(!open)}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="block w-5 h-[1.5px] bg-black transition-all duration-200" />
        ))}
      </button>

      {/* Mobile menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-black/10 flex flex-col px-6 py-6 gap-4 md:hidden">
          {links.map((l) => (
            <button
              key={l.screen}
              onClick={() => { onNavigate(l.screen); setOpen(false); }}
              className="text-[20px] text-left text-black hover:opacity-60 transition-opacity"
            >
              {l.label}
            </button>
          ))}
          <button onClick={onLogout} className="text-[18px] text-left text-black/50 underline">
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}

// ── INPUTS ─────────────────────────────────────────────────────────────────

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] uppercase tracking-widest text-black/50">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-b border-black/20 focus:border-black outline-none py-2 text-[16px] bg-transparent text-black placeholder:text-black/25 transition-colors"
        style={{ fontFamily: 'var(--font-body)' }}
      />
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] uppercase tracking-widest text-black/50">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-b border-black/20 focus:border-black outline-none py-2 text-[16px] bg-transparent text-black transition-colors appearance-none cursor-pointer"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

// ── BUTTONS ────────────────────────────────────────────────────────────────

export function Btn({
  children,
  onClick,
  variant = 'black',
  disabled = false,
  fullWidth = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'black' | 'white' | 'ghost';
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const base = 'inline-flex items-center justify-center rounded-full px-6 py-2.5 text-[14px] transition-all duration-200 cursor-pointer whitespace-nowrap';
  const variants = {
    black: 'bg-black text-white hover:bg-black/80',
    white: 'bg-white text-black border border-black/15 hover:bg-black hover:text-white',
    ghost: 'bg-transparent text-black border border-black/20 hover:border-black',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {children}
    </button>
  );
}

// ── SCORE BAR ──────────────────────────────────────────────────────────────

export function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round((value / 10) * 100);
  return (
    <div className="mb-4">
      <div className="flex justify-between text-[13px] mb-1.5">
        <span className="text-black/60">{label}</span>
        <span className="font-medium text-black">{value.toFixed(2)}<span className="text-black/30">/10</span></span>
      </div>
      <div className="h-[3px] bg-black/8 rounded-full overflow-hidden">
        <div
          className="h-full bg-black rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── CARD ───────────────────────────────────────────────────────────────────

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border border-black/8 p-5 ${className}`}>
      {children}
    </div>
  );
}

// ── LOADING ────────────────────────────────────────────────────────────────

export function Loading({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
      <span className="text-[13px] text-black/40 tracking-wider uppercase">{text}</span>
    </div>
  );
}

// ── ERROR / INFO ───────────────────────────────────────────────────────────

export function Notice({
  type = 'info',
  children,
}: {
  type?: 'info' | 'error' | 'success' | 'warn';
  children: ReactNode;
}) {
  const colors = {
    info: 'border-black/20 bg-black/3',
    error: 'border-red-300 bg-red-50 text-red-800',
    success: 'border-green-300 bg-green-50 text-green-800',
    warn: 'border-yellow-300 bg-yellow-50 text-yellow-800',
  };
  return (
    <div className={`border-l-2 px-4 py-3 text-[14px] leading-relaxed ${colors[type]}`}>
      {children}
    </div>
  );
}

// ── METRIC ─────────────────────────────────────────────────────────────────

export function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-black/8 p-4">
      <div className="text-[11px] uppercase tracking-widest text-black/40 mb-1">{label}</div>
      <div className="text-[28px] font-medium text-black leading-none" style={{ fontFamily: 'var(--font-heading)' }}>
        {value}
      </div>
    </div>
  );
}
