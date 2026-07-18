import { useState, useEffect, useRef } from "react";

export default function ReadMode({
  item, onClose, darkMode,
  onSummarize, summary, summarizing,
  onSpeak, speaking,
}) {
console.log("FULL ITEM:");
console.log(JSON.stringify(item, null, 2));
  
  const [fontSize, setFontSize]   = useState(17);
  const [scrollPct, setScrollPct] = useState(0);
  const [imgError, setImgError]   = useState(false);
  const containerRef = useRef(null);
  const [articleContent, setArticleContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const loadArticle = async () => {

    console.log("LINK:", item.link);
    console.log("DATE:", item.pubDate);
    console.log("ISO:", item.isoDate);

    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.REACT_APP_GEMINI_API_KEY}/article?url=${encodeURIComponent(item.link)}`
      );

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || "Article unavailable");
    }
console.log("RSS FIRST ITEM");
console.log(JSON.stringify(data.items?.[0], null, 2));
let cleanContent = data.content || "";

// Remove ads, scripts, styles
cleanContent
  .replace(/<script[\s\S]*?<\/script>/gi, "")
  .replace(/<style[\s\S]*?<\/style>/gi, "")
  .replace(/<iframe[\s\S]*?<\/iframe>/gi, "");

// Remove very small images/icons
cleanContent.replace(
  /<img[^>]*width=["']?[0-2]?\d["']?[^>]*>/gi,
  ""
);

setArticleContent(
  data.content ||
  data.text ||
  item.description ||
  "No content available"
);

    } catch (err) {
      console.error(err);

      setArticleContent(`
  <h2>${item.title}</h2>
  <p>${item.description || "No article preview available."}</p>
`);
    } finally {
      setLoading(false);
    }
  };

  loadArticle();
}, [item.link]);

  // ── Reading progress ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const pct = scrollHeight <= clientHeight
        ? 100
        : Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      setScrollPct(pct);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // ── ESC to close ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const clean = (html) => {
    if (!html) return "";
    return html
      .replace(/<img[^>]*>/gi, "")          // remove img tags
      .replace(/<a[^>]*>(.*?)<\/a>/gi, "$1") // unwrap links
      .replace(/<[^>]+>/g, " ")             // strip all other tags
      .replace(/\s+/g, " ")
      .trim();
  };

  // Detect if we have meaningful content beyond just the title
  const rawDesc = clean(item.description || "");
  const rawContent = clean(articleContent || item.content || "");

  // Use content if it's longer than description, else use description
  const bodyText = rawContent.length > rawDesc.length ? rawContent : rawDesc;

  // Check if content is actually useful (not just truncated "... [N chars]")
  const isTruncated = bodyText.endsWith("...]") || bodyText.endsWith("…") || bodyText.length < 120;

  // Thumbnail — try enclosure, then thumbnail field, then og image hint
  const thumbUrl = !imgError && (
    item.enclosure?.link ||
    item.thumbnail ||
    item.media?.thumbnail?.url ||
    null
  );

  // ── Theme ─────────────────────────────────────────────────────────────────
  const bg      = darkMode ? "#0d0d10" : "#faf9f6";
  const text     = darkMode ? "#e8e4d9" : "#2c2820";
  const muted    = darkMode ? "#6b6760" : "#9b9590";
  const surface  = darkMode ? "#161612" : "#ffffff";
  const divider  = darkMode ? "#232320" : "#ede9e0";
  const cardBg   = darkMode ? "#1a1a14" : "#fffbeb";
  const cardBdr  = darkMode ? "#333320" : "#fde68a";
  const tagBg    = darkMode ? "#1e1e2a" : "#f0eeff";

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: bg, color: text,
        fontFamily: "'Lora', Georgia, serif",
        overflowY: "auto",
        animation: "rmFadeIn 0.22s ease",
      }}
    >
      {/* Reading progress bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, height: "3px", zIndex: 210,
        width: `${scrollPct}%`,
        background: "linear-gradient(90deg, #f59e0b, #ef4444)",
        transition: "width 0.1s linear",
        pointerEvents: "none",
      }} />

      <style>
  
        {`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes rmFadeIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .rm-toolbar-btn {
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-weight: 600;
          transition: opacity 0.15s;
        }
        .rm-toolbar-btn:hover { opacity: 0.7; }
.rm-article img {
  width: 100%;
  height: auto;
  max-height: 500px;
  object-fit: contain;
  border-radius: 16px;
  margin: 20px 0;
  display: block;
}

.rm-article h1,
.rm-article h2,
.rm-article h3,
.rm-article h4 {
  margin-top: 28px;
  margin-bottom: 14px;
  font-weight: 700;
  line-height: 1.4;
}

.rm-article p {
  margin-bottom: 18px;
}

.rm-article blockquote {
  border-left: 4px solid #f59e0b;
  padding-left: 16px;
  margin: 24px 0;
  font-style: italic;
}

.rm-article ul,
.rm-article ol {
  padding-left: 24px;
  margin-bottom: 18px;
}
      `}</style>

      {/* ── TOOLBAR ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: surface,
        borderBottom: `1px solid ${divider}`,
        padding: "10px 16px",
        display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap",
        backdropFilter: "blur(12px)",
      }}>
        {/* Back */}
        <button className="rm-toolbar-btn" onClick={onClose}
          style={{ color: muted, fontSize: "22px", lineHeight: 1, padding: "0 4px" }}>
          ←
        </button>

        {/* Progress label */}
        <span style={{
          flex: 1, fontSize: "12px", color: muted,
          fontFamily: "'DM Sans', sans-serif", minWidth: "60px",
        }}>
          📖 Read Mode · {scrollPct}%
        </span>

        {/* Font size */}
        <button className="rm-toolbar-btn" onClick={() => setFontSize(f => Math.max(13, f - 2))}
          style={{ color: text, fontSize: "13px", border: `1px solid ${divider}`, borderRadius: "6px", padding: "4px 9px" }}>
          A−
        </button>
        <button className="rm-toolbar-btn" onClick={() => setFontSize(f => Math.min(26, f + 2))}
          style={{ color: text, fontSize: "13px", border: `1px solid ${divider}`, borderRadius: "6px", padding: "4px 9px" }}>
          A+
        </button>

        {/* AI Summary */}
        
        <button className="rm-toolbar-btn" onClick={onSummarize} disabled={summarizing}
          style={{ background: "#f59e0b", color: "#fff", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", border: "none" }}>
          {summarizing ? "⏳" : "✨ Summary"}
        </button>

        {/* Listen */}
        <button className="rm-toolbar-btn" onClick={onSpeak}
          style={{ background: speaking ? "#ef4444" : "#3b82f6", color: "#fff", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", border: "none" }}>
          {speaking ? "⏹ Stop" : "🎧 Listen"}
        </button>

        {/* Open original */}
      <div
         style={{
          background: "#3b82f6",
          color: "#fff",
          borderRadius: "8px",
          padding: "6px 12px",
          fontSize: "12px",
          fontWeight: "600"
          }}
      >
      📰 News Preview
      </div>
      </div>

      {/* ── ARTICLE BODY ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 20px 100px" }}>

        {/* Category + read time badge */}
        <div style={{
          display: "flex", gap: "8px", flexWrap: "wrap",
          marginBottom: "18px", fontFamily: "'DM Sans', sans-serif",
        }}>
          <span style={{
            background: tagBg, color: "#f59e0b",
            fontSize: "11px", fontWeight: 700,
            padding: "4px 10px", borderRadius: "20px",
            textTransform: "uppercase", letterSpacing: "0.8px",
          }}>
            {item.category || "News"}
          </span>
          <span style={{
            background: tagBg, color: muted,
            fontSize: "11px", padding: "4px 10px", borderRadius: "20px",
          }}>
            ⏱ {item.readTime || Math.max(1, Math.ceil(bodyText.split(" ").length / 200))} min read
          </span>
          {item.type && (
            <span style={{
              background: tagBg, color: muted,
              fontSize: "11px", padding: "4px 10px", borderRadius: "20px",
            }}>
              {item.type === "TV" ? "📺" : item.type === "Newspaper" ? "📰" : "🌐"} {item.type}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: `${fontSize + 7}px`,
          fontWeight: 700, lineHeight: 1.32,
          marginBottom: "16px", letterSpacing: "-0.3px",
          color: text,
        }}>
          {item.title}
        </h1>

        {/* Meta — date + author */}
        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: muted,
          marginBottom: "24px", display: "flex", gap: "16px", flexWrap: "wrap",
          alignItems: "center",
        }}>
<span>
📅 {
  item.pubDate
    ? new Date(item.pubDate).toLocaleDateString("en-IN")
    : item.isoDate
    ? new Date(item.isoDate).toLocaleDateString("en-IN")
    : "Today"
}
</span>
          {item.author && <span>✍️ {item.author}</span>}
          {item.source?.name && <span>📰 {item.source.name}</span>}
        </div>

        {/* Thumbnail image */}
        {thumbUrl && (
          <img
            src={thumbUrl}
            alt={item.title}
            onError={() => setImgError(true)}
            style={{
              width: "100%",
              maxHeight: "360px",
              objectFit: "cover",
              borderRadius: "14px",
              marginBottom: "28px",
              display: "block",
            }}
          />
        )}

        {/* Divider */}
        <div style={{ height: "1px", background: divider, marginBottom: "28px" }} />

        {/* AI Summary box */}
        {summary && (
          <div style={{
            background: cardBg, border: `1px solid ${cardBdr}`,
            borderRadius: "12px", padding: "18px 20px", marginBottom: "28px",
            fontFamily: "'DM Sans', sans-serif", fontSize: "14px",
            lineHeight: 1.75, color: text,
          }}>
            <div style={{ fontWeight: 700, color: "#f59e0b", marginBottom: "8px", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" }}>
              ✨ AI Summary
            </div>
            {summary}
          </div>
        )}

{/* ── CONTENT SECTION ─────────────────────────────────────────────── */}

{loading ? (
  <div
    style={{
      textAlign: "center",
      padding: "50px",
      color: muted,
      fontSize: "16px",
    }}
  >
    📖 Loading full article...
  </div>
) : (
  <div
    style={{
      background: darkMode ? "#171717" : "#fff",
      borderRadius: "22px",
      padding: "30px",
      border: darkMode
        ? "1px solid #2b2b2b"
        : "1px solid #ececec",
      boxShadow: darkMode
        ? "0 10px 30px rgba(0,0,0,0.35)"
        : "0 10px 30px rgba(0,0,0,0.08)",
      marginBottom: "32px",
    }}
  >
<div
  style={{
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: darkMode
      ? "1px solid #333"
      : "1px solid #eee",
  }}
>
  <div
    style={{
      fontSize: "12px",
      color: "#f59e0b",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "1px",
      marginBottom: "8px",
    }}
  >
    FEATURED STORY
  </div>

  <div
    style={{
      fontSize: "14px",
      color: muted,
    }}
  >
    Reading Experience • NewsPluse
  </div>
</div>

    <div
      className="rm-article"
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: 2,
        color: text,
      }}
      dangerouslySetInnerHTML={{
        __html: articleContent || "<p>No content available</p>",
      }}
    />
  </div>
)}
        

        {/* Always show source link at bottom */}

<div style={{
  marginTop: "48px",
  paddingTop: "24px",
  borderTop: `1px solid ${divider}`,
  display: "flex",
  gap: "12px",
  justifyContent: "center",
  flexWrap: "wrap",
  fontFamily: "'DM Sans', sans-serif",
}}>

  <a
    href={item.link}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      background: "#f59e0b",
      color: "#fff",
      textDecoration: "none",
      borderRadius: "12px",
      padding: "13px 24px",
      fontWeight: 600,
      fontSize: "14px",
    }}
  >
    🔗 Open Original Article
  </a>

  <button
    onClick={onClose}
    style={{
      background: "none",
      border: `1px solid ${divider}`,
      borderRadius: "12px",
      padding: "13px 24px",
      color: muted,
      cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "14px",
      fontWeight: 600,
    }}
  >
    ← Back to Feed
  </button>

</div>

      </div>
    </div>
  );
}