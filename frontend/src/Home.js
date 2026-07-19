import { useState, useEffect, useCallback, useMemo, Component } from "react";
import * as assetsModule from "./assets";
import { useNewsStore, CAT_KEYS, CAT_ICONS, STATES } from "./useNewsStore.js";
import ReadMode from "./ReadMode.jsx";
import PodcastMode from "./PodcastMode.jsx";
import Analytics from "./Analytics.jsx";
import Collections from "./Collections.jsx";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

const LANGS = {
  en: { flag:"🇬🇧", label:"EN", title:"NewsPulse", chooseState:"State", selectCat:"Category", searchApps:"Search apps…", searchArt:"Search articles…", apps:"Apps", bookmarks:"Bookmarks", trending:"Trending", recent:"Recent", analytics:"Analytics", collections:"Collections", alerts:"Alerts", save:"Save", remove:"Remove", summarize:"✨ AI Summary", summarizing:"…", play:"🎧 Listen", stop:"⏹ Stop", podcast:"🎙 Podcast", readMode:"📖 Read", loadMore:"Load More", noArticles:"No articles found.", noBookmarks:"No bookmarks.", signOut:"Sign Out", signIn:"Sign In", hello:"Hello", personalized:"For You", minRead:"min read", compare:"⚖️ Compare", share:"Share", addTo:"+ Add to" },
  hi: { flag:"🇮🇳", label:"HI", title:"न्यूज़पल्स", chooseState:"राज्य", selectCat:"श्रेणी", searchApps:"ऐप खोजें…", searchArt:"लेख खोजें…", apps:"ऐप्स", bookmarks:"బుక్‌మార్క్‌లు", trending:"ట్రెండింగ్", recent:"ఇటీవల", analytics:"విశ్లేషణ", collections:"సేకరణలు", alerts:"అలర్ట్‌లు", save:"సేవ్", remove:"తొలగించు", summarize:"✨ సారాంశం", summarizing:"…", play:"🎧 వినండి", stop:"⏹ ఆపు", podcast:"🎙 పాడ్‌కాస్ట్", readMode:"📖 చదువు", loadMore:"మరింత లోడ్", noArticles:"వ్యాసాలు కనుగొనబడలేదు.", noBookmarks:"బుక్‌మార్క్‌లు లేవు.", signOut:"లాగ్ అవుట్", signIn:"లాగిన్", hello:"నమస్కారం", personalized:"మీకోసం", minRead:"నిమిషాలు", compare:"⚖️ పోల్చు", share:"షేర్", addTo:"+ జోడించు" },
  te: { flag:"🏳", label:"TE", title:"న్యూస్‌పల్స్", chooseState:"రాష్ట్రం", selectCat:"వర్గం", searchApps:"యాప్ వెతకండి…", searchArt:"వ్యాసాలు వెతకండి…", apps:"యాప్స్", bookmarks:"బుక్మార్క్", trending:"ట్రెండింగ్", recent:"ఇటీవల", analytics:"విశ్లేషణ", collections:"కలెక్షన్స్", alerts:"అలర్ట్లు", save:"సేవ్", remove:"తొలగించు", summarize:"✨ సారాంశం", summarizing:"…", play:"🎧 వినండి", stop:"⏹ ఆపు", podcast:"🎙 పాడ్‌కాస్ట్", readMode:"📖 చదువు", loadMore:"మరింత లోడ్", noArticles:"వ్యాసాలు కనుగొనబడలేదు.", noBookmarks:"బుక్‌మార్క్‌లు లేవు.", signOut:"లాగ్ అవుట్", signIn:"లాగిన్", hello:"నమస్కారం", personalized:"మీకోసం", minRead:"నిమిషాలు", compare:"⚖️ పోల్చు", share:"షేర్", addTo:"+ జోడించు" },
};

const CAT_LABELS = {
  en: ["General","Sports","Tech","Politics","Entertainment","Business","Science","Health"],
  hi: ["सामान्य","खेल","तकनीक","राजनीति","मनोरंजन","व्यापार","विज्ञान","स्वास्थ्य"],
  te: ["సాధారణ","క్రీడలు","సాంకేతికత","రాజకీయాలు","వినోదం","వ్యాపారం","విజ్ఞానం","ఆరోగ్యం"],
};

function useDebounce(v, d = 350) {
  const [dv, setDv] = useState(v);
  useEffect(() => { const id = setTimeout(() => setDv(v), d); return () => clearTimeout(id); }, [v, d]);
  return dv;
}

