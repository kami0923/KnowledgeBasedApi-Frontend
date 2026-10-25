import KnowledgeGraph from "./KnowledgeGraph.jsx";

export default function AuthLayout({ headline, subline, children }) {
  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <KnowledgeGraph />

        <div className="auth-visual-content">
          <div className="auth-eyebrow">KB:// knowledge base</div>
          <h1 className="auth-headline">{headline}</h1>
          <p className="auth-subline">{subline}</p>
        </div>

        <div className="auth-visual-footer">
          <span>PDF</span>
          <span>DOCX</span>
          <span>TXT</span>
          <span>Semantic search</span>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
}
