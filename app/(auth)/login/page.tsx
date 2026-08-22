import { Suspense } from 'react';
import { AuthForm } from '@/components/auth-form';

export default function LoginPage() {
  return <Suspense fallback={<AuthLoading />}><AuthForm mode="login" /></Suspense>;
}

function AuthLoading() {
  return <div className="auth-page"><div className="auth-aside" /><main className="auth-main"><div className="auth-card" role="status">Loading secure sign-in...</div></main></div>;
}
