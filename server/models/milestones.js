const mongoose = require('mongoose');

const milestoneSchema = mongoose.Schema({
    userId: {type: String, required: true},
    goalId: {type: String, required: true},
    title: {type: String, required: true},
    description: {type: String, required: true},
    endDate: {type: Date, required: true},
    numOfLogs: {type: Number},
    isComplete: {type: Boolean, default: false}
}, {timestamps: true})

module.exports = mongoose.model('Milestone', goalSchema);