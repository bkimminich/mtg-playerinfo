/**
 * Extracts social media handle from a URL
 * @param {string} url - The full social media URL
 * @returns {string|null} - The handle (without the URL), or null if extraction fails
 */
function extractHandle (url) {
  if (!url) {
    return null
  }

  try {
    const urlObj = new URL(url)
    let handle = urlObj.pathname.split('/').filter(Boolean).pop()
    if (handle) {
      handle = decodeURIComponent(handle)
      return handle
    }
  } catch (e) {
    console.log('Invalid URL in social link ' + url + ': ' + e.message)
  }

  return null
}

/**
 * Extracts platform name from a URL hostname
 * @param {string} url - The full social media URL
 * @returns {string|null} - The platform name (e.g., 'twitter', 'youtube'), or null if extraction fails
 */
function getPlatformName (url) {
  if (!url) {
    return null
  }

  try {
    const urlObj = new URL(url)
    const platform = urlObj.hostname.replace('www.', '').split('.')[0]
    return platform.charAt(0).toLowerCase() + platform.slice(1)
  } catch (e) {
    console.log('Invalid URL: ' + url + ': ' + e.message)
  }

  return null
}

module.exports = {
  extractHandle,
  getPlatformName
}

