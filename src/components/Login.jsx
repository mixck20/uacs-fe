import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUserAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import { setAuthToken } from "../api";

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: localStorage.getItem('verifiedEmail') || "",
    password: "",
    remember: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(localStorage.getItem('verifiedEmail') ? "Email verified successfully! Please log in." : "");
  const [resendStatus, setResendStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setResendStatus("");
    
    try {
      const response = await fetch("https://uacs-be.vercel.app/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      const { token, user } = data;
      
      // Always store the token in localStorage for persistence
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      // Call onLogin with the user's role
      onLogin(user.role);
      
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear verification data after showing success message
  React.useEffect(() => {
    if (success) {
      localStorage.removeItem('verifiedEmail');
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="login-container">
      <div className="login-left">
        <h1 className="uacs-logo">UACS</h1>
        <p className="uacs-tagline">University of the Assumption Clinic System</p>
      </div>
      <div className="login-right">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <div style={{
              width: "80px",
              height: "80px",
              margin: "0 auto 1.5rem",
              background: "#f8fafc",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px dashed #e2e8f0"
            }}>
              Logo
            </div>
          </div>
          
          {success && (
            <div style={{ 
              color: "#059669", 
              marginBottom: "1rem", 
              fontSize: "0.875rem", 
              textAlign: "center",
              padding: "0.75rem",
              background: "#ecfdf5",
              borderRadius: "8px",
              border: "1px solid #a7f3d0"
            }}>
              {success}
            </div>
          )}

          {error && (
            <div style={{ 
              color: "#e11d48", 
              marginBottom: "1rem", 
              fontSize: "0.875rem", 
              textAlign: "center",
              padding: "0.75rem",
              background: "#fff1f2",
              borderRadius: "8px",
              border: "1px solid #fecdd3"
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-group">
              <FaEnvelope className="input-icon" />
              <input
                className="form-input with-icon"
                type="email"
                name="email"
                placeholder="Enter your UA email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                className="form-input with-icon"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
              />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-password">
              Forgot password?
            </a>
          </div>

          <button 
            className="login-btn" 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{
            textAlign: "center",
            marginTop: "1.5rem",
            color: "#64748b",
            fontSize: "0.875rem"
          }}>
            Don&apos;t have an account?{" "}
            <span
              onClick={() => navigate('/signup')}
              style={{
                cursor: "pointer",
                color: "#e51d5e",
                fontWeight: "600",
                transition: "color 0.2s ease"
              }}
              className="signup-link"
            >
              Sign up now
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;