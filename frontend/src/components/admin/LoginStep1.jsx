import React from 'react';

export default function LoginStep1({
  usernameInput,
  setUsernameInput,
  passwordInput,
  setPasswordInput,
  showPassword,
  setShowPassword,
  handleLoginStep1,
  authError,
  authLoading
}) {
  return (
    <div className="liquid-auth-card">
      {/* SHIELD CREST EMBLEM BADGE */}
      <div className="card-shield-header">
        <div className="shield-icon-badge">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <span className="shield-tag-text">YANF EDITORIAL GATE</span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.025em', margin: '0 0 8px 0' }}>
          Welcome back
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--ink-dim)', margin: 0, fontWeight: 300 }}>
          Sign in to access YANF Editorial Command Center
        </p>
      </div>

      {authError && (
        <div className="auth-error-banner">
          ⚠️ {authError}
        </div>
      )}

      <form onSubmit={handleLoginStep1}>
        <div className="liquid-field">
          <label className="field-label-text">USERNAME OR EMAIL</label>
          <div className="liquid-input-wrap">
            <input
              type="text"
              className="liquid-input"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="e.g. mentor_alex"
              required
            />
            <span className="field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </span>
          </div>
        </div>

        <div className="liquid-field" style={{ marginBottom: '32px' }}>
          <label className="field-label-text">PASSWORD</label>
          <div className="liquid-input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              className="liquid-input"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'View password'}
              className="field-password-toggle"
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="liquid-btn"
          disabled={authLoading}
        >
          {authLoading ? 'Verifying Credentials...' : 'SIGN IN →'}
        </button>
      </form>
    </div>
  );
}
