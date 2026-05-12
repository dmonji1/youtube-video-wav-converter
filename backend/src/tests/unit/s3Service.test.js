const fs = require('fs')

jest.mock('@aws-sdk/client-s3')
jest.mock('@aws-sdk/s3-request-presigner')
jest.mock('fs')
jest.mock('../../utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}))
jest.mock('../../api/config', () => ({
    AWS_REGION: 'us-east-1',
    S3_ENDPOINT: 'http://localhost:9000',
    AWS_ACCESS_KEY_ID: 'test-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret',
    AWS_S3_BUCKET: 'test-bucket'
}))

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const mockSend = jest.fn()
S3Client.mockImplementation(() => ({ send: mockSend }))

const { uploadToS3, getPresignedUrl } = require('../../services/s3Service')

describe('s3Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        fs.createReadStream.mockReturnValue('stream')
        fs.unlink.mockImplementation((p, cb) => cb && cb(null))
    })

    describe('uploadToS3', () => {
        test('sends PutObjectCommand with correct params', async () => {
            mockSend.mockResolvedValue({})
            await uploadToS3('/tmp/trimmed-123.wav', 'req-1')
            expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand))
        })

        test('returns the S3 key (basename of filepath)', async () => {
            mockSend.mockResolvedValue({})
            const key = await uploadToS3('/tmp/trimmed-123.wav', 'req-1')
            expect(key).toBe('trimmed-123.wav')
        })

        test('deletes temp file after upload', async () => {
            mockSend.mockResolvedValue({})
            await uploadToS3('/tmp/trimmed-123.wav', 'req-1')
            expect(fs.unlink).toHaveBeenCalledWith('/tmp/trimmed-123.wav', expect.any(Function))
        })

        test('rejects when S3 send fails', async () => {
            mockSend.mockRejectedValue(new Error('S3 unavailable'))
            await expect(uploadToS3('/tmp/trimmed-123.wav', 'req-1'))
                .rejects.toThrow('S3 unavailable')
        })
    })

    describe('getPresignedUrl', () => {
        test('returns presigned URL', async () => {
            getSignedUrl.mockResolvedValue('https://s3.example.com/trimmed-123.wav?sig=abc')
            const url = await getPresignedUrl('trimmed-123.wav', 'req-1')
            expect(url).toBe('https://s3.example.com/trimmed-123.wav?sig=abc')
        })

        test('calls getSignedUrl with GetObjectCommand', async () => {
            getSignedUrl.mockResolvedValue('https://s3.example.com/file?sig=x')
            await getPresignedUrl('trimmed-123.wav', 'req-1')
            expect(getSignedUrl).toHaveBeenCalledWith(
                expect.anything(),
                expect.any(GetObjectCommand),
                { expiresIn: 900 }
            )
        })

        test('rejects when getSignedUrl fails', async () => {
            getSignedUrl.mockRejectedValue(new Error('Signing failed'))
            await expect(getPresignedUrl('trimmed-123.wav', 'req-1'))
                .rejects.toThrow('Signing failed')
        })
    })
})
