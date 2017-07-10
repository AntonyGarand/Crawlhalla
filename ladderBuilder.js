/**
 * ladderBuilder.js
 * Builds whole ladder of Brawlhalla
 * Finds the number of player in each tier and division
 */

import navigator from "./ladderNavigator.js";
import fs from "fs";


class ladderBuilder {
    static tiers = ['Tin', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

    constructor() {
        this.result = {};
        this.scanStep = 1500;
        this.playerCount = null;
        this._initTiers();
    }

    buildLadder() {
        let currentPromise = new navigator(100).scrapeLadder(
            ladderBuilder._findStartOfTierAndDivision('Diamond', 0),
            ladderBuilder._findPlayersInDivisionUntilPage
        );

        for(let tier in this.result){
            for(let division of this.result[tier]){
                console.log('Adding ' + division.tierName + ' ' + division.division)
                currentPromise = currentPromise.then(playerInPreviousTier => {
                    division.minPosition = playersInPreviousTier;
                    const newNavigator = new navigator(100, Math.floor(playerInPreviousTier / 50));
                    return newNavigator.scrapeLadder(
                        ladderBuilder._findStartOfTierAndDivision(division.tierName, division.division),
                        ladderBuilder._findPlayersInDivisionUntilPage
                    )
                });
            }
        }

        return currentPromise;
    }

    _buildLadderRecursive(tier, division) {

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
        const result = this.result;
        ladderBuilder.tiers.forEach(t => {
            result[t] = [];
            // t != Diamond as diamond has only one tier
            for (let i = 0; i < (t !== "Diamond" ? 5 : 1); i++) {
                result[t][i] = {
                    tierName: t,
                    division: i + 1,
                    minPosition: null,
                    maxPosition: null
                }
            }
        });
    }

    static _findStartOfTierAndDivision(wantedTier, wantedDivision) {
        console.log('Finding page of ' + wantedTier + ' ' + wantedDivision);

        const wantedTierIndex = ladderBuilder.tiers.indexOf(wantedTier);
        if (wantedTierIndex === -1) {
            throw new Error('Invalid tier searched!');
        }

        return (pageAnswer, currentPage, minPage, maxPage) => {
            const {lowest, highest} = ladderBuilder._findTierAndDivisionOnPage(pageAnswer);
            // Too high
            if (!lowest)
                return 1;

            console.log('Current page has ' + lowest.tier + ' ' + lowest.division);
            if (wantedTier === highest.tier) {
                // TODO: Check if we're on the lowest page

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
            return ladderBuilder.tiers.indexOf(lowest.tier) < wantedTierIndex ? 1 : -1;
        }
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
     * @returns {{lowest: {tier, division: *}, highest: {tier, division: *}}}
     * @private
     */
    static _buildLowestAndHighestPlayerTierAndDivisionInformation(highestPlayer, lowestPlayer) {
        //TODO: Find tier based on ELO instead, cause diamonds players can be scattered
        const highestTier = highestPlayer.tier.split(' ');
        const lowestTier = lowestPlayer.tier.split(' ');
        // For diamond players, which is written 'Diamond' instead of 'Diamond 0'
        if (highestTier.length === 1) {
            highestTier[1] = 1;
        }
        if (lowestTier.length === 1) {
            lowestTier[1] = 1;
        }

        return {
            lowest: {
                tier: lowestTier[0],
                division: parseInt(lowestTier[1])
            },
            highest: {
                tier: highestTier[0],
                division: parseInt(highestTier[1])
            }
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
new ladderBuilder().buildLadder().then(result => console.log(result));
