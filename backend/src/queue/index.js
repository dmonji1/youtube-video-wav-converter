const {Queue} = require('bullmq')
const {createRedisConnection} = require('../config/redis')
const { logger } = require('../utils/logger')

const audioQueue = new Queue('audio-processing', {
    connection: createRedisConnection()
})

const addJob = async (jobDetails) => {
    const job = await audioQueue.add('convert', jobDetails)
    logger.info('job added to queue', { requestId: jobDetails.requestId, jobId: job.id })
    return job
}

module.exports = { addJob, audioQueue }