const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const fs = require('fs')
const path = require('path')
const config = require('../api/config')
const { logger } = require('../utils/logger')

const s3 = new S3Client({
    region: config.AWS_REGION,
    endpoint: config.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    }
})

const uploadToS3 = async (filepath, requestId) => {
    const key = path.basename(filepath)

    logger.info('uploading file to S3', { requestId, key })

    await s3.send(new PutObjectCommand({
        Bucket: config.AWS_S3_BUCKET,
        Key: key,
        Body: fs.createReadStream(filepath),
        ContentType: 'audio/wav'
    }))

    fs.unlink(filepath, (err) => {
        if (err) logger.warn('failed to delete temp file after S3 upload', { requestId, filepath, error: err.message })
        else logger.info('temp file deleted after S3 upload', { requestId, filepath })
    })

    logger.info('file uploaded to S3', { requestId, key })
    return key
}

const getPresignedUrl = async (key, requestId) => {
    logger.info('generating presigned URL', { requestId, key })

    const url = await getSignedUrl(s3, new GetObjectCommand({
        Bucket: config.AWS_S3_BUCKET,
        Key: key,
    }), { expiresIn: 900 })

    logger.info('presigned URL generated', { requestId, key })
    return url
}

module.exports = { uploadToS3, getPresignedUrl }
