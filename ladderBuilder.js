/**
 * ladderBuilder.js
 * Builds whole ladder of Brawlhalla
 * Finds the number of player in each tier and division
 */

import navigator from "./ladderNavigator.js";
import fs from "fs";
import utils from "./bhutils.js";

export default class ladderBuilder {
    static tiers = ['Tin', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

    constructor() {
        this.result = {};
        this.scanStep = 1500;
        this.playerCount = null;
        this._initTiers();
    }

    buildLadder() {
        let currentPromise = new navigator(8).scrapeLadder(
            ladderBuilder._findStartOfTierAndDivision('Diamond', 1),
            ladderBuilder._findPlayersInDivisionUntilPage
        );

        let count = 0;

        let currentPromise;
        // Assuming we're
        for (let i = 0; i < this.result.length; i++) {
            const tier = this.result[i];
            for (let j = 0; j < tier.length; j++) {
                const rankObject = tier[j];

                let minPage;
                const minPage = this.findPreviousRank(j, tier, minPage, i).minPage;

                rankObject.minPosition = minPage;

                const newNavigator = new navigator(100, minPage);
                if(!currentPromise){
                    currentPromise = newNavigator.scrapeLadder(
                        ladderBuilder._findStartOfTierAndDivision(rankObject.tierName, rankObject.division),
                        ladderBuilder._findPlayersInDivisionUntilPage
                    ).then(result => {
                        rankObject.minPosition =  result;
                    });
                } else {
                    currentPromise = currentPromise.then( () => {
                            newNavigator.scrapeLadder(
                            ladderBuilder._findStartOfTierAndDivision(rankObject.tierName, rankObject.division),
                            ladderBuilder._findPlayersInDivisionUntilPage
                        ).then(result => {
                            rankObject.minPosition =  result;
                        });
                    });
                }
            }
        }
        /* for (let tier of this.result) {
            for (let rank of this.result[tier]) {
                if ('Tin' === rank.tierName && 0 === rank.division)
                    continue;
                if (count++ > 1) {
                    break;
                }
                currentPromise = currentPromise.then(playersInPreviousTier => {
                    rank.minPosition = playersInPreviousTier;
                    console.log('Previous rank Started on page ' + playersInPreviousTier / 50);
                    const newNavigator = new navigator(50, 3900);
                    return newNavigator.scrapeLadder(
                        ladderBuilder._findStartOfTierAndDivision(rank.tierName, rank.division),
                        ladderBuilder._findPlayersInDivisionUntilPage
                    )
                });
            }
        }
        currentPromise = currentPromise.then(answer => {
            return new Promise((resolve, reject) => resolve(this.answer));
        }); */
        return currentPromise;
    }

    _findPreviousRank(tierIndex,divisionIndex, currentTier) {
        let minPage;
        if (tierIndex === currentTier.length - 1) {
            // Check next tier
            const previousTier = currentTier[tierIndex + 1];
            minPage = previousTier.minPosition | 1;
        } else if (divisionIndex !== 0) {
            // Check next division
            const previousDivision = this.result[divisionIndex - 1];
            // Getting the highest tier of this division
            minPage = previousDivision[previousDivision.length - 1].minPosition;
        } else {
            minPage = 1;
        }
        return minPage;
    }

    findTotalPlayerCount() {
        // TODO: Check cache (written file) as well
        if (this.playerCount !== null) {
            return new Promise(f => f(this.playerCount));
        }
        const totalNavigator = new navigator();
        return totalNavigator.scrapeLadder(
            ladderBuilder._findLastPlayerCondition,
            ladderBuilder._extractPlayerCount
        ).then(playerCount => {
                this.playerCount = playerCount;
                ladderBuilder._savePlayerCount(playerCount);
            }
        );
    }

    /**
     * _initTiers
     * Populates the result property with tiers information
     * Result will contain one property per tier,
     *  each property having 5 divisions
     *  and each division having the following attributes: minPosition, maxPosition
     * @private
     */
    _initTiers() {
        this.result = [];
        ladderBuilder.tiers.reverse().forEach((tier, index) => {
            const newTier = [];
            // tier != Diamond as diamond has only one tier
            for (let i = 0; i < (tier !== "Diamond" ? 5 : 1); i++) {
                newTier[i] = {
                    tierName: tier,
                    tierIndex: index,
                    division: i + 1,
                    minPosition: null,
                    maxPosition: null
                }
            }
            this.result.push(newTier);
        });
        console.log(this.result);
    }

    static _findStartOfTierAndDivision(wantedRank) {
        console.log('Searching for ' + wantedRank.tier + ' ' + wantedRank.division);

        return (pageAnswer, currentPage, minPage, maxPage) => {
            if (pageAnswer.length === 0)
                return 1;
            if (maxPage - minPage === 1)
                return 0;

            const {lowest, highest} = ladderBuilder._findTierAndDivisionOnPage(pageAnswer);
            // Too high
            if (!lowest)
                return 1;

            if (wantedTier === highest.tier) {
                // Good division, check if we're on the lowest page of this division
                if (wantedDivision === highest.division) {
                    // No need to check the tier, unless the leaderboards are REALLY empty. TODO?

                    // If there is a tier/division split on the page
                    //  ** Either lowest or highest page from this tier, we may want either **
                    // Or if the min page is full of this tier
                    // We're on the right page
                    if (highest.division !== lowest.division ||
                        (minPage === maxPage)
                    ) {
                        return 0;
                    }
                }
                // Find if we're too high, or too low
                return wantedDivision > highest.division ? 1 : -1;
            }

            // Wrong page: Different tier. Check tier diff
            return ladderBuilder.tiers.indexOf(lowest.tier) > wantedRank.tierIndex ? 1 : -1;
        }
    }

    static _populateRankOfDivision(wantedTier, wantedDivision) {
    }

    static _findPlayersInDivisionUntilPage(pageAnswer, pageNumber) {
        return pageNumber * 50;
    }

    /**
     * _findTierAndDivisionInformationOnPage
     * @param pagePlayers a list of BH players from the api
     * @returns {Object} Information about the highest and lowest players of the page
     * @private
     */
    static _findTierAndDivisionOnPage(pagePlayers) {
        if (!pagePlayers || pagePlayers.length === 0) {
            return {lowest: null, highest: null};
        }
        let highest = pagePlayers[0];
        let lowest = pagePlayers[pagePlayers.length - 1];
        return ladderBuilder._buildLowestAndHighestPlayerTierAndDivisionInformation(highest, lowest);
    }

    /**
     * _buildLowestAndHighestPlayerTierAndDivisionInformation
     * Returns an object with the lowest and highest tiers and divisions from two players based on their ELO
     * @param highestPlayer
     * @param lowestPlayer
     * @returns {{lowest: {tier: string, division: Number}, highest: {tier: string, division: Number}}}
     * @private
     */
    static _buildLowestAndHighestPlayerTierAndDivisionInformation(highestPlayer, lowestPlayer) {
        return {
            lowest: utils.eloToTier(lowestPlayer.rating),
            highest: utils.eloToTier(highestPlayer.rating)
        }
    }


    /**
     * _findLastPlayerCondition
     * @param currentPageAnswer The current API page answer, an array with the players
     * @param currentPageNumber The current page number
     * @param minPage The lowest possible page
     * @param maxPage The highest possible page
     * @returns {number} -1 if too low, 1 if too high, 0 if correct answer
     * @private
     */
    static _findLastPlayerCondition(currentPageAnswer, currentPageNumber, minPage, maxPage) {
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

    /**
     * _extractPlayerCount
     * Finds the total amount of players until this page
     * @param currentPageAnswer An array of all players on this page
     * @param currentPageNumber The current page number
     * @returns {Number} The total amount of players until this page
     * @private
     */
    static _extractPlayerCount(currentPageAnswer, currentPageNumber) {
        return ((currentPageNumber - 1) * 50) + currentPageAnswer.length;
    }

    /**
     * _savePlayerCount
     * @param playerCount the number of players in the game
     * @private
     */
    static _savePlayerCount(playerCount) {
        console.log('There are ' + playerCount + ' players at the moment');
        fs.writeFile("./playerCount.txt", playerCount);
    }

}
const a = new ladderBuilder();

a.buildLadder().then(() => {
    console.log(a.result);
});
