async function runner(cb, options = {}) {
  const { every, params, timeout } = options

  if (!Number.parseInt(every)) { throw Error('every is not set') }

  setInterval(async() => {
    try {
      await timeoutWrapper(cb, { params, timeout })
    } catch (err) {
      console.error(err)
    }
  }, every)
}

function timeoutWrapper(cb, options = {}) {
  const { params, timeout = 0 } = options

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async(resolve, reject) => {
    setTimeout(() => {
      reject(`Reached timeout ${timeout}ms before callback finishes`)
    }, timeout)

    const result = await cb(params)

    resolve(result)
  })
}

module.exports = runner
module.exports.timeoutWrapper = timeoutWrapper
