/**
 * cachedCrawler.js
 * Crawls pages with integrated cache
 */
import {crawlPage as originalCrawlPage} from "./crawler.js";
import {getCache, hasCache, setCache} from "./cache.js";

/**
 * Crawls a given page and returns the json response
 * @param {String} pageUrl The url to crawl
 */
export const crawlPage = function (pageUrl, callback) {
    if (hasCache(pageUrl)) {
        return getCache(pageUrl);
    }
    const requestResult = originalCrawlPage(pageUrl, callback);
    setCache(pageUrl, requestResult);
    return requestResult;
};
