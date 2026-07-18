const Parser = require("rss-parser");
const sources = require("../data/sources");
const imageService = require("./imageService");

const parser = new Parser();


exports.getNewsByState = async (state, category) => {

    let rssList = [];

    if (sources[state]) {
        rssList = sources[state];
    }

    if (sources.national) {
        rssList = [...rssList, ...sources.national];
    }

    let articles = [];

    for (const source of rssList) {

        if (!source.rss) continue;

        try {

            const feed = await parser.parseURL(source.rss);

            const news = await Promise.all(

                feed.items.map(async(item)=>{

                    const website =
                    await imageService.extractWebsiteData(item.link);

                    return{

                        title:item.title || "",

                        link:website.finalUrl,

                        description:
                        item.contentSnippet ||
                        item.content ||
                        "",

                        image:website.image,

                        favicon:website.favicon,

                        siteName:
                        website.siteName ||
                        source.name,

                        source:source.name,

                        pubDate:item.pubDate || ""

                    };

                })

            );

            articles.push(...news);

        }

        catch(err){

            console.log(source.name,err.message);

        }

    }
    
    const unique = new Map();

articles.forEach(article => {

    const key = article.title
        .replace(/\s*-\s*.*$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    if (!unique.has(key)) {
        unique.set(key, article);
    }

});

return [...unique.values()];


};