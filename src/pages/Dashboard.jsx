import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY, clearSession } from "../api/axiosClient.js";
import { extractDocumentErrorMessage, getDocuments } from "../api/documentApi.js";
import { formatBytes } from "../utils/format.js";

const today = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric"
});

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    if (storedUser) setUser(JSON.parse(storedUser));

    // Live numbers from DocumentController.GetAll
    getDocuments()
      .then(setDocuments)
      .catch((err) => {
        if (err.response?.status === 401) {
          clearSession();
          navigate("/login", { replace: true });
          return;
        }
        setStatsError(extractDocumentErrorMessage(err));
      });
  }, [navigate]);

  if (!user) return null;

  const totalBytes = documents.reduce((sum, d) => sum + d.fileSizeBytes, 0);

  return (
    <AppShell user={user}>
      <div className="dash-topbar">
        <div>
          <div className="dash-welcome-eyebrow">Overview</div>
          <h1 className="dash-welcome-title">Welcome back, {user.name.split(" ")[0]}</h1>
        </div>
        <div className="dash-date">{today}</div>
      </div>

      {statsError && (
        <div className="alert-banner" role="alert">
          {statsError}
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">
            Documents
            <span className="stat-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <div className="stat-value">{documents.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Conversations
            <span className="stat-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <div className="stat-value">0</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Storage used
            <span className="stat-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" strokeLinecap="round" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" strokeLinecap="round" />
              </svg>
            </span>
          </div>
          <div className="stat-value">{formatBytes(totalBytes)}</div>
        </div>
      </div>

      <div className="dash-section-label">Get started</div>
      <div className="panel-card">
        <div className="panel-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {documents.length === 0 ? (
          <>
            <h2 className="empty-title">Upload your first document</h2>
            <p className="empty-sub">
              PDF, DOCX, or TXT — once it's uploaded, you'll be able to ask questions
              and get answers grounded in exactly what you gave it.
            </p>
          </>
        ) : (
          <>
            <h2 className="empty-title">
              {documents.length} document{documents.length === 1 ? "" : "s"} in your knowledge base
            </h2>
            <p className="empty-sub">
              {formatBytes(totalBytes)} stored on the API's file storage. Add another file or manage
              what you've already uploaded.
            </p>
          </>
        )}

        <button type="button" className="btn-ghost" onClick={() => navigate("/documents")}>
          Upload document
        </button>
        <div>
          <span className="panel-badge">POST /api/Document/upload</span>
        </div>
      </div>
    </AppShell>
  );
}
