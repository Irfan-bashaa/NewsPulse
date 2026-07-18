  // ── Premium ArticleCard ────────────────────────────────────────────────────
 
  const ArticleCard = useCallback(({ item, compact }) => {
    const saved = store.articleBookmarks.some(a => a.link === item.link);
    const isSpeaking = speakingId === item.link;
    const isSummarizing = summarizingId === item.link;
    const sum = summaries[`${item.link}__${summaryMode[item.link] || "short"}`];
    const activeMode = summaryMode[item.link] || "short";
    const inCompare = compareItems.some(a => a.link === item.link);
    const reaction = reactions[item.link];

    const catIdx = CAT_KEYS.indexOf(item.category);
    const catColors = ["#0EA5E9","#10B981","#8B5CF6","#EF4444","#F59E0B","#3B82F6","#06B6D4","#EC4899"];
    const catColor = catColors[catIdx] || c.accent;

    return (
      <div
        style={{

background:dm
?"linear-gradient(180deg,#1B2333,#111827)"
:"#fff",

borderRadius:"22px",

padding:"18px",

marginBottom:"18px",

display:"flex",

gap:"18px",

alignItems:"center",

border:`1px solid ${c.border}`,

boxShadow:c.shadow,

transition:".35s",

cursor:"pointer"

}}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = c.shadowMd; e.currentTarget.style.borderColor = dm ? "rgba(255,122,0,0.3)" : "rgba(255,122,0,0.2)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = c.shadow; e.currentTarget.style.borderColor = c.border; }}
      >
        {/* TOP ROW: category + readtime + reactions */}
        <div style={{
width:180,
height:120,
borderRadius:"18px",
objectFit:"cover",
flexShrink:0
}}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            padding: "3px 9px", borderRadius: "20px",
            background: catColor + (dm ? "22" : "15"),
            color: catColor, fontSize: "10px", fontWeight: 700,
            letterSpacing: "0.3px", textTransform: "uppercase",
          }}>
            {CAT_ICONS[catIdx] || "📰"} {item.category}
          </span>
          <span style={{ fontSize: "11px", color: c.muted, marginLeft: "auto", display: "flex", alignItems: "center", gap: "3px" }}>
            ⏱ {item.readTime || 1} {t.minRead}
            
          </span>
          <button className="like-btn" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "15px", padding: "0 1px", lineHeight: 1 }} onClick={() => reactToItem(item.link, "like")} title="Like">
            {reaction === "like" ? "❤️" : "🤍"}
          </button>
          <button className="like-btn" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "15px", padding: "0 1px", lineHeight: 1 }} onClick={() => reactToItem(item.link, "dislike")} title="Dislike">
            {reaction === "dislike" ? "👎" : "👍🏻"}
          </button>
        </div>

        {/* HEADLINE */}
        <h4
          style={{

fontSize:"24px",

fontWeight:800,

lineHeight:1.4,

color:c.text,

marginBottom:"10px"

}}
          onClick={() => { console.log("CLICKED ARTICLE"); console.log(item); store.trackRead(item); setReadItem(item); }}
        >
          {item.title}
        </h4>

        {/* SOURCE + DATE */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: compact ? 0 : "12px", flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            padding: "3px 9px", borderRadius: "8px",
            background: c.surface2,
            border: `1px solid ${c.border}`,
            fontSize: "11px", fontWeight: 600, color: c.textSub,
          }}>
            📰 {item.source || item.author || "Unknown Source"}
          </span>
          <span style={{ fontSize: "11px", color: c.muted }}>
            {item.pubDate ? new Date(item.pubDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Date unavailable"}
          </span>
        </div>

        {/* ACTION BUTTONS */}
        {!compact && (
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            <button style={{ ...s.btn(saved ? c.green : c.purple, true) }} onClick={() => store.toggleArticleBookmark(item)}>
              {saved ? "✓ Saved" : `⭐ ${t.save}`}
            </button>
            <button style={{ ...s.btn(c.accent, true), background: c.gradPrimary }} onClick={() => summarize(item, activeMode)} disabled={!!isSummarizing}>
              {isSummarizing ? "⏳ Thinking…" : t.summarize}
            </button>
            <button style={{ ...s.btn(isSpeaking ? c.red : c.blue, true) }} onClick={() => speakItem(item)}>
              {isSpeaking ? t.stop : t.play}
            </button>
            <button style={{ ...s.btn(null, true), border: `1px solid ${c.border}` }} onClick={() => { setReadItem(item); store.trackRead(item); }}>{t.readMode}</button>
            <button style={{ ...s.btn(null, true), border: `1px solid ${c.border}` }} onClick={() => shareArticle(item)}>{t.share}</button>
            <button style={{ ...s.btn(inCompare ? c.red : null, true), border: `1px solid ${c.border}` }} onClick={() => toggleCompare(item)}>{t.compare}</button>
            <button style={{ ...s.btn(null, true), border: `1px solid ${c.border}` }} onClick={() => { setArticleToAdd(item); setCollectionsOpen(true); }}>{t.addTo}</button>
          </div>
        )}

        {/* AUDIO PROGRESS */}
        {isSpeaking && (
          <div style={{ marginTop: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", color: c.blue, fontWeight: 600 }}>🎧 Reading aloud…</span>
              <span style={{ fontSize: "11px", color: c.muted }}>{Math.round(speechProgress)}%</span>
            </div>
            <div style={{ height: "3px", background: c.surface3, borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${speechProgress}%`, background: `linear-gradient(90deg, ${c.blue}, ${c.purple})`, borderRadius: "2px", transition: "width 0.3s linear" }} />
            </div>
          </div>
        )}

        {/* AI SUMMARY SECTION */}
        {(isSummarizing || SUMMARY_MODES.some(m => summaries[`${item.link}__${m.key}`])) && (
          <div style={{ marginTop: "12px" }}>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
              {SUMMARY_MODES.map(m => {
                const cached = !!summaries[`${item.link}__${m.key}`];
                const isActive = activeMode === m.key;
                return (
                  <button key={m.key}
                    onClick={() => summarize(item, m.key)}
                    disabled={isSummarizing}
                    style={{
                      padding: "3px 10px", borderRadius: "20px", border: "none", cursor: "pointer",
                      fontSize: "11px", fontWeight: 600, transition: "all 0.15s", fontFamily: "inherit",
                      background: isActive ? c.accent : cached ? (dm ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)") : c.surface3,
                      color: isActive ? "#fff" : cached ? c.green : c.muted,
                    }}>
                    {m.icon} {m.label}{cached && !isActive ? " ✓" : ""}
                  </button>
                );
              })}
            </div>
            {isSummarizing && (
              <div style={{ padding: "12px 14px", background: c.accentBg, borderRadius: "12px", border: `1px solid ${c.accent}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: c.accent, fontSize: "13px", fontWeight: 600 }}>
                  <span style={{ display: "inline-block", width: "12px", height: "12px", border: `2px solid ${c.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "npSpin .65s linear infinite" }} />
                  ✨ AI is thinking…
                </div>
              </div>
            )}
            {!isSummarizing && sum && (
              <div style={{ padding: "14px", background: c.accentBg, borderRadius: "12px", border: `1px solid ${c.accent}33`, fontSize: "13px", lineHeight: 1.7, color: c.text }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: c.accent, textTransform: "uppercase", letterSpacing: "1px" }}>
                    {SUMMARY_MODES.find(m => m.key === activeMode)?.icon} AI · {SUMMARY_MODES.find(m => m.key === activeMode)?.label}
                  </span>
                  <button onClick={() => setSummaries(prev => { const n = { ...prev }; delete n[`${item.link}__${activeMode}`]; return n; })}
                    style={{ background: c.surface3, border: "none", color: c.muted, cursor: "pointer", fontSize: "11px", padding: "2px 7px", borderRadius: "6px", fontFamily: "inherit" }}>✕</button>
                </div>
                {sum.includes("•") ? (
                  sum.split("•").filter(x => x.trim()).map((point, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
                      <span style={{ color: c.accent, fontWeight: 800, flexShrink: 0 }}>•</span>
                      <span>{point.trim()}</span>
                    </div>
                  ))
                ) : <span>{sum}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }, [store.articleBookmarks, speakingId, speechProgress, summarizingId, summaries, summaryMode, compareItems, reactions, dm, c, s, t, SUMMARY_MODES]);
 