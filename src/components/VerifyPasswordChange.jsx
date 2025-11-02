import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "./VerifyPasswordChange.css";

const VerifyPasswordChange = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyPassword = async () => {
      try {
        const response = await axios.post(
          `https://uacs-be.vercel.app/api/auth/verify-password-change/${token}`
        );

        setMessage(response.data.message);
        setVerifying(false);

        Swal.fire({
          icon: "success",
          title: "Password Changed!",
          text: "Your password has been successfully changed. Please log in with your new password.",
          confirmButtonColor: "#e51d5e",
        }).then(() => {
          // Clear localStorage and redirect to login
          localStorage.clear();
          navigate("/login");
        });
      } catch (error) {
        setVerifying(false);
        const errorMessage =
          error.response?.data?.message || "Failed to verify password change";
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

    verifyPassword();
  }, [token, navigate]);

  return (
    <div className="verify-password-change-container">
      <div className="verify-password-change-card">
        {verifying ? (
          <>
            <div className="verify-spinner"></div>
            <h2>Verifying Password Change...</h2>
            <p>Please wait while we verify your password change request.</p>
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

export default VerifyPasswordChange;
