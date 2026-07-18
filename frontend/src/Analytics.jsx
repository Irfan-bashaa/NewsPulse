 
export default function Analytics({ heatmapData, readHistory, darkMode }) {
  const c = {
    bg: darkMode ? "#0f0f13" : "#f8f7ff",
    surface: darkMode ? "#1a1a24" : "#ffffff",
    border: darkMode ? "#2e2e3e" : "#e8e6f5",
    text: darkMode ? "#e8e6ff" : "#1a1830",
    muted: darkMode ? "#6b68a0" : "#8b88b0",
    accent: "#f59e0b",
  };
 
  const maxCount = Math.max(...heatmapData.map(d => d.count), 1);
 
  const last7 = readHistory.filter(item => {
    const d = new Date(item.readAt);
    return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
  });
 
  const byDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("en-IN", { weekday: "short" });
    const count = readHistory.filter(item => {
      const rd = new Date(item.readAt);
      return rd.toDateString() === d.toDateString();
    }).length;
    return { label, count };
  });
  const maxDay = Math.max(...byDay.map(d => d.count), 1);
 
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* heatmap */}
      <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
        <h3 style={{ color: c.text, fontWeight: 700, marginBottom: "20px", fontSize: "16px" }}>🧭 Category Heatmap</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {heatmapData.map((d, i) => {
            const pct = (d.count / maxCount) * 100;
            const intensity = pct > 70 ? "#ef4444" : pct > 40 ? "#f59e0b" : pct > 15 ? "#22c55e" : (darkMode ? "#2a2a3a" : "#e5e7eb");
            return (
              <div key={d.cat} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "18px", minWidth: "24px" }}>{d.icon}</span>
                <span style={{ fontSize: "13px", color: c.muted, minWidth: "90px", textTransform: "capitalize" }}>{d.cat}</span>
                <div style={{ flex: 1, height: "10px", background: darkMode ? "#1e1e2a" : "#f0eeff", borderRadius: "5px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: intensity, borderRadius: "5px", transition: "width 0.6s ease" }} />
                </div>
                <span style={{ fontSize: "12px", color: c.muted, minWidth: "28px", textAlign: "right", fontWeight: 700 }}>{d.count}</span>
              </div>
            );
          })}
        </div>
        {heatmapData.every(d => d.count === 0) && (
          <p style={{ color: c.muted, fontSize: "13px", textAlign: "center", marginTop: "12px" }}>Start reading to see your category heatmap!</p>
        )}
      </div>
 
      {/* reading activity */}
      <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
        <h3 style={{ color: c.text, fontWeight: 700, marginBottom: "20px", fontSize: "16px" }}>📈 Reading Activity (Last 7 Days)</h3>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", height: "80px" }}>
          {byDay.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "100%", background: d.count > 0 ? "linear-gradient(135deg, #f59e0b, #ef4444)" : (darkMode ? "#1e1e2a" : "#f0eeff"), borderRadius: "4px 4px 0 0", height: `${Math.max(4, (d.count / maxDay) * 64)}px`, transition: "height 0.5s ease" }} />
              <span style={{ fontSize: "11px", color: c.muted }}>{d.label}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "12px", fontSize: "13px", color: c.muted }}>
          Total this week: <strong style={{ color: c.text }}>{last7.length}</strong> articles
        </div>
      </div>
 
      {/* top interests */}
      <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: "16px", padding: "24px" }}>
        <h3 style={{ color: c.text, fontWeight: 700, marginBottom: "16px", fontSize: "16px" }}>🎯 Your Top Interests</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {heatmapData.filter(d => d.count > 0).slice(0, 5).map((d, i) => (
            <div key={i} style={{
              padding: "8px 16px", borderRadius: "20px",
              background: i === 0 ? "linear-gradient(135deg, #f59e0b, #ef4444)" : (darkMode ? "#1e1e2a" : "#f0eeff"),
              color: i === 0 ? "#fff" : c.text, fontSize: "13px", fontWeight: 600,
            }}>
              {d.icon} {d.cat} ({d.count})
            </div>
          ))}
          {heatmapData.every(d => d.count === 0) && <p style={{ color: c.muted, fontSize: "13px" }}>No reading data yet.</p>}
        </div>
      </div>
    </div>
  );
}