export default function Home({ user, onLogout }) {
  // ── ALL ORIGINAL STATE (UNCHANGED) ────────────────────────────────────────
  const [lang, setLang] = useState("en");
  const t = LANGS[lang];
  const catLabels = CAT_LABELS[lang];
  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem("np_dark") || "true"));
  useEffect(() => { localStorage.setItem("np_dark", JSON.stringify(darkMode)); }, [darkMode]);

  const [tab, setTab] = useState("apps");
  const [bmTab, setBmTab] = useState("apps");

  const [appSearch] = useState("");
  const [artSearch, setArtSearch] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const dAppSearch = useDebounce(appSearch);
  const dArtSearch = useDebounce(artSearch);

  const store = useNewsStore(user);

  const totalReads = store.readHistory.length;

  const [summaries, setSummaries] = useState({});
  const [summarizingId, setSummarizingId] = useState(null);
  const [summaryMode, setSummaryMode] = useState({});

  const [speakingId, setSpeakingId] = useState(null);
  const [speechProgress, setSpeechProgress] = useState(0);

  const [readItem, setReadItem] = useState(null);
  const [podcastOpen, setPodcastOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [articleToAdd, setArticleToAdd] = useState(null);
  const [compareItems, setCompareItems] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const [kwInput, setKwInput] = useState("");
  const [alertTriggered, setAlertTriggered] = useState([]);

  const [ setLocationGranted] = useState(false);
  const [locationCity, setLocationCity] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [showAllApps, setShowAllApps] = useState(false);
  

  const [reactions, setReactions] = useState(() => JSON.parse(localStorage.getItem("np_reactions") || "{}"));
  useEffect(() => { localStorage.setItem("np_reactions", JSON.stringify(reactions)); }, [reactions]);
  const reactToItem = (link, type) => {
    setReactions(prev => {
      const current = prev[link];
      if (current === type) { const next = { ...prev }; delete next[link]; return next; }
      return { ...prev, [link]: type };
    });
  };

  useEffect(() => {
    const id = setInterval(() => { store.fetchNews(); }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [store.fetchNews]);

  const [dailySummary, setDailySummary] = useState(null);
  const [loadingDailySummary, setLoadingDailySummary] = useState(false);
  

  const debouncedArticles = useDebounce(store.allArticles, 500);
  useEffect(() => {
    if (!debouncedArticles.length || !store.keywords.length) { setAlertTriggered([]); return; }
    const seen = new Set();
    const triggered = debouncedArticles.filter(item => {
      if (seen.has(item.link)) return false;
      const matches = store.keywords.some(kw => item.title.toLowerCase().includes(kw.toLowerCase()));
      if (matches) seen.add(item.link);
      return matches;
    });
    setAlertTriggered(triggered);
  }, [debouncedArticles, store.keywords]);

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocationError("Geolocation not supported"); return; }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocationGranted(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.state || "Andhra Pradesh";
          setLocationCity(city);
          const matched = STATES.find(s => city.toLowerCase().includes(s.toLowerCase().split(" ")[0].toLowerCase()));
          store.setState(matched || "Andhra Pradesh");
        } catch {
          setLocationCity("Andhra Pradesh");
          store.setState("Andhra Pradesh");
        }
        setLocationLoading(false);
      },
      (err) => {
        setLocationError(err.message || "Location denied");
        setLocationCity("Andhra Pradesh");
        store.setState("Andhra Pradesh");
        setLocationLoading(false);
      },
      { timeout: 8000 }
    );
  };

  // ── AI (UNCHANGED) ────────────────────────────────────────────────────────
  const SUMMARY_MODES = [
    { key: "short",   label: "3 Lines",    icon: "⚡" },
    { key: "points",  label: "Key Points", icon: "📌" },
    { key: "simple",  label: "Simple",     icon: "🧠" },
    { key: "english", label: "English",    icon: "🇬🇧" },
    { key: "hindi",   label: "Hindi",      icon: "🇮🇳" },
    { key: "telugu",  label: "Telugu",     icon: "🏳" },
  ];

  const buildPrompt = (mode, item) => {
    const content = `\nTitle: ${item.title}\n\nDescription:\n${item.description || "No description available"}\n\nSource:\n${item.author || "Unknown"}\n`;
    if (mode === "short") {
      return `\nYou are a professional news editor.\n\nSummarize this news in exactly this format:\n\n📰 Quick Summary\n• Point 1\n• Point 2\n• Point 3\n\n🎯 Why It Matters\n1 short paragraph\n\nNews:\n${content}\n`;
    }
    return `\nYou are a professional journalist.\n\nCreate:\n\n📰 Detailed Summary\n\n📌 Main Story\n2 paragraphs\n\n🔑 Key Facts\n• Fact 1\n• Fact 2\n• Fact 3\n• Fact 4\n\n🎯 Impact\n1 paragraph\n\nNews:\n${content}\n`;
  };

  const summarize = async (item, mode = "short") => {
    const id = item.link;
    const cacheKey = `${id}__${mode}`;
    if (summaries[cacheKey]) { setSummaryMode(prev => ({ ...prev, [id]: mode })); return; }
    setSummarizingId(id);
    setSummaryMode(prev => ({ ...prev, [id]: mode }));
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(buildPrompt(mode, item));
      const text = result.response.text();
      setSummaries(prev => ({ ...prev, [cacheKey]: text }));
    } catch (err) {
      console.error("Gemini Error:", err);
      setSummaries(prev => ({ ...prev, [cacheKey]: `⚠️ ${err.message}` }));
    } finally {
      setSummarizingId(null);
    }
  };

  const getDailySummary = async () => {
    setLoadingDailySummary(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const top5 = store.allArticles.slice(0, 5).map(a => `• ${a.title}`).join("\n");
      const result = await model.generateContent(`\nYou are an editor of a premium news app.\n\nCreate a professional daily briefing.\n\nFormat:\n\n☀️ Morning Brief\n\n1. Top Story\n2. Politics\n3. Business\n4. Technology\n5. Sports\n\nKeep it under 250 words.\n\nHeadlines:\n\n${top5}\n`);
      setDailySummary(result.response.text());
    } catch (err) {
      console.error(err);
      setDailySummary("⚠️ Could not generate briefing");
    } finally {
      setLoadingDailySummary(false);
    }
  };

  const speakItem = (item) => {
    window.speechSynthesis.cancel();
    if (speakingId === item.link) { setSpeakingId(null); setSpeechProgress(0); return; }
    const utter = new SpeechSynthesisUtterance(item.title);
    utter.onstart = () => { setSpeakingId(item.link); setSpeechProgress(0); };
    utter.onend = () => { setSpeakingId(null); setSpeechProgress(100); setTimeout(() => setSpeechProgress(0), 1000); };
    window.speechSynthesis.speak(utter);
  };

  const toggleCompare = (item) => {
    setCompareItems(prev => {
      if (prev.find(a => a.link === item.link)) return prev.filter(a => a.link !== item.link);
      if (prev.length >= 2) return [prev[1], item];
      return [...prev, item];
    });
  };

  const shareArticle = (item) => {
    if (navigator.share) {
      navigator.share({ title: item.title, url: item.link }).catch(() => {});
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(item.title + " " + item.link)}`;
      window.open(waUrl, "_blank");
    }
  };

  // ── newsApps (UNCHANGED) ───────────────────────────────────────────────────
const icons = assetsModule.icons;
  const newsApps = {
  "Andhra Pradesh": [
    { name: "Eenadu", url: "https://www.eenadu.net", icon: icons.eenadu },
    { name: "Sakshi", url: "https://www.sakshi.com", icon: icons.sakshi },
    { name: "TV9 Telugu", url: "https://tv9telugu.com", icon: icons.tv9Telugu },
    { name: "Andhra Jyothi", url: "https://www.andhrajyothy.com", icon: icons.andhraJyothi },
    { name: "NTV Telugu", url: "https://ntvtelugu.com", icon: icons.ntvTelugu },
    { name: "TV5 News", url: "https://www.tv5news.in", icon: icons.tv5News }
  ],
  "Telangana": [
    { name: "Eenadu", url: "https://www.eenadu.net", icon: icons.eenadu },
    { name: "Sakshi", url: "https://www.sakshi.com", icon: icons.sakshi },
    { name: "Namasthe Telangana", url: "https://www.ntnews.com", icon: icons.namastheTelangana },
    { name: "V6 News", url: "https://www.v6velugu.com", icon: icons.v6News },
    { name: "T News", url: "https://tnewstelugu.com", icon: icons.placeholder },
    { name: "TV9 Telugu", url: "https://tv9telugu.com", icon: icons.tv9Telugu }
  ],
  "Karnataka": [
    { name: "Prajavani", url: "https://www.prajavani.net", icon: icons.prajavani },
    { name: "Vijaya Karnataka", url: "https://vijaykarnataka.com", icon: icons.vijayaKarnataka },
    { name: "Vijayavani", url: "https://www.vijayavani.net", icon: icons.vijayavani },
    { name: "News18 Kannada", url: "https://kannada.news18.com", icon: icons.news18Kannada },
    { name: "TV9 Kannada", url: "https://tv9kannada.com", icon: icons.tv9Kannada },
    { name: "Public TV", url: "https://publictv.in", icon: icons.placeholder }
  ],
  "Tamil Nadu": [
    { name: "Dina Thanthi", url: "https://www.dailythanthi.com", icon: icons.dinaThanthi },
    { name: "Dinamalar", url: "https://www.dinamalar.com", icon: icons.dinamalar },
    { name: "The Hindu (Tamil)", url: "https://www.hindutamil.in", icon: icons.theHindu },
    { name: "Puthiya Thalaimurai", url: "https://www.puthiyathalaimurai.com", icon: icons.puthiyaThalaimurai },
    { name: "Sun News", url: "https://www.sunnewslive.in", icon: icons.sunNews },
    { name: "Polimer News", url: "https://www.polimernews.com", icon: icons.placeholder }
  ],
  "Kerala": [
    { name: "Malayala Manorama", url: "https://www.manoramaonline.com", icon: icons.manorama },
    { name: "Mathrubhumi", url: "https://www.mathrubhumi.com", icon: icons.mathrubhumi },
    { name: "Asianet News", url: "https://www.asianetnews.com", icon: icons.asianetNews },
    { name: "Deshabhimani", url: "https://www.deshabhimani.com", icon: icons.deshabhimani },
    { name: "24 News", url: "https://www.twentyfournews.com", icon: icons.placeholder },
    { name: "Mathrubhumi News", url: "https://www.mathrubhuminews.in", icon: icons.mathrubhumi }
  ],
  "Maharashtra": [
    { name: "Lokmat", url: "https://www.lokmat.com", icon: icons.lokmat },
    { name: "Sakal", url: "https://www.esakal.com", icon: icons.sakal },
    { name: "Loksatta", url: "https://www.loksatta.com", icon: icons.loksatta },
    { name: "ABP Majha", url: "https://marathi.abplive.com", icon: icons.abpMajha },
    { name: "Zee 24 Taas", url: "https://zeenews.india.com/marathi", icon: icons.zee24Taas },
    { name: "TV9 Marathi", url: "https://www.tv9marathi.com", icon: icons.placeholder }
  ],
  "Gujarat": [
    { name: "Gujarat Samachar", url: "https://www.gujaratsamachar.com", icon: icons.gujaratSamachar },
    { name: "Sandesh", url: "https://sandesh.com", icon: icons.sandesh },
    { name: "Divya Bhaskar", url: "https://www.divyabhaskar.co.in", icon: icons.divyaBhaskar },
    { name: "TV9 Gujarati", url: "https://tv9gujarati.com", icon: icons.tv9Gujarati },
    { name: "ABP Asmita", url: "https://gujarati.abplive.com", icon: icons.abpMajha },
    { name: "VTV Gujarati", url: "https://www.vtvgujarati.com", icon: icons.placeholder }
  ],
  "Madhya Pradesh": [
    { name: "Dainik Bhaskar", url: "https://www.bhaskar.com", icon: icons.dainikBhaskar },
    { name: "Patrika MP", url: "https://www.patrika.com/madhya-pradesh-news", icon: icons.patrika },
    { name: "Nai Dunia", url: "https://www.naidunia.com", icon: icons.naiDunia },
    { name: "IBC24", url: "https://www.ibc24.in", icon: icons.ibc24 },
    { name: "Zee MP CG", url: "https://zeenews.india.com/hindi/india/mp-cg", icon: icons.placeholder },
    { name: "News18 MP", url: "https://hindi.news18.com/madhya-pradesh/", icon: icons.placeholder }
  ],
  "Chhattisgarh": [
    { name: "Dainik Bhaskar", url: "https://www.bhaskar.com/chhattisgarh", icon: icons.dainikBhaskar },
    { name: "Nava Bharat", url: "https://www.enavabharat.com", icon: icons.navaBharat },
    { name: "IBC24", url: "https://www.ibc24.in", icon: icons.ibc24 },
    { name: "Patrika CG", url: "https://www.patrika.com/chhattisgarh-news", icon: icons.patrika },
    { name: "Zee MP CG", url: "https://zeenews.india.com/hindi/india/mp-cg", icon: icons.placeholder },
    { name: "Hari Bhoomi", url: "https://www.haribhoomi.com", icon: icons.placeholder }
  ],
  "Goa": [
    { name: "The Navhind Times", url: "https://www.navhindtimes.in", icon: icons.navhindTimes },
    { name: "OHeraldo", url: "https://www.heraldgoa.in", icon: icons.oHeraldo },
    { name: "Prudent Media", url: "https://www.prudentmedia.in", icon: icons.prudentMedia },
    { name: "Goa 365", url: "https://www.goa365.tv", icon: icons.placeholder },
    { name: "Tarun Bharat Goa", url: "https://www.tarunbharat.com", icon: icons.placeholder },
    { name: "Gomantak", url: "https://www.esakkal.com/gomantak", icon: icons.sakal }
  ],
  "Uttar Pradesh": [
    { name: "Dainik Jagran", url: "https://www.jagran.com", icon: icons.dainikJagran },
    { name: "Amar Ujala", url: "https://www.amarujala.com", icon: icons.amarUjala },
    { name: "Hindustan Hindi", url: "https://www.livehindustan.com", icon: icons.hindustan },
    { name: "ABP Ganga", url: "https://www.abplive.com/states/up-uk", icon: icons.abpGanga },
    { name: "Zee UP UK", url: "https://zeenews.india.com/hindi/india/up-uttarakhand", icon: icons.placeholder },
    { name: "Bharat Samachar", url: "https://bharatsamachartv.in", icon: icons.placeholder }
  ],
  "Punjab": [
    { name: "Ajit Daily", url: "http://www.ajitjalandhar.com", icon: icons.ajit },
    { name: "Jag Bani", url: "https://jagbani.punjabkesari.in", icon: icons.jagBani },
    { name: "PTC News", url: "https://www.ptcnews.tv", icon: icons.ptcNews },
    { name: "The Tribune", url: "https://www.tribuneindia.com", icon: icons.tribune },
    { name: "Zee PHH", url: "https://zeenews.india.com/hindi/zee-phh", icon: icons.zeePhh },
    { name: "Rozana Spokesman", url: "https://www.rozanaspokesman.com", icon: icons.placeholder }
  ],
  "Haryana": [
    { name: "Dainik Bhaskar", url: "https://www.bhaskar.com/haryana", icon: icons.dainikBhaskar },
    { name: "Punjab Kesari Haryana", url: "https://haryana.punjabkesari.in", icon: icons.punjabKesari },
    { name: "Zee PHH", url: "https://zeenews.india.com/hindi/zee-phh", icon: icons.zeePhh },
    { name: "The Tribune Haryana", url: "https://www.tribuneindia.com/news/haryana", icon: icons.tribune },
    { name: "Total TV", url: "http://totaltv.in", icon: icons.placeholder },
    { name: "India News Haryana", url: "https://indianews.in/haryana", icon: icons.placeholder }
  ],
  "Himachal Pradesh": [
    { name: "Divya Himachal", url: "https://www.divyahimachal.com", icon: icons.divyaHimachal },
    { name: "Amar Ujala HP", url: "https://www.amarujala.com/himachal-pradesh", icon: icons.amarUjala },
    { name: "Punjab Kesari HP", url: "https://hp.punjabkesari.in", icon: icons.punjabKesari },
    { name: "Zee PHH", url: "https://zeenews.india.com/hindi/zee-phh", icon: icons.zeePhh },
    { name: "News18 Himachal", url: "https://hindi.news18.com/himachal-pradesh/", icon: icons.placeholder },
    { name: "Himachal Dastak", url: "https://himachaldastak.com", icon: icons.placeholder }
  ],
  "Uttarakhand": [
    { name: "Amar Ujala UK", url: "https://www.amarujala.com/uttarakhand", icon: icons.amarUjala },
    { name: "Dainik Jagran UK", url: "https://www.jagran.com/uttarakhand", icon: icons.dainikJagran },
    { name: "Zee UP UK", url: "https://zeenews.india.com/hindi/india/up-uttarakhand", icon: icons.placeholder },
    { name: "News18 Uttarakhand", url: "https://hindi.news18.com/uttarakhand/", icon: icons.placeholder },
    { name: "ABP Ganga", url: "https://www.abplive.com/states/up-uk", icon: icons.abpGanga },
    { name: "Hindustan Uttarakhand", url: "https://www.livehindustan.com/uttarakhand", icon: icons.hindustan }
  ],
  "Rajasthan": [
    { name: "Rajasthan Patrika", url: "https://www.patrika.com", icon: icons.rajasthanPatrika },
    { name: "Dainik Bhaskar Rajasthan", url: "https://www.bhaskar.com/rajasthan", icon: icons.dainikBhaskar },
    { name: "First India News", url: "https://firstindianews.com", icon: icons.firstIndia },
    { name: "Zee Rajasthan", url: "https://zeenews.india.com/hindi/india/rajasthan", icon: icons.placeholder },
    { name: "News18 Rajasthan", url: "https://hindi.news18.com/rajasthan/", icon: icons.placeholder },
    { name: "Amar Ujala Rajasthan", url: "https://www.amarujala.com", icon: icons.amarUjala }
  ],
  "Bihar": [
    { name: "Hindustan Bihar", url: "https://www.livehindustan.com/bihar", icon: icons.hindustan },
    { name: "Dainik Jagran Bihar", url: "https://www.jagran.com/bihar", icon: icons.dainikJagran },
    { name: "Prabhat Khabar", url: "https://www.prabhatkhabar.com", icon: icons.prabhatKhabar },
    { name: "News18 Bihar", url: "https://hindi.news18.com/bihar", icon: icons.news18Bihar },
    { name: "Zee Bihar Jharkhand", url: "https://zeenews.india.com/hindi/india/bihar-jharkhand", icon: icons.placeholder },
    { name: "Kashish News", url: "http://www.kashishnews.com", icon: icons.placeholder }
  ],
  "Jharkhand": [
    { name: "Prabhat Khabar", url: "https://www.prabhatkhabar.com/jharkhand", icon: icons.prabhatKhabar },
    { name: "Dainik Jagran Jharkhand", url: "https://www.jagran.com/jharkhand", icon: icons.dainikJagran },
    { name: "Dainik Bhaskar Jharkhand", url: "https://www.bhaskar.com/jharkhand", icon: icons.dainikBhaskar },
    { name: "News18 Jharkhand", url: "https://hindi.news18.com/jharkhand/", icon: icons.news18Bihar },
    { name: "Zee Bihar Jharkhand", url: "https://zeenews.india.com/hindi/india/bihar-jharkhand", icon: icons.placeholder },
    { name: "News11 Bharat", url: "https://news11.in", icon: icons.placeholder }
  ],
  "West Bengal": [
    { name: "Anandabazar Patrika", url: "https://www.anandabazar.com", icon: icons.anandabazar },
    { name: "Bartaman Patrika", url: "https://bartamanpatrika.com", icon: icons.bartaman },
    { name: "ABP Ananda", url: "https://bengali.abplive.com", icon: icons.abpAnanda },
    { name: "Zee 24 Ghanta", url: "https://zeenews.india.com/bengali", icon: icons.zee24Ghanta },
    { name: "News18 Bangla", url: "https://bengali.news18.com", icon: icons.placeholder },
    { name: "Republic Bangla", url: "https://bangla.republicworld.com", icon: icons.placeholder }
  ],
  "Odisha": [
    { name: "Sambad", url: "https://www.sambad.in", icon: icons.sambad },
    { name: "Dharitri", url: "https://www.dharitri.com", icon: icons.dharitri },
    { name: "Samaja", url: "https://thesamaja.com", icon: icons.samaja },
    { name: "OTV News", url: "https://odishatv.in", icon: icons.otv },
    { name: "Kanak News", url: "https://kanaknews.com", icon: icons.placeholder },
    { name: "Kalinga TV", url: "https://kalingatv.com", icon: icons.placeholder }
  ],
  "Assam": [
    { name: "Asomiya Pratidin", url: "https://www.asomiyapratidin.in", icon: icons.asomiyaPratidin },
    { name: "The Assam Tribune", url: "https://assamtribune.com", icon: icons.assamTribune },
    { name: "News Live", url: "https://newslivetv.com", icon: icons.newsLive },
    { name: "DY365", url: "http://dy365.in", icon: icons.dy365 },
    { name: "Pratidin Time", url: "https://www.pratidintime.com", icon: icons.placeholder },
    { name: "Prag News", url: "https://pragnews.com", icon: icons.placeholder }
  ],
  "Arunachal Pradesh": [
    { name: "The Arunachal Times", url: "https://arunachaltimes.in", icon: icons.arunachalTimes },
    { name: "Arunachal24", url: "https://arunachal24.in", icon: icons.arunachal24 },
    { name: "Echo of Arunachal", url: "http://www.echoofarunachal.in", icon: icons.placeholder },
    { name: "Eastern Sentinel", url: "http://www.easternsentinel.in", icon: icons.placeholder },
    { name: "Hornbill TV AP", url: "https://hornbilltv.com", icon: icons.placeholder },
    { name: "Itanagar News", url: "https://arunachal24.in/category/itanagar/", icon: icons.arunachal24 }
  ],
  "Manipur": [
    { name: "The Sangai Express", url: "https://www.thesangaiexpress.com", icon: icons.sangaiExpress },
    { name: "Imphal Free Press", url: "https://www.ifp.co.in", icon: icons.imphalFreePress },
    { name: "Poknapham", url: "http://www.poknapham.in", icon: icons.placeholder },
    { name: "ISTV News", url: "http://www.istv.in", icon: icons.placeholder },
    { name: "Impact TV", url: "http://impacttv.in", icon: icons.placeholder },
    { name: "Tom TV", url: "https://tomtv.in", icon: icons.placeholder }
  ],
  "Meghalaya": [
    { name: "The Shillong Times", url: "https://theshillongtimes.com", icon: icons.shillongTimes },
    { name: "Mawphor", url: "https://mawphor.com", icon: icons.mawphor },
    { name: "Meghalaya Guardian", url: "http://www.meghalayaguardian.com", icon: icons.placeholder },
    { name: "Highland Post", url: "https://highlandpost.com", icon: icons.placeholder },
    { name: "PCN News", url: "https://www.youtube.com/@PCNNewsShillong", icon: icons.placeholder },
    { name: "Batesi TV", url: "https://batesitv.com", icon: icons.placeholder }
  ],
  "Mizoram": [
    { name: "Vanglaini", url: "https://www.vanglaini.org", icon: icons.vanglaini },
    { name: "Zonet News", url: "https://zonet.in", icon: icons.zonet },
    { name: "LPS News", url: "https://lpscom.in", icon: icons.placeholder },
    { name: "Aizawl Post", url: "http://www.theaizawlpost.org", icon: icons.placeholder },
    { name: "Highlander Mizoram", url: "http://mizoramhighlander.in", icon: icons.placeholder },
    { name: "Zalen News", url: "http://www.zalen.in", icon: icons.placeholder }
  ],
  "Nagaland": [
    { name: "Nagaland Post", url: "https://nagalandpost.com", icon: icons.nagalandPost },
    { name: "Morung Express", url: "https://morungexpress.com", icon: icons.morungExpress },
    { name: "Eastern Mirror", url: "https://easternmirrornagaland.com", icon: icons.placeholder },
    { name: "Hornbill TV", url: "https://hornbilltv.com", icon: icons.placeholder },
    { name: "NLTV Nagaland", url: "https://nagalandtv.com", icon: icons.placeholder },
    { name: "Nagaland Page", url: "https://nagalandpage.com", icon: icons.placeholder }
  ],
  "Sikkim": [
    { name: "Sikkim Express", url: "http://www.sikkimexpress.com", icon: icons.sikkimExpress },
    { name: "Sikkim Chronicle", url: "https://www.thesikkimchronicle.com", icon: icons.sikkimChronicle },
    { name: "Summit Times", url: "https://summittimes.in", icon: icons.placeholder },
    { name: "Voice of Sikkim", url: "https://voiceofsikkim.com", icon: icons.placeholder },
    { name: "Hamro Prajashakti", url: "http://prajashakti.in", icon: icons.placeholder },
    { name: "Now Sikkim", url: "http://www.nowsikkim.in", icon: icons.placeholder }
  ],
  "Tripura": [
    { name: "Dainik Sambad", url: "http://www.dainiksambadtripura.com", icon: icons.dainikSambad },
    { name: "Syandan Patrika", url: "https://www.syandanpatrika.com", icon: icons.syandanPatrika },
    { name: "News Vanguard", url: "https://newsvanguard.com", icon: icons.placeholder },
    { name: "PB 24", url: "https://pb24.tv", icon: icons.placeholder },
    { name: "Headlines Tripura", url: "http://headlinestripura.com", icon: icons.placeholder },
    { name: "Tripura Times", url: "http://tripuratimes.com", icon: icons.placeholder }
  ],
  "Jammu and Kashmir": [
    { name: "Greater Kashmir", url: "https://www.greaterkashmir.com", icon: icons.placeholder },
    { name: "Daily Excelsior", url: "https://www.dailyexcelsior.com", icon: icons.placeholder },
    { name: "Gulistan News", url: "https://www.gulistannews.in", icon: icons.placeholder },
    { name: "Zee Salaam", url: "https://zeenews.india.com/urdu/zee-salaam", icon: icons.placeholder },
    { name: "News18 JK", url: "https://urdu.news18.com/news/jammu-kashmir/", icon: icons.placeholder },
    { name: "JK Media", url: "https://jkmediatv.com", icon: icons.placeholder }
  ],
  "Ladakh": [
    { name: "Reach Ladakh", url: "https://www.reachladakh.com", icon: icons.placeholder },
    { name: "News18 Ladakh", url: "https://hindi.news18.com/tag/ladakh/", icon: icons.placeholder },
    { name: "Gulistan News Ladakh", url: "https://www.gulistannews.in", icon: icons.placeholder },
    { name: "DD Leh", url: "https://prasarbharati.gov.in", icon: icons.placeholder },
    { name: "Voice of Ladakh", url: "https://voiceofladakh.in", icon: icons.placeholder },
    { name: "Ladakh Times", url: "https://ladakhtimes.com", icon: icons.placeholder }
  ],
  "Delhi": [
    { name: "Aaj Tak", url: "https://www.aajtak.in", icon: icons.placeholder },
    { name: "ABP News", url: "https://www.abplive.com", icon: icons.placeholder },
    { name: "Zee News", url: "https://zeenews.india.com", icon: icons.placeholder },
    { name: "NDTV India", url: "https://ndtv.in", icon: icons.placeholder },
    { name: "Times of India Delhi", url: "https://timesofindia.indiatimes.com/city/delhi", icon: icons.placeholder },
    { name: "Hindustan Times Delhi", url: "https://www.hindustantimes.com/delhi-news", icon: icons.placeholder }
  ],
  "Chandigarh": [
    { name: "PTC News", url: "https://www.ptcnews.tv", icon: icons.ptcNews },
    { name: "The Tribune", url: "https://www.tribuneindia.com", icon: icons.tribune },
    { name: "Zee PHH", url: "https://zeenews.india.com/hindi/zee-phh", icon: icons.zeePhh },
    { name: "News18 Punjab Haryana", url: "https://hindi.news18.com/punjab-haryana/", icon: icons.placeholder },
    { name: "Punjab Kesari Chandigarh", url: "https://chandigarh.punjabkesari.in", icon: icons.punjabKesari },
    { name: "Living India News", url: "https://livingindianews.co.in", icon: icons.placeholder }
  ],
  "Puducherry": [
    { name: "Thanthi TV", url: "https://www.thanthitv.com", icon: icons.dinaThanthi },
    { name: "Puthiya Thalaimurai", url: "https://www.puthiyathalaimurai.com", icon: icons.puthiyaThalaimurai },
    { name: "Sun News", url: "https://www.sunnewslive.in", icon: icons.sunNews },
    { name: "Dinamalar Pondy", url: "https://www.dinamalar.com", icon: icons.dinamalar },
    { name: "News7 Tamil", url: "https://ns7.tv", icon: icons.placeholder },
    { name: "Polimer News Pondy", url: "https://www.polimernews.com", icon: icons.placeholder }
  ],
  "Lakshadweep": [
    { name: "Asianet News", url: "https://www.asianetnews.com", icon: icons.asianetNews },
    { name: "24 News", url: "https://www.twentyfournews.com", icon: icons.placeholder },
    { name: "Mathrubhumi News", url: "https://www.mathrubhumi.com", icon: icons.mathrubhumi },
    { name: "Malayala Manorama Lakshadweep", url: "https://www.manoramaonline.com", icon: icons.manorama },
    { name: "MediaOne", url: "https://www.mediaoneonline.com", icon: icons.placeholder },
    { name: "Reporter TV", url: "https://www.reporterlive.com", icon: icons.placeholder }
  ],
  "Andaman and Nicobar Islands": [
    { name: "The Andaman Chronicle", url: "https://www.andamanchronicle.net", icon: icons.placeholder },
    { name: "Andaman Sheekha", url: "https://www.andamansheekha.com", icon: icons.placeholder },
    { name: "Echo of India Port Blair", url: "https://echoofindia.com", icon: icons.placeholder },
    { name: "Andaman Express", url: "http://andamanexpress.org", icon: icons.placeholder },
    { name: "Aaj Tak National", url: "https://www.aajtak.in", icon: icons.placeholder },
    { name: "Times Now", url: "https://www.timesnownews.com", icon: icons.placeholder }
  ],
  "Dadra and Nagar Haveli and Daman and Diu": [
    { name: "TV9 Gujarati", url: "https://tv9gujarati.com", icon: icons.tv9Gujarati },
    { name: "ABP Asmita", url: "https://gujarati.abplive.com", icon: icons.abpMajha },
    { name: "Sandesh News", url: "https://sandesh.com", icon: icons.sandesh },
    { name: "VTV Gujarati", url: "https://www.vtvgujarati.com", icon: icons.placeholder },
    { name: "Gujarat Samachar Daman", url: "https://www.gujaratsamachar.com", icon: icons.gujaratSamachar },
    { name: "Divya Bhaskar Silvassa", url: "https://www.divyabhaskar.co.in", icon: icons.divyaBhaskar }
  ]
};

  const appsForState = newsApps[store.state] || newsApps["Andhra Pradesh"];
  const appsPerSlide = 3;
  const filteredApps = useMemo(() =>
    appsForState.filter(a => a.name.toLowerCase().includes(dAppSearch.toLowerCase())),
    [appsForState, dAppSearch]
  );
  const visibleApps = showAllApps
  ? filteredApps
  : filteredApps.slice(
      currentSlide * appsPerSlide,
      currentSlide * appsPerSlide + appsPerSlide
    );

const totalSlides = Math.ceil(filteredApps.length / appsPerSlide);
// ── FIX: Deduplicated Article Filter Engine ──
// 1. Compute Personalized Feed based on user history, category, AND the selected state
  const personalizedArticles = useMemo(() => {
    const activeCategoryKey = CAT_KEYS[store.category]?.toLowerCase();

    // Extract words the user reads often from their history titles
    const historyWords = store.readHistory.flatMap(item => 
      (item.title || "").toLowerCase().split(/\s+/)
    ).filter(word => word.length > 5);

    const historySet = new Set(historyWords);
    const seen = new Set();

    return store.allArticles.filter(article => {
      const titleLower = (article.title || "").toLowerCase();
      const articleCategory = (article.category || "").toLowerCase();
      
      // Gate 1: Must match the active category selection
      if (articleCategory !== activeCategoryKey) return false;
      
      // Gate 2: De-duplicate checking
      if (seen.has(titleLower)) return false;

      // Check if this article matches reading history or active keywords
      const matchesHistory = [...historySet].some(word => titleLower.includes(word));
      const matchesKeywords = store.keywords.some(kw => titleLower.includes(kw.toLowerCase()));

      // Fallback: If no history exists yet, show general items for that category/state
      const showAsFallback = store.readHistory.length === 0;

      if (matchesHistory || matchesKeywords || showAsFallback) {
        seen.add(titleLower);
        return true;
      }
      return false;
    }).slice(0, 5); 
    // ⚠️ CRITICAL FIX: Added store.state to the dependency array so it recalculates on region change!
  }, [store.allArticles, store.readHistory, store.keywords, store.category, store.state]); 

  // 2. Compute Latest News (filtering by active category, search query, and selected state)
  const filteredArticles = useMemo(() => {
    const query = dArtSearch.toLowerCase();
    const activeCategoryKey = CAT_KEYS[store.category]?.toLowerCase();
    const recommendedTitles = new Set(personalizedArticles.map(a => (a.title || "").toLowerCase().trim()));
    const seen = new Set();

    return store.visibleArticles.filter(article => {
      const titleLower = (article.title || "").toLowerCase().trim();
      const articleCategory = (article.category || "").toLowerCase();

      // Gate 1: Must match the active category selection
      if (articleCategory !== activeCategoryKey) return false;

      // Gate 2: Skip if already seen or showing in Recommendations above
      if (seen.has(titleLower) || recommendedTitles.has(titleLower)) {
        return false;
      }

      const matchesSearch =
        article.title?.toLowerCase().includes(query) ||
        article.description?.toLowerCase().includes(query) ||
        article.category?.toLowerCase().includes(query);

      if (matchesSearch) {
        seen.add(titleLower);
        return true;
      }
      return false;
    });
    // ⚠️ CRITICAL FIX: Added store.state to the dependency array here as well!
  }, [store.visibleArticles, dArtSearch, personalizedArticles, store.category, store.state]);

  const trendingTopics = useMemo(() =>
    [...new Set(store.allArticles.flatMap(a => a.title.split(/\s+/).filter(w => w.length > 5 && /^[A-Za-z]/.test(w))))].slice(0, 16),
    [store.allArticles]
  );

  // ── PREMIUM DESIGN SYSTEM ──────────────────────────────────────────────────
  const dm = darkMode;
  const P = "#c3ccccec";   // primary orange
  const S = "#b924b9";   // secondary purple

  const c = {
    bg:       dm ? "#0D1117" : "#F8FAFC",
    surface:  dm ? "#161B22" : "#FFFFFF",
    surface2: dm ? "#1C2128" : "#F1F5F9",
    surface3: dm ? "#21262D" : "#E2E8F0",
    glass:    dm ? "rgba(22,27,34,0.92)" : "rgba(255,255,255,0.92)",
    border:   dm ? "rgba(48,54,61,1)" : "rgba(226,232,240,1)",
    borderSoft: dm ? "rgba(48,54,61,0.6)" : "rgba(226,232,240,0.8)",
    text:     dm ? "#E6EDF3" : "#0F172A",
    textSub:  dm ? "#8B949E" : "#475569",
    muted:    dm ? "#6E7681" : "#94A3B8",
    accent:   P,
    accent2:  "#FF4500",
    accentBg: dm ? "rgba(255,122,0,0.08)" : "rgba(255,122,0,0.06)",
    purple:   S,
    purpleBg: dm ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.06)",
    blue:     "#3B82F6",
    blueBg:   dm ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.06)",
    green:    "#10B981",
    greenBg:  dm ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)",
    red:      "#EF4444",
    redBg:    dm ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.06)",
    indigo:   "#6366F1",
    indigoBg: dm ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)",
    success:  "#10B981",
    danger:   "#EF4444",
    shadow:   dm ? "0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
    shadowMd: dm ? "0 4px 16px rgba(0,0,0,0.5), 0 12px 40px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.08)",
    shadowLg: dm ? "0 8px 32px rgba(0,0,0,0.6), 0 24px 64px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.08), 0 24px 64px rgba(0,0,0,0.1)",
    shadowAccent: "0 4px 20px rgba(255,122,0,0.35)",
    shadowPurple: "0 4px 20px rgba(124,58,237,0.3)",
    gradPrimary:  `linear-gradient(135deg, ${P} 0%, #FF4500 100%)`,
    gradPurple:   `linear-gradient(135deg, ${S} 0%, #6D28D9 100%)`,
    gradHero:     dm
      ? "linear-gradient(135deg, rgba(255,122,0,0.12) 0%, rgba(124,58,237,0.08) 50%, rgba(59,130,246,0.06) 100%)"
      : "linear-gradient(135deg, rgba(255,122,0,0.06) 0%, rgba(124,58,237,0.04) 50%, rgba(248,250,252,1) 100%)",
  };
  const menuBtn = {
  width: "100%",
  padding: "12px 16px",
  border: "none",
  background: "transparent",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "13px",
  color: c.text,
  transition: "0.2s"
};

  const s = {
    root: {
      background: c.bg,
      color: c.text,
      minHeight: "100vh",
      fontFamily: "'Inter', 'DM Sans', -apple-system, sans-serif",
      transition: "background 0.3s, color 0.3s",
    },
    nav: {
      display: "flex", alignItems: "center", gap: "8px",
      padding: "0 20px", height: "60px",
      background: c.glass,
      backdropFilter: "blur(24px) saturate(180%)",
      WebkitBackdropFilter: "blur(24px) saturate(180%)",
      borderBottom: `1px solid ${c.border}`,
      position: "sticky", top: 0, zIndex: 200,
    },
    logo: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontWeight: 900, fontSize: "20px",
      background: c.gradPrimary,
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      letterSpacing: "-0.3px", flexShrink: 0,
    },
    wrap: { maxWidth: "1080px", margin: "0 auto", padding: "24px 16px" },
    card: {
      background: c.surface,
      border: `1px solid ${c.border}`,
      borderRadius: "16px",
      padding: "18px",
      boxShadow: c.shadow,
      marginBottom: "12px",
      transition: "transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s ease",
    },
    tabs: {
      display: "flex", gap: "3px", marginBottom: "24px",
      background: c.surface2,
      borderRadius: "14px", padding: "4px",
      border: `1px solid ${c.border}`,
      flexWrap: "wrap",
      overflowX: "auto",
    },
    tab: (a) => ({
      padding: "7px 14px", borderRadius: "10px", border: "none",
      background: a ? c.gradPrimary : "transparent",
      color: a ? "#fff" : c.muted,
      fontWeight: a ? 700 : 500,
      cursor: "pointer", fontSize: "13px",
      transition: "all 0.18s ease",
      boxShadow: a ? c.shadowAccent : "none",
      whiteSpace: "nowrap", flexShrink: 0,
    }),
    input: {
      width: "100%", padding: "11px 16px",
      borderRadius: "12px",
      border: `1.5px solid ${c.border}`,
      background: c.surface2,
      color: c.text, fontSize: "14px", outline: "none",
      boxSizing: "border-box",
      transition: "border-color 0.2s, box-shadow 0.2s",
      fontFamily: "inherit",
    },
btn: (bg, sm) => ({
  padding: sm ? "10px 18px" : "12px 22px",
  borderRadius: "999px",
  border: "1px solid rgba(0,0,0,.06)",
  background: bg || c.surface2,
  color: bg ? "#fff" : c.text,
  fontWeight: 600,
  fontSize: sm ? "14px" : "15px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  cursor: "pointer",
  transition: "all .28s cubic-bezier(.4,0,.2,1)",
  whiteSpace: "nowrap",
  fontFamily: "inherit",
  boxShadow: dm
    ? "0 4px 14px rgba(0,0,0,.25)"
    : "0 4px 14px rgba(0,0,0,.08)",
}),
    select: {
      background: c.surface2, color: c.text,
      border: `1.5px solid ${c.border}`,
      borderRadius: "11px", padding: "9px 12px",
      fontSize: "13px", outline: "none", cursor: "pointer",
      fontFamily: "inherit",
    },
    sectionTitle: {
      fontSize: "17px", fontWeight: 700, color: c.text,
      marginBottom: "16px", letterSpacing: "-0.2px",
      display: "flex", alignItems: "center", gap: "8px",
    },
    badge: (color) => ({
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      padding: "1px 7px", borderRadius: "20px",
      background: color || c.purple,
      color: "#fff", fontSize: "10px", fontWeight: 700,
      marginLeft: "5px", minWidth: "18px",
    }),
    appGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
      gap: "14px",
    },
    appCard: {
      background: c.surface,
      border: `1px solid ${c.border}`,
      borderRadius: "18px",
      padding: "20px 14px 16px",
      textAlign: "center",
      cursor: "pointer",
      transition: "transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease, border-color 0.2s",
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: "10px",
      boxShadow: c.shadow,
    },
  };

  // ── Premium ArticleCard ────────────────────────────────────────────────────
 
  const ArticleCard = useCallback(({ item, compact }) => {
    console.log(JSON.stringify(item, null, 2));
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
    console.log("ARTICLE ITEM:", item);
    const openArticle = async () => {

    store.trackRead(item);

    try {

        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/article?url=${encodeURIComponent(item.link)}`
);

        const data = await res.json();

        if (!res.ok || data.error) {
            throw new Error(data.error || "Failed");
        }

        setReadItem({
            ...item,
            title: data.title || item.title,
            content: data.content,
            text: data.text,
            image: data.image,
            favicon: data.favicon,
            siteName: data.siteName,
            excerpt: data.excerpt,
            originalUrl: data.originalUrl
        });

    } catch {

        setReadItem(item);

    }

};
return (
<div
    style={{
        background: dm
            ? "linear-gradient(180deg,#1B2333,#111827)"
            : "#fff",

        borderRadius:"22px",
        padding:"18px",
        marginBottom:"18px",
        display:"flex",
        gap:"18px",
        alignItems:"center",
        border:`2px solid ${c.border}`,
        boxShadow:c.shadow,
        transition:".35s",
        cursor:"default"
    }}



    onMouseEnter={e=>{
        e.currentTarget.style.transform="translateY(-3px)";
        e.currentTarget.style.boxShadow=c.shadowMd;
    }}

    onMouseLeave={e=>{
        e.currentTarget.style.transform="";
        e.currentTarget.style.boxShadow=c.shadow;
    }}
>

    {/* LEFT IMAGE */}

    {/* RIGHT CONTENT */}
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >

        {/* TOP ROW */}
<div
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"12px"
}}
>
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
    onClick={openArticle}
    style={{
        fontSize:"24px",
        fontWeight:800,
        lineHeight:1.4,
        color:c.text,
        marginBottom:"10px",
        cursor:"pointer"
    }}
>
          {item.title}
        </h4>

        {/* SOURCE */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: compact ? 0 : "12px", flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            padding: "3px 9px", borderRadius: "8px",
            background: c.surface2,
            border: `1px solid ${c.border}`,
            fontSize: "14px", fontWeight: 600, color: c.textSub,
          }}>
            📰 {item.source || item.author || "Unknown Source"}
          </span>
          <span style={{ fontSize: "14px", color: c.muted }}>
            {item.pubDate ? new Date(item.pubDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Date unavailable"}
          </span>
        </div>

        {/* BUTTONS */}
        {!compact && (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button style={{ ...s.btn(saved ? c.green : c.white, true) }} onClick={(e) => {e.stopPropagation();store.toggleArticleBookmark(item)}}>
              {saved ? "✓ Saved" : `⭐ ${t.save}`}
            </button>
            <button style={{ ...s.btn(c.accent, true) }} onClick={(e) =>{e.stopPropagation(); summarize(item, activeMode)}} disabled={!!isSummarizing}>
              {isSummarizing ? "⏳ Thinking…" : t.summarize}
            </button>
            <button style={{ ...s.btn(isSpeaking ? c.red : c.white, true) }} onClick={(e) =>{e.stopPropagation(); speakItem(item)}}>
              {isSpeaking ? t.stop : t.play}
            </button>
            <button style={{ ...s.btn(null, true), border: `1px solid ${c.border}` }} onClick={(e) => {

    e.stopPropagation();

    openArticle();

}}>{t.readMode}</button>
            <button style={{ ...s.btn(null, true) }} onClick={(e) =>{e.stopPropagation(); shareArticle(item)}}>{t.share}</button>
            <button style={{ ...s.btn(inCompare ? c.red : null, true),}} onClick={(e) =>{e.stopPropagation(); toggleCompare(item)}}>{t.compare}</button>
            <button style={{ ...s.btn(null, true), }} onClick={() => { setArticleToAdd(item); setCollectionsOpen(true); }}>{t.addTo}</button>
          </div>
        )}

        {/* AUDIO */}
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

        {/* SUMMARY */}
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

  </div>
);

 }, [store.articleBookmarks, speakingId, speechProgress, summarizingId, summaries, summaryMode, compareItems, reactions, dm, c, s, t, SUMMARY_MODES]);
 
  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${dm ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"}; border-radius: 8px; }
        button { font-family: inherit; }
        button:hover {transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,.12);}
        button:active{transform:scale(.97);}
        input:focus, select:focus { border-color: #FF7A00 !important; box-shadow: 0 0 0 3px rgba(255,122,0,0.12) !important; }
        input::placeholder { color: ${dm ? "rgba(255,255,255,0.22)" : "rgba(15,23,42,0.28)"}; }
        select option { background: ${dm ? "#161B22" : "#fff"}; color: ${dm ? "#E6EDF3" : "#0F172A"}; }

        @keyframes npSlideDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes npSlideUp   { from { opacity:0; transform:translateY(8px)  } to { opacity:1; transform:translateY(0) } }
        @keyframes npFadeIn    { from { opacity:0 } to { opacity:1 } }
        @keyframes npSpin      { to { transform:rotate(360deg) } }
        @keyframes npShimmer   { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
        @keyframes npPulse     { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes npScaleIn   { from{transform:scale(0.96);opacity:0} to{transform:scale(1);opacity:1} }

        .np-alert { animation: npSlideDown 0.3s cubic-bezier(.34,1.56,.64,1); }
        .like-btn { transition: transform 0.18s cubic-bezier(.34,1.56,.64,1) !important; }
        .like-btn:active { transform: scale(1.4) !important; opacity: 1 !important; }

        .skeleton {
          border-radius: 10px;
          background: ${dm
            ? "linear-gradient(90deg,#1C2128 25%,#21262D 50%,#1C2128 75%)"
            : "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)"};
          background-size: 600px 100%;
          animation: npShimmer 1.6s ease infinite;
        }

        .np-card:hover { transform: translateY(-3px) !important; }
        .np-app-card:hover { transform: translateY(-5px) scale(1.02) !important; }

        /* Hero */
        .np-hero {
          border-radius: 20px;
          padding: 28px 28px 24px;
          margin-bottom: 24px;
          position: relative; overflow: hidden;
          background: ${dm
            ? "linear-gradient(135deg,rgba(255,122,0,0.1) 0%,rgba(124,58,237,0.07) 60%,rgba(22,27,34,1) 100%)"
            : "linear-gradient(135deg,rgba(255,122,0,0.07) 0%,rgba(124,58,237,0.04) 60%,rgba(248,250,252,1) 100%)"};
          border: 1px solid ${dm ? "rgba(255,122,0,0.15)" : "rgba(255,122,0,0.1)"};
        }
        .np-hero::before {
          content:''; position:absolute; top:-80px; right:-80px;
          width:260px; height:260px; border-radius:50%;
          background: radial-gradient(circle,rgba(255,122,0,0.18) 0%,transparent 70%);
          pointer-events:none;
        }
        .np-hero::after {
          content:''; position:absolute; bottom:-50px; left:-50px;
          width:200px; height:200px; border-radius:50%;
          background: radial-gradient(circle,rgba(124,58,237,0.14) 0%,transparent 70%);
          pointer-events:none;
        }
        .np-stat { animation: npScaleIn 0.35s cubic-bezier(.34,1.56,.64,1) both; }
        .np-stat:nth-child(1){animation-delay:0.05s}
        .np-stat:nth-child(2){animation-delay:0.10s}
        .np-stat:nth-child(3){animation-delay:0.15s}
        .np-stat:nth-child(4){animation-delay:0.20s}

        /* Trending horizontal scroll */
        .np-trending {
          display:flex; gap:8px; overflow-x:auto; padding-bottom:4px;
          scrollbar-width:none;
        }
        .np-trending::-webkit-scrollbar { display:none; }
        .np-chip {
          transition: all 0.18s ease;
          white-space: nowrap; flex-shrink: 0;
        }
        .np-chip:hover { transform: translateY(-2px); }

        /* Daily briefing card */
        .np-briefing {
          background: ${dm
            ? "linear-gradient(135deg,rgba(255,122,0,0.12),rgba(255,69,0,0.08))"
            : "linear-gradient(135deg,rgba(255,122,0,0.08),rgba(255,69,0,0.05))"};
          border: 1px solid ${dm ? "rgba(255,122,0,0.2)" : "rgba(255,122,0,0.15)"};
          border-radius: 18px; padding: 22px; margin-bottom: 20px;
        }

        /* Settings panel */
        .np-settings { animation: npSlideUp 0.25s ease; }

        /* Compare modal */
        .np-compare-modal { animation: npFadeIn 0.2s ease; }

        @media (max-width: 640px) {
          .np-hero { padding: 20px 18px; }
          .np-stat-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      <div style={s.root}>
        <OfflineBanner />
        {readItem && <ReadingProgressBar />}

        {/* ── SETTINGS PANEL ─────────────────────────────────────────────── */}
        {settingsOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={() => setSettingsOpen(false)}>
            <div className="np-settings" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "300px", background: c.surface, padding: "24px 20px", overflowY: "auto", boxShadow: "-8px 0 40px rgba(0,0,0,0.3)", borderLeft: `1px solid ${c.border}` }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
                <span style={{ fontWeight: 700, fontSize: "16px", color: c.text, flex: 1 }}>⚙️ Settings</span>
                <button onClick={() => setSettingsOpen(false)} style={{ background: c.surface3, border: "none", color: c.muted, cursor: "pointer", fontSize: "16px", width: "30px", height: "30px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
              <SettingRow label="Dark Mode" icon="🌙" c={c}><ToggleSwitch value={darkMode} onChange={setDarkMode} /></SettingRow>
              <SettingRow label="Language" icon="🌐" c={c}>
                <select style={{ ...s.select, padding: "5px 10px", fontSize: "12px" }} value={lang} onChange={e => setLang(e.target.value)}>
                  {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v.flag} {v.label}</option>)}
                </select>
              </SettingRow>
              <SettingRow label="Voice Language" icon="🎙" c={c}>
                <select style={{ ...s.select, padding: "5px 10px", fontSize: "12px" }} value={voiceLang} onChange={e => setVoiceLang(e.target.value)}>
                  <option value="en-IN">English (IN)</option>
                  <option value="en-US">English (US)</option>
                  <option value="hi-IN">Hindi</option>
                  <option value="te-IN">Telugu</option>
                  <option value="ta-IN">Tamil</option>
                  <option value="kn-IN">Kannada</option>
                </select>
              </SettingRow>
              <SettingRow label="Auto-refresh (5 min)" icon="🔄" c={c}>
                <span style={{ fontSize: "11px", color: c.green, fontWeight: 700, background: c.greenBg, padding: "3px 9px", borderRadius: "20px" }}>Active</span>
              </SettingRow>
              {locationError && (
                <div style={{ background: c.redBg, border: `1px solid ${c.red}33`, borderRadius: "10px", padding: "10px 12px", marginTop: "12px", fontSize: "12px", color: c.red }}>
                  📍 {locationError}. Defaulted to Andhra Pradesh.
                </div>
              )}
              <div style={{ marginTop: "20px", padding: "14px", background: c.surface2, borderRadius: "12px", border: `1px solid ${c.border}` }}>
                <div style={{ fontSize: "11px", color: c.muted, marginBottom: "6px" }}>Gemini API Key (.env)</div>
                <code style={{ fontSize: "10px", color: c.accent }}>REACT_APP_GEMINI_API_KEY=...</code>
              </div>
            </div>
          </div>
        )}

        {/* ── PREMIUM NAVBAR ─────────────────────────────────────────────── */}
        <nav
  style={{
    ...s.nav,

    height: "82px",

   position: "relative",

    top: 0,

    zIndex: 200,

    backdropFilter: "blur(24px)",

    WebkitBackdropFilter: "blur(24px)",

    background:
      dm
        ? "rgba(12,16,24,.72)"
        : "rgba(255,255,255,.72)",

    borderBottom: `1px solid ${c.border}`,

    boxShadow:
      dm
        ? "0 10px 30px rgba(0,0,0,.35)"
        : "0 10px 30px rgba(0,0,0,.08)",

    transition: ".3s"
  }}
>
          <div
style={{
display:"flex",
alignItems:"center",
gap:"14px"
}}
>

<div
style={{
width:"52px",
height:"52px",
borderRadius:"18px",

background:
"linear-gradient(135deg,#ff6a00,#ff2d55)",

display:"flex",
justifyContent:"center",
alignItems:"center",

fontSize:"26px",

color:"#fff",

fontWeight:900,

boxShadow:
"0 15px 35px rgba(255,106,0,.35)"
}}
>

⚡

</div>

<div>

<div
style={{
fontSize:"25px",
fontWeight:800,
color:c.text
}}
>

NewsPulse

</div>

<div
style={{
fontSize:"11px",
color:c.muted
}}
>

AI Powered News

</div>

</div>

</div>

          {/* Language switcher */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginLeft: "auto",
  }}
>

  {/* Language */}
  <div
    style={{
      display: "flex",
      background: c.surface2,
      border: `1px solid ${c.border}`,
      borderRadius: "14px",
      padding: "4px",
      boxShadow: dm
        ? "0 6px 20px rgba(0,0,0,.25)"
        : "0 6px 20px rgba(0,0,0,.06)",
    }}
  >
    {Object.entries(LANGS).map(([k, v]) => (
      <button
        key={k}
        onClick={() => setLang(k)}
        style={{
          border: "none",
          background: lang === k ? c.gradPrimary : "transparent",
          color: lang === k ? "#fff" : c.muted,
          borderRadius: "10px",
          padding: "7px 10px",
          cursor: "pointer",
          fontSize: "11px",
          fontWeight: 700,
          transition: ".25s",
        }}
      >
        {v.flag}
      </button>
    ))}
  </div>

  {/* Dark Mode */}
  <button
    onClick={() => setDarkMode(!dm)}
    style={{
      width: 44,
      height: 44,
      borderRadius: "14px",
      border: `1px solid ${c.border}`,
      background: c.surface2,
      cursor: "pointer",
      fontSize: "18px",
      transition: ".25s",
      boxShadow: dm
        ? "0 8px 20px rgba(0,0,0,.25)"
        : "0 8px 20px rgba(0,0,0,.08)",
    }}
  >
    {dm ? "☀️" : "🌙"}
  </button>

  {/* Location */}
  <button
    onClick={requestLocation}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      border: `1px solid ${c.border}`,
      background: c.surface2,
      borderRadius: "14px",
      padding: "0 16px",
      height: "44px",
      cursor: "pointer",
      boxShadow: dm
        ? "0 8px 20px rgba(0,0,0,.25)"
        : "0 8px 20px rgba(0,0,0,.08)",
    }}
  >
    <span style={{ fontSize: 17 }}>
      {locationLoading ? "⏳" : "📍"}
    </span>

    <span
      style={{
        color: c.text,
        fontWeight: 600,
        fontSize: "13px",
      }}
    >
      {locationCity || "Location"}
    </span>
  </button>

  {/* Podcast */}
  <button
    onClick={() => setPodcastOpen(true)}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      height: "44px",
      padding: "0 18px",
      border: "none",
      borderRadius: "14px",
      cursor: "pointer",
      color: "#fff",
      fontWeight: 700,
      background: c.gradPrimary,
      boxShadow: c.shadowAccent,
    }}
  >
    🎙️ {t.podcast}
  </button>

  {/* Settings */}
  <button
    onClick={() => setSettingsOpen(true)}
    style={{
      width: 44,
      height: 44,
      borderRadius: "14px",
      border: `1px solid ${c.border}`,
      background: c.surface2,
      cursor: "pointer",
      fontSize: "18px",
      boxShadow: dm
        ? "0 8px 20px rgba(0,0,0,.25)"
        : "0 8px 20px rgba(0,0,0,.08)",
    }}
  >
    ⚙️
  </button>

  {/* User */}
  <div style={{ position: "relative" }}>
    <div
      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        height: "52px",
        padding: "0 16px 0 8px",
        borderRadius: "16px",
        cursor: "pointer",
        border: `1px solid ${c.border}`,
        background: c.surface2,
        boxShadow: dm
          ? "0 8px 24px rgba(0,0,0,.28)"
          : "0 8px 24px rgba(0,0,0,.08)",
      }}
    >

      <img
        src={user?.avatar}
        alt=""
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          border: `2px solid ${P}`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          lineHeight: 1.2,
        }}
      >
        <span
          style={{
            fontWeight: 700,
            color: c.text,
            fontSize: "13px",
          }}
        >
          {user?.name}
        </span>

        <span
          style={{
            color: c.muted,
            fontSize: "11px",
            maxWidth: 170,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {user?.email}
        </span>
      </div>

      <span
        style={{
          color: c.muted,
          fontSize: "12px",
        }}
      >
        ▼
      </span>
    </div>

    {profileMenuOpen && (
      <div
        style={{
          position: "absolute",
          right: 0,
          top: "115%",
          width: "240px",
          background: c.surface,
          borderRadius: "18px",
          border: `1px solid ${c.border}`,
          boxShadow: c.shadowLg,
          overflow: "hidden",
          zIndex: 9999,
        }}
      >

        <button style={menuBtn}>
          👤 My Profile
        </button>

        <button style={menuBtn}>
          ⭐ Premium
        </button>

        <button style={menuBtn}>
          🔔 Notifications
        </button>

        <button
          onClick={onLogout}
          style={{
            ...menuBtn,
            color: c.red,
          }}
        >
          🚪 Logout
        </button>

      </div>
    )}
  </div>

</div>
        </nav>

        {/* ── ALERT BANNER ──────────────────────────────────────────────── */}
        {alertTriggered.length > 0 && tab !== "alerts" && (
          <div className="np-alert" style={{ background: "linear-gradient(90deg,#FF7A00,#FF4500)", padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => setTab("alerts")}>
            <span style={{ fontSize: "16px" }}>🔔</span>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "13px" }}>{alertTriggered.length} keyword alert{alertTriggered.length > 1 ? "s" : ""} matched!</span>
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px", marginLeft: "auto" }}>View →</span>
          </div>
        )}

        {/* ── COMPARE BAR ───────────────────────────────────────────────── */}
        {compareItems.length > 0 && (
          <div style={{ background: c.indigoBg, borderBottom: `1px solid ${c.indigo}33`, padding: "9px 20px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ color: c.indigo, fontWeight: 700, fontSize: "13px" }}>⚖️ {compareItems.map(a => a.title.slice(0, 28) + "…").join(" vs ")}</span>
            {compareItems.length === 2 && <button style={s.btn(c.indigo, true)} onClick={() => setCompareOpen(true)}>Compare Now</button>}
            <button style={{ ...s.btn(null, true), marginLeft: "auto", border: `1px solid ${c.border}` }} onClick={() => setCompareItems([])}>✕ Clear</button>
          </div>
        )}

        <div style={s.wrap}>

          {/* ── HERO SECTION ──────────────────────────────────────────────── */}
          <div
className="np-hero"
style={{

position:"relative",

overflow:"hidden",

padding:"34px",

borderRadius:"28px",

background:
dm
?
"linear-gradient(135deg,#101827,#18233A,#0F172A)"
:
"linear-gradient(135deg,#FFF8F0,#FFFFFF,#F4F8FF)",

border:`1px solid ${c.border}`,

boxShadow:
dm
?
"0 25px 60px rgba(0,0,0,.45)"
:
"0 25px 60px rgba(0,0,0,.08)"
}}
><div
style={{

position:"absolute",

top:-80,

right:-60,

width:250,

height:250,

borderRadius:"50%",

background:"rgba(255,122,0,.18)",

filter:"blur(80px)"

}}
/>

<div
style={{

position:"absolute",

bottom:-90,

left:-80,

width:220,

height:220,

borderRadius:"50%",

background:"rgba(124,58,237,.15)",

filter:"blur(80px)"

}}
/>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: "12px", color: c.accent, fontWeight: 600, marginBottom: "4px", letterSpacing: "0.5px" }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
              <h1
style={{fontSize:"34px",fontWeight:900,letterSpacing:"-.8px",marginBottom:"8px",color:c.text}}>
                {t.hello}, {user?.name?.split(" ")[0] || "Reader"} 👋
              </h1>
              <div style={{ display:"inline-flex",alignItems:"center",gap:"8px",padding:"8px 16px",borderRadius:"30px",background:"rgba(16,185,129,.12)",color:"#10B981",fontWeight:700,fontSize:"13px",marginBottom:"18px"}}>
🟢 AI Engine Active
</div>
              <p style={{ fontSize: "13px", color: c.muted, marginBottom: "20px" }}>
                <div
style={{

display:"flex",

gap:"18px",

flexWrap:"wrap",

marginTop:"12px"

}}
>

<span>

📍 {store.state}

</span>

<span>

📰 {store.allArticles.length} Stories

</span>

<span>

⚡ Updated Live

</span>

<span>

🤖 AI Ready

</span>
<div
style={{

marginTop:"18px",

fontSize:"15px",

color:c.muted,

fontStyle:"italic"

}}
>

"Stay informed. Think deeper. Read smarter."

</div>

</div>
              </p>
              <div className="np-stat-grid" 
              
              style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                {[
                  { icon: "📰", val: store.allArticles.length, label: "Stories",  clr: P,      bg: `rgba(255,122,0,0.12)`,     br: `rgba(255,122,0,0.2)` },
                  { icon: "🔥", val: trendingTopics.length,    label: "Trending", clr: S,      bg: `rgba(124,58,237,0.1)`,     br: `rgba(124,58,237,0.2)` },
                  { icon: "⭐", val: store.articleBookmarks.length, label: "Saved", clr: "#3B82F6", bg: `rgba(59,130,246,0.1)`, br: `rgba(59,130,246,0.2)` },
                  { icon: "📖", val: totalReads,               label: "Read",     clr: "#10B981", bg: `rgba(16,185,129,0.1)`,  br: `rgba(16,185,129,0.2)` },
                ].map((st, i) => (
                  <div key={i} className="np-stat" style={{ background: st.bg, borderRadius:"20px", padding: "20px", border: `1px solid ${st.br}`, display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "22px" }}>{st.icon}</span>
                    <div>
                      <div style={{ fontSize: "22px", fontWeight: 800, color: st.clr, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{st.val}</div>
                      <div style={{ fontSize: "11px",letterSpacing:"1px", color: c.muted, fontWeight: 500, marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{st.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── MAIN TABS ─────────────────────────────────────────────────── */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    overflowX: "auto",
    padding: "14px",
    margin: "22px 0",
    borderRadius: "24px",

    background: dm
      ? "rgba(20,24,35,.80)"
      : "rgba(255,255,255,.82)",

    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",

    border: `1px solid ${c.border}`,

    boxShadow: dm
      ? "0 12px 35px rgba(0,0,0,.45)"
      : "0 12px 35px rgba(0,0,0,.08)",

    scrollbarWidth: "none",
  }}
>
  {[
    { key: "apps", icon: "📱", label: t.apps },
    { key: "personalized", icon: "🧠", label: t.personalized },
    {
      key: "bookmarks",
      icon: "⭐",
      label: t.bookmarks,
      badge: store.appBookmarks.length + store.articleBookmarks.length
    },
    {
      key: "trending",
      icon: "🔥",
      label: t.trending
    },
    {
      key: "recent",
      icon: "🕑",
      label: t.recent
    },
    {
      key: "analytics",
      icon: "📊",
      label: t.analytics
    },
    {
      key: "collections",
      icon: "🗂️",
      label: t.collections,
      badge: store.collections.length
    },
    {
      key: "alerts",
      icon: "🔔",
      label: t.alerts,
      badge: alertTriggered.length || undefined
    }
  ].map((tb) => {
    const active = tab === tb.key;

    return (
      <button
        key={tb.key}
        onClick={() => setTab(tb.key)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",

          whiteSpace: "nowrap",

          padding: active ? "12px 22px" : "12px 18px",

          borderRadius: "16px",

          border: active
            ? "none"
            : `1px solid ${c.border}`,

          background: active
            ? c.gradPrimary
            : "transparent",

          color: active
            ? "#fff"
            : c.text,

          fontWeight: active ? 700 : 600,

          fontSize: "14px",

          cursor: "pointer",

          transition: ".35s",

          boxShadow: active
            ? "0 10px 30px rgba(255,122,24,.35)"
            : "none"
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background =
              dm
                ? "rgba(255,255,255,.06)"
                : "rgba(255,122,24,.08)";
          }

          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = "transparent";
          }

          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <span style={{ fontSize: "17px" }}>
          {tb.icon}
        </span>

        {tb.label}

        {tb.badge && (
          <span
            style={{
              minWidth: "22px",
              height: "22px",
              borderRadius: "999px",

              background:
                tb.key === "alerts"
                  ? "#ef4444"
                  : "rgba(255,255,255,.25)",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              fontSize: "11px",
              fontWeight: 700,

              color: "#fff"
            }}
          >
            {tb.badge}
          </span>
        )}
      </button>
    );
  })}
</div>
          {/* ── APPS + NEWS TAB ───────────────────────────────────────────── */}
          {tab === "apps" && (
            <>


              {/* Daily Briefing */}
              {dailySummary && (
                <div className="np-briefing">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "18px" }}>☀️</span>
                    <span style={{ fontWeight: 700, color: c.accent, fontSize: "14px" }}>Today's Briefing</span>
                    <span style={{ marginLeft: "auto", background: c.gradPrimary, color: "#fff", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px" }}>AI</span>
                    <button style={{ ...s.btn(null, true), fontSize: "11px" }} onClick={() => setDailySummary(null)}>✕</button>
                  </div>
                  <div style={{ fontSize: "14px", lineHeight: 1.75, color: c.text, whiteSpace: "pre-wrap" }}>{dailySummary}</div>
                </div>
              )}

              {/* Category chips */}
              <div
style={{
marginBottom:"35px",
padding:"22px",
borderRadius:"24px",
background:dm
?"linear-gradient(135deg,#181f2d,#111827)"
:"linear-gradient(135deg,#ffffff,#f7f9fc)",
border:`1px solid ${c.border}`,
boxShadow:dm
?"0 20px 45px rgba(0,0,0,.35)"
:"0 20px 45px rgba(0,0,0,.07)"
}}
>
                <div
style={{
fontSize:"13px",
fontWeight:700,
letterSpacing:"1px",
textTransform:"uppercase",
marginBottom:"18px",
color:c.accent
}}
>

Browse Categories

</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {CAT_KEYS.map((cat, i) => {
                    const active = store.category === i;
                    const catColors = ["#0EA5E9","#10B981","#8B5CF6","#EF4444","#F59E0B","#3B82F6","#06B6D4","#EC4899"];
                    const cc = catColors[i] || P;
                    return (
                      <button key={cat} className="np-chip" onClick={() => store.setCategory(i)} style={{
                        padding: "7px 16px", borderRadius: "20px",
                        border: `1.5px solid ${active ? cc : c.border}`,
                        background: active ? (cc + (dm ? "22" : "15")) : "transparent",
                        color: active ? cc : c.muted,
                        fontWeight: active ? 700 : 500,
                        cursor: "pointer", fontSize: "13px",
                        fontFamily: "inherit",
                      }}>
                        {CAT_ICONS[i]} {catLabels[i]}
                      </button>
                    );
                  })}
                </div>
              </div>
{/* Premium Controls */}

<div
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
flexWrap:"wrap",
gap:"20px",
marginBottom:"28px"
}}
>

<div>

<div
style={{
fontSize:"11px",
fontWeight:700,
letterSpacing:"1px",
textTransform:"uppercase",
color:c.muted,
marginBottom:"7px"
}}
>
NEWS REGION
</div>

<select
style={{
...s.select,
minWidth:"220px",
height:"48px",
borderRadius:"15px",
fontWeight:600,
fontSize:"14px",
boxShadow:dm
?"0 10px 30px rgba(0,0,0,.3)"
:"0 10px 25px rgba(0,0,0,.08)"
}}
value={store.state}
onChange={e=>store.setState(e.target.value)}
>
{STATES.map(st=><option key={st}>{st}</option>)}
</select>

</div>

<button
style={{
padding:"14px 32px",
border:"none",
borderRadius:"18px",
cursor:"pointer",
fontWeight:700,
fontSize:"14px",
background:"linear-gradient(135deg,#ff7a18,#ff4d4d)",
color:"#fff",
boxShadow:"0 15px 35px rgba(255,120,20,.35)"
}}
onClick={getDailySummary}
disabled={loadingDailySummary}
>

{loadingDailySummary ? "⏳ Preparing..." : "✨ AI Daily Briefing"}

</button>

</div>
              {/* News Apps grid */}
<div
style={{
background: dm ? "#141B28" : "#fff",
borderRadius: "28px",
padding: "28px",
marginBottom: "40px",
border: `1px solid ${c.border}`,
boxShadow: dm
? "0 20px 50px rgba(0,0,0,.35)"
: "0 20px 50px rgba(0,0,0,.08)"
}}
>

{/* Header */}

<div
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"28px"
}}
>

<div>

<div
style={{
display:"flex",
alignItems:"center",
gap:"10px"
}}
>

🔥

<div
style={{
fontSize:"30px",
fontWeight:800,
color:c.text
}}
>
Featured News Apps
</div>

</div>

<div
style={{
marginTop:"6px",
fontSize:"14px",
color:c.muted
}}
>
Trusted publishers from your region
</div>

</div>

</div>

{/* Cards */}

<div
style={{
display:"grid",
gridTemplateColumns:
showAllApps
? "repeat(auto-fit,minmax(240px,1fr))"
: "repeat(3,1fr)",
gap:"28px",
alignItems:"stretch",
transition:"all .4s ease"
}}
>

{(showAllApps ? filteredApps : visibleApps).map((app,i)=>{

const saved=store.appBookmarks.some(a=>a.name===app.name);

const badges=[
{txt:"🔥 Trending",bg:"#FFF4E8",color:"#ff7a18"},
{txt:"⭐ Editor Choice",bg:"#FFF8E1",color:"#ff9800"},
{txt:"🧠 AI Pick",bg:"#F3E8FF",color:"#9333EA"},
{txt:"✅ Verified",bg:"#E8FFF2",color:"#16A34A"},
{txt:"⚡ Fastest",bg:"#EEF6FF",color:"#2563EB"},
];

const badge=badges[i%badges.length];

return (
<div
key={i}
style={{
transition:"all .45s cubic-bezier(.22,.61,.36,1)"
}}
>


<div

key={i}

style={{

background:dm

?"linear-gradient(180deg,#1B2333,#111827)"

:"#fff",

borderRadius:"24px",

padding:"18px",

border:`1px solid ${c.border}`,

boxShadow:c.shadow,

transition:".35s",

cursor:"pointer",

position:"relative",

overflow:"hidden"

}}

onMouseEnter={(e)=>{

e.currentTarget.style.transform="translateY(-8px)";

e.currentTarget.style.boxShadow="0 25px 60px rgba(255,122,0,.18)";

}}

onMouseLeave={(e)=>{

e.currentTarget.style.transform="translateY(0)";

e.currentTarget.style.boxShadow=c.shadow;

}}

>

<div

style={{

display:"flex",

justifyContent:"space-between",

marginBottom:"16px"

}}

>

<div

style={{

padding:"6px 12px",

borderRadius:"30px",

background:badge.bg,

color:badge.color,

fontWeight:700,

fontSize:"11px"

}}

>

{badge.txt}

</div>

☆

</div>

<div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "18px"
  }}
>
  <div style={{
    width: "86px",
    height: "86px",
    borderRadius: "50%",
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 8px 25px rgba(0,0,0,.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: "6px"
  }}>
    <img
      /* CHANGED HERE: Now loads the full vector high-res asset natively from our unblockable source */
      src={app.icon}
      alt={app.name}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain"
      }}
      onError={(e) => {
        // Safe proxy fallback just in case an asset drops offline
        e.target.src = `https://www.google.com/s2/favicons?sz=128&domain=${new URL(app.url).hostname}`;
      }}
    />
  </div>
</div>

<div

style={{

fontSize:"25px",

textAlign:"center"

}}

>

📰

</div>

<div

style={{

fontWeight:800,

fontSize:"22px",

textAlign:"center",

marginTop:"8px",

color:c.text

}}

>

{app.name}

</div>

<div

style={{

textAlign:"center",

fontSize:"13px",

color:c.muted,

marginTop:"4px"

}}

>

Telugu News

</div>

<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    marginTop: "20px",
    fontSize: "13px",
    color: c.text
  }}
