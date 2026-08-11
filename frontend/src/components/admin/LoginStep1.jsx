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
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '2.1rem', fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>
          Welcome back
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--ink-dim)', margin: 0, fontWeight: 300 }}>
          Sign in to access YANF Editorial Studio
        </p>
      </div>

      {authError && (
        <div style={{ background: 'rgba(255, 100, 100, 0.12)', border: '1px solid rgba(255, 100, 100, 0.35)', color: '#ff8888', padding: '12px 18px', borderRadius: '20px', marginBottom: '22px', fontSize: '0.85rem', textAlign: 'center' }}>
          ⚠️ {authError}
        </div>
      )}

      <form onSubmit={handleLoginStep1}>
        <div className="liquid-field">
          <div className="liquid-input-wrap">
            <input
              type="text"
              className="liquid-input"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Username"
              required
            />
            <span className="field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </span>
          </div>
        </div>

        <div className="liquid-field" style={{ marginBottom: '28px' }}>
          <div className="liquid-input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              className="liquid-input"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'View password'}
              style={{
                position: 'absolute',
                right: '18px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: showPassword ? 'var(--ice)' : 'var(--ink-dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
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
          {authLoading ? 'Verifying...' : 'Sign In →'}
        </button>
      </form>
    </div>
  );
}
