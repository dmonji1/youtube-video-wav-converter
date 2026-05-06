const audioRouter = require('express').Router()
const audioController = require('../controllers/audioController')
const rateLimiterMiddleware = require('../middleware/rateLimiter')

audioRouter.post('/audio', rateLimiterMiddleware, audioController.getAudio)
audioRouter.get('/audio/:jobId/status', audioController.getJobStatus)
audioRouter.get('/audio/:jobId/download', audioController.getDownload)

module.exports = audioRouter