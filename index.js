const EventEmitter = require('events')

class Runner extends EventEmitter {
  constructor(callback, opts = {}) {
    super()
    this.callback = callback
    this.interval = opts.interval
    this.timeout = opts.timeout || 0
    this.logs = []
  }

  run(params) {
    this.validate()

    const opts = { params, timeout: this.timeout }

    const cb = async() => {
      const res = await timeoutWrapper(this.callback, opts)
      this.logs.push(res)
    }

    const descriptor = setInterval(cb, this.interval)

    const stop = () => clearInterval(descriptor)

    this.on('stop', stop)
    process.on('SIGINT', stop)
    process.on('SIGUSR1', stop)
    process.on('SIGUSR2', stop)
    process.on('SIGTERM', stop)
  }

  validate() {
    const interval = Number.parseInt(this.interval)
    if (interval !== 0 && !interval) { throw Error('interval is not set') }
  }

  stop() {
    this.emit('stop')
  }
}

function timeoutWrapper(cb, opts = {}) {
  const { params, timeout } = opts

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async resolve => {
    const startedAt = Date.now()
    if (timeout) {
      setTimeout(() => {
        resolve({
          error: `Reached timeout ${timeout}ms before callback finishes`,
          executionTime: Date.now() - startedAt
        })
      }, timeout)
    }

    const result = await cb(params)

    resolve({
      success: true,
      executionTime: Date.now() - startedAt,
      result,
    })
  })
}

module.exports = Runner
module.exports.timeoutWrapper = timeoutWrapper
