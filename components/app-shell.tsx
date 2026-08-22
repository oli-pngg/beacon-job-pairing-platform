'use client';

import { Accessibility, ClipboardCheck, FilePlus2, LayoutDashboard, ListChecks, Menu, Search, Settings, UsersRound, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Profile, UserRole } from '@/lib/types';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { BrandMark } from '@/components/brand-mark';
import { SignOutButton } from '@/components/sign-out-button';
import { TextToSpeechControls } from '@/components/text-to-speech-controls';

const candidateLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/jobs', label: 'Find work', icon: Search },
  { href: '/assessment', label: 'Skill assessment', icon: ClipboardCheck },
  { href: '/profile', label: 'My profile', icon: Settings }
];

const employerLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/employer/jobs', label: 'My openings', icon: ListChecks },
  { href: '/employer/jobs/new', label: 'Post an opening', icon: FilePlus2 },
  { href: '/employer/candidates', label: 'Candidate matches', icon: UsersRound },
  { href: '/profile', label: 'Organization profile', icon: Settings }
];

const adminLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/evaluation', label: 'Evaluation', icon: Accessibility },
  { href: '/profile', label: 'My profile', icon: Settings }
];

function roleLabel(role: UserRole) {
  if (role === 'employer') return 'Employer workspace';
  if (role === 'admin') return 'Research workspace';
  return 'Candidate workspace';
}

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = profile.role === 'employer' ? employerLinks : profile.role === 'admin' ? adminLinks : candidateLinks;
  const displayName = profile.organization_name || profile.full_name || profile.email;

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;
    const frame = window.requestAnimationFrame(() => main.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div className="app-layout">
      <aside id="primary-navigation" className={`sidebar ${open ? 'open' : ''}`} aria-label="Primary navigation">
        <BrandMark href="/dashboard" />
        <p className="sidebar-role">{roleLabel(profile.role)}</p>
        <nav className="sidebar-nav">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
            return <Link className={active ? 'active' : ''} href={href} key={href} aria-current={active ? 'page' : undefined} onClick={() => setOpen(false)}><Icon size={17} aria-hidden="true" />{label}</Link>;
          })}
        </nav>
        <div className="sidebar-footer">
          <p title={displayName}>{displayName}</p>
          <SignOutButton />
        </div>
      </aside>
      <div className="app-content">
        <header className="app-topbar">
          <div className="inline-actions">
            <button className="icon-button mobile-menu-button" type="button" aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>
              {open ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}<span className="sr-only">{open ? 'Close' : 'Open'} navigation</span>
            </button>
            <span className="breadcrumb">Beacon / {roleLabel(profile.role).replace(' workspace', '')}</span>
          </div>
          <div className="topbar-tools">
            <AccessibilityTools />
            <TextToSpeechControls key={pathname} />
            <span className="status-pill shortlisted"><span aria-hidden="true">●</span> Secure session</span>
          </div>
        </header>
        <main id="main-content" className="page-content" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
