const winston = require('winston')
const { combine, timestamp, json, colorize, simple} = winston.format;
const config = require('../api/config')

const logger = winston.createLogger({
    level: 'info',
    format: combine(timestamp(), json()), // Combine timestamp and JSON format
    transports: [
        config.NODE_ENV === 'production'
          ? new winston.transports.Console({ format:      
  combine(timestamp(), json()) })                         
          : new winston.transports.Console({ format:
  combine(colorize({ all: true }), simple()) })
    ]
})

const stream = { write: (message) => logger.http(message.trim()) }

module.exports = { logger, stream }