>
  <div>
    👥 <b>{app.followers || "0"}</b>
    <br/>
    <span style={{color: c.muted}}>Followers</span>
  </div>
  <div>
    ⚡ <b>{app.status || "Regular"}</b>
    <br/>
    <span style={{color: c.muted}}>Updates</span>
  </div>
</div>

<div

style={{

display:"flex",

gap:"10px",

marginTop:"22px"

}}

>

<button

onClick={(e)=>{

e.stopPropagation();

store.toggleAppBookmark(app);

}}

style={{

flex:1,

height:"42px",

border:"none",

borderRadius:"12px",

background:"linear-gradient(90deg,#7C3AED,#9333EA)",

color:"#fff",

fontWeight:700,

cursor:"pointer"

}}

>

{saved?"✓ Following":"+ Follow"}

</button>

<button
onClick={(e)=>{
    e.stopPropagation();

    setReadItem({
        title: app.name,
        link: app.url,
        description: `Opening ${app.name}`,
    });
}}
style={{
width:"92px",
height:"42px",
borderRadius:"12px",
border:`1px solid ${c.border}`,
background: dm ? "#1E293B" : "#fff",
color: c.text,
fontWeight:700,
cursor:"pointer",
transition:"all .3s ease"
}}
onMouseEnter={(e)=>{
    e.currentTarget.style.background="#ff7a18";
    e.currentTarget.style.color="#fff";
}}
onMouseLeave={(e)=>{
    e.currentTarget.style.background=dm ? "#1E293B" : "#fff";
    e.currentTarget.style.color=c.text;
}}
>
Open →
</button>

