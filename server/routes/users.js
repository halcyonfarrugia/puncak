const router = require('express').Router()
const User = require('../models/users')
const asyncHandler = require('express-async-handler')
const { verifyUser } = require('../middleware/verify')
const multer = require('multer')

// @desc Get user details
// @route GET /api/users/:id
// @perms User
router.get('/:id', verifyUser, asyncHandler( async (req, res) => {
    if (req.user.id !== req.params.id) return res.status(403).json({ message: 'Unauthorized'})

    const foundUser = await User.findById(req.params.id)

    if (!foundUser) return res.status(404).json({ message: 'User not found' })

    const { _id, firstName, lastName, profilePicture, email, createdAt } = foundUser

    res.status(200).json({
        message: 'User details found',
        user: {
            _id,
            firstName,
            lastName,
            profilePicture,
            email,
            createdAt
        }
    })
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

// @desc Edit user details
// @route PUT /api/users/:id?edit=true
// @perms User
router.put('/:id', verifyUser, upload.single("profilePicture"), asyncHandler( async (req, res) => {
    if (req.user.id !== req.params.id) return res.status(403).json({ message: 'Unauthorized'})

    if (req.query.edit === "true") {
        const foundUser = await User.findById(req.params.id)

        if (!foundUser) return res.status(404).json({ message: 'User not found' })

        const { firstName, lastName, email } = req.body;

        foundUser.profilePicture = req.file.path
        foundUser.firstName = firstName
        foundUser.lastName = lastName
        foundUser.email = email
        const result = await foundUser.save()

        return res.status(201).json({
            message: 'User details edited',
        })
    } else {
        return res.status(400).json({
            message: 'Edit invalid'
        })
    }
}))

// Delete user details
router.delete('/:id', verifyUser, asyncHandler( async (req, res) => {
    if (req.user.id !== req.params.id) return res.status(403).json({ message: 'Unauthorized'})

    const foundUser = await User.findById(req.params.id)

    if (!foundUser) return res.status(404).json({ message: 'User not found' })

    const deleted = await User.findByIdAndDelete(req.params.id)

    if (!deleted) return res.status(500).json({ message: 'Error occurred' })

    res.status(201).json({ message: 'User deleted' })
}))

module.exports = router;