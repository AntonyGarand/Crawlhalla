import {rateLimit, apiKey} from "./config.js";
import bhapi from "brawlhalla-api";

/**
 * Class ladderNavigator
 * Navigates the ladder with the specified conditions
 */
export default class ladderNavigator {

    constructor(scanStep = 1500,
                minPage = 1,
                maxPage = null,) {
        this.answerFound = false;
        this.answer = null;
        this.minPage = minPage;
        this.maxPage = maxPage;
        this.currentPage = minPage;
        this.lastRequestTime = 0;
        this.api = bhapi(apiKey);
        this.scanStep = scanStep;
    }

    /**
     * scrapeLadder
     * Will navigate through the ladder until the given condition is met
     * @param conditionMethod The condition which checks if the page is too high, too low or exact
     * @param extractAnswerMethod The method which will return the answer from a given page
     * @returns {Promise} The promise with the result
     */
    scrapeLadder(conditionMethod, extractAnswerMethod) {
        this.answerFound = false;
        this.answer = null;
        return this._performQueryAfterLimit(conditionMethod, extractAnswerMethod);
    }

    /**
     * _performQueryAfterLimit
     * Will execute the next ladderboard scraping after the specified delay
     * WIP: Or immediately if a cached file is available
     * @param condition The condition to check
     * @param extractor The answer extractor
     * @returns {Promise} The extracted answer found
     */
    _performQueryAfterLimit(condition, extractor) {
        // Prevent api limit busting
        // TODO: Check if there is a cached file, and use it if available
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                    this.lastRequestTime = Date.now();
                    this.api.getRankings({page: this.currentPage}).then(
                        result =>
                            this._scrapeLeaderboardForConditionRecursive(result, condition, extractor)
                                .then(resolve, reject)
                    )
                },
                (this.lastRequestTime + (rateLimit * 1000)) - Date.now()
            );
        });
    }


    /**
     * _scrapeLeaderboardForConditionRecursive
     * Will recursively scrape the leaderboard until a given condition is met
     * @param currentPageAnswer The current page to scan
     * @param condition The condition to check
     * @param answerExtractor Method to extract the answer once found
     * @returns {Promise} The extracted answer found
     */
    _scrapeLeaderboardForConditionRecursive(currentPageAnswer, condition, answerExtractor) {
        const result = this._testPageForCondition(currentPageAnswer, condition, answerExtractor);
        this.minPage = parseInt(result.minPage);
        this.maxPage = parseInt(result.maxPage);

        return new Promise((resolve, reject) => {
            if (result.isValid === true) {
                this.answer = result.answer;
                this.answerFound = true;
                resolve(this.answer);
            } else {
                // When there is no upper limit
                if (this.maxPage === null || isNaN(this.maxPage)) {
                    this.currentPage = Math.ceil(this.minPage + this.scanStep);
                } else {
                    this.currentPage = Math.ceil((this.minPage + this.maxPage) / 2);
                }
                this._performQueryAfterLimit(condition, answerExtractor).then(resolve, reject);
            }
        });
    }

    /**
     * _testPageForCondition
     * Will test a page with a given condition
     * And build an answer accordingly
     * @param currentPageAnswer The current page object
     * @param condition The condition to test
     * @param answerExtractor Method to extract the answer if found
     * @returns {{isValid, minPage, maxPage, answer}} An object with the new arguments to use
     */
    _testPageForCondition(currentPageAnswer, condition, answerExtractor) {
        console.log('Testing page: ' + this.currentPage);
        const conditionResult = condition(currentPageAnswer, this.currentPage, this.minPage, this.maxPage);

        if (conditionResult > 0) {
            // Too high, go lower
            return this._buildAnswer(false, this.minPage, this.currentPage, null);
        } else if (conditionResult < 0) {
            // Too low, go higher
            return this._buildAnswer(false, this.currentPage, this.maxPage, null);
        } else {
            // Found the right page
            return this._buildAnswer(true, this.currentPage, this.currentPage, answerExtractor(currentPageAnswer, this.currentPage));
        }
    }

    /**
     * _buildAnswer
     * Will build an object with the given arguments
     * @param isValid Is the answer found
     * @param minPage The next lower limit to use
     * @param maxPage The next higher limit to use, or null if we don't know it yet
     * @param answer The answer object, if found
     * @returns {{isValid: *, minPage: *, maxPage: *, answer: *}}
     */
    _buildAnswer(isValid, minPage, maxPage, answer) {
        return {isValid, minPage, maxPage, answer};
    }
}
