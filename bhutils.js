const tiers = [
    {
        minElo: 720,
        maxElo: 909,
        tierName: 'Tin'
    },
    {
        minElo: 910,
        maxElo: 1129,
        tierName: 'Bronze'
    },
    {
        minElo: 1130,
        maxElo: 1389,
        tierName: 'Silver'
    },
    {
        minElo: 1390,
        maxElo: 1679,
        tierName: 'Gold'
    },
    {
        minElo: 1680,
        maxElo: 1999,
        tierName: 'Platinum'
    },
    {
        minElo: 2000,
        maxElo: 9999,
        tierName: 'Diamond'
    }
];

export default class bhutils{
    /**
     *  eloToTier
     *  From a given elo, returns a rank object
     * @param {Number} elo
     * @returns {{tier: string, division: number}}
     */
    static eloToTier(elo) {
        let setDivision = null;
        // Tin and diamond particularities
        if(elo < 720){
            elo = 720;
            setDivision = 0;
        } else if(elo >= 2000){
            setDivision = 1;
        }
        const playerTier = tiers.find(t => elo >= t.minElo && elo <= t.maxElo);
        const tierDiff = (playerTier.maxElo - playerTier.minElo) / 5;
        const playerDivision = setDivision === null ? Math.ceil((elo - playerTier.minElo) / tierDiff) : setDivision;

        return {
            tier: playerTier.tierName,
            division: playerDivision
        }
    }
}