const audioRouter = require('express').Router()
const audioController = require('../controllers/audioController')

audioRouter.post('/audio', audioController.getAudio)
audioRouter.get('/audio/:jobId/status', audioController.getJobStatus)
audioRouter.get('/audio/:jobId/download', audioController.getDownload)

module.exports = audioRouter