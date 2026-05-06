const { RateLimiterRedis } = require('rate-limiter-flexible')
const { createRedisConnection } = require('../../config/redis')
const { logger } = require('../../utils/logger')

const rateLimiter = new RateLimiterRedis({
    storeClient: createRedisConnection(),
    keyPrefix: 'rate_limit',
    points: 10,
    duration: 900,
})

const rateLimiterMiddleware = (req, res, next) => {
    rateLimiter.consume(req.ip)
        .then((rateLimiterRes) => {
            res.set('X-RateLimit-Limit', 10)
            res.set('X-RateLimit-Remaining', rateLimiterRes.remainingPoints)
            next()
        })
        .catch((err) => {
            if (err instanceof Error) {
                logger.error('rate limiter redis error, failing open', { error: err.message })
                return next()
            }
            logger.warn('rate limit exceeded', { ip: req.ip, requestId: req.requestId })
            res.status(429).json({ error: 'Too Many Requests', requestId: req.requestId })
        })
}

module.exports = rateLimiterMiddleware
