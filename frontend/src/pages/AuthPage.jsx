import { useState } from "react";
import {
  AlertCircle,
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

  function changeMode(nextMode) {
    setErrors({});
    setNotice(null);
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

  function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    // Provide realistic UI feedback and transition to workspace
    setTimeout(() => {
      setIsSubmitting(false);
      localStorage.setItem("researchnest_authenticated", "true");
      const nextParam = searchParams.get("next");
      const target = nextParam ? decodeURIComponent(nextParam) : "/workspace";
      navigate(target);
    }, 450);
  }

  const isRegister = mode === "register";

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
                : "Your next research discovery starts here"}
            </h1>
            <p className="auth-hero-desc">
              Search peer-reviewed literature across disciplines, evaluate
              breakthrough findings, and organize the papers that drive your
              research forward.
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
          </div>

          {/* Form */}
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
                {isRegister && (
                  <span className="auth-label-hint">Min. 8 characters</span>
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

          {/* Validation & Contract Notice Banner */}
          <div
            className={`auth-notice ${notice ? "auth-notice-active" : "auth-notice-static"}`}
            aria-live="polite"
          >
            <Info className="auth-notice-icon" size={16} aria-hidden="true" />
            <div className="auth-notice-text">
              {notice ? (
                <span>{notice.message}</span>
              ) : (
                <span>
                  Backend authentication endpoints are not connected yet. Form
                  submissions validate inputs client-side without creating live
                  sessions.
                </span>
              )}
            </div>
          </div>

          {/* Mode Switch Prompt */}
          <p className="auth-switch-prompt">
            {isRegister ? (
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
