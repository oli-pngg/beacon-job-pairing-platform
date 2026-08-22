import { ArrowUpRight, Check, ChevronRight, CircleCheck, Eye, Headphones, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { BrandMark } from '@/components/brand-mark';
import { TextToSpeechControls } from '@/components/text-to-speech-controls';

export default function HomePage() {
  return (
    <div className="landing">
      <header className="site-header">
        <BrandMark />
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#standards">Accessibility</a>
          <a href="#research">Research basis</a>
        </nav>
        <div className="header-actions">
          <AccessibilityTools />
          <TextToSpeechControls />
          <Link className="button secondary small header-sign-in" href="/login">Sign in</Link>
          <Link className="button small" href="/register">Create account <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
      </header>

      <main id="main-content">
        <section className="hero">
          <div className="page-width hero-layout">
            <div>
              <p className="kicker">Legazpi City / skills-first employment</p>
              <h1 className="display">A fairer way to find <em>your fit.</em></h1>
              <p className="lede">Beacon pairs persons with visual, hearing, and speech disabilities with employers through verified skills, accessible assessments, and transparent recommendations.</p>
              <div className="hero-actions">
                <Link className="button" href="/register">Start your profile <ChevronRight size={17} aria-hidden="true" /></Link>
                <Link className="button secondary" href="/login">I already have an account</Link>
              </div>
              <p className="hero-note"><ShieldCheck size={18} aria-hidden="true" /> Blind matching keeps disability details out of initial screening.</p>
            </div>
            <div className="hero-visual" aria-label="Illustration showing skills-based matching results" role="img">
              <div className="visual-card tag">Your skills are more than a job title.</div>
              <div className="visual-card main">
                <div className="visual-title"><strong>Match snapshot</strong><small>94%</small></div>
                <div className="meter" aria-hidden="true"><span style={{ width: '94%' }} /></div>
                <div className="skill-line"><span>Data entry</span><strong className="skill-score">verified</strong></div>
                <div className="skill-line"><span>Written communication</span><strong className="skill-score">verified</strong></div>
                <div className="skill-line"><span>Spreadsheets</span><strong className="skill-score">strong</strong></div>
              </div>
              <div className="visual-card secondary">
                <div className="visual-title"><strong>Good work, on your terms.</strong></div>
                <div className="skill-line"><span>Flexible schedule</span><Check size={16} aria-hidden="true" /></div>
                <div className="skill-line"><span>Accessible process</span><Check size={16} aria-hidden="true" /></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="how-it-works">
          <div className="page-width">
            <div className="section-heading">
              <div><p className="eyebrow">The Beacon method</p><h2>Built around what you can do.</h2></div>
              <p>No resume pedigree filter. No inaccessible timed maze. Just a clear route from your strengths to an opportunity.</p>
            </div>
            <div className="feature-grid">
              <article className="feature-card"><span className="feature-number">01</span><h3>Show your strengths</h3><p>Complete an accessible, task-based assessment with keyboard-friendly controls, clear instructions, and accommodation options.</p></article>
              <article className="feature-card"><span className="feature-number">02</span><h3>See the reasoning</h3><p>Every recommendation includes a fit score and the skill overlap behind it, so the result is useful instead of mysterious.</p></article>
              <article className="feature-card"><span className="feature-number">03</span><h3>Choose your next step</h3><p>Browse local openings, apply when ready, and let employers see a skills-first preview before personal details are shared.</p></article>
            </div>
          </div>
        </section>

        <section className="section dark" id="standards">
          <div className="page-width standards-grid">
            <div><p className="eyebrow">Designed for independent use</p><h2>Accessibility is the starting line.</h2><p>Beacon is structured for screen readers, keyboard-only navigation, high contrast, larger text, reduced motion, visible focus, and understandable error recovery. Human testing with assistive technology is still required before claiming formal conformance.</p></div>
            <div className="standard-list" aria-label="Accessibility commitments">
              <div className="standard-row"><strong>Perceivable</strong><span>Meaningful headings, text alternatives, robust color contrast, and status messages that can be announced.</span></div>
              <div className="standard-row"><strong>Operable</strong><span>Every workflow works from the keyboard, has generous targets, and avoids forced time limits.</span></div>
              <div className="standard-row"><strong>Understandable</strong><span>Plain language, labeled form fields, inline guidance, and a real error summary when something fails.</span></div>
              <div className="standard-row"><strong>Robust</strong><span>Semantic HTML and carefully scoped ARIA support current browsers and assistive technologies.</span></div>
            </div>
          </div>
        </section>

        <section className="section" id="research">
          <div className="page-width">
            <div className="section-heading"><div><p className="eyebrow">Thesis alignment</p><h2>From framework to working system.</h2></div><p>The core modules reflect the supplied methodology and conceptual framework.</p></div>
            <div className="feature-grid">
              <article className="feature-card"><span className="feature-number"><Eye size={17} aria-hidden="true" /></span><h3>Blind matching</h3><p>Initial employer previews use a candidate reference, verified skills, and fit score instead of a name or disability label.</p></article>
              <article className="feature-card"><span className="feature-number"><Headphones size={17} aria-hidden="true" /></span><h3>Inclusive assessment</h3><p>Assessment controls are screen-reader friendly and designed without a mandatory countdown, supporting different ways of interacting.</p></article>
              <article className="feature-card"><span className="feature-number"><CircleCheck size={17} aria-hidden="true" /></span><h3>ISO 25010 lens</h3><p>Admin evaluation surfaces functional suitability, performance efficiency, and interaction capability for pilot review.</p></article>
            </div>
          </div>
        </section>
      </main>
      <footer className="landing-footer"><div className="page-width"><Sparkles size={15} aria-hidden="true" /> Beacon is a thesis-ready pilot platform for inclusive employment in Legazpi City, Albay.</div></footer>
    </div>
  );
}
