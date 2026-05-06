const Redis = require('ioredis')
const config = require('../api/config')

const createRedisConnection = () => {
    return new Redis(config.REDIS_URL, { maxRetriesPerRequest: null })
}

module.exports = { createRedisConnection }