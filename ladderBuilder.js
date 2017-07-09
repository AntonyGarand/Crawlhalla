/**
 * ladderBuilder.js
 * Builds whole ladder of Brawlhalla
 * Finds the number of player in each tier and division
 */

import {apiKey, rateLimit} from "./config.js";
import bhapi from "brawlhalla-api";
import util from "util";

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

// findTierPlayerCount(tierName, tierRange = 5) {
//     const tier = result[tierName];
//     for (let i = 0; i < tierRange; i++) {
//
//     }
// }

let lastRequest = Date.now();
// 1. Find the top player
// 2. Find the lowest player (To get the player count)
// 3. From the top (Diamond), find the next tier + division (Plat)
// 3..n do this until all tiers are found

let pageLength = 50;

class ladderBuilder {
    constructor(answerFound = false, answer = null, currentPage = 1, currentPageAnswer = null) {
        this.answerFound = answerFound;
        this.answer = answer;
        this.minPage = 1;
        this.maxPage = null;
        this.currentPage = currentPage;
        this.currentPageAnswer = currentPageAnswer;
        this.lastRequestTime = 0;
    }

    buildLadder() {
        this.answerFound = false;
        this.answer = null;
        this.currentPage = 1;
        this.minPage = 1;
        this.maxPage = null;
        this.currentPageAnswer = null;
        const condition = this.findLastPlayerCondition;
        const answerExtractor = this.extractPlayerCount;
        const callback = this.savePlayerCount;

        this.performQueryAfterLimit(condition, answerExtractor, callback);
    }

    performQueryAfterLimit(condition, extractor, callback){
        // Prevent api limit busting
        setTimeout(() => {
                this.lastRequestTime = Date.now()
                api.getRankings({page: this.currentPage}).then(
                    result => this.scrapeLeaderboardForConditionRecursive(result, condition, extractor, callback, 0, null)
                );
            },
            (this.lastRequestTime + (rateLimit * 1000)) - Date.now()
        );
    }

    scrapeLeaderboardForConditionRecursive(currentPageAnswer, condition, answerExtractor, answerFoundCallback) {
        const result = this.testPageForCondition(currentPageAnswer, condition, answerExtractor);
        this.minPage = parseInt(result.minPage);
        this.maxPage = parseInt(result.maxPage);
        if (result.isValid === true) {
            this.answer = result.answer;
            this.answerFound = true;
            answerFoundCallback(result.answer);
        } else {
            // When there is no upper limit
            if (this.maxPage === null || isNaN(this.maxPage)) {
                this.currentPage = Math.ceil(this.minPage + scanStep);
            } else {
                this.currentPage = Math.ceil((this.minPage + this.maxPage) / 2);
            }
            this.performQueryAfterLimit(condition, answerExtractor, answerFoundCallback);
        }
    }

    testPageForCondition(currentPageAnswer, condition, answerExtractor) {
        console.log('Testing page: ' + this.currentPage);
        const conditionResult = condition(currentPageAnswer, this.currentPage, this.minPage, this.maxPage);

        if (conditionResult > 0) {
            // Too high, go lower
            return this.buildAnswer(false, this.minPage, this.currentPage, null);
        } else if (conditionResult < 0) {
            // Too low, go higher
            return this.buildAnswer(false, this.currentPage, this.maxPage, null);
        } else {
            // Found the right page
            return this.buildAnswer(true, this.currentPage, this.currentPage, answerExtractor(currentPageAnswer, this.currentPage));
        }
    }
    buildAnswer(isValid, minPage, maxPage, answer){
        return {isValid, minPage, maxPage, answer};
    }

    // TODO: Extract function from class
    findLastPlayerCondition(currentPageAnswer, currentPageNumber, minPage, maxPage) {
        // Page found
        if ((currentPageAnswer.length < 50 && currentPageAnswer.length !== 0) ||
            (currentPageNumber === minPage && currentPageNumber === maxPage)) {
            return 0;
        }
        // Too high
        if (currentPageAnswer.length === 0) {
            return 1;
        }
        // Too low
        return -1;
    }

    // TODO: Extract function from class
    extractPlayerCount(currentPageAnswer, currentPageNumber) {
        return ((currentPageNumber - 1) * pageLength) + currentPageAnswer.length;
    }

    // TODO: Extract function from class
    savePlayerCount(playerCount) {
        //TODO: Write on disk the player count
        console.log('There are ' + playerCount + ' players at the moment');
    }
}

new ladderBuilder().buildLadder();

