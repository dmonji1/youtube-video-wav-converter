const express = require('express')
const audioRouter = require('./routes/audioRoutes')

const app = express()
app.use(express.json())
app.use('/api', audioRouter)

module.exports = app