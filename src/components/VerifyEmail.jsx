import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './VerifyEmail.css';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

const VerifyEmail = () => {
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing');
      return;
    }

    verifyEmail(token);
  }, [location]);

  const verifyEmail = async (token) => {
    try {
      console.log('Attempting to verify email with token:', token);
      
      const response = await fetch('https://uacs-be.vercel.app/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        credentials: 'include'
      });

      const data = await response.json();
      console.log('Verification response:', data);

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully. You can now log in.');
        
        // Store the verified email in localStorage
        if (data.email) {
          localStorage.setItem('verifiedEmail', data.email);
          localStorage.setItem('verificationTime', new Date().toLocaleString());
        }
        
        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              verifiedEmail: data.email,
              message: 'Email verified successfully! Please log in.'
            }
          });
        }, 3000);
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage(
        error.message === 'Failed to fetch' 
          ? 'Could not connect to the server. Please try again.'
          : error.message || 'Failed to verify email. Please try again.'
      );
    }
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        {status === 'verifying' && (
          <>
            <FaSpinner className="spinner" />
            <h1>Verifying Your Email</h1>
            <p>Please wait while we verify your email address...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="success-icon">
              <FaCheckCircle />
            </div>
            <h1>Email Verified!</h1>
            <p>{message}</p>
            <button className="goto-login-btn" onClick={goToLogin}>
              Go to Login
            </button>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="error-icon">
              <FaExclamationTriangle />
            </div>
            <h1>Verification Failed</h1>
            <p>{message}</p>
            <button className="goto-login-btn" onClick={goToLogin}>
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;