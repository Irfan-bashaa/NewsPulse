import { useState, useEffect, useCallback, useRef } from "react";
 
export const CAT_KEYS = ["general", "sports", "technology", "politics", "entertainment", "business", "science", "health"];
export const CAT_ICONS = ["🌐", "⚽", "💻", "🏛️", "🎬", "📈", "🔬", "🏥"];
export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];
export const SOURCES_MAP = {
  "Telugu": ["sakshi", "eenadu", "andhrajyothy"],
  "English": ["thehindu", "ndtv", "timesofindia"],
  "All": []
};
const ITEMS_PER_PAGE = 10;
 
function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
 
export function useNewsStore(user) {
  const uid = user?.email || "guest";
 
  // behaviour tracking
  const [behaviour, setBehaviour] = useState(() => {
    const d = JSON.parse(localStorage.getItem(`np_beh_${uid}`) || "{}");
    return d; // { "technology": 4, "sports": 2, ... }
  });
  const [keywords, setKeywords] = useState(() => JSON.parse(localStorage.getItem(`np_kw_${uid}`) || "[]"));
  const [collections, setCollections] = useState(() => JSON.parse(localStorage.getItem(`np_col_${uid}`) || "[]"));
  // [{ id, name, articles: [] }]
  const [recentlyRead, setRecentlyRead] = useState(() => JSON.parse(localStorage.getItem(`np_recent_${uid}`) || "[]"));
  const [appBookmarks, setAppBookmarks] = useState(() => JSON.parse(localStorage.getItem(`np_abm_${uid}`) || "[]"));
  const [articleBookmarks, setArticleBookmarks] = useState(() => JSON.parse(localStorage.getItem(`np_artbm_${uid}`) || "[]"));
  const [readHistory, setReadHistory] = useState(() => JSON.parse(localStorage.getItem(`np_hist_${uid}`) || "[]")); // full read history for analytics
 
  // news fetch state
  const [allArticles, setAllArticles] = useState([]);
  const [visibleArticles, setVisibleArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState("Andhra Pradesh");
  const [category, setCategory] = useState(0);
  const [sourceFilter, setSourceFilter] = useState("All");
  const [personalizedFeed, setPersonalizedFeed] = useState([]);
 
  
  // persist
  useEffect(() => { localStorage.setItem(`np_beh_${uid}`, JSON.stringify(behaviour)); }, [behaviour, uid]);
  useEffect(() => { localStorage.setItem(`np_kw_${uid}`, JSON.stringify(keywords)); }, [keywords, uid]);
  useEffect(() => { localStorage.setItem(`np_col_${uid}`, JSON.stringify(collections)); }, [collections, uid]);
  useEffect(() => { localStorage.setItem(`np_recent_${uid}`, JSON.stringify(recentlyRead)); }, [recentlyRead, uid]);
  useEffect(() => { localStorage.setItem(`np_abm_${uid}`, JSON.stringify(appBookmarks)); }, [appBookmarks, uid]);
  useEffect(() => { localStorage.setItem(`np_artbm_${uid}`, JSON.stringify(articleBookmarks)); }, [articleBookmarks, uid]);
  useEffect(() => { localStorage.setItem(`np_hist_${uid}`, JSON.stringify(readHistory)); }, [readHistory, uid]);
 
  // fetch news – with offline cache fallback
  const fetchNews = useCallback(async () => {

    setLoading(true);

    const cacheKey = `np_cache_${state}_${CAT_KEYS[category]}`;

    try {

        const cat = CAT_KEYS[category];

        const res = await fetch(
            `http://localhost:5000/api/news?state=${encodeURIComponent(state)}&category=${encodeURIComponent(cat)}`
        );

        if(!res.ok){
            throw new Error("Failed to fetch news");
        }

        const data = await res.json();

        const items = (data.items || []).map(item => ({
            ...item,
            readTime: Math.max(
                1,
                Math.ceil((item.description || item.title || "").split(" ").length / 200)
            ),
            category: cat
        }));

        console.log("NEWS ITEMS:", items);
        localStorage.setItem(
            cacheKey,
            JSON.stringify({
                ts: Date.now(),
                items
            })
        );

        setAllArticles(items);
        setVisibleArticles(items.slice(0, ITEMS_PER_PAGE));
        setPage(1);

        buildPersonalizedFeed(items);

    } catch(err){

        console.log(err);

    }

    setLoading(false);

}, [state, category]);
 
  useEffect(() => { fetchNews(); }, [fetchNews]);
 
  // personalized feed: re-rank by behaviour score
  const buildPersonalizedFeed = (items) => {
    const scored = items.map(item => {
      let score = 0;
      Object.entries(behaviour).forEach(([cat, count]) => {
        if (item.title.toLowerCase().includes(cat) || item.category === cat) score += count;
      });
      keywords.forEach(kw => {
        if (item.title.toLowerCase().includes(kw.toLowerCase())) score += 5;
      });
      return { ...item, score };
    });
    scored.sort((a, b) => b.score - a.score);
    setPersonalizedFeed(scored.slice(0, 20));
  };
 
  const loadMore = useCallback(() => {
    setPage(prev => {
      const next = prev + 1;
      setVisibleArticles(allArticles.slice(0, next * ITEMS_PER_PAGE));
      return next;
    });
  }, [allArticles]);
 
  // track read
  const trackRead = (item) => {
    setBehaviour(prev => ({ ...prev, [item.category]: (prev[item.category] || 0) + 1 }));
    setRecentlyRead(prev => [item, ...prev.filter(a => a.link !== item.link)].slice(0, 30));
    setReadHistory(prev => [{ ...item, readAt: new Date().toISOString() }, ...prev].slice(0, 200));
  };
 
  // bookmarks
  const toggleAppBookmark = (app) => setAppBookmarks(prev => prev.find(a => a.name === app.name) ? prev.filter(a => a.name !== app.name) : [...prev, app]);
  const toggleArticleBookmark = (item) => setArticleBookmarks(prev => prev.find(a => a.link === item.link) ? prev.filter(a => a.link !== item.link) : [...prev, item]);
 
  // collections
  const createCollection = (name) => setCollections(prev => [...prev, { id: Date.now(), name, articles: [] }]);
  const addToCollection = (colId, item) => setCollections(prev => prev.map(c => c.id === colId ? { ...c, articles: c.articles.find(a => a.link === item.link) ? c.articles : [...c.articles, item] } : c));
  const removeCollection = (colId) => setCollections(prev => prev.filter(c => c.id !== colId));
 
  // keywords
  const addKeyword = (kw) => { if (kw && !keywords.includes(kw)) setKeywords(prev => [...prev, kw]); };
  const removeKeyword = (kw) => setKeywords(prev => prev.filter(k => k !== kw));
 
  // heatmap data
  const heatmapData = CAT_KEYS.map(cat => ({ cat, count: behaviour[cat] || 0, icon: CAT_ICONS[CAT_KEYS.indexOf(cat)] })).sort((a, b) => b.count - a.count);
 
  return {
    allArticles, visibleArticles, loading, page, loadMore,
    state, setState, category, setCategory, sourceFilter, setSourceFilter,
    personalizedFeed, fetchNews,
    trackRead, recentlyRead, readHistory,
    appBookmarks, articleBookmarks, toggleAppBookmark, toggleArticleBookmark,
    collections, createCollection, addToCollection, removeCollection,
    keywords, addKeyword, removeKeyword,
    behaviour, heatmapData,
  };
}