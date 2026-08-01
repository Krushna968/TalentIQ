import React from 'react';
import SpaceFabric from './SpaceFabric.jsx';
import TopNav from './TopNav.jsx';

/** Standard page frame: background, navigation, and a titled header block. */
export default function PageShell({ role = 'candidate', eyebrow, title, description, actions, children, wide = false }) {
  return (
    <div className="space-page module-page">
      <SpaceFabric className="page-fabric" />
      <TopNav role={role} />
      <main className={`content-wrap page-layout${wide ? ' page-layout--wide' : ''}`}>
        {(title || eyebrow) && (
          <header className="glass-panel page-header">
            <div>
              {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
              {title ? <h1>{title}</h1> : null}
              {description ? <p>{description}</p> : null}
            </div>
            {actions ? <div className="page-header-actions">{actions}</div> : null}
          </header>
        )}
        {children}
      </main>
    </div>
  );
}

/** A titled content section with the shared glass treatment. */
export function Section({ title, description, actions, children, className = '' }) {
  return (
    <section className={`glass-panel page-section ${className}`.trim()}>
      {(title || actions) && (
        <div className="page-section-head">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p className="muted">{description}</p> : null}
          </div>
          {actions ? <div className="page-section-actions">{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

/** Compact labelled statistic used across dashboards. */
export function Stat({ label, value, hint, tone }) {
  return (
    <article className={`stat-tile${tone ? ` stat-tile--${tone}` : ''}`}>
      <span className="stat-tile-label">{label}</span>
      <strong className="stat-tile-value">{value}</strong>
      {hint ? <span className="stat-tile-hint">{hint}</span> : null}
    </article>
  );
}

/** Horizontal 0-100 meter with an accessible text equivalent. */
export function Meter({ label, value = 0, max = 100, detail, tone = 'gold' }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  return (
    <div className="meter">
      <div className="meter-head">
        <span className="meter-label">{label}</span>
        <span className="meter-value">
          {Math.round(value)}
          <span className="muted">/{max}</span>
        </span>
      </div>
      <div
        className="meter-track"
        role="meter"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <span className={`meter-fill meter-fill--${tone}`} style={{ width: `${pct}%` }} />
      </div>
      {detail ? <p className="meter-detail">{detail}</p> : null}
    </div>
  );
}
