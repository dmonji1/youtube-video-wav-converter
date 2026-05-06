require('dotenv').config()

let PORT = process.env.PORT
let NODE_ENV = process.env.NODE_ENV

module.exports = {PORT, NODE_ENV}