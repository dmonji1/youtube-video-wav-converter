const { spawn } = require('child_process')
const fs = require('fs')
const { ffmpegTrim } = require('../../services/ffmpegService')

jest.mock('child_process')
jest.mock('fs')
jest.mock('../../utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}))

const mockProcess = (exitCode = 0, errorEvent = null) => {
    const listeners = {}
    const proc = {
        on: jest.fn((event, cb) => {
            listeners[event] = cb
            return proc
        })
    }
    setImmediate(() => {
        if (errorEvent) listeners['error']?.(errorEvent)
        else listeners['close']?.(exitCode)
    })
    return proc
}

describe('ffmpegService', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        fs.unlink.mockImplementation((p, cb) => cb && cb(null))
    })

    test('resolves with trimmed filepath on success', async () => {
        spawn.mockReturnValue(mockProcess(0))
        const result = await ffmpegTrim('/tmp/audio.wav', '00:00:10', '00:00:20', 'req-1')
        expect(result).toMatch(/\/tmp\/trimmed-\d+\.wav/)
    })

    test('calls ffmpeg with correct arguments', async () => {
        spawn.mockReturnValue(mockProcess(0))
        await ffmpegTrim('/tmp/audio.wav', '00:00:10', '00:00:20', 'req-1')
        expect(spawn).toHaveBeenCalledWith('ffmpeg', expect.arrayContaining([
            '-ss', '00:00:10', '-to', '00:00:20', '-i', '/tmp/audio.wav'
        ]))
    })

    test('deletes source file on success', async () => {
        spawn.mockReturnValue(mockProcess(0))
        await ffmpegTrim('/tmp/audio.wav', '00:00:10', '00:00:20', 'req-1')
        expect(fs.unlink).toHaveBeenCalledWith('/tmp/audio.wav', expect.any(Function))
    })

    test('rejects when ffmpeg exits with non-zero code', async () => {
        spawn.mockReturnValue(mockProcess(1))
        await expect(ffmpegTrim('/tmp/audio.wav', '00:00:10', '00:00:20', 'req-1'))
            .rejects.toThrow('Trim failed')
    })

    test('deletes source file on non-zero exit', async () => {
        spawn.mockReturnValue(mockProcess(1))
        await ffmpegTrim('/tmp/audio.wav', '00:00:10', '00:00:20', 'req-1').catch(() => {})
        expect(fs.unlink).toHaveBeenCalledWith('/tmp/audio.wav', expect.any(Function))
    })

    test('rejects when ffmpeg fails to start', async () => {
        spawn.mockReturnValue(mockProcess(0, new Error('spawn ENOENT')))
        await expect(ffmpegTrim('/tmp/audio.wav', '00:00:10', '00:00:20', 'req-1'))
            .rejects.toThrow('Failed to start ffmpeg: spawn ENOENT')
    })

    test('deletes source file when ffmpeg fails to start', async () => {
        spawn.mockReturnValue(mockProcess(0, new Error('spawn ENOENT')))
        await ffmpegTrim('/tmp/audio.wav', '00:00:10', '00:00:20', 'req-1').catch(() => {})
        expect(fs.unlink).toHaveBeenCalledWith('/tmp/audio.wav', expect.any(Function))
    })
})
