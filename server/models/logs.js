const mongoose = require('mongoose');

const logSchema = mongoose.Schema({
    userId: {type: String, required: true},
    milestoneId: {type: String, required: true},
    goalId: {type: String, required: true},
    title: {type: String, required: true},
    description: {type: String, required: true},
    date: {type: Date, required: true},
    images: {type: Array}
}, {timestamps: true})

module.exports = mongoose.model('Log', goalSchema);