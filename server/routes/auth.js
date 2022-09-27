const router = require('express').Router()
const User = require('../models/users')
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcryptjs')
const { verifyUser } = require('../middleware/verify')

// @desc Register new user
// @route POST /api/auth/
// @perms ALL
router.post('/', asyncHandler( async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password ) return res.status(400).json({
        message: 'Please fill in all credentials'
    })

    const foundUser = await User.findOne({ email: email }).exec()

    console.log(foundUser._id)

    if (foundUser) return res.status(400).json({ message: 'Email already used' })

    const hashedPassword = await bcrypt.hash(password, 10)

    if (!hashedPassword) return res.status(500).json({ message: 'Error occurred. Please try again later'})

    const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword
    })

    const result = await newUser.save()

    if (!result) return res.status(500).json({ message: 'Error occurred. Please try again later' })

    res.status(201).json({ message: 'Registration successful' })
}))

// @desc Login to account
// @route POST /api/auth/login
// @perms ALL
router.post('/login', asyncHandler( async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(401).json({ message: 'Please enter all necessary credentials'})

    const foundUser = await User.findOne({ email: email }).exec()

    if (!foundUser) return res.status(404).json({ message: 'User does not exist '})

    const passwordResult = await bcrypt.compare(password, foundUser.password)

    if (!passwordResult) return res.status(403).json({ message: 'Invalid user credentials '})

    // Create accessToken
    const accessToken = jwt.sign(
        {
            "userData": {
                "firstName": foundUser.firstName,
                "lastName": foundUser.lastName,
                "id": foundUser._id,
                "profilePicture": foundUser.profilePicture
            }
        },
        process.env.JWT_ACCESS_KEY_SECRET,
        { expiresIn: '1d' }
    )

    // Create refreshToken
    const refreshToken = jwt.sign(
        {
            "userData": {
                "id": foundUser._id
            }
        },
        process.env.JWT_REFRESH_KEY_SECRET,
        { expiresIn: '3d' }
    )

    foundUser.refreshToken = refreshToken;
    const result = await foundUser.save()

    if (!result) return res.status(500).json({ message: 'Error occurred' })

    const cookies = req.cookies;
    if (cookies?.jwt) {
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
    }

    res.cookie('jwt', refreshToken, {httpOnly: true, sameSite: 'None', secure: true, maxAge: 1000 * 60 * 60 * 24 * 3 })

    res.status(201).json({ message: 'Login successful', accessToken })
}))

// @desc Log out
// @route POST /api/auth/logout:id
// @perms User
router.post('/logout/:id', verifyUser, asyncHandler(async (req, res) => {
    // Check if it is the user who is logging out
    if (req.user.id !== req.params.id) return res.sendStatus(403)

    const foundUser = await User.findOne({id: req.user.id}).exec()

    if (!foundUser) return res.sendStatus(404)

    foundUser.refreshToken = '';
    const result = await foundUser.save()

    if (req.cookies?.jwt) {
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
    }
    
    res.status(200).json({message: 'Log out successful'})
}))

// @desc Refresh
// @route GET /api/auth/refresh
// @perms ALL
router.get('/refresh', asyncHandler(async (req, res) => {
    const cookies = req.cookies

    if (!cookies?.jwt) return res.status(401).json({ message: 'No valid token'});

    const refreshToken = cookies.jwt;

    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })

    const foundUser = await User.findOne({ refreshToken }).exec()

    // Check re-use
    if (!foundUser) {
        // Check if refresh token is valid
        jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_KEY_SECRET,
            async (err, decoded) => {
                if (err) return res.sendStatus(403)

                const hackedUser = await User.findOne({_id: decoded.userData.id}).exec()
                
                if (!hackedUser) return res.sendStatus(403)
                hackedUser.refreshToken = '';
                const result = await hackedUser.save();
            }
        )

        return res.status(403).json({ message: 'Invalid user credentials' })
    }

    // Create new tokens
    // Create tokens
    const accessToken = jwt.sign(
        {
            "userData": {
                "firstName": foundUser.firstName,
                "lastName": foundUser.lastName,
                "id": foundUser._id,
                "profilePicture": foundUser.profilePicture
            }
        },
        process.env.JWT_ACCESS_KEY_SECRET,
        { expiresIn: '1d' }
    )

    // Create refreshToken
    const newRefreshToken = jwt.sign(
        {
            "userData": {
                "id": foundUser._id
            }
        },
        process.env.JWT_REFRESH_KEY_SECRET,
        { expiresIn: '3d' }
    )

    // Save new refresh token to database
    foundUser.refreshToken = newRefreshToken;
    const result = await foundUser.save()
    if (!result) return res.status(500).json({ message: 'Error occurred' })

    // Save refresh token to cookies
    res.cookie('jwt', newRefreshToken, {httpOnly: true, sameSite: 'None', secure: true, maxAge: 1000 * 60 * 60 * 24 * 3})
    
    // Return accessToken
    res.status(200).json({ accessToken })
}))

module.exports = router;