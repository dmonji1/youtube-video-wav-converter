const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { logger } = require('../utils/logger')

exports.ffmpegTrim = (filepath, start, end, requestId) => {
    return new Promise((resolve, reject) => {
        const trimmedFilename = `trimmed-${Date.now()}.wav`
        const trimmedFilepath = path.join(os.tmpdir(), trimmedFilename)
        const startTime = Date.now()

        logger.info('starting ffmpeg trim', { requestId, filepath, start, end, trimmedFilepath })

        const ffmpeg = spawn('ffmpeg', ['-ss', start, '-to', end, '-i', filepath, trimmedFilepath])

        ffmpeg.on('error', (err) => {
            logger.error('ffmpeg process failed to start', { requestId, error: err.message, stack: err.stack })
            fs.unlink(filepath, () => {})
            reject(new Error('Failed to start ffmpeg: ' + err.message))
        })

        ffmpeg.on('close', (code) => {
            fs.unlink(filepath, () => {})
            if (code !== 0) {
                logger.error('ffmpeg exited with non-zero code', { requestId, code, durationMs: Date.now() - startTime })
                return reject(new Error('Trim failed'))
            }
            logger.info('ffmpeg trim complete', { requestId, trimmedFilepath, durationMs: Date.now() - startTime })
            resolve(trimmedFilepath)
        })
    })
}
