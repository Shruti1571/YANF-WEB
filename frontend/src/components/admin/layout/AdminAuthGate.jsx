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
    </div>
  );
}
