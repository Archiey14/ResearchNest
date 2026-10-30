import { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../services/authService.js";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const requestedMode = searchParams.get("mode");
  const isRegisterPath =
    location.pathname === "/signup" || location.pathname === "/register";
  const mode = requestedMode
    ? requestedMode === "register"
      ? "register"
      : requestedMode === "forgot"
        ? "forgot"
        : "login"
    : isRegisterPath
      ? "register"
      : "login";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);

  // Inline password reset state
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Done
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotErrors, setForgotErrors] = useState({});
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  // 2FA login verification state
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState("");
  const [twoFactorOtp, setTwoFactorOtp] = useState("");
  const [twoFactorError, setTwoFactorError] = useState(null);
  const [isTwoFactorSubmitting, setIsTwoFactorSubmitting] = useState(false);

  const googleBtnRef = useRef(null);
  const [gisLoaded, setGisLoaded] = useState(false);

  // Load official Google Identity Services script
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setGisLoaded(true);
      return;
    }

    const existingScript = document.getElementById("google-gsi-client");
    if (existingScript) {
      existingScript.addEventListener("load", () => setGisLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGisLoaded(true);
    script.onerror = () => {
      console.warn("Could not load Google Identity Services script.");
    };
    document.head.appendChild(script);
  }, []);

  async function handleGoogleCredential(response) {
    if (!response?.credential) {
      setNotice({
        type: "error",
        text: "No credential received from Google Sign-In.",
      });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);
    try {
      await authService.googleLogin(response.credential);
      const nextParam = searchParams.get("next");
      const target = nextParam ? decodeURIComponent(nextParam) : "/workspace";
      navigate(target);
    } catch (err) {
      setNotice({
        type: "error",
        text: err.message || "Google authentication failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Render Google Identity Services Button when client ID and script are ready
  useEffect(() => {
    if (
      mode === "forgot" ||
      twoFactorRequired ||
      !gisLoaded ||
      !window.google?.accounts?.id ||
      !googleBtnRef.current ||
      !GOOGLE_CLIENT_ID
    ) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
      });

      googleBtnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: mode === "register" ? "signup_with" : "signin_with",
        width: googleBtnRef.current.offsetWidth || 340,
        logo_alignment: "left",
      });
    } catch (err) {
      console.warn("Failed to initialize Google Sign-In button:", err);
    }
  }, [gisLoaded, mode, twoFactorRequired, GOOGLE_CLIENT_ID]);

  function handleGoogleFallbackClick() {
    if (!GOOGLE_CLIENT_ID) {
      setNotice({
        type: "error",
        text: "Google Sign-In requires configuration: set VITE_GOOGLE_CLIENT_ID in frontend/.env and restart Vite.",
      });
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  }

  function handleCancel2fa() {
    setTwoFactorRequired(false);
    setTwoFactorEmail("");
    setTwoFactorOtp("");
    setTwoFactorError(null);
    setNotice(null);
  }

  function changeMode(nextMode) {
    setErrors({});
    setForgotErrors({});
    setNotice(null);
    setTwoFactorRequired(false);
    setTwoFactorEmail("");
    setTwoFactorOtp("");
    setTwoFactorError(null);
    if (nextMode === "forgot") {
      setForgotStep(1);
      if (formData.email) {
        setForgotEmail(formData.email);
      }
    }
    const next = searchParams.get("next");
    const nextQuery = next
      ? `?mode=${nextMode}&next=${encodeURIComponent(next)}`
      : `?mode=${nextMode}`;
    navigate(`/auth${nextQuery}`);
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (notice) {
      setNotice(null);
    }
  }

  function validateForm() {
    const validationErrors = {};
    if (mode === "register" && !formData.name.trim()) {
      validationErrors.name = "Full name is required";
    }
    if (!formData.email.trim()) {
      validationErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      validationErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      validationErrors.password = "Password is required";
    } else if (mode === "register" && formData.password.length < 8) {
      validationErrors.password = "Password must be at least 8 characters";
    }
    return validationErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await authService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      } else {
        const loginResp = await authService.login(formData.email, formData.password);
        if (loginResp?.twoFactorRequired) {
          setTwoFactorRequired(true);
          setTwoFactorEmail(loginResp.email || formData.email);
          setTwoFactorOtp("");
          setTwoFactorError(null);
          setNotice({
            type: "success",
            text: loginResp.message || "A 6-digit verification code has been sent to your email.",
          });
          return;
        }
      }

      const nextParam = searchParams.get("next");
      const target = nextParam ? decodeURIComponent(nextParam) : "/workspace";
      navigate(target);
    } catch (err) {
      setNotice({
        type: "error",
        text: err.message || "Authentication failed. Please check your details and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- 2FA Verification Handler ---

  async function handleVerify2faSubmit(e) {
    e.preventDefault();
    setNotice(null);
    setTwoFactorError(null);

    const cleanOtp = twoFactorOtp.trim();
    if (!cleanOtp) {
      setTwoFactorError("Verification code is required");
      return;
    }
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setTwoFactorError("Please enter the complete 6-digit numeric code");
      return;
    }

    setIsTwoFactorSubmitting(true);

    try {
      await authService.verify2fa(twoFactorEmail.trim(), cleanOtp);
      setTwoFactorOtp("");
      const nextParam = searchParams.get("next");
      const target = nextParam ? decodeURIComponent(nextParam) : "/workspace";
      navigate(target);
    } catch (err) {
      const errMsg = err.message || "Invalid or expired verification code. Please try again.";
      setTwoFactorError(errMsg);
      setNotice({
        type: "error",
        text: errMsg,
      });
    } finally {
      setIsTwoFactorSubmitting(false);
    }
  }

  // --- Password Reset Handlers ---

  async function handleForgotEmailSubmit(e) {
    e.preventDefault();
    setNotice(null);
    const emailTrim = forgotEmail.trim();
    if (!emailTrim) {
      setForgotErrors({ email: "Email address is required" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setForgotErrors({ email: "Please enter a valid email address" });
      return;
    }

    setForgotErrors({});
    setIsForgotSubmitting(true);

    try {
      const resp = await authService.forgotPassword(emailTrim);
      setForgotStep(2);
      setForgotOtp("");
      setNotice({
        type: "success",
        text: resp?.message || "If an account with that email exists, a password reset OTP has been sent.",
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: err.message || "Failed to send password reset code. Please try again later.",
      });
    } finally {
      setIsForgotSubmitting(false);
    }
  }

  async function handleVerifyOtpSubmit(e) {
    e.preventDefault();
    setNotice(null);
    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp) {
      setForgotErrors({ otp: "Verification code is required" });
      return;
    }
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setForgotErrors({ otp: "Please enter the complete 6-digit numeric code" });
      return;
    }

    setForgotErrors({});
    setIsForgotSubmitting(true);

    try {
      await authService.verifyOtp(forgotEmail.trim(), cleanOtp);
      setForgotStep(3);
      setNotice({
        type: "success",
        text: "Code verified! Please create your new password.",
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: err.message || "Invalid or expired verification code. Please try again.",
      });
    } finally {
      setIsForgotSubmitting(false);
    }
  }

  async function handleResendOtp() {
    setNotice(null);
    setIsForgotSubmitting(true);
    try {
      const resp = await authService.forgotPassword(forgotEmail.trim());
      setNotice({
        type: "success",
        text: resp?.message || "A new 6-digit verification code has been dispatched.",
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: err.message || "Failed to resend code. Please try again later.",
      });
    } finally {
      setIsForgotSubmitting(false);
    }
  }

  async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    setNotice(null);
    const errs = {};
    if (!newPassword) {
      errs.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      errs.newPassword = "Password must be at least 8 characters long";
    }

    if (!confirmPassword) {
      errs.confirmPassword = "Confirm password is required";
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errs).length > 0) {
      setForgotErrors(errs);
      return;
    }

    setForgotErrors({});
    setIsForgotSubmitting(true);

    try {
      const resp = await authService.resetPassword(
        forgotEmail.trim(),
        forgotOtp.trim(),
        newPassword
      );
      setForgotStep(4);
      setFormData((prev) => ({ ...prev, email: forgotEmail.trim(), password: "" }));
      setNotice({
        type: "success",
        text: resp?.message || "Password has been reset successfully. You can now log in with your new password.",
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: err.message || "Failed to reset password. Please check your verification code and try again.",
      });
    } finally {
      setIsForgotSubmitting(false);
    }
  }

  const isRegister = mode === "register";
  const isForgot = mode === "forgot";

  return (
    <div className="auth-page" aria-labelledby="auth-heading">
      <div className="auth-container">
        {/* Left Panel: ResearchNest Branding & Floating Research Illustration */}
        <div className="auth-hero-panel">
          <div className="auth-hero-top">
            <Link
              to="/"
              className="auth-brand-kicker"
              title="Back to ResearchNest home"
            >
              <span className="auth-brand-icon">
                <BookOpen size={16} strokeWidth={2.2} />
              </span>
              <span>ResearchNest Workspace</span>
            </Link>

            <h1 className="auth-hero-title">
              {isRegister
                ? "Join the academic discovery platform"
                : isForgot
                  ? "Regain access to your research workspace"
                  : twoFactorRequired
                    ? "Two-factor authentication"
                    : "Your next research discovery starts here"}
            </h1>
            <p className="auth-hero-desc">
              {isForgot
                ? "Reset your password securely with a single-use verification code sent to your registered institutional or personal email."
                : twoFactorRequired
                  ? "Enter the six-digit verification code sent to your registered email to securely access your research workspace."
                  : "Search peer-reviewed literature across disciplines, evaluate breakthrough findings, and organize the papers that drive your research forward."}
            </p>
          </div>

          {/* Tasteful CSS-Based Research Paper Illustration */}
          <div className="auth-hero-illustration" aria-hidden="true">
            <div className="auth-preview-cards">
              <article className="auth-mini-card auth-mini-card-1">
                <div className="auth-mini-card-header">
                  <span className="auth-mini-badge">
                    <Sparkles size={11} /> Artificial Intelligence
                  </span>
                  <span className="auth-mini-metric">98% match</span>
                </div>
                <h3 className="auth-mini-title">
                  Attention Mechanisms in Deep Neural Reasoning
                </h3>
                <p className="auth-mini-author">Vaswani et al. · NeurIPS</p>
              </article>

              <article className="auth-mini-card auth-mini-card-2">
                <div className="auth-mini-card-header">
                  <span className="auth-mini-badge">
                    <BookOpen size={11} /> Neuroscience
                  </span>
                  <span className="auth-mini-saved">Saved to Stack</span>
                </div>
                <h3 className="auth-mini-title">
                  Cortical Mapping of Semantic Memory
                </h3>
                <p className="auth-mini-author">Chen & Albright · Nature</p>
              </article>
            </div>
          </div>

          <div className="auth-hero-footer">
            <div className="auth-benefit-item">
              <CheckCircle2 size={15} className="auth-benefit-check" />
              <span>Semantic paper discovery</span>
            </div>
            <div className="auth-benefit-item">
              <CheckCircle2 size={15} className="auth-benefit-check" />
              <span>Custom reading collections</span>
            </div>
            <div className="auth-benefit-item">
              <CheckCircle2 size={15} className="auth-benefit-check" />
              <span>Distraction-free environment</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Focused Authentication Card */}
        <div className="auth-form-panel">
          <div className="auth-form-header">
            {isForgot ? (
              <>
                <button
                  type="button"
                  className="auth-back-link"
                  onClick={() => changeMode("login")}
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  <span>Back to Sign In</span>
                </button>
                <h2 id="auth-heading" className="auth-card-title">
                  {forgotStep === 1 && "Reset your password"}
                  {forgotStep === 2 && "Enter verification code"}
                  {forgotStep === 3 && "Set new password"}
                  {forgotStep === 4 && "Password reset complete"}
                </h2>
                <p className="auth-card-subtitle">
                  {forgotStep === 1 &&
                    "Enter your account email to receive a 6-digit verification code."}
                  {forgotStep === 2 &&
                    `We sent a 6-digit OTP to ${forgotEmail}. Please enter it below.`}
                  {forgotStep === 3 &&
                    "Create a new password of at least 8 characters."}
                  {forgotStep === 4 &&
                    "Your password has been reset successfully. You can now log in."}
                </p>

                {forgotStep < 4 && (
                  <div
                    className="auth-step-indicator"
                    role="progressbar"
                    aria-label={`Step ${forgotStep} of 3`}
                    aria-valuenow={forgotStep}
                    aria-valuemin="1"
                    aria-valuemax="3"
                  >
                    <div className={`auth-step-pill ${forgotStep >= 1 ? "auth-step-active" : ""}`}>
                      <span className="auth-step-number">1</span>
                      <span className="auth-step-label">Email</span>
                    </div>
                    <div className="auth-step-divider" />
                    <div className={`auth-step-pill ${forgotStep >= 2 ? "auth-step-active" : ""}`}>
                      <span className="auth-step-number">2</span>
                      <span className="auth-step-label">Verify</span>
                    </div>
                    <div className="auth-step-divider" />
                    <div className={`auth-step-pill ${forgotStep >= 3 ? "auth-step-active" : ""}`}>
                      <span className="auth-step-number">3</span>
                      <span className="auth-step-label">Reset</span>
                    </div>
                  </div>
                )}
              </>
            ) : twoFactorRequired ? (
              <>
                <button
                  type="button"
                  className="auth-back-link"
                  onClick={handleCancel2fa}
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  <span>Back to Sign In</span>
                </button>
                <h2 id="auth-heading" className="auth-card-title">
                  Two-factor authentication
                </h2>
                <p className="auth-card-subtitle">
                  We sent a 6-digit verification code to <strong>{twoFactorEmail}</strong>. Please enter it below to complete sign in.
                </p>
              </>
            ) : (
              <>
                <h2 id="auth-heading" className="auth-card-title">
                  {isRegister ? "Create your account" : "Welcome back"}
                </h2>
                <p className="auth-card-subtitle">
                  {isRegister
                    ? "Sign up to start organizing research literature in your personal workspace."
                    : "Sign in to continue to your research workspace and saved papers."}
                </p>

                {/* Segmented Mode Tabs */}
                <div
                  className="auth-mode-tabs"
                  role="tablist"
                  aria-label="Sign in or create account"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={!isRegister}
                    className={`auth-tab ${!isRegister ? "auth-tab-active" : ""}`}
                    onClick={() => changeMode("login")}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isRegister}
                    className={`auth-tab ${isRegister ? "auth-tab-active" : ""}`}
                    onClick={() => changeMode("register")}
                  >
                    Create Account
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Social login and main forms: Only when not in forgot password mode and not in 2FA verification mode */}
          {!isForgot && !twoFactorRequired && (
            <>
              {/* Google Sign-In */}
              <div className="auth-social-container">
                {GOOGLE_CLIENT_ID && gisLoaded ? (
                  <div
                    ref={googleBtnRef}
                    className="auth-google-gis-wrapper"
                    aria-label={isRegister ? "Sign up with Google" : "Sign in with Google"}
                  />
                ) : (
                  <button
                    type="button"
                    className="auth-google-btn"
                    onClick={handleGoogleFallbackClick}
                    disabled={isSubmitting}
                    aria-label={isRegister ? "Sign up with Google" : "Sign in with Google"}
                  >
                    <svg
                      className="auth-google-icon"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      aria-hidden="true"
                    >
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{isRegister ? "Sign up with Google" : "Sign in with Google"}</span>
                  </button>
                )}
              </div>

              <div className="auth-divider" role="separator" aria-label="or continue with email">
                <span className="auth-divider-line" />
                <span className="auth-divider-text">or continue with email</span>
                <span className="auth-divider-line" />
              </div>

              {/* Login / Register Form */}
              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                {isRegister && (
                  <div className="auth-field-group">
                    <label className="auth-field-label" htmlFor="auth-name">
                      Full Name
                    </label>
                    <div
                      className={`auth-input-wrapper ${errors.name ? "auth-input-error" : ""}`}
                    >
                      <User className="auth-input-icon" size={18} aria-hidden="true" />
                      <input
                        id="auth-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="e.g. Marie Curie"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="auth-input"
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? "auth-name-error" : undefined}
                      />
                    </div>
                    {errors.name && (
                      <p id="auth-name-error" className="auth-field-error">
                        <AlertCircle size={13} aria-hidden="true" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>
                )}

                <div className="auth-field-group">
                  <label className="auth-field-label" htmlFor="auth-email">
                    Email Address
                  </label>
                  <div
                    className={`auth-input-wrapper ${errors.email ? "auth-input-error" : ""}`}
                  >
                    <Mail className="auth-input-icon" size={18} aria-hidden="true" />
                    <input
                      id="auth-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@institution.edu"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="auth-input"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "auth-email-error" : undefined}
                    />
                  </div>
                  {errors.email && (
                    <p id="auth-email-error" className="auth-field-error">
                      <AlertCircle size={13} aria-hidden="true" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                <div className="auth-field-group">
                  <div className="auth-label-row">
                    <label className="auth-field-label" htmlFor="auth-password">
                      Password
                    </label>
                    {isRegister ? (
                      <span className="auth-label-hint">Min. 8 characters</span>
                    ) : (
                      <button
                        type="button"
                        className="auth-forgot-link"
                        onClick={() => {
                          setForgotEmail(formData.email || "");
                          setForgotStep(1);
                          setNotice(null);
                          setForgotErrors({});
                          changeMode("forgot");
                        }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div
                    className={`auth-input-wrapper ${errors.password ? "auth-input-error" : ""}`}
                  >
                    <Lock className="auth-input-icon" size={18} aria-hidden="true" />
                    <input
                      id="auth-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isRegister ? "new-password" : "current-password"}
                      placeholder={
                        isRegister
                          ? "Create a secure password"
                          : "Enter your password"
                      }
                      value={formData.password}
                      onChange={handleInputChange}
                      className="auth-input auth-input-has-toggle"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={
                        errors.password ? "auth-password-error" : undefined
                      }
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff size={18} aria-hidden="true" />
                      ) : (
                        <Eye size={18} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="auth-password-error" className="auth-field-error">
                      <AlertCircle size={13} aria-hidden="true" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="button button-primary auth-submit-btn"
                  disabled={isSubmitting}
                >
                  <span>
                    {isSubmitting
                      ? isRegister
                        ? "Creating account..."
                        : "Signing in..."
                      : isRegister
                        ? "Create Account"
                        : "Sign In"}
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </form>
            </>
          )}

          {/* 2FA Login OTP Verification Form */}
          {!isForgot && twoFactorRequired && (
            <form className="auth-form" onSubmit={handleVerify2faSubmit} noValidate>
              <div className="auth-field-group">
                <div className="auth-label-row">
                  <label className="auth-field-label" htmlFor="two-factor-otp">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    className="auth-inline-btn"
                    onClick={handleCancel2fa}
                  >
                    Back to Sign In
                  </button>
                </div>
                <div
                  className={`auth-input-wrapper ${twoFactorError ? "auth-input-error" : ""}`}
                >
                  <input
                    id="two-factor-otp"
                    name="twoFactorOtp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="••••••"
                    value={twoFactorOtp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setTwoFactorOtp(val);
                      if (twoFactorError) setTwoFactorError(null);
                      if (notice) setNotice(null);
                    }}
                    className="auth-input auth-otp-input"
                    aria-invalid={Boolean(twoFactorError)}
                    aria-describedby={twoFactorError ? "two-factor-otp-error" : undefined}
                    autoFocus
                  />
                </div>
                {twoFactorError && (
                  <p id="two-factor-otp-error" className="auth-field-error">
                    <AlertCircle size={13} aria-hidden="true" />
                    <span>{twoFactorError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="button button-primary auth-submit-btn"
                disabled={isTwoFactorSubmitting}
              >
                <span>{isTwoFactorSubmitting ? "Verifying..." : "Verify & Continue"}</span>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </form>
          )}

          {/* Inline Forgot Password Step 1: Email Form */}
          {isForgot && forgotStep === 1 && (
            <form className="auth-form" onSubmit={handleForgotEmailSubmit} noValidate>
              <div className="auth-field-group">
                <label className="auth-field-label" htmlFor="forgot-email">
                  Account Email Address
                </label>
                <div
                  className={`auth-input-wrapper ${forgotErrors.email ? "auth-input-error" : ""}`}
                >
                  <Mail className="auth-input-icon" size={18} aria-hidden="true" />
                  <input
                    id="forgot-email"
                    name="forgotEmail"
                    type="email"
                    autoComplete="email"
                    placeholder="you@institution.edu"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (forgotErrors.email) setForgotErrors((prev) => ({ ...prev, email: undefined }));
                      if (notice) setNotice(null);
                    }}
                    className="auth-input"
                    aria-invalid={Boolean(forgotErrors.email)}
                    aria-describedby={forgotErrors.email ? "forgot-email-error" : undefined}
                    autoFocus
                  />
                </div>
                {forgotErrors.email && (
                  <p id="forgot-email-error" className="auth-field-error">
                    <AlertCircle size={13} aria-hidden="true" />
                    <span>{forgotErrors.email}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="button button-primary auth-submit-btn"
                disabled={isForgotSubmitting}
              >
                <span>{isForgotSubmitting ? "Sending OTP..." : "Send Verification Code"}</span>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </form>
          )}

          {/* Inline Forgot Password Step 2: OTP Verification Form */}
          {isForgot && forgotStep === 2 && (
            <form className="auth-form" onSubmit={handleVerifyOtpSubmit} noValidate>
              <div className="auth-field-group">
                <div className="auth-label-row">
                  <label className="auth-field-label" htmlFor="forgot-otp">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    className="auth-inline-btn"
                    onClick={() => {
                      setForgotStep(1);
                      setNotice(null);
                    }}
                  >
                    Change email
                  </button>
                </div>
                <div
                  className={`auth-input-wrapper ${forgotErrors.otp ? "auth-input-error" : ""}`}
                >
                  <input
                    id="forgot-otp"
                    name="forgotOtp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="••••••"
                    value={forgotOtp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setForgotOtp(val);
                      if (forgotErrors.otp) setForgotErrors((prev) => ({ ...prev, otp: undefined }));
                      if (notice) setNotice(null);
                    }}
                    className="auth-input auth-otp-input"
                    aria-invalid={Boolean(forgotErrors.otp)}
                    aria-describedby={forgotErrors.otp ? "forgot-otp-error" : undefined}
                    autoFocus
                  />
                </div>
                {forgotErrors.otp && (
                  <p id="forgot-otp-error" className="auth-field-error">
                    <AlertCircle size={13} aria-hidden="true" />
                    <span>{forgotErrors.otp}</span>
                  </p>
                )}
                <div className="auth-resend-row">
                  <span>Didn't receive the email?</span>
                  <button
                    type="button"
                    className="auth-inline-btn"
                    onClick={handleResendOtp}
                    disabled={isForgotSubmitting}
                  >
                    {isForgotSubmitting ? "Sending..." : "Resend Code"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="button button-primary auth-submit-btn"
                disabled={isForgotSubmitting}
              >
                <span>{isForgotSubmitting ? "Verifying..." : "Verify Code"}</span>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </form>
          )}

          {/* Inline Forgot Password Step 3: Set New Password */}
          {isForgot && forgotStep === 3 && (
            <form className="auth-form" onSubmit={handleResetPasswordSubmit} noValidate>
              <div className="auth-field-group">
                <div className="auth-label-row">
                  <label className="auth-field-label" htmlFor="forgot-new-password">
                    New Password
                  </label>
                  <span className="auth-label-hint">Min. 8 characters</span>
                </div>
                <div
                  className={`auth-input-wrapper ${forgotErrors.newPassword ? "auth-input-error" : ""}`}
                >
                  <Lock className="auth-input-icon" size={18} aria-hidden="true" />
                  <input
                    id="forgot-new-password"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (forgotErrors.newPassword) setForgotErrors((prev) => ({ ...prev, newPassword: undefined }));
                      if (notice) setNotice(null);
                    }}
                    className="auth-input auth-input-has-toggle"
                    aria-invalid={Boolean(forgotErrors.newPassword)}
                    aria-describedby={forgotErrors.newPassword ? "forgot-new-password-error" : undefined}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
                {forgotErrors.newPassword && (
                  <p id="forgot-new-password-error" className="auth-field-error">
                    <AlertCircle size={13} aria-hidden="true" />
                    <span>{forgotErrors.newPassword}</span>
                  </p>
                )}
              </div>

              <div className="auth-field-group">
                <label className="auth-field-label" htmlFor="forgot-confirm-password">
                  Confirm New Password
                </label>
                <div
                  className={`auth-input-wrapper ${forgotErrors.confirmPassword ? "auth-input-error" : ""}`}
                >
                  <Lock className="auth-input-icon" size={18} aria-hidden="true" />
                  <input
                    id="forgot-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (forgotErrors.confirmPassword) setForgotErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      if (notice) setNotice(null);
                    }}
                    className="auth-input auth-input-has-toggle"
                    aria-invalid={Boolean(forgotErrors.confirmPassword)}
                    aria-describedby={forgotErrors.confirmPassword ? "forgot-confirm-password-error" : undefined}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
                {forgotErrors.confirmPassword && (
                  <p id="forgot-confirm-password-error" className="auth-field-error">
                    <AlertCircle size={13} aria-hidden="true" />
                    <span>{forgotErrors.confirmPassword}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="button button-primary auth-submit-btn"
                disabled={isForgotSubmitting}
              >
                <span>{isForgotSubmitting ? "Resetting Password..." : "Reset Password"}</span>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </form>
          )}

          {/* Inline Forgot Password Step 4: Success Message */}
          {isForgot && forgotStep === 4 && (
            <div className="auth-success-card">
              <div className="auth-success-badge" aria-hidden="true">
                <CheckCircle2 size={32} />
              </div>
              <p style={{ color: "var(--color-ink)", fontWeight: 600, margin: 0 }}>
                You can now sign in to ResearchNest with your updated password.
              </p>
              <button
                type="button"
                className="button button-primary auth-submit-btn"
                onClick={() => changeMode("login")}
              >
                <span>Sign In with New Password</span>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Dynamic Notice / Alert Banner */}
          {notice && (
            <div
              className={`auth-notice ${
                notice.type === "success"
                  ? "auth-notice-active auth-notice-success"
                  : "auth-notice-active auth-notice-error"
              }`}
              aria-live="polite"
            >
              {notice.type === "success" ? (
                <CheckCircle2 className="auth-notice-icon text-success" size={16} aria-hidden="true" />
              ) : (
                <AlertCircle className="auth-notice-icon" size={16} aria-hidden="true" />
              )}
              <div className="auth-notice-text">
                <span>{notice.text || notice.message}</span>
              </div>
            </div>
          )}

          {/* Mode Switch Prompt */}
          <p className="auth-switch-prompt">
            {isForgot ? (
              <>
                Remember your password?{" "}
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => changeMode("login")}
                >
                  Sign In
                </button>
              </>
            ) : twoFactorRequired ? (
              <>
                Need to use a different account?{" "}
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={handleCancel2fa}
                >
                  Return to Sign In
                </button>
              </>
            ) : isRegister ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => changeMode("login")}
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                New to ResearchNest?{" "}
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => changeMode("register")}
                >
                  Create an account
                </button>
              </>
            )}
          </p>

          <p className="auth-legal-note">
            By continuing, you agree to ResearchNest's{" "}
            <Link to="/terms">Terms of Service</Link> and{" "}
            <Link to="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