</div>
</div>
</div>

)

})}

</div>

</div> 
<div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "18px",
    marginBottom: "40px",
  }}
>
  {!showAllApps && (
    <>
      <button
        disabled={currentSlide === 0}
        onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background:
            currentSlide === 0
              ? "#ccc"
              : "linear-gradient(135deg,#ff7a18,#ff4d4d)",
          color: "#fff",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        ←
      </button>

      <span
        style={{
          color: c.text,
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        {currentSlide + 1} / {totalSlides}
      </span>

      <button
        disabled={currentSlide === totalSlides - 1}
        onClick={() =>
          setCurrentSlide((p) =>
            Math.min(totalSlides - 1, p + 1)
          )
        }
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background:
            currentSlide === totalSlides - 1
              ? "#ccc"
              : "linear-gradient(135deg,#ff7a18,#ff4d4d)",
          color: "#fff",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        →
      </button>
    </>
  )}

  <button
    onClick={() => setShowAllApps(!showAllApps)}
    style={{
      padding: "12px 26px",
      borderRadius: "40px",
      border: "none",
      cursor: "pointer",
      background: "linear-gradient(135deg,#7C3AED,#9333EA)",
      color: "#fff",
      fontWeight: 700,
      fontSize: "14px",
      boxShadow: "0 10px 25px rgba(124,58,237,.35)",
    }}
  >
    {showAllApps ? "Show Less" : "View All Apps"}
  </button>
</div>

              {/* Personalized Feed */}
{/* Personalized Feed */}
{store.personalizedFeed.length > 0 && (
  <>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "18px"
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          🧠
          <div style={{ fontSize: "30px", fontWeight: 800, color: c.text }}>
            Recommended For You
          </div>
          <div
            style={{
              padding: "4px 12px",
              borderRadius: "20px",
              background: "#F3E8FF",
              color: "#7C3AED",
              fontSize: "11px",
              fontWeight: 700
            }}
          >
            AI Powered
          </div>
        </div>
      </div>
    </div>
    {/* Displaying the top 5 recommended items */}
    {store.personalizedFeed.slice(0, 5).map((item, i) => (
      <ArticleCard key={item.link || i} item={item} />
    ))}
  </>
)}

              {/* Latest News */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div
style={{
fontSize:"28px",
fontWeight:800,
color:c.text
}}
>
📰 Latest News
{store.allArticles.length > 0 && `(${store.allArticles.length})`}</div>
              </div>
              <input style={{ ...s.input, marginBottom: "14px" }} placeholder={t.searchArt} value={artSearch} onChange={e => setArtSearch(e.target.value)} />

              {/* Skeleton loaders */}
              {store.loading && Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ ...s.card, padding: "18px" }}>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                    <div className="skeleton" style={{ height: "22px", width: "80px" }} />
                    <div className="skeleton" style={{ height: "22px", width: "60px", marginLeft: "auto" }} />
                  </div>
                  <div className="skeleton" style={{ height: "18px", width: "95%", marginBottom: "8px" }} />
                  <div className="skeleton" style={{ height: "18px", width: "70%", marginBottom: "12px" }} />
                  <div className="skeleton" style={{ height: "14px", width: "40%" }} />
                </div>
              ))}

              {filteredArticles.length === 0 && !store.loading && (
                <div style={{ textAlign: "center", padding: "48px 20px", color: c.muted }}>
                  <div style={{ fontSize: "32px", marginBottom: "10px" }}>📭</div>
                  <div style={{ fontSize: "15px", fontWeight: 600 }}>{t.noArticles}</div>
                </div>
              )}
              {!store.loading && filteredArticles.map((item, i) => <ArticleCard key={item.link || i} item={item} />)}

              {store.visibleArticles.length < store.allArticles.length && !store.loading && (
                <div style={{ textAlign: "center", marginTop: "16px" }}>
                  <button style={{ ...s.btn(c.purple), padding: "11px 32px", borderRadius: "12px", boxShadow: c.shadowPurple }} onClick={store.loadMore}>{t.loadMore}</button>
                </div>
              )}
            </>
          )}

          {/* ── PERSONALIZED TAB ──────────────────────────────────────────── */}
          {tab === "personalized" && (
            <>
              <div style={{ ...s.card, background: c.purpleBg, borderColor: `${c.purple}33`, marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "18px" }}>🧠</span>
                  <span style={{ fontWeight: 700, color: c.purple, fontSize: "15px" }}>AI Personalized Feed</span>
                  <span style={{ background: c.gradPurple, color: "#fff", fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px" }}>AI</span>
                </div>
                <div style={{ fontSize: "13px", color: c.muted }}>Based on your reading history and category interests. Read more articles to improve recommendations.</div>
              </div>
              {store.personalizedFeed.length === 0
                ? <div style={{ textAlign: "center", padding: "48px 20px", color: c.muted }}><div style={{ fontSize: "32px", marginBottom: "10px" }}>🧠</div><div style={{ fontWeight: 600 }}>Start reading articles to get personalized recommendations!</div></div>
                : store.personalizedFeed.map((item, i) => <ArticleCard key={i} item={item} />)
              }
            </>
          )}

          {/* ── BOOKMARKS TAB ─────────────────────────────────────────────── */}
          {tab === "bookmarks" && (
            <>
              <div style={s.tabs}>
                <button style={s.tab(bmTab === "apps")} onClick={() => setBmTab("apps")}>📱 {t.apps} <span style={s.badge()}>{store.appBookmarks.length}</span></button>
                <button style={s.tab(bmTab === "articles")} onClick={() => setBmTab("articles")}>📰 Articles <span style={s.badge()}>{store.articleBookmarks.length}</span></button>
              </div>
              {bmTab === "apps" && (
                store.appBookmarks.length === 0
                  ? <div style={{ textAlign: "center", padding: "48px 20px", color: c.muted }}><div style={{ fontSize: "32px", marginBottom: "10px" }}>⭐</div><div style={{ fontWeight: 600 }}>{t.noBookmarks}</div></div>
                  : <div style={s.appGrid}>
                      {store.appBookmarks.map((app, i) => (
                        <div key={i} style={{ ...s.appCard }}
                          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = c.shadowMd; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = c.shadow; }}>
                          <div style={{ width: "52px", height: "52px", borderRadius: "14px", overflow: "hidden", background: c.surface2, border: `1px solid ${c.border}` }}>
                            <img src={app.icon} alt={app.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: "13px", color: c.text }}>{app.name}</span>
                          <button style={{ ...s.btn(c.red, true), width: "100%", borderRadius: "10px", fontSize: "11px" }} onClick={() => store.toggleAppBookmark(app)}>✕ {t.remove}</button>
                        </div>
                      ))}
                    </div>
              )}
              {bmTab === "articles" && (
                store.articleBookmarks.length === 0
                  ? <div style={{ textAlign: "center", padding: "48px 20px", color: c.muted }}><div style={{ fontSize: "32px", marginBottom: "10px" }}>📰</div><div style={{ fontWeight: 600 }}>{t.noBookmarks}</div></div>
                  : store.articleBookmarks.map((item, i) => <ArticleCard key={i} item={item} />)
              )}
            </>
          )}

          {/* ── TRENDING TAB ──────────────────────────────────────────────── */}
          {tab === "trending" && (
            <>
              <div style={s.sectionTitle}>🔥 Trending Topics</div>
              <div className="np-trending" style={{ marginBottom: "24px" }}>
                {trendingTopics.map((topic, i) => (
                  <span key={i} className="np-chip" onClick={() => { setArtSearch(topic); setTab("apps"); }} style={{
                    padding: "7px 16px", borderRadius: "20px", cursor: "pointer",
                    background: c.surface2, border: `1.5px solid ${c.border}`,
                    color: c.text, fontSize: "13px", fontWeight: 500,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = c.accentBg; e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.color = c.accent; e.currentTarget.style.fontWeight = "700"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = c.surface2; e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text; e.currentTarget.style.fontWeight = "500"; }}
                  >
                    #{topic}
                  </span>
                ))}
              </div>
              <div style={s.sectionTitle}>📊 Top 10 Stories</div>
              {store.allArticles.slice(0, 10).map((item, i) => (
                <div key={i} style={{ ...s.card, display: "flex", gap: "16px", alignItems: "flex-start", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = c.shadowMd; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = c.shadow; }}
                  onClick={() => { store.trackRead(item); setReadItem(item); }}>
                  <div style={{
                    minWidth: "36px", height: "36px", borderRadius: "10px",
                    background: i < 3 ? c.gradPrimary : c.surface2,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 900, fontSize: "15px",
                    color: i < 3 ? "#fff" : c.muted,
                    flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "14px", lineHeight: 1.4, color: c.text }}>{item.title}</div>
                    <div style={{ fontSize: "11px", color: c.muted, marginTop: "4px" }}>⏱ {item.readTime || 1} {t.minRead}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── RECENT TAB ────────────────────────────────────────────────── */}
          {tab === "recent" && (
            <>
              <div style={s.sectionTitle}>🕑 Recently Read</div>
              {store.recentlyRead.length === 0
                ? <div style={{ textAlign: "center", padding: "48px 20px", color: c.muted }}><div style={{ fontSize: "32px", marginBottom: "10px" }}>🕑</div><div style={{ fontWeight: 600 }}>No reading history yet.</div></div>
                : store.recentlyRead.map((item, i) => <ArticleCard key={i} item={item} compact />)
              }
            </>
          )}

          {/* ── ANALYTICS TAB ─────────────────────────────────────────────── */}
          {tab === "analytics" && <Analytics heatmapData={store.heatmapData} readHistory={store.readHistory} darkMode={darkMode} />}

          {/* ── COLLECTIONS TAB ───────────────────────────────────────────── */}
          {tab === "collections" && (
            <Collections collections={store.collections} createCollection={store.createCollection} addToCollection={store.addToCollection} removeCollection={store.removeCollection} darkMode={darkMode} />
          )}

          {/* ── ALERTS TAB ────────────────────────────────────────────────── */}
          {tab === "alerts" && (
            <>
              <div style={s.sectionTitle}>🔔 Keyword Alerts</div>
              <div style={{ ...s.card, marginBottom: "20px" }}>
                <p style={{ fontSize: "13px", color: c.muted, marginBottom: "14px" }}>Get alerted when your keywords appear in news headlines.</p>
                <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                  <input style={{ ...s.input, flex: 1 }} placeholder="Add keyword (e.g. UPSC, Cricket, Budget)" value={kwInput} onChange={e => setKwInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && kwInput.trim()) { store.addKeyword(kwInput.trim()); setKwInput(""); } }} />
                  <button style={{ ...s.btn(P), background: c.gradPrimary, boxShadow: c.shadowAccent }} onClick={() => { if (kwInput.trim()) { store.addKeyword(kwInput.trim()); setKwInput(""); } }}>+ Add</button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                  {store.keywords.map((kw, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: c.accentBg, border: `1px solid ${c.accent}33`, borderRadius: "20px" }}>
                      <span style={{ fontSize: "13px", color: c.accent, fontWeight: 600 }}>{kw}</span>
                      <button onClick={() => store.removeKeyword(kw)} style={{ background: "none", border: "none", color: c.muted, cursor: "pointer", fontSize: "13px", lineHeight: 1, fontFamily: "inherit" }}>✕</button>
                    </div>
                  ))}
                  {store.keywords.length === 0 && <span style={{ fontSize: "13px", color: c.muted }}>No keywords added yet.</span>}
                </div>
              </div>
              {alertTriggered.length > 0 && (
                <>
                  <div style={s.sectionTitle}>⚡ Matched Articles ({alertTriggered.length})</div>
                  {alertTriggered.map((item, i) => <ArticleCard key={i} item={item} />)}
                </>
              )}
              {alertTriggered.length === 0 && store.keywords.length > 0 && (
                <div style={{ textAlign: "center", padding: "48px 20px", color: c.muted }}>
                  <div style={{ fontSize: "32px", marginBottom: "10px" }}>🔍</div>
                  <div style={{ fontWeight: 600 }}>No articles matched your keywords yet. Try refreshing.</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── OVERLAYS ────────────────────────────────────────────────────── */}
        {readItem && (
          <ReadMode
            item={readItem} onClose={() => setReadItem(null)} darkMode={darkMode}
            onSummarize={() => summarize(readItem, "short")} summary={summaries[`${readItem.link}__short`]} summarizing={summarizingId === readItem.link}
            onSpeak={() => speakItem(readItem)} speaking={speakingId === readItem.link}
          />
        )}

        {podcastOpen && <PodcastMode articles={store.allArticles} onClose={() => setPodcastOpen(false)} darkMode={darkMode} voiceLang={voiceLang} />}

        {collectionsOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setCollectionsOpen(false)}>
            <div style={{ background: c.surface, borderRadius: "20px 20px 0 0", padding: "24px 20px", width: "100%", maxWidth: "600px", maxHeight: "80vh", overflowY: "auto", border: `1px solid ${c.border}` }} onClick={e => e.stopPropagation()}>
              <Collections collections={store.collections} createCollection={store.createCollection} addToCollection={store.addToCollection} removeCollection={store.removeCollection} darkMode={darkMode} articleToAdd={articleToAdd} onClose={() => setCollectionsOpen(false)} />
              <button style={{ ...s.btn(null), marginTop: "16px", width: "100%", border: `1px solid ${c.border}` }} onClick={() => setCollectionsOpen(false)}>Close</button>
            </div>
          </div>
        )}

        {compareOpen && compareItems.length === 2 && (
          <div className="np-compare-modal" style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", overflowY: "auto", padding: "20px" }}>
            <div style={{ background: c.surface, borderRadius: "20px", maxWidth: "900px", margin: "0 auto", padding: "24px", border: `1px solid ${c.border}` }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                <span style={{ fontWeight: 700, fontSize: "18px", color: c.text, flex: 1 }}>⚖️ News Comparison</span>
                <button style={{ ...s.btn(null, true), border: `1px solid ${c.border}` }} onClick={() => { setCompareOpen(false); setCompareItems([]); }}>✕ Close</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "16px" }}>
                {compareItems.map((item, i) => (
                  <div key={i} style={{ ...s.card, margin: 0, minWidth: 0 }}>
                    <div style={{ fontSize: "10px", color: c.accent, fontWeight: 700, marginBottom: "8px", letterSpacing: "1px", textTransform: "uppercase" }}>SOURCE {i + 1}</div>
                    <h4 style={{ fontSize: "15px", fontWeight: 700, color: c.text, marginBottom: "8px", lineHeight: 1.4 }}>{item.title}</h4>
                    <p style={{ fontSize: "12px", color: c.muted, marginBottom: "10px" }}>{item.pubDate}</p>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button style={{ ...s.btn(P, true), background: c.gradPrimary }} onClick={() => summarize(item, "short")}>{summaries[`${item.link}__short`] ? "✓ Summarized" : t.summarize}</button>
                      <button style={{ ...s.btn(c.indigo, true) }} onClick={() => { console.log("CLICKED ARTICLE:", item); setReadItem(item); }}>Read Original →</button>
                    </div>
                    {summaries[`${item.link}__short`] && <div style={{ marginTop: "10px", padding: "10px 12px", background: c.accentBg, borderRadius: "10px", fontSize: "13px", color: c.text, lineHeight: 1.6, border: `1px solid ${c.accent}33` }}>{summaries[`${item.link}__short`]}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <footer style={{ textAlign: "center", padding: "28px 20px", color: c.muted, fontSize: "12px", borderTop: `1px solid ${c.border}`, marginTop: "32px" }}>
          <span style={{ fontWeight: 600 }}>📰 {t.title}</span> · Premium News Experience 🚀
        </footer>
      </div>
    </>
  );
}

// ── Helper Components (logic UNCHANGED, minimal style polish) ────────────────

function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const go = () => setOffline(true);
    const back = () => setOffline(false);
    window.addEventListener("offline", go);
    window.addEventListener("online", back);
    return () => { window.removeEventListener("offline", go); window.removeEventListener("online", back); };
  }, []);
  if (!offline) return null;
  return (
    <div style={{ background: "#EF4444", color: "#fff", textAlign: "center", padding: "9px 16px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
      📡 You are offline. Showing cached news.
    </div>
  );
}


function ReadingProgressBar() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      setPct(scrollHeight <= clientHeight ? 0 : Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div style={{ position: "fixed", top: 0, left: 0, height: "3px", width: `${pct}%`, background: "linear-gradient(90deg,#FF7A00,#FF4500)", zIndex: 9999, transition: "width 0.1s linear", pointerEvents: "none" }} />;
}

function ToggleSwitch({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: "44px", height: "24px", borderRadius: "12px", background: value ? "#FF7A00" : "#3D4451", cursor: "pointer", position: "relative", transition: "background 0.22s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: "3px", left: value ? "23px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.22s cubic-bezier(.34,1.56,.64,1)", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }} />
    </div>
  );
}

function SettingRow({ label, icon, c, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 0", borderBottom: `1px solid ${c.border}` }}>
      <span style={{ fontSize: "16px" }}>{icon}</span>
      <span style={{ flex: 1, fontSize: "14px", color: c.text, fontWeight: 500 }}>{label}</span>
      {children}
    </div>
  );
}

// ── Error Boundary (UNCHANGED) ────────────────────────────────────────────────
export class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("NewsPulse error:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0D1117", color: "#E6EDF3", fontFamily: "'Inter',sans-serif", gap: "16px", padding: "24px", textAlign: "center" }}>
          <span style={{ fontSize: "48px" }}>⚠️</span>
          <h2 style={{ fontWeight: 800, fontSize: "22px" }}>Something went wrong</h2>
          <p style={{ color: "#6E7681", fontSize: "14px", maxWidth: "400px" }}>{this.state.error?.message || "An unexpected error occurred."}</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{ background: "linear-gradient(135deg,#FF7A00,#FF4500)", border: "none", borderRadius: "12px", padding: "12px 28px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "15px", fontFamily: "inherit" }}>
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}