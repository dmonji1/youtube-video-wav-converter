const audioRouter = require('express').Router()
const audioController = require('../controllers/audioController')

audioRouter.post('/audio', audioController.getAudio)

module.exports = audioRouter