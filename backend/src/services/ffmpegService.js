const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

exports.ffmpegTrim = (filepath, start, end) => {
    return new Promise((resolve, reject) => {
        const trimmedFilename = `trimmed-${Date.now()}.wav`
        const trimmedFilepath = path.join(os.tmpdir(), trimmedFilename)

        const ffmpeg = spawn('ffmpeg', ['-ss', start, '-i', filepath, '-to', end, '-c', 'copy', trimmedFilepath])

        ffmpeg.on('error', (err) => {
            fs.unlink(filepath, () => {})
            reject(new Error('Failed to start ffmpeg: ' + err.message))
        })

        ffmpeg.on('close', (code) => {
            fs.unlink(filepath, () => {})
            if (code !== 0) return reject(new Error('Trim failed'))
            resolve(trimmedFilepath)
        })
    })
}
