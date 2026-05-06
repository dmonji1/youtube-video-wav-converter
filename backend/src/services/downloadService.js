const { spawn } = require('child_process')
const path = require('path')
const os = require('os')
const { logger } = require('../utils/logger')
const { ffmpegTrim } = require('./ffmpegService')

exports.download = ({ url, start, end, requestId }) => {
    return new Promise((resolve, reject) => {
        const filename = `audio-${Date.now()}.wav`
        const filepath = path.join(os.tmpdir(), filename)
        const startTime = Date.now()

        logger.info('starting yt-dlp download', { requestId, url, filepath })

        const ytdlp = spawn('yt-dlp', ['-x', '--audio-format', 'wav', '-o', filepath, url])

        ytdlp.on('error', (err) => {
            logger.error('yt-dlp process failed to start', { requestId, error: err.message, stack: err.stack })
            reject(new Error('Failed to start yt-dlp: ' + err.message))
        })

        ytdlp.on('close', (code) => {
            if (code !== 0) {
                logger.error('yt-dlp exited with non-zero code', { requestId, code, durationMs: Date.now() - startTime })
                return reject(new Error('Download failed'))
            }
            logger.info('yt-dlp download complete', { requestId, filepath, durationMs: Date.now() - startTime })
            ffmpegTrim(filepath, start, end, requestId).then(resolve).catch(reject)
        })
    })
}
