const axios = require("axios");
const cheerio = require("cheerio");

exports.extractWebsiteData = async (url) => {

    let finalUrl = url;
    let image = "";
    let favicon = "";
    let siteName = "";
try {

    console.log("================================");
    console.log("Google URL :", url);

    // Decode URL
    finalUrl = await decoder.decodeUrl(url);

    console.log("Decoded URL :", finalUrl);

    const redirect = await axios.get(finalUrl, {
        maxRedirects: 5,
        timeout: 10000,
        headers: {
            "User-Agent": "Mozilla/5.0"
        }
    });

    console.log("FINAL URL:", finalUrl);

    const html = redirect.data;

    console.log(html.substring(0, 1000));

    const $ = cheerio.load(html);

    console.log("OG IMAGE =", $('meta[property="og:image"]').attr("content"));
    console.log("TWITTER IMAGE =", $('meta[name="twitter:image"]').attr("content"));
    console.log("CANONICAL =", $('link[rel="canonical"]').attr("href"));
    console.log("TITLE =", $("title").text());

    image =
        $('meta[property="og:image"]').attr("content") ||
        $('meta[name="twitter:image"]').attr("content") ||
        "";

    favicon =
        $('link[rel="icon"]').attr("href") ||
        $('link[rel="shortcut icon"]').attr("href") ||
        "";

    siteName =
        $('meta[property="og:site_name"]').attr("content") ||
        "";

    console.log("Visited URL :", redirect.request.res.responseUrl);
    console.log("Image :", image);
    console.log("================================");

} catch (err) {

    console.log("Image Service:", err.message);
 
}

    return {
        finalUrl,
        image,
        favicon,
        siteName
    };

};