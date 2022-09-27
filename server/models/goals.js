const mongoose = require('mongoose');

const goalSchema = mongoose.Schema({
    userId: {type: String, required: true},
    title: {type: String, required: true},
    description: {type: String, required: true},
    endDate: {type: Date, required: true},
    startDate: {type: Date, required: true},
    numOfMilestonesFinished: {type: Number},
    numOfMilestones: {type: Number},
    numOfLogs: {type: Number}
}, {timestamps: true})

module.exports = mongoose.model('Goal', goalSchema);