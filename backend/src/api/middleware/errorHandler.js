const { logger } = require("../../utils/logger")

const errorHandler = (err, req, res, next) => {
    const status = err.status || 500
    const message = err instanceof Error ? err.message : 'Internal server error'
    logger.error(message, { requestId: req.requestId, stack: err.stack, status })
    res.status(status).json({
        error: status < 500 ? message : 'Internal server error',
        requestId: req.requestId
    })
}

module.exports = errorHandler