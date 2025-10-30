import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "./VerifyEmailChange.css";

const VerifyEmailChange = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.post(
          `https://uacs-be.vercel.app/auth/verify-email-change/${token}`
        );

        setMessage(response.data.message);
        setVerifying(false);

        Swal.fire({
          icon: "success",
          title: "Email Changed!",
          text: response.data.message,
          confirmButtonColor: "#e51d5e",
        }).then(() => {
          // Redirect based on user role or to login
          const userRole = localStorage.getItem("userRole");
          if (userRole === "admin") {
            navigate("/admin/settings");
          } else if (userRole === "clinic_staff") {
            navigate("/clinic/settings");
          } else {
            navigate("/login");
          }
        });
      } catch (error) {
        setVerifying(false);
        const errorMessage =
          error.response?.data?.message || "Failed to verify email change";
        setMessage(errorMessage);

        Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text: errorMessage,
          confirmButtonColor: "#e51d5e",
        }).then(() => {
          navigate("/login");
        });
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="verify-email-change-container">
      <div className="verify-email-change-card">
        {verifying ? (
          <>
            <div className="verify-spinner"></div>
            <h2>Verifying Email Change...</h2>
            <p>Please wait while we verify your email change request.</p>
          </>
        ) : (
          <>
            <div className={`verify-icon ${message.includes("success") || message.includes("changed") ? "success" : "error"}`}>
              {message.includes("success") || message.includes("changed") ? "✓" : "✗"}
            </div>
            <h2>{message.includes("success") || message.includes("changed") ? "Success!" : "Verification Failed"}</h2>
            <p>{message}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailChange;
