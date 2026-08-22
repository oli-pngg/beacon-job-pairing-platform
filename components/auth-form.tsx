'use client';

import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { BrandMark } from '@/components/brand-mark';
import { TextToSpeechControls } from '@/components/text-to-speech-controls';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type AuthMode = 'login' | 'register';
type Role = 'candidate' | 'employer';

function safeNext(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

function friendlyAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('rate limit') || normalized.includes('too many') || normalized.includes('email rate')) {
    return 'Too many attempts were made from this device. Please wait a few minutes, then try again. This safety limit protects every Beacon account.';
  }
  if (normalized.includes('invalid login credentials')) {
    return 'The email or password is incorrect. Check both fields and try again.';
  }
  if (normalized.includes('user already registered')) {
    return 'This email already has an account. Choose Sign in instead.';
  }
  return message;
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('candidate');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!isSupabaseConfigured()) {
      setError('This deployment is not connected to Supabase yet. Add the public environment variables from .env.example, then try again.');
      return;
    }
    if (mode === 'register' && !fullName.trim()) {
      setError('Enter your name to create the account.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address to continue.');
      return;
    }
    if (password.length < 6) {
      setError('Use a password with at least 6 characters.');
      return;
    }

    setPending(true);
    const supabase = createSupabaseBrowserClient();
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName.trim(), role } } });

    if (result.error) {
      setError(friendlyAuthError(result.error.message));
      setPending(false);
      return;
    }

    if (mode === 'register' && !result.data.session) {
      setError('Email confirmation is still enabled in Supabase. Turn off Confirm email in Authentication > Providers > Email, then create the account again.');
      setPending(false);
      return;
    }

    window.location.assign(safeNext(searchParams.get('next')));
  }

  const isLogin = mode === 'login';

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <BrandMark />
        <div className="auth-copy">
          <p className="eyebrow">{isLogin ? 'Welcome back' : 'A place to begin'}</p>
          <h1>{isLogin ? 'Pick up where your skills left off.' : 'Bring your strengths into focus.'}</h1>
          <p>{isLogin ? 'Your recommendations, applications, and progress stay in your account.' : 'Create a private profile, complete a flexible assessment, and find opportunities that meet you where you are.'}</p>
          <ul className="auth-points">
            <li><CheckCircle2 size={17} aria-hidden="true" /> Your account data is scoped to your authenticated user.</li>
            <li><CheckCircle2 size={17} aria-hidden="true" /> Employers receive skills-first previews before personal details.</li>
            <li><CheckCircle2 size={17} aria-hidden="true" /> Keyboard navigation and visible focus are built in.</li>
          </ul>
        </div>
        <p className="small-text" style={{ color: '#88ada9' }}><LockKeyhole size={14} aria-hidden="true" /> Protected account access</p>
      </aside>
      <main className="auth-main" id="main-content">
        <div className="auth-main-inner">
          <div className="auth-accessibility"><AccessibilityTools /><TextToSpeechControls /></div>
          <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-switch" aria-label="Account actions">
            <Link className={isLogin ? 'active' : ''} href="/login">Sign in</Link>
            <Link className={!isLogin ? 'active' : ''} href="/register">Create account</Link>
          </div>
           <h1 id="auth-title" tabIndex={-1}>{isLogin ? 'Sign in' : 'Create account'}</h1>
           <p id="auth-description">{isLogin ? 'Enter your email and password to continue.' : 'Enter your name, choose an account type, and create a password. No extra verification step is needed when Confirm email is disabled in Supabase.'}</p>
           <form className="form-stack" onSubmit={submit} noValidate>
             {!isLogin ? <div className="field"><label htmlFor="full-name">Your name</label><input className="input" id="full-name" name="fullName" autoComplete="name" autoFocus required value={fullName} onChange={(event) => setFullName(event.target.value)} /></div> : null}
             {!isLogin ? <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}><legend>Account type</legend><div className="role-grid"><div className="role-option"><input id="role-candidate" name="role" type="radio" value="candidate" checked={role === 'candidate'} onChange={() => setRole('candidate')} /><label htmlFor="role-candidate"><strong>Find work</strong><span>I am a job seeker.</span></label></div><div className="role-option"><input id="role-employer" name="role" type="radio" value="employer" checked={role === 'employer'} onChange={() => setRole('employer')} /><label htmlFor="role-employer"><strong>Hire inclusively</strong><span>I represent an organization.</span></label></div></div></fieldset> : null}
             <div className="field"><label htmlFor="email">Email address</label><input className="input" id="email" name="email" type="email" autoComplete="email" inputMode="email" autoFocus={isLogin} required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
            <div className="field"><label htmlFor="password">Password</label><div style={{ position: 'relative' }}><input className="input" style={{ paddingRight: 48 }} id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} /><button className="icon-button" style={{ position: 'absolute', top: 2, right: 2, width: 42, height: 42, border: 0 }} type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}</button></div><small>At least 12 characters. Never reuse a work password.</small></div>
            {error ? <div className="form-error" role="alert">{error}</div> : null}
            <button className="button" type="submit" disabled={pending}>{pending ? 'Working...' : isLogin ? 'Sign in' : 'Create my account'} <ArrowRight size={17} aria-hidden="true" /></button>
          </form>
          <p className="auth-footer">By using Beacon, you agree to take part in a skills-first pilot. This platform does not guarantee employment.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
