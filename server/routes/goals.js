const router = require('express').Router()
const Goal = require('../models/goals')
const Milestone = require('../models/milestones')
const Log = require('../models/logs')
const asyncHandler = require('express-async-handler')
const { verifyUser } = require('../middleware/verify')

// @desc Get goal details
// @route GET /api/goals/
// @queries [id, userId]
// @perms User
router.get('/', verifyUser, asyncHandler( async (req, res) => {
    if (req.query.id) {
        const foundGoal = await Goal.findOne({ _id: req.query.id })

        if (!foundGoal) return res.status(404).json({ message: 'Goal does not exist' })

        if (foundGoal.userId !== req.user.id) return res.status(403).json({
            message: 'User unauthorized'
        })

        return res.status(200).json({
            message: 'Goal found',
            goal: foundGoal
        })
    } else if (req.query.userId) {
        if (req.user.id !== req.query.userId) return res.status(403).json({
            message: 'Unauthorized'
        })

        const foundGoals = await Goal.find({ userId: req.query.userId })

        if (foundGoals.length === 0) return res.status(404).json({
            message: 'No goals exist'
        })

        return res.status(200).json({
            message: 'Goals found',
            goal: foundGoals
        })
    }
}))

// @desc Create goal
// @route POST /api/goals/
// @perms User
router.post('/', verifyUser, asyncHandler( async (req, res) => {
    const {title, description, endDate, startDate} = req.body;

    if (!title || !description || !endDate || !startDate) return res.status(400).json({
        message: 'Please enter all credentials'
    })

    const foundGoal = await Goal.findOne({ title: title })
    if (foundGoal) return res.status(409).json({ message: 'Goal already exists'})

    const newGoal = new Goal({
        title,
        description,
        endDate,
        startDate,
        userId: req.user.id
    })

    const result = await newGoal.save()

    if (!result) return res.status(500).json({ message: 'Error occurred' })

    res.status(201).json({ 
        message: 'Goal created',
        goal: newGoal
    })
}))

// @desc Edit user goal
// @route PUT /api/goals/:id
// @perms User
router.put('/:id', verifyUser, asyncHandler( async (req, res) => {
    const foundGoal = await Goal.findOne({ _id: req.params.id })

    if (!foundGoal) return res.status(404).json({ message: 'Goal does not exist' })

    if (foundGoal.userId !== req.user.id) return res.status(403).json({
        message: 'User unauthorized'
    })

    const { title, description, endDate, startDate } = req.body;

    foundGoal.title = title;
    foundGoal.description = description;
    foundGoal.endDate = endDate;
    foundGoal.startDate = startDate;

    const result = await foundGoal.save()

    if (!result) return res.status(500).json({ message: 'Error occurred' })

    res.status(200).json({
        message: 'Goal edited'
    })
}))

// @desc Delete user goal
// @route DELETE /api/goals/:id
// @perms User
router.delete('/:id', verifyUser, asyncHandler( async (req, res) => {
    const foundGoal = await Goal.findOne({ _id: req.params.id })

    if (!foundGoal) return res.status(404).json({ message: 'Goal does not exist' })

    if (foundGoal.userId !== req.user.id) return res.status(403).json({
        message: 'User unauthorized'
    })

    const deletedLogs = await Log.deleteMany({ goalId: req.params.id })
    if (!deletedLogs) return res.status(500).json({ message: 'Error occurred' })

    const deletedMilestones = await Milestone.deleteMany({ goalId: req.params.id })
    if (!deletedMilestones) return res.status(500).json({ message: 'Error occurred' })

    const result = await Goal.findByIdAndDelete(req.params.id)
    if (!result) return res.status(500).json({ message: 'Error occurred' })

    res.status(201).json({
        message: 'Goal deleted'
    })
}))

module.exports = router;