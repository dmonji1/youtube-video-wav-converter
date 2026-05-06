require('dotenv').config()

let PORT = process.env.PORT
let NODE_ENV = process.env.NODE_ENV
let REDIS_URL = process.env.REDIS_URL

module.exports = {PORT, NODE_ENV, REDIS_URL}