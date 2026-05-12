const request = require('supertest')
const app = require('../../api/app')

jest.mock('../../queue', () => ({
    addJob: jest.fn(),
    audioQueue: {}
}))
jest.mock('bullmq', () => ({
    Job: { fromId: jest.fn() }
}))
jest.mock('../../services/s3Service', () => ({
    getPresignedUrl: jest.fn()
}))
jest.mock('../../utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), http: jest.fn() },
    stream: { write: jest.fn() }
}))
jest.mock('../../api/middleware/rateLimiter', () => (req, res, next) => next())

const { addJob } = require('../../queue')
const { Job } = require('bullmq')
const { getPresignedUrl } = require('../../services/s3Service')

const validBody = { url: 'https://youtube.com/watch?v=test', start: '00:00:10', end: '00:00:20' }

describe('POST /api/audio', () => {
    beforeEach(() => jest.clearAllMocks())

    test('returns 202 with jobId on valid input', async () => {
        addJob.mockResolvedValue({ id: 'job-123' })
        const res = await request(app).post('/api/audio').send(validBody)
        expect(res.status).toBe(202)
        expect(res.body).toEqual({ jobId: 'job-123' })
    })

    test('returns 400 when url is missing', async () => {
        const res = await request(app).post('/api/audio').send({ start: '00:00:10', end: '00:00:20' })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error')
    })

    test('returns 400 when start is not HH:MM:SS', async () => {
        const res = await request(app).post('/api/audio').send({ ...validBody, start: '10' })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error')
    })

    test('returns 400 when end is not HH:MM:SS', async () => {
        const res = await request(app).post('/api/audio').send({ ...validBody, end: 'bad' })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error')
    })

    test('passes error to error handler when addJob throws', async () => {
        addJob.mockRejectedValue(new Error('Redis down'))
        const res = await request(app).post('/api/audio').send(validBody)
        expect(res.status).toBe(500)
    })
})

describe('GET /api/audio/:jobId/status', () => {
    beforeEach(() => jest.clearAllMocks())

    test('returns job state', async () => {
        Job.fromId.mockResolvedValue({ getState: jest.fn().mockResolvedValue('active') })
        const res = await request(app).get('/api/audio/job-123/status')
        expect(res.status).toBe(200)
        expect(res.body).toEqual({ state: 'active' })
    })

    test('returns 404 when job does not exist', async () => {
        Job.fromId.mockResolvedValue(null)
        const res = await request(app).get('/api/audio/missing/status')
        expect(res.status).toBe(404)
        expect(res.body).toHaveProperty('error')
    })

    test('passes error to error handler when fromId throws', async () => {
        Job.fromId.mockRejectedValue(new Error('Redis down'))
        const res = await request(app).get('/api/audio/job-123/status')
        expect(res.status).toBe(500)
    })
})

describe('GET /api/audio/:jobId/download', () => {
    beforeEach(() => jest.clearAllMocks())

    test('redirects to presigned URL when job is completed', async () => {
        Job.fromId.mockResolvedValue({
            getState: jest.fn().mockResolvedValue('completed'),
            returnvalue: 'trimmed-123.wav'
        })
        getPresignedUrl.mockResolvedValue('https://s3.example.com/trimmed-123.wav?sig=abc')
        const res = await request(app).get('/api/audio/job-123/download')
        expect(res.status).toBe(302)
        expect(res.headers.location).toBe('https://s3.example.com/trimmed-123.wav?sig=abc')
    })

    test('returns 404 when job does not exist', async () => {
        Job.fromId.mockResolvedValue(null)
        const res = await request(app).get('/api/audio/missing/download')
        expect(res.status).toBe(404)
    })

    test('returns 409 when job is not completed', async () => {
        Job.fromId.mockResolvedValue({ getState: jest.fn().mockResolvedValue('active') })
        const res = await request(app).get('/api/audio/job-123/download')
        expect(res.status).toBe(409)
        expect(res.body).toHaveProperty('error')
    })

    test('passes error to error handler when getPresignedUrl throws', async () => {
        Job.fromId.mockResolvedValue({
            getState: jest.fn().mockResolvedValue('completed'),
            returnvalue: 'trimmed-123.wav'
        })
        getPresignedUrl.mockRejectedValue(new Error('S3 error'))
        const res = await request(app).get('/api/audio/job-123/download')
        expect(res.status).toBe(500)
    })
})

describe('GET /health', () => {
    test('returns 200', async () => {
        const res = await request(app).get('/health')
        expect(res.status).toBe(200)
    })
})
