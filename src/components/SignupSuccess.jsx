import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './SignupSuccess.css';
import { FaCheckCircle, FaEnvelope, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const SignupSuccess = () => {
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      // Get token from URL params
      const params = location.pathname.split('/verify/');
      const token = params[1];
      
      if (token) {
        await verifyEmail(token);
      }
    };

    init();
  }, [location.pathname]);

  const verifyEmail = async (token) => {
    try {
      setVerificationStatus('verifying');
      setErrorMessage('');

      const response = await fetch('https://uacs-be.vercel.app/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        setVerificationStatus('verified');
        if (data.email) {
          localStorage.setItem('verifiedEmail', data.email);
        }
      } else {
        console.error('Verification failed:', data.message);
        setVerificationStatus('error');
        setErrorMessage(data.message || 'Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      setErrorMessage('Connection error. Please try again later.');
    }
  };

  const onGoToLogin = () => {
    navigate('/login', { 
      state: { 
        verifiedEmail: localStorage.getItem('verifiedEmail'),
        message: 'Email verified successfully! Please log in.'
      }
    });
  };
  const getStepStatus = (stepId) => {
    switch (stepId) {
      case 'signup':
      case 'sent':
        return true;
      case 'verify':
      case 'ready':
        return verificationStatus === 'verified';
      default:
        return false;
    }
  };

  const steps = [
    { id: 'signup', label: 'Sign Up' },
    { id: 'sent', label: 'Email Sent' },
    { id: 'verify', label: 'Email Verification' },
    { id: 'ready', label: 'Ready to Login' }
  ];

  // Helper function to determine which status message to show
  const getStatusMessage = () => {
    if (verificationStatus === 'verifying') {
      return "Verifying your email...";
    } else if (verificationStatus === 'verified') {
      return "Registration Complete!";
    } else if (verificationStatus === 'error') {
      return "Email Verification Failed";
    }
    return "Registration Successful!";
  };

  return (
    <div className="signup-success-container">
      <div className="signup-success-card">
        <div className="verification-steps">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`step ${getStepStatus(step.id) ? 'completed' : ''}`}>
                <div className="step-icon">
                  {getStepStatus(step.id) ? (
                    <FaCheckCircle className="check-icon" />
                  ) : verificationStatus === 'verifying' && step.id === 'verify' ? (
                    <FaSpinner className="spinner" />
                  ) : (
                    <div className="step-circle"></div>
                  )}
                </div>
                <div className="step-label">{step.label}</div>
              </div>
              {index < steps.length - 1 && <div className={`step-connector ${getStepStatus(step.id) ? 'completed' : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className={verificationStatus === 'error' ? 'error-icon' : 'success-icon'}>
          {verificationStatus === 'verified' ? (
            <FaCheckCircle className="check-icon" />
          ) : verificationStatus === 'error' ? (
            <FaExclamationTriangle />
          ) : verificationStatus === 'verifying' ? (
            <FaSpinner className="spinner" />
          ) : (
            <FaEnvelope className="email-icon" />
          )}
        </div>

        <h1>{getStatusMessage()}</h1>

        <div className="verification-info">
          {verificationStatus === 'verified' ? (
            <>
              <p>Your registration is now complete and your email has been verified.</p>
              <p>You can now log in to your account.</p>
              <button 
                className="goto-login-btn verified" 
                onClick={onGoToLogin}
              >
                Go to Login
              </button>
            </>
          ) : verificationStatus === 'error' ? (
            <>
              <p className="error-message">{errorMessage}</p>
              <p>Please try clicking the link in your email again or contact support if the problem persists.</p>
            </>
          ) : verificationStatus === 'verifying' ? (
            <p>Please wait while we verify your email address...</p>
          ) : (
            <>
              <p>We've sent a verification link to your email address.</p>
              <p>Please check your inbox and click the link to verify your account.</p>
              <div className="note-box">
                <p><strong>Note:</strong> You won't be able to login until your email is verified.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupSuccess;