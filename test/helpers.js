const fs = require('node:fs')
const path = require('node:path')

/**
 * Reads a fixture file from the test/data directory
 * @param {string} name - The name of the fixture file
 * @returns {string} - The content of the fixture file
 */
function readFixture (name) {
  return fs.readFileSync(path.join(__dirname, '..', 'test', 'data', name), 'utf8')
}

/**
 * Executes a function with console methods muted to avoid cluttering test output
 * @param {Function} fn - The function to execute
 * @returns {Promise<any>|any} - The result of the function
 */
async function withMutedConsole (fn) {
  const orig = { error: console.error, warn: console.warn, log: console.log }
  try {
    console.error = () => {}
    console.warn = () => {}
    console.log = () => {}
    return await fn()
  } finally {
    console.error = orig.error
    console.warn = orig.warn
    console.log = orig.log
  }
}

module.exports = { readFixture, withMutedConsole }
