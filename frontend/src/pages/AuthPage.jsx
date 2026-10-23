import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const authModes = new Set(["login", "register", "forgot"]);

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMode = searchParams.get("mode");
  const mode = authModes.has(requestedMode) ? requestedMode : "login";
  const [notice, setNotice] = useState("");

  function changeMode(nextMode) {
    setNotice("");
    const next = searchParams.get("next");
    setSearchParams(next ? { mode: nextMode, next } : { mode: nextMode });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setNotice(
      "Authentication is not connected yet. No account was created and no sign-in was attempted. Please coordinate with Archie to connect the backend authentication contract.",
    );
  }

  const isRegistering = mode === "register";
  const isForgot = mode === "forgot";
  const title = isForgot
    ? "Reset your password"
    : isRegistering
      ? "Create your account"
      : "Welcome back";

  return (
    <section className="auth-page" aria-labelledby="auth-heading">
      <div className="auth-card">
        <p className="section-kicker">ResearchNest workspace</p>
        <h1 id="auth-heading">{title}</h1>
        <p className="auth-intro">
          {isForgot
            ? "Enter your email to request a password reset."
            : isRegistering
              ? "Create an account to prepare for your research workspace."
              : "Sign in to continue to your research workspace."}
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegistering && (
            <label>
              Name
              <input
                autoComplete="name"
                name="name"
                placeholder="Your name"
                required
                type="text"
              />
            </label>
          )}
          <label>
            Email
            <input
              autoComplete="email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </label>
          {!isForgot && (
            <label>
              Password
              <input
                autoComplete={isRegistering ? "new-password" : "current-password"}
                name="password"
                placeholder="Enter your password"
                required
                minLength={isRegistering ? 8 : undefined}
                type="password"
              />
            </label>
          )}
          <button className="button button-primary auth-submit" type="submit">
            {isForgot
              ? "Request reset"
              : isRegistering
                ? "Create account"
                : "Sign In"}
          </button>
        </form>
        <p className="auth-status" aria-live="polite">
          {notice ||
            "Authentication is not connected. Form submission will not sign you in or create an account."}
        </p>
        <div className="auth-links">
          {mode !== "login" && (
            <button type="button" onClick={() => changeMode("login")}>
              Back to Sign In
            </button>
          )}
          {mode === "login" && (
            <>
              <button type="button" onClick={() => changeMode("forgot")}>
                Forgot password?
              </button>
              <span>
                New to ResearchNest?{" "}
                <button type="button" onClick={() => changeMode("register")}>
                  Create an account
                </button>
              </span>
            </>
          )}
          {isRegistering && (
            <span>
              Already have an account?{" "}
              <button type="button" onClick={() => changeMode("login")}>
                Sign In
              </button>
            </span>
          )}
        </div>
        <p className="auth-legal">
          By continuing, you can review our <Link to="/terms">draft terms</Link>{" "}
          and <Link to="/privacy">draft privacy policy</Link>.
        </p>
      </div>
    </section>
  );
}
