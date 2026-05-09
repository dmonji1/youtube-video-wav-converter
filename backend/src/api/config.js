require('dotenv').config()

let PORT = process.env.PORT
let NODE_ENV = process.env.NODE_ENV
let REDIS_URL = process.env.REDIS_URL
let AWS_S3_BUCKET = process.env.AWS_S3_BUCKET
let AWS_REGION = process.env.AWS_REGION
let S3_ENDPOINT = process.env.S3_ENDPOINT
let AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
let AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY

module.exports = { PORT, NODE_ENV, REDIS_URL, AWS_S3_BUCKET, AWS_REGION, S3_ENDPOINT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY }