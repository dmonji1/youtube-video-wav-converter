const fs = require('fs')
const { logger } = require('../../utils/logger')
const downloadService = require('../../services/downloadService')

exports.getAudio = async (req, res, next) => {
    const { url, start, end } = req.body
    const { requestId } = req

    if (!url) return res.status(400).send('Missing URL')

    logger.info('audio request received', { requestId, url, start, end })

    try {
        const trimmedFilepath = await downloadService.download({ url, start, end, requestId })
        logger.info('sending file to client', { requestId, trimmedFilepath })
        res.download(trimmedFilepath, (err) => {
            fs.unlink(trimmedFilepath, (unlinkErr) => {
                if (unlinkErr) logger.warn('failed to clean up temp file', { requestId, trimmedFilepath, error: unlinkErr.message })
                else logger.info('temp file cleaned up', { requestId, trimmedFilepath })
            })
            if (err && !res.headersSent) next(err)
        })
    } catch (err) {
        next(err)
    }
}
