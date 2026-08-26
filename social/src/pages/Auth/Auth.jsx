import React, { useEffect, useState } from "react";
import "./Auth.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { clearUserSession, persistUserSession, getSessionUserId } from "../../utils/session";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import Logo from "../../components/Logo/Logo";

const Auth = () => {
  return (
    <div className="Auth">
      <LogIn />
    </div>
  );
};

const AuthBrand = ({ title, subtitle }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="authBrandCard"
    >
      <div className="brandTop" style={{ marginBottom: "1rem" }}>
        <Logo variant="full" size="large" />
      </div>
      <h2>{title}</h2>
      <p className="brandSubtitle">{subtitle}</p>
    </motion.div>
  );
};

function LogIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendStatus, setResendStatus] = useState({ loading: false, success: false, error: "" });
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect home
    if (getSessionUserId()) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const loginMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await apiFetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        const err = new Error(data.message || "Login failed");
        err.code = data.code;
        err.canResend = data.canResend;
        throw err;
      }
      return data;
    },
    onSuccess: (data) => {
      persistUserSession(data.data || data);
      toast.success("Welcome back!");
      navigate("/home");
    },
    onError: (error) => {
      if (error.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(username.trim());
        toast.error("Please verify your email address to log in.");
      } else {
        toast.error(error.message);
      }
    },
  });

  const handleLogin = (e) => {
    e.preventDefault();
    const normalizedUsername = username.trim();
    if (!normalizedUsername || !password) {
      toast.warn("Username and password are required.");
      return;
    }
    loginMutation.mutate({ username: normalizedUsername, password });
  };

  const handleResendFromLogin = async () => {
    if (!unverifiedEmail) return;
    setResendStatus({ loading: true, success: false, error: "" });
    try {
      const res = await apiFetch("/api/v1/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendStatus({ loading: false, success: true, error: "" });
        toast.success("Verification email sent! Please check your inbox.");
      } else {
        setResendStatus({ loading: false, success: false, error: data.message || "Failed to resend email." });
        toast.error(data.message || "Failed to resend link.");
      }
    } catch {
      setResendStatus({ loading: false, success: false, error: "Network error. Please try again." });
    }
  };

  return (
    <div className="authShell">
      <AuthBrand
        title="Welcome Back"
        subtitle="Catch up with your network, share your story, and keep your world in motion."
      />
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="a-right"
      >
        <form className="infoForm authForm" onSubmit={handleLogin}>
          <h3>Log In</h3>
          <p className="authHint">Log in to continue your FM journey.</p>

          {unverifiedEmail && (
            <div style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
              <div style={{ color: "#f59e0b", fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>
                Email Verification Required
              </div>
              <div style={{ color: "var(--color-text-secondary)", fontSize: "13px", marginBottom: "10px" }}>
                Your account is registered but email address has not been verified yet.
              </div>
              {resendStatus.success ? (
                <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>
                  ✓ Fresh verification email dispatched! Check your inbox.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResendFromLogin}
                  disabled={resendStatus.loading}
                  style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 14px", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}
                >
                  {resendStatus.loading ? "Sending..." : "Resend Verification Link"}
                </button>
              )}
            </div>
          )}

          <div className="inputGroup">
            <label htmlFor="login-username">Username or Email</label>
            <input
              id="login-username"
              type="text"
              placeholder="@username"
              className="infoInput"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="inputGroup">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="infoInput"
              placeholder="Enter your password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="authFooterRow">
            <span className="switchAuthText">
              New on FM? <Link to={"/signup"}>Create account</Link>
            </span>
            <span className="switchAuthText">
              <Link to={"/forgot-password"}>Forgot password?</Link>
            </span>
            <button className="infoButton" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

const SignUp = () => {
  useEffect(() => {
    if (localStorage.getItem("userId")) {
      clearUserSession();
    }
  }, []);

  return (
    <div className="Auth">
      <Authenticate />
    </div>
  );
};

function Authenticate() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const signupMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await apiFetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        if (data.errors && Array.isArray(data.errors)) {
          const formattedErrors = {};
          data.errors.forEach(err => { formattedErrors[err.field] = err.message; });
          const err = new Error(data.message);
          err.isValidation = true;
          err.errors = formattedErrors;
          throw err;
        }
        throw new Error(data.message || "Registration failed");
      }
      return { payload, data };
    },
    onSuccess: async ({ payload }) => {
      toast.success("Account created successfully! Please check your email to verify your account.");
      navigate("/login");
    },
    onError: (error) => {
      if (error.isValidation) {
        setFieldErrors(error.errors);
        toast.error(error.message || "Please fix the validation errors.");
      } else {
        toast.error(error.message || "Network or server error.");
      }
    },
  });

  const handleSignup = (event) => {
    event.preventDefault();
    setFieldErrors({});

    const payload = {
      email: email.trim(),
      username: username.trim(),
      password,
    };

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    signupMutation.mutate(payload);
  };

  return (
    <div className="authShell">
      <AuthBrand
        title="Start Your Story"
        subtitle="Join creators, friends, and communities that make every day feel alive."
      />
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="a-right"
      >
        <form className="infoForm authForm" onSubmit={handleSignup}>
          <h3>Create Account</h3>
          <p className="authHint">Build your profile and start sharing in seconds.</p>

          <div className="inputGroup">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              placeholder="Email address"
              className="infoInput"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {fieldErrors.email && <span className="inlineError" style={{color:"var(--color-error)", fontSize:"0.8rem"}}>{fieldErrors.email}</span>}
          </div>

          <div className="inputGroup">
            <label htmlFor="signup-username">Username</label>
            <input
              id="signup-username"
              type="text"
              className="infoInput"
              name="username"
              placeholder="@username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {fieldErrors.username && <span className="inlineError" style={{color:"var(--color-error)", fontSize:"0.8rem"}}>{fieldErrors.username}</span>}
          </div>

          <div className="splitInput">
            <div className="inputGroup">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                className="infoInput"
                name="password"
                placeholder="At least 8 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password && <span className="inlineError" style={{color:"var(--color-error)", fontSize:"0.8rem"}}>{fieldErrors.password}</span>}
            </div>
            <div className="inputGroup">
              <label htmlFor="signup-confirm-password">Confirm Password</label>
              <input
                id="signup-confirm-password"
                type="password"
                className="infoInput"
                name="confirmPassword"
                placeholder="Repeat"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {fieldErrors.confirmPassword && <span className="inlineError" style={{color:"var(--color-error)", fontSize:"0.8rem"}}>{fieldErrors.confirmPassword}</span>}
            </div>
          </div>

          <div className="authFooterRow">
            <span className="switchAuthText">
              Already on FM? <Link to={"/login"}>Log in</Link>
            </span>
            <button className="infoButton" disabled={signupMutation.isPending}>
              {signupMutation.isPending ? "Signing up..." : "Sign up"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const forgotMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await apiFetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send reset email");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Password reset email sent! Check your inbox.");
      navigate("/login");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="Auth">
      <div className="authShell">
        <AuthBrand title="Reset Password" subtitle="Get back into your account securely." />
        <motion.div className="a-right" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <form className="infoForm authForm" onSubmit={(e) => { e.preventDefault(); forgotMutation.mutate({ email }); }}>
            <h3>Forgot Password</h3>
            <p className="authHint">Enter your email address and we'll send you a link to reset your password.</p>
            <div className="inputGroup">
              <label>Email</label>
              <input type="email" className="infoInput" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="authFooterRow" style={{ marginTop: "1rem" }}>
              <span className="switchAuthText"><Link to="/login">Back to Login</Link></span>
              <button className="infoButton" disabled={forgotMutation.isPending}>
                {forgotMutation.isPending ? "Sending..." : "Send Link"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const { token: routeToken } = useParams();
  const token = routeToken || window.location.pathname.split("/").pop();

  const resetMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await apiFetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to reset password");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Password reset successful! Please log in.");
      navigate("/login");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleReset = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    resetMutation.mutate({ token, newPassword: password });
  };

  return (
    <div className="Auth">
      <div className="authShell">
        <AuthBrand title="New Password" subtitle="Choose a strong password." />
        <motion.div className="a-right" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <form className="infoForm authForm" onSubmit={handleReset}>
            <h3>Reset Password</h3>
            <div className="inputGroup">
              <label>New Password</label>
              <input type="password" className="infoInput" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="inputGroup">
              <label>Confirm Password</label>
              <input type="password" className="infoInput" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="authFooterRow" style={{ marginTop: "1rem" }}>
              <span className="switchAuthText"><Link to="/login">Back to Login</Link></span>
              <button className="infoButton" disabled={resetMutation.isPending}>
                {resetMutation.isPending ? "Resetting..." : "Reset"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export { Auth, SignUp, ForgotPassword, ResetPassword };
