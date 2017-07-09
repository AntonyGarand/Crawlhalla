/**
 * ladderBuilder.js
 * Builds whole ladder of Brawlhalla
 * Finds the number of player in each tier and division
 */

import navigator from "./ladderNavigator.js";

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

function findLastPlayerCondition(currentPageAnswer, currentPageNumber, minPage, maxPage) {
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

function extractPlayerCount(currentPageAnswer, currentPageNumber) {
    return ((currentPageNumber - 1) * pageLength) + currentPageAnswer.length;
}

function savePlayerCount(playerCount) {
    //TODO: Write on disk the player count
    console.log('There are ' + playerCount + ' players at the moment');
}

new navigator().scrapeLadder(findLastPlayerCondition, extractPlayerCount).then(savePlayerCount);

