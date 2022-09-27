const express = require('express')
const mongoose = require('mongoose')
const app = express()
require('dotenv').config()
const multer = require('multer')
const cookieParser = require('cookie-parser')
const cors = require('cors')

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))

// Database config
mongoose.connect(process.env.MONGO_URI)
    .then(conn => console.log(`MongoDB connected: ${conn.connection.host}`))
    .catch(err => {
        console.log(err)
        process.exit(1)
    })

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/goals', require('./routes/goals'))
app.use('/api/milestones', require('./routes/milestones'))
app.use('/api/logs', require('./routes/logs'))
// app.use('/api/products', require('./routes/product'))

// Server listening
app.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}`)
})