const {Worker} = require('bullmq')
const {download} = require('../services/downloadService')
const {createRedisConnection} = require('../config/redis')
const {logger} = require('../utils/logger')

const worker = new Worker('audio-processing', async (job) => {
    const { url, start, end, requestId } = job.data
    
    const trimmedFilepath = await download({ url, start, end, requestId })
    return trimmedFilepath

}, {
    connection: createRedisConnection(),
    concurrency: 2
})

worker.on('completed', (job) => {
    logger.info('job completed', { jobId: job.id, requestId: job.data.requestId })
})

worker.on('failed', (job, err) => {
    logger.error('job failed', { jobId: job.id, requestId: job.data.requestId, error: err.message, stack: err.stack })
})

process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing worker')
    await worker.close()
    logger.info('worker closed')
})