const jwt = require('jsonwebtoken')

const verifyUser = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return res.sendStatus(401)

    const token = authHeader.split(' ')[1];

    jwt.verify(
        token,
        process.env.JWT_ACCESS_KEY_SECRET,
        async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Invalid token'})

            req.user = {
                firstName: decoded.userData.firstName,
                lastName: decoded.userData.lastName,
                id: decoded.userData.id,
                profilePicture: decoded.userData.profilePicture
            }
            next();
        }
    )
}

module.exports = {
    verifyUser
}