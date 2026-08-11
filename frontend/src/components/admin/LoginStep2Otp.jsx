import React from 'react';

export default function LoginStep2Otp({
  maskedEmail,
  otpDigits,
  otpInputRefs,
  handleOtpDigitChange,
  handleOtpKeyDown,
  handleOtpPaste,
  handleVerifyOtp,
  authError,
  authLoading,
  onBackToCredentials
}) {
  return (
    <div className="liquid-auth-card">
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '2.1rem', fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>
          Security Passcode
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--ink-dim)', margin: 0, fontWeight: 300 }}>
          Enter 6-digit OTP sent to registered email
        </p>
      </div>

      {authError && (
        <div style={{ background: 'rgba(255, 100, 100, 0.12)', border: '1px solid rgba(255, 100, 100, 0.35)', color: '#ff8888', padding: '12px 18px', borderRadius: '20px', marginBottom: '22px', fontSize: '0.85rem', textAlign: 'center' }}>
          ⚠️ {authError}
        </div>
      )}

      <form onSubmit={handleVerifyOtp}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(143,208,255,0.06)', border: '1px solid rgba(143,208,255,0.18)', borderRadius: '30px', marginBottom: '24px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.85rem' }}>✉️</span>
          <span style={{ fontSize: '0.84rem', color: 'var(--ink)', fontWeight: 400 }}>{maskedEmail}</span>
        </div>

        <div className="liquid-field" style={{ marginBottom: '28px' }}>
          <div className="otp-boxes-wrap" onPaste={handleOtpPaste}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (otpInputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="otp-box-digit"
                value={digit}
                onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="liquid-btn"
          disabled={authLoading}
        >
          {authLoading ? 'Verifying...' : 'Verify & Unlock →'}
        </button>

        <button
          type="button"
          onClick={onBackToCredentials}
          style={{ background: 'none', border: 'none', color: 'var(--ink-dim)', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '20px', width: '100%', cursor: 'pointer', textAlign: 'center' }}
        >
          ← Back to Credentials
        </button>
      </form>
    </div>
  );
}
