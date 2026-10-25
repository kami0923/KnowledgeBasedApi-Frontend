import { NavLink, useNavigate } from "react-router-dom";
import { clearSession } from "../api/axiosClient.js";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

// Dark sidebar + scrollable content area, shared by Dashboard and Documents.
export default function AppShell({ user, children }) {
  const navigate = useNavigate();

  function handleLogout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  const navClass = ({ isActive }) => `dash-nav-item${isActive ? " active" : ""}`;

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-brand">KB:// knowledge base</div>

        <nav className="dash-nav">
          <NavLink to="/" end className={navClass}>
            <span className="nav-dot" />
            Dashboard
          </NavLink>

          <NavLink to="/documents" className={navClass}>
            <span className="nav-dot" />
            Documents
          </NavLink>

          <div className="dash-nav-item is-soon">
            <span className="nav-dot" />
            Ask AI
            <span className="dash-nav-tag">soon</span>
          </div>
        </nav>

        <div className="dash-user-card">
          <div className="dash-avatar">{getInitials(user.name)}</div>
          <div className="dash-user-meta">
            <div className="dash-user-name">{user.name}</div>
            <div className="dash-user-email">{user.email}</div>
          </div>
          <button className="dash-logout-btn" onClick={handleLogout} title="Sign out" aria-label="Sign out">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </aside>

      <main className="dash-main">{children}</main>
    </div>
  );
}
