import { useState } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Screen, Input, Btn, Notice } from './ui';

export function LoginScreen() {
  const { dispatch } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.login(username, password);
      if (res.success) {
        dispatch({ type: 'LOGIN', user: { user_id: res.user_id, username: res.username, full_name: res.full_name || res.username } });
      } else {
        setError(res.message || 'Invalid credentials.');
      }
    } catch {
      setError('Could not connect to server. Is the API running?');
    }
    setLoading(false);
  };

  return (
    <Screen>
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-0 max-w-sm mx-auto w-full py-16">
        {/* Back to hero */}
        <button
          onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'hero' })}
          className="text-[13px] text-black/40 hover:text-black mb-10 flex items-center gap-1 transition-colors"
        >
          ← Mainframe
        </button>

        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(36px, 6vw, 56px)', letterSpacing: '-0.03em', lineHeight: 1.05 }} className="mb-2">
          Sign in.
        </div>
        <p className="text-[14px] text-black/40 mb-10">Welcome back to Mainframe.</p>

        <div className="flex flex-col gap-6 mb-8">
          <Input label="Username" value={username} onChange={setUsername} placeholder="your_username" />
          <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
        </div>

        {error && <Notice type="error" children={error} />}

        <div className="flex flex-col gap-3 mt-6">
          <Btn onClick={handleLogin} disabled={loading} fullWidth>
            {loading ? 'Signing in…' : 'Sign In →'}
          </Btn>
          <Btn onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'register' })} variant="ghost" fullWidth>
            Create Account
          </Btn>
        </div>
      </div>
    </Screen>
  );
}

export function RegisterScreen() {
  const { dispatch } = useApp();
  const [form, setForm] = useState({ full_name: '', username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await api.register(form.username, form.email, form.password, form.full_name);
      if (res.success) {
        setSuccess('Account created! Sign in below.');
        setTimeout(() => dispatch({ type: 'SET_SCREEN', screen: 'login' }), 1500);
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch {
      setError('Could not connect to server.');
    }
    setLoading(false);
  };

  return (
    <Screen>
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-0 max-w-sm mx-auto w-full py-16">
        <button
          onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'login' })}
          className="text-[13px] text-black/40 hover:text-black mb-10 flex items-center gap-1 transition-colors"
        >
          ← Back to Sign In
        </button>

        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(36px, 6vw, 56px)', letterSpacing: '-0.03em', lineHeight: 1.05 }} className="mb-2">
          Create account.
        </div>
        <p className="text-[14px] text-black/40 mb-10">Join Mainframe Interview Platform.</p>

        <div className="flex flex-col gap-6 mb-8">
          <Input label="Full Name" value={form.full_name} onChange={set('full_name')} placeholder="Ada Lovelace" />
          <Input label="Username" value={form.username} onChange={set('username')} placeholder="ada_lovelace" />
          <Input label="Email" value={form.email} onChange={set('email')} placeholder="ada@example.com" />
          <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" />
          <Input label="Confirm Password" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" />
        </div>

        {error && <Notice type="error" children={error} />}
        {success && <Notice type="success" children={success} />}

        <div className="mt-6">
          <Btn onClick={handleRegister} disabled={loading} fullWidth>
            {loading ? 'Creating…' : 'Create Account →'}
          </Btn>
        </div>
      </div>
    </Screen>
  );
}
