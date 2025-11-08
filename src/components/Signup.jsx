import React, { useState, useEffect } from "react";
import "./Signup.css";
import Swal from "sweetalert2";
import { publicApiFetch } from "../api";
import { 
  FaUser,
  FaEnvelope, 
  FaIdCard, 
  FaLock, 
  FaBell,
  FaVenusMars,
  FaGraduationCap,
  FaChevronDown,
  FaEye,
  FaEyeSlash
} from "react-icons/fa";
import uacsLogo from "../assets/uacs logo.png";
import { useNavigate } from "react-router-dom";
import { COURSES, getDepartmentFromCourse, YEAR_LEVELS } from "../constants/academic";
import { formatCourseYearSection } from "../utils/formatAcademic";

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    course: "",
    yearLevel: "",
    section: "",
    department: "",
    email: "",
    password: "",
    confirmPassword: "",
    emailUpdates: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [detectedRole, setDetectedRole] = useState(null); // 'student' or 'faculty'

  // UA Departments
  const DEPARTMENTS = [
    "College of Accountancy",
    "College of Hospitality and Tourism Management",
    "School of Business and Public Administration",
    "Institute of Theology and Religious Studies",
    "School of Education",
    "College of Nursing and Pharmacy",
    "School of Arts and Sciences",
    "College of Engineering and Architecture",
    "College of Information Technology"
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === "checkbox" ? checked : value 
    });

    // Detect role from email in real-time
    if (name === 'email') {
      const emailLower = value.toLowerCase().trim();
      if (emailLower.includes('.student@ua.edu.ph')) {
        setDetectedRole('student');
      } else if (emailLower.endsWith('@ua.edu.ph') && emailLower.length > '@ua.edu.ph'.length) {
        setDetectedRole('faculty');
      } else {
        setDetectedRole(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    const passwordErrors = [];
    if (form.password.length < 8) {
      passwordErrors.push("at least 8 characters");
    }
    if (!/[A-Z]/.test(form.password)) {
      passwordErrors.push("one uppercase letter");
    }
    if (!/[a-z]/.test(form.password)) {
      passwordErrors.push("one lowercase letter");
    }
    if (!/[0-9]/.test(form.password)) {
      passwordErrors.push("one number");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)) {
      passwordErrors.push("one special character");
    }
    
    if (passwordErrors.length > 0) {
      setError(`Password must contain: ${passwordErrors.join(", ")}`);
      return;
    }

    // Validate email format
    if (!form.email.toLowerCase().endsWith('@ua.edu.ph')) {
      setError("Please use a valid UA email address (@ua.edu.ph)");
      return;
    }

    // Role-specific validation
    const emailLower = form.email.toLowerCase().trim();
    const isStudent = emailLower.includes('.student@ua.edu.ph');
    const isFaculty = emailLower.endsWith('@ua.edu.ph') && !isStudent;

    if (isStudent) {
      if (!form.course || !form.yearLevel) {
        setError("Students must select a course and year level");
        return;
      }
    } else if (isFaculty) {
      if (!form.department) {
        setError("Faculty must select a department");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        gender: form.gender,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        emailUpdates: form.emailUpdates
      };

      // Add fields based on role
      if (isStudent) {
        // Student: Add course, yearLevel, section (department auto-calculated on backend)
        payload.course = form.course;
        payload.yearLevel = parseInt(form.yearLevel);
        if (form.section) {
          payload.section = form.section.trim().toUpperCase();
        }
        // Generate legacy courseYear field for backwards compatibility
        payload.courseYear = formatCourseYearSection(form.course, parseInt(form.yearLevel), form.section);
      } else if (isFaculty) {
        // Faculty: Add department only
        payload.department = form.department;
      }

      const data = await publicApiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (!data) {
        throw new Error("Registration failed");
      }

      // Clear form
      setForm({
        firstName: "",
        lastName: "",
        gender: "",
        course: "",
        yearLevel: "",
        section: "",
        department: "",
        email: "",
        password: "",
        confirmPassword: "",
        emailUpdates: false,
      });
      setDetectedRole(null);

      // Redirect to signup success page
      navigate('/signup-success');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
      
      // Show more helpful error message for duplicate email
      if (err.message && err.message.toLowerCase().includes('already registered')) {
        Swal.fire({
          title: "Email Already Registered",
          html: `
            <p>This email is already registered in the system.</p>
            <p><strong>If this is your account:</strong></p>
            <ul style="text-align: left; padding-left: 2rem;">
              <li>Check your email inbox for the verification link</li>
              <li>Check your spam/junk folder</li>
              <li>Go to Login page if you've already verified</li>
            </ul>
            <p>Need help? Contact the clinic for assistance.</p>
          `,
          icon: "info",
          confirmButtonText: "Go to Login",
          showCancelButton: true,
          cancelButtonText: "Close"
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/login');
          }
        });
      } else {
        Swal.fire({
          title: "Registration failed",
          text: err.message,
          icon: "error",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="signup-bg">
      <div className="signup-container">
        <div className="signup-left">
          <h1 className="uacs-logo">UACS</h1>
          <p className="uacs-tagline">University of the Assumption Clinic System</p>
        </div>
        <div className="signup-right">
          <div className="signup-form-container">
            <div className="signup-logo-placeholder">
              <img 
                src={uacsLogo} 
                alt="UACS Logo" 
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain"
                }}
              />
            </div>
            <form className="signup-form" onSubmit={handleSubmit}>
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
              <div className="signup-row">
                <div className="signup-input-container">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={form.firstName}
                    onChange={handleChange}
                    className="signup-input"
                    required
                  />
                  <FaUser className="signup-input-icon" />
                </div>
                <div className="signup-input-container">
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={form.lastName}
                    onChange={handleChange}
                    className="signup-input"
                    required
                  />
                  <FaUser className="signup-input-icon" />
                </div>
              </div>
              <div className="signup-row">
                <div className="signup-input-container">
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="signup-input signup-select"
                    required
                  >
                    <option value="" disabled>Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <FaVenusMars className="signup-input-icon" />
                  <FaChevronDown className="signup-select-arrow" />
                </div>
              </div>

              {/* Email field with helper text */}
              <div className="signup-row">
                <div className="signup-input-container">
                  <input
                    type="email"
                    name="email"
                    placeholder="School email (ua.edu.ph)"
                    value={form.email}
                    onChange={handleChange}
                    className="signup-input"
                    required
                  />
                  <FaEnvelope className="signup-input-icon" />
                </div>
              </div>
              <div style={{
                fontSize: "0.75rem",
                color: detectedRole === 'student' ? '#10b981' : detectedRole === 'faculty' ? '#3b82f6' : '#64748b',
                marginTop: "-0.75rem",
                marginBottom: "0.75rem",
                textAlign: "center",
                fontWeight: detectedRole ? '600' : '400'
              }}>
                {detectedRole === 'student' && '✓ Student account detected'}
                {detectedRole === 'faculty' && '✓ Faculty account detected'}
                {!detectedRole && 'Your role (Student/Faculty) will be automatically determined from your email'}
              </div>

              {/* Dynamic fields based on detected role */}
              {detectedRole === 'student' && (
                <>
                  {/* Course - For Students */}
                  <div className="signup-row">
                    <div className="signup-input-container">
                      <select
                        name="course"
                        value={form.course}
                        onChange={handleChange}
                        className="signup-input signup-select"
                        required
                      >
                        <option value="" disabled>Select Course *</option>
                        {COURSES.map((course) => (
                          <option key={course.code} value={course.code}>
                            {course.code} - {course.name}
                          </option>
                        ))}
                      </select>
                      <FaGraduationCap className="signup-input-icon" />
                      <FaChevronDown className="signup-select-arrow" />
                    </div>
                  </div>

                  {/* Year Level and Section - For Students */}
                  <div className="signup-row">
                    <div className="signup-input-container">
                      <select
                        name="yearLevel"
                        value={form.yearLevel}
                        onChange={handleChange}
                        className="signup-input signup-select"
                        required
                      >
                        <option value="" disabled>Year Level *</option>
                        {YEAR_LEVELS.map((year) => (
                          <option key={year.value} value={year.value}>
                            {year.label}
                          </option>
                        ))}
                      </select>
                      <FaGraduationCap className="signup-input-icon" />
                      <FaChevronDown className="signup-select-arrow" />
                    </div>
                    <div className="signup-input-container">
                      <input
                        type="text"
                        name="section"
                        placeholder="Section (optional, e.g., A, B, 1)"
                        value={form.section}
                        onChange={handleChange}
                        className="signup-input"
                        maxLength="2"
                      />
                      <FaGraduationCap className="signup-input-icon" />
                    </div>
                  </div>
                </>
              )}

              {detectedRole === 'faculty' && (
                <>
                  {/* Department - For Faculty */}
                  <div className="signup-row">
                    <div className="signup-input-container">
                      <select
                        name="department"
                        value={form.department}
                        onChange={handleChange}
                        className="signup-input signup-select"
                        required
                      >
                        <option value="" disabled>Select Department *</option>
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                      <FaGraduationCap className="signup-input-icon" />
                      <FaChevronDown className="signup-select-arrow" />
                    </div>
                  </div>
                </>
              )}

              {/* Password Fields */}
              <div className="signup-row">
                <div className="signup-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    className="signup-input"
                    required
                  />
                  <FaLock className="signup-input-icon" />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <div className="signup-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="signup-input"
                    required
                  />
                  <FaLock className="signup-input-icon" />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              
              {error && error.includes("Password must contain") && (
                <div className="password-requirements">
                  <small>Password must contain:</small>
                  <ul>
                    <li>At least 8 characters</li>
                    <li>One uppercase letter (A-Z)</li>
                    <li>One lowercase letter (a-z)</li>
                    <li>One number (0-9)</li>
                    <li>One special character (!@#$%^&*)</li>
                  </ul>
                </div>
              )}

              <div className="signup-row-checkbox">
                <label className="signup-checkbox-label">
                  <input
                    type="checkbox"
                    name="emailUpdates"
                    checked={form.emailUpdates}
                    onChange={handleChange}
                    className="signup-checkbox"
                  />
                  I would like to receive email updates and notifications from the School Clinic.
                </label>
              </div>
              <button type="submit" className="signup-btn" disabled={submitting}>
                {submitting ? "Creating account..." : "Create Account"}
              </button>
              <div style={{
                textAlign: "center",
                marginTop: "1.5rem",
                color: "#64748b",
                fontSize: "0.875rem"
              }}>
                Already have an account?{" "}
                <span
                  onClick={() => navigate('/login')}
                  style={{
                    cursor: "pointer",
                    color: "#e51d5e",
                    fontWeight: "600",
                    transition: "color 0.2s ease"
                  }}
                  className="signup-link"
                >
                  Login now
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;