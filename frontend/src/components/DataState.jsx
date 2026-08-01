import React from 'react';

/**
 * One place for the loading, error and empty states so they look and behave
 * identically on every screen. Children render only once there is real data.
 */
export default function DataState({ loading, error, empty, emptyMessage = 'Nothing here yet.', emptyIcon = 'inbox', onRetry, children }) {
  if (loading) {
    return (
      <div className="data-state" role="status" aria-live="polite">
        <span className="loading-spinner" />
        <span>Loading…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="data-state data-state--error" role="alert">
        <span className="material-symbols-outlined" aria-hidden="true">error</span>
        <span>{error}</span>
        {onRetry ? (
          <button className="button button-ghost" type="button" onClick={() => onRetry()}>
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="data-state data-state--empty">
        <span className="material-symbols-outlined" aria-hidden="true">{emptyIcon}</span>
        <span>{emptyMessage}</span>
      </div>
    );
  }

  return <>{children}</>;
}

/** Inline banner for action-level failures that should not replace the page. */
export function ErrorNote({ error }) {
  if (!error) return null;
  return (
    <p className="inline-error" role="alert">
      <span className="material-symbols-outlined" aria-hidden="true">error</span>
      {error}
    </p>
  );
}

/** Inline confirmation for a completed action. */
export function SuccessNote({ children }) {
  if (!children) return null;
  return (
    <p className="inline-success" role="status">
      <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
      {children}
    </p>
  );
}
