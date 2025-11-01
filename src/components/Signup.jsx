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
    role: "",
    course: "",
    yearLevel: "",
    section: "",
    email: "",
    password: "",
    confirmPassword: "",
    emailUpdates: false,
  });

  const [availableCourses, setAvailableCourses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Update available courses when department changes
  useEffect(() => {
    if (form.department) {
      const courses = getCoursesByDepartment(form.department);
      setAvailableCourses(courses);
      // Reset course if it's not available in new department
      if (form.course && !courses.find(c => c.code === form.course)) {
        setForm(prev => ({ ...prev, course: "" }));
      }
    } else {
      setAvailableCourses([]);
    }
  }, [form.department]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === "checkbox" ? checked : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    // Validate email format
    if (!form.email.toLowerCase().endsWith('@ua.edu.ph')) {
      setError("Please use a valid UA email address (@ua.edu.ph)");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        gender: form.gender,
        role: form.role,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        emailUpdates: form.emailUpdates
      };

      // Add academic information if provided
      if (form.course) {
        payload.course = form.course;
        // Auto-populate department from course
        const department = getDepartmentFromCourse(form.course);
        if (department) {
          payload.department = department;
        }
      }
      if (form.yearLevel) {
        payload.yearLevel = parseInt(form.yearLevel);
      }
      if (form.section) {
        payload.section = form.section.trim().toUpperCase();
      }
      // Generate legacy courseYear field for backwards compatibility
      if (form.course && form.yearLevel) {
        payload.courseYear = formatCourseYearSection(form.course, parseInt(form.yearLevel), form.section);
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
        role: "",
        course: "",
        yearLevel: "",
        section: "",
        email: "",
        password: "",
        confirmPassword: "",
        emailUpdates: false,
      });

      // Redirect to signup success page
      navigate('/signup-success');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
      Swal.fire({
        title: "Registration failed",
        text: err.message,
        icon: "error",
      });
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
                <div className="signup-input-container">
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="signup-input signup-select"
                    required
                  >
                    <option value="" disabled>Roles</option>
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                  </select>
                  <FaGraduationCap className="signup-input-icon" />
                  <FaChevronDown className="signup-select-arrow" />
                </div>
              </div>

              {/* Academic Information - Only for Students/Faculty */}
              {form.role && (
                <>
                  {/* Course */}
                  <div className="signup-row">
                    <div className="signup-input-container">
                      <select
                        name="course"
                        value={form.course}
                        onChange={handleChange}
                        className="signup-input signup-select"
                        required
                      >
                        <option value="" disabled>Select Course</option>
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

                  {/* Year Level and Section */}
                  {form.course && (
                    <div className="signup-row">
                      <div className="signup-input-container">
                        <select
                          name="yearLevel"
                          value={form.yearLevel}
                          onChange={handleChange}
                          className="signup-input signup-select"
                          required
                        >
                          <option value="" disabled>Year Level</option>
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
                  )}
                </>
              )}

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
                  Sign in now
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