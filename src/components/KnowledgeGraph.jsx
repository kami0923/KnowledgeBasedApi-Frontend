// A quiet, ambient knowledge-graph visualization: nodes = documents,
// edges = semantic connections found via embeddings. Grounded in what
// the product actually does (RAG / vector search) rather than decoration.
const nodes = [
  { x: 60, y: 90 }, { x: 180, y: 40 }, { x: 300, y: 110 },
  { x: 120, y: 220 }, { x: 260, y: 260 }, { x: 380, y: 190 },
  { x: 40, y: 330 }, { x: 340, y: 340 }, { x: 210, y: 400 }
];

const edges = [
  [0, 1], [1, 2], [0, 3], [3, 4], [4, 2], [4, 5],
  [3, 6], [4, 7], [7, 8], [8, 3]
];

export default function KnowledgeGraph() {
  return (
    <svg
      className="kg-canvas"
      viewBox="0 0 420 440"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {edges.map(([a, b], i) => (
        <line
          key={i}
          className="kg-edge"
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          style={{ animationDelay: `${i * 0.3}s` }}
        />
      ))}
      {nodes.map((n, i) => (
        <circle
          key={i}
          className="kg-node"
          cx={n.x}
          cy={n.y}
          r="3"
          style={{ animationDelay: `${i * 0.4}s` }}
        />
      ))}
    </svg>
  );
}
