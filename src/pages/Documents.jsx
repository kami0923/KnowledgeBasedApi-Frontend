import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY, clearSession } from "../api/axiosClient.js";
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
  deleteDocument,
  downloadDocument,
  extractDocumentErrorMessage,
  getDocuments,
  uploadDocument
} from "../api/documentApi.js";
import { formatBytes, formatUploadedAt } from "../utils/format.js";

function fileTypeLabel(contentType) {
  if (contentType === "application/pdf") return "PDF";
  if (contentType === "text/plain") return "TXT";
  if (contentType?.includes("wordprocessingml")) return "DOCX";
  return "FILE";
}

export default function Documents() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    if (storedUser) setUser(JSON.parse(storedUser));
    loadDocuments();
  }, [navigate]);

  async function loadDocuments() {
    setLoading(true);
    try {
      const list = await getDocuments();
      setDocuments(list);
      setError("");
    } catch (err) {
      if (err.response?.status === 401) {
        handleSessionExpired();
        return;
      }
      setError(extractDocumentErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleSessionExpired() {
    clearSession();
    navigate("/login", { replace: true });
  }

  function pickFile(file) {
    if (!file) return;
    setSuccess("");

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setSelectedFile(null);
      setError("Only PDF, DOCX, and TXT files are supported.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setError(`File exceeds the ${MAX_FILE_SIZE_LABEL} size limit.`);
      return;
    }

    setError("");
    setSelectedFile(file);
  }

  function handleFileChange(e) {
    pickFile(e.target.files?.[0]);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  function resetPicker() {
    setSelectedFile(null);
    setTitle("");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedFile) {
      setError("Choose a file to upload.");
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const created = await uploadDocument({
        file: selectedFile,
        title,
        onProgress: setProgress
      });

      setDocuments((prev) => [created, ...prev]);
      setSuccess(`${created.originalFileName} uploaded to your knowledge base.`);
      resetPicker();
    } catch (err) {
      if (err.response?.status === 401) {
        handleSessionExpired();
        return;
      }
      setError(extractDocumentErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(doc) {
    setError("");
    setSuccess("");
    setBusyId(doc.id);
    try {
      await downloadDocument(doc);
    } catch (err) {
      if (err.response?.status === 401) {
        handleSessionExpired();
        return;
      }
      setError(extractDocumentErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Delete "${doc.originalFileName}"? The stored file is removed too.`)) return;

    setError("");
    setSuccess("");
    setBusyId(doc.id);
    try {
      await deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      setSuccess(`${doc.originalFileName} deleted.`);
    } catch (err) {
      if (err.response?.status === 401) {
        handleSessionExpired();
        return;
      }
      setError(extractDocumentErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  if (!user) return null;

  const totalBytes = documents.reduce((sum, d) => sum + d.fileSizeBytes, 0);

  return (
    <AppShell user={user}>
      <div className="dash-topbar">
        <div>
          <div className="dash-welcome-eyebrow">Documents</div>
          <h1 className="dash-welcome-title">Your knowledge base</h1>
        </div>
        <div className="dash-date">
          {documents.length} file{documents.length === 1 ? "" : "s"} · {formatBytes(totalBytes)}
        </div>
      </div>

      <form className="upload-card" onSubmit={handleUpload}>
        <div className="dash-section-label">Upload a document</div>

        {error && (
          <div className="alert-banner" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="alert-banner alert-banner-success" role="status">
            {success}
          </div>
        )}

        <label
          className={`file-drop${dragging ? " is-dragging" : ""}${selectedFile ? " has-file" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleFileChange}
            disabled={uploading}
          />
          <span className="file-drop-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {selectedFile ? (
            <>
              <div className="file-drop-title">{selectedFile.name}</div>
              <div className="file-drop-hint">
                {fileTypeLabel(selectedFile.type)} · {formatBytes(selectedFile.size)} · click to replace
              </div>
            </>
          ) : (
            <>
              <div className="file-drop-title">Drop a file here or click to browse</div>
              <div className="file-drop-hint">PDF, DOCX or TXT · up to {MAX_FILE_SIZE_LABEL}</div>
            </>
          )}
        </label>

        <div className="upload-row">
          <div className="field upload-title-field">
            <label className="field-label" htmlFor="title">
              Title <span className="field-optional">(optional — falls back to the file name)</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className="field-input"
              placeholder="Q3 insurance certificates"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
            />
          </div>

          <button type="submit" className="btn-ghost" disabled={uploading || !selectedFile}>
            {uploading ? "Uploading…" : "Upload document"}
          </button>
        </div>

        {uploading && (
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
            <span className="progress-label">{progress}%</span>
          </div>
        )}
      </form>

      <div className="dash-section-label">Stored documents</div>

      {loading ? (
        <div className="empty-note">Loading your documents…</div>
      ) : documents.length === 0 ? (
        <div className="empty-note">
          Nothing here yet. Upload a PDF, DOCX or TXT and it will show up in this list.
        </div>
      ) : (
        <div className="doc-list">
          {documents.map((doc) => (
            <div className="doc-row" key={doc.id}>
              <div className="doc-type">{fileTypeLabel(doc.contentType)}</div>

              <div className="doc-info">
                <div className="doc-title">{doc.title}</div>
                <div className="doc-meta">
                  {doc.originalFileName} · {formatBytes(doc.fileSizeBytes)} ·{" "}
                  {formatUploadedAt(doc.uploadedAt)}
                </div>
              </div>

              <div className="doc-actions">
                <button
                  type="button"
                  className="icon-btn"
                  title="Download"
                  aria-label={`Download ${doc.originalFileName}`}
                  onClick={() => handleDownload(doc)}
                  disabled={busyId === doc.id}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="icon-btn danger"
                  title="Delete"
                  aria-label={`Delete ${doc.originalFileName}`}
                  onClick={() => handleDelete(doc)}
                  disabled={busyId === doc.id}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
