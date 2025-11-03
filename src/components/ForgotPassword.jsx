import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      Swal.fire({
        icon: 'error',
        title: 'Email Required',
        text: 'Please enter your email address',
        confirmButtonColor: '#e51d5e'
      });
      return;
    }

    // Validate email format
    if (!email.toLowerCase().endsWith('@ua.edu.ph')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Email',
        text: 'Please use your UA email address (@ua.edu.ph)',
        confirmButtonColor: '#e51d5e'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://uacs-be.vercel.app'}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      });

      const data = await response.json();

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Email Sent!',
          html: `
            <p>${data.message}</p>
            <p style="margin-top: 10px; color: #666; font-size: 14px;">
              Please check your inbox and spam folder for the password reset link.
            </p>
          `,
          confirmButtonColor: '#e51d5e'
        });
        navigate('/login');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Request Failed',
          text: data.message || 'Failed to send reset email',
          confirmButtonColor: '#e51d5e'
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Failed to connect to server. Please try again.',
        confirmButtonColor: '#e51d5e'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <h1>Reset Password</h1>
          <p>Enter your email address and we'll send you a link to reset your password</p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">
              <FaEnvelope /> Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@ua.edu.ph"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="back-to-login">
          <button onClick={() => navigate('/login')} className="back-btn">
            <FaArrowLeft /> Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
