const fs = require('fs')
const downloadService = require('../../services/downloadService')

exports.getAudio = async (req, res) => {
    const { url, start, end } = req.body

    if (!url) return res.status(400).send('Missing URL')

    try {
        const trimmedFilepath = await downloadService.download({ url, start, end })
        res.download(trimmedFilepath, (err) => {
            fs.unlink(trimmedFilepath, () => {})
            if (err && !res.headersSent) res.status(500).send('Download failed')
        })
    } catch (err) {
        res.status(500).send(err.message)
    }
}
