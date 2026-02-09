const https = require('https')
const http = require('http')
const { URL } = require('url')

function request (url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const protocol = parsedUrl.protocol === 'https:' ? https : http

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...options.headers
    }

    const requestOptions = {
      method: options.method || 'GET',
      headers,
      timeout: 30000,
      ...options
    }

    const req = protocol.request(url, requestOptions, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).href
        const maxRedirects = options.maxRedirects || 5
        if (maxRedirects > 0) {
          return request(redirectUrl, { ...options, maxRedirects: maxRedirects - 1 })
            .then(resolve)
            .catch(reject)
        } else {
          return reject(new Error('Too many redirects'))
        }
      }

      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            data,
            status: res.statusCode,
            headers: res.headers
          })
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}`))
        }
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timed out'))
    })

    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

module.exports = { request }
