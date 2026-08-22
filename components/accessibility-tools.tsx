'use client';

import { Accessibility, Captions, Eye, Keyboard, Type, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Preferences = {
  contrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  visualAlerts: boolean;
  captions: boolean;
  textFirst: boolean;
};

const defaultPreferences: Preferences = {
  contrast: false,
  largeText: false,
  reducedMotion: false,
  visualAlerts: true,
  captions: true,
  textFirst: true
};

export function AccessibilityTools() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const loadedPreferences = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem('beacon-accessibility');
      let nextPreferences = defaultPreferences;
      try {
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<Preferences>;
          nextPreferences = Object.keys(defaultPreferences).reduce((result, key) => {
            const preference = key as keyof Preferences;
            return typeof parsed[preference] === 'boolean' ? { ...result, [preference]: parsed[preference] } : result;
          }, defaultPreferences);
        }
      } catch {
        window.localStorage.removeItem('beacon-accessibility');
      }
      loadedPreferences.current = true;
      setPreferences(nextPreferences);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loadedPreferences.current) return;
    const root = document.documentElement;
    root.dataset.contrast = preferences.contrast ? 'high' : 'normal';
    root.dataset.textSize = preferences.largeText ? 'large' : 'normal';
    root.dataset.reducedMotion = preferences.reducedMotion ? 'true' : 'false';
    root.dataset.visualAlerts = preferences.visualAlerts ? 'on' : 'off';
    root.dataset.captions = preferences.captions ? 'on' : 'off';
    root.dataset.textFirst = preferences.textFirst ? 'on' : 'off';
    window.localStorage.setItem('beacon-accessibility', JSON.stringify(preferences));
  }, [preferences]);

  function update(key: keyof Preferences, value: boolean) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="accessibility-tools">
      <details className="accessibility-menu">
        <summary><Accessibility size={17} aria-hidden="true" /><span>Accessibility</span></summary>
        <div className="accessibility-panel" role="group" aria-label="Accessibility controls">
          <div className="accessibility-panel-header"><div><strong>Make Beacon work for you</strong><p>These settings stay on this device. They never affect your fit score.</p></div></div>
          <fieldset className="accessibility-group"><legend><Eye size={15} aria-hidden="true" /> Visual</legend><label className="accessibility-control"><span><strong>High contrast</strong><small>Stronger borders and color separation</small></span><input type="checkbox" checked={preferences.contrast} onChange={(event) => update('contrast', event.target.checked)} /></label><label className="accessibility-control"><span><strong>Larger text</strong><small>Increase the reading size across the app</small></span><input type="checkbox" checked={preferences.largeText} onChange={(event) => update('largeText', event.target.checked)} /></label><label className="accessibility-control"><span><strong>Reduce motion</strong><small>Limit animations and transitions</small></span><input type="checkbox" checked={preferences.reducedMotion} onChange={(event) => update('reducedMotion', event.target.checked)} /></label><label className="accessibility-control"><span><strong>Emphasize visual alerts</strong><small>Make success and error messages easier to spot</small></span><input type="checkbox" checked={preferences.visualAlerts} onChange={(event) => update('visualAlerts', event.target.checked)} /></label></fieldset>
          <fieldset className="accessibility-group"><legend><Captions size={15} aria-hidden="true" /> Hearing</legend><label className="accessibility-control"><span><strong>Caption reminders</strong><small>Show reminders that instructions and feedback are text-based</small></span><input type="checkbox" checked={preferences.captions} onChange={(event) => update('captions', event.target.checked)} /></label>{preferences.captions ? <p className="accessibility-note">Beacon does not require audio-only instructions, phone calls, or video interviews.</p> : null}</fieldset>
          <fieldset className="accessibility-group"><legend><Type size={15} aria-hidden="true" /> Speech and communication</legend><label className="accessibility-control"><span><strong>Text-first communication</strong><small>Keep communication alternatives visible instead of voice-only steps</small></span><input type="checkbox" checked={preferences.textFirst} onChange={(event) => update('textFirst', event.target.checked)} /></label>{preferences.textFirst ? <p className="accessibility-note"><Keyboard size={14} aria-hidden="true" /> You can complete every Beacon task without speaking.</p> : null}</fieldset>
          <div className="accessibility-panel-footer"><Volume2 size={14} aria-hidden="true" /><span>Screen readers, keyboard navigation, captions, and text responses are supported by default.</span></div>
        </div>
      </details>
      <span className="sr-only" aria-live="polite">{preferences.captions && preferences.textFirst ? 'Text instructions and communication alternatives are enabled.' : ''}</span>
    </div>
  );
}
