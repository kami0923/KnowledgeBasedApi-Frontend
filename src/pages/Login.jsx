import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import { loginUser, extractErrorMessage } from "../api/authApi.js";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const next = {};
    if (!form.email.trim()) next.email = "Enter your email.";
    if (!form.password) next.password = "Enter your password.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await loginUser(form);
      // Store the JWT for authenticated requests (Documents, Chat, etc.)
      localStorage.setItem("kb_token", result.token);
      localStorage.setItem("kb_user", JSON.stringify({ name: result.name, email: result.email }));
      navigate("/"); // swap for your dashboard route once it exists
    } catch (err) {
      setServerError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      headline="Every document becomes a question you can ask."
      subline="Upload a PDF, a report, a set of notes — and query it in plain language. Your knowledge base, searchable."
    >
      <h2 className="auth-card-title">Welcome back</h2>
      <p className="auth-card-subtitle">Sign in to continue to your documents.</p>

      {serverError && (
        <div className="alert-banner" role="alert">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field-label" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            className="field-input"
            placeholder="you@company.com"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />
          {errors.email && <div className="field-error">{errors.email}</div>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="password">Password</label>
          <div className="password-row">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              className="field-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((s) => !s)}
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>
          {errors.password && <div className="field-error">{errors.password}</div>}
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="auth-switch">
        Don't have an account? <Link to="/signup">Create one</Link>
      </p>

      <p className="divider-note">AES-secured · JWT authenticated</p>
    </AuthLayout>
  );
}
