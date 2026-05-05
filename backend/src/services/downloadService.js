const { spawn } = require('child_process')
const path = require('path')
const os = require('os')
const { ffmpegTrim } = require('./ffmpegService')

exports.download = ({ url, start, end }) => {
    return new Promise((resolve, reject) => {
        const filename = `audio-${Date.now()}.wav`
        const filepath = path.join(os.tmpdir(), filename)

        const ytdlp = spawn('yt-dlp', ['-x', '--audio-format', 'wav', '-o', filepath, url])

        ytdlp.on('error', (err) => {
            reject(new Error('Failed to start yt-dlp: ' + err.message))
        })

        ytdlp.on('close', (code) => {
            if (code !== 0) return reject(new Error('Download failed'))
            ffmpegTrim(filepath, start, end).then(resolve).catch(reject)
        })
    })
}
