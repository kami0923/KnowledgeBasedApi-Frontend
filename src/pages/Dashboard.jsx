import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument
} from "../api/documentApi.js";
import { extractErrorMessage } from "../api/authApi.js";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
];
const MAX_BYTES = 10 * 1024 * 1024; // matches the backend's 10 MB limit

const STATUS_LABELS = {
  Pending: "Pending",
  Processing: "Processing",
  Ready: "Ready",
  Failed: "Couldn't read"
};

const today = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric"
});

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function typeLabel(contentType) {
  if (contentType === "application/pdf") return "PDF";
  if (contentType.includes("wordprocessingml")) return "DOCX";
  if (contentType.startsWith("text/plain")) return "TXT";
  return "FILE";
}

function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState(null); // { type: "error" | "success", text }

  useEffect(() => {
    const token = localStorage.getItem("kb_token");
    const storedUser = localStorage.getItem("kb_user");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    if (storedUser) setUser(JSON.parse(storedUser));

    async function load() {
      try {
        setDocuments(await getDocuments());
      } catch (err) {
        setMessage({ type: "error", text: extractErrorMessage(err) });
      } finally {
        setLoadingDocs(false);
      }
    }
    load();
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem("kb_token");
    localStorage.removeItem("kb_user");
    navigate("/login", { replace: true });
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setMessage(null);
    setUploading(true);

    const problems = [];
    let readyCount = 0;

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        problems.push(`"${file.name}" isn't supported. Use PDF, DOCX, or TXT.`);
        continue;
      }
      if (file.size === 0) {
        problems.push(`"${file.name}" is empty.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        problems.push(`"${file.name}" is larger than 10 MB.`);
        continue;
      }
      try {
        const created = await uploadDocument(file);
        setDocuments((prev) => [created, ...prev]);

        // "Uploaded" and "readable" are different things: the file can be
        // stored fine and still fail text extraction.
        if (created.status === "Ready") {
          readyCount++;
        } else {
          problems.push(
            `"${file.name}" was uploaded, but its text couldn't be read: ${created.processingError ?? "unknown reason"}`
          );
        }
      } catch (err) {
        problems.push(`"${file.name}": ${extractErrorMessage(err)}`);
      }
    }

    if (problems.length > 0) {
      const prefix = readyCount > 0 ? `${readyCount} uploaded and ready. ` : "";
      setMessage({ type: "error", text: prefix + problems.join(" ") });
    } else {
      setMessage({
        type: "success",
        text: `${readyCount} document${readyCount === 1 ? "" : "s"} uploaded and ready.`
      });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = ""; // allow re-selecting the same file
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    if (!uploading) handleFiles(e.dataTransfer.files);
  }

  async function handleDownload(doc) {
    try {
      const blob = await downloadDocument(doc.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.originalFileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage({ type: "error", text: extractErrorMessage(err) });
    }
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Delete "${doc.title}"? This can't be undone.`)) return;
    try {
      await deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      setMessage({ type: "success", text: "Document deleted." });
    } catch (err) {
      setMessage({ type: "error", text: extractErrorMessage(err) });
    }
  }

  if (!user) return null;

  // Derived values: computed from `documents` on every render, not stored in state.
  const totalBytes = documents.reduce((sum, d) => sum + d.fileSizeBytes, 0);
  const readyCount = documents.filter((d) => d.status === "Ready").length;

  return (
    <div className="dash-shell">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-brand">KB:// knowledge base</div>

        <nav className="dash-nav">
          <div className="dash-nav-item active">
            <span className="nav-dot" />
            Dashboard
          </div>
          <div className="dash-nav-item">
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

      {/* Main */}
      <main className="dash-main">
        <div className="dash-topbar">
          <div>
            <div className="dash-welcome-eyebrow">Overview</div>
            <h1 className="dash-welcome-title">Welcome back, {user.name.split(" ")[0]}</h1>
          </div>
          <div className="dash-date">{today}</div>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Documents</div>
            <div className="stat-value">{documents.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ready for AI</div>
            <div className="stat-value">{readyCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Storage used</div>
            <div className="stat-value">{formatBytes(totalBytes)}</div>
          </div>
        </div>

        {message && (
          <div
            className={`alert-banner ${message.type === "success" ? "alert-banner-success" : ""}`}
            role="alert"
          >
            {message.text}
          </div>
        )}

        <div className="dash-section-label">Upload</div>
        <div
          className={`dropzone ${dragActive ? "active" : ""} ${uploading ? "uploading" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !uploading) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <div className="panel-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="empty-title">
            {uploading ? "Uploading and reading…" : "Drop files here, or click to browse"}
          </h2>
          <p className="empty-sub" style={{ marginBottom: 0 }}>
            PDF, DOCX, or TXT, up to 10 MB each.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            style={{ display: "none" }}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        <div className="dash-section-label">Your documents</div>
        <div className="doc-list">
          {loadingDocs ? (
            <div className="doc-empty">Loading documents…</div>
          ) : documents.length === 0 ? (
            <div className="doc-empty">No documents yet. Upload your first one above.</div>
          ) : (
            documents.map((doc) => (
              <div className="doc-row" key={doc.id}>
                <div className="doc-type">{typeLabel(doc.contentType)}</div>

                <div className="doc-info">
                  <div className="doc-title">{doc.title}</div>
                  <div className="doc-meta">
                    {formatBytes(doc.fileSizeBytes)} · {formatDate(doc.uploadedAt)}
                    {doc.status === "Ready" && doc.extractedCharacterCount != null && (
                      <> · {doc.extractedCharacterCount.toLocaleString()} characters</>
                    )}
                  </div>
                  {doc.status === "Failed" && doc.processingError && (
                    <div className="doc-error">{doc.processingError}</div>
                  )}
                </div>

                <StatusBadge status={doc.status} />

                <div className="doc-actions">
                  <button className="icon-btn" title="Download" aria-label="Download" onClick={() => handleDownload(doc)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button className="icon-btn danger" title="Delete" aria-label="Delete" onClick={() => handleDelete(doc)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}