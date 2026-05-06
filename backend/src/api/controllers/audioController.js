const { Job } = require('bullmq')
const { logger } = require('../../utils/logger')
const { addJob, audioQueue } = require('../../queue')

const timeFormat = /^\d{2}:\d{2}:\d{2}$/

exports.getAudio = async (req, res, next) => {
    const { url, start, end } = req.body
    const { requestId } = req

    if (!url) return res.status(400).json({ error: 'Missing URL' })
    if (!timeFormat.test(start) || !timeFormat.test(end)) {
        return res.status(400).json({ error: 'start and end must be in HH:MM:SS format' })
    }

    logger.info('audio request received', { requestId, url, start, end })

    try {
        const job = await addJob({ url, start, end, requestId })
        res.status(202).json({ jobId: job.id })
    } catch (err) {
        next(err)
    }
}

exports.getJobStatus = async (req, res, next) => {
    const { jobId } = req.params
    try {
        const job = await Job.fromId(audioQueue, jobId)
        if (!job) return res.status(404).json({ error: 'Job not found' })
        const state = await job.getState()
        logger.info('job status requested', { jobId, state })
        res.json({ state })
    } catch (err) {
        next(err)
    }
}

exports.getDownload = async (req, res, next) => {
    const { jobId } = req.params
    try {
        const job = await Job.fromId(audioQueue, jobId)
        if (!job) return res.status(404).json({ error: 'Job not found' })
        const state = await job.getState()
        if (state !== 'completed') {
            return res.status(409).json({ error: `Job is not completed, current state: ${state}` })
        }
        logger.info('job download requested', { jobId })
        res.json({ filepath: job.returnvalue })
    } catch (err) {
        next(err)
    }
}
