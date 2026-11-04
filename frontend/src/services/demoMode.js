/**
 * Developer-only shortcuts: fake local admin session, fake "Google" sign-in,
 * one-click "grant admin role" and the master OTP hint.
 *
 * They are OFF by default and can never be active in a production build.
 * To use them locally, run the Vite dev server and add this line to frontend/.env.local:
 *
 *   VITE_ENABLE_DEMO_LOGIN=true
 */
export const DEMO_MODE =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_LOGIN === "true";
