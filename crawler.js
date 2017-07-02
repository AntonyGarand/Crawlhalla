const request = require("request-promise-native");
/**
 * Crawls a given page and returns the json response
 * @param {String} pageUrl The url to crawl
 */
export const crawlPage = async function (pageUrl) {
    const result = await request(pageUrl).then(r => JSON.parse(r.getBody().toString()));
    return result;
};
