import {crawlPage} from './cachedCrawler.js';
import {apiUrl, apiKey} from './config.js';
/**
 * Finds and parses a ladder page
 * @param {Number} page
 * @param {String} region
 * @param {String} gameType
 */
export const getLadderPage = function (page, region = 'all', gameType = '1v1') {
    const pageUrl = `${apiUrl}/rankings/${gameType}/${region}/${page}?api_key=${apiKey}`;
    return crawlPage(pageUrl);
};

/**
 * Finds and parses a single player
 * @param playerId
 */
export const getPlayerPage = function (playerId) {
    // TODO
};

