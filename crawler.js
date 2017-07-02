const request = require("request");
/**
 * Crawls a given page and returns the json response
 * @param {String} pageUrl The url to crawl
 */
export const crawlPage = function (pageUrl, callback) {
    const requestData = {
        method: 'GET',
        uri: pageUrl,
        gzip: true
    };
    request(requestData, (error, response, body) => {
        callback(body);
    });
};
