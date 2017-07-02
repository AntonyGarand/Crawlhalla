const request = require("sync-request");
/**
 * Crawls a given page and returns the json response
 * @param {String} pageUrl The url to crawl
 */
export const crawlPage = function (pageUrl, callback) {
    const result = request('GET', pageUrl);
    return JSON.parse(result.getBody().toString());
};
