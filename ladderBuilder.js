/**
 * ladderBuilder.js
 * Builds whole ladder of Brawlhalla
 * Finds the number of player in each tier and division
 */

import {rateLimit, apiKey} from './config.js';
import bhapi from 'brawlhalla-api';
import util from 'util';

import request from 'request';

Promise.prototype.isPending = function () {
    return util.inspect(this).indexOf("<pending>") > -1;
};

const api = bhapi(apiKey);
const tiers = ['Tin', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
const result = {};
const scanStep = 1500;

tiers.forEach(t => {
    result[t] = [];
    // t != Diamond Because diamond has only one tier
    for (let i = 0; i < (t != "Diamond" ? 5 : 1); i++) {
        result[t][i] = {
            minPosition: null,
            maxPosition: null,
            minCheckedPosition: null,
            maxCheckedPosition: null
        }
    }
});

let lastRequest = Date.now();
// 1. Find the top player
// 2. Find the lowest player (To get the player count)
// 3. From the top (Diamond), find the next tier + division (Plat)
// 3..n do this until all tiers are found

let pageLength = 50;

function findTierPlayerCount(tierName, tierRange = 5) {
    const tier = result[tierName];
    for (let i = 0; i < tierRange; i++) {

    }
}

function findLastPlayerCondition(currentPageAnswer, currentPageNumber, minPage, maxPage) {
    if ((currentPageAnswer.length < 50 && currentPageAnswer.length !== 0) ||
        (currentPageNumber === minPage && currentPageNumber === maxPage)) {
        return 0;
    }
    if (currentPageAnswer.length === 0) {
        return 1;
    }
    return -1;
}
function extractPlayerCount(currentPageAnswer, currentPageNumber) {
    return ((currentPageNumber - 1) * pageLength) + currentPageAnswer.length;
}

function scrapeLeaderboardForCondition(condition, answerExtractor, minPage, maxPage) {
    let answerFound = false;
    let answer = false;
    let currentPage;
    let currentPageAnswer;

    while (answerFound === false) {
        // When there is no upper limit
        if (maxPage === null || isNaN(maxPage)) {
            currentPage = Math.ceil(minPage + scanStep);
        } else {
            currentPage = Math.ceil((minPage + maxPage) / 2);
        }

        // Prevent busting the api rate limit
        while (lastRequest + (rateLimit * 1000) > Date.now()) {
        }
        lastRequest = Date.now();

        currentPageAnswer = api.getRankings({page: currentPage});

        const result = testPageForCondition(currentPageAnswer, currentPage, minPage, maxPage, condition, answerExtractor);
        if (result.isValid === true) {
            answer = result.answer;
            answerFound = true;
        }
        minPage = parseInt(result.minPage);
        maxPage = parseInt(result.maxPage);
    }
    return answer;
}

function testPageForCondition(currentPageAnswer, currentPage, minPage, maxPage, condition, answerExtractor) {
    console.log('Testing page: ' + currentPage);
    const conditionResult = condition(currentPageAnswer, currentPage, minPage, maxPage);

    const buildAnswer = function (isValid, minPage, maxPage, answer) {
        return {isValid, minPage, maxPage, answer};
    }
    if (conditionResult > 0) {
        // Too high, go lower
        return buildAnswer(false, minPage, currentPage, null);
    } else if (conditionResult < 0) {
        // Too low, go higher
        return buildAnswer(false, currentPage, maxPage, null);
    } else {
        // Found the right page
        return buildAnswer(true, currentPage, currentPage, answerExtractor(currentPageAnswer, currentPage));
    }
}

const playerCount = scrapeLeaderboardForCondition(findLastPlayerCondition, extractPlayerCount, 1, null)
console.log('There are ' + playerCount + ' ranked players at this moment.');

