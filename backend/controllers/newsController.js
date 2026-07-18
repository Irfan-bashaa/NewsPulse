const Parser = require("rss-parser");
const axios = require("axios");
const cheerio = require("cheerio");

const parser = new Parser();

const newsService = require("../services/newsService");

exports.getNews = async (req, res) => {
    try {

        const state = req.query.state || "Andhra Pradesh";
        const category = req.query.category || "General";

        const news = await newsService.getNewsByState(state, category);

        res.json({
            items: news
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: err.message
        });

    }
};

