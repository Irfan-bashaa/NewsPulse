require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");

const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const newsRoutes = require("./routes/news");
const app = express();
const ogs = require("open-graph-scraper");
connectDB();

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/news", newsRoutes);
/* =====================================================
   ARTICLE API
===================================================== */

app.get("/api/article", async (req, res) => {

  try {

    const url = req.query.url;

    if (!url) {
      return res.status(400).json({
        error: "URL is required"
      });
    }

    const response = await axios.get(url, {
      maxRedirects: 10,
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137 Safari/537.36"
      }
    });

    const finalUrl =
      response.request?.res?.responseUrl || url;

    const dom = new JSDOM(response.data, {
      url: finalUrl
    });

    const reader =
      new Readability(dom.window.document);

    const article = reader.parse();
    // Fetch Open Graph metadata
let image = "";
let siteName = "";
let favicon = "";

try {
  const og = await ogs({ url: finalUrl });

  if (og.result.success) {
    image =
      og.result.ogImage?.[0]?.url ||
      og.result.twitterImage?.[0]?.url ||
      "";

    siteName =
      og.result.ogSiteName ||
      "";

    favicon =
      og.result.favicon ||
      "";
  }
} catch (err) {
  console.log("OG Error:", err.message);
}
    if (!article) {
      return res.status(404).json({
        error: "Article not found"
      });
    }

   res.json({
  title: article.title || "",
  excerpt: article.excerpt || "",
  content: article.content || "",
  text: article.textContent || "",
  image,
  favicon,
  siteName,
  originalUrl: finalUrl
});

  } catch (err) {

    console.error("ARTICLE ERROR:", err.message);

    res.status(500).json({
      error: err.message
    });
  }
});

/* =====================================================
   START SERVER
===================================================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});