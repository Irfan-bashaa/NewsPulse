import { useState, useEffect, useRef, useCallback } from "react";
 
export default function PodcastMode({ articles = [], onClose, darkMode, voiceLang = "en-IN" }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef(null);
  const playingRef = useRef(false); // track playing without stale closure
 
  // Guard: no articles
  const hasArticles = articles.length > 0;
  const current = hasArticles ? articles[currentIdx] : null;
 
  const stopSpeech = useCallback(() => {
    window.speechSynthesis.cancel();
    clearInterval(intervalRef.current);
    playingRef.current = false;
    setPlaying(false);
    setProgress(0);
  }, []);
 
  // Inner speak function — uses latest speed via closure param
  const doSpeak = useCallback((idx, spd) => {
    window.speechSynthesis.cancel();
    clearInterval(intervalRef.current);
    const item = articles[idx];
    if (!item) return;
 
    const rawText = (item.description || "").replace(/<[^>]+>/g, " ").slice(0, 600);
    const text = `${item.title}. ${rawText}`;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = spd;
    utter.lang = voiceLang;
 
    const wordCount = text.split(/\s+/).length;
    const durationMs = (wordCount / (spd * 140)) * 60 * 1000;
    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      elapsed += 200;
      setProgress(Math.min(99, (elapsed / durationMs) * 100));
    }, 200);
 
    utter.onend = () => {
      clearInterval(intervalRef.current);
      setProgress(100);
      if (!playingRef.current) return;
      setTimeout(() => {
        if (idx + 1 < articles.length) {
          setCurrentIdx(idx + 1);
          setProgress(0);
          doSpeak(idx + 1, spd);
        } else {
          playingRef.current = false;
          setPlaying(false);
        }
      }, 800);
    };
 
    utter.onerror = () => {
      clearInterval(intervalRef.current);
      playingRef.current = false;
      setPlaying(false);
    };
 
    window.speechSynthesis.speak(utter);
    playingRef.current = true;
    setPlaying(true);
  }, [articles, voiceLang]);
 
  // Cleanup on unmount
  useEffect(() => {
    return () => { window.speechSynthesis.cancel(); clearInterval(intervalRef.current); };
  }, []);
 
  const handlePlay = () => {
    if (!hasArticles) return;
    if (playing) { stopSpeech(); } else { doSpeak(currentIdx, speed); }
  };
 
  const handlePrev = () => {
    if (!hasArticles) return;
    const idx = Math.max(0, currentIdx - 1);
    setCurrentIdx(idx);
    stopSpeech();
    doSpeak(idx, speed);
  };
 
  const handleNext = () => {
    if (!hasArticles) return;
    const idx = Math.min(articles.length - 1, currentIdx + 1);
    setCurrentIdx(idx);
    stopSpeech();
    doSpeak(idx, speed);
  };
 
  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (playing) {
      stopSpeech();
      doSpeak(currentIdx, newSpeed);
    }
  };
 
  const bg = "#0d0d14";
  const surface = "#16161f";
 
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: bg, color: "#fff",
      display: "flex", flexDirection: "column",
      fontFamily: "'DM Sans', sans-serif",
      animation: "podSlideUp 0.3s ease",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes podSlideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        .podcast-wave { display: flex; align-items: center; gap: 4px; height: 40px; }
        .podcast-wave span {
          display: block; width: 4px; border-radius: 2px;
          background: linear-gradient(135deg, #f59e0b, #ef4444);
          animation: podWave 0.8s ease-in-out infinite;
        }
        .podcast-wave span:nth-child(1) { animation-delay: 0s; }
        .podcast-wave span:nth-child(2) { animation-delay: 0.1s; }
        .podcast-wave span:nth-child(3) { animation-delay: 0.2s; }
        .podcast-wave span:nth-child(4) { animation-delay: 0.3s; }
        .podcast-wave span:nth-child(5) { animation-delay: 0.4s; }
        @keyframes podWave { 0%,100% { height: 8px } 50% { height: 32px } }
        .pod-btn {
          background: rgba(255,255,255,0.08); border: none; border-radius: 50%;
          width: 48px; height: 48px; cursor: pointer; color: #fff;
          font-size: 18px; display: flex; align-items: center; justify-content: center;
          transition: background 0.2s; flex-shrink: 0;
        }
        .pod-btn:hover { background: rgba(255,255,255,0.15); }
        .pod-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .pod-btn-main {
          width: 72px; height: 72px; font-size: 26px;
          background: linear-gradient(135deg, #f59e0b, #ef4444);
          box-shadow: 0 8px 32px rgba(245,158,11,0.4);
        }
        .pod-playlist-item:hover { background: rgba(255,255,255,0.05) !important; }
      `}</style>
 
      {/* Header */}
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
        <span style={{ fontSize: "18px" }}>🎧</span>
        <span style={{ fontWeight: 700, fontSize: "16px" }}>Podcast Mode</span>
        {hasArticles && <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{currentIdx + 1} / {articles.length}</span>}
        <div style={{ marginLeft: "auto", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>🔊 {voiceLang}</div>
        <button onClick={() => { stopSpeech(); onClose(); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "20px", padding: "4px" }}>✕</button>
      </div>
 
      {/* Empty state */}
      {!hasArticles && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", gap: "12px" }}>
          <span style={{ fontSize: "48px" }}>📭</span>
          <span style={{ fontSize: "15px" }}>No articles to play.</span>
          <span style={{ fontSize: "13px" }}>Load news from the Apps tab first.</span>
          <button onClick={onClose} style={{ marginTop: "8px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "10px", padding: "10px 24px", color: "#fff", cursor: "pointer", fontSize: "14px" }}>Go Back</button>
        </div>
      )}
 
      {/* Player */}
      {hasArticles && (
        <>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 24px 16px", gap: "24px", overflowY: "auto" }}>
            {/* Visualizer disc */}
            <div style={{ width: "110px", height: "110px", borderRadius: "50%", background: surface, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: playing ? "0 0 50px rgba(245,158,11,0.35)" : "none", transition: "box-shadow 0.4s", flexShrink: 0 }}>
              {playing ? (
                <div className="podcast-wave">
                  {[18, 28, 22, 34, 16].map((h, i) => <span key={i} style={{ height: `${h}px` }} />)}
                </div>
              ) : (
                <span style={{ fontSize: "36px" }}>📰</span>
              )}
            </div>
 
            {/* Now playing info */}
            <div style={{ textAlign: "center", maxWidth: "480px", width: "100%" }}>
              <div style={{ fontSize: "10px", color: "#f59e0b", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>
                {current?.category || "News"} · {current?.readTime || 1} min
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600, lineHeight: 1.4, color: "#fff", padding: "0 8px" }}>
                {current?.title || ""}
              </div>
            </div>
 
            {/* Progress */}
            <div style={{ width: "100%", maxWidth: "380px" }}>
              <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#f59e0b,#ef4444)", borderRadius: "2px", transition: "width 0.2s linear" }} />
              </div>
            </div>
 
            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button className="pod-btn" onClick={handlePrev} disabled={currentIdx === 0}>⏮</button>
              <button className="pod-btn pod-btn-main" onClick={handlePlay}>{playing ? "⏸" : "▶"}</button>
              <button className="pod-btn" onClick={handleNext} disabled={currentIdx === articles.length - 1}>⏭</button>
            </div>
 
            {/* Speed */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
              {[0.75, 1, 1.25, 1.5, 2].map(sp => (
                <button key={sp} onClick={() => handleSpeedChange(sp)} style={{
                  padding: "5px 12px", borderRadius: "20px", border: "none", cursor: "pointer",
                  background: speed === sp ? "#f59e0b" : "rgba(255,255,255,0.08)",
                  color: speed === sp ? "#fff" : "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: 600,
                  transition: "all 0.15s",
                }}>{sp}×</button>
              ))}
            </div>
          </div>
 
          {/* Playlist */}
          <div style={{ maxHeight: "200px", overflowY: "auto", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
            {articles.slice(0, 20).map((item, i) => (
              <div key={i} className="pod-playlist-item"
                onClick={() => { setCurrentIdx(i); stopSpeech(); doSpeak(i, speed); }}
                style={{
                  padding: "10px 20px", cursor: "pointer",
                  background: i === currentIdx ? "rgba(245,158,11,0.1)" : "transparent",
                  borderLeft: i === currentIdx ? "3px solid #f59e0b" : "3px solid transparent",
                  display: "flex", gap: "10px", alignItems: "flex-start",
                }}>
                <span style={{ fontSize: "12px", color: i === currentIdx ? "#f59e0b" : "rgba(255,255,255,0.22)", minWidth: "20px", fontWeight: 700, paddingTop: "1px" }}>{i + 1}</span>
                <span style={{ fontSize: "13px", color: i === currentIdx ? "#fff" : "rgba(255,255,255,0.45)", lineHeight: 1.4, flex: 1 }}>{item.title}</span>
                {i === currentIdx && playing && <span style={{ fontSize: "10px", color: "#f59e0b", marginTop: "2px" }}>▶</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}