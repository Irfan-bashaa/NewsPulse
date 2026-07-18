import { useState } from "react";
 
export default function Collections({ collections, createCollection, addToCollection, removeCollection, darkMode, articleToAdd, onClose }) {
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
 
  const c = {
    surface: darkMode ? "#1a1a24" : "#ffffff",
    surface2: darkMode ? "#23232f" : "#f5f3ff",
    border: darkMode ? "#2e2e3e" : "#e8e6f5",
    text: darkMode ? "#e8e6ff" : "#1a1830",
    muted: darkMode ? "#6b68a0" : "#8b88b0",
    accent: "#f59e0b",
    danger: "#ef4444",
  };
 
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <h3 style={{ color: c.text, fontWeight: 700, margin: 0, flex: 1 }}>🗂️ My Collections</h3>
        <button onClick={() => setShowCreate(!showCreate)} style={{
          background: "linear-gradient(135deg, #f59e0b, #ef4444)", border: "none",
          borderRadius: "10px", padding: "8px 16px", color: "#fff", fontWeight: 600,
          fontSize: "13px", cursor: "pointer",
        }}>+ New</button>
      </div>
 
      {showCreate && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input
            value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Collection name (e.g. Tech, UPSC)"
            style={{
              flex: 1, padding: "10px 14px", borderRadius: "10px",
              border: `1px solid ${c.border}`, background: c.surface2, color: c.text,
              fontSize: "14px", outline: "none",
            }}
            onKeyDown={e => { if (e.key === "Enter" && newName.trim()) { createCollection(newName.trim()); setNewName(""); setShowCreate(false); } }}
          />
          <button onClick={() => { if (newName.trim()) { createCollection(newName.trim()); setNewName(""); setShowCreate(false); } }} style={{
            background: c.accent, border: "none", borderRadius: "10px", padding: "10px 16px",
            color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "13px",
          }}>Create</button>
        </div>
      )}
 
      {collections.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: c.muted, fontSize: "14px" }}>
          No collections yet. Create one to organize your news!
        </div>
      )}
 
      {collections.map(col => (
        <div key={col.id} style={{
          background: c.surface, border: `1px solid ${c.border}`,
          borderRadius: "14px", padding: "16px", marginBottom: "12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: col.articles.length > 0 ? "12px" : 0 }}>
            <span style={{ fontSize: "18px" }}>📁</span>
            <span style={{ fontWeight: 700, color: c.text, flex: 1 }}>{col.name}</span>
            <span style={{ fontSize: "12px", color: c.muted }}>{col.articles.length} articles</span>
            {articleToAdd && (
              <button onClick={() => { addToCollection(col.id, articleToAdd); onClose && onClose(); }} style={{
                background: c.accent, border: "none", borderRadius: "8px", padding: "5px 12px",
                color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              }}>+ Add</button>
            )}
            <button onClick={() => removeCollection(col.id)} style={{
              background: "none", border: "none", color: c.muted, cursor: "pointer", fontSize: "16px",
            }}>🗑️</button>
          </div>
          {col.articles.slice(0, 3).map((art, i) => (
            <div key={i} style={{ fontSize: "13px", color: c.muted, padding: "4px 0", borderTop: `1px solid ${c.border}`, cursor: "pointer" }}
              onClick={() => window.open(art.link, "_blank")}>
              • {art.title?.slice(0, 70)}…
            </div>
          ))}
          {col.articles.length > 3 && <div style={{ fontSize: "12px", color: c.muted, marginTop: "4px" }}>+{col.articles.length - 3} more</div>}
        </div>
      ))}
    </div>
  );
}