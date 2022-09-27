const router = require('express').Router()
const Goal = require('../models/goals')
const Milestone = require('../models/milestones')
const Log = require('../models/logs')
const asyncHandler = require('express-async-handler')
const { verifyUser } = require('../middleware/verify')
const multer = require('multer')

// @desc Get log details
// @route GET /api/logs/
// @queries [id, userId, milestoneId, goalId, date]
// @perms User
router.get('/', verifyUser, asyncHandler( async (req, res) => {
    if (req.query.id) {
        const foundLog = await Log.findOne({ _id: req.query.id })

        if (!foundLog) return res.status(404).json({ message: 'Log does not exist' })

        if (foundLog.userId !== req.user.id) return res.status(403).json({
            message: 'User unauthorized'
        })

        return res.status(200).json({
            message: 'Log found',
            milestone: foundLog
        })
    } else if (req.query.userId) {
        if (req.user.id !== req.query.userId) return res.status(403).json({
            message: 'Unauthorized'
        })

        const foundLogs = await Log.find({ userId: req.query.userId })

        if (foundLogs.length === 0) return res.status(404).json({
            message: 'No logs exist'
        })

        return res.status(200).json({
            message: 'Logs found',
            logs: foundLogs
        })
    } else if (req.query.milestoneId) {
        const foundMilestone = await Milestone.findOne({ _id: req.query.milestoneId })
        if (!foundMilestone) return res.status(404).json({ message: 'Milestone does not exist'})

        if (req.user.id !== foundMilestone.userId) return res.status(403).json({
            message: 'Unauthorized'
        })

        const foundLogs = await Log.find({ milestoneId: req.query.milestoneId })

        if (foundLogs.length === 0) return res.status(404).json({
            message: 'No logs exist for milestone'
        })

        return res.status(200).json({
            message: 'Logs found',
            logs: foundLogs
        })
    } else if (req.query.goalId) {
        const foundGoal = await Goal.findOne({ _id: req.query.goalId }).exec()
        if (!foundGoal) return res.status(404).json({ message: 'Goal does not exist'})

        if (req.user.id !== foundGoal.userId) return res.status(403).json({ message: 'Unauthorized' })

        const foundLogs = await Log.find({ goalId: req.query.goalId })

        if (foundLogs.length === 0) return res.status(404).json({
            message: 'No logs exist for specific day'
        })

        return res.status(200).json({
            message: 'Logs found',
            logs: foundLogs
        })        
    } else if (req.query.date) {
        let date = new Date(req.query.date)
        const foundLogs = await Log.find({ date, userId: req.user.id })

        if (foundLogs.length === 0) return res.status(404).json({
            message: 'No logs exist for specific day'
        })

        return res.status(200).json({
            message: 'Logs found',
            logs: foundLogs
        })
    }
}))

// Image configuration
const storage = multer.diskStorage({
    destination: (req, file, cb)  => {
        const path = `./client/src/images/${req.user.id}`
        fs.mkdirSync(path, {recursive: true})
        cb(null, `./client/src/images/${req.user.id}`)
        // Saving to unique folder with user's ID
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname + Date.now() + req.user.id)
        // Saving as fieldname (i.e., profilePicture) + date + userId
    }
})
const upload = multer({ storage: storage })
const handleImages = upload.fields([{ name: 'images', maxCount: 3 }])

// @desc Create logs
// @route POST /api/logs/
// @perms User
router.post('/', verifyUser, handleImages, asyncHandler( async (req, res) => {
    const {milestoneId, goalId, title, description, date} = req.body;

    if (!title || !description || !date || !goalId || !milestoneId) return res.status(400).json({
        message: 'Please enter all credentials'
    })

    const foundGoal = await Goal.findOne({ _id: goalId })
    if (!foundGoal) return res.status(404).json({ message: 'Goal does not exist'})

    const foundMilestone = await Milestone.findOne({ _id: milestoneId })
    if (!foundMilestone) return res.status(404).json({ message: 'Milestone does not exist'})

    if (req.files['images']) {
        const images = req.files['images'].map((image) => (image.path))
    } else {
        const images = [];
    }

    const newLog = new Log({
        title,
        description,
        date,
        userId: req.user.id,
        goalId,
        milestoneId,
        images
    })

    const result = await newLog.save()

    if (!result) return res.status(500).json({ message: 'Error occurred' })

    foundGoal.numOfLogs += 1
    const goalResult = await foundGoal.save()

    foundMilestone.numOfLogs += 1
    const milestoneResult = await foundMilestone.save()

    res.status(201).json({ 
        message: 'Log created',
        log: newLog
    })
}))

// @desc Delete log
// @route DELETE /api/logs/:id
// @perms User
router.delete('/:id', verifyUser, asyncHandler( async (req, res) => {
    const foundLog = await Log.findOne({ _id: req.params.id })

    if (!foundLog) return res.status(404).json({ message: 'Log does not exist' })

    if (foundLog.userId !== req.user.id) return res.status(403).json({
        message: 'User unauthorized'
    })

    const foundGoal = await Goal.findById(foundLog.goalId)
    const foundMilestone = await Milestone.findById(foundLog.milestoneId)

    foundGoal.numOfLogs -= 1
    const goalResult = await foundGoal.save()

    foundMilestone.numOfLogs -= 1
    const milestoneResult = await foundMilestone.save()

    const result = await Log.findByIdAndDelete(req.params.id)
    if (!result) return res.status(500).json({ message: 'Error occurred' })

    res.status(201).json({
        message: 'Log deleted'
    })
}))

module.exports = router;