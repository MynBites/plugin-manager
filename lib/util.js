import { pathToFileURL } from 'url'
import { join } from 'path'
import os from 'os'

export const defaultFilter = filename => /\.[cm]?js/i.test(filename)

export async function importFile(file) {
  const module = await import(`${pathToFileURL(file)}?id=${Date.now()}`)
  return module?.default || module
}
/**
 * `'/home/games-wabot/plugins/games/tebakgambar.js'` formated to `'plugins/games/tebakgambar.js'`
 * @param {string} filename
 * @returns {string}
 */
export function formatFilename(rootDirectory, filename) {
  let dir = join(rootDirectory, './')
  // fix invalid regular expresion when run in windows
  if (os.platform() === 'win32') dir = dir.replace(/\\/g, '\\\\')
  // '^' mean only replace if starts with
  const regex = new RegExp(`^${dir}`)
  const formated = filename.replace(regex, '')
  return formated
}
