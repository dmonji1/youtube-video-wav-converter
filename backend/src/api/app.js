const express = require('express')
const helmet = require('helmet')
const morgan = require('morgan')
const audioRouter = require('./routes/audioRoutes')
const { stream } = require('../utils/logger')
const requestIdMiddleware = require('./middleware/requestIdMiddleware')
const errorHandler = require('./middleware/errorHandler')

const app = express()
app.use(helmet())
app.use(requestIdMiddleware)
app.use(morgan('combined', { stream }))

app.use(express.json())
app.get('/health', (req, res) => res.sendStatus(200))
app.use('/api', audioRouter)
app.use(errorHandler)

module.exports = app