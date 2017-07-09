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
export const crawlPage = async function (pageUrl) {
    if (hasCache(pageUrl)) {
        return getCache(pageUrl);
    }
    const requestResult = originalCrawlPage(pageUrl);
    setCache(pageUrl, requestResult);
    return requestResult;
};