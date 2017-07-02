/**
 * ladderBuilder.js
 * Builds whole ladder of Brawlhalla
 * Finds the number of player in each tier and division
 */
import {rateLimit} from './config.js';
import {getLadderPage} from './parser.js';

const tiers = ['Tin', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

const result = {};

const scanStep = 1500;


tiers.forEach(t => {
    result[t] = [];
    // t != Diamond Because diamond has only one tier
    // 6 and not 5 to count the tier 0 players
    for (let i = 0; i < (t != "Diamond" ? 6 : 1); i++) {
        result[t][i] = {
            minPosition: null,
            maxPosition: null,
            minCheckedPosition: null,
            maxCheckedPosition: null
        }
    }
});

let lastRequest = 0;
// 1. Find the top player
// 2. Find the lowest player (To get the player count)
// 3. From the top (Diamond), find the next tier + division (Plat)
// 3..n do this until all tiers are found
let playerCount = null;

let currentPage = 1;
let lastValidPage = 1;
let pageLength = 50;

let lowerLimit = 1;
let upperLimit = null;


function findLastPlayer(pageResult) {
    const currentPageAnswer = getLadderPage(currentPage);
    console.log("Finding last player!\n Current page is " + currentPage + ', last valid is ' + lastValidPage);

    if (currentPageAnswer.error) {
        return "Api problem! Last attempted page was " + currentPage + ", last valid page " + lastValidPage;
    }
    if (currentPageAnswer.length === 0) {
        console.log('Went too far! Rollbacking from half the previous page jump');
        if (lowerLimit + 1 === currentPage) {
            // Last page found
            playerCount = lowerLimit * pageLength + currentPageAnswer.length;
        }
        upperLimit = currentPage;
        currentPage = (lowerLimit + upperLimit) / 2;
    } else if(currentPageAnswer.length === pageLength){
        console.log('More players at this page, going next step');
        lowerLimit = currentPage;
        if(upperLimit !== null){
            currentPage = (lowerLimit + upperLimit) / 2;
        } else {
            currentPage += scanStep;
        }
    } else {
        //Last page found
        playerCount = pageLength * (currentPage - 1) + currentPageAnswer.length;
        console.log('There are ' + playerCount + ' Players!');
        console.log('with ' + currentPageAnswer.length + ' On this page');
    }
    currentPage = parseInt(currentPage);

    if (playerCount === null) {
        const msUntilNextRequest = (1000 * rateLimit) - (Date.now() - lastRequest);
        setTimeout(() => {
            lastRequest = Date.now();
            findLastPlayer(currentPage);
        }, msUntilNextRequest);
    } else {

    }
}

findLastPlayer(currentPage);

