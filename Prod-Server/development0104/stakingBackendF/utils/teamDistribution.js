const UserModel = require("../models/users.model");
const rankPlan = require("../config/rank.json");

const teamTurnoverDistribution  = async (userID, amount) => {
    try {

        const updateTurnover = await UserModel.findOne(
            { _id: userID },
        );
        
        // Skip for terminited user
        if(updateTurnover && !updateTurnover.isDeleted){
            updateTurnover.totalTeamTurnoverBalance += Number(amount);
            await updateTurnover.save();
        };

        if(updateTurnover.fromUser){
            await teamTurnoverDistribution(updateTurnover.fromUser, amount);
        };
        return true;
    } catch (e) {
        console.log('Error in Team Turnover Distribution', e.message);
        return false;
    };
};

async function checkrRankEligiblity(userId, currentRank){
    if(currentRank >= 4) return false;

    const targetAmount = rankPlan[currentRank].target;
    const oneLegTarget = await UserModel.findOne({
        fromUser: userId,
        totalTeamTurnoverBalance: { $gte: targetAmount },
        isDeleted: false
    });

    if(!oneLegTarget) return false;

    const otherLegs = await UserModel.find({
        fromUser: userId,
        isDeleted: false,
        _id: { $ne: oneLegTarget._id}
    })

    let otherLegsTurnover = 0;
    for(legs of otherLegs){
        otherLegsTurnover += legs.totalTeamTurnoverBalance;
    };
    if(otherLegsTurnover < targetAmount) return false;

    return true;
}

const upgradeRank  = async (userID) => {
    try {
        const userData = await UserModel.findOne({
            _id: userID,
        });
        
        if(!userData.isDeleted){
            const isRankUpgrade = await checkrRankEligiblity(userData._id, userData.rank);
    
            if(isRankUpgrade){        
                userData.rank += Number(1);
                await userData.save();
            }
        }

        if(userData.fromUser){
            await upgradeRank(userData.fromUser);
        };

        return true;
    } catch (e) {
        console.log('Error in Upgrade User Rank', e);
        return false;
    };
};

module.exports = {
    teamTurnoverDistribution,
    upgradeRank
};