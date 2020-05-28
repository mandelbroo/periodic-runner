const runner = require('./index')

describe('periodic runner', () => {
  it('runs fine for 10 rounds', done => {
    const INTERVAL = 50
    const counter = Date.now()
    const intervals = []

    const cb = jest.fn()
      .mockImplementation(() => intervals.push(Date.now() - counter))

    runner(cb, { every: INTERVAL })

    setTimeout(() => {
      expect(cb).toBeCalled()

      let prev = null

      intervals.forEach((interval, ix) => {
        const maximumExpected = (ix + 1) * INTERVAL
        expect(interval).toBeGreaterThanOrEqual(maximumExpected)
        if (prev) {
          expect(interval - prev).toBeGreaterThanOrEqual(INTERVAL - 1)
        }
        prev = interval
      })
      done()
    }, 550)
  })

  it('timeoutWrapper in time', async() => {
    const cb = jest.fn()
    await runner.timeoutWrapper(cb)
    expect(cb).toBeCalled()
  })

  it('timeoutWrapper reached timeout', () => {
    const cb = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve, 100))
    )
    expect(runner.timeoutWrapper(cb, { timeout: 50 }))
      .rejects.toEqual('Reached timeout 50ms before callback finishes')
    expect(cb).toBeCalled()
  })
})
