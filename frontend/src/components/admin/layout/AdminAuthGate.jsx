import React from 'react';
import AdminHeroShowcase from '../AdminHeroShowcase';
import LoginStep1 from '../LoginStep1';
import LoginStep2Otp from '../LoginStep2Otp';

export default function AdminAuthGate({ state }) {
  const {
    loginStep, setLoginStep, usernameInput, setUsernameInput,
    passwordInput, setPasswordInput, showPassword, setShowPassword,
    handleLoginStep1, authError, authLoading, maskedEmail,
    otpDigits, otpInputRefs, handleOtpDigitChange, handleOtpKeyDown,
    handleOtpPaste, handleVerifyOtp
  } = state;

  return (
    <div className="admin-terminal-layout">
      <AdminHeroShowcase />
      
      <div className="admin-right-pane">
        {/* TOP STATUS BAR */}
        <div className="right-pane-top-bar">
          <div className="status-indicator">
            <span className="status-pulse-dot"></span>
            <span className="status-label">SYSTEM ONLINE</span>
          </div>
          <span className="top-bar-divider">•</span>
          <div className="ssl-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            256-BIT ENCRYPTED
          </div>
        </div>

        {/* LOGIN CARD COMPONENT */}
        <div className="auth-card-container">
          {loginStep === 1 ? (
            <LoginStep1
              usernameInput={usernameInput}
              setUsernameInput={setUsernameInput}
              passwordInput={passwordInput}
              setPasswordInput={setPasswordInput}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              handleLoginStep1={handleLoginStep1}
              authError={authError}
              authLoading={authLoading}
            />
          ) : (
            <LoginStep2Otp
              maskedEmail={maskedEmail}
              otpDigits={otpDigits}
              otpInputRefs={otpInputRefs}
              handleOtpDigitChange={handleOtpDigitChange}
              handleOtpKeyDown={handleOtpKeyDown}
              handleOtpPaste={handleOtpPaste}
              handleVerifyOtp={handleVerifyOtp}
              authError={authError}
              authLoading={authLoading}
              onBackToCredentials={() => setLoginStep(1)}
            />
          )}
        </div>

        {/* BOTTOM SECURITY FOOTER */}
        <div className="right-pane-footer">
          <span>🛡️ 2FA OTP Protected</span>
          <span className="foot-sep">•</span>
          <span>📜 Authorized YANF Mentors Only</span>
        </div>
      </div>
    </div>
  );
}
