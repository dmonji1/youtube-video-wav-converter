const { spawn } = require('child_process')
const { download } = require('../../services/downloadService')

jest.mock('child_process')
jest.mock('../../utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}))
jest.mock('../../services/ffmpegService', () => ({
    ffmpegTrim: jest.fn().mockResolvedValue('/tmp/trimmed.wav')
}))

const { ffmpegTrim } = require('../../services/ffmpegService')

const mockProcess = (exitCode = 0, errorEvent = null) => {
    const listeners = {}
    const process = {
        on: jest.fn((event, cb) => {
            listeners[event] = cb
            return process
        })
    }
    setImmediate(() => {
        if (errorEvent) listeners['error']?.(errorEvent)
        else listeners['close']?.(exitCode)
    })
    return process
}

const jobData = { url: 'https://youtube.com/watch?v=test', start: '00:00:10', end: '00:00:20', requestId: 'test-id' }

describe('downloadService', () => {
    beforeEach(() => jest.clearAllMocks())

    test('resolves with trimmed filepath on success', async () => {
        spawn.mockReturnValue(mockProcess(0))
        const result = await download(jobData)
        expect(result).toBe('/tmp/trimmed.wav')
    })

    test('calls ffmpegTrim with correct arguments', async () => {
        spawn.mockReturnValue(mockProcess(0))
        await download(jobData)
        expect(ffmpegTrim).toHaveBeenCalledWith(
            expect.stringContaining('/tmp/audio-'),
            '00:00:10',
            '00:00:20',
            'test-id'
        )
    })

    test('calls yt-dlp with correct arguments', async () => {
        spawn.mockReturnValue(mockProcess(0))
        await download(jobData)
        expect(spawn).toHaveBeenCalledWith('yt-dlp', expect.arrayContaining([
            '-x', '--audio-format', 'wav', jobData.url
        ]))
    })

    test('rejects when yt-dlp exits with non-zero code', async () => {
        spawn.mockReturnValue(mockProcess(1))
        await expect(download(jobData)).rejects.toThrow('Download failed')
    })

    test('rejects when yt-dlp fails to start', async () => {
        spawn.mockReturnValue(mockProcess(0, new Error('spawn ENOENT')))
        await expect(download(jobData)).rejects.toThrow('Failed to start yt-dlp: spawn ENOENT')
    })

    test('rejects when ffmpegTrim fails', async () => {
        spawn.mockReturnValue(mockProcess(0))
        ffmpegTrim.mockRejectedValueOnce(new Error('Trim failed'))
        await expect(download(jobData)).rejects.toThrow('Trim failed')
    })
})
