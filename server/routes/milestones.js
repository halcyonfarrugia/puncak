const router = require('express').Router()
const Goal = require('../models/goals')
const Milestone = require('../models/milestones')
const Log = require('../models/logs')
const asyncHandler = require('express-async-handler')
const { verifyUser } = require('../middleware/verify')

// @desc Get milestone details
// @route GET /api/milestones/
// @queries [id, userId, goalId]
// @perms User
router.get('/', verifyUser, asyncHandler( async (req, res) => {
    if (req.query.id) {
        const foundMilestone = await Milestone.findOne({ _id: req.query.id })

        if (!foundMilestone) return res.status(404).json({ message: 'Milestone does not exist' })

        if (foundMilestone.userId !== req.user.id) return res.status(403).json({
            message: 'User unauthorized'
        })

        return res.status(200).json({
            message: 'Milestone found',
            milestone: foundMilestone
        })
    } else if (req.query.userId) {
        if (req.user.id !== req.query.userId) return res.status(403).json({
            message: 'Unauthorized'
        })

        const foundMilestones = await Goal.find({ userId: req.query.userId })

        if (foundMilestones.length === 0) return res.status(404).json({
            message: 'No milestones exist'
        })

        return res.status(200).json({
            message: 'Milestones found',
            milestones: foundMilestones
        })
    } else if (req.query.goalId) {
        const foundGoal = await Goal.findOne({ _id: req.query.goalId })
        if (!foundGoal) return res.status(404).json({ message: 'Goal does not exist'})

        if (req.user.id !== foundGoal.userId) return res.status(403).json({
            message: 'Unauthorized'
        })

        const foundMilestones = await Goal.find({ goalId: req.query.goalId, userId: req.user.id })

        if (foundMilestones.length === 0) return res.status(404).json({
            message: 'No milestones exist'
        })

        return res.status(200).json({
            message: 'Milestones found',
            milestones: foundMilestones
        })
    }

}))


// @desc Create milestone
// @route POST /api/milestones/
// @perms User
router.post('/', verifyUser, asyncHandler( async (req, res) => {
    const {goalId, title, description, endDate} = req.body;

    if (!title || !description || !endDate || !goalId) return res.status(400).json({
        message: 'Please enter all credentials'
    })

    const foundGoal = await Goal.findOne({ _id: goalId })
    if (!foundGoal) return res.status(409).json({ message: 'Goal does not exist'})

    const foundMilestone = await Milestone.findOne({ title: title, endDate: endDate, goalId: goalId })
    if (foundMilestone) return res.status(409).json({ message: 'Milestone already exists'})

    const newMilestone = new Milestone({
        title,
        description,
        endDate,
        userId: req.user.id,
        goalId
    })

    const result = await newMilestone.save()

    if (!result) return res.status(500).json({ message: 'Error occurred' })

    foundGoal.numOfMilestones += 1
    const goalResult = await foundGoal.save()

    res.status(201).json({ 
        message: 'Milestone created',
        milestone: newMilestone
    })
}))

// @desc Edit user milestone
// @route PUT /api/milestones/:id
// @queries { Edit: finish, resume }
// @perms User
router.put('/:id', verifyUser, asyncHandler( async (req, res) => {
    const foundMilestone = await Milestone.findOne({ _id: req.params.id })

    if (!foundMilestone) return res.status(404).json({ message: 'Milestone does not exist' })

    if (foundMilestone.userId !== req.user.id) return res.status(403).json({
        message: 'User unauthorized'
    })
    
    const foundGoal = await Goal.findOne({ _id: foundMilestone.goalId })

    switch (req.query.edit) {
        case "finish":
            foundMilestone.isComplete = true;
            foundMilestone.isComplete = true;
            foundGoal.numOfMilestonesFinished += 1
            let result = await foundMilestone.save()
            result = await foundGoal.save()
            if (!result) return res.status(500).json({ message: 'Error occurred'})
            return res.status(201).json({ message: 'Milestone set to complete' })
            break;

        case "resume":
            if (foundMilestone.isComplete === true) {
                foundMilestone.isComplete = false;
                foundGoal.numOfMilestonesFinished -= 1
            }
            let isSaved = await foundMilestone.save()
            isSaved = await foundGoal.save()
            if (!isSaved) return res.status(500).json({ message: 'Error occurred'})
            return res.status(201).json({ message: 'Milestone set to incomplete' })
            break;

        default: 
            const { title, description, endDate } = req.body;
            foundMilestone.title = title;
            foundMilestone.description = description;
            foundMilestone.endDate = endDate;
            let isEdited = await foundMilestone.save()
            if (!isEdited) return res.status(500).json({ message: 'Error occurred'})
            return res.status(201).json({ message: 'Milestone edited successfully'})
    }
}))

// @desc Delete milestone
// @route DELETE /api/milestones/:id
// @perms User
router.delete('/:id', verifyUser, asyncHandler( async (req, res) => {
    const foundMilestone = await Milestone.findOne({ _id: req.params.id })

    if (!foundMilestone) return res.status(404).json({ message: 'Milestone does not exist' })

    if (foundMilestone.userId !== req.user.id) return res.status(403).json({
        message: 'User unauthorized'
    })

    const deletedLogs = await Log.deleteMany({ milestoneId: req.params.id })
    if (!deletedLogs) return res.status(500).json({ message: 'Error occurred' })

    const foundGoal = await Goal.findOne({ _id: foundMilestone.goalId })
    if (foundMilestone.isComplete === true) {
        foundGoal.numOfMilestonesFinished -= 1;
    }
    foundGoal.numOfMilestones -= 1;

    const result = await Milestone.findByIdAndDelete(req.params.id)
    if (!result) return res.status(500).json({ message: 'Error occurred' })

    res.status(201).json({
        message: 'Milestone deleted'
    })
}))

module.exports = router;