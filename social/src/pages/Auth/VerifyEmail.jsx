import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, AlertCircle, Clock, ArrowLeft, Loader2 } from "lucide-react";
import { apiFetch } from "../../utils/api";
import Logo from "../../components/Logo/Logo";
import "./Auth.css";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | success | already_verified | expired | invalid
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState({ loading: false, success: false, error: "" });

  // Prevent React 18 Strict Mode double-mount from calling the one-time verify API twice
  const verifyCalledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setMessage("Verification token is missing.");
      return;
    }

    if (verifyCalledRef.current) return;
    verifyCalledRef.current = true;

    const verifyToken = async () => {
      try {
        const response = await apiFetch(`/api/v1/auth/verify-email/${token}`);
        const data = await response.json();

        if (response.ok && data.success) {
          if (data.code === "ALREADY_VERIFIED") {
            setStatus("already_verified");
            setMessage(data.message || "Your email address is already verified.");
          } else {
            setStatus("success");
            setMessage(data.message || "Your email address has been verified successfully!");
          }
        } else {
          if (data.code === "TOKEN_EXPIRED") {
            setStatus("expired");
            setMessage(data.message || "This verification link has expired.");
          } else if (data.code === "ALREADY_VERIFIED") {
            setStatus("already_verified");
            setMessage(data.message || "Your email is already verified.");
          } else {
            setStatus("invalid");
            setMessage(data.message || "Invalid or broken verification link.");
          }
        }
      } catch (err) {
        setStatus("invalid");
        setMessage("Could not connect to authentication server. Please try again later.");
      }
    };

    verifyToken();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setResendStatus({ loading: true, success: false, error: "" });
    try {
      const res = await apiFetch("/api/v1/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim() })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResendStatus({ loading: false, success: true, error: "" });
      } else {
        setResendStatus({ loading: false, success: false, error: data.message || "Failed to resend verification link." });
      }
    } catch {
      setResendStatus({ loading: false, success: false, error: "Network error. Please try again." });
    }
  };

  return (
    <div className="auth-container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)" }}>
      <div className="glass-card" style={{ maxWidth: "480px", width: "90%", textAlign: "center", padding: "40px 32px", borderRadius: "16px" }}>
        
        {/* BRANDING */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
          <Logo size="normal" />
        </div>

        {/* LOADING STATE */}
        {status === "loading" && (
          <div style={{ padding: "30px 0" }}>
            <Loader2 size={48} color="var(--color-primary)" style={{ margin: "0 auto 16px", display: "block", animation: "spin 1s linear infinite" }} />
            <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px", color: "var(--color-text)" }}>Verifying Email Address</h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Please wait while we validate your token...</p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === "success" && (
          <div>
            <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "50%", width: "72px", height: "72px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <CheckCircle size={40} color="#10b981" />
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "12px", color: "var(--color-text)" }}>Account Verified!</h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: "1.6", marginBottom: "28px" }}>{message}</p>
            <button onClick={() => navigate("/")} className="infoButton" style={{ width: "100%", padding: "12px", fontSize: "15px" }}>
              Continue to Login
            </button>
          </div>
        )}

        {/* ALREADY VERIFIED STATE */}
        {status === "already_verified" && (
          <div>
            <div style={{ background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "50%", width: "72px", height: "72px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <CheckCircle size={40} color="#6366f1" />
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "12px", color: "var(--color-text)" }}>Already Verified</h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: "1.6", marginBottom: "28px" }}>{message}</p>
            <button onClick={() => navigate("/")} className="infoButton" style={{ width: "100%", padding: "12px", fontSize: "15px" }}>
              Sign In to Your Account
            </button>
          </div>
        )}

        {/* EXPIRED TOKEN STATE */}
        {status === "expired" && (
          <div>
            <div style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "50%", width: "72px", height: "72px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Clock size={40} color="#f59e0b" />
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "12px", color: "var(--color-text)" }}>Link Expired</h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
              This verification link has expired (links are valid for 24 hours). Enter your email address below to receive a new link.
            </p>

            {resendStatus.success ? (
              <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "14px", borderRadius: "8px", color: "#10b981", fontSize: "14px", marginBottom: "20px" }}>
                A fresh verification link has been sent to your email!
              </div>
            ) : (
              <form onSubmit={handleResend} style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="infoInput"
                  required
                />
                {resendStatus.error && (
                  <div style={{ color: "#ef4444", fontSize: "13px" }}>{resendStatus.error}</div>
                )}
                <button type="submit" className="infoButton" disabled={resendStatus.loading} style={{ width: "100%", padding: "12px", fontSize: "15px" }}>
                  {resendStatus.loading ? "Sending..." : "Resend Verification Link"}
                </button>
              </form>
            )}

            <Link to="/" style={{ color: "var(--color-text-secondary)", fontSize: "14px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        )}

        {/* INVALID TOKEN STATE */}
        {status === "invalid" && (
          <div>
            <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "50%", width: "72px", height: "72px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <AlertCircle size={40} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "12px", color: "var(--color-text)" }}>Invalid Verification Link</h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: "1.6", marginBottom: "28px" }}>{message}</p>
            <Link to="/" className="infoButton" style={{ display: "inline-block", textDecoration: "none", width: "100%", boxSizing: "border-box", padding: "12px", fontSize: "15px", textAlign: "center" }}>
              Return to Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
