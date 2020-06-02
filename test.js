const Runner = require('./index')

describe('periodic runner', () => {
  it('throws error when interval is not set', () => {
    const cb = jest.fn()
    const runner = new Runner(cb)
    expect(() => runner.run()).toThrowError(('interval is not set'))
    expect(cb).not.toBeCalled()
  })

  it('runs fine for 10 rounds', async() => {
    const INTERVAL = 10
    const ROUNDS = 10
    let runner = null
    let cb = null

    let counter = 0
    await new Promise(resolve => {
      cb = jest.fn().mockImplementation(() => new Promise(resolveCb => {
        setTimeout(resolveCb, INTERVAL)
        counter += 1
        if (counter >= ROUNDS) {
          runner.stop()
          resolve()
        }
      }))

      runner = new Runner(cb, { interval: INTERVAL })
      runner.run()
    })

    expect(cb).toHaveBeenCalledTimes(10)

    await wait(20)
    expect(runner.logs.length).toBe(10)
    runner.logs.forEach(run => {
      const { executionTime } = run
      expect(executionTime).toBeGreaterThanOrEqual(INTERVAL - 1)
    })
  })

  it('recover after timeout', async() => {
    const INTERVAL = 10
    const TIMEOUT = 20
    let counter = 0
    let runner = null
    let cb = null

    await new Promise(resolve => {
      cb = jest.fn().mockImplementation(() => new Promise(resolveCb => {
        setTimeout(resolveCb, counter === 0 ? INTERVAL * 2 : INTERVAL)
        counter += 1
        if (counter >= 2) {
          runner.stop()
          resolve()
        }
      }))

      runner = new Runner(cb, { interval: INTERVAL, timeout: TIMEOUT })
      runner.run()
    })

    expect(cb).toHaveBeenCalledTimes(2)

    await wait(20)
    expect(runner.logs.length).toBe(2)
    expect(runner.logs.find(l => l.error).error)
      .toBe(`Reached timeout ${TIMEOUT}ms before callback finishes`)
  })

  it('passes parameters to callback', async() => {
    let runner = null
    const cb = jest.fn().mockImplementation(params => {
      expect(params.test).toBe(true)
      runner.stop()
    })

    runner = new Runner(cb, { interval: 0 })
    runner.run({ test: true })

    await wait(10)

    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('timeoutWrapper in time', async() => {
    const cb = jest.fn()
    await Runner.timeoutWrapper(cb)
    expect(cb).toBeCalled()
  })

  it('timeoutWrapper reached timeout', async() => {
    const cb = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve, 100))
    )
    const res = await Runner.timeoutWrapper(cb, { timeout: 50 })
    expect(res).toMatchObject({
      error: 'Reached timeout 50ms before callback finishes'
    })
    expect(cb).toBeCalled()
  })
})

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
