// utils/browseScraper.js
const axios = require("axios");
const cheerio = require("cheerio");

const BASE_URL = "https://www.fema.gov";

const fetchFemaUpdates = async () => {
    try {
        const url = `${BASE_URL}/disaster/current`;
        const { data: html } = await axios.get(url);
        const $ = cheerio.load(html);

        const updates = [];

        const links = $(".wp-block-columns .wp-block-column a.fema-link");

        links.each((_, el) => {
            const title = $(el).text().trim();
            const href = $(el).attr("href");
            const fullLink = href?.startsWith("http") ? href : `${BASE_URL}${href}`;

            if (title && href) {
                updates.push({
                    title,
                    link: fullLink,
                });
            }
        });

        return updates;
    } catch (err) {
        console.error("Error scraping FEMA:", err.message);
        return [];
    }
};

module.exports = { fetchFemaUpdates };
